-- READ-ONLY. Changes nothing.
-- Lists every column of every table this project uses, one per row, so nothing is cut off.
-- Run it and send the result if a migration complains that a column does not exist.

SELECT c.table_name || '.' || c.column_name || '  ' || c.data_type AS column
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN (
    'profiles', 'properties', 'payments', 'refunds', 'favorites',
    'search_demand_logs', 'lra_audit_logs', 'gsc_metrics',
    'viewing_requests', 'messages', 'reviews', 'listing_reports', 'notifications', 'audit_logs'
  )
ORDER BY c.table_name, c.ordinal_position;
