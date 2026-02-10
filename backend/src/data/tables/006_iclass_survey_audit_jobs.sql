CREATE TABLE IF NOT EXISTS iclass.jobs (
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
  description varchar(200),
  initialized boolean DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS iclass.audit_jobs (
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.jobs(id) ON DELETE CASCADE,
  ship_id integer REFERENCES iclass.ships(id) ON DELETE SET NULL,
  company_id integer REFERENCES iclass.organizations(id) ON DELETE SET NULL,
  auditor_id integer REFERENCES iclass.employees(id),
  reviewer_id integer REFERENCES iclass.employees(id),
  description varchar(200),
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

CREATE TABLE IF NOT EXISTS iclass.job_participants (
  id serial PRIMARY KEY,
  survey_job_id integer REFERENCES iclass.survey_jobs(id) ON DELETE CASCADE,
  audit_job_id integer REFERENCES iclass.audit_jobs(id) ON DELETE CASCADE,
  employee_id integer REFERENCES iclass.employees(id) ON DELETE SET NULL,
  is_monitor boolean DEFAULT FALSE,
  is_trainee boolean DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS iclass.certificate_lines (
  id serial PRIMARY kEY,
  survey_job_id integer REFERENCES iclass.survey_jobs(id) ON DELETE CASCADE,
  audit_job_id integer REFERENCES iclass.audit_jobs(id) ON DELETE CASCADE,
  ms_job_id integer REFERENCES iclass.ms_jobs(id) on DELETE CASCADE,
  certificate_id integer REFERENCES iclass.certificates(id) ON DELETE SET NULL,
  action_code varchar(3) REFERENCES iclass.certificate_actions(code) NOT NULL,
  issued_by integer REFERENCES iclass.employees(id),
  issue_date date,
  extended_date date,
  file_path_draft varchar(255),
  file_path_cert varchar(255)
);

CREATE TABLE IF NOT EXISTS iclass.survey_lines (
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.survey_jobs(id) ON DELETE CASCADE,
  survey_audit_id integer REFERENCES iclass.survey_audits(id) ON DELETE SET NULL,
  pool_id integer REFERENCES iclass.survey_pool(id) ON DELETE SET NULL,
  initialized boolean DEFAULT FALSE,
  credit_periodical boolean DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS iclass.audit_lines (
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.audit_jobs(id) ON DELETE CASCADE,
  survey_audit_id integer REFERENCES iclass.survey_audits(id) ON DELETE SET NULL,
  pool_id integer REFERENCES iclass.survey_pool(id) ON DELETE SET NULL,
  initialized boolean DEFAULT FALSE,
  credit_periodical boolean DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS iclass.ms_lines (
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.ms_jobs(id) ON DELETE CASCADE,
  initialized boolean DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS iclass.survey_checklists (
  id bigserial PRIMARY KEY,
  survey_job_id integer REFERENCES iclass.survey_jobs(id) ON DELETE CASCADE,
  survey_line_id integer REFERENCES iclass.survey_lines(id) ON DELETE CASCADE,
  survey_audit_id integer REFERENCES iclass.survey_audits(id) ON DELETE SET NULL,
  item_id integer REFERENCES iclass.checklist_items(id) ON DELETE SET NULL,
  ship_component_id integer REFERENCES iclass.ship_component_tree(id) ON DELETE CASCADE,
  result varchar(2) REFERENCES iclass.checklist_results(code),
  particulars jsonb,
  report_by integer REFERENCES iclass.employees(id),
  report_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS iclass.audit_checklists ( 
  id bigserial PRIMARY KEY,
  audit_job_id integer REFERENCES iclass.audit_jobs(id) ON DELETE CASCADE,
  audit_line_id integer REFERENCES iclass.audit_lines(id) ON DELETE CASCADE,
  survey_audit_id integer REFERENCES iclass.survey_audits(id) ON DELETE SET NULL,
  item_id integer REFERENCES iclass.checklist_items(id) ON DELETE SET NULL,
  ship_component_id integer REFERENCES iclass.ship_component_tree(id) ON DELETE CASCADE,
  result varchar(2) REFERENCES iclass.checklist_results(code),
  particulars jsonb,
  report_by integer REFERENCES iclass.employees(id),
  report_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create table for linking Finding/Comments to Jobs (Reporting Scope)
CREATE TABLE IF NOT EXISTS iclass.comment_lines(
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.jobs(id) ON DELETE CASCADE,
  finding_comment_id integer REFERENCES iclass.finding_comments(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);