# TECH Ecommerce - start two dev servers in their own PowerShell windows.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$back = Join-Path $root 'backend'
$front = Join-Path $root 'frontend'

Write-Host '========================================================='
Write-Host '          TECH | KHOI DONG WEBSITE DEMO'
Write-Host '========================================================='
if (-not (Test-Path (Join-Path $back '.env'))) {
    Write-Host '[LOI] Thieu backend/.env. Hay chay CAI_DAT_LAN_DAU.bat truoc.' -ForegroundColor Red
    exit 1
}
if (-not (Test-Path (Join-Path $back 'node_modules')) -or -not (Test-Path (Join-Path $front 'node_modules'))) {
    Write-Host '[LOI] Chua cai dependencies. Hay chay CAI_DAT_LAN_DAU.bat truoc.' -ForegroundColor Red
    exit 1
}
function Test-Http([string]$url) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -TimeoutSec 2
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
    } catch { return $false }
}
if (-not (Test-Http 'http://localhost:5000/api/health')) {
    Write-Host 'Dang mo Backend trong terminal rieng...'
    Start-Process -FilePath 'powershell.exe' -WorkingDirectory $back -ArgumentList @('-NoLogo','-NoExit','-NoProfile','-Command','npm.cmd run dev') | Out-Null
} else {
    Write-Host 'Backend da chay tai http://localhost:5000' -ForegroundColor Green
}
$ready = $false
for ($i = 0; $i -lt 15; $i++) {
    if (Test-Http 'http://localhost:5000/api/health') { $ready = $true; break }
    Start-Sleep -Seconds 1
}
if (-not $ready) {
    Write-Host '[LOI] Backend chua san sang. Xem terminal Backend; kiem tra MONGO_URI va MongoDB Server.' -ForegroundColor Red
    exit 1
}
Write-Host 'Backend OK.' -ForegroundColor Green
if (-not (Test-Http 'http://localhost:5173/')) {
    Write-Host 'Dang mo Frontend trong terminal rieng...'
    Start-Process -FilePath 'powershell.exe' -WorkingDirectory $front -ArgumentList @('-NoLogo','-NoExit','-NoProfile','-Command','npm.cmd run dev') | Out-Null
} else {
    Write-Host 'Frontend da chay tai http://localhost:5173' -ForegroundColor Green
}
$ready = $false
for ($i = 0; $i -lt 15; $i++) {
    if (Test-Http 'http://localhost:5173/') { $ready = $true; break }
    Start-Sleep -Seconds 1
}
if (-not $ready) {
    Write-Host '[LOI] Frontend chua san sang. Xem terminal Frontend.' -ForegroundColor Red
    exit 1
}
Write-Host 'Frontend OK. Mo TECH...' -ForegroundColor Green
Start-Process 'http://localhost:5173/'
Write-Host 'Web:   http://localhost:5173/'
Write-Host 'Admin: http://localhost:5173/admin'
Write-Host 'API:   http://localhost:5000/api/health'
Write-Host 'Dung Ctrl+C trong tung terminal de tat website.'
