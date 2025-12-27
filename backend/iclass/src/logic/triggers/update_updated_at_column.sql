-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION iclass.update_updated_at_column()
  RETURNS TRIGGER
  AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$
LANGUAGE 'plpgsql';
-- Create updated_at triggers for all tables
CREATE OR REPLACE TRIGGER iclass.update_ships_updated_at
  BEFORE UPDATE ON ships
  FOR EACH ROW
  EXECUTE FUNCTION iclass.update_updated_at_column();

CREATE OR REPLACE TRIGGER iclass.update_companies_updated_at_trigger
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION iclass.update_updated_at_column();

CREATE OR REPLACE TRIGGER iclass.update_certificates_updated_at_trigger
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION iclass.update_updated_at_column();

CREATE OR REPLACE TRIGGER iclass.update_survey_audits_updated_at_trigger
  BEFORE UPDATE ON iclass.survey_audits
  FOR EACH ROW
  EXECUTE FUNCTION iclass.update_updated_at_column();

CREATE OR REPLACE TRIGGER iclass.update_findings_updated_at_trigger
  BEFORE UPDATE ON iclass.finding_comments
  FOR EACH ROW
  EXECUTE FUNCTION iclass.update_updated_at_column();
