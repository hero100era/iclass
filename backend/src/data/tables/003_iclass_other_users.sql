CREATE TABLE IF NOT EXISTS iclass.customer(
  id integer PRIMARY KEY REFERENCES auth.user(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  phone varchar(20),
  tax varchar(20),
  contact varchar(500),
  company_id integer REFERENCES iclass.organization(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS iclass.flag_staff (
  id integer PRIMARY KEY REFERENCES auth.user(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  phone varchar(20),
  tax varchar(20),
  contact varchar(500),
  flag_code varchar(3) REFERENCES iclass.flag(code) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
