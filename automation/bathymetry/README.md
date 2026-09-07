# Bathymetry

Current scope:

- Import GEBCO GeoTIFF bathymetry tiles
- Only process mining regions and forecast sites whose region name contains `太平洋`
- Write static region depth summaries and site depth samples into PostgreSQL
- Reuse existing mining overview region/site APIs for display

Prerequisites:

```powershell
pip install rasterio shapely psycopg2-binary numpy
```

Recommended raw file location:

- `data/bathymetry/raw`

Suggested Pacific tile names:

- `gebco_2025_n0.0_s-90.0_w-180.0_e-90.0.tif`
- `gebco_2025_n90.0_s0.0_w-180.0_e-90.0.tif`
- `gebco_2025_n0.0_s-90.0_w90.0_e180.0.tif`
- `gebco_2025_n90.0_s0.0_w90.0_e180.0.tif`

Initialize schema:

```powershell
psql -h 121.194.93.61 -U postgres -d ship_monitoring -f database_bathymetry.sql
```

Dry run:

```powershell
python automation\bathymetry\import_pacific_bathymetry.py --dry-run --db-host 121.194.93.61 --db-name ship_monitoring --db-user postgres --db-password <your_password>
```

Import:

```powershell
python automation\bathymetry\import_pacific_bathymetry.py --db-host 121.194.93.61 --db-name ship_monitoring --db-user postgres --db-password <your_password>
```

Only import specific Pacific region ids:

```powershell
python automation\bathymetry\import_pacific_bathymetry.py --region-id 50 --region-id 51 --db-host 121.194.93.61 --db-name ship_monitoring --db-user postgres --db-password <your_password>
```
