-- =============================================
-- Organization Chart Schema for Microsoft Teams (for Postgresql v18+)
-- =============================================

-- Enable ltree extension for hierarchical queries
CREATE EXTENSION IF NOT EXISTS ltree;

-- =============================================
-- 1. ORGANIZATIONS TABLE
-- Top-level organization/tenant information
-- =============================================
CREATE TABLE IF NOT EXISTS iclass.organization (
    id serial PRIMARY KEY,
    tenant_id VARCHAR(100) UNIQUE,  -- Microsoft 365 Tenant ID
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    domain VARCHAR(255),
    logo_url TEXT,
    imo_number VARCHAR(7) UNIQUE,
    mlc_responsibility boolean DEFAULT TRUE,
    doc_ships_types varchar(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- =============================================
-- 2. DEPARTMENTS TABLE
-- Department/Division structure
-- =============================================

CREATE TABLE IF NOT EXISTS iclass.department (
    id serial PRIMARY KEY,
    organization_id integer NOT NULL REFERENCES iclass.organization(id) ON DELETE CASCADE,
    parent_department_id integer REFERENCES iclass.department(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    cost_center VARCHAR(50),
    level INTEGER DEFAULT 0,  -- Hierarchy level (0 = root)
    path LTREE,  -- For efficient hierarchy queries (requires ltree extension)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT unique_dept_code_per_org UNIQUE (organization_id, code)
);

-- =============================================
-- 3. LOCATIONS TABLE
-- Office locations
-- =============================================
CREATE TABLE IF NOT EXISTS iclass.location (
    id serial PRIMARY KEY,
    organization_id integer NOT NULL REFERENCES iclass.organization(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    post_code VARCHAR(20),
    country VARCHAR(100),
    country_code VARCHAR(3),
    timezone VARCHAR(50),
    is_headquarter BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- =============================================
-- 4. JOB TITLES TABLE
-- Standard job titles/positions
-- =============================================
CREATE TABLE IF NOT EXISTS iclass.job_title (
    id serial PRIMARY KEY,
    organization_id integer NOT NULL REFERENCES iclass.organization(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    level INTEGER,  -- Job level/grade
    job_family VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT unique_title_per_org UNIQUE (organization_id, title)
);

-- =============================================
-- 6. EMPLOYEES TABLE
-- Core employee/user information
-- =============================================
CREATE TABLE IF NOT EXISTS iclass.employee (
    id serial PRIMARY KEY,
    user_id integer REFERENCES auth.user(id) ON DELETE CASCADE,
    organization_id integer NOT NULL REFERENCES iclass.organization(id) ON DELETE CASCADE,

    -- Microsoft 365 / Azure AD identifiers
    azure_ad_id VARCHAR(100) UNIQUE,  -- Azure AD Object ID
    user_principal_name VARCHAR(255) UNIQUE,  -- UPN (email format)

    -- Basic Information
    employee_number VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    preferred_name VARCHAR(100),

    -- Contact Information
    email VARCHAR(255) NOT NULL,
    secondary_email VARCHAR(255),
    business_phone VARCHAR(50),
    mobile_phone VARCHAR(50),
    address varchar(500),

    -- Organization Position
    job_title_id integer REFERENCES iclass.job_title(id) ON DELETE SET NULL,
    job_title_custom VARCHAR(255),  -- For custom titles not in job_titles table
    department_id integer REFERENCES iclass.department(id) ON DELETE SET NULL,
    location_id integer REFERENCES iclass.location(id) ON DELETE SET NULL,

    -- Manager Relationship (Self-referencing for org chart)
    manager_id integer REFERENCES iclass.employee(id) ON DELETE SET NULL,

    -- Additional MS Teams relevant fields
    profile_photo_url TEXT,
    about_me TEXT,
    skills TEXT[],  -- Array of skills
    interests TEXT[],  -- Array of interests
    schools TEXT[],  -- Education history
    birthday DATE,
    hire_date DATE,

    -- Employment Status
    employment_type VARCHAR(50) DEFAULT 'Full-Time',  -- Full-Time, Part-Time, Contractor, etc.
    employment_status VARCHAR(50) DEFAULT 'Active',  -- Active, On Leave, Terminated

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMP WITH TIME ZONE,  -- Last sync with Azure AD
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT unique_employee_number_per_org UNIQUE (organization_id, employee_number)
);



-- =============================================
-- 5. Contract History TABLE
-- Record contract details with our Organization(for customers, flags and empoyee)
-- =============================================
CREATE TABLE IF NOT EXISTS iclass.contract_history (
    id serial PRIMARY KEY,
    organization_id integer REFERENCES iclass.organization(id) ON DELETE CASCADE,
    employee_id integer REFERENCES iclass.employee(id) ON DELETE CASCADE,
    contract_file varchar(128),
    contract_start date,
    contract_end date,
    notes text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- =============================================
-- 7. MANAGER HISTORY TABLE
-- Track manager changes over time
-- =============================================
CREATE TABLE IF NOT EXISTS iclass.manager_history (
    id serial PRIMARY KEY,
    employee_id integer NOT NULL REFERENCES iclass.employee(id) ON DELETE CASCADE,
    manager_id integer REFERENCES iclass.employee(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    change_reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by integer REFERENCES iclass.employee(id)
);

-- =============================================
-- 8. DEPARTMENT MEMBERSHIP HISTORY
-- Track department changes
-- =============================================
CREATE TABLE IF NOT EXISTS iclass.department_history (
    id serial PRIMARY KEY,
    employee_id integer NOT NULL REFERENCES iclass.employee(id) ON DELETE CASCADE,
    department_id integer NOT NULL REFERENCES iclass.department(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 9. DOTTED LINE RELATIONSHIPS
-- For matrix organization structures
-- =============================================
CREATE TABLE IF NOT EXISTS iclass.dotted_line_relationship (
    id serial PRIMARY KEY,
    employee_id integer NOT NULL REFERENCES iclass.employee(id) ON DELETE CASCADE,
    dotted_line_manager_id integer NOT NULL REFERENCES iclass.employee(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100),  -- e.g., 'Project Manager', 'Functional Manager'
    description TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT no_self_dotted_line CHECK (employee_id != dotted_line_manager_id),
    CONSTRAINT unique_dotted_line UNIQUE (employee_id, dotted_line_manager_id, relationship_type)
);

-- =============================================
-- 10. TEAMS INTEGRATION TABLE
-- Microsoft Teams specific data
-- =============================================
CREATE TABLE IF NOT EXISTS iclass.teams_presence (
    id serial PRIMARY KEY,
    employee_id integer NOT NULL REFERENCES iclass.employee(id) ON DELETE CASCADE,
    availability VARCHAR(50),  -- Available, Busy, Away, DoNotDisturb, Offline
    activity VARCHAR(100),
    status_message TEXT,
    out_of_office_settings JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_presence_per_employee UNIQUE (employee_id)
);

-- =============================================
-- 11. ORGANIZATIONAL ROLES
-- Special roles beyond job titles
-- =============================================
CREATE TABLE IF NOT EXISTS iclass.organizational_role (
    id serial PRIMARY KEY,
    organization_id integer NOT NULL REFERENCES iclass.organization(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS iclass.employee_organizational_role (
    id serial PRIMARY KEY,
    employee_id integer NOT NULL REFERENCES iclass.employee(id) ON DELETE CASCADE,
    role_id integer NOT NULL REFERENCES iclass.organizational_role(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_employee_role UNIQUE (employee_id, role_id)
);



-- =============================================
-- 12. SYNC LOG TABLE
-- Track synchronization with Microsoft 365
-- =============================================
CREATE TABLE IF NOT EXISTS iclass.sync_log (
    id serial PRIMARY KEY,
    organization_id integer NOT NULL REFERENCES iclass.organization(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL,  -- 'full', 'incremental', 'user', 'department'
    status VARCHAR(50) NOT NULL,  -- 'started', 'completed', 'failed'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    details JSONB
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Employees indexes
CREATE INDEX IF NOT EXISTS idx_employees_organization ON iclass.employee(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON iclass.employee(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON iclass.employee(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_location ON iclass.employee(location_id);
CREATE INDEX IF NOT EXISTS idx_employees_azure_ad ON iclass.employee(azure_ad_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON iclass.employee(email);
CREATE INDEX IF NOT EXISTS idx_employees_display_name ON iclass.employee(display_name);
CREATE INDEX IF NOT EXISTS idx_employees_active ON iclass.employee(is_active) WHERE is_active = TRUE;

-- Departments indexes
CREATE INDEX IF NOT EXISTS idx_departments_organization ON iclass.department(organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON iclass.department(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_departments_path ON iclass.department USING GIST (path);

-- Manager history indexes
CREATE INDEX IF NOT EXISTS idx_manager_history_employee ON iclass.manager_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_manager_history_dates ON iclass.manager_history(start_date, end_date);

-- Dotted line relationships indexes
CREATE INDEX IF NOT EXISTS idx_dotted_line_employee ON iclass.dotted_line_relationship(employee_id);
CREATE INDEX IF NOT EXISTS idx_dotted_line_manager ON iclass.dotted_line_relationship(dotted_line_manager_id);

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View: Full employee information with related data
CREATE OR REPLACE VIEW iclass.v_employee_full AS
SELECT
    e.id,
    e.employee_number,
    e.display_name,
    e.first_name,
    e.last_name,
    e.email,
    e.business_phone,
    e.mobile_phone,
    e.azure_ad_id,
    e.user_principal_name,
    e.profile_photo_url,
    COALESCE(jt.title, e.job_title_custom) AS job_title,
    d.name AS department_name,
    d.id AS department_id,
    l.name AS location_name,
    l.city,
    l.country,
    m.id AS manager_id,
    m.display_name AS manager_name,
    m.email AS manager_email,
    e.hire_date,
    e.employment_type,
    e.employment_status,
    e.is_active,
    o.name AS organization_name
FROM iclass.employee e
LEFT JOIN iclass.job_title jt ON e.job_title_id = jt.id
LEFT JOIN iclass.department d ON e.department_id = d.id
LEFT JOIN iclass.location l ON e.location_id = l.id
LEFT JOIN iclass.employee m ON e.manager_id = m.id
LEFT JOIN iclass.organization o ON e.organization_id = o.id;

-- View: Direct reports count per manager
CREATE OR REPLACE VIEW iclass.v_manager_direct_reports AS
SELECT
    m.id AS manager_id,
    m.display_name AS manager_name,
    m.email AS manager_email,
    COUNT(e.id) AS direct_reports_count
FROM iclass.employee m
LEFT JOIN iclass.employee e ON e.manager_id = m.id AND e.is_active = TRUE
WHERE m.is_active = TRUE
GROUP BY m.id, m.display_name, m.email;

-- View: Department hierarchy
CREATE OR REPLACE VIEW iclass.v_department_hierarchy AS
WITH RECURSIVE dept_tree AS (
    -- Base case: root departments
    SELECT
        id,
        organization_id,
        name,
        parent_department_id,
        0 AS level,
        ARRAY[name]::VARCHAR[] AS path_names,
        ARRAY[id]::integer[] AS path_ids
    FROM iclass.department
    WHERE parent_department_id IS NULL

    UNION ALL

    -- Recursive case
    SELECT
        d.id,
        d.organization_id,
        d.name,
        d.parent_department_id,
        dt.level + 1,
        dt.path_names || d.name,
        dt.path_ids || d.id
    FROM iclass.department d
    INNER JOIN dept_tree dt ON d.parent_department_id = dt.id
)
SELECT
    id,
    organization_id,
    name,
    parent_department_id,
    level,
    array_to_string(path_names, ' > ') AS full_path,
    path_ids
FROM dept_tree;

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function: Get all descendants (direct and indirect reports) of a manager
CREATE OR REPLACE FUNCTION iclass.get_all_reports(p_manager_id integer)
RETURNS TABLE (
    employee_id integer,
    display_name VARCHAR(255),
    email VARCHAR(255),
    level INTEGER
) AS $$
WITH RECURSIVE reports AS (
    -- Direct reports
    SELECT
        e.id,
        e.display_name,
        e.email,
        1 AS level
    FROM iclass.employee e
    WHERE e.manager_id = p_manager_id AND e.is_active = TRUE

    UNION ALL

    -- Indirect reports
    SELECT
        e.id,
        e.display_name,
        e.email,
        r.level + 1
    FROM iclass.employee e
    INNER JOIN reports r ON e.manager_id = r.id
    WHERE e.is_active = TRUE
)
SELECT * FROM reports ORDER BY level, display_name;
$$ LANGUAGE SQL;

-- Function: Get management chain (upward hierarchy)
CREATE OR REPLACE FUNCTION iclass.get_management_chain(p_employee_id integer)
RETURNS TABLE (
    employee_id integer,
    display_name VARCHAR(255),
    job_title VARCHAR(255),
    level INTEGER
) AS $$
WITH RECURSIVE chain AS (
    -- Starting employee's manager
    SELECT
        m.id,
        m.display_name,
        COALESCE(jt.title, m.job_title_custom) AS job_title,
        1 AS level
    FROM iclass.employee e
    INNER JOIN iclass.employee m ON e.manager_id = m.id
    LEFT JOIN iclass.job_title jt ON m.job_title_id = jt.id
    WHERE e.id = p_employee_id

    UNION ALL

    -- Manager's manager and upward
    SELECT
        m.id,
        m.display_name,
        COALESCE(jt.title, m.job_title_custom),
        c.level + 1
    FROM chain c
    INNER JOIN iclass.employee e ON e.id = c.id
    INNER JOIN iclass.employee m ON e.manager_id = m.id
    LEFT JOIN iclass.job_title jt ON m.job_title_id = jt.id
)
SELECT * FROM chain ORDER BY level;
$$ LANGUAGE SQL;

-- Function: Update timestamp trigger
CREATE OR REPLACE FUNCTION iclass.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_organizations_updated_at ON iclass.organization;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON iclass.organization
    FOR EACH ROW
    EXECUTE FUNCTION iclass.update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON iclass.employee;
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON iclass.employee
    FOR EACH ROW
    EXECUTE FUNCTION iclass.update_updated_at_column();

DROP TRIGGER IF EXISTS update_departments_updated_at ON iclass.department;
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON iclass.department
    FOR EACH ROW
    EXECUTE FUNCTION iclass.update_updated_at_column();

DROP TRIGGER IF EXISTS update_locations_updated_at ON iclass.location;
CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON iclass.location
    FOR EACH ROW
    EXECUTE FUNCTION iclass.update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_titles_updated_at ON iclass.job_title;
CREATE TRIGGER update_job_titles_updated_at
    BEFORE UPDATE ON iclass.job_title
    FOR EACH ROW
    EXECUTE FUNCTION iclass.update_updated_at_column();

-- Trigger: Record manager changes in history
CREATE OR REPLACE FUNCTION iclass.track_manager_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.manager_id IS DISTINCT FROM NEW.manager_id THEN
        -- Close previous manager record
        UPDATE iclass.manager_history
        SET end_date = CURRENT_DATE
        WHERE employee_id = NEW.id AND end_date IS NULL;

        -- Insert new manager record
        IF NEW.manager_id IS NOT NULL THEN
            INSERT INTO iclass.manager_history (employee_id, manager_id, start_date)
            VALUES (NEW.id, NEW.manager_id, CURRENT_DATE);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS track_employee_manager_change ON iclass.employee;
CREATE TRIGGER track_employee_manager_change
    AFTER UPDATE ON iclass.employee
    FOR EACH ROW
    EXECUTE FUNCTION iclass.track_manager_change();
