# TECH Ecommerce - setup on Windows. Run with CAI_DAT_LAN_DAU.bat.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$back = Join-Path $root 'backend'
$front = Join-Path $root 'frontend'
$envFile = Join-Path $back '.env'
$envExample = Join-Path $back '.env.example'

function Fail([string]$message) {
    Write-Host "`n[LOI] $message" -ForegroundColor Red
    exit 1
}
function Step([string]$message) {
    Write-Host "`n==> $message" -ForegroundColor Cyan
}
function Invoke-Npm([string]$directory, [string[]]$arguments) {
    Push-Location $directory
    try {
        & npm.cmd @arguments
        if ($LASTEXITCODE -ne 0) { Fail "Lenh npm $($arguments -join ' ') that bai trong $directory" }
    } finally { Pop-Location }
}
function Test-LocalMongo {
    $socket = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $socket.BeginConnect('127.0.0.1', 27017, $null, $null)
        if (-not $async.AsyncWaitHandle.WaitOne(1500)) { return $false }
        $socket.EndConnect($async)
        return $true
    } catch { return $false }
    finally { $socket.Dispose() }
}

Write-Host '========================================================='
Write-Host '        TECH | CAI DAT LAN DAU CHO DEMO WINDOWS'
Write-Host '========================================================='
if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) { Fail 'Chua cai Node.js. Hay cai Node.js 20+ va mo lai terminal.' }
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { Fail 'Khong tim thay npm.cmd. Hay cai lai Node.js 20+.' }
Step 'Kiem tra Node.js'
& node.exe --version
& npm.cmd --version

if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
    Write-Host 'Da tao backend/.env tu .env.example.' -ForegroundColor Green
}
$raw = Get-Content -LiteralPath $envFile -Raw -Encoding UTF8
$mongoMatch = [regex]::Match($raw, '(?m)^\s*MONGO_URI\s*=\s*([^\r\n]+)')
if (-not $mongoMatch.Success) {
    Fail 'Chua co MONGO_URI trong backend/.env. Xem docs/HUONG_DAN_MONGODB_COMPASS.md.'
}
$mongoUri = $mongoMatch.Groups[1].Value.Trim().Trim('"', "'")
if ($mongoUri -match '^mongodb://(?:127\.0\.0\.1|localhost)(?::27017)?(?:/|\?|$)') {
    if (-not (Test-LocalMongo)) {
        Write-Host ''
        Write-Host 'MONGO_URI dang tro toi MongoDB LOCAL (127.0.0.1:27017).' -ForegroundColor Yellow
        Write-Host 'Nhung khong co MongoDB Server dang lang nghe o cong 27017.' -ForegroundColor Yellow
        Write-Host 'MongoDB Compass CHI la giao dien, khong phai MongoDB Server.'
        Write-Host 'Chon mot trong cac cach:'
        Write-Host ' A. Cai MongoDB Community Server, chon Install as a Service.'
        Write-Host ' B. Mo Docker Desktop, chay: docker run -d --name tech-mongodb -p 27017:27017 mongo:7'
        Write-Host ' C. Dung MongoDB Atlas va thay MONGO_URI trong backend/.env.'
        Fail 'Hay khoi dong MongoDB hoac sua MONGO_URI, sau do chay lai CAI_DAT_LAN_DAU.bat.'
    }
    Write-Host 'Phat hien MongoDB Server local dang lang nghe cong 27017.' -ForegroundColor Green
} elseif ($mongoUri -like 'mongodb+srv://*' -or $mongoUri -like 'mongodb://*') {
    Write-Host 'Da phat hien ket noi MongoDB remote/Atlas trong .env. Se kiem tra khi seed.' -ForegroundColor Green
} else {
    Fail 'MONGO_URI khong dung dinh dang mongodb:// hoac mongodb+srv://.'
}

# Replace the shipped example secret, while preserving an existing custom value.
$secretPattern = '(?m)^\s*JWT_SECRET\s*=\s*(.*)$'
$hasSecret = [regex]::IsMatch($raw, $secretPattern)
$secret = if ($hasSecret) { [regex]::Match($raw, $secretPattern).Groups[1].Value.Trim() } else { '' }
if ($secret.Length -lt 32 -or $secret -match '^(replace_with_|CHANGE_ME|your_random_secret)') {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    $generated = [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
    if ($hasSecret) { $raw = [regex]::Replace($raw, $secretPattern, ('JWT_SECRET=' + $generated)) }
    else { $raw = $raw.TrimEnd() + "`r`nJWT_SECRET=$generated`r`n" }
    [System.IO.File]::WriteAllText($envFile, $raw, ([System.Text.UTF8Encoding]::new($false)))
    Write-Host 'Da tu sinh JWT_SECRET ngau nhien. Khong chia se backend/.env.' -ForegroundColor Green
}

Step 'Cai thu vien Backend'
Invoke-Npm $back @('install')
Step 'Cai thu vien Frontend'
Invoke-Npm $front @('install')
Step 'Nap du lieu demo vao MongoDB'
Invoke-Npm $back @('run', 'seed')
Step 'Kiem tra unit test backend'
Invoke-Npm $back @('test')

Write-Host "`n[THANH CONG] Cai dat va nap du lieu demo xong." -ForegroundColor Green
Write-Host 'Chay tiep CHAY_DEMO_TECH.bat de mo Frontend va Backend.'
Write-Host 'User: minhanh@tech.local  / TechUser@2026'
Write-Host 'Admin: admin@tech.local / TechAdmin@2026'
Write-Host 'Luu y: Tai khoan seed chi dung trong demo; khong public len internet.'
