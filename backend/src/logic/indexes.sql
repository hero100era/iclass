-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS iclass.idx_ships_imo ON iclass.ships(imo_number);

CREATE INDEX IF NOT EXISTS iclass.idx_ships_class_number ON iclass.ships(class_number);

CREATE INDEX IF NOT EXISTS iclass.idx_certificates_ship_id ON iclass.certificates(ship_id);

CREATE INDEX IF NOT EXISTS iclass.idx_certificates_company_id ON certificates(company_id);

CREATE INDEX IF NOT EXISTS iclass.idx_survey_audits_certificates_id ON survey_audits(certificate_id);

CREATE INDEX IF NOT EXISTS iclass.idx_finding_ship_id ON finding_comments(ship_id);

CREATE INDEX IF NOT EXISTS iclass.idx_finding_company_id ON finding_comments(company_id);