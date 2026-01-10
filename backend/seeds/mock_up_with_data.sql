-- Flags
INSERT INTO iclass.flags(code, name, fullname, email, tel, fax, contact, contract_file, contract_start, contract_end, is_hssc)
VALUES 
  ('CN', 'China', 'People''s Republic of China', 'info@msa.gov.cn', '+86 10 1234 5678', '+86 10 1234 5679', 'MSA Headquarters', '/contracts/flags/cn_contract.pdf', '2024-01-01', '2029-12-31', TRUE),
  ('US', 'United States', 'United States of America', 'info@uscg.mil', '+1 202 555 0123', '+1 202 555 0124', 'USCG Headquarters', '/contracts/flags/us_contract.pdf', '2023-01-01', '2028-12-31', TRUE),
  ('SG', 'Singapore', 'Republic of Singapore', 'shipping@mpa.gov.sg', '+65 1234 5678', '+65 1234 5679', 'MPA Port Master', '/contracts/flags/sg_contract.pdf', '2022-01-01', '2027-12-31', TRUE),
  ('PA', 'Panama', 'Republic of Panama', 'info@amp.gob.pa', '+507 123 4567', '+507 123 4568', 'AMP Registry', '/contracts/flags/pa_contract.pdf', '2023-06-01', '2028-05-31', TRUE),
  ('MH', 'Marshall Islands', 'Republic of the Marshall Islands', 'maritime@register-iri.com', '+1 123 456 7890', '+1 123 456 7891', 'IRI Maritime', '/contracts/flags/mh_contract.pdf', '2024-03-01', '2029-02-28', TRUE)
ON CONFLICT DO NOTHING;

-- organizations
INSERT INTO iclass.organizations (tenant_id, name, display_name, imo_number, doc_ships_types)
VALUES 
('tenant-damoco-id','DAMICO', 'DAMICEO SPA', '7634567', 'BC OIL GEN'),
('tenant-zhouji-id','Zhouji', 'Zhou Ji Ship Management', '7634563', 'BC OIL GEN CHE')
ON CONFLICT DO NOTHING;

-- Ship Component Templates
INSERT INTO iclass.ship_comp_templates (code, name, properties)
VALUES 
  ('ME', 'Main Engine', '{"maker": "MAN B&W", "model": "6S60MC-C", "power_kw": 12000}'),
  ('AE', 'Auxiliary Engine', '{"maker": "Yanmar", "model": "6EY22LW", "power_kw": 1000}'),
  ('BLR', 'Main Boiler', '{"maker": "Alfa Laval", "model": "Aalborg Mission OL", "capacity_kg_h": 25000}'),
  ('ST', 'Steering Gear', '{"maker": "Rolls-Royce", "type": "Electro-hydraulic"}')
ON CONFLICT DO NOTHING;

-- Certificate Templates
INSERT INTO iclass.certificate_templates (code, name, version, survey_audit_code, internal_category, file_path_xml, file_path_html, description)
VALUES 
  ('CSS-T', 'Cargo Ship Safety Template', '1.0', 'CSS', 'ST', '/templates/css.rml', '/templates/css.html', 'Standard template for Cargo Ship Safety'),
  ('SMC-T', 'Safety Management Template', '2.1', 'SMC', 'ST', '/templates/smc.rml', '/templates/smc.html', 'Template for Safety Management Certificate'),
  ('LL-T', 'Load Line Template', '1.2', 'LL', 'ST', '/templates/ll.rml', '/templates/ll.html', 'Standard International Load Line Certificate'),
  ('CL-T', 'Classification Template', '3.0', 'CL', 'CL', '/templates/cl.rml', '/templates/cl.html', 'Certificate of Classification')
ON CONFLICT DO NOTHING;

