-- Create a function to instantiate a node from a template into a ship's breakdown
CREATE OR REPLACE FUNCTION api.fn_instantiate_template_node(
    p_ship_breakdown_id INTEGER,
    p_parent_ship_node_id INTEGER,      -- NULL for root (though usually we instantiate under a parent)
    p_template_node_id    INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_node_id INTEGER;
    v_ship_id INTEGER;
    v_level   INTEGER := 0;
    v_sort    INTEGER := 0;
    v_tn      RECORD;
BEGIN
    -- 1. Get ship_id and breakdown info
    SELECT ship_id INTO v_ship_id FROM iclass.ship_breakdown WHERE id = p_ship_breakdown_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ship breakdown % not found', p_ship_breakdown_id;
    END IF;

    -- 2. Get template node details
    SELECT * INTO v_tn FROM iclass.breakdown_template_node WHERE id = p_template_node_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template node % not found', p_template_node_id;
    END IF;

    -- 3. Determine level
    IF p_parent_ship_node_id IS NOT NULL THEN
        SELECT level + 1 INTO v_level
        FROM iclass.ship_breakdown_node
        WHERE id = p_parent_ship_node_id;
    ELSE
        v_level := v_tn.level;
    END IF;

    -- 4. Determine sort order (append to end of siblings)
    SELECT COALESCE(MAX(sort_order), 0) + 10 INTO v_sort
    FROM iclass.ship_breakdown_node
    WHERE ship_breakdown_id = p_ship_breakdown_id
      AND parent_node_id IS NOT DISTINCT FROM p_parent_ship_node_id;

    -- 5. Insert the new node
    INSERT INTO iclass.ship_breakdown_node (
        ship_id, ship_breakdown_id, parent_node_id, template_node_id,
        code, name, description, category, node_type,
        level, sort_order,
        is_from_template, is_modified, is_active, metadata
    ) VALUES (
        v_ship_id, p_ship_breakdown_id, p_parent_ship_node_id, p_template_node_id,
        v_tn.code, v_tn.name, v_tn.description, v_tn.category, v_tn.node_type,
        v_level, v_sort,
        TRUE, FALSE, TRUE, v_tn.metadata
    )
    RETURNING id INTO v_node_id;

    -- 6. Copy particulars from template
    INSERT INTO iclass.ship_breakdown_node_particular (
        ship_breakdown_node_id, template_particular_id,
        attr_key, attr_title, attr_value, selection_options, data_type, unit, is_modified, sort_order
    )
    SELECT
        v_node_id, tp.id,
        tp.attr_key, tp.attr_title, tp.default_value, tp.selection_options, tp.data_type, tp.unit,
        FALSE, tp.sort_order
    FROM iclass.breakdown_template_node_particular tp
    WHERE tp.template_node_id = p_template_node_id;

    RETURN v_node_id;
END;
$$;

GRANT EXECUTE ON FUNCTION api.fn_instantiate_template_node TO employees;
