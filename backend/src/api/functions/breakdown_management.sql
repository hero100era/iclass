-- ---------------------------------------------
-- Apply template to a ship (deep copy)
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION api.fn_apply_template_to_ship(
    p_ship_id         INTEGER,
    p_template_id     INTEGER,
    p_applied_by      VARCHAR DEFAULT 'system'
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_breakdown_id    INTEGER;
    v_template_name   VARCHAR;
    v_id_map          JSONB := '{}';  -- maps template_node_id → ship_breakdown_node_id
BEGIN
    -- Deactivate any existing active breakdown for this ship
    UPDATE iclass.ship_breakdowns
    SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
    WHERE ship_id = p_ship_id AND is_active = TRUE;

    -- Get template info
    SELECT name, version INTO v_template_name
    FROM iclass.breakdown_template WHERE id = p_template_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template % not found', p_template_id;
    END IF;

    -- Create ship breakdown header
    INSERT INTO iclass.ship_breakdown(
        ship_id, source_template_id,
        name, description, revision, is_active,
        applied_at, applied_by
    )
    SELECT
        p_ship_id, p_template_id,
        s.name || ' - ' || v_template_name,
        'Applied from template: ' || v_template_name || ' v' || v_template_ver,
        1, TRUE,
        CURRENT_TIMESTAMP, p_applied_by
    FROM iclass.ship s WHERE s.id = p_ship_id
    RETURNING id INTO v_breakdown_id;

    -- Deep copy nodes level by level (to maintain parent references)
    -- Level 0 (root nodes)
    WITH inserted AS (
        INSERT INTO iclass.ship_breakdown_node (
            ship_breakdown_id, parent_node_id, source_template_node_id,
            code, name, description, category, node_type,
            level, sort_order, unit_of_measure, capacity,
            is_from_template, is_modified, status, metadata
        )
        SELECT
            v_breakdown_id, NULL, tn.id,
            tn.code, tn.name, tn.description, tn.category, tn.node_type,
            tn.level, tn.sort_order, tn.unit_of_measure, tn.default_capacity,
            TRUE, FALSE, 'ACTIVE', tn.metadata
        FROM iclass.breakdown_template_node tn
        WHERE tn.template_id = p_template_id
          AND tn.parent_node_id IS NULL
        RETURNING id, source_template_node_id
    )
    SELECT jsonb_object_agg(source_template_node_id::text, id::text)
    INTO v_id_map
    FROM inserted;

    -- Iterate remaining levels (up to 10 deep)
    FOR i IN 1..10 LOOP
        WITH nodes_at_level AS (
            SELECT tn.*
            FROM iclass.breakdown_template_node tn
            WHERE tn.template_id = p_template_id
              AND tn.level = i
              AND tn.parent_node_id IS NOT NULL
        ),
        inserted AS (
            INSERT INTO iclass.ship_breakdown_node (
                ship_breakdown_id, parent_node_id, source_template_node_id,
                code, name, description, category, node_type,
                level, sort_order, unit_of_measure, capacity,
                is_from_template, is_modified, status, metadata
            )
            SELECT
                v_breakdown_id,
                (v_id_map ->> nal.parent_node_id::text)::UUID,
                nal.id,
                nal.code, nal.name, nal.description, nal.category, nal.node_type,
                nal.level, nal.sort_order, nal.unit_of_measure, nal.default_capacity,
                TRUE, FALSE, 'ACTIVE', nal.metadata
            FROM nodes_at_level nal
            WHERE v_id_map ? nal.parent_node_id::text
            RETURNING id, source_template_node_id
        )
        SELECT v_id_map || jsonb_object_agg(source_template_node_id::text, id::text)
        INTO v_id_map
        FROM inserted;

        -- If no rows inserted at this level, we're done
        EXIT WHEN NOT FOUND OR v_id_map IS NULL;
    END LOOP;

    -- Copy attributes
    INSERT INTO iclass.ship_node_particular (
        ship_breakdown_node_id, source_template_attr_id,
        attribute_key, attribute_value, data_type, unit, is_modified, sort_order
    )
    SELECT
        (v_id_map ->> tna.template_node_id::text)::UUID,
        tna.id,
        tna.attribute_key, tna.attribute_value, tna.data_type, tna.unit,
        FALSE, tna.sort_order
    FROM iclass.template_node_particular tna
    JOIN iclass.template_node tn ON tn.id = tna.template_node_id
    WHERE tn.template_id = p_template_id
      AND v_id_map ? tna.template_node_id::text;

    -- Log the action
    INSERT INTO iclass.breakdown_change_log (
        entity_type, entity_id, ship_id, action,
        new_values, changed_by
    ) VALUES (
        'SHIP_BREAKDOWN', v_breakdown_id, p_ship_id, 'APPLY_TEMPLATE',
        jsonb_build_object(
            'template_id', p_template_id,
            'template_version', v_template_ver,
            'nodes_copied', jsonb_array_length(
                COALESCE((SELECT jsonb_agg(value) FROM jsonb_each_text(v_id_map)), '[]'::jsonb)
            )
        ),
        p_applied_by
    );

    RETURN v_breakdown_id;
END;
$$;

GRANT EXECUTE ON FUNCTION api.fn_apply_template_to_ship TO employees;


CREATE OR REPLACE FUNCTION iclass.fn_add_ship_specific_node(
    p_ship_breakdown_id INTEGER,
    p_parent_node_id    INTEGER,     -- NULL for root
    p_code              VARCHAR,
    p_name              VARCHAR,
    p_category          VARCHAR,
    p_node_type         VARCHAR DEFAULT NULL,
    p_description       TEXT DEFAULT NULL,
    p_capacity          NUMERIC DEFAULT NULL,
    p_unit              VARCHAR DEFAULT NULL,
    p_metadata          JSONB DEFAULT '{}',
    p_added_by          VARCHAR DEFAULT 'system'
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_node_id INTEGER;
    v_level   INTEGER := 0;
    v_sort    INTEGER := 0;
BEGIN
    -- Determine level
    IF p_parent_node_id IS NOT NULL THEN
        SELECT level + 1 INTO v_level
        FROM ship_breakdown_nodes WHERE id = p_parent_node_id;
    END IF;

    -- Determine sort order
    SELECT COALESCE(MAX(sort_order), 0) + 10 INTO v_sort
    FROM iclass.ship_breakdown_node
    WHERE ship_breakdown_id = p_ship_breakdown_id
      AND COALESCE(parent_node_id, uuid_nil()) = COALESCE(p_parent_node_id, uuid_nil());

    INSERT INTO iclass.ship_breakdown_node (
        ship_breakdown_id, parent_node_id, source_template_node_id,
        code, name, description, category, node_type,
        level, sort_order, unit_of_measure, capacity,
        is_from_template, is_modified, status, metadata
    ) VALUES (
        p_ship_breakdown_id, p_parent_node_id, NULL,
        p_code, p_name, p_description, p_category, p_node_type,
        v_level, v_sort, p_unit, p_capacity,
        FALSE, FALSE, 'ACTIVE', p_metadata
    )
    RETURNING id INTO v_node_id;

    -- Log
    INSERT INTO iclass.breakdown_change_log (
        entity_type, entity_id, ship_id, action,
        new_values, changed_by
    )
    SELECT
        'SHIP_NODE', v_node_id, sb.ship_id, 'CREATE',
        jsonb_build_object('code', p_code, 'name', p_name, 'ship_specific', true),
        p_added_by
    FROM iclass.ship_breakdown sb WHERE sb.id = p_ship_breakdown_id;

    RETURN v_node_id;
END;
$$;