-- Ships
INSERT INTO iclass.ships(
  name, imo_number, previous_names, build_date, commissioning_date, keel_laid_date, contract_date, class_entry_date,
  administration_types, administration_country, classed_by, port_of_registry, date_of_registry, registry_number,
  call_sign, official_number, type_iacs, type_other, type_mms, class_status, ship_status, class_notation,
  gross_tons, national_tons, deadweight, net_tons, light_ship, ballast_capacity, equipment_number,
  length, length_oa, length_bp, moulded_depth, moulded_breadth, moulded_draft, design_draft,
  dual_class, singal_letter, flag_code, registration_port, mmsi_number, main_class,
  registered_owner_id, ism_owner_id, mlc_owner_id
) 
VALUES 
  (
    'JIA HE', '9345678', 'HUA MEI', '2010-05-15', '2010-07-20', '2009-11-10', '2009-08-01', '2010-06-01',
    'C', 'CHN', 'ABS', 'Shanghai', '2010-06-15', 'REG-CN-9345',
    'ABC123', 'OFF-9345', 'BC', NULL, 'BC', 'V', 'E', '+100A1 Bulk Carrier',
    10000.00, 10000.00, 15000, 6000.00, 4500.00, 8000.00, 1500,
    150.00, 160.00, 145.00, 12.00, 25.00, 8.50, 9.00,
    'CCS', 'ABC123', 'CN', 'Shanghai', '123456789', 'Bulk Carrier',
    (SELECT id FROM iclass.organizations WHERE imo_number = '3456789'),
    (SELECT id FROM iclass.organizations WHERE imo_number = '3456789'),
    (SELECT id FROM iclass.organizations WHERE imo_number = '3456789')
  ),
  (
    'OCEAN TRADER', '9123456', NULL, '2005-03-10', '2005-05-12', '2004-09-05', '2004-06-20', '2005-04-15',
    'C', 'SGP', 'LR', 'Singapore', '2005-05-01', 'REG-SG-9123',
    'SG9923', 'OFF-9123', 'GC', NULL, 'GC', 'V', 'E', '100A1 General Cargo Ship',
    15000.00, 15000.00, 20000, 9000.00, 6500.00, 12000.00, 2200,
    180.00, 190.00, 175.00, 15.00, 28.00, 10.00, 10.50,
    'NK', 'SG9923', 'SG', 'Singapore', '563123456', 'General Cargo',
    (SELECT id FROM iclass.organizations WHERE imo_number = '1234567'),
    (SELECT id FROM iclass.organizations WHERE imo_number = '1234567'),
    (SELECT id FROM iclass.organizations WHERE imo_number = '1234567')
  ),
  (
    'SEA VOYAGER', '9234567', 'VOYAGER ONE', '2008-09-22', '2008-11-15', '2007-12-01', '2007-10-10', '2008-10-20',
    'C', 'PAN', 'BV', 'Panama City', '2008-11-01', 'REG-PA-9234',
    'HP2293', 'OFF-9234', 'OT', NULL, 'OT', 'V', 'E', 'Oil Tanker, FLS',
    45000.00, 45000.00, 80000, 25000.00, 18000.00, 35000.00, 4500,
    240.00, 250.00, 235.00, 21.00, 42.00, 14.50, 15.00,
    'ABS', 'HP2293', 'PA', 'Panama City', '351445000', 'Oil Tanker',
    (SELECT id FROM iclass.organizations WHERE imo_number = '2345678'),
    (SELECT id FROM iclass.organizations WHERE imo_number = '4567890'),
    (SELECT id FROM iclass.organizations WHERE imo_number = '4567890')
  ),
  (
    'PACIFIC STAR', '9455667', NULL, '2015-11-30', '2016-01-15', '2014-12-20', '2014-09-01', '2016-01-05',
    'C', 'MHL', 'ABS', 'Majuro', '2016-01-10', 'REG-MH-9455',
    'V7A234', 'OFF-9455', 'PS', NULL, 'PS', 'V', 'E', 'Passenger Ship, Unrestricted Service',
    60000.00, 60000.00, 10000, 35000.00, 25000.00, 8000.00, 6000,
    260.00, 280.00, 250.00, 25.00, 32.00, 8.00, 8.50,
    'LR', 'V7A234', 'MH', 'Majuro', '538001234', 'Passenger Ship',
    (SELECT id FROM iclass.organizations WHERE imo_number = '2345678'),
    (SELECT id FROM iclass.organizations WHERE imo_number = '2345678'),
    (SELECT id FROM iclass.organizations WHERE imo_number = '2345678')
  ) 
ON CONFLICT DO NOTHING;

-- Certificates
INSERT INTO iclass.certificates (
  version, ship_id, company_id, status, remark, issued_by, code, validity_type, category, internal_category,
  description, issue_date, expiry_date, mlc_declaration_date, mlc_declaration_place, doc_administration, extended_date
)
VALUES
  (
    1, (SELECT id FROM iclass.ships WHERE imo_number = '9345678'), NULL,
    'V', 'OK', 'ABS', 'SPP', 'F', 'IC', 'ST',
    'Safety Equipment Certificate', CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE + INTERVAL '4 years',
    NULL, NULL, NULL, NULL
  ),
  (
    1, (SELECT id FROM iclass.ships WHERE imo_number = '9123456'), NULL,
    'V', 'OK', 'LR', 'CL', 'F', 'IC', 'CL',
    'Classification Certificate', CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '4.5 years',
    NULL, NULL, NULL, NULL
  ),
  (
     2, (SELECT id FROM iclass.ships WHERE imo_number = '9234567'), NULL,
    'S', 'XX', 'BV', 'LL', 'F', 'IC', 'ST',
    'Load Line Certificate', CURRENT_DATE - INTERVAL '2 years', CURRENT_DATE + INTERVAL '3 years',
    NULL, NULL, 'PA', NULL
  ),
  (
    1, (SELECT id FROM iclass.ships WHERE imo_number = '9345678'), NULL,
    'V', 'OK', 'ABS', 'SMC', 'F', 'IC', 'ST',
    'Safety Management Certificate', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '4 years 11 months',
    '2023-12-01', 'CN', NULL, NULL
  ),
  (
    1, (SELECT id FROM iclass.ships WHERE imo_number = '9345678'), NULL,
    'V', 'OK', 'LR', 'DOC', 'F', 'IC', 'DoC',
    'Document of Compliance', CURRENT_DATE - INTERVAL '2 years', CURRENT_DATE + INTERVAL '3 years',
    NULL, NULL, 'SG', NULL
  )
