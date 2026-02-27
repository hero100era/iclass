-- -----------------------------------------------------------------------------
-- Function: api.fn_copy_breakdown_template_node
-- Description: Creates a deep copy of a breakdown template node, including its
--              particulars and all descendant nodes.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION api.fn_copy_breakdown_template_node(
    p_source_node_id   INTEGER,
    p_target_parent_id INTEGER DEFAULT NULL  -- If NULL, copies to same parent
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_root_id     INTEGER;
    v_template_id     INTEGER;
    v_actual_parent   INTEGER;
    v_level_diff      INTEGER;
    v_id_map          JSONB := '{}'; -- maps old_node_id -> new_node_id
    v_source_node     RECORD;
BEGIN
    -- 1. Get source node info
    SELECT * INTO v_source_node FROM iclass.breakdown_template_node WHERE id = p_source_node_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source node % not found', p_source_node_id;
    END IF;

    v_template_id := v_source_node.template_id;
    v_actual_parent := COALESCE(p_target_parent_id, v_source_node.parent_node_id);

    -- 2. Determine level difference
    IF v_actual_parent IS NOT NULL THEN
        SELECT (level + 1) - v_source_node.level INTO v_level_diff
        FROM iclass.breakdown_template_node
        WHERE id = v_actual_parent;
    ELSE
        v_level_diff := 0 - v_source_node.level;
    END IF;

    -- 3. Copy the root source node
    INSERT INTO iclass.breakdown_template_node (
        template_id, parent_node_id, code, name, description, 
        category, node_type, level, sort_order, is_instantiable,
        default_quantity, is_active, metadata, is_mandatory, is_leaf
    )
    VALUES (
        v_template_id, v_actual_parent, 
        v_source_node.code || '-COPY', 
        v_source_node.name || ' (Copy)', 
        v_source_node.description,
        v_source_node.category, v_source_node.node_type, 
        v_source_node.level + v_level_diff,
        v_source_node.sort_order + 1, 
        v_source_node.is_instantiable,
        v_source_node.default_quantity, v_source_node.is_active, 
        v_source_node.metadata || jsonb_build_object('_old_id', p_source_node_id), 
        v_source_node.is_mandatory, v_source_node.is_leaf
    )
    RETURNING id INTO v_new_root_id;

    v_id_map := jsonb_build_object(p_source_node_id::text, v_new_root_id::text);

    -- Copy particulars for root
    INSERT INTO iclass.breakdown_template_node_particular (
        template_node_id, attr_key, attr_title, data_type, 
        default_value, selection_options, unit, is_required, sort_order
    )
    SELECT 
        v_new_root_id, attr_key, attr_title, data_type, 
        default_value, selection_options, unit, is_required, sort_order
    FROM iclass.breakdown_template_node_particular
    WHERE template_node_id = p_source_node_id;

    -- 4. Iterate descendants level by level
    FOR i IN 1..15 LOOP
        WITH inserted AS (
            INSERT INTO iclass.breakdown_template_node (
                template_id, parent_node_id, code, name, description, 
                category, node_type, level, sort_order, is_instantiable,
                default_quantity, is_active, metadata, is_mandatory, is_leaf
            )
            SELECT 
                tn.template_id, 
                (v_id_map ->> tn.parent_node_id::text)::INTEGER,
                tn.code, tn.name, tn.description,
                tn.category, tn.node_type, 
                tn.level + v_level_diff,
                tn.sort_order, tn.is_instantiable,
                tn.default_quantity, tn.is_active, 
                tn.metadata || jsonb_build_object('_old_id', tn.id),
                tn.is_mandatory, tn.is_leaf
            FROM iclass.breakdown_template_node tn
            WHERE tn.template_id = v_template_id
              AND v_id_map ? tn.parent_node_id::text
              AND NOT v_id_map ? tn.id::text
            RETURNING id, (metadata->>'_old_id')::INTEGER as old_id
        )
        SELECT v_id_map || COALESCE(jsonb_object_agg(old_id::text, id::text), '{}'::jsonb)
        INTO v_id_map
        FROM inserted;

        EXIT WHEN NOT FOUND OR v_id_map IS NULL;
    END LOOP;

    -- 5. Copy all particulars for the children
    -- We can do this in one bulk insert now that we have the full v_id_map
    INSERT INTO iclass.breakdown_template_node_particular (
        template_node_id, attr_key, attr_title, data_type, 
        default_value, selection_options, unit, is_required, sort_order
    )
    SELECT 
        (v_id_map ->> tp.template_node_id::text)::INTEGER,
        tp.attr_key, tp.attr_title, tp.data_type, 
        tp.default_value, tp.selection_options, tp.unit, tp.is_required, tp.sort_order
    FROM iclass.breakdown_template_node_particular tp
    WHERE v_id_map ? tp.template_node_id::text
      AND (v_id_map ->> tp.template_node_id::text)::INTEGER != v_new_root_id; -- root already done

    -- 6. Cleanup metadata
    UPDATE iclass.breakdown_template_node
    SET metadata = metadata - '_old_id'
    WHERE id IN (
        SELECT (value)::TEXT::INTEGER FROM jsonb_each_text(v_id_map)
    );

    RETURN v_new_root_id;
END;
$$;
