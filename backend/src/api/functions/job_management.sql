-- Logic for managing jobs and converting requests to jobs

CREATE OR REPLACE FUNCTION api.convert_request_to_job(
    p_request_id integer,
    p_surveyor_id integer DEFAULT NULL,
    p_reviewer_id integer DEFAULT NULL,
    p_auditor_id integer DEFAULT NULL
) RETURNS integer AS $$
DECLARE
    v_job_id integer;
    v_ship_id integer;
    v_company_id integer;
    v_location varchar(100);
    v_survey_job_id integer;
    v_audit_job_id integer;
    v_cart_item RECORD;
    v_has_survey boolean := FALSE;
    v_has_audit boolean := FALSE;
BEGIN
    -- 1. Get request details
    SELECT ship_id, company_id, location 
    INTO v_ship_id, v_company_id, v_location
    FROM iclass.survey_requests
    WHERE id = p_request_id AND status = 'submitted';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found or not in submitted status';
    END IF;

    -- 2. Create the main job
    INSERT INTO iclass.jobs (location, job_status)
    VALUES (v_location, 'assigned')
    RETURNING id INTO v_job_id;

    -- 3. Check what's in the cart and create sub-jobs
    -- We'll assume for now that if there are items in the cart, we need to categorize them.
    -- In this schema, survey_audits can be either survey or audit based on the pool type.
    
    FOR v_cart_item IN SELECT * FROM iclass.survey_request_carts WHERE survey_request_id = p_request_id LOOP
        IF v_cart_item.survey_audit_id IS NOT NULL THEN
            -- Check if it's an audit or survey
            -- We will check iclass.survey_pool.cert_code -> is_audit
            
            IF EXISTS (
                SELECT 1 FROM iclass.survey_audits sa
                JOIN iclass.survey_pool sp ON sa.pool_id = sp.id
                JOIN iclass.certificate_survey_pool csp ON sp.cert_code = csp.code
                WHERE sa.id = v_cart_item.survey_audit_id AND csp.is_audit = TRUE
            ) THEN
                v_has_audit := TRUE;
            ELSE
                v_has_survey := TRUE;
            END IF;
        END IF;

        IF v_cart_item.occ_survey_code IS NOT NULL THEN
            -- Check if it's an audit or survey via survey_pool
            IF EXISTS (
                SELECT 1 FROM iclass.survey_pool sp
                WHERE sp.code = v_cart_item.occ_survey_code AND sp.is_audit = TRUE
            ) THEN
                v_has_audit := TRUE;
            ELSE
                v_has_survey := TRUE;
            END IF;
        END IF;
    END LOOP;

    -- 4. Create Survey Job if needed
    IF v_has_survey THEN
        INSERT INTO iclass.survey_jobs (job_id, ship_id, surveyor_id, reviewer_id)
        VALUES (v_job_id, v_ship_id, p_surveyor_id, p_reviewer_id)
        RETURNING id INTO v_survey_job_id;

        -- Add lines (mandatory surveys)
        INSERT INTO iclass.survey_lines (job_id, survey_audit_id, pool_id)
        SELECT v_survey_job_id, src.survey_audit_id, sa.pool_id
        FROM iclass.survey_request_carts src
        JOIN iclass.survey_audits sa ON src.survey_audit_id = sa.id
        JOIN iclass.survey_pool sp ON sa.pool_id = sp.id
        JOIN iclass.certificate_survey_pool csp ON sp.cert_code = csp.code
        WHERE src.survey_request_id = p_request_id AND src.survey_audit_id IS NOT NULL
        AND csp.is_audit = FALSE;

        -- Add lines (occasional surveys)
        INSERT INTO iclass.survey_lines (job_id, pool_id)
        SELECT v_survey_job_id, sp.id
        FROM iclass.survey_request_carts src
        JOIN iclass.survey_pool sp ON src.occ_survey_code = sp.code
        WHERE src.survey_request_id = p_request_id AND src.occ_survey_code IS NOT NULL
        AND sp.is_audit = FALSE;
    END IF;

    -- 5. Create Audit Job if needed
    IF v_has_audit THEN
        INSERT INTO iclass.audit_jobs (job_id, ship_id, company_id, auditor_id, reviewer_id)
        VALUES (v_job_id, v_ship_id, v_company_id, p_auditor_id, p_reviewer_id)
        RETURNING id INTO v_audit_job_id;

        -- Add lines (mandatory audits)
        INSERT INTO iclass.audit_lines (job_id, survey_audit_id, pool_id)
        SELECT v_audit_job_id, src.survey_audit_id, sa.pool_id
        FROM iclass.survey_request_carts src
        JOIN iclass.survey_audits sa ON src.survey_audit_id = sa.id
        JOIN iclass.survey_pool sp ON sa.pool_id = sp.id
        JOIN iclass.certificate_survey_pool csp ON sp.cert_code = csp.code
        WHERE src.survey_request_id = p_request_id AND src.survey_audit_id IS NOT NULL
        AND csp.is_audit = TRUE;

        -- Add lines (occasional audits)
        INSERT INTO iclass.audit_lines (job_id, pool_id)
        SELECT v_audit_job_id, sp.id
        FROM iclass.survey_request_carts src
        JOIN iclass.survey_pool sp ON src.occ_survey_code = sp.code
        WHERE src.survey_request_id = p_request_id AND src.occ_survey_code IS NOT NULL
        AND sp.is_audit = TRUE;
    END IF;

    -- 6. Add findings/recommendations to the job scope
    INSERT INTO iclass.comment_lines (job_id, finding_comment_id)
    SELECT v_job_id, comment_id
    FROM iclass.survey_request_carts
    WHERE survey_request_id = p_request_id AND comment_id IS NOT NULL;

    -- 7. Update request status
    UPDATE iclass.survey_requests
    SET status = 'assigned', is_assigned = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE id = p_request_id;

    RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute
GRANT EXECUTE ON FUNCTION api.convert_request_to_job TO employees;
