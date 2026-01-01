BEGIN;
SELECT plan(3);

-- 1. Check if the trigger exists on ships table
SELECT has_trigger('iclass', 'ships', 'update_ships_updated_at', 'Trigger update_ships_updated_at should exist on ships table');

-- 2. Test update_updated_at_column trigger
-- Insert a ship
INSERT INTO iclass.ships (name, administration_types, type_iacs, updated_at)
VALUES ('Test Ship', 'C', 'BC', '2000-01-01 00:00:00Z');

-- Get the initial updated_at
SELECT updated_at AS initial_time FROM iclass.ships WHERE name = 'Test Ship' \gset

-- Update the ship
UPDATE iclass.ships SET name = 'Updated Test Ship' WHERE name = 'Test Ship';

-- Check if updated_at has changed
SELECT isnt(
    (SELECT updated_at FROM iclass.ships WHERE name = 'Updated Test Ship'),
    :'initial_time'::timestamp with time zone,
    'updated_at should be updated by the trigger on UPDATE'
);

-- 3. Verify it set to current timestamp (approximately)
SELECT cmp_ok(
    (SELECT updated_at FROM iclass.ships WHERE name = 'Updated Test Ship'),
    '>',
    '2025-01-01 00:00:00Z'::timestamp with time zone,
    'updated_at should be recent'
);

SELECT * FROM finish();
ROLLBACK;
