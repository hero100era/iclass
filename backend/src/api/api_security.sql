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
  status, remark, issued_by, cert_code, validity_type, category, internal_category,
  description, issue_date, expiry_date, mlc_declaration_date, mlc_declaration_place,
  doc_administration, extended_date, file_path_cert, file_path_draft,
  created_at, updated_at, is_active
FROM iclass.certificates;

CREATE OR REPLACE VIEW api.survey_audits AS
SELECT
  s.id, s.certificate_id, s.pool_id, s.description,
  s.last_held_date, s.place_held, s.next_due_date, s.postponement_date,
  s.task_status,
  CASE
    WHEN s.task_status = 'partial' THEN 'P'
    WHEN CURRENT_DATE < s.range_from_date THEN 'B'
    WHEN CURRENT_DATE >= s.range_from_date AND CURRENT_DATE <= s.range_to_date THEN 'D'
    WHEN CURRENT_DATE > s.range_to_date AND (s.postponement_date IS NULL OR CURRENT_DATE > s.postponement_date) THEN 'O'
    WHEN CURRENT_DATE > s.range_to_date AND CURRENT_DATE <= s.postponement_date THEN 'D'
    ELSE 'O'
  END AS status,
  s.range_from_date, s.range_to_date, s.fee, s.is_ordered, s.created_at, s.updated_at, s.is_active, 
  p.code, p.cert_code,
  c.ship_id, c.company_id
FROM iclass.survey_audits s
LEFT JOIN iclass.survey_pool p ON s.pool_id = p.id
LEFT JOIN iclass.certificates c ON s.certificate_id = c.id;

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

CREATE OR REPLACE VIEW api.survey_requests AS
SELECT
  id, ship_id, company_id, ordered_by_id, location, estimated_date,
  contact_person, contact_phone, contact_email, alternative_contact,
  alternative_person, alternative_phone, alternative_email, alternative_mobile,
  is_assigned, comments, file_path, status, created_at, updated_at, is_active
FROM iclass.survey_requests;

CREATE OR REPLACE VIEW api.survey_request_carts AS
SELECT
  id, ship_id, company_id, survey_request_id, survey_audit_id, comment_id, occ_survey_code
FROM iclass.survey_request_carts;

CREATE OR REPLACE VIEW api.survey_pool AS
SELECT
  id, code, name, description, fee, is_active, is_mandatory, cert_code
FROM iclass.survey_pool
WHERE is_active = TRUE;

CREATE OR REPLACE VIEW api.jobs AS
SELECT
  id, file_path_report, file_path_draft, comments, additional,
  location, fee, job_status, created_at, updated_at, is_active
FROM iclass.jobs;

CREATE OR REPLACE VIEW api.survey_jobs AS
SELECT
  id, job_id, ship_id, surveyor_id, reviewer_id, initialized
FROM iclass.survey_jobs;

CREATE OR REPLACE VIEW api.audit_jobs AS
SELECT
  id, job_id, ship_id, company_id, auditor_id, reviewer_id, initialized
FROM iclass.audit_jobs;

CREATE OR REPLACE VIEW api.survey_lines AS
SELECT
  id, job_id, survey_audit_id, pool_id, initialized, credit_periodical
FROM iclass.survey_lines;

CREATE OR REPLACE VIEW api.audit_lines AS
SELECT
  id, job_id, survey_audit_id, pool_id, initialized, credit_periodical
FROM iclass.audit_lines;

CREATE OR REPLACE VIEW api.job_participants AS
SELECT
  id, survey_job_id, audit_job_id, employee_id, is_monitor, is_trainee
FROM iclass.job_participants;

CREATE OR REPLACE VIEW api.comment_lines AS
SELECT
  id, job_id, finding_comment_id, created_at, updated_at
FROM iclass.comment_lines;

-- Consolidated view for surveyor's job list
CREATE OR REPLACE VIEW api.surveyor_jobs AS
SELECT
    j.id,
    j.location,
    j.job_status,
    j.created_at,
    j.updated_at,
    'Survey'::text as job_type,
    sj.ship_id,
    s.name as ship_name,
    NULL::integer as company_id,
    NULL::text as company_name,
    sj.surveyor_id as personnel_id
