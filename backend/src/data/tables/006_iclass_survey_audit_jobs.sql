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
  parent_id integer REFERENCES iclass.survey_job(id) ON DELETE CASCADE,
  ship_id integer REFERENCES iclass.ship(id) ON DELETE SET NULL,
  surveyor_id integer REFERENCES iclass.employee(id),
  reviewer_id integer REFERENCES iclass.employee(id),
  description varchar(200),
  initialized boolean DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS iclass.audit_job (
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.job(id) ON DELETE CASCADE,
  parent_id integer REFERENCES iclass.audit_job(id) ON DELETE CASCADE,
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

CREATE SEQUENCE IF NOT EXISTS iclass.certificate_id_seq;

CREATE TABLE IF NOT EXISTS iclass.certificate_line (
  id serial PRIMARY kEY,
  survey_job_id integer REFERENCES iclass.survey_job(id) ON DELETE CASCADE,
  audit_job_id integer REFERENCES iclass.audit_job(id) ON DELETE CASCADE,
  ms_job_id integer REFERENCES iclass.ms_job(id) on DELETE CASCADE,
  certificate_id integer NOT NULL DEFAULT nextval('iclass.certificate_id_seq'),
  ref_certificate_id integer REFERENCES iclass.certificate(id) ON DELETE SET NULL,
  action_code varchar(3) REFERENCES iclass.certificate_action(code) NOT NULL,
  certificate_template_code varchar(10) REFERENCES iclass.certificate_template(code) ON DELETE SET NULL,
  cert_code varchar(10) REFERENCES iclass.certificate_survey_pool(code) NOT NULL,
  validity_type varchar(2) REFERENCES iclass.certificate_validity_type(code) NOT NULL,
  category varchar(3) REFERENCES iclass.certificate_category(code) NOT NULL,
  internal_category varchar(3) REFERENCES iclass.certificate_internal_category(code) NOT NULL,
  issued_by integer REFERENCES iclass.employee(id),
  description varchar(120),
  expiry_date date,
  extended_date date,
  mlc_declaration_date date,
  mlc_declaration_place varchar(50),
  doc_administration char(3),
  version integer NOT NULL,
  file_path_draft varchar(255),
  file_path_cert varchar(255)
);

CREATE TABLE IF NOT EXISTS iclass.survey_line (
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.survey_job(id) ON DELETE CASCADE,
  survey_audit_id integer REFERENCES iclass.survey_audit(id) ON DELETE SET NULL,
  pool_id integer REFERENCES iclass.survey_pool(id) ON DELETE SET NULL,
  description varchar(120),
  next_due_date date,
  postponement_date date,
  task_status iclass.task_status_enum,
  range_from_date date,
  range_to_date date,
  initialized boolean DEFAULT FALSE,
  credit_periodical boolean DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS iclass.audit_line (
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.audit_job(id) ON DELETE CASCADE,
  survey_audit_id integer REFERENCES iclass.survey_audit(id) ON DELETE SET NULL,
  pool_id integer REFERENCES iclass.survey_pool(id) ON DELETE SET NULL,
  description varchar(120),
  next_due_date date,
  postponement_date date,
  task_status iclass.task_status_enum,
  range_from_date date,
  range_to_date date,
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
  ship_breakdown_node_id integer REFERENCES iclass.ship_breakdown_node(id) ON DELETE CASCADE,
  result varchar(2) REFERENCES iclass.checklist_result(code),
  metadata JSONB DEFAULT '{}',
  report_by integer REFERENCES iclass.employee(id),
  report_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS iclass.audit_checklist (
  id bigserial PRIMARY KEY,
  audit_job_id integer REFERENCES iclass.audit_job(id) ON DELETE CASCADE,
  audit_line_id integer REFERENCES iclass.audit_line(id) ON DELETE CASCADE,
  survey_audit_id integer REFERENCES iclass.survey_audit(id) ON DELETE SET NULL,
  item_id integer REFERENCES iclass.checklist_item(id) ON DELETE SET NULL,
  ship_breakdown_node_id integer REFERENCES iclass.ship_breakdown_node(id) ON DELETE CASCADE,
  result varchar(2) REFERENCES iclass.checklist_result(code),
  metadata JSONB DEFAULT '{}',
  report_by integer REFERENCES iclass.employee(id),
  report_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS iclass.survey_checklist_item_particular (
  id  BIGSERIAL PRIMARY KEY,
  survey_checklist_id  BIGINT  NOT NULL REFERENCES iclass.survey_checklist(id) ON DELETE CASCADE,
  -- Traceability
  source_particular_id integer REFERENCES iclass.checklist_item_particular(id) ON DELETE SET NULL,
  ship_breakdown_node_id integer REFERENCES iclass.ship_breakdown_node(id) ON DELETE CASCADE,
  -- Snapshot fields (copied from checklist_item_particulars)
  attr_key            VARCHAR(100)    NOT NULL,
  attr_title          VARCHAR(300)    NOT NULL,
  data_type           iclass.data_type_enum  NOT NULL DEFAULT 'text',
  unit                VARCHAR(50),
  selection_options    JSONB,
  is_required         BOOLEAN         NOT NULL DEFAULT FALSE,
  sort_order          INTEGER         NOT NULL DEFAULT 0,
  attr_result         TEXT,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE (survey_checklist_id, attr_key, ship_breakdown_node_id)
);

CREATE TABLE IF NOT EXISTS iclass.audit_checklist_item_particular (
  id  BIGSERIAL PRIMARY KEY,
  audit_checklist_id  BIGINT  NOT NULL REFERENCES iclass.audit_checklist(id) ON DELETE CASCADE,
  -- Traceability
  source_particular_id integer REFERENCES iclass.checklist_item_particular(id) ON DELETE SET NULL,
  ship_breakdown_node_id integer REFERENCES iclass.ship_breakdown_node(id) ON DELETE CASCADE,
  -- Snapshot fields (copied from checklist_item_particulars)
  attr_key            VARCHAR(100)    NOT NULL,
  attr_title          VARCHAR(300)    NOT NULL,
  data_type           iclass.data_type_enum  NOT NULL DEFAULT 'text',
  unit                VARCHAR(50),
  selection_options    JSONB,
  is_required         BOOLEAN         NOT NULL DEFAULT FALSE,
  sort_order          INTEGER         NOT NULL DEFAULT 0,
  attr_result         TEXT,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE (audit_checklist_id, attr_key, ship_breakdown_node_id)
);

-- Create table for linking Finding/Comments to Jobs (Reporting Scope)
CREATE TABLE IF NOT EXISTS iclass.comment_line(
  id serial PRIMARY KEY,
  survey_job_id integer REFERENCES iclass.survey_job(id) ON DELETE CASCADE,
  audit_job_id integer REFERENCES iclass.audit_job(id) ON DELETE CASCADE,
  finding_comment_id integer REFERENCES iclass.finding_comment(id) ON DELETE SET NULL,
  comment_type varchar(2) REFERENCES iclass.comment_type(code),
  is_private boolean DEFAULT false,
  certificates varchar(500),
  due_date date,
  expiry_survey_audits varchar(500),
  status varchar(1) REFERENCES iclass.comment_status(code),
  postponed_due_date date,
  postponed_expiry_survey_audits varchar(500),
  mms_reference varchar(20),
  subject varchar(500),
  text varchar(10000)
);
