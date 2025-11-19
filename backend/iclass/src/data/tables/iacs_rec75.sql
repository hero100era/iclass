CREATE TYPE iclass.administration_types_enum AS ENUM(
  'C',
  'N',
  'O',
  'X',
  'U'
);

CREATE TABLE IF NOT EXISTS iclass.administration_types(
  code iclass.administration_types_enum PRIMARY KEY,
  name varchar(100) NOT NULL
);

INSERT INTO iclass.administration_types(code, name)
  VALUES ('C', 'Civilian'),
('N', 'Naval'),
('O', 'Other'),
('X', 'None'),
('U', 'Unknown')
ON CONFLICT
  DO NOTHING;

CREATE TYPE iclass.class_status_enum AS ENUM(
  'V',
  'S',
  'W'
);

CREATE TABLE iclass.class_status(
  code iclass.class_status_enum PRIMARY KEY,
  name varchar(100) NOT NULL
);

INSERT INTO iclass.class_status(code, name)
  VALUES ('V', 'Valid'),
('S', 'Suspended'),
('W', 'Withdrawn')
ON CONFLICT
  DO NOTHING;

CREATE TYPE iclass.ship_status_enum AS ENUM(
  'E',
  'L',
  'P'
);

CREATE TABLE IF NOT EXISTS iclass.ship_status(
  code iclass.ship_status_enum PRIMARY KEY,
  name varchar(100) NOT NULL
);

INSERT INTO iclass.ship_status(code, name)
  VALUES ('E', 'In Service'),
('L', 'Laid Up'),
('P', 'Withdrawn')
ON CONFLICT
  DO NOTHING;

CREATE TYPE iclass.certificate_status_enum AS ENUM(
  'V',
  'S',
  'W'
);

CREATE TABLE IF NOT EXISTS iclass.certificate_status(
  code iclass.certificate_status_enum PRIMARY KEY,
  name varchar(100) NOT NULL
);

INSERT INTO iclass.certificate_status(code, name)
  VALUES ('V', 'Valid'),
('S', 'Suspended'),
('W', 'Withdrawn')
ON CONFLICT
  DO NOTHING;

CREATE TYPE iclass.certificate_validity_types_enum AS ENUM(
  'F',
  'I',
  'S',
  'C'
);

CREATE TABLE IF NOT EXISTS iclass.certificates_validity_type(
  code iclass.certificate_validity_types_enum PRIMARY KEY,
  name varchar(100) NOT NULL
);

INSERT INTO iclass.certificates_validity_types(code, name)
  VALUES ('F', 'Full Term'),
('I', 'Interim'),
('S', 'Short Term'),
('C', 'Conditional')
ON CONFLICT
  DO NOTHING;

CREATE TYPE iclass.certificate_categories_enum AS ENUM(
  'IC',
  'C',
  'SoC'
);

CREATE TABLE IF NOT EXISTS iclass.certificate_categories(
  code iclass.certificate_categories_enum PRIMARY KEY,
  name varchar(100) NOT NULL
);

INSERT INTO iclass.certificate_categories(code, name)
  VALUES ('IC', 'International Certificates'),
('C', 'Conditional'),
('SoC', 'Statement of Compliance')
ON CONFLICT
  DO NOTHING;

CREATE TYPE iclass.certificate_internal_categories_enum AS ENUM(
  'CL',
  'ST',
  'SI',
  'DoC',
  'SoC'
);

CREATE TABLE IF NOT EXISTS iclass.certificate_internal_categories(
  code iclass.certificate_internal_categories_enum PRIMARY KEY,
  name varchar(100) NOT NULL,
  description text
);

INSERT INTO iclass.certificate_internal_categories(code, name, description)
  VALUES ('CL', 'Classification', 'Certificates of classification issued by the classification society'),
