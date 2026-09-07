\c ship_monitoring;

-- Exact geography distance is still used in application SQL.
-- This index keeps future ST_DWithin/ST_Distance geography queries indexable.
CREATE INDEX IF NOT EXISTS idx_typhoon_track_geom_geography
    ON typhoon_track_points
    USING GIST ((geom::geography));

-- Season filtering is always paired with sid joins in historical typhoon analytics.
CREATE INDEX IF NOT EXISTS idx_typhoon_events_season_sid
    ON typhoon_events (season, sid);

SELECT 'Typhoon query indexes created successfully!' AS status;
