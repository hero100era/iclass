-- Helper functions for RLS
CREATE OR REPLACE FUNCTION iclass.get_auth_user_id() RETURNS integer AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::json->>'id')::integer;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION iclass.get_customer_company_id() RETURNS integer AS $$
BEGIN
  RETURN (SELECT company_id FROM iclass.customer WHERE id = iclass.get_auth_user_id());
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION iclass.get_current_flag_code() RETURNS varchar(3) AS $$
BEGIN
  RETURN (SELECT flag_code FROM iclass.flag_staff WHERE id = iclass.get_auth_user_id());
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable RLS on SELECT tables
ALTER TABLE iclass.organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.ship ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.certificate ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.survey_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.finding_comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.employee ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.flag ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.flag_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.survey_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.survey_request_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.survey_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.job ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.survey_job ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.audit_job ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.survey_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.audit_line ENABLE ROW LEVEL SECURITY;

-- 1. Employees Policies (Full Read Access)
DROP POLICY IF EXISTS employee_read_access ON iclass.organization;
CREATE POLICY employee_read_access ON iclass.organization FOR SELECT TO employees, admingrp USING (true);
DROP POLICY IF EXISTS employee_read_access ON iclass.ship;
CREATE POLICY employee_read_access ON iclass.ship FOR SELECT TO employees, admingrp USING (true);
DROP POLICY IF EXISTS employee_read_access ON iclass.certificate;
CREATE POLICY employee_read_access ON iclass.certificate FOR SELECT TO employees, admingrp USING (true);
DROP POLICY IF EXISTS employee_read_access ON iclass.survey_audit;
CREATE POLICY employee_read_access ON iclass.survey_audit FOR SELECT TO employees, admingrp USING (true);
DROP POLICY IF EXISTS employee_read_access ON iclass.finding_comment;
CREATE POLICY employee_read_access ON iclass.finding_comment FOR SELECT TO employees, admingrp USING (true);
DROP POLICY IF EXISTS employee_read_access ON iclass.employee;
CREATE POLICY employee_read_access ON iclass.employee FOR SELECT TO employees, admingrp USING (true);
DROP POLICY IF EXISTS employee_read_access ON iclass.customer;
CREATE POLICY employee_read_access ON iclass.customer FOR SELECT TO employees, admingrp USING (true);
DROP POLICY IF EXISTS employee_read_access ON iclass.survey_request;
CREATE POLICY employee_read_access ON iclass.survey_request FOR SELECT TO employees, admingrp USING (true);
DROP POLICY IF EXISTS employee_read_access ON iclass.survey_request_cart;
CREATE POLICY employee_read_access ON iclass.survey_request_cart FOR SELECT TO employees, admingrp USING (true);
DROP POLICY IF EXISTS employee_read_access ON iclass.survey_pool;
CREATE POLICY employee_read_access ON iclass.survey_pool FOR SELECT TO employees, admingrp USING (true);
DROP POLICY IF EXISTS employee_read_access ON iclass.job;
CREATE POLICY employee_read_access ON iclass.job FOR SELECT TO employees, admingrp USING (true);
DROP POLICY IF EXISTS employee_read_access ON iclass.survey_job;
CREATE POLICY employee_read_access ON iclass.survey_job FOR SELECT TO employees, admingrp USING (true);
DROP POLICY IF EXISTS employee_read_access ON iclass.audit_job;
CREATE POLICY employee_read_access ON iclass.audit_job FOR SELECT TO employees, admingrp USING (true);
DROP POLICY IF EXISTS employee_read_access ON iclass.survey_line;
CREATE POLICY employee_read_access ON iclass.survey_line FOR SELECT TO employees, admingrp USING (true);
DROP POLICY IF EXISTS employee_read_access ON iclass.audit_line;
CREATE POLICY employee_read_access ON iclass.audit_line FOR SELECT TO employees, admingrp USING (true);

