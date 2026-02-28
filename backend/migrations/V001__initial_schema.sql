-- QuantumShield Database Schema V1
-- Production-grade schema for HNDL exposure intelligence
-- Database: PostgreSQL 14+
-- Migration Tool: Flyway/Alembic

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Custom types
CREATE TYPE user_role AS ENUM ('admin', 'analyst', 'viewer');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE asset_type AS ENUM ('service', 'database', 'bucket', 'backup', 'certificate', 'repository', 'vm', 'kubernetes_service');
CREATE TYPE environment_type AS ENUM ('production', 'staging', 'development', 'test');
CREATE TYPE criticality_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE exposure_level AS ENUM ('internal', 'partner', 'public', 'internet');
CREATE TYPE scan_type AS ENUM ('tls_scan', 'repo_scan', 'storage_scan', 'infra_scan', 'full_scan');
CREATE TYPE scan_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE target_type AS ENUM ('domain', 'repository', 'bucket', 'ip_range', 'service', 'database');
CREATE TYPE encryption_layer AS ENUM ('transport', 'storage', 'backup', 'application', 'database');
CREATE TYPE data_sensitivity AS ENUM ('public', 'internal', 'confidential', 'restricted', 'top_secret');
CREATE TYPE risk_severity AS ENUM ('low', 'moderate', 'high', 'critical');
CREATE TYPE impact_level AS ENUM ('low', 'moderate', 'high', 'catastrophic');
CREATE TYPE report_type AS ENUM ('executive_summary', 'technical_detail', 'compliance', 'migration_plan', 'risk_assessment');
CREATE TYPE audit_action AS ENUM ('create', 'read', 'update', 'delete', 'login', 'logout', 'scan', 'export');

-- =============================================================================
-- 1. ORGANIZATIONS (Multi-tenant support)
-- =============================================================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    size VARCHAR(50),
    region VARCHAR(100),
    risk_profile JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_organizations_name ON organizations(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_region ON organizations(region) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_deleted ON organizations(deleted_at);

COMMENT ON TABLE organizations IS 'Multi-tenant organization entities';

-- =============================================================================
-- 2. USERS
-- =============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    status user_status DEFAULT 'active',
    last_login TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_email_per_org UNIQUE (organization_id, email, deleted_at)
);

