-- Create table for Findings/Comments
CREATE TABLE IF NOT EXISTS iclass.finding_comments(
  pk serial PRIMARY KEY,
  ships_id integer REFERENCES iclass.ships(pk),
  companies_id integer REFERENCES iclass.companies(pk),
  comment_type iclass.comment_types_enum NOT NULL,
  certificates varchar(500),
  date_issued date NOT NULL,
  place_issued varchar(50),
  due_date date,
  expiry_survey_audits varchar(500),
  status iclass.comment_status_enum,
  postponed_due_date date,
  postponed_expiry_survey_audits text,
  mms_reference varchar(20),
  text varchar(10000) NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);