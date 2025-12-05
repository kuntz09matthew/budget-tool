# Quick Deploy Script - Now with Smart Versioning!
# Just double-click this file or run: .\quick-deploy.ps1

Write-Host "`n🤖 Smart Quick Deploy - Budget Tool`n" -ForegroundColor Cyan

# Check for changes
$status = git status --porcelain
if (-not $status) {
    Write-Host "✅ No changes to deploy - everything is up to date!`n" -ForegroundColor Green
    Read-Host "Press Enter to exit"
    exit 0
}

# Show what will be deployed
Write-Host "📝 Changes to deploy:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Get current version
$currentVersion = (Get-Content package.json -Raw | ConvertFrom-Json).version
Write-Host "📊 Current version: $currentVersion`n" -ForegroundColor Cyan

# Ask for commit message with examples
Write-Host "💬 Enter a description of your changes:" -ForegroundColor Cyan
Write-Host "   Examples:" -ForegroundColor Gray
Write-Host "   - 'feat: Added budget charts'          → Minor version bump" -ForegroundColor Gray
Write-Host "   - 'fix: Fixed calculation bug'         → Patch version bump" -ForegroundColor Gray
Write-Host "   - 'breaking: Changed database schema'  → Major version bump" -ForegroundColor Gray
Write-Host "   (or press Enter for automatic message)" -ForegroundColor Gray
$message = Read-Host "`n   Message"

if ([string]::IsNullOrWhiteSpace($message)) {
    $message = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

# Ask if this should create a release
Write-Host "`n❓ Create a release (build installer)? (y/N): " -NoNewline -ForegroundColor Yellow
$createRelease = Read-Host

$releaseFlag = if ($createRelease -eq "y" -or $createRelease -eq "yes") { "-CreateRelease" } else { "" }

Write-Host ""
Write-Host "📤 Deploying...`n" -ForegroundColor Cyan

# Call the smart deploy script
if ($releaseFlag) {
    & ".\smart-deploy.ps1" -Message $message -CreateRelease
} else {
    & ".\smart-deploy.ps1" -Message $message
}

Write-Host ""
Read-Host "Press Enter to exit"
