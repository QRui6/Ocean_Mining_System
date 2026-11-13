# Automation

This directory is for data automation workflows that sit alongside the backend.

Current scope:

- `wind_wave/`: download and later process daily wind/wave forecast files
- `current_surface/`: download Copernicus surface current forecasts and normalize them into project raw batches
- `mining_overview/`: import and manage static overview region data
- `historical_wind/`: download independent ERA5 monthly historical wind fields

Current downloaded files are stored under:

- `data/raw/YYYY/MM/DD/`

Manual test command:

```powershell
python automation\wind_wave\download_daily_wind_wave.py
```

Download one specific date instead of the latest batch:

```powershell
python automation\wind_wave\download_daily_wind_wave.py --date 2026-05-10
```

Register one downloaded batch into the database:

```powershell
python automation\wind_wave\register_weather_batch.py
```

Import large mining regions from the bundled GeoJSON:

```powershell
python automation\mining_overview\import_mining_regions.py
```

Process one registered batch into region/site hourly and daily forecast tables:

```powershell
python automation\mining_overview\process_forecasts_batch.py --date 2026-05-10
```

Run the full pipeline in one command:

```powershell
python automation\run_daily_forecast_pipeline.py
```

Run the surface-current-only pipeline in one command:

```powershell
python automation\run_surface_current_pipeline.py
```

Run the full pipeline through the PowerShell wrapper with local config and log output:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File automation\run_daily_forecast_pipeline_task.ps1
```

Download ERA5 historical monthly wind fields one month at a time:

```powershell
python automation\historical_wind\download_era5_monthly_wind.py --year 2000
```

The historical wind script reads credentials from:

```text
automation/historical_wind/cdsapi.local
```

Run the full pipeline against the remote database and delete the raw batch files
after a successful run:

```powershell
python automation\run_daily_forecast_pipeline.py --db-host 121.194.93.61 --db-name ship_monitoring --db-user postgres --db-password <your_password> --cleanup-raw
```

Manual run setup:

1. Review or edit the local task config file:

```powershell
automation\daily_forecast_task.env.ps1
```

Tracked example:

```powershell
automation\daily_forecast_task.env.example.ps1
```

2. Run the wrapper script manually when you need to download and process the latest batch:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File automation\run_daily_forecast_pipeline_task.ps1
```

3. The wrapper script writes logs under `automation\logs\`:

```powershell
automation\run_daily_forecast_pipeline_task.ps1
```

4. If this machine already has the old Windows scheduled task installed, remove it once:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File automation\remove_daily_forecast_task.ps1
```

Behavior notes:

- By default, the pipeline downloads the latest available wind/wave batch.
- If you rerun the same batch date and run cycle, that batch is reprocessed and its own rows are refreshed.
- Older batch dates are preserved in the database and are not deleted.
- Automatic Windows scheduling is disabled in this repository. The pipeline runs only when started manually.
