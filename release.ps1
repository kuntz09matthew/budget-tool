# Quick Release Script
# Use this to create a new release quickly

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

Write-Host "`n🚀 Creating Release v$Version`n" -ForegroundColor Cyan

# Validate version format
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Host "❌ Invalid version format. Use: X.Y.Z (e.g., 1.2.0)" -ForegroundColor Red
    exit 1
}

# Step 1: Update package.json version
Write-Host "📋 Step 1: Updating version in package.json..." -ForegroundColor Yellow
$packageJson = Get-Content package.json -Raw | ConvertFrom-Json
$oldVersion = $packageJson.version
$packageJson.version = $Version
$packageJson | ConvertTo-Json -Depth 10 | Set-Content package.json
Write-Host "   ✅ Updated: $oldVersion → $Version" -ForegroundColor Green

# Step 2: Commit the version change
Write-Host "`n📋 Step 2: Committing version change..." -ForegroundColor Yellow
git add package.json
git commit -m "chore: bump version to $Version"
Write-Host "   ✅ Version committed" -ForegroundColor Green

# Step 3: Create tag
Write-Host "`n📋 Step 3: Creating version tag..." -ForegroundColor Yellow
git tag "v$Version"
Write-Host "   ✅ Tag created: v$Version" -ForegroundColor Green

# Step 4: Push everything
Write-Host "`n📋 Step 4: Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
git push origin "v$Version"
Write-Host "   ✅ Pushed to GitHub" -ForegroundColor Green

Write-Host "`n✅ Release v$Version created successfully! 🎉" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 GitHub Actions is now building your release..." -ForegroundColor Cyan
Write-Host "   Check progress at: https://github.com/YOUR-USERNAME/budget-tool/actions" -ForegroundColor White
Write-Host ""
Write-Host "📦 Once complete, your release will be available at:" -ForegroundColor Cyan
Write-Host "   https://github.com/YOUR-USERNAME/budget-tool/releases/tag/v$Version" -ForegroundColor White
Write-Host ""
