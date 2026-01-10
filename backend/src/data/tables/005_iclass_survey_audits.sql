-- Create table for survey/audit
CREATE TABLE IF NOT EXISTS iclass.survey_pool (
  id serial PRIMARY KEY,
  name varchar(120) NOT NULL,
  description text,
  fee DECIMAL(9, 2),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS iclass.mandatory_survey_pool (
  code varchar(10) REFERENCES iclass.survey_audit_codes(code) UNIQUE NOT NULL,
  type iclass.survey_audit_types_enum,
  period INTERVAL,
  window_before INTERVAL,
  window_after INTERVAL,
  is_doc boolean DEFAULT FALSE,
  CONSTRAINT unique_active_mandatory_survey_audit UNIQUE (code, type, is_active)
) INHERITS (iclass.survey_pool);

CREATE TABLE IF NOT EXISTS iclass.other_survey_pool (
  code varchar(10) UNIQUE NOT NULL
) INHERITS (iclass.survey_pool);

CREATE TABLE IF NOT EXISTS iclass.survey_audits(
  id serial PRIMARY KEY,
  certificate_id integer REFERENCES iclass.certificates(id) ON DELETE CASCADE,
  code varchar(10) REFERENCES iclass.survey_audit_codes(code) ON DELETE SET NULL,
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
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE iclass.jobs (
  id serial PRIMARY KEY,
  file_path_report varchar(255),
  file_path_draft varchar(255),
  comments text,
  additional text,
  location varchar(20),
  fee DECIMAL(9, 2),
  job_status iclass.task_status_enum,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
   
CREATE TABLE IF NOT EXISTS iclass.survey_jobs (
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.jobs(id) ON DELETE CASCADE,
  ship_id integer REFERENCES iclass.ships(id) ON DELETE SET NULL,
  surveyor_id integer REFERENCES iclass.employees(id),
  reviewer_id integer REFERENCES iclass.employees(id),
  initialized boolean DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS iclass.audit_jobs (
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.jobs(id) ON DELETE CASCADE,
  ship_id integer REFERENCES iclass.ships(id) ON DELETE SET NULL,
  company_id integer REFERENCES iclass.organizations(id) ON DELETE SET NULL,
  auditor_id integer REFERENCES iclass.employees(id),
  reviewer_id integer REFERENCES iclass.employees(id),
  initialized boolean DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS iclass.ms_jobs (
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.jobs(id) ON DELETE CASCADE,
  ship_id integer REFERENCES iclass.ships(id) ON DELETE SET NULL,
  company_id integer REFERENCES iclass.organizations(id) ON DELETE SET NULL,
  issued_by integer REFERENCES iclass.employees(id),
  reviewed_by integer REFERENCES iclass.employees(id),
  initialized boolean DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS iclass.survey_lines (
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.survey_jobs(id) ON DELETE CASCADE,
  survey_audit_id integer REFERENCES iclass.survey_audits(id) ON DELETE CASCADE,
  initialized boolean DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS iclass.ms_lines (
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.ms_jobs(id) ON DELETE CASCADE,
  initialized boolean DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS iclass.audit_lines (
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.audit_jobs(id) ON DELETE CASCADE,
  survey_audit_id integer REFERENCES iclass.survey_audits(id) ON DELETE CASCADE,
  initialized boolean DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS iclass.survey_checklists (
  id bigserial PRIMARY KEY,
  survey_audit_id integer REFERENCES iclass.survey_audits(id),
  survey_job_id integer REFERENCES iclass.survey_jobs(id) ON DELETE CASCADE,
  survey_checklist_id integer REFERENCES iclass.survey_checklists(id)
);