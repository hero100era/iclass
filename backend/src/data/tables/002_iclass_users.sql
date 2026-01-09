CREATE TABLE IF NOT EXISTS iclass.employees(
  id integer PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name varchar(256) NOT NULL,
  job_title varchar(256),
  department varchar(256),
  office_location varchar(256),
  manager_id integer REFERENCES iclass.employees(id),
  teams_upn varchar(256) UNIQUE,
  profile_photo_url text,
  hire_date date,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS iclass.customers(
  id integer PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  phone varchar(20),
  tax varchar(20),
  contact varchar(500),
  company_id integer REFERENCES iclass.companies(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS iclass.flag_staff (
  id integer PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  phone varchar(20),
  tax varchar(20),
  contact varchar(500),
  flag_code varchar(3) REFERENCES iclass.flags(code) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
