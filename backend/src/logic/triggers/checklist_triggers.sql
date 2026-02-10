-- Trigger function to handle survey_lines changes
CREATE OR REPLACE FUNCTION iclass.handle_survey_line_checklist_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Add checklist items for the inserted survey pool
        -- If an item is linked to a component type, add it for each matching component on the ship
        INSERT INTO iclass.survey_checklists (survey_job_id, survey_line_id, survey_audit_id, item_id, particulars, ship_component_id)
        SELECT 
            NEW.job_id,
            NEW.id,
            NEW.survey_audit_id,
            ci.id,
            ci.particulars,
            sct.id
        FROM iclass.checklist_items ci
        JOIN iclass.checklist_sections cs ON ci.section_id = cs.id
        CROSS JOIN (SELECT ship_id FROM iclass.survey_jobs WHERE id = NEW.job_id) sj
        LEFT JOIN iclass.ship_component_tree sct ON ci.component_library_id = sct.lib_id AND sct.ship_id = sj.ship_id
        WHERE cs.survey_id = COALESCE(NEW.pool_id, (SELECT pool_id FROM iclass.survey_audits WHERE id = NEW.survey_audit_id))
        AND ci.is_active = TRUE
        AND cs.is_active = TRUE
        AND (ci.component_library_id IS NULL OR sct.id IS NOT NULL);
        
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Remove all checklist items for the deleted survey line
        DELETE FROM iclass.survey_checklists
        WHERE survey_line_id = OLD.id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for survey_lines
DROP TRIGGER IF EXISTS survey_line_checklist_trigger ON iclass.survey_lines;
CREATE TRIGGER survey_line_checklist_trigger
AFTER INSERT OR DELETE ON iclass.survey_lines
FOR EACH ROW
EXECUTE FUNCTION iclass.handle_survey_line_checklist_change();

-- Trigger function to handle audit_lines changes
CREATE OR REPLACE FUNCTION iclass.handle_audit_line_checklist_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Add checklist items for the inserted audit pool
        -- If an item is linked to a component type, add it for each matching component on the ship
        INSERT INTO iclass.audit_checklists (audit_job_id, audit_line_id, survey_audit_id, item_id, particulars, ship_component_id)
        SELECT 
            NEW.job_id,
            NEW.id,
            NEW.survey_audit_id,
            ci.id,
            ci.particulars,
            sct.id
        FROM iclass.checklist_items ci
        JOIN iclass.checklist_sections cs ON ci.section_id = cs.id
        CROSS JOIN (SELECT ship_id FROM iclass.audit_jobs WHERE id = NEW.job_id) aj
        LEFT JOIN iclass.ship_component_tree sct ON ci.component_library_id = sct.lib_id AND sct.ship_id = aj.ship_id
        WHERE cs.survey_id = COALESCE(NEW.pool_id, (SELECT pool_id FROM iclass.survey_audits WHERE id = NEW.survey_audit_id))
        AND ci.is_active = TRUE
        AND cs.is_active = TRUE
        AND (ci.component_library_id IS NULL OR sct.id IS NOT NULL);
        
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Remove all checklist items for the deleted audit line
        DELETE FROM iclass.audit_checklists
        WHERE audit_line_id = OLD.id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for audit_lines
DROP TRIGGER IF EXISTS audit_line_checklist_trigger ON iclass.audit_lines;
CREATE TRIGGER audit_line_checklist_trigger
AFTER INSERT OR DELETE ON iclass.audit_lines
FOR EACH ROW
EXECUTE FUNCTION iclass.handle_audit_line_checklist_change();
