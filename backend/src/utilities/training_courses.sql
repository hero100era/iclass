-- Create Enums for Data Integrity
CREATE TYPE iclass.staff_role_type_enum AS ENUM ('TS', 'FS', 'AD', 'BOTH');
-- TS: Technical Appraisal
-- FS: Field Surveyors
-- AD: Support staff

-- RO Modules Table (The Elementary Modules)
CREATE TABLE iclass.ro_module (
    code VARCHAR(5) PRIMARY KEY, -- e.g., '1A', '2A', '4B'
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- 'Management', 'Technical', 'Survey', 'Qualifications'
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Training Courses (The "Rules" Engine)
-- It links a Certificate Code-> Module -> Specific Role -> Specific Topic.
CREATE TABLE iclass.training_course (
    id SERIAL PRIMARY KEY,
    survey_code VARCHAR(10) REFERENCES iclass.certificate_survey_pool(code),
    module_code VARCHAR(5) REFERENCES iclass.ro_module(code),
    target_role iclass.staff_role_type_enum NOT NULL, -- Is this training for TS, FS, or BOTH?
    description TEXT NOT NULL,
    objectives TEXT NOT NULL,
    prerequisites TEXT,
    delivery_method VARCHAR(50) CHECK (delivery_method IN (
        'classroom', 'online', 'blended', 'on_the_job', 
        'workshop', 'webinar', 'self_paced', 'external'
    )),
    passing_score DECIMAL(5,2),
    certification_validity_months INTEGER,
    ro_code_citation VARCHAR(20), -- e.g., 'A2.3.7.2.1'
    is_mandatory boolean DEFAULT true,
    is_active boolean DEFAULT true,
    version varchar(10),
    created_by integer REFERENCES auth.user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Training sessions (scheduled instances of courses)
CREATE TABLE iclass.training_session (
    id SERIAL PRIMARY KEY,
    course_id integer REFERENCES iclass.training_course(id),
    session_code VARCHAR(50) UNIQUE,
    session_name VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    location_type VARCHAR(50) CHECK (location_type IN (
        'physical', 'virtual', 'hybrid'
    )),
    physical_location VARCHAR(255),
    virtual_meeting_url VARCHAR(500),
    virtual_meeting_id VARCHAR(100),
    instructor_id integer REFERENCES auth.user(id),
    external_instructor_name VARCHAR(255),
    external_instructor_org VARCHAR(255),
    capacity INTEGER,
    registration_deadline DATE,
    status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN (
        'draft', 'scheduled', 'open_for_registration', 
        'in_progress', 'completed', 'cancelled', 'postponed'
    )),
    cost_per_participant DECIMAL(10,2),
    currency_code VARCHAR(3) DEFAULT 'USD',
    notes TEXT,
    created_by integer REFERENCES auth.user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Session dates (for multi-day sessions)
CREATE TABLE iclass.session_date (
    id serial PRIMARY KEY,
    session_id integer REFERENCES iclass.training_session(id) ON DELETE CASCADE,
    training_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    agenda TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE iclass.training_enrollment (
    id serial PRIMARY KEY,
    user_id integer REFERENCES auth.user(id) NOT NULL,
    course_id integer REFERENCES iclass.training_course(id) NOT NULL,
    session_id integer REFERENCES iclass.training_session(id),
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    enrollment_source VARCHAR(50) CHECK (enrollment_source IN (
        'self_enrolled', 'manager_assigned', 'hr_assigned', 
        'system_assigned', 'mandatory', 'external'
    )),
    enrolled_by integer REFERENCES auth.user(id),
    status VARCHAR(30) DEFAULT 'enrolled' CHECK (status IN (
        'pending_approval', 'enrolled', 'waitlisted', 
        'in_progress', 'completed', 'failed', 
        'cancelled', 'no_show', 'withdrawn'
    )),
    approval_status VARCHAR(20) CHECK (approval_status IN (
        'pending', 'approved', 'rejected', 'not_required'
    )),
    approved_by integer REFERENCES auth.user(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, session_id)
);

-- Training completion records
CREATE TABLE iclass.training_completion (
    id serial PRIMARY KEY,
    enrollment_id integer REFERENCES iclass.training_enrollment(id),
    user_id integer REFERENCES auth.user(id) NOT NULL,
    course_id integer REFERENCES iclass.training_course(id) NOT NULL,
    session_id integer REFERENCES iclass.training_session(id),
    completion_date DATE NOT NULL,
    completion_status VARCHAR(20) NOT NULL CHECK (completion_status IN (
        'completed', 'passed', 'failed', 'incomplete'
    )),
    score DECIMAL(5,2),
    certificate_number VARCHAR(100),
    certificate_file_path VARCHAR(255),
    certificate_issued_date DATE,
    certificate_expiry_date DATE,
    verified_by integer REFERENCES auth.user(id),
    verification_date TIMESTAMP WITH TIME ZONE,
    verification_method VARCHAR(50),
    external_provider VARCHAR(255),
    external_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ship Types (Rows for the Class Matrix)
CREATE TABLE iclass.ref_ship_type (
    code VARCHAR(10) PRIMARY KEY,
    description VARCHAR(100)
);

INSERT INTO iclass.ref_ship_type (code, description) VALUES
('GEN', 'General Cargo'),
('OTHER', 'Other Ship Types'), -- Corrected typo "OHTER" from source
('BULK', 'Bulk Carrier'),
('OIL', 'Oil Tanker'),
('CHE', 'Chemical Tanker'),
('PAX', 'Passenger Ship'),
('MODU', 'Mobile Offshore Drilling Unit'),
('HSC', 'High Speed Craft'),
('MIL', 'Military/Naval Vessel');

-- Class Actions (Columns for the Class Matrix)
-- Covers New Building (Hull/Mach) and Fleet in Service (Ann/Int/Spec)
CREATE TABLE iclass.ref_class_action (
    code VARCHAR(10) PRIMARY KEY,
    description VARCHAR(100) -- 'New Building' or 'Fleet In Service'
);

INSERT INTO iclass.ref_class_action (code, description) VALUES
('NB_H', 'New Building - Hull'),
('NB_M', 'New Building - Machinery'),
('FIS_ANN', 'Fleet In Service - Annual'),
('FIS_INT', 'Fleet In Service - Intermediate'),
('FIS_S', 'Fleet In Service - Special');

-- Special Modules (Rows for Class Specific Modules)
CREATE TABLE iclass.ref_special_module (
    code VARCHAR(20) PRIMARY KEY,
    description VARCHAR(100)
);

INSERT INTO iclass.ref_special_module (code, description) VALUES
('Bo', 'Boiler Survey'),
('T', 'Propeller Shaft Survey'),
('B', 'Dry Docking'),
('W', 'In-Water Survey'),
('REFCS', 'Refrigerated Cargo System');

-- Class Qualifications (Matrix 1)
-- Links Personnel -> Ship Type -> Survey Type (e.g., Bob -> Bulk -> NB Hull)
CREATE TABLE iclass.qual_class_matrix (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES auth.user(id),
    ship_type_code VARCHAR(10) REFERENCES iclass.ref_ship_type(code),
    action_code VARCHAR(20) REFERENCES iclass.ref_class_action(code),
    
    is_authorized BOOLEAN DEFAULT FALSE,
    authorized_date DATE,
    expiry_date DATE,
    
    -- Ensure unique mapping (one status per cell in the matrix)
    UNIQUE(user_id, ship_type_code, action_code)
);

-- Module Qualifications (Matrix 2)
-- Links Personnel -> Special Module (e.g., Bob -> Boiler)
CREATE TABLE iclass.qual_module_matrix (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES auth.user(id),
    module_code VARCHAR(20) REFERENCES iclass.ref_special_module(code),
    
    is_authorized BOOLEAN DEFAULT FALSE,
    authorized_date DATE,
    expiry_date DATE,
    
    UNIQUE(user_id, module_code)
);

CREATE TABLE iclass.qual_statutory_matrix (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES auth.user(id),
    cert_code VARCHAR(10) REFERENCES iclass.certificate_survey_pool(code),
    phase_code VARCHAR(2) REFERENCES iclass.survey_audit_type(code),
    
    is_authorized BOOLEAN DEFAULT FALSE,
    authorized_date DATE,
    expiry_date DATE,
    
    UNIQUE(user_id, cert_code, phase_code)
);