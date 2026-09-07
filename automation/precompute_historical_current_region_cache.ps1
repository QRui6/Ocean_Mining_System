param(
    [string]$ApiBase = "http://localhost:8082",
    [string]$DbHost = "localhost",
    [int]$DbPort = 5432,
    [string]$DbName = "ship_monitoring",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "030525",
    [int]$StartYear = 2000,
    [int]$EndYear = 2026,
    [string]$RegionIds = ""
)

$ErrorActionPreference = "Stop"
$env:PGPASSWORD = $DbPassword

function Write-Stage {
    param([string]$Message)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$ts] $Message"
}

$regions = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName --csv -c "SELECT id, region_name, center_lat, center_lng FROM mining_regions ORDER BY id;" | ConvertFrom-Csv
if ($LASTEXITCODE -ne 0) {
    throw "Failed to load mining regions."
}

if (-not [string]::IsNullOrWhiteSpace($RegionIds)) {
    $regionIdSet = @{}
    foreach ($id in ($RegionIds -split ",")) {
        $trimmed = $id.Trim()
        if (-not [string]::IsNullOrWhiteSpace($trimmed)) {
            $regionIdSet[$trimmed] = $true
        }
    }
    $regions = $regions | Where-Object { $regionIdSet.ContainsKey([string]$_.id) }
}

$tmpDir = Join-Path $env:TEMP "ocean_mining_cache"
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

foreach ($region in $regions) {
    $regionId = $region.id
    $regionName = $region.region_name
    $lat = $region.center_lat
    $lon = $region.center_lng

    Write-Stage "Fetching historical current for region ${regionId} ${regionName} (${lat}, ${lon})."
    $url = "$ApiBase/api/historical-current/point-query?lat=$lat&lon=$lon&startYear=$StartYear&endYear=$EndYear"
    $response = Invoke-RestMethod -Uri $url -TimeoutSec 1800
    if (-not $response.success) {
        throw "Historical current query failed for region $regionId"
    }

    $csvPath = Join-Path $tmpDir "historical_current_region_cache_${regionId}.csv"
    $rows = foreach ($item in $response.data.items) {
        [pscustomobject]@{
            region_id = [int64]$regionId
            region_name = $regionName
            lat = [decimal]$lat
            lon = [decimal]$lon
            year = $item.year
            month = $item.month
            month_label = $item.monthLabel
            month_start = $item.monthStart
            data_time = $item.currentTime
            depth_m = $item.depthMeters
            u_value = if ($null -ne $item.current) { $item.current.u } else { $null }
            v_value = if ($null -ne $item.current) { $item.current.v } else { $null }
            speed_value = if ($null -ne $item.current) { $item.current.speed } else { $null }
            direction_value = if ($null -ne $item.current) { $item.current.direction } else { $null }
        }
    }
    $rows | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8

    Write-Stage "Refreshing cache rows for region ${regionId}."
    & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -c "DELETE FROM historical_current_region_cache WHERE region_id = $regionId;"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to delete cache rows for region $regionId."
    }

    $copySqlPath = Join-Path $tmpDir "historical_current_region_cache_${regionId}.sql"
    @"
\copy historical_current_region_cache(region_id, region_name, lat, lon, year, month, month_label, month_start, data_time, depth_m, u_value, v_value, speed_value, direction_value) FROM '$csvPath' WITH (FORMAT csv, HEADER true)
"@ | Set-Content -Path $copySqlPath -Encoding UTF8

    & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -f $copySqlPath
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to import cache rows for region $regionId."
    }
}

Write-Stage "Historical current region cache precompute finished."
