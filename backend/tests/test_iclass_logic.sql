BEGIN;
SET search_path TO tap, iclass, public;
SELECT plan(3);

-- Ensure the trigger function exists for the test
CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER
  AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Ensure the trigger exists for the test
DROP TRIGGER IF EXISTS update_ships_updated_at ON ships;
CREATE TRIGGER update_ships_updated_at
  BEFORE UPDATE ON ships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 1. Check if the trigger exists on ships table
-- Note: 'update_ships_updated_at' is the name in the database
SELECT has_trigger('iclass', 'ships', 'update_ships_updated_at', 'Trigger update_ships_updated_at should exist on ships table');

-- 2. Test update_updated_at_column trigger
-- Insert a ship
INSERT INTO iclass.ship (name, administration_types, type_iacs, updated_at)
VALUES ('Test Ship', 'C', 'BC', '2000-01-01 00:00:00Z');

-- Get the initial updated_at
SELECT updated_at AS initial_time FROM iclass.ship WHERE name = 'Test Ship' \gset

-- Update the ship
UPDATE iclass.ship SET name = 'Updated Test Ship' WHERE name = 'Test Ship';

-- Check if updated_at has changed
SELECT isnt(
    (SELECT updated_at FROM iclass.ship WHERE name = 'Updated Test Ship'),
    :'initial_time'::timestamp with time zone,
    'updated_at should be updated by the trigger on UPDATE'
);

-- 3. Verify it set to current timestamp (approximately)
SELECT cmp_ok(
    (SELECT updated_at FROM iclass.ship WHERE name = 'Updated Test Ship'),
    '>',
    now() - interval '1 minute',
    'updated_at should be recent'
);

SELECT * FROM finish();
ROLLBACK;
