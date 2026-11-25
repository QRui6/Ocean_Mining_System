ALTER TABLE mining_risk_runs ADD COLUMN IF NOT EXISTS request_key TEXT;;
ALTER TABLE mining_risk_runs ADD COLUMN IF NOT EXISTS source_signature TEXT;;
CREATE INDEX IF NOT EXISTS idx_risk_runs_request ON mining_risk_runs(area_id,request_key,created_at DESC);;
CREATE TABLE IF NOT EXISTS mining_grid_source_revision (
 id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK(id), revision BIGINT NOT NULL DEFAULT 1
);;
INSERT INTO mining_grid_source_revision(id) VALUES(TRUE) ON CONFLICT DO NOTHING;;
CREATE OR REPLACE FUNCTION ocean_mining_source_changed() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
 UPDATE mining_grid_source_revision SET revision=revision+1 WHERE id=TRUE;
 RETURN NULL;
END;
$$;;
DO $$
DECLARE name TEXT;
BEGIN
 FOREACH name IN ARRAY ARRAY['weather_metadata','wind_data','wave_data','ocean_current_data'] LOOP
  IF to_regclass(name) IS NOT NULL AND NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid=to_regclass(name) AND tgname='ocean_mining_source_revision') THEN
   EXECUTE format('CREATE TRIGGER ocean_mining_source_revision AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE ON %I FOR EACH STATEMENT EXECUTE FUNCTION ocean_mining_source_changed()',name);
  END IF;
 END LOOP;
END;
$$;;
-- Decode each grid once in the database; return only the four neighbours per point.
CREATE OR REPLACE FUNCTION ocean_mining_grid_samples(a BYTEA,b BYTEA,offsets INTEGER[],expected_bytes BIGINT)
RETURNS TABLE(point_index INTEGER,a_bytes BYTEA[],b_bytes BYTEA[]) LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE a_plain BYTEA; b_plain BYTEA; i INTEGER; k INTEGER; base INTEGER;
BEGIN
 IF coalesce(array_length(offsets,1),0)%4<>0 THEN RAISE EXCEPTION 'Invalid mining sample offsets'; END IF;
 IF octet_length(a)=expected_bytes THEN a_plain:=substring(a from 1); END IF;
 IF octet_length(b)=expected_bytes THEN b_plain:=substring(b from 1); END IF;
 FOR i IN 1..coalesce(array_length(offsets,1),0)/4 LOOP
  point_index:=i; base:=(i-1)*4+1;
  a_bytes:=ARRAY[]::BYTEA[]; b_bytes:=ARRAY[]::BYTEA[];
  FOR k IN 0..3 LOOP
   a_bytes:=array_append(a_bytes,substring(a_plain from offsets[base+k] for 4));
   b_bytes:=array_append(b_bytes,substring(b_plain from offsets[base+k] for 4));
  END LOOP;
  RETURN NEXT;
 END LOOP;
END;
$$;;
