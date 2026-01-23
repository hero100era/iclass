BEGIN;
SET search_path TO tap, public, iclass, auth, api;
SELECT tap.plan(6);

-- Setup
INSERT INTO iclass.organizations (id, name) VALUES (10001, 'Test Org');
INSERT INTO iclass.flags (code, name, fullname) VALUES ('TST', 'Test Flag', 'Test Flag Full');
INSERT INTO iclass.ships (id, name, imo_number, registered_owner_id, flag_code, type_iacs) 
VALUES (10001, 'Test Ship', '9999999', 10001, 'TST', 'ZZ');

INSERT INTO auth.users (id, email, password_hash, role, category) 
VALUES (10101, 'surveyor@iclass.com', 'pass', 'employees', 'internal'),
       (10102, 'reviewer@iclass.com', 'pass', 'employees', 'internal');

INSERT INTO iclass.employees (id, user_id, organization_id, first_name, last_name, display_name, email)
VALUES (10101, 10101, 10001, 'John', 'Surveyor', 'John Surveyor', 'surveyor@iclass.com'),
       (10102, 10102, 10001, 'Jane', 'Reviewer', 'Jane Reviewer', 'reviewer@iclass.com');

INSERT INTO iclass.survey_pool (id, code, name, type) VALUES (10001, 'ANNUAL', 'Annual Survey', 'A');

INSERT INTO iclass.survey_audits (id, pool_id, description, last_held_date, place_held, task_status)
VALUES (10001, 10001, 'Annual Survey 2026', '2025-01-01', 'Test Port', 'draft');

INSERT INTO iclass.finding_comments (id, ship_id, company_id, comment_type, status, date_issued, text)
VALUES (10001, 10001, 10001, 'finding', 'open', '2026-01-01', 'Test finding text');

INSERT INTO iclass.survey_requests (id, ship_id, company_id, location, status)
VALUES (10001, 10001, 10001, 'Test Port', 'submitted');

INSERT INTO iclass.survey_request_carts (survey_request_id, ship_id, company_id, survey_audit_id)
VALUES (10001, 10001, 10001, 10001);

INSERT INTO iclass.survey_request_carts (survey_request_id, ship_id, company_id, comments_id)
VALUES (10001, 10001, 10001, 10001);

-- Test 1: Successful conversion
SELECT tap.lives_ok(
    'SELECT api.convert_request_to_job(10001, 10101, 10102, NULL)',
    'Should successfully convert request to job'
);

-- Test 2: Check job creation
SELECT tap.is(
    (SELECT count(*)::integer FROM iclass.jobs WHERE location = 'Test Port'),
    1,
    'Job should be created with correct location'
);

-- Test 3: Check survey job creation
SELECT tap.is(
    (SELECT count(*)::integer FROM iclass.survey_jobs WHERE surveyor_id = 10101 AND reviewer_id = 10102),
    1,
    'Survey job should be created with correct assignments'
);

-- Test 4: Check survey line creation
SELECT tap.is(
    (SELECT count(*)::integer FROM iclass.survey_lines WHERE survey_audit_id = 10001),
    1,
    'Survey line should be created for the audit item'
);

-- Test 5: Check request status update
SELECT tap.is(
    (SELECT status FROM iclass.survey_requests WHERE id = 10001),
    'assigned'::iclass.task_status_enum,
    'Request status should be updated to assigned'
);

-- Test 6: Check comment line creation
SELECT tap.is(
    (SELECT count(*)::integer FROM iclass.comment_lines WHERE finding_comment_id = 10001),
    1,
    'Comment line should be created for the finding item'
);

SELECT * FROM tap.finish();
ROLLBACK;
