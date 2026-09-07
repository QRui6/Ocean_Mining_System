param(
    [string]$RemoteHost = "121.194.93.61",
    [int]$RemotePort = 5432,
    [string]$RemoteDatabase = "ship_monitoring",
    [string]$RemoteUser = "postgres",
    [string]$RemotePassword,
    [string]$LocalHost = "localhost",
    [int]$LocalPort = 5432,
    [string]$LocalDatabase = "ship_monitoring",
    [string]$LocalUser = "postgres",
    [string]$LocalPassword,
    [string]$PgBin = "D:\postgresql\bin",
    [string]$TempDumpPath = "",
    [switch]$KeepTempDump
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($RemotePassword)) {
    throw "RemotePassword is required."
}
if ([string]::IsNullOrWhiteSpace($LocalPassword)) {
    throw "LocalPassword is required."
}

$psql = Join-Path $PgBin "psql.exe"
$pgDump = Join-Path $PgBin "pg_dump.exe"
$pgRestore = Join-Path $PgBin "pg_restore.exe"

if (-not (Test-Path $psql)) {
    throw "psql.exe not found: $psql"
}
if (-not (Test-Path $pgDump)) {
    throw "pg_dump.exe not found: $pgDump"
}
if (-not (Test-Path $pgRestore)) {
    throw "pg_restore.exe not found: $pgRestore"
}

function Write-Stage {
    param([string]$Message)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$ts] $Message"
}

$localAdminUri = "postgresql://${LocalUser}:${LocalPassword}@${LocalHost}:${LocalPort}/postgres"
$localTargetUri = "postgresql://${LocalUser}:${LocalPassword}@${LocalHost}:${LocalPort}/${LocalDatabase}"
$remoteUri = "postgresql://${RemoteUser}:${RemotePassword}@${RemoteHost}:${RemotePort}/${RemoteDatabase}"

if ([string]::IsNullOrWhiteSpace($TempDumpPath)) {
    $dumpDir = Join-Path $PSScriptRoot "tmp"
    New-Item -ItemType Directory -Path $dumpDir -Force | Out-Null
    $TempDumpPath = Join-Path $dumpDir "ship_monitoring_remote_restore.dump"
}

Write-Stage "Terminating local connections to ${LocalDatabase}."
& $psql -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${LocalDatabase}' AND pid <> pg_backend_pid();" $localAdminUri
if ($LASTEXITCODE -ne 0) {
    throw "Failed to terminate local connections."
}

Write-Stage "Dropping local database ${LocalDatabase}."
& $psql -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${LocalDatabase};" $localAdminUri
if ($LASTEXITCODE -ne 0) {
    throw "Failed to drop local database."
}

Write-Stage "Creating local database ${LocalDatabase}."
& $psql -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${LocalDatabase} WITH ENCODING 'UTF8' TEMPLATE template0;" $localAdminUri
if ($LASTEXITCODE -ne 0) {
    throw "Failed to create local database."
}

if (Test-Path $TempDumpPath) {
    Remove-Item -LiteralPath $TempDumpPath -Force
}

Write-Stage "Dumping remote database to temporary file ${TempDumpPath}."
$dumpArgs = @(
    "-Fc",
    "-v",
    "--no-password",
    "-f",
    $TempDumpPath,
    $remoteUri
)

& $pgDump @dumpArgs
if ($LASTEXITCODE -ne 0) {
    throw "Remote pg_dump failed."
}

Write-Stage "Restoring temporary dump into local database."
$restoreArgs = @(
    "-v",
    "--no-password",
    "-d",
    $localTargetUri,
    $TempDumpPath
)

& $pgRestore @restoreArgs
if ($LASTEXITCODE -ne 0) {
    throw "Local pg_restore failed."
}

if (-not $KeepTempDump -and (Test-Path $TempDumpPath)) {
    Write-Stage "Removing temporary dump file."
    Remove-Item -LiteralPath $TempDumpPath -Force
}

Write-Stage "Restore completed."
& $psql -v ON_ERROR_STOP=1 -c "SELECT pg_size_pretty(pg_database_size(current_database())) AS local_db_size;" $localTargetUri
