CREATE TABLE IF NOT EXISTS iclass.job (
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

CREATE TABLE IF NOT EXISTS iclass.survey_job(
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.job(id) ON DELETE CASCADE,
  ship_id integer REFERENCES iclass.ship(id) ON DELETE SET NULL,
  surveyor_id integer REFERENCES iclass.employee(id),
  reviewer_id integer REFERENCES iclass.employee(id),
  description varchar(200),
  initialized boolean DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS iclass.audit_job (
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.job(id) ON DELETE CASCADE,
  ship_id integer REFERENCES iclass.ship(id) ON DELETE SET NULL,
  company_id integer REFERENCES iclass.organization(id) ON DELETE SET NULL,
  auditor_id integer REFERENCES iclass.employee(id),
  reviewer_id integer REFERENCES iclass.employee(id),
  description varchar(200),
  initialized boolean DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS iclass.ms_job (
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.job(id) ON DELETE CASCADE,
  ship_id integer REFERENCES iclass.ship(id) ON DELETE SET NULL,
  company_id integer REFERENCES iclass.organization(id) ON DELETE SET NULL,
  issued_by integer REFERENCES iclass.employee(id),
  reviewed_by integer REFERENCES iclass.employee(id),
  initialized boolean DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS iclass.job_participant (
  id serial PRIMARY KEY,
  survey_job_id integer REFERENCES iclass.survey_job(id) ON DELETE CASCADE,
  audit_job_id integer REFERENCES iclass.audit_job(id) ON DELETE CASCADE,
  employee_id integer REFERENCES iclass.employee(id) ON DELETE SET NULL,
  is_monitor boolean DEFAULT FALSE,
  is_trainee boolean DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS iclass.certificate_line (
  id serial PRIMARY kEY,
  survey_job_id integer REFERENCES iclass.survey_job(id) ON DELETE CASCADE,
  audit_job_id integer REFERENCES iclass.audit_job(id) ON DELETE CASCADE,
  ms_job_id integer REFERENCES iclass.ms_job(id) on DELETE CASCADE,
  certificate_id integer REFERENCES iclass.certificate(id) ON DELETE SET NULL,
  action_code varchar(3) REFERENCES iclass.certificate_action(code) NOT NULL,
  issued_by integer REFERENCES iclass.employee(id),
  issue_date date,
  extended_date date,
  file_path_draft varchar(255),
  file_path_cert varchar(255)
);

CREATE TABLE IF NOT EXISTS iclass.survey_line (
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.survey_job(id) ON DELETE CASCADE,
  survey_audit_id integer REFERENCES iclass.survey_audit(id) ON DELETE SET NULL,
  pool_id integer REFERENCES iclass.survey_pool(id) ON DELETE SET NULL,
  initialized boolean DEFAULT FALSE,
  credit_periodical boolean DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS iclass.audit_line (
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.audit_job(id) ON DELETE CASCADE,
  survey_audit_id integer REFERENCES iclass.survey_audit(id) ON DELETE SET NULL,
  pool_id integer REFERENCES iclass.survey_pool(id) ON DELETE SET NULL,
  initialized boolean DEFAULT FALSE,
  credit_periodical boolean DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS iclass.ms_line (
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.ms_job(id) ON DELETE CASCADE,
  initialized boolean DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS iclass.survey_checklist (
  id bigserial PRIMARY KEY,
  survey_job_id integer REFERENCES iclass.survey_job(id) ON DELETE CASCADE,
  survey_line_id integer REFERENCES iclass.survey_line(id) ON DELETE CASCADE,
  survey_audit_id integer REFERENCES iclass.survey_audit(id) ON DELETE SET NULL,
  item_id integer REFERENCES iclass.checklist_item(id) ON DELETE SET NULL,
  breakdown_node_id integer REFERENCES iclass.ship_breakdown_node(id) ON DELETE CASCADE,
  result varchar(2) REFERENCES iclass.checklist_result(code),
  particulars jsonb, --for tracebilities.
  report_by integer REFERENCES iclass.employee(id),
  report_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS iclass.audit_checklist (
  id bigserial PRIMARY KEY,
  audit_job_id integer REFERENCES iclass.audit_job(id) ON DELETE CASCADE,
  audit_line_id integer REFERENCES iclass.audit_line(id) ON DELETE CASCADE,
  survey_audit_id integer REFERENCES iclass.survey_audit(id) ON DELETE SET NULL,
  item_id integer REFERENCES iclass.checklist_item(id) ON DELETE SET NULL,
  breakdown_template_node_id integer REFERENCES iclass.breakdown_template_node(id) ON DELETE CASCADE,
  result varchar(2) REFERENCES iclass.checklist_result(code),
  particulars jsonb,
  report_by integer REFERENCES iclass.employee(id),
  report_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create table for linking Finding/Comments to Jobs (Reporting Scope)
CREATE TABLE IF NOT EXISTS iclass.comment_line(
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.job(id) ON DELETE CASCADE,
  finding_comment_id integer REFERENCES iclass.finding_comment(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