('ST', 'Standard', 'Certificates of conformity to particular requirements issued on the authority of the ships''s flag administration'),
('SI', 'Statement for Issue', 'Statement issued by RO for the purpose of the issue of the actual certificates by the flag administration'),
('Doc', 'Document of Compliance', 'certificates stating that the ships complies with particular requirements even though they are not applicable to the vessel'),
('SoC', 'Statement of Compliance', 'statement issued by RO not on behalf of the flag administration')
ON CONFLICT
  DO NOTHING;

CREATE TYPE iclass.survey_audit_status_enum AS ENUM(
  'D',
  'O',
  'P',
  'B'
);

CREATE TABLE IF NOT EXISTS iclass.survey_audit_status(
  code iclass.survey_audit_status_enum PRIMARY KEY,
  name varchar(100) NOT NULL
);

INSERT INTO iclass.survey_audit_status(code, name)
  VALUES ('D', 'Within Due Date'),
('O', 'Overdue'),
('P', 'Partial'),
('B', 'Before Due Date')
ON CONFLICT
  DO NOTHING;

CREATE TYPE iclass.comment_types_enum AS ENUM(
  'M',
  'C',
  'S',
  'N',
  'D',
  'O'
);

CREATE TABLE IF NOT EXISTS iclass.comment_types(
  code iclass.comment_types_enum PRIMARY KEY,
  name varchar(100) NOT NULL
);

INSERT INTO iclass.comment_types(code, name)
  VALUES ('M', 'Memorandum'),
('C', 'Condition of Class'),
('S', 'Statutory Condition'),
('N', 'Non-conformity'),
('D', 'Deficiency'),
('O', 'Observation')
ON CONFLICT
  DO NOTHING;

CREATE TYPE iclass.comment_status_enum AS ENUM(
  'A',
  'P',
  'O'
);

CREATE TABLE IF NOT EXISTS iclass.comment_status(
  code iclass.comment_status_enum PRIMARY KEY,
  name varchar(100) NOT NULL
);

INSERT INTO iclass.comment_status(code, name)
  VALUES ('A', 'Active'),
('P', 'Postponed'),
('O', 'Overdue')
ON CONFLICT
  DO NOTHING;

-- Create enum for certificates applicability
CREATE TYPE iclass.certificates_applicability_enum AS ENUM(
  'Vessel',
  'Companies'
);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION iclass.update_updated_at_column()
  RETURNS TRIGGER
  AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$
LANGUAGE 'plpgsql';

-- Create table for Classification Societies reference
CREATE TABLE IF NOT EXISTS iclass.classification_societies(
  code varchar(20) PRIMARY KEY,
  name varchar(100) NOT NULL
);

INSERT INTO iclass.classification_societies(code, name)
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

CREATE TYPE iclass.vessel_types_iacs_enum AS ENUM(
  'BC',
  'CT',
  'GC',
  'GT',
  'LC',
  'OT',
  'PS',
  'ZZ'
);

-- Create table for vessel types reference
CREATE TABLE IF NOT EXISTS iclass.vessel_types_iacs(
  code varchar(2) PRIMARY KEY,
  name varchar(100) NOT NULL
);

INSERT INTO iclass.vessel_types_iacs(code, name)
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

CREATE TYPE iclass.vessel_types_mms_enum AS ENUM(
  'BC',
  'CH',
  'CT',
  'GC',
  'MO',
  'OC',
  'OT',
  'PH',
  'PS',
  'PR'
);

-- Create table for MMS vessel types reference
CREATE TABLE IF NOT EXISTS iclass.vessel_types_mms(
  code varchar(2) PRIMARY KEY,
  name varchar(100) NOT NULL
);

INSERT INTO iclass.vessel_types_mms(code, name)
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
CREATE TABLE IF NOT EXISTS iclass.survey_audit_codes(
  code varchar(10) PRIMARY KEY,
  description varchar(100) NOT NULL,
  is_statutory boolean NOT NULL,
  is_audit boolean NOT NULL DEFAULT FALSE,
  is_doc boolean NOT NULL DEFAULT FALSE,
  is_mandatory boolean NOT NULL DEFAULT TRUE
);

