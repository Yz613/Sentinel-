-- =============================================================================
-- SENTINEL FLEET READINESS & SUSTAINMENT PLATFORM
-- Production Database DDL Schema (PostgreSQL 16+ & TimescaleDB 2.14+)
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types for strict domain values
DO $$ BEGIN
    CREATE TYPE asset_status_enum AS ENUM (
        'MISSION READY',
        'LIMITED',
        'MAINTENANCE',
        'AWAITING PARTS',
        'SOFTWARE BLOCKED',
        'INSPECTION DUE',
        'CRITICAL FAULT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE fault_severity_enum AS ENUM (
        'Critical',
        'Moderate',
        'Low',
        'Advisory'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE work_order_status_enum AS ENUM (
        'Open',
        'In Progress',
        'Awaiting Parts',
        'Quality Inspection',
        'Completed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. ASSETS MASTER TABLE
CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    status asset_status_enum NOT NULL DEFAULT 'MISSION READY',
    location VARCHAR(128) NOT NULL DEFAULT 'Forward Operating Base Alpha',
    mission_readiness SMALLINT NOT NULL CHECK (mission_readiness BETWEEN 0 AND 100) DEFAULT 100,
    hardware_version VARCHAR(32) NOT NULL DEFAULT 'Gen 3',
    software_version VARCHAR(32) NOT NULL DEFAULT '4.8.2',
    operating_hours NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    battery_health SMALLINT NOT NULL CHECK (battery_health BETWEEN 0 AND 100) DEFAULT 100,
    powertrain_health SMALLINT NOT NULL CHECK (powertrain_health BETWEEN 0 AND 100) DEFAULT 100,
    avionics_health SMALLINT NOT NULL CHECK (avionics_health BETWEEN 0 AND 100) DEFAULT 100,
    communications_status VARCHAR(32) NOT NULL DEFAULT 'Nominal',
    assigned_team VARCHAR(128) NOT NULL DEFAULT 'Team Orion',
    maintenance_status TEXT,
    notes TEXT,
    next_inspection_hours NUMERIC(8, 2) NOT NULL DEFAULT 150.0,
    last_inspection_date DATE,
    last_inspection_hours NUMERIC(10, 2) DEFAULT 0.0,
    open_faults_count INTEGER NOT NULL DEFAULT 0,
    installed_components JSONB NOT NULL DEFAULT '[]'::jsonb,
    software_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    timeline_events JSONB NOT NULL DEFAULT '[]'::jsonb,
    required_spare_parts JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets(location);
CREATE INDEX IF NOT EXISTS idx_assets_sw_version ON assets(software_version);
CREATE INDEX IF NOT EXISTS idx_assets_readiness ON assets(mission_readiness);

-- 2. SPARE PARTS INVENTORY CATALOG
CREATE TABLE IF NOT EXISTS spare_parts (
    sku VARCHAR(64) PRIMARY KEY,
    part_name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    on_hand INTEGER NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
    required_for_open_maintenance INTEGER NOT NULL DEFAULT 0 CHECK (required_for_open_maintenance >= 0),
    reorder_point INTEGER NOT NULL DEFAULT 0 CHECK (reorder_point >= 0),
    incoming INTEGER NOT NULL DEFAULT 0 CHECK (incoming >= 0),
    lead_time_days INTEGER NOT NULL DEFAULT 3,
    unit_cost_usd NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    compatible_generations JSONB NOT NULL DEFAULT '["Gen 3"]'::jsonb,
    is_limiting_readiness BOOLEAN GENERATED ALWAYS AS (on_hand < required_for_open_maintenance) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spare_parts_on_hand ON spare_parts(on_hand);
CREATE INDEX IF NOT EXISTS idx_spare_parts_category ON spare_parts(category);

-- 3. EQUIPMENT FAULTS & DIAGNOSTIC TROUBLE CODES
CREATE TABLE IF NOT EXISTS equipment_faults (
    id VARCHAR(64) PRIMARY KEY,
    asset_id VARCHAR(64) NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    severity fault_severity_enum NOT NULL DEFAULT 'Moderate',
    detected_date DATE NOT NULL DEFAULT CURRENT_DATE,
    system VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    operational_impact TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'Active',
    owner VARCHAR(128) NOT NULL DEFAULT 'Duty Chief',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faults_asset_id ON equipment_faults(asset_id);
CREATE INDEX IF NOT EXISTS idx_faults_severity ON equipment_faults(severity);
CREATE INDEX IF NOT EXISTS idx_faults_status ON equipment_faults(status);

-- 4. MAINTENANCE BAY WORK ORDERS
CREATE TABLE IF NOT EXISTS work_orders (
    id VARCHAR(64) PRIMARY KEY,
    asset_id VARCHAR(64) NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    issue TEXT NOT NULL,
    maintenance_type VARCHAR(64) NOT NULL DEFAULT 'Unscheduled Corrective',
    priority VARCHAR(32) NOT NULL DEFAULT 'Normal',
    technician VARCHAR(128) NOT NULL DEFAULT 'Depot Lead',
    open_date DATE NOT NULL DEFAULT CURRENT_DATE,
    estimated_completion VARCHAR(64),
    completed_date DATE,
    required_parts JSONB NOT NULL DEFAULT '[]'::jsonb,
    status work_order_status_enum NOT NULL DEFAULT 'In Progress',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_orders_asset_id ON work_orders(asset_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_priority ON work_orders(priority);

-- 5. IMMUTABLE DEFENSE AUDIT TRAIL
CREATE TABLE IF NOT EXISTS audit_trail (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'audit_' || substr(md5(random()::text), 1, 16),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor VARCHAR(128) NOT NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64),
    details TEXT NOT NULL,
    records_count INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(32) NOT NULL DEFAULT 'success',
    request_id VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_trail(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_trail(actor);

-- 6. HIGH-FREQUENCY TIME-SERIES TELEMETRY TABLE (TimescaleDB Hypertable)
CREATE TABLE IF NOT EXISTS telemetry_pings (
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    asset_id VARCHAR(64) NOT NULL,
    battery_health SMALLINT,
    powertrain_health SMALLINT,
    avionics_health SMALLINT,
    operating_hours NUMERIC(10, 2),
    communications_status VARCHAR(32),
    speed_kmh NUMERIC(6, 2),
    temp_celsius NUMERIC(5, 2),
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    status VARCHAR(32),
    raw_payload JSONB
);

-- Convert telemetry_pings to hypertable if TimescaleDB is installed
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        PERFORM create_hypertable('telemetry_pings', 'timestamp', if_not_exists => TRUE);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_telemetry_asset_time ON telemetry_pings(asset_id, timestamp DESC);
