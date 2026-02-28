-- QuantumShield Database Schema V3
-- Seed data for testing and demonstration

-- =============================================================================
-- SAMPLE ORGANIZATIONS
-- =============================================================================

INSERT INTO organizations (id, name, industry, size, region, risk_profile) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Acme Financial Corp', 'Financial Services', 'Enterprise', 'US-East', '{"compliance": ["PCI-DSS", "SOC2"], "risk_appetite": "low"}'::jsonb),
    ('550e8400-e29b-41d4-a716-446655440002', 'TechStart Inc', 'Technology', 'Mid-Market', 'US-West', '{"compliance": ["SOC2"], "risk_appetite": "medium"}'::jsonb),
    ('550e8400-e29b-41d4-a716-446655440003', 'HealthCare Systems', 'Healthcare', 'Enterprise', 'EU-Central', '{"compliance": ["HIPAA", "GDPR"], "risk_appetite": "very_low"}'::jsonb);

-- =============================================================================
-- SAMPLE USERS
-- =============================================================================

-- Password: 'password123' (hashed with bcrypt)
-- In production, use proper password hashing
INSERT INTO users (id, organization_id, email, password_hash, role, mfa_enabled, status) VALUES
    ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'admin@acme.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNqNqNqNq', 'admin', true, 'active'),
    ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'analyst@acme.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNqNqNqNq', 'analyst', false, 'active'),
    ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'admin@techstart.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNqNqNqNq', 'admin', true, 'active'),
    ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'security@healthcare.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNqNqNqNq', 'admin', true, 'active');

-- =============================================================================
-- SAMPLE ASSETS
-- =============================================================================

