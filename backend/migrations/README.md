# QuantumShield Database Schema

## Overview

Production-grade database schema for QuantumShield - a Harvest Now Decrypt Later (HNDL) exposure intelligence platform. The system scans infrastructure, detects cryptography, estimates data longevity, models quantum threats, calculates risk, and provides migration guidance.

## Architecture

### Primary Database: PostgreSQL 14+
- Normalized schema with UUID primary keys
- Partitioned tables for high-volume data
- Materialized views for dashboard performance
- Soft delete support (deleted_at column)
- Comprehensive indexing strategy
- JSONB for flexible metadata

### Graph Database: Neo4j 5+
- System relationship mapping
- Blast radius analysis
- Dependency tracking
- Risk propagation modeling

### Caching Layer: Redis 7+
- Real-time metrics
- Session management
- Rate limiting
- Pub/Sub for live updates

## Database Schema

### Core Tables

#### 1. Organizations (Multi-tenant)
- Supports enterprise deployments
- Industry and region tracking
- Risk profile configuration

#### 2. Users
- Role-based access control (admin, analyst, viewer)
- MFA support
- Account lockout protection

#### 3. Assets (Central Inventory)
- All discovered infrastructure
- Asset types: service, database, bucket, backup, certificate, repository, vm, kubernetes_service
- Criticality levels: low, medium, high, critical
- Exposure tracking: internal, partner, public, internet

#### 4. Scan Jobs (Partitioned)
- Continuous scanning operations
- Scan types: tls_scan, repo_scan, storage_scan, infra_scan, full_scan
- Progress tracking and error handling

#### 5. TLS Findings (Partitioned)
- Certificate analysis
- Cipher suite detection
- Key algorithm and size tracking
- Expiration monitoring

#### 6. Crypto Findings (Partitioned)
- Code-level cryptography detection
- Algorithm and key length tracking
- Risk flagging for weak crypto

#### 7. Encryption Inventory
- Encryption layer tracking (transport, storage, backup, application, database)
- Key management practices
- PQC readiness assessment

#### 8. Data Classifications
- Sensitivity scoring (0-100)
- Regulatory tag support (HIPAA, PCI-DSS, GDPR, etc.)
- Estimated record counts

#### 9. Data Longevity
- Required confidentiality duration
- Retention policy tracking
- Regulatory basis documentation

#### 10. Exposure Scores
- Internet exposure assessment
- Access control evaluation
- Replication and backup tracking

#### 11. Quantum Models
- Quantum computing capability projections
- Qubit growth rate modeling
- Error rate assumptions

#### 12. Quantum Break Estimates
- Algorithm-specific break timelines
- Logical qubit requirements
- Confidence scoring

#### 13. Risk Scores (Partitioned)
- Composite HNDL risk calculation
- Component scoring (sensitivity, longevity, crypto weakness, exposure, adversary value)
- Severity levels: low, moderate, high, critical

#### 14. Attack Simulations
- HNDL scenario modeling
- Impact assessment
- Records exposure estimation

#### 15. Migration Recommendations
- PQC migration strategies
- Effort estimation
- Risk reduction quantification

#### 16. Crypto Technical Debt
- Deprecated algorithm tracking
- Weak key detection
- Unsupported library identification

#### 17. Reports
- Generated analytical reports
- Multiple formats (PDF, CSV, JSON)
- Expiration and download tracking

#### 18. Audit Logs (Partitioned, 7-year retention)
- Comprehensive audit trail
- User action tracking
- IP and user agent logging

## Partitioning Strategy

### Partitioned Tables
- `scan_jobs` - by created_at (monthly)
- `tls_findings` - by created_at (monthly)
- `crypto_findings` - by created_at (monthly)
- `risk_scores` - by calculated_at (monthly)
- `audit_logs` - by created_at (monthly)

### Benefits
- Improved query performance
- Easier data archival
- Faster bulk operations
- Simplified retention management

## Indexing Strategy

### Critical Indexes
- Organization ID on all multi-tenant tables
- Asset type and criticality
- Risk score (descending)
- Algorithm and key size
- Scan job status and type
- Timestamp columns for time-series queries
- GIN indexes for JSONB columns
- Full-text search on asset names

### Index Maintenance
- Regular REINDEX operations
- VACUUM ANALYZE after bulk operations
- Monitor unused indexes

## Materialized Views

### 1. mv_top_quantum_risk_assets
Latest risk scores with quantum break estimates
**Refresh:** Hourly

### 2. mv_crypto_algorithm_distribution
Algorithm usage statistics by organization
**Refresh:** Daily

### 3. mv_data_longevity_distribution
Data longevity bucketing and risk correlation
**Refresh:** Daily

