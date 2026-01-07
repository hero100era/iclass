-- Helper functions for RLS
CREATE OR REPLACE FUNCTION iclass.get_auth_user_pk() RETURNS integer AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::json->>'id')::integer;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION iclass.get_current_company_pk() RETURNS integer AS $$
BEGIN
  RETURN (SELECT company_id FROM iclass.customers WHERE pk = iclass.get_auth_user_pk());
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION iclass.get_current_flag_code() RETURNS varchar(3) AS $$
BEGIN
  RETURN (SELECT flag_code FROM iclass.flag_staff WHERE pk = iclass.get_auth_user_pk());
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable RLS on all tables
ALTER TABLE iclass.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.ships ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.survey_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.finding_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE iclass.flag_staff ENABLE ROW LEVEL SECURITY;

-- 1. Employees Policies (Full Access)
CREATE POLICY employee_full_access ON iclass.companies FOR ALL TO employees USING (true);
CREATE POLICY employee_full_access ON iclass.ships FOR ALL TO employees USING (true);
CREATE POLICY employee_full_access ON iclass.certificates FOR ALL TO employees USING (true);
CREATE POLICY employee_full_access ON iclass.survey_audits FOR ALL TO employees USING (true);
CREATE POLICY employee_full_access ON iclass.finding_comments FOR ALL TO employees USING (true);
CREATE POLICY employee_full_access ON iclass.employees FOR ALL TO employees USING (true);
CREATE POLICY employee_full_access ON iclass.customers FOR ALL TO employees USING (true);

-- 2. Customers Policies (Scoped Access)
-- Companies: only their own
CREATE POLICY customer_read_own_company ON iclass.companies FOR SELECT TO customers
  USING (pk = iclass.get_current_company_pk());

-- Ships: where they are the owner (registered, ISM, or MLC)
CREATE POLICY customer_read_own_ships ON iclass.ships FOR SELECT TO customers
  USING (
    registered_owner_id = iclass.get_current_company_pk() OR
    ism_owner_id = iclass.get_current_company_pk() OR
    mlc_owner_id = iclass.get_current_company_pk()
  );

-- Certificates: for their ships or their company directly
CREATE POLICY customer_read_own_certificates ON iclass.certificates FOR SELECT TO customers
  USING (
    company_id = iclass.get_current_company_pk() OR
    ship_id IN (SELECT pk FROM iclass.ships WHERE 
      registered_owner_id = iclass.get_current_company_pk() OR
      ism_owner_id = iclass.get_current_company_pk() OR
      mlc_owner_id = iclass.get_current_company_pk())
  );

-- Survey Audits: for their ships
CREATE POLICY customer_read_own_survey_audits ON iclass.survey_audits FOR SELECT TO customers
  USING (
    certificate_id IN (SELECT pk FROM iclass.certificates WHERE 
      company_id = iclass.get_current_company_pk() OR
      ship_id IN (SELECT pk FROM iclass.ships WHERE 
        registered_owner_id = iclass.get_current_company_pk() OR
        ism_owner_id = iclass.get_current_company_pk() OR
        mlc_owner_id = iclass.get_current_company_pk()))
  );

-- Finding Comments: for their ships or company
CREATE POLICY customer_read_own_findings ON iclass.finding_comments FOR SELECT TO customers
  USING (
    ((companies_id = iclass.get_current_company_pk()) OR
    (ships_id IN (SELECT pk FROM iclass.ships WHERE 
      registered_owner_id = iclass.get_current_company_pk() OR
      ism_owner_id = iclass.get_current_company_pk() OR
      mlc_owner_id = iclass.get_current_company_pk())))
    AND (priviate IS NOT TRUE)
  ); 
-- Customers shouldn't see private comments

-- Customers: only their own profile
CREATE POLICY customer_read_own_profile ON iclass.customers FOR SELECT TO customers
  USING (pk = iclass.get_auth_user_pk());

-- 3. Administrations Policies (Scoped Access)
-- Flags: only their own
CREATE POLICY administration_read_own_flag ON iclass.flags FOR SELECT TO administrations
  USING (code = iclass.get_current_flag_code());

-- Flag Staff: only their own profile
CREATE POLICY administration_read_own_profile ON iclass.flag_staff FOR SELECT TO administrations
  USING (pk = iclass.get_auth_user_pk());

-- Ships: only those under their flag
CREATE POLICY administration_read_own_ships ON iclass.ships FOR SELECT TO administrations
  USING (flag_code = iclass.get_current_flag_code());

-- Certificates: for ships under their flag
CREATE POLICY administration_read_own_certificates ON iclass.certificates FOR SELECT TO administrations
  USING (ship_id IN (SELECT pk FROM iclass.ships WHERE flag_code = iclass.get_current_flag_code()));

-- Survey Audits: for ships under their flag
CREATE POLICY administration_read_own_survey_audits ON iclass.survey_audits FOR SELECT TO administrations
  USING (certificate_id IN (SELECT pk FROM iclass.certificates WHERE 
    ship_id IN (SELECT pk FROM iclass.ships WHERE flag_code = iclass.get_current_flag_code())));

-- Finding Comments: for ships under their flag
CREATE POLICY administration_read_own_findings ON iclass.finding_comments FOR SELECT TO administrations
  USING (ships_id IN (SELECT pk FROM iclass.ships WHERE flag_code = iclass.get_current_flag_code()));

-- 4. Anonymous/Default Policies (Denied by default because RLS is enabled)
