# Auto-Deploy Script for Budget Tool
# This script automates the entire deployment process
# Usage: .\deploy.ps1 -Message "Your commit message"
# Example: .\deploy.ps1 -Message "Added new budget feature"

param(
    [Parameter(Mandatory=$false)]
    [string]$Message = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')",
    
    [Parameter(Mandatory=$false)]
    [switch]$Release,
    
    [Parameter(Mandatory=$false)]
    [string]$Version
)

Write-Host "`n🚀 Budget Tool - Auto-Deploy System`n" -ForegroundColor Cyan

# Step 1: Check for uncommitted changes
Write-Host "📋 Step 1: Checking for changes..." -ForegroundColor Yellow
$status = git status --porcelain
if (-not $status) {
    Write-Host "   ⚠️  No changes to deploy" -ForegroundColor Yellow
    exit 0
}
Write-Host "   ✅ Found changes to deploy" -ForegroundColor Green

# Step 2: Stage all changes
Write-Host "`n📋 Step 2: Staging all changes..." -ForegroundColor Yellow
git add .
Write-Host "   ✅ All changes staged" -ForegroundColor Green

# Step 3: Commit changes
Write-Host "`n📋 Step 3: Committing changes..." -ForegroundColor Yellow
Write-Host "   Message: $Message" -ForegroundColor White
git commit -m "$Message"
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Commit failed" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Changes committed" -ForegroundColor Green

# Step 4: Push to GitHub
Write-Host "`n📋 Step 4: Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Push failed" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Pushed to GitHub" -ForegroundColor Green

# Step 5: Create release if requested
if ($Release) {
    if (-not $Version) {
        Write-Host "`n   ❌ -Release flag requires -Version parameter" -ForegroundColor Red
        Write-Host "   Example: .\deploy.ps1 -Message 'New feature' -Release -Version '1.1.0'" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "`n📋 Step 5: Creating Release v$Version..." -ForegroundColor Yellow
    
    # Update package.json version
    $packageJson = Get-Content package.json -Raw | ConvertFrom-Json
    $oldVersion = $packageJson.version
    $packageJson.version = $Version
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content package.json
    Write-Host "   ✅ Updated version: $oldVersion → $Version" -ForegroundColor Green
    
    # Commit version change
    git add package.json
    git commit -m "chore: bump version to $Version"
    git push origin main
    
    # Create and push tag
    git tag "v$Version"
    git push origin "v$Version"
    
    Write-Host "   ✅ Release v$Version created!" -ForegroundColor Green
    Write-Host "`n🔄 GitHub Actions is building your release..." -ForegroundColor Cyan
    Write-Host "   View progress: https://github.com/kuntz09matthew/budget-tool/actions" -ForegroundColor White
}

Write-Host "`n✅ Deployment Complete! 🎉" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 View your repository:" -ForegroundColor Cyan
Write-Host "   https://github.com/kuntz09matthew/budget-tool" -ForegroundColor White

if ($Release) {
    Write-Host ""
    Write-Host "📦 Release will be available at:" -ForegroundColor Cyan
    Write-Host "   https://github.com/kuntz09matthew/budget-tool/releases/tag/v$Version" -ForegroundColor White
}

Write-Host ""
