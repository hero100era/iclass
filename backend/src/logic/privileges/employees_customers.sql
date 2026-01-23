GRANT SELECT, INSERT, UPDATE, DELETE ON iclass.documents TO employees;
GRANT SELECT ON iclass.documents TO customers;

-- Grant access to employees
GRANT SELECT, INSERT, UPDATE, DELETE ON iclass.comment_lines TO employees;