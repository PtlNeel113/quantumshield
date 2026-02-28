-- QuantumShield Database Maintenance Scripts
-- Run these periodically for optimal performance

-- =============================================================================
-- VACUUM AND ANALYZE
-- =============================================================================

-- Full vacuum (requires exclusive lock - run during maintenance window)
-- VACUUM FULL ANALYZE;

-- Regular vacuum (can run during normal operations)
VACUUM ANALYZE organizations;
VACUUM ANALYZE users;
VACUUM ANALYZE assets;
VACUUM ANALYZE asset_metadata;
VACUUM ANALYZE scan_targets;
VACUUM ANALYZE encryption_inventory;
VACUUM ANALYZE data_classifications;
VACUUM ANALYZE data_longevity;
VACUUM ANALYZE exposure_scores;
VACUUM ANALYZE quantum_models;
VACUUM ANALYZE quantum_break_estimates;
VACUUM ANALYZE attack_simulations;
VACUUM ANALYZE migration_recommendations;
VACUUM ANALYZE crypto_technical_debt;
VACUUM ANALYZE reports;

-- Partitioned tables (vacuum each partition)
VACUUM ANALYZE scan_jobs;
VACUUM ANALYZE tls_findings;
VACUUM ANALYZE crypto_findings;
VACUUM ANALYZE risk_scores;
VACUUM ANALYZE audit_logs;

-- =============================================================================
-- REINDEX
-- =============================================================================

-- Reindex all tables (run during maintenance window)
-- REINDEX DATABASE postgres;

-- Reindex specific tables
REINDEX TABLE assets;
REINDEX TABLE risk_scores;
REINDEX TABLE crypto_findings;
REINDEX TABLE tls_findings;

-- =============================================================================
-- UPDATE STATISTICS
-- =============================================================================

ANALYZE organizations;
ANALYZE users;
ANALYZE assets;
ANALYZE risk_scores;
ANALYZE crypto_findings;
ANALYZE tls_findings;

-- =============================================================================
-- REFRESH MATERIALIZED VIEWS
-- =============================================================================

-- Refresh all materialized views
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_quantum_risk_assets;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_crypto_algorithm_distribution;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_data_longevity_distribution;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_migration_priority_list;

-- =============================================================================
-- PARTITION MANAGEMENT
-- =============================================================================

-- Create next month's partitions (run at end of each month)
-- Example for March 2026:

DO $$
DECLARE
    next_month DATE := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
    month_after DATE := next_month + INTERVAL '1 month';
    partition_name TEXT;
BEGIN
    -- Scan jobs partition
    partition_name := 'scan_jobs_' || TO_CHAR(next_month, 'YYYY_MM');
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF scan_jobs FOR VALUES FROM (%L) TO (%L)',
        partition_name, next_month, month_after
    );
    
    -- TLS findings partition
    partition_name := 'tls_findings_' || TO_CHAR(next_month, 'YYYY_MM');
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF tls_findings FOR VALUES FROM (%L) TO (%L)',
        partition_name, next_month, month_after
    );
    
    -- Crypto findings partition
    partition_name := 'crypto_findings_' || TO_CHAR(next_month, 'YYYY_MM');
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF crypto_findings FOR VALUES FROM (%L) TO (%L)',
        partition_name, next_month, month_after
    );
    
    -- Risk scores partition
    partition_name := 'risk_scores_' || TO_CHAR(next_month, 'YYYY_MM');
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF risk_scores FOR VALUES FROM (%L) TO (%L)',
        partition_name, next_month, month_after
    );
    
    -- Audit logs partition
    partition_name := 'audit_logs_' || TO_CHAR(next_month, 'YYYY_MM');
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)',
        partition_name, next_month, month_after
    );
    
    RAISE NOTICE 'Created partitions for %', TO_CHAR(next_month, 'YYYY-MM');
END $$;

-- =============================================================================
-- DATA RETENTION / CLEANUP
-- =============================================================================

-- Soft delete old scan jobs (older than 1 year)
UPDATE scan_jobs 
SET deleted_at = CURRENT_TIMESTAMP 
WHERE created_at < CURRENT_DATE - INTERVAL '1 year' 
  AND deleted_at IS NULL;

-- Soft delete old findings (older than 3 years)
UPDATE tls_findings 
SET deleted_at = CURRENT_TIMESTAMP 
WHERE created_at < CURRENT_DATE - INTERVAL '3 years' 
  AND deleted_at IS NULL;

