BEGIN;
-- Set search path and also use tap. prefix just in case
SET search_path TO tap, iclass, public, auth, api;
SELECT tap.plan(4);

-- 1. Setup Data
INSERT INTO iclass.survey_pool (code, name, is_statutory, is_audit)
VALUES ('TEST_SURV', 'Test Survey', TRUE, FALSE)
RETURNING id AS pool_id \gset

INSERT INTO iclass.checklist_section (survey_id, code, section_number, title)
VALUES (:pool_id, 'SEC1', '1', 'Section 1')
RETURNING id AS section_id \gset

INSERT INTO iclass.checklist_item (section_id, item_number, content)
VALUES (:section_id, 1, 'Test Item 1'),
       (:section_id, 2, 'Test Item 2')
RETURNING id AS item_id \gset

INSERT INTO iclass.survey_audit (description, last_held_date, place_held)
VALUES ('Test Audit', CURRENT_DATE, 'Test Port')
RETURNING id AS audit_id \gset

INSERT INTO iclass.job (job_status)
VALUES ('draft')
RETURNING id AS job_id \gset

INSERT INTO iclass.survey_job(job_id, description)
VALUES (:job_id, 'Test Survey Job')
RETURNING id AS survey_job_id \gset

-- 2. Test INSERT on survey_lines
INSERT INTO iclass.survey_line (job_id, survey_audit_id, pool_id)
VALUES (:survey_job_id, :audit_id, :pool_id);

-- Verify checklist items were added
SELECT tap.is(COUNT(*)::integer, 2, 'Should have 2 checklist items added to survey_checklists')
FROM iclass.survey_checklist
WHERE survey_job_id = :survey_job_id AND survey_audit_id = :audit_id;

-- 3. Test DELETE on survey_lines
DELETE FROM iclass.survey_line
WHERE job_id = :survey_job_id AND pool_id = :pool_id;

-- Verify checklist items were removed
SELECT tap.is(COUNT(*)::integer, 0, 'Should have 0 checklist items left in survey_checklists after deletion')
FROM iclass.survey_checklist
WHERE survey_job_id = :survey_job_id AND survey_audit_id = :audit_id;

-- 4. Test Audit Triggers
INSERT INTO iclass.survey_pool (code, name, is_statutory, is_audit)
VALUES ('TEST_AUDIT', 'Test Audit', TRUE, TRUE)
RETURNING id AS audit_pool_id \gset

INSERT INTO iclass.checklist_section (survey_id, code, section_number, title)
VALUES (:audit_pool_id, 'ASEC1', '1', 'Audit Section 1')
RETURNING id AS asection_id \gset

INSERT INTO iclass.checklist_item (section_id, item_number, content)
VALUES (:asection_id, 1, 'Audit Item 1')
RETURNING id AS aitem_id \gset

INSERT INTO iclass.audit_job (job_id, description)
VALUES (:job_id, 'Test Audit Job')
RETURNING id AS audit_job_id \gset

INSERT INTO iclass.audit_line (job_id, survey_audit_id, pool_id)
VALUES (:audit_job_id, :audit_id, :audit_pool_id);

-- Verify checklist items were added
SELECT tap.is(COUNT(*)::integer, 1, 'Should have 1 checklist item added to audit_checklists')
FROM iclass.audit_checklist
WHERE audit_job_id = :audit_job_id AND survey_audit_id = :audit_id;

-- Test DELETE on audit_lines
DELETE FROM iclass.audit_line
WHERE job_id = :audit_job_id AND pool_id = :audit_pool_id;

-- Verify checklist items were removed
SELECT tap.is(COUNT(*)::integer, 0, 'Should have 0 checklist items left in audit_checklists after deletion')
FROM iclass.audit_checklist
WHERE audit_job_id = :audit_job_id AND survey_audit_id = :audit_id;

SELECT * FROM finish();
ROLLBACK;
