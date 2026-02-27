-- -----------------------------------------------------------------------------
-- Function: api.fn_copy_ship_breakdown_node
-- Description: Creates a deep copy of a ship breakdown node, including its
--              particulars and all descendant nodes within the same ship breakdown.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION api.fn_copy_ship_breakdown_node(
    p_source_node_id   INTEGER,
    p_target_parent_id INTEGER DEFAULT NULL  -- If NULL, copies to same parent
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_root_id     INTEGER;
    v_breakdown_id    INTEGER;
    v_ship_id         INTEGER;
    v_actual_parent   INTEGER;
    v_level_diff      INTEGER;
    v_id_map          JSONB := '{}'; -- maps old_node_id -> new_node_id
    v_source_node     RECORD;
BEGIN
    -- 1. Get source node info
    SELECT * INTO v_source_node FROM iclass.ship_breakdown_node WHERE id = p_source_node_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source ship node % not found', p_source_node_id;
    END IF;

    v_breakdown_id := v_source_node.ship_breakdown_id;
    v_ship_id := v_source_node.ship_id;
    v_actual_parent := COALESCE(p_target_parent_id, v_source_node.parent_node_id);

    -- 2. Determine level difference
    IF v_actual_parent IS NOT NULL THEN
        SELECT (level + 1) - v_source_node.level INTO v_level_diff
        FROM iclass.ship_breakdown_node
        WHERE id = v_actual_parent;
    ELSE
        v_level_diff := 0 - v_source_node.level;
    END IF;

    -- 3. Copy the root source node
    INSERT INTO iclass.ship_breakdown_node (
        ship_id, ship_breakdown_id, parent_node_id, template_node_id,
        code, name, description, category, node_type,
        level, sort_order, is_from_template, is_modified, is_active, metadata
    )
    VALUES (
        v_ship_id, v_breakdown_id, v_actual_parent, v_source_node.template_node_id,
        v_source_node.code || '-COPY', 
        v_source_node.name || ' (Copy)', 
        v_source_node.description,
        v_source_node.category, v_source_node.node_type, 
        v_source_node.level + v_level_diff,
        v_source_node.sort_order + 1, 
        v_source_node.is_from_template,
        v_source_node.is_modified, v_source_node.is_active, 
        v_source_node.metadata || jsonb_build_object('_old_id', p_source_node_id)
    )
    RETURNING id INTO v_new_root_id;

    v_id_map := jsonb_build_object(p_source_node_id::text, v_new_root_id::text);

    -- Copy particulars for root
    INSERT INTO iclass.ship_breakdown_node_particular (
        ship_breakdown_node_id, template_particular_id, attr_key, attr_title,
        attr_value, selection_options, data_type, unit, is_modified, sort_order
    )
    SELECT 
        v_new_root_id, template_particular_id, attr_key, attr_title,
        attr_value, selection_options, data_type, unit, is_modified, sort_order
    FROM iclass.ship_breakdown_node_particular
    WHERE ship_breakdown_node_id = p_source_node_id;

    -- 4. Iterate descendants level by level
    FOR i IN 1..15 LOOP
        WITH inserted AS (
            INSERT INTO iclass.ship_breakdown_node (
                ship_id, ship_breakdown_id, parent_node_id, template_node_id,
                code, name, description, category, node_type,
                level, sort_order, is_from_template, is_modified, is_active, metadata
            )
            SELECT 
                sn.ship_id, sn.ship_breakdown_id,
                (v_id_map ->> sn.parent_node_id::text)::INTEGER,
                sn.template_node_id,
                sn.code, sn.name, sn.description,
                sn.category, sn.node_type, 
                sn.level + v_level_diff,
                sn.sort_order, sn.is_from_template,
                sn.is_modified, sn.is_active, 
                sn.metadata || jsonb_build_object('_old_id', sn.id)
            FROM iclass.ship_breakdown_node sn
            WHERE sn.ship_breakdown_id = v_breakdown_id
              AND v_id_map ? sn.parent_node_id::text
              AND NOT v_id_map ? sn.id::text
            RETURNING id, (metadata->>'_old_id')::INTEGER as old_id
        )
        SELECT v_id_map || COALESCE(jsonb_object_agg(old_id::text, id::text), '{}'::jsonb)
        INTO v_id_map
        FROM inserted;

        EXIT WHEN NOT FOUND OR v_id_map IS NULL;
    END LOOP;

    -- 5. Copy all particulars for the children
    INSERT INTO iclass.ship_breakdown_node_particular (
        ship_breakdown_node_id, template_particular_id, attr_key, attr_title,
        attr_value, selection_options, data_type, unit, is_modified, sort_order
    )
    SELECT 
        (v_id_map ->> sp.ship_breakdown_node_id::text)::INTEGER,
        sp.template_particular_id, sp.attr_key, sp.attr_title,
        sp.attr_value, sp.selection_options, sp.data_type, sp.unit, sp.is_modified, sp.sort_order
    FROM iclass.ship_breakdown_node_particular sp
    WHERE v_id_map ? sp.ship_breakdown_node_id::text
      AND (v_id_map ->> sp.ship_breakdown_node_id::text)::INTEGER != v_new_root_id; -- root already done

    -- 6. Cleanup metadata
    UPDATE iclass.ship_breakdown_node
    SET metadata = metadata - '_old_id'
    WHERE id IN (
        SELECT (value)::TEXT::INTEGER FROM jsonb_each_text(v_id_map)
    );

    RETURN v_new_root_id;
END;
$$;