-- 2. Customers Policies (Scoped Access)
-- Companies: only their own
DROP POLICY IF EXISTS customer_read_own_company ON iclass.organization;
CREATE POLICY customer_read_own_company ON iclass.organization FOR SELECT TO customers
  USING (id = iclass.get_customer_company_id());

-- Ships: where they are the owner (registered, ISM, or MLC)
DROP POLICY IF EXISTS customer_read_own_ships ON iclass.ship;
CREATE POLICY customer_read_own_ships ON iclass.ship FOR SELECT TO customers
  USING (
    registered_owner_id = iclass.get_customer_company_id() OR
    ism_owner_id = iclass.get_customer_company_id() OR
    mlc_owner_id = iclass.get_customer_company_id()
  );

-- Certificates: for their ships or their company directly
DROP POLICY IF EXISTS customer_read_own_certificates ON iclass.certificate;
CREATE POLICY customer_read_own_certificates ON iclass.certificate FOR SELECT TO customers
  USING (
    company_id = iclass.get_customer_company_id() OR
    ship_id IN (SELECT id FROM iclass.ship WHERE
      registered_owner_id = iclass.get_customer_company_id() OR
      ism_owner_id = iclass.get_customer_company_id() OR
      mlc_owner_id = iclass.get_customer_company_id())
  );

-- Survey Audits: for their ships
DROP POLICY IF EXISTS customer_read_own_survey_audits ON iclass.survey_audit;
CREATE POLICY customer_read_own_survey_audits ON iclass.survey_audit FOR SELECT TO customers
  USING (
    certificate_id IN (SELECT id FROM iclass.certificate WHERE
      company_id = iclass.get_customer_company_id() OR
      ship_id IN (SELECT id FROM iclass.ship WHERE
        registered_owner_id = iclass.get_customer_company_id() OR
        ism_owner_id = iclass.get_customer_company_id() OR
        mlc_owner_id = iclass.get_customer_company_id()))
  );

-- Finding Comments: for their ships or company
DROP POLICY IF EXISTS customer_read_own_findings ON iclass.finding_comment;
CREATE POLICY customer_read_own_findings ON iclass.finding_comment FOR SELECT TO customers
  USING (
    ((company_id = iclass.get_customer_company_id()) OR
    (ship_id IN (SELECT id FROM iclass.ship WHERE
      registered_owner_id = iclass.get_customer_company_id() OR
      ism_owner_id = iclass.get_customer_company_id() OR
      mlc_owner_id = iclass.get_customer_company_id())))
    AND (priviate IS NOT TRUE)
  );
-- Customers shouldn't see private comments

-- Survey Requests: for their ships or company
DROP POLICY IF EXISTS customer_access_own_survey_requests ON iclass.survey_request;
CREATE POLICY customer_access_own_survey_requests ON iclass.survey_request FOR ALL TO customers
  USING (
    company_id = iclass.get_customer_company_id() OR
    ship_id IN (SELECT id FROM iclass.ship WHERE
      registered_owner_id = iclass.get_customer_company_id() OR
      ism_owner_id = iclass.get_customer_company_id() OR
      mlc_owner_id = iclass.get_customer_company_id())
  );

-- Request Survey Carts: for their ships or company
DROP POLICY IF EXISTS customer_access_own_survey_request_carts ON iclass.survey_request_cart;
CREATE POLICY customer_access_own_survey_request_carts ON iclass.survey_request_cart FOR ALL TO customers
  USING (
    company_id = iclass.get_customer_company_id() OR
    ship_id IN (SELECT id FROM iclass.ship WHERE
      registered_owner_id = iclass.get_customer_company_id() OR
      ism_owner_id = iclass.get_customer_company_id() OR
      mlc_owner_id = iclass.get_customer_company_id())
  );

