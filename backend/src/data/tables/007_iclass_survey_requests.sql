CREATE TABLE IF NOT EXISTS iclass.survey_request (
  id serial PRIMARY KEY,
  ship_id integer REFERENCES iclass.ship(id),
  company_id integer REFERENCES iclass.organization(id),
  ordered_by_id integer REFERENCES auth.user(id),
  location varchar(100),
  estimated_date date,
  contact_person varchar(50),
  contact_phone varchar(15),
  contact_email varchar(50),
  alternative_contact varchar(50),
  alternative_person varchar(50),
  alternative_phone varchar(15),
  alternative_email varchar(50),
  alternative_mobile varchar(15),
  is_assigned boolean DEFAULT FALSE,
  comments text,
  file_path varchar(255),
  status iclass.task_status_enum DEFAULT 'submitted',
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS iclass.survey_request_cart ( 
  id serial PRIMARY KEY,
  ship_id integer REFERENCES iclass.ship(id) ON DELETE CASCADE,
  company_id integer REFERENCES iclass.organization(id) ON DELETE CASCADE,
  survey_request_id integer REFERENCES iclass.survey_request(id) ON DELETE CASCADE,
  survey_audit_id integer REFERENCES iclass.survey_audit(id) ON DELETE SET NULL,
  comment_id integer REFERENCES iclass.finding_comment(id) ON DELETE SET NULL,
  occ_survey_code varchar(10) REFERENCES iclass.survey_pool(code) ON DELETE SET NULL
);
