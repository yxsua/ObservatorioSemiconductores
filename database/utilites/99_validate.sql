SELECT
    table_schema,
    table_name
FROM
    information_schema.tables
WHERE
    table_type = 'BASE TABLE'
AND
    table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY
    table_schema,
    table_name;

SELECT
    table_schema,
    table_name
FROM
    information_schema.views
WHERE
    table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY
    table_schema,
    table_name;

SELECT
    routine_schema,
    routine_name
FROM
    information_schema.routines
WHERE
    routine_type = 'FUNCTION'
AND
    routine_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY
    routine_schema,
    routine_name;

SELECT
    trigger_schema,
    trigger_name,
    event_object_table
FROM
    information_schema.triggers
WHERE
    trigger_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY
    trigger_schema,
    trigger_name;