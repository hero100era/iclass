-- Create table for documents
CREATE TABLE IF NOT EXISTS iclass.documents (
  id serial PRIMARY KEY,
  ship_id integer REFERENCES iclass.ships(id) ON DELETE CASCADE,
  company_id integer REFERENCES iclass.companies(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  type varchar(50),
  file_path varchar(512),
  upload_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  expiry_date date,
  status varchar(20),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


