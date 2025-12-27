-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS iclass.idx_ships_imo ON iclass.ships(imo_number);

CREATE INDEX IF NOT EXISTS iclass.idx_ships_class_number ON iclass.ships(class_number);

CREATE INDEX IF NOT EXISTS iclass.idx_certificates_ships_id ON iclass.certificates(ships_id);

CREATE INDEX IF NOT EXISTS iclass.idx_certificates_companies_id ON certificates(companies_id);

CREATE INDEX IF NOT EXISTS iclass.idx_survey_audits_certificates_id ON survey_audits(certificates_id);

CREATE INDEX IF NOT EXISTS iclass.idx_finding_ships_id ON finding_comments(ships_id);

CREATE INDEX IF NOT EXISTS iclass.idx_finding_companies_id ON finding_comments(companies_id);