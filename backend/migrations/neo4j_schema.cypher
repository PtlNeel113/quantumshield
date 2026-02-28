// QuantumShield Neo4j Graph Schema
// Graph database for system relationships and blast radius analysis

// =============================================================================
// CONSTRAINTS AND INDEXES
// =============================================================================

// Node uniqueness constraints
CREATE CONSTRAINT asset_id IF NOT EXISTS FOR (a:Asset) REQUIRE a.id IS UNIQUE;
CREATE CONSTRAINT certificate_id IF NOT EXISTS FOR (c:Certificate) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT backup_id IF NOT EXISTS FOR (b:Backup) REQUIRE b.id IS UNIQUE;
CREATE CONSTRAINT database_id IF NOT EXISTS FOR (d:Database) REQUIRE d.id IS UNIQUE;
CREATE CONSTRAINT service_id IF NOT EXISTS FOR (s:Service) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT repository_id IF NOT EXISTS FOR (r:Repository) REQUIRE r.id IS UNIQUE;
CREATE CONSTRAINT organization_id IF NOT EXISTS FOR (o:Organization) REQUIRE o.id IS UNIQUE;

// Property indexes for performance
CREATE INDEX asset_name_idx IF NOT EXISTS FOR (a:Asset) ON (a.name);
CREATE INDEX asset_type_idx IF NOT EXISTS FOR (a:Asset) ON (a.type);
CREATE INDEX asset_risk_idx IF NOT EXISTS FOR (a:Asset) ON (a.risk_score);
CREATE INDEX service_name_idx IF NOT EXISTS FOR (s:Service) ON (s.name);
CREATE INDEX database_name_idx IF NOT EXISTS FOR (d:Database) ON (d.name);
CREATE INDEX cert_expiry_idx IF NOT EXISTS FOR (c:Certificate) ON (c.expiry_date);
CREATE INDEX encryption_algo_idx IF NOT EXISTS FOR ()-[r:ENCRYPTED_WITH]-() ON (r.algorithm);

// Full-text search indexes
CREATE FULLTEXT INDEX asset_search IF NOT EXISTS FOR (a:Asset) ON EACH [a.name, a.description];
CREATE FULLTEXT INDEX service_search IF NOT EXISTS FOR (s:Service) ON EACH [s.name, s.description];

// =============================================================================
// NODE LABELS AND PROPERTIES
// =============================================================================

// Asset (Base node - all infrastructure items)
// Properties: id, name, type, organization_id, criticality, risk_score, 
//             environment, owner_team, created_at, last_seen

// Service (API, web service, microservice)
// Properties: id, name, url, port, protocol, version, language, framework

// Database (SQL, NoSQL, data warehouse)
// Properties: id, name, db_type, version, size_gb, record_count, 
//             contains_pii, data_classification

// Backup (Backup systems and archives)
// Properties: id, name, backup_type, frequency, retention_days, 
//             location, encrypted, size_gb

// Certificate (TLS/SSL certificates)
// Properties: id, common_name, issuer, expiry_date, key_algorithm, 
//             key_size, signature_algorithm, serial_number

// Repository (Code repositories)
// Properties: id, name, url, language, framework, last_commit, 
//             crypto_findings_count

// Organization (Tenant)
// Properties: id, name, industry, region

// =============================================================================
// RELATIONSHIP TYPES
// =============================================================================

// CONNECTS_TO
// Service -> Service, Service -> Database
// Properties: protocol, port, encryption_algorithm, authenticated, 
//             connection_type, data_flow_direction

// AUTHENTICATES_WITH
// Service -> Service, Service -> Certificate
// Properties: auth_method, token_type, encryption_algorithm

// BACKS_UP_TO
// Database -> Backup, Service -> Backup
// Properties: frequency, last_backup, encryption_algorithm, 
//             retention_days, backup_type

// REPLICATES_TO
// Database -> Database, Service -> Service
// Properties: replication_type, lag_seconds, encryption_algorithm, 
//             geo_location

// USES_CERTIFICATE
// Service -> Certificate
// Properties: usage_type (server, client, mutual), installed_date

// DEPENDS_ON
// Service -> Service, Service -> Database
// Properties: dependency_type, criticality, failure_impact

// STORES_DATA_IN
// Service -> Database
// Properties: data_types, sensitivity_level, encryption_at_rest

// DEPLOYED_FROM
// Service -> Repository
// Properties: commit_hash, deployment_date, version

// EXPOSES
// Service -> Service
// Properties: exposure_level (internal, partner, public), 
//             authentication_required

// OWNED_BY
// Asset -> Organization
// Properties: ownership_date

// =============================================================================
// SAMPLE DATA CREATION
// =============================================================================

// Create sample organization
CREATE (org:Organization {
    id: 'org-001',
    name: 'Acme Corporation',
    industry: 'Financial Services',
    region: 'US-East'
});

// Create sample services
CREATE (api:Service:Asset {
    id: 'svc-001',
    name: 'API Gateway',
    type: 'service',
    url: 'https://api.acme.com',
    port: 443,
    protocol: 'HTTPS',
    version: '2.1.0',
    framework: 'FastAPI',
    organization_id: 'org-001',
    criticality: 'critical',
    risk_score: 85.5,
    environment: 'production',
    created_at: datetime()
});

