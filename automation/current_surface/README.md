# Surface Current

This module is separate from the existing wind/wave downloader because the
source system is different.

Current scope:

- Download Copernicus Marine global surface current forecasts
- Keep only the surface layer
- Down-sample hourly data to 3-hour steps
- Normalize the output into project-standard raw files:
  - `data/raw/YYYY/MM/DD/curu_YYYYMMDD_t08.nc`
  - `data/raw/YYYY/MM/DD/curv_YYYYMMDD_t08.nc`
- Reuse the existing register and current-processing scripts downstream

Official source:

- Product: `GLOBAL_ANALYSISFORECAST_PHY_001_024`
- Dataset: `cmems_mod_glo_phy_anfc_0.083deg_PT1H-m`
- Variables used: `uo`, `vo`

Optional local credentials file:

```text
automation/current_surface/copernicusmarine.local.json
```

Example:

```json
{
  "username": "your_copernicus_username",
  "password": "your_copernicus_password"
}
```

Dry run:

```powershell
python automation\current_surface\download_surface_current.py --dry-run
```

Download and normalize one batch:

```powershell
python automation\current_surface\download_surface_current.py --date 2026-06-09 --run-cycle t08
```

Use an already downloaded source file for normalization only:

```powershell
python automation\current_surface\download_surface_current.py --date 2026-06-03 --run-cycle t00 --source-file C:\path\to\uv_20260603_h0000_t000.nc
```

Run the full current pipeline into PostgreSQL:

```powershell
python automation\run_surface_current_pipeline.py --date 2026-06-09 --run-cycle t08 --db-host 121.194.93.61 --db-name ship_monitoring --db-user postgres --db-password <your_password>
```