ON CONFLICT DO NOTHING;

-- Survey Audits
INSERT INTO iclass.survey_audits (certificate_id, code, description, last_held_date, place_held, next_due_date, postponement_date, status, range_from_date, range_to_date, fee)
VALUES
  (
    (SELECT id FROM iclass.certificates WHERE certificate_id = 1 AND version = 1),
    'CSS', 'Annual Survey for Safety Equipment', CURRENT_DATE - INTERVAL '1 month', 'Shanghai',
    CURRENT_DATE + INTERVAL '11 months', NULL, 'D', CURRENT_DATE + INTERVAL '9 months', CURRENT_DATE + INTERVAL '15 months', 1500.00
  ),
  (
    (SELECT id FROM iclass.certificates WHERE certificate_id = 1 AND version = 1),
    'CL', 'Intermediate Classification Survey', CURRENT_DATE - INTERVAL '2 years', 'Singapore',
    CURRENT_DATE + INTERVAL '6 months', NULL, 'D', CURRENT_DATE + INTERVAL '3 months', CURRENT_DATE + INTERVAL '9 months', 5000.00
  ),
  (
    (SELECT id FROM iclass.certificates WHERE certificate_id = 2 AND version = 1),
    'LL', 'Renewal Load Line Survey', CURRENT_DATE - INTERVAL '3 years', 'Panama',
    CURRENT_DATE - INTERVAL '2 days', NULL, 'O', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '3 months', 2500.00
  ),
  (
    (SELECT id FROM iclass.certificates WHERE certificate_id = 2 AND version = 1),
    'SMC', 'Intermediate Safety Management Audit', CURRENT_DATE - INTERVAL '2.5 years', 'Miami',
    CURRENT_DATE + INTERVAL '2 months', CURRENT_DATE + INTERVAL '3 months', 'B', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '5 months', 3000.00
  )
ON CONFLICT DO NOTHING;

-- Finding Comments
INSERT INTO iclass.finding_comments (
  ship_id, company_id, comment_type, priviate, certificates, date_issued, place_issued, due_date, expiry_survey_audits,
  status, postponed_due_date, postponed_expiry_survey_audits, mms_reference, text
)
VALUES
  (
    (SELECT id FROM iclass.ships WHERE imo_number = '9345678'), NULL, 'M', FALSE, 'CERT-JH-001',
    CURRENT_DATE - INTERVAL '1 month', 'Shanghai', CURRENT_DATE + INTERVAL '1 month', 'Next Annual', 'A',
    NULL, NULL, 'MMS-2024-001', 'Liferaft service due soon.'
  ),
  (
    (SELECT id FROM iclass.ships WHERE imo_number = '9123456'), NULL, 'C', FALSE, 'CERT-OT-002',
    CURRENT_DATE - INTERVAL '2 months', 'Singapore', CURRENT_DATE + INTERVAL '4 months', 'Next Renewal', 'A',
    CURRENT_DATE + INTERVAL '6 months', 'Extended to Final', 'MMS-2024-002', 'Slight corrosion observed on main deck plating.'
  ),
  (
    (SELECT id FROM iclass.ships WHERE imo_number = '9234567'), NULL, 'N', TRUE, 'CERT-SV-003',
    CURRENT_DATE - INTERVAL '5 days', 'Panama', CURRENT_DATE + INTERVAL '25 days', NULL, 'A',
    NULL, NULL, NULL, 'Fire drill records incomplete.'
  ),
  (
    NULL, (SELECT id FROM iclass.organizations WHERE imo_number = '1234567'), 'O', FALSE, 'CERT-DOC-001',
    CURRENT_DATE - INTERVAL '1 year', 'Singapore', NULL, NULL, 'A',
    NULL, NULL, 'MMS-2024-003', 'Company maintenance system well organized.'
  )
ON CONFLICT DO NOTHING;

-- Documents
INSERT INTO iclass.documents (ship_id, company_id, name, type, file_path, expiry_date, status)
VALUES
  ((SELECT id FROM iclass.ships WHERE imo_number = '9345678'), NULL, 'Main Deck Plan', 'Drawing', '/files/ships/9345678/deck-plan.pdf', NULL, 'Final'),
  ((SELECT id FROM iclass.ships WHERE imo_number = '9345678'), NULL, 'GA Plan', 'Drawing', '/files/ships/9345678/ga-plan.pdf', NULL, 'Final'),
  ((SELECT id FROM iclass.ships WHERE imo_number = '9123456'), NULL, 'Stability Booklet', 'Manual', '/files/ships/9123456/stability.pdf', '2030-01-01', 'Approved'),
  (NULL, (SELECT id FROM iclass.organizations WHERE imo_number = '1234567'), 'Company SMS Manual', 'Manual', '/files/companies/1234567/sms-manual.pdf', '2026-12-31', 'Final')
ON CONFLICT DO NOTHING;