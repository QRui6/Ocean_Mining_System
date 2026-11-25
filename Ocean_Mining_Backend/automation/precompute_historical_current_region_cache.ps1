param(
    [string]$ApiBase = "http://localhost:8082",
    [string]$DbHost = $env:DB_HOST,
    [int]$DbPort = 5432,
    [string]$DbName = $env:DB_NAME,
    [string]$DbUser = $env:DB_USER,
    [string]$DbPassword = $env:DB_PASSWORD,
    [Nullable[int]]$StartYear = $null,
    [Nullable[int]]$EndYear = $null,
    [string]$RegionIds = ""
)
$ErrorActionPreference = "Stop"
# Legacy database arguments remain accepted; ApiBase selects the backend and its database.
& "$PSScriptRoot/precompute_historical_points.ps1" -ApiBase $ApiBase -Dataset current -StartYear $StartYear -EndYear $EndYear -RegionsOnly -RegionIds $RegionIds
