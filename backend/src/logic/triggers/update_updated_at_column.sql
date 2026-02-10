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
DROP TRIGGER IF EXISTS update_ships_updated_at ON iclass.ships;
CREATE TRIGGER update_ships_updated_at
  BEFORE UPDATE ON iclass.ships
  FOR EACH ROW
  EXECUTE FUNCTION iclass.update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at_trigger ON iclass.organizations;
CREATE TRIGGER update_organizations_updated_at_trigger
  BEFORE UPDATE ON iclass.organizations
  FOR EACH ROW
  EXECUTE FUNCTION iclass.update_updated_at_column();

DROP TRIGGER IF EXISTS update_certificates_updated_at_trigger ON iclass.certificates;
CREATE TRIGGER update_certificates_updated_at_trigger
  BEFORE UPDATE ON iclass.certificates
  FOR EACH ROW
  EXECUTE FUNCTION iclass.update_updated_at_column();

DROP TRIGGER IF EXISTS update_survey_audits_updated_at_trigger ON iclass.survey_audits;
CREATE TRIGGER update_survey_audits_updated_at_trigger
  BEFORE UPDATE ON iclass.survey_audits
  FOR EACH ROW
  EXECUTE FUNCTION iclass.update_updated_at_column();

DROP TRIGGER IF EXISTS update_findings_updated_at_trigger ON iclass.finding_comments;
CREATE TRIGGER update_findings_updated_at_trigger
  BEFORE UPDATE ON iclass.finding_comments
  FOR EACH ROW
  EXECUTE FUNCTION iclass.update_updated_at_column();
