param(
    [string]$ConfigPath = (Join-Path $PSScriptRoot 'daily.local.ps1')
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$config = & $ConfigPath
foreach ($key in @('PythonExe', 'DbConfig', 'OutputDir', 'RawDir')) {
    if (-not $config.ContainsKey($key) -or [string]::IsNullOrWhiteSpace([string]$config[$key])) {
        throw "Missing HWS945 config: $key"
    }
}
foreach ($key in @('PythonExe', 'DbConfig')) {
    if (-not (Test-Path -LiteralPath $config[$key] -PathType Leaf)) { throw "Invalid HWS945 config path: $key" }
}
$arguments = @(
    (Join-Path $PSScriptRoot 'daily.py'), '--mode', 'import', '--latest', '--datasets', 'wind,wave', '--regional-subset',
    '--db-config', [string]$config['DbConfig'], '--output-dir', [string]$config['OutputDir'],
    '--raw-dir', [string]$config['RawDir']
)
if ($config.ContainsKey('SourceConfig') -and $config['SourceConfig']) {
    $arguments += @('--source-config', [string]$config['SourceConfig'])
}
if ($config.ContainsKey('NoProxy') -and $config['NoProxy']) { $arguments += '--no-proxy' }
if ($config.ContainsKey('LookbackDays')) { $arguments += @('--lookback-days', [string]$config['LookbackDays']) }
$logs = Join-Path ([string]$config['OutputDir']) 'logs'
New-Item -ItemType Directory -Path $logs -Force | Out-Null
$logPath = Join-Path $logs (Get-Date -Format 'yyyyMMdd_HHmmss.log')
# Python logs to stderr; native command stderr must not terminate a successful run in Windows PowerShell.
$previousPreference = $ErrorActionPreference
try {
    $ErrorActionPreference = 'Continue'
    & $config['PythonExe'] @arguments 2>&1 | Tee-Object -FilePath $logPath
    $pipelineExit = $LASTEXITCODE
} finally { $ErrorActionPreference = $previousPreference }
if ($pipelineExit -ne 0) { throw "HWS945 daily update failed (exit $pipelineExit). See $logPath" }
