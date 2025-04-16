SET search_path TO 'iclass';

CREATE TABLE IF NOT EXISTS employees(
  pk integer PRIMARY KEY REFERENCES auth.user(pk),
  display_name varchar(256) NOT NULL,
  job_title varchar(256),
  department varchar(256),
  office_location varchar(256),
  manager_id integer REFERENCES employees(pk),
  teams_upn varchar(256) UNIQUE,
  profile_photo_url text,
  hire_date date
);

CREATE TABLE IF NOT EXISTS customers(
  pk integer PRIMARY KEY REFERENCES auth.users(pk),
  display_name varchar(256) NOT NULL,
  company_id integer REFERENCES company(pk)
);

