param(
    [string]$ApiBase = "http://localhost:8082",
    [string]$DbHost = "localhost",
    [int]$DbPort = 5432,
    [string]$DbName = "ship_monitoring",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "030525",
    [int]$StartYear = 2000,
    [int]$EndYear = 2026,
    [string]$RegionIds = "",
    [string]$SiteIds = ""
)

$ErrorActionPreference = "Stop"
$env:PGPASSWORD = $DbPassword

function Write-Stage {
    param([string]$Message)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$ts] $Message"
}

function Refresh-WaveCache {
    param(
        [string]$Url,
        [string]$DeleteSql,
        [string]$CopyTarget,
        [string]$CsvPath,
        [scriptblock]$RowMapper
    )

    $response = Invoke-RestMethod -Uri $Url -TimeoutSec 1800
    if (-not $response.success) {
        throw "Historical wave query failed: $Url"
    }

    $rows = foreach ($item in $response.data.items) {
        & $RowMapper $item
    }
    $rows | Export-Csv -Path $CsvPath -NoTypeInformation -Encoding UTF8

    & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -c $DeleteSql
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to delete old cache rows."
    }

    $copySqlPath = [System.IO.Path]::ChangeExtension($CsvPath, ".sql")
    @"
\copy $CopyTarget FROM '$CsvPath' WITH (FORMAT csv, HEADER true)
"@ | Set-Content -Path $copySqlPath -Encoding UTF8

    & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -f $copySqlPath
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to import wave cache rows."
    }
}

$tmpDir = Join-Path $env:TEMP "ocean_mining_cache"
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

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

foreach ($region in $regions) {
    $regionId = [int64]$region.id
    $regionName = $region.region_name
    $lat = [decimal]$region.center_lat
    $lon = [decimal]$region.center_lng
    $url = "$ApiBase/api/historical-wave/point-query?lat=$lat&lon=$lon&startYear=$StartYear&endYear=$EndYear"
    $csvPath = Join-Path $tmpDir "historical_wave_region_cache_${regionId}.csv"

    Write-Stage "Refreshing historical wave region cache for ${regionId} ${regionName}."
    Refresh-WaveCache `
        -Url $url `
        -DeleteSql "DELETE FROM historical_wave_region_cache WHERE region_id = $regionId;" `
        -CopyTarget "historical_wave_region_cache(region_id, region_name, lat, lon, year, month, month_label, month_start, wave_time, wave_valid_time, wave_step_hours, swh_value, mwp_value, mwd_value)" `
        -CsvPath $csvPath `
        -RowMapper {
            param($item)
            [pscustomobject]@{
                region_id = $regionId
                region_name = $regionName
                lat = $lat
                lon = $lon
                year = $item.year
                month = $item.month
                month_label = $item.monthLabel
                month_start = $item.monthStart
                wave_time = $item.waveTime
                wave_valid_time = $item.waveValidTime
                wave_step_hours = $item.waveStepHours
                swh_value = if ($null -ne $item.wave) { $item.wave.height } else { $null }
                mwp_value = if ($null -ne $item.wave) { $item.wave.period } else { $null }
                mwd_value = if ($null -ne $item.wave) { $item.wave.direction } else { $null }
            }
        }
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

foreach ($site in $sites) {
    $siteId = [int64]$site.id
    $regionId = [int64]$site.region_id
    $siteCode = $site.site_code
    $siteName = $site.site_name
    $lat = [decimal]$site.lat
    $lon = [decimal]$site.lng
    $url = "$ApiBase/api/historical-wave/point-query?lat=$lat&lon=$lon&startYear=$StartYear&endYear=$EndYear"
    $csvPath = Join-Path $tmpDir "historical_wave_site_cache_${siteId}.csv"

    Write-Stage "Refreshing historical wave site cache for ${siteId} ${siteCode}."
    Refresh-WaveCache `
        -Url $url `
        -DeleteSql "DELETE FROM historical_wave_site_cache WHERE site_id = $siteId;" `
        -CopyTarget "historical_wave_site_cache(site_id, site_code, site_name, region_id, lat, lon, year, month, month_label, month_start, wave_time, wave_valid_time, wave_step_hours, swh_value, mwp_value, mwd_value)" `
        -CsvPath $csvPath `
        -RowMapper {
            param($item)
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
                wave_time = $item.waveTime
                wave_valid_time = $item.waveValidTime
                wave_step_hours = $item.waveStepHours
                swh_value = if ($null -ne $item.wave) { $item.wave.height } else { $null }
                mwp_value = if ($null -ne $item.wave) { $item.wave.period } else { $null }
                mwd_value = if ($null -ne $item.wave) { $item.wave.direction } else { $null }
            }
        }
}

Write-Stage "Historical wave point cache precompute finished."
