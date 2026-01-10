CREATE TABLE IF NOT EXISTS iclass.survey_requests (
  id serial PRIMARY KEY,
  ship_id integer REFERENCES iclass.ships(id),
  company_id integer REFERENCES iclass.organizations(id),
  ordered_by_id integer REFERENCES auth.users(id),
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
  status iclass.task_status_enum DEFAULT 'draft',
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS iclass.request_survey_carts (
  id serial PRIMARY KEY,
  ship_id integer REFERENCES iclass.ships(id) ON DELETE CASCADE,
  company_id integer REFERENCES iclass.organizations(id) ON DELETE CASCADE,
  survey_request_id integer REFERENCES iclass.survey_requests(id) ON DELETE CASCADE,
  survey_audit_id integer REFERENCES iclass.survey_audits(id) ON DELETE SET NULL,
  comments_id integer REFERENCES iclass.finding_comments(id) ON DELETE SET NULL
);
