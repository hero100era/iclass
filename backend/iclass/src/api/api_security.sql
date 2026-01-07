-- Secure views for API schema
-- These views will automatically respect RLS because they refer to the underlying tables

CREATE OR REPLACE VIEW api.ships AS
SELECT 
  pk, name, imo_number, previous_names, build_date, commissioning_date, keel_laid_date,
  contract_date, class_entry_date, administration_types,
  administration_country, classed_by, class_number, port_of_registry,
  date_of_registry, registry_number, call_sign, official_number,
  type_iacs, type_other, type_mms, class_status, ship_status,
  class_notation, gross_tons, national_tons, deadweight,
  registered_owner_id, ism_owner_id, mlc_owner_id, flag_code,
  registration_port, mmsi_number, main_class, net_tons,
  light_ship, ballast_capacity, equipment_number,
  length, length_oa, length_bp, moulded_depth, moulded_breadth,
  moulded_draft, design_draft, dual_class, singal_letter,
  created_at, updated_at
FROM iclass.ships;

CREATE OR REPLACE VIEW api.certificates AS
SELECT
  pk, certificate_id, ship_id, company_id, status, remark, issued_by,
  code, validity_type, category, internal_category, description,
  issue_date, expiry_date, extended_date,
  created_at, updated_at
FROM iclass.certificates;

CREATE OR REPLACE VIEW api.survey_audits AS
SELECT
  pk, certificate_id, code, type, description,
  last_held_date, place_held, next_due_date, postponement_date, status,
  range_from_date, range_to_date, fee, created_at, updated_at
FROM iclass.survey_audits;

CREATE OR REPLACE VIEW api.documents AS
SELECT
  pk, ship_id, company_id, name, type, file_path,
  upload_date, expiry_date, status, created_at, updated_at
FROM iclass.documents;

CREATE OR REPLACE VIEW api.finding_comments AS
SELECT
  pk, ships_id, companies_id, comment_type, priviate, certificates,
  date_issued, place_issued, due_date, expiry_survey_audits, status,
  postponed_due_date, postponed_expiry_survey_audits, mms_reference, text,
  created_at, updated_at
FROM iclass.finding_comments;

CREATE OR REPLACE VIEW api.me AS
SELECT 
    u.pk as id, 
    u.email, 
    u.role, 
    u.category,
    u.is_active,
    CASE 
        WHEN u.role = 'employees' THEN (SELECT display_name FROM iclass.employees WHERE pk = u.pk)
        WHEN u.role = 'customers' THEN (SELECT name FROM iclass.customers WHERE pk = u.pk)
        WHEN u.role = 'administrations' THEN (SELECT name FROM iclass.flag_staff WHERE pk = u.pk)
    END as display_name,
    CASE 
        WHEN u.role = 'employees' THEN (SELECT office_location FROM iclass.employees WHERE pk = u.pk)
        WHEN u.role = 'administrations' THEN 'Administration'
        ELSE 'External'
    END as location
FROM auth.users u
WHERE u.pk = iclass.get_auth_user_pk();

-- Grants
GRANT SELECT ON api.ships TO employees, customers, administrations;
GRANT SELECT ON api.certificates TO employees, customers, administrations;
GRANT SELECT ON api.survey_audits TO employees, customers, administrations;
GRANT SELECT ON api.documents TO employees, customers, administrations;
GRANT SELECT ON api.finding_comments TO employees, customers, administrations;
GRANT SELECT ON api.me TO employees, customers, administrations;

-- Add INSERT/UPDATE grants for employees
GRANT INSERT, UPDATE, DELETE ON api.ships TO employees;
GRANT INSERT, UPDATE, DELETE ON api.certificates TO employees;
GRANT INSERT, UPDATE, DELETE ON api.survey_audits TO employees;
GRANT INSERT, UPDATE, DELETE ON api.documents TO employees;
GRANT INSERT, UPDATE, DELETE ON api.finding_comments TO employees;

-- Customers can only read
-- (Actually, RLS handles the 'which' rows, GRANT handles the 'what' actions)
