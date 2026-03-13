CREATE EXTENSION IF NOT EXISTS "ltree";

CREATE TABLE IF NOT EXISTS iclass.administration_type(
  code varchar(2) PRIMARY KEY,
  name varchar(100) NOT NULL
);

--recommend only use char in "C N O X U" for code.
INSERT INTO iclass.administration_type(code, name)
  VALUES ('C', 'Civilian'),
('N', 'Naval'),
('O', 'Other'),
('X', 'None'),
('U', 'Unknown')
ON CONFLICT
  DO NOTHING;


CREATE TABLE IF NOT EXISTS iclass.class_status(
  code varchar(2) PRIMARY KEY,
  name varchar(100) NOT NULL
);

--recommend only use char in "V S W" for code.
INSERT INTO iclass.class_status(code, name)
  VALUES ('V', 'Valid'),
('S', 'Suspended'),
('W', 'Withdrawn')
ON CONFLICT
  DO NOTHING;

CREATE TABLE IF NOT EXISTS iclass.ship_status(
  code varchar(2) PRIMARY KEY,
  name varchar(100) NOT NULL
);

--recommend only use char in "E L P" for code.
INSERT INTO iclass.ship_status(code, name)
  VALUES ('E', 'In Service'),
('L', 'Laid Up'),
('P', 'Withdrawn')
ON CONFLICT
  DO NOTHING;

CREATE TABLE IF NOT EXISTS iclass.certificate_status(
  code varchar(2) PRIMARY KEY,
  name varchar(100) NOT NULL
);

--recommend only use char in "V S W" for code.
INSERT INTO iclass.certificate_status(code, name)
  VALUES ('V', 'Valid'),
('S', 'Suspended'),
('W', 'Withdrawn')
ON CONFLICT
  DO NOTHING;

CREATE TABLE IF NOT EXISTS iclass.certificate_validity_type(
  code varchar(2) PRIMARY KEY,
  name varchar(100) NOT NULL
);

--recommend only use char in "F I S C" for code.
INSERT INTO iclass.certificate_validity_type(code, name)
  VALUES ('F', 'Full Term'),
('I', 'Interim'),
('S', 'Short Term'),
('C', 'Conditional')
ON CONFLICT
  DO NOTHING;

CREATE TABLE IF NOT EXISTS iclass.certificate_category(
  code varchar(3) PRIMARY KEY,
  name varchar(100) NOT NULL
);

--recommend only use char in "IC C SoC" for code.
INSERT INTO iclass.certificate_category(code, name)
  VALUES ('IC', 'International Certificates'),
('C', 'Conditional'),
('SoC', 'Statement of Compliance')
ON CONFLICT
  DO NOTHING;

CREATE TABLE IF NOT EXISTS iclass.certificate_internal_category(
  code varchar(3) PRIMARY KEY,
  name varchar(100) NOT NULL,
  description text
);

--recommend only use char in "CL ST SI DoC SoC OT" for code.
INSERT INTO iclass.certificate_internal_category(code, name, description)
  VALUES ('CL', 'Classification', 'Certificates of classification issued by the classification society'),
('ST', 'Standard', 'Certificates of conformity to particular requirements issued on the authority of the ships''s flag administration'),
('SI', 'Statement for Issue', 'Statement issued by RO for the purpose of the issue of the actual certificates by the flag administration'),
('DoC', 'Document of Compliance', 'certificates stating that the ships complies with particular requirements even though they are not applicable to the vessel'),
('SoC', 'Statement of Compliance', 'statement issued by RO not on behalf of the flag administration'),
('OT', 'Other', 'Other certificates')
ON CONFLICT
  DO NOTHING;


CREATE TABLE IF NOT EXISTS iclass.certificate_action (
  code varchar(3) PRIMARY KEY,
  name varchar(100) NOT NULL
);

INSERT INTO iclass.certificate_action (code, name) VALUES
('I','Issued'),
('EN', 'Endorsed'),
('S', 'Statement for Endorsement'),
('W', 'Withdrawn'),
('EX', 'Extended'),
('RI', 'Registered')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS iclass.survey_audit_status(
  code varchar(2) PRIMARY KEY,
  name varchar(100) NOT NULL
);

