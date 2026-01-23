BEGIN;
SET search_path TO tap, public, iclass, auth, api;
SELECT plan(4);

-- 1. Setup: Find a survey audit that is NOT ordered
SELECT has_column('iclass', 'survey_audits', 'is_ordered', 'survey_audits should have is_ordered column');

-- Get a test survey audit
-- We might need to insert one if none exist or are not ordered
INSERT INTO iclass.survey_audits (description, last_held_date, place_held, status, is_ordered)
VALUES ('Test Survey Audit', '2025-01-01', 'Test Port', 'O', false)
RETURNING id AS test_id \gset

-- 2. Verify it is NOT ordered
SELECT is(is_ordered, false, 'Survey audit should initially not be ordered') FROM iclass.survey_audits WHERE id = :test_id;

-- 3. Insert into survey_request_carts
INSERT INTO iclass.survey_request_carts (survey_audit_id)
VALUES (:test_id);

-- 4. Verify it IS now ordered
SELECT is(is_ordered, true, 'Survey audit should be ordered after insertion into cart') FROM iclass.survey_audits WHERE id = :test_id;

-- 5. Delete from survey_request_carts
DELETE FROM iclass.survey_request_carts WHERE survey_audit_id = :test_id;

-- 6. Verify it is NOT ordered anymore
SELECT is(is_ordered, false, 'Survey audit should not be ordered after deletion from cart') FROM iclass.survey_audits WHERE id = :test_id;

SELECT * FROM finish();
ROLLBACK;
