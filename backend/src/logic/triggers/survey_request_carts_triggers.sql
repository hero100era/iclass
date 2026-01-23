CREATE OR REPLACE FUNCTION iclass.update_survey_audit_is_ordered()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.survey_audit_id IS NOT NULL THEN
            UPDATE iclass.survey_audits
            SET is_ordered = TRUE
            WHERE id = NEW.survey_audit_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.survey_audit_id IS NOT NULL THEN
            -- Only set back to false if it's not in any other cart
            IF NOT EXISTS (
                SELECT 1 FROM iclass.survey_request_carts 
                WHERE survey_audit_id = OLD.survey_audit_id AND id != OLD.id
            ) THEN
                UPDATE iclass.survey_audits
                SET is_ordered = FALSE
                WHERE id = OLD.survey_audit_id;
            END IF;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_survey_audit_is_ordered ON iclass.survey_request_carts;
CREATE TRIGGER trg_update_survey_audit_is_ordered
AFTER INSERT OR DELETE ON iclass.survey_request_carts
FOR EACH ROW
EXECUTE FUNCTION iclass.update_survey_audit_is_ordered();