UPDATE crypto_findings 
SET deleted_at = CURRENT_TIMESTAMP 
WHERE created_at < CURRENT_DATE - INTERVAL '3 years' 
  AND deleted_at IS NULL;

-- Hard delete very old soft-deleted records (older than 30 days after soft delete)
DELETE FROM scan_jobs 
WHERE deleted_at < CURRENT_DATE - INTERVAL '30 days';

DELETE FROM tls_findings 
WHERE deleted_at < CURRENT_DATE - INTERVAL '30 days';

DELETE FROM crypto_findings 
WHERE deleted_at < CURRENT_DATE - INTERVAL '30 days';

-- Drop old partitions (older than retention period)
-- Example: Drop audit log partitions older than 7 years
DO $$
DECLARE
    partition_record RECORD;
    cutoff_date DATE := CURRENT_DATE - INTERVAL '7 years';
BEGIN
    FOR partition_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename LIKE 'audit_logs_%'
    LOOP
        -- Extract date from partition name and check if older than cutoff
        DECLARE
            partition_date DATE;
        BEGIN
            partition_date := TO_DATE(
                SUBSTRING(partition_record.tablename FROM 'audit_logs_(\d{4}_\d{2})'),
                'YYYY_MM'
            );
            
            IF partition_date < cutoff_date THEN
                EXECUTE format('DROP TABLE IF EXISTS %I', partition_record.tablename);
                RAISE NOTICE 'Dropped old partition: %', partition_record.tablename;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not process partition: %', partition_record.tablename;
        END;
    END LOOP;
END $$;

-- =============================================================================
-- BLOAT DETECTION
-- =============================================================================

-- Check table bloat
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS external_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- Check index bloat
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) AS index_size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC
LIMIT 20;

-- =============================================================================
-- PERFORMANCE MONITORING
-- =============================================================================

-- Slow queries
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    stddev_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- Table statistics
SELECT
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- Index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Unused indexes (candidates for removal)
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname NOT LIKE '%_pkey';

-- =============================================================================
-- CONNECTION MONITORING
-- =============================================================================

-- Active connections
SELECT
    datname,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change,
    query
FROM pg_stat_activity
WHERE datname = current_database()
ORDER BY query_start DESC;

-- Long-running queries
SELECT
    pid,
    now() - query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - query_start > INTERVAL '5 minutes'
ORDER BY duration DESC;

-- Kill long-running query (use with caution)
-- SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = <pid>;

-- =============================================================================
-- BACKUP VERIFICATION
-- =============================================================================

-- Check last backup time (if using pg_basebackup or similar)
SELECT
    pg_last_wal_receive_lsn(),
    pg_last_wal_replay_lsn(),
    pg_last_xact_replay_timestamp();

-- =============================================================================
-- CONSTRAINT VALIDATION
-- =============================================================================

-- Check for invalid constraints
SELECT
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE convalidated = false;

-- =============================================================================
-- DISK SPACE MONITORING
-- =============================================================================

-- Database size
SELECT
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;

-- Largest tables
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- =============================================================================
-- SECURITY AUDIT
-- =============================================================================

-- Check user privileges
SELECT
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
ORDER BY grantee, table_name;

-- Check for users without password
SELECT
    usename,
    valuntil
FROM pg_user
WHERE passwd IS NULL;

-- =============================================================================
-- HEALTH CHECK SUMMARY
-- =============================================================================

DO $$
DECLARE
    db_size TEXT;
    table_count INT;
    index_count INT;
    active_connections INT;
    mv_count INT;
BEGIN
    -- Database size
    SELECT pg_size_pretty(pg_database_size(current_database())) INTO db_size;
    
    -- Table count
    SELECT COUNT(*) INTO table_count FROM pg_tables WHERE schemaname = 'public';
    
    -- Index count
    SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE schemaname = 'public';
    
    -- Active connections
    SELECT COUNT(*) INTO active_connections FROM pg_stat_activity WHERE datname = current_database();
    
    -- Materialized view count
    SELECT COUNT(*) INTO mv_count FROM pg_matviews WHERE schemaname = 'public';
    
    RAISE NOTICE '=== QuantumShield Database Health Check ===';
    RAISE NOTICE 'Database Size: %', db_size;
    RAISE NOTICE 'Tables: %', table_count;
    RAISE NOTICE 'Indexes: %', index_count;
    RAISE NOTICE 'Active Connections: %', active_connections;
    RAISE NOTICE 'Materialized Views: %', mv_count;
    RAISE NOTICE '==========================================';
END $$;
