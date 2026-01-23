-- Create table for linking Finding/Comments to Jobs (Reporting Scope)
CREATE TABLE IF NOT EXISTS iclass.comment_lines(
  id serial PRIMARY KEY,
  job_id integer REFERENCES iclass.jobs(id) ON DELETE CASCADE,
  finding_comment_id integer REFERENCES iclass.finding_comments(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

