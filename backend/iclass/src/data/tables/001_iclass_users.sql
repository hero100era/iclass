CREATE TABLE IF NOT EXISTS iclass.employees(
  pk integer PRIMARY KEY REFERENCES auth.users(pk),
  display_name varchar(256) NOT NULL,
  job_title varchar(256),
  department varchar(256),
  office_location varchar(256),
  manager_pk integer REFERENCES iclass.employees(pk),
  teams_upn varchar(256) UNIQUE,
  profile_photo_url text,
  hire_date date
);

CREATE TABLE IF NOT EXISTS iclass.customers(
  pk integer PRIMARY KEY REFERENCES auth.users(pk),
  display_name varchar(256) NOT NULL,
  company_pk integer REFERENCES company(pk)
);
