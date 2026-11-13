param(
    [string]$TaskName = "OceanMining-DailyForecastPipeline"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Warning "Automatic scheduling has been disabled for the daily forecast pipeline."
Write-Output "Manual run:"
Write-Output "powershell -NoProfile -ExecutionPolicy Bypass -File automation\\run_daily_forecast_pipeline_task.ps1"

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Write-Output ""
    Write-Output "An existing scheduled task was found: $TaskName"
    Write-Output "Remove it with:"
    Write-Output "powershell -NoProfile -ExecutionPolicy Bypass -File automation\\remove_daily_forecast_task.ps1 -TaskName $TaskName"
}