FROM iclass.jobs j
JOIN iclass.survey_jobs sj ON j.id = sj.job_id
LEFT JOIN iclass.ships s ON sj.ship_id = s.id
UNION ALL
SELECT
    j.id,
    j.location,
    j.job_status,
    j.created_at,
    j.updated_at,
    'Audit'::text as job_type,
    aj.ship_id,
    s.name as ship_name,
    aj.company_id,
    o.name as company_name,
    aj.auditor_id as personnel_id
FROM iclass.jobs j
JOIN iclass.audit_jobs aj ON j.id = aj.job_id
LEFT JOIN iclass.ships s ON aj.ship_id = s.id
LEFT JOIN iclass.organizations o ON aj.company_id = o.id;

CREATE OR REPLACE VIEW api.employees AS
SELECT
  id, user_id, first_name, last_name, display_name, email, job_title_id, department_id, location_id, is_active
FROM iclass.employees;

CREATE OR REPLACE VIEW api.organizations AS
SELECT
  id, name, display_name, domain, imo_number, is_active
FROM iclass.organizations;

CREATE OR REPLACE VIEW api.checklist_sections AS
SELECT
  id, survey_id, code, section_number, title, is_active
FROM iclass.checklist_sections;

CREATE OR REPLACE VIEW api.checklist_items AS
SELECT
  id, code, item_number, section_id, content, description, particulars, reg_reference, referenced_item_id, created_at, updated_at, is_active
FROM iclass.checklist_items;

CREATE OR REPLACE VIEW api.survey_checklists AS
SELECT
  id, survey_line_id, survey_audit_id, survey_job_id, item_id, result, particulars, report_by, report_at
FROM iclass.survey_checklists;

CREATE OR REPLACE VIEW api.audit_checklists AS
SELECT
  id, audit_line_id, survey_audit_id, audit_job_id, item_id, result, particulars, report_by, report_at
FROM iclass.audit_checklists;

CREATE OR REPLACE VIEW api.checklist_results AS
SELECT
  code, description
FROM iclass.checklist_results;

-- Grants
GRANT SELECT ON api.ships TO employees, customers, administrations;
GRANT SELECT ON api.certificates TO employees, customers, administrations;
GRANT SELECT ON api.survey_audits TO employees, customers, administrations;
GRANT SELECT ON api.documents TO employees, customers, administrations;
GRANT SELECT ON api.finding_comments TO employees, customers, administrations;
GRANT SELECT ON api.me TO employees, customers, administrations;
GRANT SELECT, INSERT ON api.survey_requests TO employees, customers;
GRANT SELECT, INSERT ON api.survey_request_carts TO employees, customers;
GRANT SELECT ON api.survey_pool TO employees, customers;

-- Add INSERT/UPDATE grants for employees
GRANT INSERT, UPDATE, DELETE ON api.ships TO employees;
GRANT INSERT, UPDATE, DELETE ON api.certificates TO employees;
GRANT INSERT, UPDATE, DELETE ON api.survey_audits TO employees;
GRANT INSERT, UPDATE, DELETE ON api.documents TO employees;
GRANT INSERT, UPDATE, DELETE ON api.finding_comments TO employees;
GRANT UPDATE, DELETE ON api.survey_requests TO employees;
GRANT UPDATE, DELETE ON api.survey_request_carts TO employees;

-- Grants for jobs
GRANT SELECT, INSERT, UPDATE ON api.jobs TO employees;
GRANT SELECT, INSERT, UPDATE ON api.survey_jobs TO employees;
GRANT SELECT, INSERT, UPDATE ON api.audit_jobs TO employees;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.survey_lines TO employees;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.audit_lines TO employees;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.comment_lines TO employees;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.job_participants TO employees;
GRANT SELECT ON api.surveyor_jobs TO employees;

-- Grants for employees and organizations
GRANT SELECT ON api.employees TO employees;
GRANT SELECT ON api.organizations TO employees;
GRANT SELECT ON api.checklist_sections TO employees;
GRANT SELECT ON api.checklist_items TO employees;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.survey_checklists TO employees;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.audit_checklists TO employees;
GRANT SELECT ON api.checklist_results TO employees;
GRANT SELECT ON iclass.checklist_results TO employees;

-- Customers can only read
-- (Actually, RLS handles the 'which' rows, GRANT handles the 'what' actions)
