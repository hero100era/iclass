CREATE SEQUENCE IF NOT EXISTS iclass.certificate_id_seq;

CREATE TABLE IF NOT EXISTS iclass.certificates(
  id serial PRIMARY KEY,
  certificate_id integer NOT NULL DEFAULT nextval('iclass.certificate_id_seq'),
  version integer NOT NULL,
  ship_id integer REFERENCES iclass.ships(id) ON DELETE SET NULL,
  company_id integer REFERENCES iclass.organizations(id) ON DELETE SET NULL,
  certifiate_template_code varchar(10) REFERENCES iclass.certificate_templates(code) ON DELETE SET NULL,
  status varchar(2) REFERENCES iclass.certificate_status(code) NOT NULL,
  remark varchar(2) NOT NULL,
  issued_by varchar(20) REFERENCES iclass.classification_societies(code) NOT NULL,
  cert_code varchar(10) REFERENCES iclass.certificate_survey_pool(code) NOT NULL,
  validity_type varchar(2) REFERENCES iclass.certificate_validity_types(code) NOT NULL,
  category varchar(3) REFERENCES iclass.certificate_categories(code) NOT NULL,
  internal_category varchar(3) REFERENCES iclass.certificate_internal_categories(code) NOT NULL,
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