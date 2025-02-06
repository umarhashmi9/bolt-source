$Green = "`e[32m"
$Red = "`e[31m"
$Reset = "`e[0m"

function Log {
    param (
        [string]$Message,
        [string]$Color = $Reset
    )
    Write-Host "$Color$Message$Reset"
}

if (-not (Get-Command nvm -ErrorAction SilentlyContinue)) {
    Log "NVM não encontrado. Instalando NVM para Windows..." $Green
    Invoke-WebRequest -Uri "https://github.com/coreybutler/nvm-windows/releases/download/1.1.12/nvm-setup.exe" -OutFile "$env:TEMP\nvm-setup.exe"
    Start-Process "$env:TEMP\nvm-setup.exe" -Wait
    Remove-Item "$env:TEMP\nvm-setup.exe"
} else {
    Log "NVM já está instalado." $Green
}

$nvmList = nvm list | Select-String "18.18.0"
if (-not $nvmList) {
    Log "Instalando Node.js 18.18.0..." $Green
    nvm install 18.18.0
} else {
    Log "Node.js 18.18.0 já está instalado." $Green
}

nvm use 18.18.0
nvm alias default 18.18.0

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Log "Instalando pnpm globalmente..." $Green
    npm install -g pnpm
} else {
    Log "pnpm já está instalado." $Green
}

Log "Instalando dependências do projeto com pnpm..." $Green
pnpm install

Log "Iniciando o servidor de desenvolvimento..." $Green
pnpm run dev
