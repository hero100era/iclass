-- Trigger function to handle survey_lines changes
CREATE OR REPLACE FUNCTION iclass.handle_survey_line_checklist_change()
RETURNS TRIGGER AS $$
DECLARE
    v_pool_id integer;
    v_ship_id integer;
    v_breakdown_id integer;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Resolve the pool_id: prefer direct pool_id, fall back to survey_audit's pool_id
        v_pool_id := COALESCE(
            NEW.pool_id,
            (SELECT pool_id FROM iclass.survey_audit WHERE id = NEW.survey_audit_id)
        );

        -- Get the ship_id for this survey job
        SELECT ship_id INTO v_ship_id FROM iclass.survey_job WHERE id = NEW.job_id;

        -- Get the active breakdown id for this ship (may be NULL if no breakdown configured)
        SELECT id INTO v_breakdown_id FROM iclass.ship_breakdown WHERE ship_id = v_ship_id AND is_active = TRUE LIMIT 1;

        -- Insert checklist items for the pool.
        -- ALL active checklist items for the pool are inserted.
        -- ship_breakdown_node_id is set when a matching ship node exists, otherwise NULL.
        WITH inserted_checklists AS (
            INSERT INTO iclass.survey_checklist (survey_job_id, survey_line_id, survey_audit_id, item_id, ship_breakdown_node_id)
            SELECT DISTINCT ON (ci.id)
                NEW.job_id,
                NEW.id,
                NEW.survey_audit_id,
                ci.id,
                sbn.id  -- NULL when no matching ship breakdown node
            FROM iclass.checklist_item ci
            JOIN iclass.checklist_section cs ON ci.section_id = cs.id
            -- Match template node to ship-specific instance (LEFT JOIN so items without a node match are still included)
            LEFT JOIN iclass.ship_breakdown_node sbn
                ON ci.breakdown_template_node_id = sbn.template_node_id
                AND sbn.ship_breakdown_id = v_breakdown_id
            WHERE cs.survey_id = v_pool_id
            AND ci.is_active = TRUE
            AND cs.is_active = TRUE
            ORDER BY ci.id, sbn.id NULLS LAST
            RETURNING id, item_id, ship_breakdown_node_id
        )
        -- Copy particulars from the checklist item template
        INSERT INTO iclass.survey_checklist_item_particular (
            survey_checklist_id, source_particular_id, attr_key, attr_title, data_type, unit, selection_options, is_required, sort_order, attr_result, ship_breakdown_node_id
        )
        SELECT 
            ic.id,
            cip.id,
            cip.attr_key,
            cip.attr_title,
            cip.data_type,
            cip.unit,
            cip.selection_options,
            cip.is_required,
            cip.sort_order,
            cip.default_value,
            COALESCE(c.id, ic.ship_breakdown_node_id)
        FROM inserted_checklists ic
        JOIN iclass.checklist_item_particular cip ON ic.item_id = cip.checklist_item_id
        LEFT JOIN iclass.ship_breakdown_node c ON c.parent_node_id = ic.ship_breakdown_node_id;
        
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Remove all checklist items for the deleted survey line
        DELETE FROM iclass.survey_checklist
        WHERE survey_line_id = OLD.id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for survey_lines
DROP TRIGGER IF EXISTS survey_line_checklist_trigger ON iclass.survey_line;
CREATE TRIGGER survey_line_checklist_trigger
AFTER INSERT OR DELETE ON iclass.survey_line
FOR EACH ROW
EXECUTE FUNCTION iclass.handle_survey_line_checklist_change();

-- Trigger function to handle audit_lines changes
CREATE OR REPLACE FUNCTION iclass.handle_audit_line_checklist_change()
RETURNS TRIGGER AS $$
DECLARE
    v_pool_id integer;
    v_ship_id integer;
    v_breakdown_id integer;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Resolve the pool_id: prefer direct pool_id, fall back to survey_audit's pool_id
        v_pool_id := COALESCE(
            NEW.pool_id,
            (SELECT pool_id FROM iclass.survey_audit WHERE id = NEW.survey_audit_id)
        );

        -- Get the ship_id for this audit job
        SELECT ship_id INTO v_ship_id FROM iclass.audit_job WHERE id = NEW.job_id;

        -- Get the active breakdown id for this ship (may be NULL if no breakdown configured)
        SELECT id INTO v_breakdown_id FROM iclass.ship_breakdown WHERE ship_id = v_ship_id AND is_active = TRUE LIMIT 1;

        -- Insert checklist items for the pool.
        -- ALL active checklist items for the pool are inserted.
        -- ship_breakdown_node_id is set when a matching ship node exists, otherwise NULL.
        WITH inserted_checklists AS (
            INSERT INTO iclass.audit_checklist (audit_job_id, audit_line_id, survey_audit_id, item_id, ship_breakdown_node_id)
            SELECT DISTINCT ON (ci.id)
                NEW.job_id,
                NEW.id,
                NEW.survey_audit_id,
                ci.id,
                sbn.id  -- NULL when no matching ship breakdown node
            FROM iclass.checklist_item ci
            JOIN iclass.checklist_section cs ON ci.section_id = cs.id
            -- Match template node to ship-specific instance (LEFT JOIN so items without a node match are still included)
            LEFT JOIN iclass.ship_breakdown_node sbn
                ON ci.breakdown_template_node_id = sbn.template_node_id
                AND sbn.ship_breakdown_id = v_breakdown_id
            WHERE cs.survey_id = v_pool_id
            AND ci.is_active = TRUE
            AND cs.is_active = TRUE
            ORDER BY ci.id, sbn.id NULLS LAST
            RETURNING id, item_id, ship_breakdown_node_id
        )
        -- Copy particulars from the checklist item template
        INSERT INTO iclass.audit_checklist_item_particular (
            audit_checklist_id, source_particular_id, attr_key, attr_title, data_type, unit, selection_options, is_required, sort_order, attr_result, ship_breakdown_node_id
        )
        SELECT 
            ic.id,
            cip.id,
            cip.attr_key,
            cip.attr_title,
            cip.data_type,
            cip.unit,
            cip.selection_options,
            cip.is_required,
            cip.sort_order,
            cip.default_value,
            COALESCE(c.id, ic.ship_breakdown_node_id)
        FROM inserted_checklists ic
        JOIN iclass.checklist_item_particular cip ON ic.item_id = cip.checklist_item_id
        LEFT JOIN iclass.ship_breakdown_node c ON c.parent_node_id = ic.ship_breakdown_node_id;
        
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Remove all checklist items for the deleted audit line
        DELETE FROM iclass.audit_checklist
        WHERE audit_line_id = OLD.id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for audit_lines
DROP TRIGGER IF EXISTS audit_line_checklist_trigger ON iclass.audit_line;
CREATE TRIGGER audit_line_checklist_trigger
AFTER INSERT OR DELETE ON iclass.audit_line
FOR EACH ROW
EXECUTE FUNCTION iclass.handle_audit_line_checklist_change();
