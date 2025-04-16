SET search_path TO 'api';

CREATE TABLE IF NOT EXISTS todos(
  pk serial PRIMARY KEY,
  done boolean NOT NULL DEFAULT FALSE,
  task text NOT NULL,
  due timestamptz
);

GRANT usage ON SCHEMA api TO anonymous;

GRANT usage ON SCHEMA api TO admingrp;

GRANT SELECT ON todos TO anonymous;

GRANT ALL ON todos TO admingrp;

INSERT INTO todos(task)
  VALUES ('finish tutorial 0'),
('pat self on back');

