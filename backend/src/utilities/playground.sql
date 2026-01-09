SET search_path TO 'api';

CREATE TABLE IF NOT EXISTS api.todos(
  id serial PRIMARY KEY,
  done boolean NOT NULL DEFAULT FALSE,
  task text NOT NULL,
  due timestamptz
);

GRANT usage ON SCHEMA api TO anonymous;

GRANT usage ON SCHEMA api TO admingrp;

GRANT SELECT ON api.todos TO anonymous;

GRANT ALL ON api.todos TO admingrp;

INSERT INTO api.todos(task)
  VALUES ('finish tutorial 0'),
('pat self on back');


SET search_path TO "$user", public;