-- Ship Component Tree: for their ships
DROP POLICY IF EXISTS customer_read_own_ship_breakdown ON iclass.ship_breakdown;
CREATE POLICY customer_read_own_ship_breakdown ON iclass.ship_breakdown FOR SELECT TO customers
  USING (
    ship_id IN (SELECT id FROM iclass.ship WHERE
      registered_owner_id = iclass.get_customer_company_id() OR
      ism_owner_id = iclass.get_customer_company_id() OR
      mlc_owner_id = iclass.get_customer_company_id())
  );

DROP POLICY IF EXISTS customer_read_own_ship_breakdown_node ON iclass.ship_breakdown_node;
CREATE POLICY customer_read_own_ship_breakdown_node ON iclass.ship_breakdown_node FOR SELECT TO customers
  USING (
    ship_id IN (SELECT id FROM iclass.ship WHERE
      registered_owner_id = iclass.get_customer_company_id() OR
      ism_owner_id = iclass.get_customer_company_id() OR
      mlc_owner_id = iclass.get_customer_company_id())
  );

-- Other Survey Pool: Read only for everyone
DROP POLICY IF EXISTS customer_read_survey_pool ON iclass.survey_pool;
CREATE POLICY customer_read_survey_pool ON iclass.survey_pool FOR SELECT TO customers USING (true);

-- Customers: only their own profile
DROP POLICY IF EXISTS customer_read_own_profile ON iclass.customer;
CREATE POLICY customer_read_own_profile ON iclass.customer FOR SELECT TO customers
  USING (id = iclass.get_auth_user_id());

-- 3. Administrations Policies (Scoped Access)
-- Flags: only their own
DROP POLICY IF EXISTS administration_read_own_flag ON iclass.flag;
CREATE POLICY administration_read_own_flag ON iclass.flag FOR SELECT TO administrations
  USING (code = iclass.get_current_flag_code());

-- Flag Staff: only their own profile
DROP POLICY IF EXISTS administration_read_own_profile ON iclass.flag_staff;
CREATE POLICY administration_read_own_profile ON iclass.flag_staff FOR SELECT TO administrations
  USING (id = iclass.get_auth_user_id());

-- Ships: only those under their flag
DROP POLICY IF EXISTS administration_read_own_ships ON iclass.ship;
CREATE POLICY administration_read_own_ships ON iclass.ship FOR SELECT TO administrations
  USING (flag_code = iclass.get_current_flag_code());

-- Certificates: for ships under their flag
DROP POLICY IF EXISTS administration_read_own_certificates ON iclass.certificate;
CREATE POLICY administration_read_own_certificates ON iclass.certificate FOR SELECT TO administrations
  USING (ship_id IN (SELECT id FROM iclass.ship WHERE flag_code = iclass.get_current_flag_code()));

-- Survey Audits: for ships under their flag
DROP POLICY IF EXISTS administration_read_own_survey_audits ON iclass.survey_audit;
CREATE POLICY administration_read_own_survey_audits ON iclass.survey_audit FOR SELECT TO administrations
  USING (certificate_id IN (SELECT id FROM iclass.certificate WHERE
    ship_id IN (SELECT id FROM iclass.ship WHERE flag_code = iclass.get_current_flag_code())));

-- Finding Comments: for ships under their flag
DROP POLICY IF EXISTS administration_read_own_findings ON iclass.finding_comment;
CREATE POLICY administration_read_own_findings ON iclass.finding_comment FOR SELECT TO administrations
  USING (ship_id IN (SELECT id FROM iclass.ship WHERE flag_code = iclass.get_current_flag_code()));

-- Survey Requests: for ships under their flag
DROP POLICY IF EXISTS administration_read_own_survey_requests ON iclass.survey_request;
CREATE POLICY administration_read_own_survey_requests ON iclass.survey_request FOR SELECT TO administrations
  USING (ship_id IN (SELECT id FROM iclass.ship WHERE flag_code = iclass.get_current_flag_code()));


-- 4. Anonymous/Default Policies (Denied by default because RLS is enabled)
