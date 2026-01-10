-- Secure views for API schema
-- These views will automatically respect RLS because they refer to the underlying tables

CREATE OR REPLACE VIEW api.ships AS
SELECT 
  id, name, imo_number, previous_names, build_date, commissioning_date, keel_laid_date,
  contract_date, class_entry_date, administration_types,
  administration_country, classed_by, class_number, port_of_registry,
  date_of_registry, registry_number, call_sign, official_number,
  type_iacs, type_other, type_mms, class_status, ship_status,
  class_notation, service_notation, navigation_notation, addtional_notation,
  gross_tons, national_tons, deadweight,
  registered_owner_id, ism_owner_id, mlc_owner_id, flag_code,
  registration_port, mmsi_number, main_class, net_tons,
  light_ship, ballast_capacity, equipment_number,
  length, length_oa, length_bp, moulded_depth, moulded_breadth,
  moulded_draft, design_draft, dual_class, singal_letter,
  created_at, updated_at, is_active
FROM iclass.ships;

CREATE OR REPLACE VIEW api.certificates AS
SELECT
  id, certificate_id, version, ship_id, company_id, certifiate_template_code,
  status, remark, issued_by, code, validity_type, category, internal_category,
  description, issue_date, expiry_date, mlc_declaration_date, mlc_declaration_place,
  doc_administration, extended_date, file_path_cert, file_path_draft,
  created_at, updated_at, is_active
FROM iclass.certificates;

CREATE OR REPLACE VIEW api.survey_audits AS
SELECT
  id, certificate_id, code, description,
  last_held_date, place_held, next_due_date, postponement_date, status,
  range_from_date, range_to_date, fee, created_at, updated_at, is_active
FROM iclass.survey_audits;

CREATE OR REPLACE VIEW api.documents AS
SELECT
  id, ship_id, company_id, name, type, file_path,
  upload_date, expiry_date, status, created_at, updated_at, is_active
FROM iclass.documents;

CREATE OR REPLACE VIEW api.finding_comments AS
SELECT
  id, ship_id, company_id, comment_type, priviate, certificates,
  date_issued, place_issued, due_date, expiry_survey_audits, status,
  postponed_due_date, postponed_expiry_survey_audits, mms_reference, text,
  created_at, updated_at, is_active
FROM iclass.finding_comments;

CREATE OR REPLACE VIEW api.me AS
SELECT 
    u.id, 
    u.email, 
    u.role, 
    u.category,
    u.is_active,
    CASE 
        WHEN u.role = 'employees' THEN (SELECT display_name FROM iclass.employees WHERE user_id = u.id)
        WHEN u.role = 'customers' THEN (SELECT name FROM iclass.customers WHERE id = u.id)
        WHEN u.role = 'administrations' THEN (SELECT name FROM iclass.flag_staff WHERE id = u.id)
    END as display_name,
    CASE 
        WHEN u.role = 'employees' THEN (SELECT l.name FROM iclass.employees e LEFT JOIN iclass.locations l ON e.location_id = l.id WHERE e.user_id = u.id)
        WHEN u.role = 'administrations' THEN 'Administration'
        ELSE 'External'
    END as location
FROM auth.users u
WHERE u.id = iclass.get_auth_user_id();

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
