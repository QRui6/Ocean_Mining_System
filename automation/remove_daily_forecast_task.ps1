param(
    [string]$TaskName = "OceanMining-DailyForecastPipeline"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($null -eq $existingTask) {
    Write-Output "Scheduled task not found: $TaskName"
    exit 0
}

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Write-Output "Scheduled task removed: $TaskName"
