param(
    [string]$ApiBase = "http://localhost:8082",
    [string]$DbHost = "localhost",
    [int]$DbPort = 5432,
    [string]$DbName = "ship_monitoring",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "030525",
    [int]$StartYear = 2000,
    [int]$EndYear = 2026,
    [string]$SiteIds = ""
)

$ErrorActionPreference = "Stop"
$env:PGPASSWORD = $DbPassword

function Write-Stage {
    param([string]$Message)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$ts] $Message"
}

$sites = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName --csv -c "SELECT id, region_id, site_code, site_name, lat, lng FROM forecast_sites WHERE is_active = true ORDER BY id;" | ConvertFrom-Csv
if ($LASTEXITCODE -ne 0) {
    throw "Failed to load active forecast sites."
}

if (-not [string]::IsNullOrWhiteSpace($SiteIds)) {
    $siteIdSet = @{}
    foreach ($id in ($SiteIds -split ",")) {
        $trimmed = $id.Trim()
        if (-not [string]::IsNullOrWhiteSpace($trimmed)) {
            $siteIdSet[$trimmed] = $true
        }
    }
    $sites = $sites | Where-Object { $siteIdSet.ContainsKey([string]$_.id) }
}

$tmpDir = Join-Path $env:TEMP "ocean_mining_cache"
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

foreach ($site in $sites) {
    $siteId = [int64]$site.id
    $regionId = [int64]$site.region_id
    $siteCode = $site.site_code
    $siteName = $site.site_name
    $lat = [decimal]$site.lat
    $lon = [decimal]$site.lng

    Write-Stage "Refreshing historical current site cache for ${siteId} ${siteCode} (${lat}, ${lon})."
    $url = "$ApiBase/api/historical-current/point-query?lat=$lat&lon=$lon&startYear=$StartYear&endYear=$EndYear"
    $response = Invoke-RestMethod -Uri $url -TimeoutSec 1800
    if (-not $response.success) {
        throw "Historical current query failed for site $siteId"
    }

    $csvPath = Join-Path $tmpDir "historical_current_site_cache_${siteId}.csv"
    $rows = foreach ($item in $response.data.items) {
        [pscustomobject]@{
            site_id = $siteId
            site_code = $siteCode
            site_name = $siteName
            region_id = $regionId
            lat = $lat
            lon = $lon
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

    & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -c "DELETE FROM historical_current_site_cache WHERE site_id = $siteId;"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to delete cache rows for site $siteId."
    }

    $copySqlPath = Join-Path $tmpDir "historical_current_site_cache_${siteId}.sql"
    @"
\copy historical_current_site_cache(site_id, site_code, site_name, region_id, lat, lon, year, month, month_label, month_start, data_time, depth_m, u_value, v_value, speed_value, direction_value) FROM '$csvPath' WITH (FORMAT csv, HEADER true)
"@ | Set-Content -Path $copySqlPath -Encoding UTF8

    & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -f $copySqlPath
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to import cache rows for site $siteId."
    }
}

Write-Stage "Historical current site cache precompute finished."
