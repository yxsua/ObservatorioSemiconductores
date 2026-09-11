param([switch]$RestoreDependencies)

$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$previousPrefix = $env:NPM_CONFIG_PREFIX
$previousUrl = $env:E2E_BASE_URL
$previousDataRun = $env:E2E_DATA_RUN_ID

function Invoke-Checked {
    param([string]$Program, [string[]]$Arguments)
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Program fallo con codigo $LASTEXITCODE" }
}

Push-Location $taskRoot
try {
    # Use the npm shipped with the selected Node installation, including nested scripts.
    $nodeDirectory = Split-Path (Get-Command node -CommandType Application | Select-Object -First 1).Source -Parent
    $npmCli = Join-Path $nodeDirectory 'node_modules/npm/bin/npm-cli.js'
    if (-not (Test-Path -LiteralPath $npmCli)) { throw 'La instalacion de Node debe incluir npm.' }
    $env:NPM_CONFIG_PREFIX = $nodeDirectory

    Push-Location (Join-Path $taskRoot 'client')
    try {
        if ($RestoreDependencies) {
            Invoke-Checked node @($npmCli, 'ci', '--no-audit', '--no-fund')
            Invoke-Checked node @('node_modules/@playwright/test/cli.js', 'install', 'chromium')
        }
        Invoke-Checked node @($npmCli, 'run', 'check')
    } finally { Pop-Location }

    $compose = @('compose', '-f', 'docker-compose.validation.yaml')
    Invoke-Checked docker ($compose + @('up', '-d', '--build', '--wait'))
    # Refresh upstream DNS after container recreation.
    Invoke-Checked docker ($compose + @('restart', 'nginx'))
    Invoke-Checked docker ($compose + @('exec', '-T', 'backend', 'node', '--test'))
    Invoke-Checked docker ($compose + @('exec', '-T', 'backend', 'node', 'scripts/alert-e2e.js'))
    Invoke-Checked docker ($compose + @('exec', '-T', 'backend', 'node', 'scripts/content-e2e.js'))
    Invoke-Checked docker ($compose + @('exec', '-T', 'backend', 'node', 'scripts/password-recovery-e2e.js'))
    $dataRunOutput = Invoke-Checked docker ($compose + @('exec', '-T', 'backend', 'node', 'scripts/observatory-e2e.js'))
    $dataRunOutput | Write-Output
    $env:E2E_DATA_RUN_ID = (($dataRunOutput -join "`n") | ConvertFrom-Json).fixtureRun
    foreach ($testFile in Get-ChildItem (Join-Path $taskRoot 'database/tests') -Filter '*.sql' | Sort-Object Name) {
        Invoke-Checked docker ($compose + @('exec', '-T', 'postgres', 'psql', '-U', 'validation', '-d', 'observatorio_validation', '-v', 'ON_ERROR_STOP=1', '-f', "/scripts/tests/$($testFile.Name)"))
    }

    $env:E2E_BASE_URL = 'http://127.0.0.1:18080'
    foreach ($route in @('/', '/contenido', '/dashboard', '/api/health')) {
        $response = Invoke-WebRequest -Uri ($env:E2E_BASE_URL + $route) -UseBasicParsing
        if ($response.StatusCode -ne 200) { throw "HTTP inesperado en $route" }
    }
    Push-Location (Join-Path $taskRoot 'client')
    try {
        Invoke-Checked node @('node_modules/@playwright/test/cli.js', 'test', '--workers=2')
        Invoke-Checked node @('scripts/check-observatory-live.mjs')
    } finally { Pop-Location }
    Write-Host 'Validacion completa. Entorno local: http://127.0.0.1:18080'
} finally {
    $env:NPM_CONFIG_PREFIX = $previousPrefix
    $env:E2E_BASE_URL = $previousUrl
    $env:E2E_DATA_RUN_ID = $previousDataRun
    Pop-Location
}
