# Start Apache Airflow using Docker Compose
# This script makes it easy to start Airflow on Windows

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host "Starting Apache Airflow with Docker" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Yellow
$env:AIRFLOW_UID = 50000
Write-Host "✓ AIRFLOW_UID set to 50000" -ForegroundColor Green

Write-Host ""

# Start Airflow
Write-Host "Starting Airflow services..." -ForegroundColor Yellow
Write-Host "(This may take 2-3 minutes on first run)" -ForegroundColor Cyan
Write-Host ""

docker-compose up -d

Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host "Airflow Started Successfully!" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host ""
Write-Host "Access Airflow UI at: " -NoNewline -ForegroundColor Yellow
Write-Host "http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "Login credentials:" -ForegroundColor Yellow
Write-Host "  Username: " -NoNewline
Write-Host "admin" -ForegroundColor Cyan
Write-Host "  Password: " -NoNewline
Write-Host "admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs:    " -NoNewline
Write-Host "docker-compose logs -f" -ForegroundColor Cyan
Write-Host "  Stop Airflow: " -NoNewline
Write-Host "docker-compose down" -ForegroundColor Cyan
Write-Host "  Restart:      " -NoNewline
Write-Host "docker-compose restart" -ForegroundColor Cyan
Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
