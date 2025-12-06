# Script to download and setup embeddable Python for the app
# This creates a portable Python installation that can be bundled with the app

Write-Host "`n🐍 Setting up Python for Budget Tool`n" -ForegroundColor Cyan

$pythonVersion = "3.11.9"
$pythonUrl = "https://www.python.org/ftp/python/$pythonVersion/python-$pythonVersion-embed-amd64.zip"
$pythonDir = "python-embed"
$zipFile = "python-embed.zip"

# Create python-embed directory
if (Test-Path $pythonDir) {
    Write-Host "Removing old Python installation..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $pythonDir
}
New-Item -ItemType Directory -Path $pythonDir | Out-Null

# Download Python
Write-Host "Downloading Python $pythonVersion embeddable..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $pythonUrl -OutFile $zipFile
    Write-Host "✓ Downloaded successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to download Python: $_" -ForegroundColor Red
    exit 1
}

# Extract
Write-Host "Extracting Python..." -ForegroundColor Yellow
Expand-Archive -Path $zipFile -DestinationPath $pythonDir -Force
Remove-Item $zipFile
Write-Host "✓ Extracted successfully" -ForegroundColor Green

# Download get-pip.py
Write-Host "Downloading pip installer..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "https://bootstrap.pypa.io/get-pip.py" -OutFile "$pythonDir\get-pip.py"

# Enable site-packages by uncommenting import site
$pthFile = Get-ChildItem "$pythonDir\*._pth" | Select-Object -First 1
if ($pthFile) {
    $content = Get-Content $pthFile.FullName
    $content = $content -replace '#import site', 'import site'
    $content | Set-Content $pthFile.FullName
    Write-Host "✓ Enabled site-packages" -ForegroundColor Green
}

# Install pip
Write-Host "Installing pip..." -ForegroundColor Yellow
& "$pythonDir\python.exe" "$pythonDir\get-pip.py" --no-warn-script-location
Write-Host "✓ Pip installed" -ForegroundColor Green

# Install requirements
Write-Host "Installing Flask and dependencies..." -ForegroundColor Yellow
& "$pythonDir\python.exe" -m pip install flask flask-cors --no-warn-script-location
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Test
Write-Host "`nTesting Python installation..." -ForegroundColor Cyan
& "$pythonDir\python.exe" --version
& "$pythonDir\python.exe" -c "import flask; print('Flask version:', flask.__version__)"

Write-Host "`n✅ Python setup complete!" -ForegroundColor Green
Write-Host "Python is ready to be bundled with your app." -ForegroundColor White
Write-Host ""