CREATE (auth:Service:Asset {
    id: 'svc-002',
    name: 'Auth Service',
    type: 'service',
    url: 'https://auth.acme.com',
    port: 443,
    protocol: 'HTTPS',
    version: '1.5.2',
    framework: 'Spring Boot',
    organization_id: 'org-001',
    criticality: 'critical',
    risk_score: 78.2,
    environment: 'production',
    created_at: datetime()
});

CREATE (payment:Service:Asset {
    id: 'svc-003',
    name: 'Payment Service',
    type: 'service',
    url: 'https://payment.internal.acme.com',
    port: 8080,
    protocol: 'HTTPS',
    version: '3.2.1',
    framework: 'Node.js',
    organization_id: 'org-001',
    criticality: 'critical',
    risk_score: 92.1,
    environment: 'production',
    created_at: datetime()
});

// Create databases
CREATE (userdb:Database:Asset {
    id: 'db-001',
    name: 'User Database',
    type: 'database',
    db_type: 'PostgreSQL',
    version: '14.5',
    size_gb: 250,
    record_count: 5000000,
    contains_pii: true,
    data_classification: 'confidential',
    organization_id: 'org-001',
    criticality: 'critical',
    risk_score: 88.7,
    environment: 'production',
    created_at: datetime()
});

CREATE (paymentdb:Database:Asset {
    id: 'db-002',
    name: 'Payment Database',
    type: 'database',
    db_type: 'PostgreSQL',
    version: '14.5',
    size_gb: 500,
    record_count: 10000000,
    contains_pii: true,
    data_classification: 'restricted',
    organization_id: 'org-001',
    criticality: 'critical',
    risk_score: 95.3,
    environment: 'production',
    created_at: datetime()
});

// Create backups
CREATE (userbackup:Backup:Asset {
    id: 'bkp-001',
    name: 'User DB Backup',
    type: 'backup',
    backup_type: 'full',
    frequency: 'daily',
    retention_days: 90,
    location: 's3://acme-backups/userdb',
    encrypted: true,
    size_gb: 250,
    organization_id: 'org-001',
    criticality: 'high',
    risk_score: 72.4,
    environment: 'production',
    created_at: datetime()
});

CREATE (paymentbackup:Backup:Asset {
    id: 'bkp-002',
    name: 'Payment DB Backup',
    type: 'backup',
    backup_type: 'full',
    frequency: 'hourly',
    retention_days: 365,
    location: 's3://acme-backups/paymentdb',
    encrypted: true,
    size_gb: 500,
    organization_id: 'org-001',
    criticality: 'critical',
    risk_score: 89.1,
    environment: 'production',
    created_at: datetime()
});

// Create certificates
CREATE (apicert:Certificate:Asset {
    id: 'cert-001',
    name: 'API Gateway Certificate',
    type: 'certificate',
    common_name: '*.acme.com',
    issuer: 'DigiCert',
    expiry_date: date('2025-12-31'),
    key_algorithm: 'RSA',
    key_size: 2048,
    signature_algorithm: 'SHA256withRSA',
    serial_number: 'ABC123456789',
    organization_id: 'org-001',
    criticality: 'high',
    risk_score: 65.0,
    environment: 'production',
    created_at: datetime()
});

// Create repositories
CREATE (apirepo:Repository:Asset {
    id: 'repo-001',
    name: 'api-gateway',
    type: 'repository',
    url: 'https://github.com/acme/api-gateway',
    language: 'Python',
    framework: 'FastAPI',
    last_commit: datetime(),
    crypto_findings_count: 12,
    organization_id: 'org-001',
    criticality: 'medium',
    risk_score: 45.2,
    environment: 'production',
    created_at: datetime()
});

// =============================================================================
// CREATE RELATIONSHIPS
// =============================================================================

// Service connections
MATCH (api:Service {id: 'svc-001'}), (auth:Service {id: 'svc-002'})
CREATE (api)-[:CONNECTS_TO {
    protocol: 'HTTPS',
    port: 443,
    encryption_algorithm: 'TLS 1.3',
    authenticated: true,
    connection_type: 'REST',
    data_flow_direction: 'bidirectional',
    created_at: datetime()
}]->(auth);

MATCH (api:Service {id: 'svc-001'}), (payment:Service {id: 'svc-003'})
CREATE (api)-[:CONNECTS_TO {
    protocol: 'HTTPS',
    port: 8080,
    encryption_algorithm: 'TLS 1.2',
    authenticated: true,
    connection_type: 'REST',
    data_flow_direction: 'bidirectional',
    created_at: datetime()
}]->(payment);

// Service to database connections
MATCH (auth:Service {id: 'svc-002'}), (userdb:Database {id: 'db-001'})
CREATE (auth)-[:STORES_DATA_IN {
    data_types: ['user_credentials', 'profile_data'],
    sensitivity_level: 'confidential',
    encryption_at_rest: 'AES-256',
    created_at: datetime()
}]->(userdb);

