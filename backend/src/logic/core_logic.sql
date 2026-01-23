-- Core Business Logic Functions

-- 1. Function to update certificate status based on expiry date
CREATE OR REPLACE FUNCTION iclass.update_certificate_status() 
RETURNS void AS $$
BEGIN
  -- Set status to 'W' (Withdrawn/Expired) if expiry_date has passed
  UPDATE iclass.certificates
  SET status = 'W'
  WHERE status = 'V' AND expiry_date < CURRENT_DATE;

  -- Logic for 'S' (Suspended) could be added here if needed
END;
$$ LANGUAGE plpgsql;

-- 2. Function to calculate next due date for surveys
CREATE OR REPLACE FUNCTION iclass.calculate_next_due_date(
  p_last_held_date date,
  p_survey_type text
) RETURNS date AS $$
DECLARE
  v_next_due_date date;
BEGIN
  CASE p_survey_type
    WHEN 'A' THEN -- Annual
      v_next_due_date := p_last_held_date + INTERVAL '1 year';
    WHEN 'In' THEN -- Intermediate
      v_next_due_date := p_last_held_date + INTERVAL '2.5 years';
    WHEN 'R' THEN -- Renewal
      v_next_due_date := p_last_held_date + INTERVAL '5 years';
    ELSE
      v_next_due_date := NULL; -- Or some default logic
  END CASE;

  RETURN v_next_due_date;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger to auto-update next_due_date on survey insertion/update
CREATE OR REPLACE FUNCTION iclass.trigger_update_survey_due_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_held_date IS NOT NULL AND NEW.type IS NOT NULL THEN
    NEW.next_due_date := iclass.calculate_next_due_date(NEW.last_held_date, NEW.type);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_survey_due_date ON iclass.survey_audits;
CREATE TRIGGER trg_update_survey_due_date
BEFORE INSERT OR UPDATE OF last_held_date, type ON iclass.survey_audits
FOR EACH ROW
EXECUTE FUNCTION iclass.trigger_update_survey_due_date();
