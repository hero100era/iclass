-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ships_imo ON iclass.ship(imo_number);

CREATE INDEX IF NOT EXISTS idx_ships_class_number ON iclass.ship(class_number);

CREATE INDEX IF NOT EXISTS idx_certificates_ship_id ON iclass.certificate(ship_id);

CREATE INDEX IF NOT EXISTS idx_certificates_company_id ON iclass.certificate(company_id);

CREATE INDEX IF NOT EXISTS idx_survey_audits_certificates_id ON iclass.survey_audit(certificate_id);

CREATE INDEX IF NOT EXISTS idx_finding_ship_id ON iclass.finding_comment(ship_id);

CREATE INDEX IF NOT EXISTS idx_finding_company_id ON iclass.finding_comment(company_id);