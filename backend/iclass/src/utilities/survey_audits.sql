SET search_path TO 'iclass, public';

CREATE TYPE iclass.job_status_enum AS ENUM(
  'ST',
  'PD',
  'AS',
  'UR',
  'IP',
  'CP',
  'AB'
);

CREATE TABLE IF NOT EXISTS iclass.job_status(
  code varchar(2) PRIMARY KEY,
  description varchar(20) NOT NULL
);

INSERT INTO iclass.job_status(code, description)
  VALUES ('ST', 'START'),
('PD', 'PENDING'),
('AS', 'ASSIGNED'),
('UR', 'UNDER_REVIEW'),
('IP', 'IN_PROGRESS'),
('CP', 'COMPLETED'),
('AB', 'ABONDONED')
ON CONFLICT
  DO NOTHING;

CREATE TABLE IF NOT EXISTS iclass.surveys(
  pk serial PRIMARY KEY,
  description varchar(255),
  status job_status_enum NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_by varchar(100) NOT NULL,
  created_at timestamp NOT NULL,
  location varchar(100) NOT NULL,
  ship_id integer REFERENCES ships(pk),
  surveyor_id integer REFERENCES iclass.employees(pk),
  reviewer_id integer REFERENCES iclass.employees(pk),
  statement varchar(255),
  draft varchar(255),
  comments text
)
PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS surveys_default PARTITION OF surveys DEFAULT;

-- CREATE TABLE surveys_2025 PARTITION OF surveys FOR VALUES FROM ('2025-01-01 00:00:00') TO ('2026-01-01 00:00:00');
CREATE TABLE IF NOT EXISTS iclass.audits(
  pk serial PRIMARY KEY,
  description varchar(255),
  status job_status_enum NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_by varchar(100) NOT NULL,
  created_date timestamp NOT NULL,
  ship_id integer REFERENCES ships(pk),
  company_id integer REFERENCES iclass.companies(pk),
  auditor_id integer REFERENCES iclass.employees(pk),
  reviewer_id integer REFERENCES iclass.employees(pk),
  statement varchar(255),
  draft varchar(255),
  comments text,
  is_doc boolean DEFAULT FALSE
)
PARTITION BY RANGE (created_date);

CREATE TABLE IF NOT EXISTS iclass.audits_default PARTITION OF iclass.audits DEFAULT;

-- CREATE TABLE auditss_2025 PARTITION OF auditss FOR VALUES FROM ('2025-01-01 00:00:00') TO ('2026-01-01 00:00:00');
CREATE TABLE IF NOT EXISTS iclass.ms_jobs(
  pk serial PRIMARY KEY,
  description varchar(255),
  status job_status_enum NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_by varchar(100) NOT NULL,
  created_at timestamp NOT NULL,
  operator_id integer REFERENCES iclass.employees(pk),
  ship_id integer REFERENCES iclass.ships(pk),
  company_id integer REFERENCES iclass.companies(pk)
)
PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS iclass.ms_jobs_default PARTITION OF iclass.ms_jobs DEFAULT;

-- CREATE TABLE ms_jobss_2025 PARTITION OF ms_jobss FOR VALUES FROM ('2025-01-01 00:00:00') TO ('2026-01-01 00:00:00');