INSERT INTO iclass.survey_audit_codes(code, description, is_statutory, is_audit, is_doc, is_mandatory)
  VALUES ('AFS', 'Anti-Fouling System', TRUE, FALSE, FALSE, TRUE),
('BWM', 'Ballast Water Management', TRUE, FALSE, FALSE, TRUE),
('CL', 'Classification', FALSE, FALSE, FALSE, TRUE),
('DSC', 'Dynamically Supported Craft Construction and Equipment', TRUE, FALSE, FALSE, TRUE),
('EU-MRV', 'Monitoring, reporting, and verification of carbon dioxide emissions', TRUE, FALSE, FALSE, FALSE),
('RECYCL_HKC', 'Inventory of Hazardous Materials', TRUE, FALSE, FALSE, TRUE),
('HSC', 'High-Speed Craft Safety', TRUE, FALSE, FALSE, TRUE),
('IBC', 'Fitness for the Carriage of Dangerous Chemicals in Bulk', TRUE, FALSE, FALSE, TRUE),
('IGC', 'Fitness for the Carriage of Liquefied Gases in Bulk', TRUE, FALSE, FALSE, TRUE),
('ILO92', 'ILO92 - Crew Accommodation', TRUE, FALSE, FALSE, FALSE),
('ILO133', 'ILO133 - Crew Accommodation', TRUE, FALSE, FALSE, FALSE),
('ILO152', 'ILO152 - Cargo Gear', TRUE, FALSE, FALSE, FALSE),
('INF', 'Fitness for the Carriage of INF Cargo', TRUE, FALSE, FALSE, TRUE),
('DOC', 'Safety Management - Companies', TRUE, FALSE, FALSE, TRUE),
('SMC', 'Safety Management - Vessel', TRUE, FALSE, TRUE, TRUE),
('ISPS', 'Ships and Port Facility Security', TRUE, FALSE, FALSE, TRUE),
('ISO9001', 'Quality management systems', TRUE, FALSE, TRUE, FALSE),
('ISO14001', 'Environmental management systems', FALSE, FALSE, TRUE, FALSE),
('ISO45001', 'Occupational health and safety management system', FALSE, TRUE, TRUE, FALSE),
('ISO50001', 'Energy management system', TRUE, FALSE, TRUE, FALSE),
('LL', 'International Convention on Load Lines', TRUE, FALSE, TRUE, TRUE),
('OPP', 'Oil Pollution Prevention', TRUE, FALSE, FALSE, TRUE),
('NLS', 'Pollution Prevention for the Carriage of Noxious Liquid Substances in Bulk', TRUE, FALSE, FALSE, TRUE),
('SPP', 'Sewage Pollution Prevention', TRUE, FALSE, FALSE, TRUE),
('GPP', 'Garbage Pollution Prevention', TRUE, FALSE, FALSE, TRUE),
('APP', 'Air Pollution Prevention', TRUE, FALSE, FALSE, TRUE),
('EE', 'Energy Efficiency', TRUE, FALSE, FALSE, TRUE),
('FDCS', 'Fuel Oil Consumption Reporting', TRUE, FALSE, FALSE, TRUE),
('MLC', 'Maritime Labour Convention', TRUE, FALSE, FALSE, TRUE),
('MODU', 'Code for the Construction and Equipment of Mobile Offshore Drilling Units', TRUE, FALSE, FALSE, TRUE),
('POLAR', 'International Code for ships Operating in Polar Waters', TRUE, FALSE, FALSE, TRUE),
('CSS', 'Cargo Ships Safety', TRUE, FALSE, FALSE, TRUE),
('DG', 'For the Carriage of Dangerous Goods', TRUE, FALSE, FALSE, TRUE),
('SC', 'Cargo Ships Safety Construction', TRUE, FALSE, FALSE, TRUE),
('SE', 'Cargo Ships Safety Equipment', TRUE, FALSE, FALSE, TRUE),
('SR', 'Cargo Ships Safety Radio', TRUE, FALSE, FALSE, TRUE),
('PSS', 'Passenger Ships Safety', TRUE, FALSE, FALSE, TRUE),
('SPS', 'Special Purpose Ships Safety', TRUE, FALSE, FALSE, TRUE),
('TM', 'Tonnage', TRUE, FALSE, FALSE, TRUE),
('B', 'Inspection of the outside of the ships''s bottom (dry)', TRUE, FALSE, FALSE, TRUE),
('W', 'Inspection of the outside of the ships''s bottom (iws)', TRUE, FALSE, FALSE, TRUE),
('Tx', 'Tailshaft (x to enable to code several tailshafts T1, T2, etc)', FALSE, FALSE, FALSE, TRUE),
('Box', 'Boiler (x to enable to code several boilers Bo1, Bo2, etc)', FALSE, FALSE, FALSE, TRUE),
('BOT', 'Bottom survey', TRUE, FALSE, FALSE, TRUE)
ON CONFLICT
  DO NOTHING;

