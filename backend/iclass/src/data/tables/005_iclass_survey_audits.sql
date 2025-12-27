-- Create table for survey/audit
CREATE TABLE IF NOT EXISTS iclass.survey_audits(
  pk serial PRIMARY KEY,
  certificate_id integer REFERENCES iclass.certificates(pk),
  code varchar(10) REFERENCES iclass.survey_audit_codes(code) NOT NULL,
  type iclass.survey_audit_types_enum,
  description varchar(120) NOT NULL,
  last_held_date date NOT NULL,
  place_held varchar(50) NOT NULL,
  next_due_date date,
  postponement_date date,
  status iclass.survey_audit_status_enum NOT NULL,
  range_from_date date,
  range_to_date date,
  fee DECIMAL(9, 2),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
