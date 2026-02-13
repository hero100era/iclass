-- Secure views for API schema
-- These views will automatically respect RLS because they refer to the underlying tables

DROP VIEW IF EXISTS api.ships CASCADE;
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
FROM iclass.ship;

DROP VIEW IF EXISTS api.certificates CASCADE;
CREATE OR REPLACE VIEW api.certificates AS
SELECT
  id, certificate_id, version, ship_id, company_id, certifiate_template_code,
  status, remark, issued_by, cert_code, validity_type, category, internal_category,
  description, issue_date, expiry_date, mlc_declaration_date, mlc_declaration_place,
  doc_administration, extended_date, file_path_cert, file_path_draft,
  created_at, updated_at, is_active
FROM iclass.certificate;

DROP VIEW IF EXISTS api.survey_audits CASCADE;
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
FROM iclass.survey_audit s
LEFT JOIN iclass.survey_pool p ON s.pool_id = p.id
LEFT JOIN iclass.certificate c ON s.certificate_id = c.id;

DROP VIEW IF EXISTS api.documents CASCADE;
CREATE OR REPLACE VIEW api.documents AS
SELECT
  id, ship_id, company_id, name, type, file_path,
  upload_date, expiry_date, status, created_at, updated_at, is_active
FROM iclass.document;

DROP VIEW IF EXISTS api.finding_comments CASCADE;
CREATE OR REPLACE VIEW api.finding_comments AS
SELECT
  id, ship_id, company_id, comment_type, priviate, certificates,
  date_issued, place_issued, due_date, expiry_survey_audits, status,
  postponed_due_date, postponed_expiry_survey_audits, mms_reference, text,
  created_at, updated_at, is_active
FROM iclass.finding_comment;

DROP VIEW IF EXISTS api.me CASCADE;
CREATE OR REPLACE VIEW api.me AS
SELECT
    u.id,
    u.email,
    u.role,
    u.category,
    u.is_active,
    CASE
        WHEN u.role = 'employees' THEN (SELECT display_name FROM iclass.employee WHERE user_id = u.id)
        WHEN u.role = 'customers' THEN (SELECT name FROM iclass.customer WHERE id = u.id)
        WHEN u.role = 'administrations' THEN (SELECT name FROM iclass.flag_staff WHERE id = u.id)
    END as display_name,
    CASE
        WHEN u.role = 'employees' THEN (SELECT l.name FROM iclass.employee e LEFT JOIN iclass.location l ON e.location_id = l.id WHERE e.user_id = u.id)
        WHEN u.role = 'administrations' THEN 'Administration'
        ELSE 'External'
    END as location
FROM auth.user u
WHERE u.id = iclass.get_auth_user_id();

DROP VIEW IF EXISTS api.survey_requests CASCADE;
CREATE OR REPLACE VIEW api.survey_requests AS
SELECT
  id, ship_id, company_id, ordered_by_id, location, estimated_date,
  contact_person, contact_phone, contact_email, alternative_contact,
  alternative_person, alternative_phone, alternative_email, alternative_mobile,
  is_assigned, comments, file_path, status, created_at, updated_at, is_active
FROM iclass.survey_request;

DROP VIEW IF EXISTS api.survey_request_carts CASCADE;
CREATE OR REPLACE VIEW api.survey_request_carts AS
SELECT
  id, ship_id, company_id, survey_request_id, survey_audit_id, comment_id, occ_survey_code
FROM iclass.survey_request_cart;

DROP VIEW IF EXISTS api.survey_pool CASCADE;
CREATE OR REPLACE VIEW api.survey_pool AS
SELECT
  id, code, name, description, fee, is_active, is_mandatory, cert_code
FROM iclass.survey_pool
WHERE is_active = TRUE;

DROP VIEW IF EXISTS api.jobs CASCADE;
CREATE OR REPLACE VIEW api.jobs AS
SELECT
  id, file_path_report, file_path_draft, comments, additional,
  location, fee, job_status, created_at, updated_at, is_active
FROM iclass.job;

DROP VIEW IF EXISTS api.survey_jobs CASCADE;
CREATE OR REPLACE VIEW api.survey_jobs AS
SELECT
  id, job_id, ship_id, surveyor_id, reviewer_id, initialized
FROM iclass.survey_job;

DROP VIEW IF EXISTS api.audit_jobs CASCADE;
CREATE OR REPLACE VIEW api.audit_jobs AS
SELECT
  id, job_id, ship_id, company_id, auditor_id, reviewer_id, initialized
FROM iclass.audit_job;

DROP VIEW IF EXISTS api.survey_lines CASCADE;
CREATE OR REPLACE VIEW api.survey_lines AS
SELECT
  id, job_id, survey_audit_id, pool_id, initialized, credit_periodical
FROM iclass.survey_line;

DROP VIEW IF EXISTS api.audit_lines CASCADE;
CREATE OR REPLACE VIEW api.audit_lines AS
SELECT
  id, job_id, survey_audit_id, pool_id, initialized, credit_periodical
FROM iclass.audit_line;

DROP VIEW IF EXISTS api.job_participants CASCADE;
CREATE OR REPLACE VIEW api.job_participants AS
SELECT
  id, survey_job_id, audit_job_id, employee_id, is_monitor, is_trainee
