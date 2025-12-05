# Quick Deploy Script - No Parameters Required
# Just double-click this file or run: .\quick-deploy.ps1

Write-Host "`n🚀 Quick Deploy - Budget Tool`n" -ForegroundColor Cyan

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

# Ask for commit message
Write-Host "💬 Enter a brief description of your changes:" -ForegroundColor Cyan
Write-Host "   (or press Enter for automatic message)" -ForegroundColor Gray
$message = Read-Host "   Message"

if ([string]::IsNullOrWhiteSpace($message)) {
    $message = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

Write-Host ""
Write-Host "📤 Deploying with message: `"$message`"`n" -ForegroundColor Cyan

# Stage, commit, and push
git add .
git commit -m "$message"
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully deployed to GitHub! 🎉`n" -ForegroundColor Green
    Write-Host "🌐 View at: https://github.com/kuntz09matthew/budget-tool`n" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check the error messages above.`n" -ForegroundColor Red
}

Read-Host "Press Enter to exit"