INSERT INTO assets (id, organization_id, asset_name, asset_type, environment, owner_team, criticality, exposure_surface, region, tags) VALUES
    -- Acme Financial Corp assets
    ('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Payment API Gateway', 'service', 'production', 'Platform Team', 'critical', 'public', 'US-East', '["api", "payment", "pci"]'::jsonb),
    ('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Customer Database', 'database', 'production', 'Data Team', 'critical', 'internal', 'US-East', '["database", "pii", "customer"]'::jsonb),
    ('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Transaction Archive', 'backup', 'production', 'Data Team', 'high', 'internal', 'US-East', '["backup", "archive", "compliance"]'::jsonb),
    ('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'SSL Certificate - *.acme.com', 'certificate', 'production', 'Security Team', 'high', 'public', 'US-East', '["certificate", "tls"]'::jsonb),
    ('750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'payment-service-repo', 'repository', 'production', 'Platform Team', 'medium', 'internal', 'US-East', '["code", "github"]'::jsonb),
    
    -- TechStart Inc assets
    ('750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'User Auth Service', 'service', 'production', 'Backend Team', 'critical', 'public', 'US-West', '["auth", "api"]'::jsonb),
    ('750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 'Analytics Database', 'database', 'production', 'Data Team', 'medium', 'internal', 'US-West', '["database", "analytics"]'::jsonb),
    
    -- HealthCare Systems assets
    ('750e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'Patient Records System', 'service', 'production', 'Clinical Team', 'critical', 'partner', 'EU-Central', '["hipaa", "ehr", "pii"]'::jsonb),
    ('750e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440003', 'Medical Records DB', 'database', 'production', 'Clinical Team', 'critical', 'internal', 'EU-Central', '["database", "hipaa", "phi"]'::jsonb);

-- =============================================================================
-- ASSET METADATA
-- =============================================================================

INSERT INTO asset_metadata (asset_id, key, value_json, source) VALUES
    ('750e8400-e29b-41d4-a716-446655440001', 'cloud_provider', '{"provider": "AWS", "region": "us-east-1", "account_id": "123456789012"}'::jsonb, 'aws_scanner'),
    ('750e8400-e29b-41d4-a716-446655440001', 'endpoints', '{"count": 45, "public": 12, "authenticated": 33}'::jsonb, 'api_scanner'),
    ('750e8400-e29b-41d4-a716-446655440002', 'database_info', '{"engine": "PostgreSQL", "version": "14.5", "size_gb": 250}'::jsonb, 'db_scanner'),
    ('750e8400-e29b-41d4-a716-446655440009', 'compliance', '{"hipaa": true, "gdpr": true, "last_audit": "2024-01-15"}'::jsonb, 'compliance_scanner');

-- =============================================================================
-- SCAN JOBS
-- =============================================================================

INSERT INTO scan_jobs (id, organization_id, scan_type, status, initiated_by, started_at, completed_at, assets_scanned, findings_count, error_count, created_at) VALUES
    ('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'full_scan', 'completed', '650e8400-e29b-41d4-a716-446655440001', '2024-01-15 10:00:00+00', '2024-01-15 12:30:00+00', 5, 127, 0, '2024-01-15 10:00:00+00'),
    ('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'tls_scan', 'completed', '650e8400-e29b-41d4-a716-446655440002', '2024-01-20 14:00:00+00', '2024-01-20 14:15:00+00', 2, 8, 0, '2024-01-20 14:00:00+00'),
    ('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'repo_scan', 'completed', '650e8400-e29b-41d4-a716-446655440003', '2024-01-18 09:00:00+00', '2024-01-18 09:45:00+00', 1, 23, 0, '2024-01-18 09:00:00+00');

-- =============================================================================
-- TLS FINDINGS
-- =============================================================================

INSERT INTO tls_findings (id, asset_id, organization_id, domain, port, tls_version, cipher_suite, key_algorithm, key_size, signature_algorithm, forward_secrecy, certificate_issuer, certificate_expiry, scan_job_id, created_at) VALUES
    ('950e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'api.acme.com', 443, 'TLS 1.2', 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', 'RSA', 2048, 'SHA256withRSA', true, 'DigiCert', '2025-06-30 23:59:59+00', '850e8400-e29b-41d4-a716-446655440002', '2024-01-20 14:05:00+00'),
    ('950e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'auth.techstart.com', 443, 'TLS 1.3', 'TLS_AES_256_GCM_SHA384', 'ECDSA', 256, 'SHA256withECDSA', true, 'Let''s Encrypt', '2024-04-15 23:59:59+00', '850e8400-e29b-41d4-a716-446655440002', '2024-01-20 14:10:00+00');

-- =============================================================================
-- CRYPTO FINDINGS
-- =============================================================================

INSERT INTO crypto_findings (id, asset_id, organization_id, repository, file_path, line_number, algorithm, key_length, library, purpose, risk_flag, confidence, scan_job_id, created_at) VALUES
    ('a50e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'payment-service', 'src/crypto/encryption.py', 45, 'AES', 256, 'cryptography', 'data_encryption', false, 0.95, '850e8400-e29b-41d4-a716-446655440001', '2024-01-15 11:00:00+00'),
    ('a50e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'payment-service', 'src/auth/jwt.py', 23, 'RSA', 2048, 'pyjwt', 'token_signing', true, 0.98, '850e8400-e29b-41d4-a716-446655440001', '2024-01-15 11:15:00+00'),
    ('a50e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'payment-service', 'src/utils/hash.py', 12, 'SHA256', NULL, 'hashlib', 'hashing', false, 0.99, '850e8400-e29b-41d4-a716-446655440001', '2024-01-15 11:20:00+00');

-- =============================================================================
-- ENCRYPTION INVENTORY
-- =============================================================================

INSERT INTO encryption_inventory (asset_id, encryption_layer, algorithm, key_size, key_management, rotation_policy, pqc_ready) VALUES
    ('750e8400-e29b-41d4-a716-446655440001', 'transport', 'RSA', 2048, 'AWS Certificate Manager', 'annual', false),
    ('750e8400-e29b-41d4-a716-446655440002', 'storage', 'AES', 256, 'AWS KMS', 'automatic_90_days', false),
    ('750e8400-e29b-41d4-a716-446655440003', 'backup', 'AES', 256, 'AWS KMS', 'manual', false),
    ('750e8400-e29b-41d4-a716-446655440009', 'database', 'AES', 256, 'Azure Key Vault', 'automatic_90_days', false);

-- =============================================================================
-- DATA CLASSIFICATIONS
-- =============================================================================

INSERT INTO data_classifications (asset_id, data_type, sensitivity_score, regulatory_tags, estimated_records, confidence, classification_method) VALUES
    ('750e8400-e29b-41d4-a716-446655440002', 'customer_pii', 95.0, '["PCI-DSS", "GDPR"]'::jsonb, 5000000, 0.92, 'ml_classifier'),
    ('750e8400-e29b-41d4-a716-446655440002', 'payment_data', 98.0, '["PCI-DSS"]'::jsonb, 10000000, 0.95, 'ml_classifier'),
    ('750e8400-e29b-41d4-a716-446655440009', 'medical_records', 99.0, '["HIPAA", "GDPR"]'::jsonb, 2000000, 0.98, 'ml_classifier'),
    ('750e8400-e29b-41d4-a716-446655440007', 'analytics_data', 45.0, '[]'::jsonb, 50000000, 0.85, 'rule_based');

-- =============================================================================
-- DATA LONGEVITY
-- =============================================================================

INSERT INTO data_longevity (asset_id, required_secrecy_years, retention_policy_years, estimated_expiry_date, reason, confidence) VALUES
    ('750e8400-e29b-41d4-a716-446655440002', 15, 7, '2039-01-15', 'PCI-DSS compliance requires 7-year retention, data remains sensitive for 15 years', 0.90),
    ('750e8400-e29b-41d4-a716-446655440009', 30, 30, '2054-01-15', 'HIPAA requires 30-year retention for medical records', 0.95),
    ('750e8400-e29b-41d4-a716-446655440007', 5, 2, '2029-01-15', 'Analytics data has short-term value', 0.80);

-- =============================================================================
-- EXPOSURE SCORES
-- =============================================================================

INSERT INTO exposure_scores (asset_id, internet_exposed, public_access, third_party_access, backup_replication, geo_replication, access_controls_weak, score) VALUES
    ('750e8400-e29b-41d4-a716-446655440001', true, true, false, true, true, false, 75.0),
    ('750e8400-e29b-41d4-a716-446655440002', false, false, false, true, true, false, 35.0),
    ('750e8400-e29b-41d4-a716-446655440003', false, false, false, true, true, false, 40.0),
    ('750e8400-e29b-41d4-a716-446655440006', true, true, false, false, false, false, 65.0),
    ('750e8400-e29b-41d4-a716-446655440008', false, true, true, true, false, false, 70.0),
    ('750e8400-e29b-41d4-a716-446655440009', false, false, true, true, false, false, 45.0);

-- =============================================================================
-- CRYPTO TECHNICAL DEBT
-- =============================================================================

INSERT INTO crypto_technical_debt (asset_id, deprecated_algorithms, weak_keys, unsupported_libraries, manual_key_management, hardcoded_secrets, score) VALUES
    ('750e8400-e29b-41d4-a716-446655440001', '["MD5", "SHA1"]'::jsonb, '["RSA-1024"]'::jsonb, '["pycrypto"]'::jsonb, false, false, 65.0),
    ('750e8400-e29b-41d4-a716-446655440005', '["DES"]'::jsonb, '[]'::jsonb, '["pycrypto"]'::jsonb, true, true, 78.0),
    ('750e8400-e29b-41d4-a716-446655440006', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, false, false, 15.0);

-- =============================================================================
-- CALCULATE RISK SCORES FOR ALL ASSETS
-- =============================================================================

-- Calculate risk scores using the function
SELECT calculate_hndl_risk_score(id) FROM assets WHERE deleted_at IS NULL;

-- =============================================================================
-- ATTACK SIMULATIONS
-- =============================================================================

INSERT INTO attack_simulations (asset_id, steal_year, quantum_break_year, records_exposed, impact_score, impact_level, simulation_parameters) VALUES
    ('750e8400-e29b-41d4-a716-446655440002', 2024, 2032, 5000000, 92.5, 'catastrophic', '{"scenario": "harvest_now_decrypt_later", "adversary": "nation_state", "data_value": "high"}'::jsonb),
    ('750e8400-e29b-41d4-a716-446655440009', 2024, 2030, 2000000, 98.0, 'catastrophic', '{"scenario": "harvest_now_decrypt_later", "adversary": "nation_state", "data_value": "critical"}'::jsonb);

-- =============================================================================
-- MIGRATION RECOMMENDATIONS
-- =============================================================================

INSERT INTO migration_recommendations (asset_id, current_algorithm, recommended_algorithm, migration_strategy, complexity, estimated_effort_days, risk_reduction, priority) VALUES
    ('750e8400-e29b-41d4-a716-446655440001', 'RSA-2048', 'Kyber-768', 'Hybrid TLS with X25519-Kyber768', 'medium', 45, 65.0, 1),
    ('750e8400-e29b-41d4-a716-446655440002', 'AES-256', 'AES-256 (quantum-safe)', 'No change needed - AES-256 is quantum-resistant', 'low', 0, 0.0, 5),
    ('750e8400-e29b-41d4-a716-446655440006', 'ECDSA-256', 'Dilithium-3', 'Replace ECDSA signatures with Dilithium', 'high', 60, 75.0, 2),
    ('750e8400-e29b-41d4-a716-446655440009', 'RSA-2048', 'Kyber-1024', 'Hybrid encryption with RSA+Kyber', 'high', 90, 85.0, 1);

-- =============================================================================
-- REPORTS
-- =============================================================================

INSERT INTO reports (organization_id, report_type, title, parameters, generated_by, file_location, format, generated_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'executive_summary', 'Q1 2024 Quantum Risk Assessment', '{"quarter": "Q1", "year": 2024}'::jsonb, '650e8400-e29b-41d4-a716-446655440001', '/reports/acme/q1-2024-executive.pdf', 'pdf', '2024-01-31 17:00:00+00'),
    ('550e8400-e29b-41d4-a716-446655440001', 'technical_detail', 'Cryptographic Inventory Report', '{"scope": "all_assets"}'::jsonb, '650e8400-e29b-41d4-a716-446655440002', '/reports/acme/crypto-inventory.pdf', 'pdf', '2024-01-25 10:00:00+00');

-- =============================================================================
-- AUDIT LOGS
-- =============================================================================

INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, ip_address, user_agent, created_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'login', 'user', '650e8400-e29b-41d4-a716-446655440001', '192.168.1.100', 'Mozilla/5.0', '2024-01-15 09:00:00+00'),
    ('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'scan', 'scan_job', '850e8400-e29b-41d4-a716-446655440001', '192.168.1.100', 'Mozilla/5.0', '2024-01-15 10:00:00+00'),
    ('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', 'export', 'report', NULL, '192.168.1.105', 'Mozilla/5.0', '2024-01-25 10:30:00+00');

-- =============================================================================
-- REFRESH MATERIALIZED VIEWS
-- =============================================================================

REFRESH MATERIALIZED VIEW mv_top_quantum_risk_assets;
REFRESH MATERIALIZED VIEW mv_crypto_algorithm_distribution;
REFRESH MATERIALIZED VIEW mv_data_longevity_distribution;
REFRESH MATERIALIZED VIEW mv_migration_priority_list;
