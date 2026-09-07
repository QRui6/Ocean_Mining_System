# Historical Wind

This module is independent from the existing forecast pipeline.

Current scope:

- Download ERA5 monthly averaged reanalysis wind fields
- One request per month
- Variables:
  - `10m_u_component_of_wind`
  - `10m_v_component_of_wind`
  - `instantaneous_10m_wind_gust`

Output layout:

- Raw files: `data/historical_wind/raw/YYYY/era5_monthly_wind_YYYY_MM.grib`
- Manifest: `data/historical_wind/manifests/era5_monthly_wind_YYYY.json`
- Importer: `automation/historical_wind/import_era5_monthly_wind_to_db.py`

Prerequisites:

1. Install the CDS API client:

```powershell
pip install cdsapi
```

2. Configure the project-local credential file:

```text
automation/historical_wind/cdsapi.local
```

Example:

```text
url: https://cds.climate.copernicus.eu/api
key: <your-personal-access-token>
```

Download the full year 2000 month by month:

```powershell
python automation\historical_wind\download_era5_monthly_wind.py --year 2000
```

Download only January to March:

```powershell
python automation\historical_wind\download_era5_monthly_wind.py --year 2000 --months 1-3
```

Print requests without downloading:

```powershell
python automation\historical_wind\download_era5_monthly_wind.py --year 2000 --dry-run
```

Import one full year into PostgreSQL after all 12 monthly files are present:

```powershell
python automation\historical_wind\import_era5_monthly_wind_to_db.py --year 2000 --db-host 121.194.93.61 --db-name ship_monitoring --db-user postgres --db-password <your_password>
```
