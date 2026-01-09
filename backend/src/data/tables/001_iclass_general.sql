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

CREATE TABLE IF NOT EXISTS iclass.certificates_validity_types(
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
  'SoC',
  'OT'
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
('DoC', 'Document of Compliance', 'certificates stating that the ships complies with particular requirements even though they are not applicable to the vessel'),
('SoC', 'Statement of Compliance', 'statement issued by RO not on behalf of the flag administration'),
('OT', 'Other', 'Other certificates')
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
('DOC', 'Safety Management - Company', TRUE, FALSE, FALSE, TRUE),
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
('B', 'Inspection of the outside of the ship''s bottom (dry)', TRUE, FALSE, FALSE, TRUE),
('W', 'Inspection of the outside of the ship''s bottom (iws)', TRUE, FALSE, FALSE, TRUE),
('T1', 'Tailshaft No.1', FALSE, FALSE, FALSE, TRUE),
('T2', 'Tailshaft No.2', FALSE, FALSE, FALSE, TRUE),
('T3', 'Tailshaft No.3', FALSE, FALSE, FALSE, TRUE),
('T4', 'Tailshaft No.4', FALSE, FALSE, FALSE, TRUE),
('Bo1', 'Boiler No.1', FALSE, FALSE, FALSE, TRUE),
('Bo2', 'Boiler No.2', FALSE, FALSE, FALSE, TRUE),
('Bo3', 'Boiler No.3', FALSE, FALSE, FALSE, TRUE),
('Bo4', 'Boiler No.4', FALSE, FALSE, FALSE, TRUE),
('Bo5', 'Boiler No.5', FALSE, FALSE, FALSE, TRUE),
('Bo6', 'Boiler No.6', FALSE, FALSE, FALSE, TRUE),
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

CREATE TABLE IF NOT EXISTS iclass.flags(
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
  hssc boolean
);


CREATE TABLE IF NOT EXISTS iclass.checklist_templates (
  id serial PRIMARY KEY,
  category varchar(5),
  code varchar(10) UNIQUE,
  content varchar(1000),
  description text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS iclass.certificate_templates (
  code varchar(10) PRIMARY KEY,
  name varchar(100) NOT NULL,
  version varchar(20) NOT NULL,
  survey_audit_code varchar(10) REFERENCES iclass.survey_audit_codes(code),
  category iclass.certificate_internal_categories_enum,
  file_path_rml varchar(255),
  file_path_html varchar(255),             
  description text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS iclass.report_templates (
  code varchar(10) PRIMARY KEY,
  name varchar(100) NOT NULL,
  version varchar(20) NOT NULL,
  file_path_rml varchar(255),
  file_path_html varchar(255),
  description text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS iclass.ship_comp_templates (
  code varchar(10) PRIMARY KEY,
  name varchar(100) NOT NULL,
  properties json,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