--recommend only use char in "D O P B" for code.
INSERT INTO iclass.survey_audit_status(code, name)
  VALUES ('D', 'Within Due Date'),
('O', 'Overdue'),
('P', 'Partial'),
('B', 'Before Due Date')
ON CONFLICT
  DO NOTHING;

CREATE TABLE IF NOT EXISTS iclass.comment_type(
  code varchar(2) PRIMARY KEY,
  name varchar(100) NOT NULL
);

--recommend only use char in "M C S N D O" for code.
INSERT INTO iclass.comment_type(code, name)
  VALUES ('M', 'Memorandum'),
('C', 'Class Condition'),
('S', 'Statutory Condition'),
('N', 'Non-conformity'),
('D', 'Deficiency'),
('O', 'Observation'),
('R', 'Retroactive Requirement')
ON CONFLICT
  DO NOTHING;

CREATE TABLE IF NOT EXISTS iclass.comment_status(
  code varchar(1) PRIMARY KEY,
  name varchar(30) NOT NULL
);

--recommend only use char in "A P O" for code.
INSERT INTO iclass.comment_status(code, name)
  VALUES ('A', 'Active'),
('P', 'Postponed'),
('O', 'Overdue')
ON CONFLICT
  DO NOTHING;

-- Create enum for certificates applicability
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'certificate_applicability_enum') THEN
      CREATE TYPE iclass.certificate_applicability_enum AS ENUM(
        'Vessel',
        'Company'
      );
  END IF;
END $$;

-- Create table for Classification Societies reference
CREATE TABLE IF NOT EXISTS iclass.classification_society(
  code varchar(20) PRIMARY KEY,
  name varchar(100) NOT NULL
);

INSERT INTO iclass.classification_society(code, name)
  VALUES ('ABS', 'American Bureau of Shipsping'),
('BV', 'Bureau Veritas'),
('CCS', 'China Classification Society'),
('CRS', 'Croatian Register of Shipsping'),
('IRS', 'Indian Register of Shipsping'),
('KR', 'Korean Register of Shipsping'),
('LR', 'Lloyd''s Register of Shipsping'),
('NK', 'Nippon Kaiji Kyokai'),
('PRS', 'Polish Register of Shipsping'),
('RINA', 'RRINA Services S.p.A.'),
('RS', 'Russian Maritime Register of Shipsping'),
('VL', 'DNV GL')
ON CONFLICT
  DO NOTHING;

-- Create table for vessel types reference
CREATE TABLE IF NOT EXISTS iclass.vessel_type_iacs(
  code varchar(2) PRIMARY KEY,
  name varchar(100) NOT NULL
);

--recommend only use char in "BC CT GC GT LC OT PS ZZ" for code.
INSERT INTO iclass.vessel_type_iacs(code, name)
  VALUES ('BC', 'Bulk carrier (all combinations OB, OBO,OO)'),
('CT', 'Chemical tanker'),
('GC', 'General cargo vessel (including ro-ro cargo, container, reefer, HSC cargo)'),
('GT', 'Gas tanker'),
('LC', 'Other bulk liquid carrier'),
('OT', 'Oil tanker'),
('PS', 'Passenger vessel (including Passenger/General cargo, Passenger/ro-ro, Passenger HSC)'),
('ZZ', 'Other vessel type')
ON CONFLICT
  DO NOTHING;

-- Create table for MMS vessel types reference
CREATE TABLE IF NOT EXISTS iclass.vessel_type_mms(
  code varchar(2) PRIMARY KEY,
  name varchar(100) NOT NULL
);

--recommend only use char in "BC CH CT GC MO OC OT PH PS PR" for code.
INSERT INTO iclass.vessel_type_mms(code, name)
  VALUES ('BC', 'Bulk carrier'),
