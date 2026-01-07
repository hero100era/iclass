SET search_path TO 'iclass, public';

CREATE TABLE IF NOT EXISTS table_data_changes(
  pk bigserial,
  changed_by varchar(64) NOT NULL,
  table_name varchar(64) NOT NULL,
  row_pk bigint NOT NULL,
  opr_type varchar(10) NOT NULL,
  changed_data jsonb NOT NULL,
  changed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (pk, changed_at)
)
PARTITION BY RANGE (changed_at);

-- Create a default partition
CREATE TABLE IF NOT EXISTS table_data_changes_default PARTITION OF table_data_changes DEFAULT;

-- Create indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_table_data_changes_table_name ON table_data_changes(table_name, changed_at);

CREATE INDEX IF NOT EXISTS idx_table_data_changes_row_pk ON table_data_changes(row_pk, changed_at);

CREATE INDEX IF NOT EXISTS idx_table_data_changes_changed_by ON table_data_changes(changed_by, changed_at);

-- Create a trigger function to log changes to the table_data_changes table
CREATE OR REPLACE FUNCTION log_table_changes()
  RETURNS TRIGGER
  AS $$
DECLARE
  changed_data jsonb;
  row_pk bigint;
BEGIN
  BEGIN
    IF TG_OP = 'DELETE' THEN
      row_pk := OLD.pk;
    ELSE
      row_pk := NEW.pk;
    END IF;
  EXCEPTION
    WHEN undefined_column THEN
      RAISE WARNING 'Table "%" must have a column named "pk" to use the log_table_changes trigger', TG_TABLE_NAME;
      RETURN NULL;
  END;
  -- Prepare changed data based on operation type
  IF TG_OP = 'UPDATE' THEN
    -- Only store the actual changes for updates
    changed_data := jsonb_object_agg(key, value)
  FROM (
    SELECT
      key,
      value
    FROM
      jsonb_each(to_jsonb(NEW))
    WHERE
      value IS DISTINCT FROM (to_jsonb(OLD) -> key)) AS changes;
ELSIF TG_OP = 'DELETE' THEN
  changed_data := to_jsonb(OLD);
ELSIF TG_OP = 'INSERT' THEN
  changed_data := to_jsonb(NEW);
    END IF;
    -- Only log if there are actual changes (for updates)
    IF TG_OP != 'UPDATE' OR changed_data IS NOT NULL THEN
      INSERT INTO table_data_changes(changed_by, opr_type, table_name, row_pk, changed_data)
        VALUES (CURRENT_USER, TG_OP, TG_TABLE_NAME, row_pk, changed_data);
      END IF;
      IF TG_OP = 'DELETE' THEN
        RETURN OLD;
        END IF;
        RETURN NEW;
END;

$$
LANGUAGE plpgsql;

-- Helper function to easily apply the trigger to any table
CREATE OR REPLACE FUNCTION add_change_tracking(target_table text)
  RETURNS void
  AS $$
BEGIN
  EXECUTE format('
    CREATE TRIGGER %I
    AFTER INSERT OR UPDATE OR DELETE ON %s
    FOR EACH ROW
    EXECUTE FUNCTION log_table_changes();
  ', target_table || '_changes_trigger', target_table);
END;
$$
LANGUAGE plpgsql;

-- Example usage:
-- SELECT add_change_tracking('todo');
-- Create a maintenance function to automatically create future partitions
CREATE OR REPLACE FUNCTION create_audit_partition(year int)
  RETURNS void
  AS $$
BEGIN
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS table_data_changes_%s
    PARTITION OF table_data_changes
    FOR VALUES FROM (%L) TO (%L);
  ', year, year || '-01-01 00:00:00',(year + 1) || '-01-01 00:00:00');
END;
$$
LANGUAGE plpgsql;

-- Create current and next year partitions
-- SELECT create_audit_partition(EXTRACT(YEAR FROM CURRENT_DATE)::int);
-- SELECT create_audit_partition(EXTRACT(YEAR FROM CURRENT_DATE)::int + 1);

SET search_path TO "$user", public;
