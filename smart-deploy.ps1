# Smart Auto-Deploy System with Automatic Versioning
# Analyzes your changes and determines version bump automatically
# Usage: .\smart-deploy.ps1 -Message "Your commit message"

param(
    [Parameter(Mandatory=$false)]
    [string]$Message = "",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("major", "minor", "patch", "auto")]
    [string]$BumpType = "auto",
    
    [Parameter(Mandatory=$false)]
    [switch]$CreateRelease
)

Write-Host "`n🤖 Smart Auto-Deploy System`n" -ForegroundColor Cyan

# Function to determine version bump from commit message
function Get-VersionBump {
    param([string]$commitMessage)
    
    $message = $commitMessage.ToLower()
    
    # Check for breaking changes (MAJOR bump)
    if ($message -match "breaking|major|^breaking:|^major:") {
        return "major"
    }
    
    # Check for new features (MINOR bump)
    if ($message -match "^feat:|^feature:|add |new |implement ") {
        return "minor"
    }
    
    # Check for fixes/patches (PATCH bump)
    if ($message -match "^fix:|^bugfix:|^patch:|fix |bug |error |hotfix") {
        return "patch"
    }
    
    # Check for documentation/chores/refactor (PATCH bump)
    if ($message -match "^docs:|^chore:|^refactor:|^style:|^test:") {
        return "patch"
    }
    
    # Default to patch for any other changes
    return "patch"
}

# Function to bump version
function Get-NewVersion {
    param(
        [string]$currentVersion,
        [string]$bumpType
    )
    
    $parts = $currentVersion.Split('.')
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    $patch = [int]$parts[2]
    
    switch ($bumpType) {
        "major" {
            $major++
            $minor = 0
            $patch = 0
        }
        "minor" {
            $minor++
            $patch = 0
        }
        "patch" {
            $patch++
        }
    }
    
    return "$major.$minor.$patch"
}

