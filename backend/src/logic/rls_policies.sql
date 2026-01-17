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
  RETURN (SELECT company_id FROM iclass.customers WHERE id = iclass.get_auth_user_id());
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
ALTER TABLE iclass.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.ships ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.survey_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.finding_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.flag_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.survey_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.survey_request_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.survey_pool ENABLE ROW LEVEL SECURITY;

-- 1. Employees Policies (Full Access)
CREATE POLICY employee_full_access ON iclass.organizations FOR SELECT TO employees USING (true);
CREATE POLICY employee_full_access ON iclass.ships FOR SELECT TO employees USING (true);
CREATE POLICY employee_full_access ON iclass.certificates FOR SELECT TO employees USING (true);
CREATE POLICY employee_full_access ON iclass.survey_audits FOR SELECT TO employees USING (true);
CREATE POLICY employee_full_access ON iclass.finding_comments FOR SELECT TO employees USING (true);
CREATE POLICY employee_full_access ON iclass.employees FOR SELECT TO employees USING (true);
CREATE POLICY employee_full_access ON iclass.customers FOR SELECT TO employees USING (true);
CREATE POLICY employee_full_access ON iclass.survey_requests FOR ALL TO employees USING (true);
CREATE POLICY employee_full_access ON iclass.survey_request_carts FOR ALL TO employees USING (true);
CREATE POLICY employee_full_access ON iclass.survey_pool FOR ALL TO employees USING (true);

-- 2. Customers Policies (Scoped Access)
-- Companies: only their own
CREATE POLICY customer_read_own_company ON iclass.organizations FOR SELECT TO customers
  USING (id = iclass.get_customer_company_id());

-- Ships: where they are the owner (registered, ISM, or MLC)
CREATE POLICY customer_read_own_ships ON iclass.ships FOR SELECT TO customers
  USING (
    registered_owner_id = iclass.get_customer_company_id() OR
    ism_owner_id = iclass.get_customer_company_id() OR
    mlc_owner_id = iclass.get_customer_company_id()
  );

-- Certificates: for their ships or their company directly
CREATE POLICY customer_read_own_certificates ON iclass.certificates FOR SELECT TO customers
  USING (
    company_id = iclass.get_customer_company_id() OR
    ship_id IN (SELECT id FROM iclass.ships WHERE 
      registered_owner_id = iclass.get_customer_company_id() OR
      ism_owner_id = iclass.get_customer_company_id() OR
      mlc_owner_id = iclass.get_customer_company_id())
  );

-- Survey Audits: for their ships
CREATE POLICY customer_read_own_survey_audits ON iclass.survey_audits FOR SELECT TO customers
  USING (
    certificate_id IN (SELECT id FROM iclass.certificates WHERE 
      company_id = iclass.get_customer_company_id() OR
      ship_id IN (SELECT id FROM iclass.ships WHERE 
        registered_owner_id = iclass.get_customer_company_id() OR
        ism_owner_id = iclass.get_customer_company_id() OR
        mlc_owner_id = iclass.get_customer_company_id()))
  );

-- Finding Comments: for their ships or company
CREATE POLICY customer_read_own_findings ON iclass.finding_comments FOR SELECT TO customers
  USING (
    ((company_id = iclass.get_customer_company_id()) OR
    (ship_id IN (SELECT id FROM iclass.ships WHERE 
      registered_owner_id = iclass.get_customer_company_id() OR
      ism_owner_id = iclass.get_customer_company_id() OR
      mlc_owner_id = iclass.get_customer_company_id())))
    AND (priviate IS NOT TRUE)
  ); 
-- Customers shouldn't see private comments

-- Survey Requests: for their ships or company
CREATE POLICY customer_access_own_survey_requests ON iclass.survey_requests FOR ALL TO customers
  USING (
    company_id = iclass.get_customer_company_id() OR
    ship_id IN (SELECT id FROM iclass.ships WHERE 
      registered_owner_id = iclass.get_customer_company_id() OR
      ism_owner_id = iclass.get_customer_company_id() OR
      mlc_owner_id = iclass.get_customer_company_id())
  );

-- Request Survey Carts: for their ships or company
CREATE POLICY customer_access_own_survey_request_carts ON iclass.survey_request_carts FOR ALL TO customers
  USING (
    company_id = iclass.get_customer_company_id() OR
    ship_id IN (SELECT id FROM iclass.ships WHERE 
      registered_owner_id = iclass.get_customer_company_id() OR
      ism_owner_id = iclass.get_customer_company_id() OR
      mlc_owner_id = iclass.get_customer_company_id())
  );

-- Other Survey Pool: Read only for everyone
CREATE POLICY customer_read_survey_pool ON iclass.survey_pool FOR SELECT TO customers USING (true);

-- Customers: only their own profile
CREATE POLICY customer_read_own_profile ON iclass.customers FOR SELECT TO customers
  USING (id = iclass.get_auth_user_id());

-- 3. Administrations Policies (Scoped Access)
-- Flags: only their own
CREATE POLICY administration_read_own_flag ON iclass.flags FOR SELECT TO administrations
  USING (code = iclass.get_current_flag_code());

-- Flag Staff: only their own profile
CREATE POLICY administration_read_own_profile ON iclass.flag_staff FOR SELECT TO administrations
  USING (id = iclass.get_auth_user_id());

-- Ships: only those under their flag
CREATE POLICY administration_read_own_ships ON iclass.ships FOR SELECT TO administrations
  USING (flag_code = iclass.get_current_flag_code());

-- Certificates: for ships under their flag
CREATE POLICY administration_read_own_certificates ON iclass.certificates FOR SELECT TO administrations
  USING (ship_id IN (SELECT id FROM iclass.ships WHERE flag_code = iclass.get_current_flag_code()));

-- Survey Audits: for ships under their flag
CREATE POLICY administration_read_own_survey_audits ON iclass.survey_audits FOR SELECT TO administrations
  USING (certificate_id IN (SELECT id FROM iclass.certificates WHERE 
    ship_id IN (SELECT id FROM iclass.ships WHERE flag_code = iclass.get_current_flag_code())));

-- Finding Comments: for ships under their flag
CREATE POLICY administration_read_own_findings ON iclass.finding_comments FOR SELECT TO administrations
  USING (ship_id IN (SELECT id FROM iclass.ships WHERE flag_code = iclass.get_current_flag_code()));

-- Survey Requests: for ships under their flag
CREATE POLICY administration_read_own_survey_requests ON iclass.survey_requests FOR SELECT TO administrations
  USING (ship_id IN (SELECT id FROM iclass.ships WHERE flag_code = iclass.get_current_flag_code()));

-- 4. Anonymous/Default Policies (Denied by default because RLS is enabled)