CREATE TYPE iclass.survey_audit_types_enum AS ENUM(
  'A',
  'F',
  'I',
  'In',
  'It',
  'O',
  'P',
  'R'
);

-- Create table for Survey/Audit Types
CREATE TABLE IF NOT EXISTS iclass.survey_audit_types(
  code varchar(2) PRIMARY KEY,
  name varchar(100) NOT NULL,
  is_scheduled boolean NOT NULL
);

INSERT INTO iclass.survey_audit_types(code, name, is_scheduled)
  VALUES ('A', 'Annual', TRUE),
('F', 'Final', FALSE),
('I', 'Initial', FALSE),
('In', 'Intermediate', TRUE),
('It', 'Interim', FALSE),
('O', 'Other', FALSE),
('P', 'Periodical', TRUE),
('R', 'Renewal', TRUE)
ON CONFLICT
  DO NOTHING;

-- Create table for companies
CREATE TABLE IF NOT EXISTS iclass.companies(
  pk serial PRIMARY KEY,
  imo_number varchar(7),
  name varchar(80) NOT NULL,
  address varchar(500),
  mlc_responsibility boolean,
  country char(3),
  city varchar(100),
  zip_code varchar(20),
  doc_ships_types varchar(30),
  operation_address1 text,
  operation_address2 text,
  operation_address3 text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create table for ships
CREATE TABLE IF NOT EXISTS iclass.ships(
  pk serial PRIMARY KEY,
  name varchar(40) NOT NULL,
  build_date date,
  keel_laid_date date,
  class_entry_date date,
  imo_number varchar(7),
  administration_types iclass.administration_types_enum NOT NULL,
  administration_country char(3),
  classed_by varchar(20) REFERENCES iclass.classification_societies(code),
  class_number varchar(8),
  port_of_registry varchar(50),
  date_of_registry date,
  registry_number varchar(20),
  call_sign varchar(10),
  type_iacs vessel_types_iacs_enum NOT NULL,
  type_other varchar(50),
  type_mms vessel_types_mms_enum,
  class_status class_status_enum,
  ship_status ship_status_enum,
  class_notation varchar(500),
  gross_tons DECIMAL(9, 2),
  deadweight integer,
  registered_owner_id integer REFERENCES iclass.companies(pk),
  ism_shipsowner_id integer REFERENCES iclass.companies(pk),
  mlc_shipsowner_id integer REFERENCES iclass.companies(pk),
  previous_names varchar(400),
  mmsi_number varchar(10),
  main_class varchar(30),
  net_tons DECIMAL(9, 2),
  light_ships DECIMAL(9, 2),
  ballast_capacity DECIMAL(9, 2),
  equipment_number integer,
  length DECIMAL(9, 2),
  length_oa DECIMAL(9, 2),
  length_bp DECIMAL(9, 2),
  moulded_depth DECIMAL(9, 2),
  moulded_breadth DECIMAL(9, 2),
  moulded_draft DECIMAL(9, 2),
  dual_class varchar(20) REFERENCES iclass.classification_societies(code),
  singal_letter varchar(10),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create table for certificates
CREATE TABLE IF NOT EXISTS iclass.certificates(
  pk serial PRIMARY KEY,
  certificates_id varchar(20) UNIQUE NOT NULL,
  ships_id integer REFERENCES ships(pk),
  companies_id integer REFERENCES iclass.companies(pk),
  status certificate_status_enum NOT NULL,
  remark varchar(2) NOT NULL,
  issued_by varchar(20) REFERENCES iclass.classification_societies(code) NOT NULL,
  code varchar(10) REFERENCES iclass.survey_audit_codes(code) NOT NULL,
  validity_type iclass.certificate_validity_types_enum NOT NULL,
  category iclass.certificate_categories_enum NOT NULL,
  internal_category iclass.certificate_internal_categories_enum NOT NULL,
  description varchar(120),
  issue_date date NOT NULL,
  expiry_date date,
  mlc_declaration_date date,
  mlc_declaration_place varchar(50),
  doc_administration char(3),
  extended_date date,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create table for survey/audit
CREATE TABLE IF NOT EXISTS iclass.survey_audits(
  pk serial PRIMARY KEY,
  certificates_id integer REFERENCES iclass.certificates(pk),
  code varchar(10) REFERENCES iclass.survey_audit_codes(code) NOT NULL,
  type iclass.survey_audit_types_enum,
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
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create table for Findings/Comments
CREATE TABLE IF NOT EXISTS iclass.finding_comments(
  pk serial PRIMARY KEY,
  ships_id integer REFERENCES iclass.ships(pk),
  companies_id integer REFERENCES iclass.companies(pk),
  comment_types iclass.comment_types_enum NOT NULL,
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

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS iclass.idx_ships_imo ON iclass.ships(imo_number);

CREATE INDEX IF NOT EXISTS iclass.idx_ships_class_number ON iclass.ships(class_number);

CREATE INDEX IF NOT EXISTS iclass.idx_certificates_ships_id ON iclass.certificates(ships_id);

CREATE INDEX IF NOT EXISTS iclass.idx_certificates_companies_id ON certificates(companies_id);

CREATE INDEX IF NOT EXISTS iclass.idx_survey_audits_certificates_id ON survey_audits(certificates_id);

CREATE INDEX IF NOT EXISTS iclass.idx_finding_ships_id ON finding_comments(ships_id);

CREATE INDEX IF NOT EXISTS iclass.idx_finding_companies_id ON finding_comments(companies_id);

-- Create updated_at triggers for all tables
CREATE OR REPLACE TRIGGER iclass.update_ships_updated_at
  BEFORE UPDATE ON ships
  FOR EACH ROW
  EXECUTE FUNCTION iclass.update_updated_at_column();

CREATE OR REPLACE TRIGGER iclass.update_companies_updated_at_trigger
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION iclass.update_updated_at_column();

CREATE OR REPLACE TRIGGER iclass.update_certificates_updated_at_trigger
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION iclass.update_updated_at_column();

CREATE OR REPLACE TRIGGER iclass.update_survey_updated_at_trigger
  BEFORE UPDATE ON iclass.survey_audits
  FOR EACH ROW
  EXECUTE FUNCTION iclass.update_updated_at_column();

CREATE OR REPLACE TRIGGER iclass.update_findings_updated_at_trigger
  BEFORE UPDATE ON iclass.finding_comments
  FOR EACH ROW
  EXECUTE FUNCTION iclass.update_updated_at_column();
