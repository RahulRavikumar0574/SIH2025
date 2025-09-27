# PowerShell script to run the ML FastAPI backend
param(
  [int]$Port = 8504
)

$ErrorActionPreference = "Stop"

# Activate venv if exists
$venv = Join-Path $PSScriptRoot ".venv\Scripts\Activate.ps1"
if (Test-Path $venv) {
  Write-Host "Activating virtual environment..."
  . $venv
}

Write-Host "Starting FastAPI on port $Port..." -ForegroundColor Green
uvicorn backend_app:app --host 0.0.0.0 --port $Port --reload
