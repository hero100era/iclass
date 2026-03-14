BEGIN;
SET search_path TO tap, public, iclass, auth, api;
SELECT tap.plan(8);

-- Setup
INSERT INTO iclass.organization (id, name) VALUES (10001, 'Test Org');
INSERT INTO iclass.flag (code, name, fullname) VALUES ('TST', 'Test Flag', 'Test Flag Full');
INSERT INTO iclass.ship (id, name, imo_number, registered_owner_id, flag_code, type_iacs) 
VALUES (10001, 'Test Ship', '9999999', 10001, 'TST', 'ZZ');

INSERT INTO auth.user (id, email, password_hash, role, category) 
VALUES (10101, 'surveyor@iclass.com', 'pass', 'employees', 'internal'),
       (10102, 'reviewer@iclass.com', 'pass', 'employees', 'internal');

INSERT INTO iclass.employee (id, user_id, organization_id, first_name, last_name, display_name, email)
VALUES (10101, 10101, 10001, 'John', 'Surveyor', 'John Surveyor', 'surveyor@iclass.com'),
       (10102, 10102, 10001, 'Jane', 'Reviewer', 'Jane Reviewer', 'reviewer@iclass.com');

-- Setup certificate pool for is_audit checks
INSERT INTO iclass.certificate_survey_pool (code, description)
VALUES ('CL', 'Classification'),
       ('LL', 'Load Line');

INSERT INTO iclass.survey_pool (id, code, name, type, cert_code) 
VALUES (10001, 'CL', 'Classification', 'A', 'CL'),
       (10002, 'LL', 'Load Line', 'O', 'LL');

INSERT INTO iclass.survey_audit (id, pool_id, description, last_held_date, place_held, survey_status)
VALUES (10001, 10001, 'Classification', '2025-01-01', 'Test Port', 'P');

INSERT INTO iclass.finding_comment (id, ship_id, company_id, comment_type, status, date_issued, text)
VALUES (10001, 10001, 10001, 'D', 'A', '2026-01-01', 'Test finding text');

-- Request 1: Regular survey + finding
INSERT INTO iclass.survey_request (id, ship_id, company_id, location, status)
VALUES (10001, 10001, 10001, 'Test Port', 'submitted');

INSERT INTO iclass.survey_request_cart (survey_request_id, ship_id, company_id, survey_audit_id)
VALUES (10001, 10001, 10001, 10001);

INSERT INTO iclass.survey_request_cart (survey_request_id, ship_id, company_id, comment_id)
VALUES (10001, 10001, 10001, 10001);

-- Test 1: Successful conversion
SELECT tap.lives_ok(
    'SELECT api.convert_request_to_job(10001, 10101, 10102, NULL)',
    'Should successfully convert request to job'
);

-- Test 2: Check job creation
SELECT tap.is(
    (SELECT count(*)::integer FROM iclass.job WHERE location = 'Test Port'),
    1,
    'Job should be created with correct location'
);

-- Test 3: Check survey job creation
SELECT tap.is(
    (SELECT count(*)::integer FROM iclass.survey_jobWHERE surveyor_id = 10101 AND reviewer_id = 10102),
    1,
    'Survey job should be created with correct assignments'
);

-- Test 4: Check survey line creation
SELECT tap.is(
    (SELECT count(*)::integer FROM iclass.survey_line WHERE survey_audit_id = 10001),
    1,
    'Survey line should be created for the audit item'
);

-- Test 5: Check request status update
SELECT tap.is(
    (SELECT status FROM iclass.survey_request WHERE id = 10001),
    'assigned'::iclass.task_status_enum,
    'Request status should be updated to assigned'
);

-- Test 6: Check comment line creation
SELECT tap.is(
    (SELECT count(*)::integer FROM iclass.comment_line WHERE finding_comment_id = 10001),
    1,
    'Comment line should be created for the finding item'
);

-- Request 2: Occasional survey + Occasional audit
INSERT INTO iclass.survey_request (id, ship_id, company_id, location, status)
VALUES (10002, 10001, 10001, 'Occasional Port', 'submitted');

INSERT INTO iclass.survey_request_cart (survey_request_id, ship_id, company_id, occ_survey_code)
VALUES (10002, 10001, 10001, 'OCC_SURV'),
       (10002, 10001, 10001, 'OCC_AUDIT');

SELECT api.convert_request_to_job(10002, 10101, 10102, 10101);

-- Test 7: Verify survey line for occasional survey
SELECT tap.is(
    (SELECT count(*)::integer FROM iclass.survey_line sl
     JOIN iclass.survey_jobj ON sl.job_id = sj.id
     JOIN iclass.job j ON sj.job_id = j.id
     WHERE j.location = 'Occasional Port' AND sl.pool_id = 10002),
    1,
    'Survey line should be created for the occasional survey'
);

-- Test 8: Verify audit line for occasional audit
SELECT tap.is(
    (SELECT count(*)::integer FROM iclass.audit_line al
     JOIN iclass.audit_job aj ON al.job_id = aj.id
     JOIN iclass.job j ON aj.job_id = j.id
     WHERE j.location = 'Occasional Port' AND al.pool_id = 10003),
    1,
    'Audit line should be created for the occasional audit'
);

SELECT * FROM tap.finish();
ROLLBACK;
