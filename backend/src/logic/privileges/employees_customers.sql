GRANT SELECT, INSERT, UPDATE, DELETE ON iclass.document TO employees;
GRANT SELECT ON iclass.document TO customers;

-- Grant access to employees
GRANT SELECT, INSERT, UPDATE, DELETE ON iclass.comment_line TO employees;