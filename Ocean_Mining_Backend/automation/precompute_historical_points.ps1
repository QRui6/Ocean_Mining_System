param(
    [string]$ApiBase = 'http://localhost:8082',
    [ValidateSet('wind','wave','current')][string]$Dataset = 'current',
    [string]$RegionIds = '',
    [string]$SiteIds = '',
    [Nullable[int]]$StartYear = $null,
    [Nullable[int]]$EndYear = $null,
    [switch]$RegionsOnly,
    [switch]$SitesOnly
)
$ErrorActionPreference = 'Stop'
if ($RegionsOnly -and $SitesOnly) { throw 'Choose RegionsOnly or SitesOnly.' }
$ApiBase = $ApiBase.TrimEnd('/')
# The backend validates source revisions and publishes complete caches atomically.
# This script never deletes cache rows or copies responses into unversioned tables.
$null = Invoke-RestMethod "$ApiBase/api/historical-sea-state/versions" -TimeoutSec 15
$regions = @((Invoke-RestMethod "$ApiBase/api/mining-overview/regions" -TimeoutSec 30).data)
$regionFilter = @($RegionIds.Split(',') | Where-Object { $_.Trim() } | ForEach-Object { [long]$_.Trim() })
$siteFilter = @($SiteIds.Split(',') | Where-Object { $_.Trim() } | ForEach-Object { [long]$_.Trim() })
$targets = @()
foreach ($region in $regions) {
    if ($regionFilter.Count -and [long]$region.id -notin $regionFilter) { continue }
    if (-not $SitesOnly -and (-not $regionFilter.Count -or [long]$region.id -in $regionFilter)) {
        $targets += [pscustomobject]@{ Name=$region.regionName; Lat=$region.centerLat; Lon=$region.centerLng }
    }
    if (-not $RegionsOnly) {
        $sites = @((Invoke-RestMethod "$ApiBase/api/mining-overview/sites?regionId=$($region.id)" -TimeoutSec 30).data)
        foreach ($site in $sites) {
            if (-not $siteFilter.Count -or [long]$site.id -in $siteFilter) {
                $targets += [pscustomobject]@{ Name=$site.siteName; Lat=$site.lat; Lon=$site.lng }
            }
        }
    }
}
foreach ($target in $targets) {
    if ($null -eq $target.Lat -or $null -eq $target.Lon) { continue }
    $lat = [Convert]::ToString($target.Lat,[Globalization.CultureInfo]::InvariantCulture)
    $lon = [Convert]::ToString($target.Lon,[Globalization.CultureInfo]::InvariantCulture)
    $url = "$ApiBase/api/historical-$Dataset/point-query?lat=$lat&lon=$lon"
    if ($null -ne $StartYear) { $url += "&startYear=$StartYear" }
    if ($null -ne $EndYear) { $url += "&endYear=$EndYear" }
    $watch = [Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-RestMethod $url -TimeoutSec 240
    if (-not $response.success -or -not $response.data.dataVersion -or $response.data.total -ne @($response.data.items).Count) {
        throw "Historical query was incomplete: $($target.Name)"
    }
    [pscustomobject]@{ Dataset=$Dataset; Name=$target.Name; Months=$response.data.total; Version=$response.data.dataVersion; Seconds=[math]::Round($watch.Elapsed.TotalSeconds,3) }
}
