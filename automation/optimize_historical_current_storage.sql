ALTER TABLE historical_current_monthly_data ALTER COLUMN u_component SET STORAGE EXTERNAL;
ALTER TABLE historical_current_monthly_data ALTER COLUMN v_component SET STORAGE EXTERNAL;
VACUUM FULL historical_current_monthly_data;
ANALYZE historical_current_monthly_data;