MATCH (payment:Service {id: 'svc-003'}), (paymentdb:Database {id: 'db-002'})
CREATE (payment)-[:STORES_DATA_IN {
    data_types: ['payment_transactions', 'card_data'],
    sensitivity_level: 'restricted',
    encryption_at_rest: 'AES-256',
    created_at: datetime()
}]->(paymentdb);

// Backup relationships
MATCH (userdb:Database {id: 'db-001'}), (userbackup:Backup {id: 'bkp-001'})
CREATE (userdb)-[:BACKS_UP_TO {
    frequency: 'daily',
    last_backup: datetime(),
    encryption_algorithm: 'AES-256',
    retention_days: 90,
    backup_type: 'full',
    created_at: datetime()
}]->(userbackup);

MATCH (paymentdb:Database {id: 'db-002'}), (paymentbackup:Backup {id: 'bkp-002'})
CREATE (paymentdb)-[:BACKS_UP_TO {
    frequency: 'hourly',
    last_backup: datetime(),
    encryption_algorithm: 'AES-256-GCM',
    retention_days: 365,
    backup_type: 'full',
    created_at: datetime()
}]->(paymentbackup);

// Certificate usage
MATCH (api:Service {id: 'svc-001'}), (cert:Certificate {id: 'cert-001'})
CREATE (api)-[:USES_CERTIFICATE {
    usage_type: 'server',
    installed_date: date('2024-01-15'),
    created_at: datetime()
}]->(cert);

// Repository deployment
MATCH (api:Service {id: 'svc-001'}), (repo:Repository {id: 'repo-001'})
CREATE (api)-[:DEPLOYED_FROM {
    commit_hash: 'abc123def456',
    deployment_date: datetime(),
    version: '2.1.0',
    created_at: datetime()
}]->(repo);

// Organization ownership
MATCH (org:Organization {id: 'org-001'}), (asset:Asset)
WHERE asset.organization_id = 'org-001'
CREATE (asset)-[:OWNED_BY {
    ownership_date: date('2023-01-01'),
    created_at: datetime()
}]->(org);

// =============================================================================
// USEFUL QUERIES FOR BLAST RADIUS ANALYSIS
// =============================================================================

// Query 1: Find all assets affected if a service is compromised
// MATCH path = (compromised:Service {id: 'svc-001'})-[*1..3]-(affected)
// WHERE affected:Asset
// RETURN DISTINCT affected.name, affected.type, affected.risk_score, length(path) as hops
// ORDER BY affected.risk_score DESC;

// Query 2: Find all data stores accessible from internet-facing services
// MATCH (service:Service)-[:CONNECTS_TO*1..3]->(db:Database)
// WHERE service.exposure_level = 'public'
// RETURN service.name, db.name, db.data_classification, db.risk_score
// ORDER BY db.risk_score DESC;

// Query 3: Find backup chains for critical databases
// MATCH path = (db:Database {criticality: 'critical'})-[:BACKS_UP_TO*]->(backup:Backup)
// RETURN db.name, collect(backup.name) as backup_chain, 
//        collect(backup.encryption_algorithm) as encryption_methods;

// Query 4: Find services using weak cryptography
// MATCH (s:Service)-[r:CONNECTS_TO]->(target)
// WHERE r.encryption_algorithm IN ['TLS 1.0', 'TLS 1.1', 'SSL 3.0']
// RETURN s.name, target.name, r.encryption_algorithm, s.risk_score
// ORDER BY s.risk_score DESC;

// Query 5: Calculate quantum risk propagation
// MATCH path = (source:Asset)-[*1..4]-(target:Asset)
// WHERE source.risk_score > 80
// WITH target, collect(DISTINCT source) as risk_sources, 
//      avg(source.risk_score) as avg_source_risk
// RETURN target.name, target.type, target.risk_score, 
//        size(risk_sources) as risk_source_count, avg_source_risk
// ORDER BY target.risk_score DESC, risk_source_count DESC;

// Query 6: Find certificates expiring soon with high-risk services
// MATCH (s:Service)-[:USES_CERTIFICATE]->(c:Certificate)
// WHERE c.expiry_date < date() + duration({days: 90})
//   AND s.risk_score > 70
// RETURN s.name, c.common_name, c.expiry_date, c.key_algorithm, 
//        c.key_size, s.risk_score
// ORDER BY c.expiry_date;

// Query 7: Find data replication paths for compliance
// MATCH path = (source:Database)-[:REPLICATES_TO*]->(replica:Database)
// WHERE source.contains_pii = true
// RETURN source.name, 
//        [node in nodes(path) | node.name] as replication_chain,
//        [rel in relationships(path) | rel.geo_location] as locations;

// Query 8: Identify single points of failure
// MATCH (critical:Asset {criticality: 'critical'})
// OPTIONAL MATCH (critical)-[:DEPENDS_ON]->(dependency:Asset)
// WITH critical, count(dependency) as dependency_count
// WHERE dependency_count <= 1
// RETURN critical.name, critical.type, critical.risk_score, dependency_count
// ORDER BY critical.risk_score DESC;

COMMENT: 'QuantumShield Neo4j Graph Schema - System relationships and blast radius analysis';