### 4. mv_migration_priority_list
Prioritized PQC migration recommendations
**Refresh:** Every 6 hours

## Data Retention

### Operational Data
- Scan logs: 1 year
- Raw findings: 3 years
- Risk results: Permanent
- Audit logs: 7 years

### Soft Delete
All tables support soft delete via `deleted_at` column. Hard delete occurs 30 days after soft delete.

## Installation

### Prerequisites
```bash
# PostgreSQL 14+
sudo apt-get install postgresql-14

# Extensions
sudo apt-get install postgresql-14-contrib

# Neo4j 5+
# Follow: https://neo4j.com/docs/operations-manual/current/installation/

# Redis 7+
sudo apt-get install redis-server
```

### Database Setup

#### 1. Create Database
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE quantumshield;
CREATE USER quantumshield_app WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE quantumshield TO quantumshield_app;
```

#### 2. Run Migrations

Using Flyway:
```bash
flyway -url=jdbc:postgresql://localhost:5432/quantumshield \
       -user=quantumshield_app \
       -password=your_secure_password \
       -locations=filesystem:./migrations \
       migrate
```

Using Alembic (Python):
```bash
# Install alembic
pip install alembic psycopg2-binary

# Initialize
alembic init alembic

# Configure alembic.ini with connection string
# sqlalchemy.url = postgresql://quantumshield_app:password@localhost/quantumshield

# Run migrations
alembic upgrade head
```

Manual execution:
```bash
psql -U quantumshield_app -d quantumshield -f V001__initial_schema.sql
psql -U quantumshield_app -d quantumshield -f V002__additional_partitions.sql
psql -U quantumshield_app -d quantumshield -f V003__seed_data.sql
```

#### 3. Setup Neo4j
```bash
# Start Neo4j
sudo systemctl start neo4j

# Access Neo4j Browser
# http://localhost:7474

# Run graph schema
cat neo4j_schema.cypher | cypher-shell -u neo4j -p your_password
```

#### 4. Setup Redis
```bash
# Start Redis
sudo systemctl start redis-server

# Test connection
redis-cli ping
# Should return: PONG

# Set password (optional but recommended)
redis-cli
CONFIG SET requirepass your_redis_password
```

## Configuration

### PostgreSQL Configuration (postgresql.conf)

```ini
# Memory
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
work_mem = 64MB

# Parallelism
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_worker_processes = 8

# WAL
wal_buffers = 16MB
checkpoint_completion_target = 0.9
max_wal_size = 4GB

# Query Planning
random_page_cost = 1.1  # For SSD
effective_io_concurrency = 200

# Logging
log_min_duration_statement = 1000  # Log queries > 1s
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Extensions
shared_preload_libraries = 'pg_stat_statements'
```

### Neo4j Configuration (neo4j.conf)

```ini
# Memory
dbms.memory.heap.initial_size=2g
dbms.memory.heap.max_size=4g
dbms.memory.pagecache.size=2g

# Network
dbms.default_listen_address=0.0.0.0
dbms.connector.bolt.listen_address=:7687
dbms.connector.http.listen_address=:7474

# Security
dbms.security.auth_enabled=true
```

### Redis Configuration (redis.conf)

```ini
# Memory
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec

# Security
requirepass your_redis_password
bind 127.0.0.1 ::1

# Performance
tcp-backlog 511
timeout 300
```

## Maintenance

### Daily Tasks
```bash
# Refresh materialized views
psql -U quantumshield_app -d quantumshield -c "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_quantum_risk_assets;"

# Vacuum analyze
psql -U quantumshield_app -d quantumshield -c "VACUUM ANALYZE;"
```

### Weekly Tasks
```bash
# Run full maintenance script
psql -U quantumshield_app -d quantumshield -f scripts/maintenance.sql

# Check for bloat
# Check for unused indexes
# Review slow queries
```

### Monthly Tasks
```bash
# Create next month's partitions
# Archive old data
# Review and optimize indexes
# Update statistics
```

### Automated Maintenance (Cron)

```cron
# Daily at 2 AM - Refresh materialized views
0 2 * * * psql -U quantumshield_app -d quantumshield -c "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_quantum_risk_assets;"

# Weekly on Sunday at 3 AM - Full maintenance
0 3 * * 0 psql -U quantumshield_app -d quantumshield -f /path/to/scripts/maintenance.sql

# Monthly on 1st at 4 AM - Create partitions
0 4 1 * * psql -U quantumshield_app -d quantumshield -f /path/to/scripts/create_partitions.sql
```

## Backup Strategy

### PostgreSQL Backup

#### Full Backup (Daily)
```bash
pg_dump -U quantumshield_app -d quantumshield -F c -f quantumshield_$(date +%Y%m%d).backup
```

#### Continuous Archiving (WAL)
```bash
# Configure in postgresql.conf
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'
```

#### Point-in-Time Recovery
```bash
# Base backup
pg_basebackup -U quantumshield_app -D /backup/base -F tar -z -P

