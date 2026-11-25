param(
    [string]$ConfigPath = (Join-Path $PSScriptRoot 'daily.local.ps1'),
    [string]$TaskName = 'OceanMining-HWS945-Wave',
    [string]$At = '08:30',
    [System.Management.Automation.PSCredential]$Credential
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$resolvedConfig = (Resolve-Path -LiteralPath $ConfigPath).Path
$config = & $resolvedConfig
foreach ($key in @('PythonExe', 'DbConfig')) {
    if (-not $config.ContainsKey($key) -or -not (Test-Path -LiteralPath $config[$key] -PathType Leaf)) {
        throw "Invalid config path: $key"
    }
}
$runner = Join-Path $PSScriptRoot 'run_daily.ps1'
$powershellExe = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$action = New-ScheduledTaskAction -Execute $powershellExe -Argument (
    '-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}" -ConfigPath "{1}"' -f $runner, $resolvedConfig
)
$trigger = New-ScheduledTaskTrigger -Daily -At ([datetime]::ParseExact($At, 'HH:mm', [cultureinfo]::InvariantCulture))
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew `
    -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 30) -ExecutionTimeLimit (New-TimeSpan -Hours 6)
$description = 'Attempt all six HWS945 wind/wave elements independently; skip unavailable elements and import available metrics. Logs/report.json record each element outcome.'
if ($Credential) {
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
        -Description $description -User $Credential.UserName -Password $Credential.GetNetworkCredential().Password -Force | Out-Null
} else {
    $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $principal = New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
        -Principal $principal -Description $description -Force | Out-Null
}
Write-Output "Installed $TaskName at $At in Windows timezone $((Get-TimeZone).Id). It has not been run now."
if (-not $Credential) { Write-Output 'This task runs while the current Windows user is logged in. Supply -Credential for unattended execution.' }