# Function to clean old releases (keep last 5)
function Remove-OldReleases {
    Write-Host "`n🧹 Cleaning old releases (keeping last 5)..." -ForegroundColor Yellow
    
    try {
        # Get all releases
        $releases = gh release list --limit 100 --json tagName,createdAt | ConvertFrom-Json
        
        if ($releases.Count -le 5) {
            Write-Host "   ✅ Only $($releases.Count) releases exist, no cleanup needed" -ForegroundColor Green
            return
        }
        
        # Sort by date and get old ones (beyond the last 5)
        $oldReleases = $releases | Sort-Object -Property createdAt -Descending | Select-Object -Skip 5
        
        foreach ($release in $oldReleases) {
            Write-Host "   🗑️  Deleting old release: $($release.tagName)" -ForegroundColor Gray
            gh release delete $release.tagName --yes --cleanup-tag 2>$null
        }
        
        Write-Host "   ✅ Cleaned up $($oldReleases.Count) old release(s)" -ForegroundColor Green
    }
    catch {
        Write-Host "   ⚠️  Could not clean old releases: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Check for changes
Write-Host "📋 Step 1: Checking for changes..." -ForegroundColor Yellow
$status = git status --porcelain
if (-not $status) {
    Write-Host "   ⚠️  No changes to deploy" -ForegroundColor Yellow
    exit 0
}
Write-Host "   ✅ Found changes to deploy" -ForegroundColor Green

# Show what changed
Write-Host "`n📝 Changed files:" -ForegroundColor Cyan
git status --short | ForEach-Object { Write-Host "   $_" -ForegroundColor White }

# Get commit message if not provided
if ([string]::IsNullOrWhiteSpace($Message)) {
    Write-Host "`n💬 Enter a description of your changes:" -ForegroundColor Cyan
    Write-Host "   Examples:" -ForegroundColor Gray
    Write-Host "   - 'feat: Added budget charts'          → Minor version bump (new feature)" -ForegroundColor Gray
    Write-Host "   - 'fix: Fixed transaction calculation' → Patch version bump (bug fix)" -ForegroundColor Gray
    Write-Host "   - 'breaking: New database schema'      → Major version bump (breaking change)" -ForegroundColor Gray
    $Message = Read-Host "`n   Message"
    
    if ([string]::IsNullOrWhiteSpace($Message)) {
        $Message = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
}

# Determine version bump type
$currentVersion = (Get-Content package.json -Raw | ConvertFrom-Json).version
Write-Host "`n📊 Current version: $currentVersion" -ForegroundColor Cyan

if ($BumpType -eq "auto") {
    $BumpType = Get-VersionBump -commitMessage $Message
}

$newVersion = Get-NewVersion -currentVersion $currentVersion -bumpType $BumpType

Write-Host "🎯 Detected change type: " -NoNewline -ForegroundColor Cyan
switch ($BumpType) {
    "major" { Write-Host "MAJOR (Breaking Change) 💥" -ForegroundColor Red }
    "minor" { Write-Host "MINOR (New Feature) ✨" -ForegroundColor Yellow }
    "patch" { Write-Host "PATCH (Bug Fix/Update) 🔧" -ForegroundColor Green }
}
Write-Host "📈 New version: $newVersion" -ForegroundColor Cyan

# Ask for confirmation
Write-Host "`n❓ Deploy with version $newVersion? (Y/n): " -NoNewline -ForegroundColor Yellow
$confirm = Read-Host
if ($confirm -eq "n" -or $confirm -eq "no") {
    Write-Host "`n❌ Deployment cancelled" -ForegroundColor Red
    exit 0
}

# Update package.json version
Write-Host "`n📋 Step 2: Updating version in package.json..." -ForegroundColor Yellow
$packageJson = Get-Content package.json -Raw | ConvertFrom-Json
$packageJson.version = $newVersion
$packageJson | ConvertTo-Json -Depth 10 | Set-Content package.json
Write-Host "   ✅ Version updated: $currentVersion → $newVersion" -ForegroundColor Green

# Stage all changes
Write-Host "`n📋 Step 3: Staging all changes..." -ForegroundColor Yellow
git add .
Write-Host "   ✅ All changes staged" -ForegroundColor Green

# Commit changes
Write-Host "`n📋 Step 4: Committing changes..." -ForegroundColor Yellow
Write-Host "   Message: $Message" -ForegroundColor White
git commit -m "$Message"
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Commit failed" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Changes committed" -ForegroundColor Green

# Commit version bump
git add package.json
git commit -m "chore: bump version to $newVersion" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Version bump committed" -ForegroundColor Green
}

# Push to GitHub
Write-Host "`n📋 Step 5: Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Push failed" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Pushed to GitHub" -ForegroundColor Green

# Create release
if ($CreateRelease) {
    Write-Host "`n📋 Step 6: Creating Release v$newVersion..." -ForegroundColor Yellow
    
    # Create and push tag
    git tag "v$newVersion"
    git push origin "v$newVersion"
    
    Write-Host "   ✅ Release v$newVersion created!" -ForegroundColor Green
    Write-Host "`n🔄 GitHub Actions is building your release..." -ForegroundColor Cyan
    Write-Host "   View progress: https://github.com/kuntz09matthew/budget-tool/actions" -ForegroundColor White
    
    # Clean old releases (keep last 5)
    Remove-OldReleases
}

# Summary
Write-Host "`n✅ Deployment Complete! 🎉" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Deployed:" -ForegroundColor Cyan
Write-Host "   Version: $newVersion" -ForegroundColor White
Write-Host "   Type: $BumpType" -ForegroundColor White
Write-Host "   Message: $Message" -ForegroundColor White
Write-Host ""
Write-Host "🌐 View your repository:" -ForegroundColor Cyan
Write-Host "   https://github.com/kuntz09matthew/budget-tool" -ForegroundColor White

if ($CreateRelease) {
    Write-Host ""
    Write-Host "📦 Release will be available at:" -ForegroundColor Cyan
    Write-Host "   https://github.com/kuntz09matthew/budget-tool/releases/tag/v$newVersion" -ForegroundColor White
}

Write-Host ""
Write-Host "💡 Tip: Version bumping is automatic based on your commit message:" -ForegroundColor Gray
Write-Host "   • 'feat:' or 'add' → Minor bump (new features)" -ForegroundColor Gray
Write-Host "   • 'fix:' or 'bug' → Patch bump (bug fixes)" -ForegroundColor Gray
Write-Host "   • 'breaking:' or 'major:' → Major bump (breaking changes)" -ForegroundColor Gray
Write-Host ""
