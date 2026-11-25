CREATE TABLE IF NOT EXISTS historical_dataset_revision (
    dataset_key TEXT PRIMARY KEY,
    revision BIGINT NOT NULL DEFAULT 1,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);;
INSERT INTO historical_dataset_revision(dataset_key) VALUES ('wind'),('wave'),('current') ON CONFLICT DO NOTHING;;
CREATE TABLE IF NOT EXISTS historical_point_series_cache (
    dataset_key TEXT NOT NULL REFERENCES historical_dataset_revision(dataset_key),
    point_key TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    format_version INTEGER NOT NULL,
    source_version BIGINT NOT NULL,
    row_count INTEGER NOT NULL,
    month_keys TEXT[] NOT NULL,
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(dataset_key,point_key),
    CHECK(jsonb_typeof(payload)='array' AND jsonb_array_length(payload)=row_count)
);;
CREATE OR REPLACE FUNCTION ocean_history_revision_changed() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE historical_dataset_revision SET revision=revision+1,changed_at=clock_timestamp() WHERE dataset_key=TG_ARGV[0];
    RETURN NULL;
END;
$$;;

CREATE OR REPLACE FUNCTION ocean_history_vector_samples(a BYTEA,b BYTEA,c BYTEA,offsets INTEGER[],stride INTEGER)
RETURNS TABLE(point_index INTEGER,a_bytes BYTEA[],b_bytes BYTEA[],c_bytes BYTEA[]) LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE a_plain BYTEA; b_plain BYTEA; c_plain BYTEA; i INTEGER; k INTEGER; base INTEGER;
BEGIN
    IF stride<1 OR stride>4 OR coalesce(array_length(offsets,1),0)%stride<>0 THEN
        RAISE EXCEPTION 'Invalid historical sample offsets';
    END IF;
    a_plain := substring(a from 1);
    b_plain := substring(b from 1);
    c_plain := substring(c from 1);
    FOR i IN 1..coalesce(array_length(offsets,1),0)/stride LOOP
        point_index := i; base := (i-1)*stride+1;
        a_bytes := ARRAY[]::BYTEA[]; b_bytes := ARRAY[]::BYTEA[]; c_bytes := ARRAY[]::BYTEA[];
        FOR k IN 0..stride-1 LOOP
            a_bytes := array_append(a_bytes,substring(a_plain from offsets[base+k] for 4));
            b_bytes := array_append(b_bytes,substring(b_plain from offsets[base+k] for 4));
            c_bytes := array_append(c_bytes,substring(c_plain from offsets[base+k] for 4));
        END LOOP;
        RETURN NEXT;
    END LOOP;
END;
$$;;
DO $$
DECLARE source RECORD;
BEGIN
    FOR source IN SELECT * FROM (VALUES
        ('wind','historical_wind_monthly_data'),('wind','historical_wind_metadata'),
        ('wave','historical_wave_monthly_data'),('wave','historical_wave_metadata'),
        ('current','historical_current_monthly_data'),('current','historical_current_metadata')
    ) AS sources(dataset_key,table_name) LOOP
        IF to_regclass(source.table_name) IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgrelid=to_regclass(source.table_name) AND tgname='ocean_history_cache_revision'
        ) THEN
            EXECUTE format('CREATE TRIGGER ocean_history_cache_revision AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE ON %I FOR EACH STATEMENT EXECUTE FUNCTION ocean_history_revision_changed(%L)',source.table_name,source.dataset_key);
        END IF;
    END LOOP;
END;
$$;;

-- Materialize each monthly grid once, then sample all requested points from it.
-- The source columns and their storage settings are never modified.
CREATE OR REPLACE FUNCTION ocean_history_current_samples(u BYTEA,v BYTEA,offsets INTEGER[])
RETURNS TABLE(point_index INTEGER,u_bytes BYTEA,v_bytes BYTEA) LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE u_plain BYTEA; v_plain BYTEA; i INTEGER;
BEGIN
    u_plain := substring(u from 1);
    v_plain := substring(v from 1);
    FOR i IN 1..coalesce(array_length(offsets,1),0) LOOP
        point_index := i;
        u_bytes := substring(u_plain from offsets[i] for 4);
        v_bytes := substring(v_plain from offsets[i] for 4);
        RETURN NEXT;
    END LOOP;
END;
$$;;
