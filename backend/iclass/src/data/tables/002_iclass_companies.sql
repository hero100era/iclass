-- Create table for companies
CREATE TABLE IF NOT EXISTS iclass.companies(
  pk serial PRIMARY KEY,
  imo_number varchar(7) UNIQUE,
  name varchar(80) NOT NULL,
  address varchar(500),
  mlc_responsibility boolean,
  country char(3),
  city varchar(100),
  zip_code varchar(20),
  doc_ships_types varchar(30),
  operation_address1 text,
  operation_address2 text,
  operation_address3 text,
  contract_file varchar(128),
  contract_start date,
  contract_end date,
  contact_details varchar(500),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