('CH', 'Cargo high speed craft'),
('CT', 'Chemical tanker'),
('GC', 'Gas carrier'),
('MO', 'Mobile offshore drilling unit'),
('OC', 'Other cargo ships'),
('OT', 'Oil tanker'),
('PH', 'Passenger high speed craft'),
('PS', 'Passenger ships'),
('PR', 'Ro-ro cargo ships')
ON CONFLICT
  DO NOTHING;

-- Create table for Survey/Audit Codes
CREATE TABLE IF NOT EXISTS iclass.certificate_survey_pool(
  code varchar(10) PRIMARY KEY,
  description varchar(100) NOT NULL
);

INSERT INTO iclass.certificate_survey_pool(code, description)
  VALUES ('AFS', 'Anti-Fouling System'),
('BWM', 'Ballast Water Management'),
('CL', 'Classification'),
('DSC', 'Dynamically Supported Craft Construction and Equipment'),
('EU-MRV', 'Monitoring, reporting, and verification of carbon dioxide emissions'),
('RECYCL_HKC', 'Inventory of Hazardous Materials'),
('HSC', 'High-Speed Craft Safety'),
('IBC', 'Fitness for the Carriage of Dangerous Chemicals in Bulk'),
('IMSBC', 'International Maritime Solid Bulk Cargoes'),
('IGC', 'Fitness for the Carriage of Liquefied Gases in Bulk'),
('ILO92', 'ILO92 - Crew Accommodation'),
('ILO133', 'ILO133 - Crew Accommodation'),
('ILO152', 'ILO152 - Cargo Gear'),
('INF', 'Fitness for the Carriage of INF Cargo'),
('DOC', 'Safety Management - Company'),
('SMC', 'Safety Management - Vessel'),
('ISPS', 'Ships and Port Facility Security'),
('ISO9001', 'Quality management systems'),
('ISO14001', 'Environmental management systems'),
('ISO45001', 'Occupational health and safety management system'),
('ISO50001', 'Energy management system'),
('LL', 'International Convention on Load Lines'),
('OPP', 'Oil Pollution Prevention'),
('OPP-T', 'Oil Pollution Prevention - Tanker'),
('NLS', 'Pollution Prevention for the Carriage of Noxious Liquid Substances in Bulk'),
('SPP', 'Sewage Pollution Prevention'),
('GPP', 'Garbage Pollution Prevention'),
('APP', 'Air Pollution Prevention'),
('EE', 'Energy Efficiency'),
('FDCS', 'Fuel Oil Consumption Reporting'),
('MLC', 'Maritime Labour Convention'),
('MODU', 'Code for the Construction and Equipment of Mobile Offshore Drilling Units'),
('POLAR', 'International Code for ships Operating in Polar Waters'),
('CSS', 'Cargo Ships Safety'),
('DG', 'For the Carriage of Dangerous Goods'),
('SC', 'Cargo Ships Safety Construction'),
('SE', 'Cargo Ships Safety Equipment'),
('SR', 'Cargo Ships Safety Radio'),
('PSS', 'Passenger Ships Safety'),
('SPS', 'Special Purpose Ships Safety'),
('TM', 'Tonnage'),
('B', 'Inspection of the outside of the ship''s bottom (DRY)'),
('W', 'Inspection of the outside of the ship''s bottom (IWS)'),
('T', 'Tailshaft Survey'),
('T1', 'Tailshaft Survey(No.1)'),
('T2', 'Tailshaft Survey(No.2)'),
('T3', 'Tailshaft Survey(No.3)'),
('T4', 'Tailshaft Survey(No.4)'),
('T5', 'Tailshaft Survey(No.5)'),
('T6', 'Tailshaft Survey(No.6)'),
('Bo', 'Boiler Survey'),
('Bo1', 'Boiler Survey(No.1)'),
('Bo2', 'Boiler Survey(No.2)'),
('Bo3', 'Boiler Survey(No.3)'),
('Bo4', 'Boiler Survey(No.4)'),
('Bo5', 'Boiler Survey(No.5)'),
('Bo6', 'Boiler Survey(No.6)'),
('BOT', 'Bottom survey'),
('REFCS','Refrigerated Cargo System')
ON CONFLICT
  DO NOTHING;

