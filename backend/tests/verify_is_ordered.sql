BEGIN;
SET search_path TO tap, public, iclass, auth, api;
SELECT tap.plan(2);

-- Update an existing survey to be ordered
UPDATE iclass.survey_audit SET is_ordered = TRUE WHERE id = (SELECT id FROM iclass.survey_audit LIMIT 1);

-- Test 1: Check if is_ordered is in api.survey_audits
SELECT tap.has_column('api', 'survey_audits', 'is_ordered', 'api.survey_audits should have is_ordered column');

-- Test 2: Check value of is_ordered in the view
SELECT tap.results_eq(
    'SELECT is_ordered FROM api.survey_audits WHERE id = (SELECT id FROM iclass.survey_audit WHERE is_ordered = TRUE LIMIT 1)',
    'SELECT TRUE',
    'api.survey_audits should return correct is_ordered value'
);

SELECT * FROM tap.finish();
ROLLBACK;
