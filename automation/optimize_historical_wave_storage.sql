ALTER TABLE historical_wave_monthly_data
    ALTER COLUMN swh_component SET STORAGE EXTERNAL;

ALTER TABLE historical_wave_monthly_data
    ALTER COLUMN mwp_component SET STORAGE EXTERNAL;

ALTER TABLE historical_wave_monthly_data
    ALTER COLUMN mwd_component SET STORAGE EXTERNAL;

VACUUM FULL historical_wave_monthly_data;
ANALYZE historical_wave_monthly_data;