-- Create table for Survey/Audit Types
CREATE TABLE IF NOT EXISTS iclass.survey_audit_type(
  code varchar(2) PRIMARY KEY,
  name varchar(100) NOT NULL,
  is_scheduled boolean NOT NULL
);

--recommend only use char in "A F I In It O Ad P R" for code.
INSERT INTO iclass.survey_audit_type(code, name, is_scheduled)
  VALUES ('A', 'Annual', TRUE),
('F', 'Final', FALSE),
('I', 'Initial', FALSE),
('In', 'Intermediate', TRUE),
('It', 'Interim', FALSE),
('O', 'Other', FALSE),
('Ad', 'Additional', FALSE),
('P', 'Periodical', TRUE),
('R', 'Renewal', TRUE)
ON CONFLICT
  DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status_enum') THEN
    CREATE TYPE iclass.task_status_enum AS ENUM (
      'draft',
      'submitted',
      'accepted',
      'partial',
      'assigned',
      'scheduled',
      'planning',
      'executing',
      'pending_review',
      'approved',
      'completed',
      'cancelled',
      'rejected'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'data_type_enum') THEN
  CREATE TYPE iclass.data_type_enum AS ENUM (
    'text',
    'integer',
    'decimal',
    'boolean',
    'date',
    'datetime',
    'selection',     -- dropdown / single select
    'multi_select'
  );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS iclass.flag(
  code varchar(3) PRIMARY KEY,
  name varchar(20) NOT NULL,
  fullname varchar(100) NOT NULL,
  email varchar(50),
  tel varchar(30),
  fax varchar(30),
  contact varchar(100),
  contract_file varchar(128),
  contract_start date,
  contract_end date,
  is_hssc BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS iclass.certificate_template (
  code varchar(10) PRIMARY KEY,
  name varchar(100) NOT NULL,
  version varchar(20) NOT NULL,
  cert_code varchar(10) REFERENCES iclass.certificate_survey_pool(code),
  validity_type varchar(2) REFERENCES iclass.certificate_validity_type(code),
  category varchar(3) REFERENCES iclass.certificate_category(code),
  internal_category varchar(2) REFERENCES iclass.certificate_internal_category(code),
  file_path_xml varchar(255),
  file_path_html varchar(255),
  file_path_pdf varchar(255),
  description text,
  applicability iclass.certificate_applicability_enum,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS iclass.survey_pool (
  id serial PRIMARY KEY,
  code varchar(20) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  description text,
  fee DECIMAL(9, 2),
  cert_code varchar(10) REFERENCES iclass.certificate_survey_pool(code) ON DELETE SET NULL,
  type varchar(2) REFERENCES iclass.survey_audit_type(code),
  period INTERVAL,
  window_before INTERVAL,
  window_after INTERVAL,
  is_statutory boolean DEFAULT FALSE,
  is_audit boolean DEFAULT FALSE,
  is_doc boolean DEFAULT FALSE,
  is_mandatory boolean DEFAULT FALSE,
  is_periodical boolean DEFAULT TRUE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT unique_mandatory_survey_audit UNIQUE (cert_code, type)
);

CREATE TABLE IF NOT EXISTS iclass.report_template (
  code varchar(10) PRIMARY KEY,
  survey_id integer NOT NULL REFERENCES iclass.survey_pool(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  version varchar(20) NOT NULL,
  file_path_rml varchar(255),
  file_path_html varchar(255),
  file_path_pdf varchar(255),
  description text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS iclass.checklist_result (
  code varchar(2) PRIMARY KEY,
  description varchar(200) NOT NULL
);

INSERT INTO iclass.checklist_result(code, description)
VALUES ('N', 'Not inspected (item will be listed as "pending" in the Ship Status)'),
('PI', 'Partially inspected (item will be listed as "partially inspected" in the Ship Status)'),
('X', 'Inspected and found in order (or Yes if the item requires a Yes/No answer)'),
('D', 'Damaged and/or deficient, to be detailed in the narrative form'),
('R', 'Repaired, to be detailed in the narrative form'),
('NA', 'Not Applicable (not required by the rules or considered not necessary by the Surveyor when allowed by rules)'),
('NS', 'Not requested by the rules or not fitted on board'),
('OS', 'Out of Service (not in service)')
ON CONFLICT
  DO NOTHING;

CREATE TABLE IF NOT EXISTS iclass.breakdown_template (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(50)  NOT NULL UNIQUE,       -- e.g., 'TMPL-BULK-001'
  name            VARCHAR(200) NOT NULL,               -- e.g., 'Bulk Carrier Standard Breakdown'
  description     TEXT,
  vessel_type     VARCHAR(100),                        -- e.g., 'Bulk Carrier', 'Tanker', 'Container'
  version         VARCHAR(20)      NOT NULL DEFAULT '1.0',
  is_active       BOOLEAN   NOT NULL DEFAULT TRUE,
  -- Versioning / lineage
  parent_template_id integer REFERENCES iclass.breakdown_template(id) ON DELETE SET NULL,  -- if cloned from another template

  created_by      VARCHAR(100),
  updated_by      VARCHAR(100),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_template_code_version UNIQUE (code, version)
);

CREATE TABLE IF NOT EXISTS iclass.breakdown_template_node(
  id              SERIAL PRIMARY KEY,
  template_id     integer  NOT NULL REFERENCES iclass.breakdown_template(id) ON DELETE CASCADE,
  parent_node_id  integer  REFERENCES iclass.breakdown_template_node(id) ON DELETE CASCADE,

  -- Identification
  code            VARCHAR(50)  NOT NULL,                -- e.g., 'TK-001', 'ME-001'
  name            VARCHAR(200) NOT NULL,                -- e.g., 'No.1 Port Ballast Tank'
  description     TEXT,

  -- Classification
  category        VARCHAR(100),  -- e.g., 'tank', 'cargo_space', 'equipment', 'system',
  node_type       VARCHAR(50),   -- more granular: 'fuel_oil_tank', 'main_engine', etc.

  -- Hierarchy & ordering
  level           INTEGER      NOT NULL DEFAULT 0,      -- depth in tree (0 = root)
  sort_order      INTEGER      NOT NULL DEFAULT 0,      -- sibling ordering
  is_instantiable     BOOLEAN         NOT NULL DEFAULT TRUE,
  default_quantity    INTEGER         NOT NULL DEFAULT 1,  -- how many to create by default
  -- path      LTREE,                                 -- materialized path for fast queries
  is_active BOOLEAN  NOT NULL DEFAULT TRUE,

  -- Metadata as JSONB for flexible template properties
  metadata        JSONB        DEFAULT '{}',  -- metadata for flexible template properties
  is_mandatory     BOOLEAN     NOT NULL DEFAULT TRUE,    -- must this node exist when applied?
  is_leaf          BOOLEAN     NOT NULL DEFAULT FALSE,   -- hint: no children expected
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_template_node_code UNIQUE (template_id, code),
  CONSTRAINT chk_no_self_parent CHECK (id != parent_node_id)
);
-- ---------------------------------------------
--Breakdown Template Item Particulars (key-value specs)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS iclass.breakdown_template_node_particular (
  id              SERIAL PRIMARY KEY,
  template_node_id integer NOT NULL REFERENCES iclass.breakdown_template_node(id) ON DELETE CASCADE,

  attr_key   VARCHAR(20) NOT NULL,               -- e.g., 'material', 'coating_type'
  attr_title VARCHAR(200) NOT NULL,
  data_type   iclass.data_type_enum NOT NULL,         -- TEXT, NUMBER, BOOLEAN, DATE, JSON
  default_value TEXT,                                  -- default value
  selection_options    JSONB,                          -- for selection/multi_select types
                                                        -- e.g., ["good","fair","poor"]
  unit            VARCHAR(20),
  is_required     BOOLEAN      NOT NULL DEFAULT FALSE,
  sort_order      INTEGER      NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_tnode_attr UNIQUE (template_node_id, attr_key)
);

CREATE TABLE IF NOT EXISTS iclass.checklist_section (
  id serial PRIMARY KEY,
  survey_id integer REFERENCES iclass.survey_pool(id),
  code varchar(50) NOT NULL,
  section_number VARCHAR(20) NOT NULL, -- e.g., '1.1.1', '2.2.2'
  title TEXT NOT NULL, -- e.g., 'Examination of plans and designs'
  description text,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS iclass.checklist_item (
  id serial PRIMARY KEY,
  code varchar(100),
  item_number integer NOT NULL,
  section_id integer REFERENCES iclass.checklist_section(id) ON DELETE CASCADE,
  content varchar(1000),
  description text,
  breakdown_template_node_id integer REFERENCES iclass.breakdown_template_node(id) ON DELETE SET NULL,
  reg_reference text,
  referenced_item_id integer REFERENCES iclass.checklist_item(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS iclass.checklist_item_particular (
  id SERIAL PRIMARY KEY,
  checklist_item_id   BIGINT NOT NULL REFERENCES iclass.checklist_item(id) ON DELETE CASCADE,
  attr_key            VARCHAR(100)    NOT NULL,
  attr_title          VARCHAR(300)    NOT NULL,
  data_type           iclass.data_type_enum  NOT NULL DEFAULT 'text',
  unit                VARCHAR(50),
  default_value       TEXT,
  selection_options    JSONB,                            -- for selection/multi_select
  is_required         BOOLEAN         NOT NULL DEFAULT TRUE,
  sort_order          INTEGER         NOT NULL DEFAULT 0,
  description         TEXT,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (checklist_item_id, attr_key)
);


CREATE TABLE IF NOT EXISTS iclass.flag_cert_authorization (
  id SERIAL PRIMARY KEY,
  flag_code varchar(3)  NOT NULL REFERENCES iclass.flag(code) ON DELETE CASCADE,
  cert_code varchar(10) NOT NULL REFERENCES iclass.certificate_survey_pool(code) ON DELETE CASCADE,
  validity_type varchar(2) REFERENCES iclass.certificate_validity_type(code),
  category varchar(3) REFERENCES iclass.certificate_category(code),
  internal_category varchar(2) REFERENCES iclass.certificate_internal_category(code),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS iclass.flag_survey_authorization (
  id SERIAL PRIMARY KEY,
  flag_code varchar(3) NOT NULL REFERENCES iclass.flag(code) ON DELETE CASCADE,
  cert_code varchar(10) NOT NULL REFERENCES iclass.certificate_survey_pool(code) ON DELETE CASCADE,
  survey_type varchar(2) REFERENCES iclass.survey_audit_type(code),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS iclass.survey_preparation_section (
  id SERIAL PRIMARY KEY,
  survey_id integer NOT NULL REFERENCES iclass.survey_pool(id) ON DELETE CASCADE,
  code varchar(100),
  category varchar(20), --- Accommodation, Deck, Machinery, ER, Bridge, Office, CH, Tank, General.
  content varchar(1000),
  description text,
  guidance text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS iclass.survey_preparation (
  id SERIAL PRIMARY KEY,
  survey_id integer NOT NULL REFERENCES iclass.survey_pool(id) ON DELETE CASCADE,
  code varchar(100),
  category varchar(2), --- AC(Accommodation), DE(Deck), MA(Machinery), ER(Engine Room), BR(Bridge), OF(Office), CH(Cargo Hold), TA(Tank), GE(General).
  description text,
  guidance text,
  remarks text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS iclass.survey_documentation(
  id SERIAL PRIMARY KEY,
  survey_id integer NOT NULL REFERENCES iclass.survey_pool(id) ON DELETE CASCADE,
  code varchar(100),
  description text,
  guidance text,
  remarks text,
  file_path varchar(255),
  is_mandatory boolean DEFAULT TRUE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
