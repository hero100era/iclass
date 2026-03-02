-- Create table for ships
CREATE SEQUENCE IF NOT EXISTS iclass.class_number_seq START WITH 200000;

CREATE TABLE IF NOT EXISTS iclass.ship(
  id serial PRIMARY KEY,
  class_number integer NOT NULL DEFAULT nextval('iclass.class_number_seq'),
  name varchar(40) NOT NULL,
  previous_names varchar(500),
  build_date date,
  commissioning_date date,
  keel_laid_date date,
  contract_date date,
  class_entry_date date,
  imo_number varchar(7) UNIQUE,
  administration_types varchar(2) REFERENCES iclass.administration_type(code) NOT NULL DEFAULT 'C',
  administration_country char(3),
  classed_by varchar(20) REFERENCES iclass.classification_society(code),
  port_of_registry varchar(50),
  date_of_registry date,
  registry_number varchar(20),
  call_sign varchar(10),
  official_number varchar(10),
  type_iacs varchar(2) REFERENCES iclass.vessel_type_iacs(code) NOT NULL,
  type_other varchar(50),
  type_mms varchar(2) REFERENCES iclass.vessel_type_mms(code),
  class_status varchar(2) REFERENCES iclass.class_status(code),
  ship_status varchar(2) REFERENCES iclass.ship_status(code),
  class_notation varchar(500),
  service_notation varchar(500),
  navigation_notation varchar(500),
  additional_notation varchar(500),
  gross_tons DECIMAL(9, 2),
  national_tons DECIMAL(9, 2),
  deadweight integer,
  registered_owner_id integer REFERENCES iclass.organization(id),
  ism_owner_id integer REFERENCES iclass.organization(id),
  mlc_owner_id integer REFERENCES iclass.organization(id),
  flag_code varchar(3) REFERENCES iclass.flag(code),
  registration_port varchar(30),
  mmsi_number varchar(10),
  main_class varchar(30),
  net_tons DECIMAL(9, 2),
  light_ship DECIMAL(9, 2),
  ballast_capacity DECIMAL(9, 2),
  equipment_number integer,
  length DECIMAL(9, 2),
  length_oa DECIMAL(9, 2),
  length_bp DECIMAL(9, 2),
  moulded_depth DECIMAL(9, 2),
  moulded_breadth DECIMAL(9, 2),
  moulded_draft DECIMAL(9, 2),
  design_draft DECIMAL(9, 2),
  dual_class varchar(20) REFERENCES iclass.classification_society(code),
  signal_letter varchar(10),
  breakdown_template_id integer REFERENCES iclass.breakdown_template(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- ---------------------------------------------
-- Ship Breakdown (header - links ship ↔ template)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS iclass.ship_breakdown (
  id              serial PRIMARY KEY,
  ship_id         integer   NOT NULL REFERENCES iclass.ship(id) ON DELETE CASCADE,
  template_id integer  REFERENCES iclass.breakdown_template(id) ON DELETE SET NULL,  -- which template was used
  name            VARCHAR(200) NOT NULL,                -- e.g., 'MV Pacific Star - Breakdown Rev.3'
  description     TEXT,
  revision        INTEGER      NOT NULL DEFAULT 1,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,   -- only one active breakdown per ship
  applied_at      TIMESTAMPTZ,                           -- when template was applied
  applied_by      VARCHAR(100),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure only one active breakdown per ship
-- Use a partial unique index to allow only one active breakdown per ship
-- but allow multiple inactive ones.
CREATE UNIQUE INDEX IF NOT EXISTS uidx_ship_active_breakdown ON iclass.ship_breakdown(ship_id) WHERE (is_active = TRUE);

-- ---------------------------------------------
-- Ship Breakdown Node (ship-specific component tree)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS iclass.ship_breakdown_node (
  id                  serial PRIMARY KEY,
  ship_id             integer  NOT NULL REFERENCES iclass.ship(id) ON DELETE CASCADE,
  ship_breakdown_id   integer  NOT NULL REFERENCES iclass.ship_breakdown(id) ON DELETE CASCADE,
  parent_node_id      integer  REFERENCES iclass.ship_breakdown_node(id) ON DELETE CASCADE,

  -- Traceability back to template
  template_node_id integer   REFERENCES iclass.breakdown_template_node(id) ON DELETE SET NULL,

  -- Identification (can be customized per ship)
  code                VARCHAR(50)  NOT NULL,
  name                VARCHAR(200) NOT NULL,
  description         TEXT,

  -- Classification
  category            VARCHAR(50),
  node_type           VARCHAR(50),

  -- Hierarchy & ordering
  level           INTEGER      NOT NULL DEFAULT 0,
  sort_order      INTEGER      NOT NULL DEFAULT 0,
  -- path            LTREE,

  -- Customization tracking
  is_from_template    BOOLEAN      NOT NULL DEFAULT TRUE,   -- FALSE if added ship-specifically
  is_modified         BOOLEAN      NOT NULL DEFAULT FALSE,  -- TRUE if template values were changed
  is_active           BOOLEAN      NOT NULL DEFAULT TRUE,

  -- Flexible properties (ship-specific overrides)
  metadata            JSONB        DEFAULT '{}', -- JSONB data type for flexible properties
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_ship_node_code UNIQUE (ship_breakdown_id, code),
  CONSTRAINT chk_no_self_parent_ship CHECK (id != parent_node_id)
);

-- ---------------------------------------------
-- Ship Node Attributes (ship-specific key-value)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS iclass.ship_breakdown_node_particular (
  id serial PRIMARY KEY,
  ship_breakdown_node_id integer NOT NULL REFERENCES iclass.ship_breakdown_node(id) ON DELETE CASCADE,
  -- Traceability
  template_particular_id integer REFERENCES iclass.breakdown_template_node_particular(id) ON DELETE SET NULL,

  attr_key           VARCHAR(100) NOT NULL,
  attr_title         VARCHAR(200) NOT NULL,
  attr_value         TEXT,
  selection_options  JSONB,
  data_type          iclass.data_type_enum    DEFAULT 'text',
  unit               VARCHAR(20),
  is_modified        BOOLEAN      NOT NULL DEFAULT FALSE,
  sort_order         INTEGER      NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_snode_attr UNIQUE (ship_breakdown_node_id, attr_key)
);

CREATE SEQUENCE IF NOT EXISTS iclass.certificate_id_seq;

CREATE TABLE IF NOT EXISTS iclass.certificate(
  id serial PRIMARY KEY,
  certificate_id integer NOT NULL DEFAULT nextval('iclass.certificate_id_seq'),
  version integer NOT NULL,
  ship_id integer REFERENCES iclass.ship(id) ON DELETE SET NULL,
  company_id integer REFERENCES iclass.organization(id) ON DELETE SET NULL,
  certificate_template_code varchar(10) REFERENCES iclass.certificate_template(code) ON DELETE SET NULL,
  status varchar(2) REFERENCES iclass.certificate_status(code) NOT NULL,
  remark varchar(2) NOT NULL,
  issued_by varchar(20) REFERENCES iclass.classification_society(code) NOT NULL,
  cert_code varchar(10) REFERENCES iclass.certificate_survey_pool(code) NOT NULL,
  validity_type varchar(2) REFERENCES iclass.certificate_validity_type(code) NOT NULL,
  category varchar(3) REFERENCES iclass.certificate_category(code) NOT NULL,
  internal_category varchar(3) REFERENCES iclass.certificate_internal_category(code) NOT NULL,
  description varchar(120),
  issue_date date NOT NULL,
  expiry_date date,
  mlc_declaration_date date,
  mlc_declaration_place varchar(50),
  doc_administration char(3),
  extended_date date,
  file_path_cert varchar(255),
  file_path_draft varchar(255),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active boolean DEFAULT TRUE
);

-- Create table for Findings/Comments
CREATE TABLE IF NOT EXISTS iclass.finding_comment(
  id serial PRIMARY KEY,
  ship_id integer REFERENCES iclass.ship(id) ON DELETE CASCADE,
  company_id integer REFERENCES iclass.organization(id) ON DELETE CASCADE,
  comment_type varchar(2) REFERENCES iclass.comment_type(code) NOT NULL,
  private boolean DEFAULT false,
  certificates varchar(500),
  date_issued date NOT NULL,
  place_issued varchar(50),
  due_date date,
  expiry_survey_audits varchar(500),
  status varchar(2) REFERENCES iclass.comment_status(code) NOT NULL,
  postponed_due_date date,
  postponed_expiry_survey_audits text,
  mms_reference varchar(20),
  subject varchar(500) NOT NULL,
  text varchar(10000) NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- status is now calculated dynamically in api.survey_audits view
CREATE TABLE IF NOT EXISTS iclass.survey_audit(
  id serial PRIMARY KEY,
  cert_code varchar(10) REFERENCES iclass.certificate_survey_pool(code) ON DELETE SET NULL,
  certificate_id integer REFERENCES iclass.certificate(id) ON DELETE CASCADE,
  pool_id integer REFERENCES iclass.survey_pool(id) ON DELETE SET NULL,
  description varchar(120) NOT NULL,
  last_held_date date NOT NULL,
  place_held varchar(50) NOT NULL,
  next_due_date date,
  postponement_date date,
  task_status iclass.task_status_enum,
  range_from_date date,
  range_to_date date,
  fee DECIMAL(9, 2),
  is_ordered boolean DEFAULT FALSE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
