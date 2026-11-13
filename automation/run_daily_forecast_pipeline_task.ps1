param(
    [string]$ConfigPath = (Join-Path $PSScriptRoot "daily_forecast_task.env.ps1")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ConfigPath)) {
    throw "Config file not found: $ConfigPath"
}

$config = & $ConfigPath
if ($null -eq $config) {
    throw "Config file did not return a hashtable: $ConfigPath"
}

$requiredKeys = @(
    "PythonExe",
    "DbHost",
    "DbPort",
    "DbName",
    "DbUser",
    "DbPassword"
)

foreach ($key in $requiredKeys) {
    if (-not $config.ContainsKey($key) -or [string]::IsNullOrWhiteSpace([string]$config[$key])) {
        throw "Missing required config value: $key"
    }
}

$pythonExe = [string]$config["PythonExe"]
if (-not (Test-Path -LiteralPath $pythonExe)) {
    throw "Python executable not found: $pythonExe"
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$pipelineScript = Join-Path $PSScriptRoot "run_daily_forecast_pipeline.py"
$logsDir = Join-Path $PSScriptRoot "logs"
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = Join-Path $logsDir ("daily_forecast_pipeline_{0}.log" -f $timestamp)

$arguments = @(
    $pipelineScript,
    "--db-host", [string]$config["DbHost"],
    "--db-port", [string]$config["DbPort"],
    "--db-name", [string]$config["DbName"],
    "--db-user", [string]$config["DbUser"],
    "--db-password", [string]$config["DbPassword"]
)

if ($config.ContainsKey("RunCycle") -and -not [string]::IsNullOrWhiteSpace([string]$config["RunCycle"])) {
    $arguments += @("--run-cycle", [string]$config["RunCycle"])
}

if ($config.ContainsKey("CleanupRaw") -and [bool]$config["CleanupRaw"]) {
    $arguments += "--cleanup-raw"
}

Push-Location $projectRoot
try {
    "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting daily forecast pipeline" | Tee-Object -FilePath $logFile
    & $pythonExe @arguments 2>&1 | Tee-Object -FilePath $logFile -Append
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        throw "Pipeline exited with code $exitCode. See log: $logFile"
    }
    "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Pipeline finished successfully" | Tee-Object -FilePath $logFile -Append
}
finally {
    Pop-Location
}
