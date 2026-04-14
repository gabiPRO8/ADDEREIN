Set-Location -Path $PSScriptRoot

Write-Host "=========================================="
Write-Host " ADDEREIN - Servidor local"
Write-Host " URL: http://localhost:8080"
Write-Host "=========================================="

$py = Get-Command py -ErrorAction SilentlyContinue
$python = Get-Command python -ErrorAction SilentlyContinue

if ($py) {
    Start-Process "http://localhost:8080"
    py -m http.server 8080
    exit
}

if ($python) {
    Start-Process "http://localhost:8080"
    python -m http.server 8080
    exit
}

Write-Host "No se encontro Python instalado."
Write-Host "Instala Python desde: https://www.python.org/downloads/"
Read-Host "Pulsa Enter para salir"
