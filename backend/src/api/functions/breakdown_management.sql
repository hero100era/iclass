-- ---------------------------------------------
-- Apply template to a ship (deep copy)
-- ---------------------------------------------
-- CREATE TABLE iclass.breakdown_change_log (
--     id              BIGSERIAL PRIMARY KEY,
--     entity_type     VARCHAR(50)  NOT NULL,     -- 'TEMPLATE_NODE', 'SHIP_NODE', 'SHIP_BREAKDOWN'
--     entity_id       INTEGER   NOT NULL,
--     ship_id         INTEGER   REFERENCES iclass.ship(id),
--     action          VARCHAR(20)  NOT NULL,     -- 'CREATE', 'UPDATE', 'DELETE', 'APPLY_TEMPLATE'

--     old_values      JSONB,
--     new_values      JSONB,
--     change_reason   TEXT,

--     changed_by      VARCHAR(100),
--     changed_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );

--
DROP FUNCTION IF EXISTS api.fn_apply_template_to_ship(INTEGER, INTEGER, VARCHAR);
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
    v_template_ver    VARCHAR;
    v_id_map          JSONB := '{}';  -- maps template_node_id → ship_breakdown_node_id
BEGIN
    -- 1. Deactivate any existing active breakdown for this ship
    UPDATE iclass.ship_breakdown
    SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
    WHERE ship_id = p_ship_id AND is_active = TRUE;

    -- 2. Get template info
    SELECT name, version INTO v_template_name, v_template_ver
    FROM iclass.breakdown_template WHERE id = p_template_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template % not found', p_template_id;
    END IF;

    -- 3. Create ship breakdown header
    INSERT INTO iclass.ship_breakdown(
        ship_id, template_id,
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

    -- 4. Deep copy nodes level by level (to maintain parent references)
    -- Level 0 (root nodes)
    WITH inserted AS (
        INSERT INTO iclass.ship_breakdown_node (
            ship_id, ship_breakdown_id, parent_node_id, template_node_id,
            code, name, description, category, node_type,
            level, sort_order,
            is_from_template, is_modified, is_active, metadata
        )
        SELECT
            p_ship_id, v_breakdown_id, NULL, tn.id,
            tn.code, tn.name, tn.description, tn.category, tn.node_type,
            tn.level, tn.sort_order,
            TRUE, FALSE, TRUE, tn.metadata
        FROM iclass.breakdown_template_node tn
        WHERE tn.template_id = p_template_id
          AND tn.parent_node_id IS NULL
        RETURNING id, template_node_id
    )
    SELECT jsonb_object_agg(template_node_id::text, id::text)
    INTO v_id_map
    FROM inserted;

    -- 5. Iterate remaining levels (up to 10 deep)
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
                ship_id, ship_breakdown_id, parent_node_id, template_node_id,
                code, name, description, category, node_type,
                level, sort_order,
                is_from_template, is_modified, is_active, metadata
            )
            SELECT
                p_ship_id, v_breakdown_id,
                (v_id_map ->> nal.parent_node_id::text)::INTEGER,
                nal.id,
                nal.code, nal.name, nal.description, nal.category, nal.node_type,
                nal.level, nal.sort_order,
                TRUE, FALSE, TRUE, nal.metadata
            FROM nodes_at_level nal
            WHERE v_id_map ? nal.parent_node_id::text
            RETURNING id, template_node_id
        )
        SELECT v_id_map || COALESCE(jsonb_object_agg(template_node_id::text, id::text), '{}'::jsonb)
        INTO v_id_map
        FROM inserted;

        -- If no rows inserted at this level, we're done
        EXIT WHEN NOT FOUND OR v_id_map IS NULL;
    END LOOP;

    -- 6. Copy particulars (attributes)
    INSERT INTO iclass.ship_breakdown_node_particular (
        ship_breakdown_node_id, template_particular_id,
        attr_key, attr_title, attr_value, selection_options, data_type, unit, is_modified, sort_order
    )
    SELECT
        (v_id_map ->> tp.template_node_id::text)::INTEGER,
        tp.id,
        tp.attr_key, tp.attr_title, tp.default_value, tp.selection_options, tp.data_type, tp.unit,
        FALSE, tp.sort_order
    FROM iclass.breakdown_template_node_particular tp
    JOIN iclass.breakdown_template_node tn ON tn.id = tp.template_node_id
    WHERE tn.template_id = p_template_id
      AND v_id_map ? tp.template_node_id::text;

    RETURN v_breakdown_id;
END;
$$;

GRANT EXECUTE ON FUNCTION api.fn_apply_template_to_ship TO employees;

DROP FUNCTION IF EXISTS api.fn_add_ship_specific_node(INTEGER, INTEGER, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, JSONB);
-- Compat with old signature
DROP FUNCTION IF EXISTS api.fn_add_ship_specific_node(INTEGER, INTEGER, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, NUMERIC, VARCHAR, JSONB, VARCHAR);

CREATE OR REPLACE FUNCTION api.fn_add_ship_specific_node(
    p_ship_breakdown_id INTEGER,
    p_parent_node_id    INTEGER,      -- NULL for root
    p_code              VARCHAR,
    p_name              VARCHAR,
    p_category          VARCHAR,
    p_node_type         VARCHAR DEFAULT NULL,
    p_description       TEXT DEFAULT NULL,
    p_metadata          JSONB DEFAULT '{}'
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_node_id INTEGER;
    v_ship_id INTEGER;
    v_level   INTEGER := 0;
    v_sort    INTEGER := 0;
BEGIN
    -- 0. Get ship_id
    SELECT ship_id INTO v_ship_id FROM iclass.ship_breakdown WHERE id = p_ship_breakdown_id;

    -- 1. Determine level
    IF p_parent_node_id IS NOT NULL THEN
        SELECT level + 1 INTO v_level
        FROM iclass.ship_breakdown_node
        WHERE id = p_parent_node_id;
    END IF;

    -- 2. Determine sort order
    SELECT COALESCE(MAX(sort_order), 0) + 10 INTO v_sort
    FROM iclass.ship_breakdown_node
    WHERE ship_breakdown_id = p_ship_breakdown_id
      AND parent_node_id IS NOT DISTINCT FROM p_parent_node_id;

    -- 3. Insert the new node
    INSERT INTO iclass.ship_breakdown_node (
        ship_id, ship_breakdown_id, parent_node_id, template_node_id,
        code, name, description, category, node_type,
        level, sort_order,
        is_from_template, is_modified, is_active, metadata
    ) VALUES (
        v_ship_id, p_ship_breakdown_id, p_parent_node_id, NULL,
        p_code, p_name, p_description, p_category, p_node_type,
        v_level, v_sort,
        FALSE, FALSE, TRUE, p_metadata
    )
    RETURNING id INTO v_node_id;

    RETURN v_node_id;
END;
$$;

GRANT EXECUTE ON FUNCTION api.fn_add_ship_specific_node TO employees;

GRANT EXECUTE ON FUNCTION api.fn_add_ship_specific_node TO employees;