CREATE UNIQUE INDEX idx_users_email_active ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_organization ON users(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;

COMMENT ON TABLE users IS 'System users with role-based access control';

-- =============================================================================
-- 3. ASSETS (Central inventory)
-- =============================================================================
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_name VARCHAR(500) NOT NULL,
    asset_type asset_type NOT NULL,
    environment environment_type DEFAULT 'production',
    owner_team VARCHAR(255),
    criticality criticality_level DEFAULT 'medium',
    exposure_surface exposure_level DEFAULT 'internal',
    region VARCHAR(100),
    tags JSONB DEFAULT '[]',
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_assets_organization ON assets(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_type ON assets(asset_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_criticality ON assets(criticality) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_exposure ON assets(exposure_surface) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_environment ON assets(environment) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_name_trgm ON assets USING gin(asset_name gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_tags ON assets USING gin(tags) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_last_seen ON assets(last_seen DESC) WHERE deleted_at IS NULL;

COMMENT ON TABLE assets IS 'Central asset inventory - all discovered infrastructure';

-- =============================================================================
-- 4. ASSET METADATA (Flexible key-value storage)
-- =============================================================================
CREATE TABLE asset_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value_json JSONB NOT NULL,
    source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_asset_key UNIQUE (asset_id, key, deleted_at)
);

CREATE INDEX idx_asset_metadata_asset ON asset_metadata(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_metadata_key ON asset_metadata(key) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_metadata_value ON asset_metadata USING gin(value_json) WHERE deleted_at IS NULL;

COMMENT ON TABLE asset_metadata IS 'Extensible metadata for assets';

-- =============================================================================
-- 5. SCAN JOBS (Partitioned by organization and month)
-- =============================================================================
CREATE TABLE scan_jobs (
    id UUID DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    scan_type scan_type NOT NULL,
    status scan_status DEFAULT 'pending',
    initiated_by UUID REFERENCES users(id),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    assets_scanned INTEGER DEFAULT 0,
    findings_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    scan_config JSONB DEFAULT '{}',
    error_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (id, organization_id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_scan_jobs_org ON scan_jobs(organization_id, created_at DESC);
CREATE INDEX idx_scan_jobs_status ON scan_jobs(status, created_at DESC);
CREATE INDEX idx_scan_jobs_type ON scan_jobs(scan_type, created_at DESC);
CREATE INDEX idx_scan_jobs_user ON scan_jobs(initiated_by);

-- Create partitions for current and next 12 months
CREATE TABLE scan_jobs_2024_01 PARTITION OF scan_jobs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE scan_jobs_2024_02 PARTITION OF scan_jobs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
CREATE TABLE scan_jobs_2024_03 PARTITION OF scan_jobs
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

COMMENT ON TABLE scan_jobs IS 'Scan job tracking - partitioned by month';

-- =============================================================================
-- 6. SCAN TARGETS
-- =============================================================================
CREATE TABLE scan_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_job_id UUID NOT NULL,
    target_type target_type NOT NULL,
    target_identifier VARCHAR(1000) NOT NULL,
    status scan_status DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    findings_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_scan_targets_job ON scan_targets(scan_job_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_scan_targets_type ON scan_targets(target_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_scan_targets_status ON scan_targets(status) WHERE deleted_at IS NULL;

COMMENT ON TABLE scan_targets IS 'Individual targets within scan jobs';

-- =============================================================================
-- 7. TLS FINDINGS (Partitioned)
-- =============================================================================
CREATE TABLE tls_findings (
    id UUID DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    domain VARCHAR(500) NOT NULL,
    port INTEGER NOT NULL,
    tls_version VARCHAR(50),
    cipher_suite VARCHAR(255),
    key_algorithm VARCHAR(100),
    key_size INTEGER,
    signature_algorithm VARCHAR(100),
    forward_secrecy BOOLEAN,
    certificate_issuer VARCHAR(500),
    certificate_expiry TIMESTAMP WITH TIME ZONE,
    certificate_chain JSONB,
    vulnerabilities JSONB DEFAULT '[]',
    scan_job_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (id, organization_id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_tls_findings_asset ON tls_findings(asset_id, created_at DESC);
CREATE INDEX idx_tls_findings_domain ON tls_findings(domain);
CREATE INDEX idx_tls_findings_key_algo ON tls_findings(key_algorithm, key_size);
CREATE INDEX idx_tls_findings_scan ON tls_findings(scan_job_id);
CREATE INDEX idx_tls_findings_expiry ON tls_findings(certificate_expiry) WHERE certificate_expiry IS NOT NULL;

-- Create partitions
CREATE TABLE tls_findings_2024_01 PARTITION OF tls_findings
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE tls_findings_2024_02 PARTITION OF tls_findings
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

COMMENT ON TABLE tls_findings IS 'TLS/SSL scan results - partitioned by month';

-- =============================================================================
-- 8. CRYPTO FINDINGS (Partitioned)
-- =============================================================================
CREATE TABLE crypto_findings (
    id UUID DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    repository VARCHAR(500),
    file_path VARCHAR(2000),
    line_number INTEGER,
    algorithm VARCHAR(100) NOT NULL,
    key_length INTEGER,
    library VARCHAR(255),
    purpose VARCHAR(255),
    risk_flag BOOLEAN DEFAULT FALSE,
    confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    context_snippet TEXT,
    scan_job_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (id, organization_id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_crypto_findings_asset ON crypto_findings(asset_id, created_at DESC);
CREATE INDEX idx_crypto_findings_algorithm ON crypto_findings(algorithm);
CREATE INDEX idx_crypto_findings_repo ON crypto_findings(repository);
CREATE INDEX idx_crypto_findings_risk ON crypto_findings(risk_flag) WHERE risk_flag = TRUE;
CREATE INDEX idx_crypto_findings_scan ON crypto_findings(scan_job_id);

-- Create partitions
CREATE TABLE crypto_findings_2024_01 PARTITION OF crypto_findings
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE crypto_findings_2024_02 PARTITION OF crypto_findings
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

COMMENT ON TABLE crypto_findings IS 'Cryptographic usage discovered in code/config';

-- =============================================================================
-- 9. ENCRYPTION INVENTORY
-- =============================================================================
CREATE TABLE encryption_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    encryption_layer encryption_layer NOT NULL,
    algorithm VARCHAR(100) NOT NULL,
    key_size INTEGER,
    key_management VARCHAR(255),
    rotation_policy VARCHAR(255),
    pqc_ready BOOLEAN DEFAULT FALSE,
    implementation_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_encryption_inventory_asset ON encryption_inventory(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_encryption_inventory_layer ON encryption_inventory(encryption_layer) WHERE deleted_at IS NULL;
CREATE INDEX idx_encryption_inventory_algorithm ON encryption_inventory(algorithm) WHERE deleted_at IS NULL;
CREATE INDEX idx_encryption_inventory_pqc ON encryption_inventory(pqc_ready) WHERE deleted_at IS NULL;

COMMENT ON TABLE encryption_inventory IS 'Encryption mechanisms protecting assets';

-- =============================================================================
-- 10. DATA CLASSIFICATIONS
-- =============================================================================
CREATE TABLE data_classifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    data_type VARCHAR(255) NOT NULL,
    sensitivity_score NUMERIC(5,2) CHECK (sensitivity_score >= 0 AND sensitivity_score <= 100),
    regulatory_tags JSONB DEFAULT '[]',
    estimated_records BIGINT,
    confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    classification_method VARCHAR(100),
    data_samples JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_data_class_asset ON data_classifications(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_data_class_type ON data_classifications(data_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_data_class_sensitivity ON data_classifications(sensitivity_score DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_data_class_regulatory ON data_classifications USING gin(regulatory_tags) WHERE deleted_at IS NULL;

COMMENT ON TABLE data_classifications IS 'Data sensitivity and regulatory classification';

-- =============================================================================
-- 11. DATA LONGEVITY
-- =============================================================================
CREATE TABLE data_longevity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    required_secrecy_years INTEGER NOT NULL,
    retention_policy_years INTEGER,
    estimated_expiry_date DATE,
    reason TEXT,
    confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    regulatory_basis JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_data_longevity_asset ON data_longevity(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_data_longevity_years ON data_longevity(required_secrecy_years DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_data_longevity_expiry ON data_longevity(estimated_expiry_date) WHERE deleted_at IS NULL;

COMMENT ON TABLE data_longevity IS 'Required confidentiality duration for data';

-- =============================================================================
-- 12. EXPOSURE SCORES
-- =============================================================================
CREATE TABLE exposure_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    internet_exposed BOOLEAN DEFAULT FALSE,
    public_access BOOLEAN DEFAULT FALSE,
    third_party_access BOOLEAN DEFAULT FALSE,
    backup_replication BOOLEAN DEFAULT FALSE,
    geo_replication BOOLEAN DEFAULT FALSE,
    access_controls_weak BOOLEAN DEFAULT FALSE,
    score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
    factors JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_exposure_scores_asset ON exposure_scores(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_exposure_scores_score ON exposure_scores(score DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_exposure_scores_internet ON exposure_scores(internet_exposed) WHERE internet_exposed = TRUE;

COMMENT ON TABLE exposure_scores IS 'Ease of data harvesting assessment';

-- =============================================================================
-- 13. QUANTUM MODELS
-- =============================================================================
CREATE TABLE quantum_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    qubit_growth_rate NUMERIC(5,2),
    error_rate NUMERIC(10,8),
    logical_qubits_projection JSONB NOT NULL,
    confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    source VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_quantum_models_active ON quantum_models(is_active) WHERE deleted_at IS NULL;

COMMENT ON TABLE quantum_models IS 'Quantum computing capability projections';

-- =============================================================================
-- 14. QUANTUM BREAK ESTIMATES
-- =============================================================================
CREATE TABLE quantum_break_estimates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    algorithm VARCHAR(100) NOT NULL,
    key_size INTEGER NOT NULL,
    logical_qubits_required BIGINT NOT NULL,
    earliest_break_year INTEGER,
    latest_break_year INTEGER,
    confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    model_id UUID REFERENCES quantum_models(id),
    assumptions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_algo_key_model UNIQUE (algorithm, key_size, model_id, deleted_at)
);

CREATE INDEX idx_quantum_break_algorithm ON quantum_break_estimates(algorithm, key_size) WHERE deleted_at IS NULL;
CREATE INDEX idx_quantum_break_year ON quantum_break_estimates(earliest_break_year) WHERE deleted_at IS NULL;
CREATE INDEX idx_quantum_break_model ON quantum_break_estimates(model_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE quantum_break_estimates IS 'When quantum computers can break specific algorithms';

-- =============================================================================
-- 15. RISK SCORES (Partitioned)
-- =============================================================================
CREATE TABLE risk_scores (
    id UUID DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    data_sensitivity NUMERIC(5,2) DEFAULT 0,
    data_longevity NUMERIC(5,2) DEFAULT 0,
    crypto_weakness NUMERIC(5,2) DEFAULT 0,
    exposure_surface NUMERIC(5,2) DEFAULT 0,
    adversary_value NUMERIC(5,2) DEFAULT 0,
    risk_score NUMERIC(5,2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_severity risk_severity NOT NULL,
    calculation_version VARCHAR(50),
    calculation_details JSONB DEFAULT '{}',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (id, organization_id, calculated_at)
) PARTITION BY RANGE (calculated_at);

CREATE INDEX idx_risk_scores_asset ON risk_scores(asset_id, calculated_at DESC);
CREATE INDEX idx_risk_scores_score ON risk_scores(risk_score DESC, calculated_at DESC);
CREATE INDEX idx_risk_scores_severity ON risk_scores(risk_severity, calculated_at DESC);
CREATE INDEX idx_risk_scores_org ON risk_scores(organization_id, calculated_at DESC);

-- Create partitions
CREATE TABLE risk_scores_2024_01 PARTITION OF risk_scores
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE risk_scores_2024_02 PARTITION OF risk_scores
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

COMMENT ON TABLE risk_scores IS 'Calculated HNDL risk scores - partitioned by calculation date';

-- =============================================================================
-- 16. ATTACK SIMULATIONS
-- =============================================================================
CREATE TABLE attack_simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    steal_year INTEGER NOT NULL,
    quantum_break_year INTEGER NOT NULL,
    records_exposed BIGINT,
    impact_score NUMERIC(5,2) CHECK (impact_score >= 0 AND impact_score <= 100),
    impact_level impact_level NOT NULL,
    simulation_parameters JSONB NOT NULL,
    results JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_attack_sim_asset ON attack_simulations(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_attack_sim_impact ON attack_simulations(impact_score DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_attack_sim_years ON attack_simulations(steal_year, quantum_break_year) WHERE deleted_at IS NULL;

COMMENT ON TABLE attack_simulations IS 'Simulated HNDL attack scenarios';

-- =============================================================================
-- 17. MIGRATION RECOMMENDATIONS
-- =============================================================================
CREATE TABLE migration_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    current_algorithm VARCHAR(100) NOT NULL,
    recommended_algorithm VARCHAR(100) NOT NULL,
    migration_strategy TEXT,
    complexity VARCHAR(50),
    estimated_effort_days INTEGER,
    risk_reduction NUMERIC(5,2),
    priority INTEGER,
    dependencies JSONB DEFAULT '[]',
    implementation_guide TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_migration_rec_asset ON migration_recommendations(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_migration_rec_priority ON migration_recommendations(priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_migration_rec_risk ON migration_recommendations(risk_reduction DESC) WHERE deleted_at IS NULL;

COMMENT ON TABLE migration_recommendations IS 'PQC migration recommendations';

-- =============================================================================
-- 18. CRYPTO TECHNICAL DEBT
-- =============================================================================
CREATE TABLE crypto_technical_debt (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    deprecated_algorithms JSONB DEFAULT '[]',
    weak_keys JSONB DEFAULT '[]',
    unsupported_libraries JSONB DEFAULT '[]',
    manual_key_management BOOLEAN DEFAULT FALSE,
    hardcoded_secrets BOOLEAN DEFAULT FALSE,
    score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_crypto_debt_asset ON crypto_technical_debt(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_crypto_debt_score ON crypto_technical_debt(score DESC) WHERE deleted_at IS NULL;

COMMENT ON TABLE crypto_technical_debt IS 'Legacy cryptography problems';

-- =============================================================================
-- 19. REPORTS
-- =============================================================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    report_type report_type NOT NULL,
    title VARCHAR(500) NOT NULL,
    parameters JSONB DEFAULT '{}',
    generated_by UUID REFERENCES users(id),
    file_location VARCHAR(1000),
    file_size BIGINT,
    format VARCHAR(50),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_reports_org ON reports(organization_id, generated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_type ON reports(report_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_user ON reports(generated_by) WHERE deleted_at IS NULL;

COMMENT ON TABLE reports IS 'Generated analytical reports';

-- =============================================================================
-- 20. AUDIT LOGS (Partitioned)
-- =============================================================================
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action audit_action NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (id, organization_id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Create partitions (7 years retention)
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail - 7 year retention';

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_metadata_updated_at BEFORE UPDATE ON asset_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scan_targets_updated_at BEFORE UPDATE ON scan_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_encryption_inventory_updated_at BEFORE UPDATE ON encryption_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_classifications_updated_at BEFORE UPDATE ON data_classifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_longevity_updated_at BEFORE UPDATE ON data_longevity
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exposure_scores_updated_at BEFORE UPDATE ON exposure_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quantum_models_updated_at BEFORE UPDATE ON quantum_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quantum_break_estimates_updated_at BEFORE UPDATE ON quantum_break_estimates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attack_simulations_updated_at BEFORE UPDATE ON attack_simulations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_migration_recommendations_updated_at BEFORE UPDATE ON migration_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crypto_technical_debt_updated_at BEFORE UPDATE ON crypto_technical_debt
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- MATERIALIZED VIEWS FOR DASHBOARDS
-- =============================================================================

-- Top quantum risk assets
CREATE MATERIALIZED VIEW mv_top_quantum_risk_assets AS
SELECT 
    a.id,
    a.organization_id,
    a.asset_name,
    a.asset_type,
    a.criticality,
    r.risk_score,
    r.risk_severity,
    d.required_secrecy_years,
    e.algorithm as encryption_algorithm,
    e.key_size,
    qb.earliest_break_year,
    r.calculated_at
FROM assets a
JOIN LATERAL (
    SELECT * FROM risk_scores 
    WHERE asset_id = a.id 
    ORDER BY calculated_at DESC 
    LIMIT 1
) r ON true
LEFT JOIN data_longevity d ON a.id = d.asset_id AND d.deleted_at IS NULL
LEFT JOIN encryption_inventory e ON a.id = e.asset_id AND e.deleted_at IS NULL
LEFT JOIN quantum_break_estimates qb ON e.algorithm = qb.algorithm AND e.key_size = qb.key_size
WHERE a.deleted_at IS NULL
ORDER BY r.risk_score DESC;

CREATE UNIQUE INDEX idx_mv_top_risk_id ON mv_top_quantum_risk_assets(id);
CREATE INDEX idx_mv_top_risk_org ON mv_top_quantum_risk_assets(organization_id);
CREATE INDEX idx_mv_top_risk_score ON mv_top_quantum_risk_assets(risk_score DESC);

-- Crypto algorithm distribution
CREATE MATERIALIZED VIEW mv_crypto_algorithm_distribution AS
SELECT 
    organization_id,
    algorithm,
    key_size,
    COUNT(*) as usage_count,
    COUNT(DISTINCT asset_id) as asset_count,
    AVG(CASE WHEN risk_flag THEN 1 ELSE 0 END) as risk_ratio,
    MAX(created_at) as last_seen
FROM crypto_findings
WHERE deleted_at IS NULL
GROUP BY organization_id, algorithm, key_size;

CREATE INDEX idx_mv_crypto_dist_org ON mv_crypto_algorithm_distribution(organization_id);
CREATE INDEX idx_mv_crypto_dist_algo ON mv_crypto_algorithm_distribution(algorithm);

-- Data longevity distribution
CREATE MATERIALIZED VIEW mv_data_longevity_distribution AS
SELECT 
    a.organization_id,
    CASE 
        WHEN d.required_secrecy_years <= 5 THEN '0-5 years'
        WHEN d.required_secrecy_years <= 10 THEN '6-10 years'
        WHEN d.required_secrecy_years <= 20 THEN '11-20 years'
        ELSE '20+ years'
    END as longevity_bucket,
    COUNT(*) as asset_count,
    AVG(r.risk_score) as avg_risk_score
FROM assets a
JOIN data_longevity d ON a.id = d.asset_id
LEFT JOIN LATERAL (
    SELECT risk_score FROM risk_scores 
    WHERE asset_id = a.id 
    ORDER BY calculated_at DESC 
    LIMIT 1
) r ON true
WHERE a.deleted_at IS NULL AND d.deleted_at IS NULL
GROUP BY a.organization_id, longevity_bucket;

CREATE INDEX idx_mv_longevity_org ON mv_data_longevity_distribution(organization_id);

-- Migration priority list
CREATE MATERIALIZED VIEW mv_migration_priority_list AS
SELECT 
    m.id,
    m.asset_id,
    a.organization_id,
    a.asset_name,
    m.current_algorithm,
    m.recommended_algorithm,
    m.estimated_effort_days,
    m.risk_reduction,
    m.priority,
    r.risk_score as current_risk_score,
    qb.earliest_break_year
FROM migration_recommendations m
JOIN assets a ON m.asset_id = a.id
LEFT JOIN LATERAL (
    SELECT risk_score FROM risk_scores 
    WHERE asset_id = a.id 
    ORDER BY calculated_at DESC 
    LIMIT 1
) r ON true
LEFT JOIN quantum_break_estimates qb ON m.current_algorithm = qb.algorithm
WHERE m.deleted_at IS NULL AND a.deleted_at IS NULL
ORDER BY m.priority, m.risk_reduction DESC;

CREATE UNIQUE INDEX idx_mv_migration_id ON mv_migration_priority_list(id);
CREATE INDEX idx_mv_migration_org ON mv_migration_priority_list(organization_id);
CREATE INDEX idx_mv_migration_priority ON mv_migration_priority_list(priority);

COMMENT ON MATERIALIZED VIEW mv_top_quantum_risk_assets IS 'Refresh hourly';
COMMENT ON MATERIALIZED VIEW mv_crypto_algorithm_distribution IS 'Refresh daily';
COMMENT ON MATERIALIZED VIEW mv_data_longevity_distribution IS 'Refresh daily';
COMMENT ON MATERIALIZED VIEW mv_migration_priority_list IS 'Refresh every 6 hours';

-- =============================================================================
-- FUNCTIONS FOR COMMON QUERIES
-- =============================================================================

-- Calculate HNDL risk score
CREATE OR REPLACE FUNCTION calculate_hndl_risk_score(
    p_asset_id UUID,
    p_calculation_version VARCHAR DEFAULT '1.0'
) RETURNS NUMERIC AS $$
DECLARE
    v_data_sensitivity NUMERIC := 0;
    v_data_longevity NUMERIC := 0;
    v_crypto_weakness NUMERIC := 0;
    v_exposure_surface NUMERIC := 0;
    v_adversary_value NUMERIC := 0;
    v_risk_score NUMERIC;
    v_risk_severity risk_severity;
BEGIN
    -- Data sensitivity (0-100)
    SELECT COALESCE(MAX(sensitivity_score), 0) INTO v_data_sensitivity
    FROM data_classifications
    WHERE asset_id = p_asset_id AND deleted_at IS NULL;
    
    -- Data longevity (0-100)
    SELECT COALESCE(MAX(required_secrecy_years * 5), 0) INTO v_data_longevity
    FROM data_longevity
    WHERE asset_id = p_asset_id AND deleted_at IS NULL;
    v_data_longevity := LEAST(v_data_longevity, 100);
    
    -- Crypto weakness (0-100)
    SELECT COALESCE(MAX(score), 0) INTO v_crypto_weakness
    FROM crypto_technical_debt
    WHERE asset_id = p_asset_id AND deleted_at IS NULL;
    
    -- Exposure surface (0-100)
    SELECT COALESCE(MAX(score), 0) INTO v_exposure_surface
    FROM exposure_scores
    WHERE asset_id = p_asset_id AND deleted_at IS NULL;
    
    -- Adversary value (based on criticality)
    SELECT CASE criticality
        WHEN 'critical' THEN 100
        WHEN 'high' THEN 75
        WHEN 'medium' THEN 50
        ELSE 25
    END INTO v_adversary_value
    FROM assets
    WHERE id = p_asset_id;
    
    -- Weighted calculation
    v_risk_score := (
        v_data_sensitivity * 0.25 +
        v_data_longevity * 0.25 +
        v_crypto_weakness * 0.20 +
        v_exposure_surface * 0.20 +
        v_adversary_value * 0.10
    );
    
    -- Determine severity
    v_risk_severity := CASE
        WHEN v_risk_score >= 75 THEN 'critical'::risk_severity
        WHEN v_risk_score >= 50 THEN 'high'::risk_severity
        WHEN v_risk_score >= 25 THEN 'moderate'::risk_severity
        ELSE 'low'::risk_severity
    END;
    
    -- Insert risk score
    INSERT INTO risk_scores (
        asset_id,
        organization_id,
        data_sensitivity,
        data_longevity,
        crypto_weakness,
        exposure_surface,
        adversary_value,
        risk_score,
        risk_severity,
        calculation_version
    )
    SELECT 
        p_asset_id,
        organization_id,
        v_data_sensitivity,
        v_data_longevity,
        v_crypto_weakness,
        v_exposure_surface,
        v_adversary_value,
        v_risk_score,
        v_risk_severity,
        p_calculation_version
    FROM assets WHERE id = p_asset_id;
    
    RETURN v_risk_score;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_hndl_risk_score IS 'Calculate and store HNDL risk score for an asset';

-- Soft delete function
CREATE OR REPLACE FUNCTION soft_delete(
    p_table_name TEXT,
    p_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    EXECUTE format('UPDATE %I SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL', p_table_name)
    USING p_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Enable parallel query execution
ALTER TABLE assets SET (parallel_workers = 4);
ALTER TABLE risk_scores SET (parallel_workers = 4);
ALTER TABLE crypto_findings SET (parallel_workers = 4);
ALTER TABLE tls_findings SET (parallel_workers = 4);

-- Set statistics targets for better query planning
ALTER TABLE assets ALTER COLUMN organization_id SET STATISTICS 1000;
ALTER TABLE assets ALTER COLUMN asset_type SET STATISTICS 1000;
ALTER TABLE risk_scores ALTER COLUMN risk_score SET STATISTICS 1000;

-- =============================================================================
-- GRANTS (Example - adjust for your roles)
-- =============================================================================

-- Create roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'quantumshield_app') THEN
        CREATE ROLE quantumshield_app WITH LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'quantumshield_readonly') THEN
        CREATE ROLE quantumshield_readonly WITH LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION';
    END IF;
END
$$;

-- Grant permissions
GRANT CONNECT ON DATABASE postgres TO quantumshield_app;
GRANT USAGE ON SCHEMA public TO quantumshield_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO quantumshield_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO quantumshield_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO quantumshield_app;

-- Read-only access
GRANT CONNECT ON DATABASE postgres TO quantumshield_readonly;
GRANT USAGE ON SCHEMA public TO quantumshield_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO quantumshield_readonly;

-- =============================================================================
-- INITIAL DATA / SEED DATA
-- =============================================================================

-- Insert default quantum model
INSERT INTO quantum_models (
    model_name,
    description,
    qubit_growth_rate,
    error_rate,
    logical_qubits_projection,
    confidence,
    source,
    is_active
) VALUES (
    'Conservative Estimate 2024',
    'Conservative quantum computing capability projection based on current research',
    1.15,
    0.001,
    '{"2025": 100, "2030": 1000, "2035": 10000, "2040": 100000}'::jsonb,
    0.70,
    'Industry consensus and academic research',
    true
);

-- Insert quantum break estimates for common algorithms
INSERT INTO quantum_break_estimates (algorithm, key_size, logical_qubits_required, earliest_break_year, latest_break_year, confidence, model_id)
SELECT 
    algo.algorithm,
    algo.key_size,
    algo.qubits,
    algo.earliest,
    algo.latest,
    0.75,
    (SELECT id FROM quantum_models WHERE model_name = 'Conservative Estimate 2024')
FROM (VALUES
    ('RSA', 2048, 4096, 2030, 2035),
    ('RSA', 3072, 6144, 2033, 2038),
    ('RSA', 4096, 8192, 2035, 2040),
    ('ECC', 256, 2330, 2028, 2033),
    ('ECC', 384, 3484, 2030, 2035),
    ('AES', 128, 2953, 2040, 2050),
    ('AES', 256, 6681, 2050, 2060)
) AS algo(algorithm, key_size, qubits, earliest, latest);

COMMENT ON DATABASE postgres IS 'QuantumShield - HNDL Exposure Intelligence Platform';
