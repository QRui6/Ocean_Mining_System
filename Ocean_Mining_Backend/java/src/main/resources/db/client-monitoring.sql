CREATE TABLE IF NOT EXISTS mining_risk_runs (
 id uuid PRIMARY KEY, area_id varchar(100) NOT NULL, status varchar(20) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz,
 progress integer NOT NULL DEFAULT 0, error text, result jsonb
);
CREATE INDEX IF NOT EXISTS idx_risk_runs_area ON mining_risk_runs(area_id,created_at DESC);
CREATE TABLE IF NOT EXISTS mining_risk_events (
 id bigserial PRIMARY KEY, area_id varchar(100) NOT NULL, metric varchar(30) NOT NULL,
 status varchar(20) NOT NULL, severity varchar(20) NOT NULL, snapshot jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_risk_event_active ON mining_risk_events(area_id,metric) WHERE status='ACTIVE';
CREATE TABLE IF NOT EXISTS mining_risk_versions (
 id bigserial PRIMARY KEY, event_id bigint NOT NULL REFERENCES mining_risk_events(id),
 action varchar(30) NOT NULL, snapshot jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS buoy_test_observations (
 station_id varchar(100) NOT NULL, observed_at timestamp NOT NULL, record_key varchar(64) NOT NULL,
 device_time timestamp, values_json jsonb NOT NULL, quality jsonb NOT NULL, source_file text NOT NULL, source_line integer NOT NULL,
 PRIMARY KEY(station_id,record_key)
);
CREATE INDEX IF NOT EXISTS idx_buoy_test_time ON buoy_test_observations(station_id,observed_at);
CREATE TABLE IF NOT EXISTS buoy_test_attitudes (
 station_id varchar(100) NOT NULL, observed_at timestamp NOT NULL, record_key varchar(64) NOT NULL,
 decoded jsonb NOT NULL, raw_hex text NOT NULL, quality jsonb NOT NULL, source_file text NOT NULL, source_line integer NOT NULL,
 PRIMARY KEY(station_id,record_key)
);
CREATE INDEX IF NOT EXISTS idx_buoy_attitude_time ON buoy_test_attitudes(station_id,observed_at);
CREATE TABLE IF NOT EXISTS buoy_test_imports (
 station_id varchar(100) PRIMARY KEY, manifest jsonb NOT NULL, imported_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS typhoon_forecast_batches (
 id bigserial PRIMARY KEY, source varchar(80) NOT NULL, initial_time timestamptz NOT NULL,
 payload jsonb NOT NULL, fetched_at timestamptz NOT NULL DEFAULT now(), UNIQUE(source,initial_time)
);