# Restore
tar -xzf base.tar.gz -C /var/lib/postgresql/14/main
# Configure recovery.conf
# Start PostgreSQL
```

### Neo4j Backup
```bash
# Online backup (Enterprise)
neo4j-admin backup --backup-dir=/backup/neo4j --name=quantumshield

# Offline backup
sudo systemctl stop neo4j
tar -czf neo4j_backup_$(date +%Y%m%d).tar.gz /var/lib/neo4j/data
sudo systemctl start neo4j
```

### Redis Backup
```bash
# RDB snapshot
redis-cli BGSAVE

# Copy RDB file
cp /var/lib/redis/dump.rdb /backup/redis/dump_$(date +%Y%m%d).rdb

# AOF backup
cp /var/lib/redis/appendonly.aof /backup/redis/appendonly_$(date +%Y%m%d).aof
```

## Monitoring

### Key Metrics

#### PostgreSQL
- Connection count
- Query performance (pg_stat_statements)
- Table and index sizes
- Cache hit ratio
- Replication lag (if applicable)
- Bloat percentage

#### Neo4j
- Query performance
- Store sizes
- Transaction throughput
- Page cache hit ratio

#### Redis
- Memory usage
- Hit/miss ratio
- Connected clients
- Commands per second

### Monitoring Tools
- Prometheus + Grafana
- pgAdmin
- Neo4j Browser
- RedisInsight

## Performance Tuning

### Query Optimization
1. Use EXPLAIN ANALYZE for slow queries
2. Add appropriate indexes
3. Use materialized views for complex aggregations
4. Partition large tables
5. Use connection pooling (PgBouncer)

### Example Queries

#### Top HNDL Risk Systems
```sql
SELECT 
    a.asset_name,
    r.risk_score,
    d.required_secrecy_years,
    e.algorithm,
    qb.earliest_break_year
FROM assets a
JOIN risk_scores r ON a.id = r.asset_id
JOIN data_longevity d ON a.id = d.asset_id
JOIN encryption_inventory e ON a.id = e.asset_id
LEFT JOIN quantum_break_estimates qb ON e.algorithm = qb.algorithm AND e.key_size = qb.key_size
WHERE a.deleted_at IS NULL
  AND r.calculated_at = (
      SELECT MAX(calculated_at) 
      FROM risk_scores 
      WHERE asset_id = a.id
  )
ORDER BY r.risk_score DESC
LIMIT 20;
```

#### Assets Vulnerable to Quantum Attacks
```sql
SELECT 
    a.asset_name,
    e.algorithm,
    e.key_size,
    qb.earliest_break_year,
    d.required_secrecy_years,
    CASE 
        WHEN qb.earliest_break_year < EXTRACT(YEAR FROM CURRENT_DATE) + d.required_secrecy_years 
        THEN 'VULNERABLE'
        ELSE 'SAFE'
    END as quantum_risk_status
FROM assets a
JOIN encryption_inventory e ON a.id = e.asset_id
JOIN quantum_break_estimates qb ON e.algorithm = qb.algorithm AND e.key_size = qb.key_size
JOIN data_longevity d ON a.id = d.asset_id
WHERE a.deleted_at IS NULL
  AND e.deleted_at IS NULL
  AND qb.earliest_break_year < EXTRACT(YEAR FROM CURRENT_DATE) + d.required_secrecy_years
ORDER BY qb.earliest_break_year;
```

## Security

### Database Security
- Use strong passwords
- Enable SSL/TLS connections
- Restrict network access
- Regular security updates
- Audit logging enabled
- Row-level security (if needed)

### Application Security
- Use prepared statements (prevent SQL injection)
- Encrypt sensitive data at rest
- Implement rate limiting
- Regular security audits
- Principle of least privilege

## Troubleshooting

### Common Issues

#### Slow Queries
```sql
-- Find slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### Connection Issues
```sql
-- Check active connections
SELECT * FROM pg_stat_activity;

-- Kill stuck connection
SELECT pg_terminate_backend(pid);
```

#### Disk Space
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('quantumshield'));

-- Check largest tables
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

## Support

For issues or questions:
- Check logs: `/var/log/postgresql/`, `/var/log/neo4j/`, `/var/log/redis/`
- Review monitoring dashboards
- Consult maintenance scripts
- Contact: security-team@quantumshield.io

## License

Proprietary - QuantumShield Platform
