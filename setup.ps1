# Budget Tool - Initial Setup Script
# Run this after updating package.json with your GitHub username

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername,
    
    [Parameter(Mandatory=$false)]
    [string]$RepoName = "budget-tool"
)

Write-Host "`n🚀 Budget Tool - GitHub Setup Script`n" -ForegroundColor Cyan

# Step 1: Verify Git is initialized
Write-Host "📋 Step 1: Checking Git repository..." -ForegroundColor Yellow
if (Test-Path .git) {
    Write-Host "   ✅ Git repository already initialized" -ForegroundColor Green
} else {
    Write-Host "   ❌ Git not initialized. Please run: git init" -ForegroundColor Red
    exit 1
}

# Step 2: Update package.json
Write-Host "`n📋 Step 2: Updating package.json..." -ForegroundColor Yellow
$packageJson = Get-Content package.json -Raw | ConvertFrom-Json
$packageJson.build.publish.owner = $GitHubUsername
$packageJson.build.publish.repo = $RepoName
$packageJson | ConvertTo-Json -Depth 10 | Set-Content package.json
Write-Host "   ✅ Updated package.json with GitHub info" -ForegroundColor Green

# Step 3: Install dependencies
Write-Host "`n📋 Step 3: Installing dependencies..." -ForegroundColor Yellow
if (Test-Path node_modules) {
    Write-Host "   ✅ Dependencies already installed" -ForegroundColor Green
} else {
    npm install
    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
}

# Step 4: Stage all files
Write-Host "`n📋 Step 4: Staging files for commit..." -ForegroundColor Yellow
git add .
Write-Host "   ✅ All files staged" -ForegroundColor Green

# Step 5: Create initial commit
Write-Host "`n📋 Step 5: Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit: Budget Tool with auto-updates"
Write-Host "   ✅ Initial commit created" -ForegroundColor Green

# Step 6: Add remote
Write-Host "`n📋 Step 6: Adding GitHub remote..." -ForegroundColor Yellow
$remoteUrl = "https://github.com/$GitHubUsername/$RepoName.git"
git remote add origin $remoteUrl
Write-Host "   ✅ Remote added: $remoteUrl" -ForegroundColor Green

# Step 7: Instructions for next steps
Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Create GitHub repository at: https://github.com/new" -ForegroundColor White
Write-Host "      - Repository name: $RepoName" -ForegroundColor White
Write-Host "      - Do NOT initialize with README" -ForegroundColor White
Write-Host ""
Write-Host "   2. After creating the repo, run:" -ForegroundColor White
Write-Host "      git branch -M main" -ForegroundColor Yellow
Write-Host "      git push -u origin main" -ForegroundColor Yellow
Write-Host ""
Write-Host "   3. Create your first release:" -ForegroundColor White
Write-Host "      git tag v1.0.0" -ForegroundColor Yellow
Write-Host "      git push origin v1.0.0" -ForegroundColor Yellow
Write-Host ""
Write-Host "   4. GitHub Actions will build automatically!" -ForegroundColor White
Write-Host ""
Write-Host "📚 For more help, read:" -ForegroundColor Cyan
Write-Host "   • QUICKSTART.md - Quick 5-minute guide" -ForegroundColor White
Write-Host "   • SETUP_GITHUB.md - Complete documentation" -ForegroundColor White
Write-Host "   • VISUAL_GUIDE.md - Visual system overview" -ForegroundColor White
Write-Host ""
Write-Host "✅ Setup complete! Good luck with your Budget Tool! 🎉`n" -ForegroundColor Green
