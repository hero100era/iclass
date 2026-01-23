-- Create table for Findings/Comments
CREATE TABLE IF NOT EXISTS iclass.finding_comments(
  id serial PRIMARY KEY,
  ship_id integer REFERENCES iclass.ships(id) ON DELETE CASCADE,
  company_id integer REFERENCES iclass.organizations(id) ON DELETE CASCADE,
  comment_type varchar(2) REFERENCES iclass.comment_types(code) NOT NULL,
  priviate boolean DEFAULT false,
  certificates varchar(500),
  date_issued date NOT NULL,
  place_issued varchar(50),
  due_date date,
  expiry_survey_audits varchar(500),
  status varchar(2) REFERENCES iclass.comment_status(code) NOT NULL,
  postponed_due_date date,
  postponed_expiry_survey_audits text,
  mms_reference varchar(20),
  text varchar(10000) NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);