FROM iclass.job_participant;

DROP VIEW IF EXISTS api.comment_lines CASCADE;
CREATE OR REPLACE VIEW api.comment_lines AS
SELECT
  id, job_id, finding_comment_id, created_at, updated_at
FROM iclass.comment_line;

-- Consolidated view for surveyor's job list
DROP VIEW IF EXISTS api.surveyor_jobs CASCADE;
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
FROM iclass.job j
JOIN iclass.survey_job sj ON j.id = sj.job_id
LEFT JOIN iclass.ship s ON sj.ship_id = s.id
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
FROM iclass.job j
JOIN iclass.audit_job aj ON j.id = aj.job_id
LEFT JOIN iclass.ship s ON aj.ship_id = s.id
LEFT JOIN iclass.organization o ON aj.company_id = o.id;

DROP VIEW IF EXISTS api.employees CASCADE;
CREATE OR REPLACE VIEW api.employees AS
SELECT
  id, user_id, first_name, last_name, display_name, email, job_title_id, department_id, location_id, is_active
FROM iclass.employee;

DROP VIEW IF EXISTS api.organizations CASCADE;
CREATE OR REPLACE VIEW api.organizations AS
SELECT
  id, name, display_name, domain, imo_number, is_active
FROM iclass.organization;

DROP VIEW IF EXISTS api.checklist_sections CASCADE;
CREATE OR REPLACE VIEW api.checklist_sections AS
SELECT
  id, survey_id, code, section_number, title, is_active
FROM iclass.checklist_section;

CREATE OR REPLACE VIEW api.v_template_tree AS
WITH RECURSIVE tree AS (
    SELECT
        tn.id,
        tn.template_id,
        tn.parent_node_id,
        tn.code,
        tn.name,
        tn.category,
        tn.node_type,
        tn.level,
        tn.sort_order,
        tn.default_capacity,
        tn.unit_of_measure,
        tn.name::TEXT AS breadcrumb,
        ARRAY[tn.id] AS path_ids
    FROM iclass.template_nodes tn
    WHERE tn.parent_node_id IS NULL

    UNION ALL

    SELECT
        child.id,
        child.template_id,
        child.parent_node_id,
        child.code,
        child.name,
        child.category,
        child.node_type,
        child.level,
        child.sort_order,
        child.default_capacity,
        child.unit_of_measure,
        tree.breadcrumb || ' > ' || child.name,
        tree.path_ids || child.id
    FROM iclass.template_node child
    JOIN tree ON child.parent_node_id = tree.id
)
SELECT
    t.*,
    bt.code AS template_code,
    bt.name AS template_name
FROM tree t
JOIN iclass.breakdown_template bt ON bt.id = t.template_id
ORDER BY t.template_id, t.path_ids;

-- View: Full ship breakdown tree
CREATE OR REPLACE VIEW iclass.v_ship_breakdown_tree AS
WITH RECURSIVE tree AS (
    SELECT
        sn.id,
        sn.ship_breakdown_id,
        sn.parent_node_id,
        sn.code,
        sn.name,
        sn.category,
        sn.node_type,
        sn.level,
        sn.sort_order,
        sn.is_active,
        sn.is_from_template,
        sn.is_modified,
        sn.metadata,
        sn.name::TEXT AS breadcrumb,
        ARRAY[sn.id] AS path_ids
    FROM iclass.ship_breakdown_node sn
    WHERE sn.parent_node_id IS NULL

    UNION ALL

    SELECT
        child.id,
        child.ship_breakdown_id,
        child.parent_node_id,
        child.code,
        child.name,
        child.category,
        child.node_type,
        child.level,
        child.sort_order,
        child.is_active,
        child.is_from_template,
        child.is_modified,
        child.metadata,
        tree.breadcrumb || ' > ' || child.name,
        tree.path_ids || child.id
    FROM iclass.ship_breakdown_node child
    JOIN tree ON child.parent_node_id = tree.id
)
SELECT
    t.*,
    sb.ship_id,
    s.name AS ship_name,
    s.imo_number
FROM tree t
JOIN iclass.ship_breakdown sb ON sb.id = t.ship_breakdown_id
JOIN iclass.ship s ON s.id = sb.ship_id
ORDER BY t.ship_breakdown_id, t.path_ids;

-- Grants
GRANT SELECT ON api.ships TO employees, customers, administrations, admingrp;
GRANT SELECT ON api.certificates TO employees, customers, administrations, admingrp;
GRANT SELECT ON api.survey_audits TO employees, customers, administrations, admingrp;
GRANT SELECT ON api.documents TO employees, customers, administrations, admingrp;
GRANT SELECT ON api.finding_comments TO employees, customers, administrations, admingrp;
GRANT SELECT ON api.me TO employees, customers, administrations, admingrp;
GRANT SELECT, INSERT ON api.survey_requests TO employees, customers, admingrp;
GRANT SELECT, INSERT ON api.survey_request_carts TO employees, customers, admingrp;
GRANT SELECT ON api.survey_pool TO employees, customers, admingrp;

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
GRANT SELECT ON api.employees TO employees, admingrp;
GRANT SELECT ON api.organizations TO employees, admingrp;

-- Customers can only read
-- (Actually, RLS handles the 'which' rows, GRANT handles the 'what' actions)
