# Ultra-Smart Deploy with AI-Powered Change Detection
# Automatically analyzes git changes and generates human-readable descriptions
#
# SEMANTIC VERSIONING (X.Y.Z):
# - MAJOR (X.0.0) = Breaking changes, incompatible API changes
#   Examples: "breaking: removed legacy API", "major change to data structure"
# 
# - MINOR (0.Y.0) = New features, added functionality (backwards compatible)
#   Examples: "feat: add expense charts", "add new budget categories", "implement export feature"
# 
# - PATCH (0.0.Z) = Bug fixes, improvements, updates (no new features)
#   Examples: "fix: calculation error", "improve UI performance", "update dependencies"
#
# HOW TO USE:
# - Use "feat:" or "add new" in your message for new features → bumps MINOR version
# - Use "fix:" or "bug:" in your message for bug fixes → bumps PATCH version
# - Use "breaking:" for breaking changes → bumps MAJOR version
# - Leave message blank for auto-detection based on file changes

param(
    [Parameter(Mandatory=$false)]
    [string]$Message = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$CreateRelease,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipVersionBump
)

Write-Host "`n🧠 Ultra-Smart Auto-Deploy System`n" -ForegroundColor Cyan

# Function to analyze git diff and generate description
function Get-ChangeDescription {
    param([string]$diff)
    
    $changes = @{
        'features' = @()
        'fixes' = @()
        'improvements' = @()
        'breaking' = @()
        'other' = @()
    }
    
    # Analyze changed files
    $changedFiles = git diff --name-status HEAD~1 2>$null
    if (-not $changedFiles) {
        $changedFiles = git diff --name-status --cached
    }
    
    foreach ($line in $changedFiles -split "`n") {
        if (-not $line) { continue }
        
        $parts = $line -split "`t"
        $status = $parts[0]
        $file = $parts[1]
        
        # Determine change type based on file and status
        $fileName = [System.IO.Path]::GetFileName($file)
        $extension = [System.IO.Path]::GetExtension($file)
        
        switch ($status) {
            'A' {  # Added
                if ($file -match 'test') {
                    $changes['other'] += "Added tests for $fileName"
                }
                elseif ($extension -match '\.(js|py|ts|jsx|tsx)$') {
                    $changes['features'] += "Added new module: $fileName"
                }
                elseif ($extension -match '\.(html|css)$') {
                    $changes['features'] += "Added new UI component: $fileName"
                }
                else {
                    $changes['other'] += "Added new file: $fileName"
                }
            }
            'M' {  # Modified
                # Check for feature-related changes first
                if ($file -match 'feature|feat') {
                    $changes['features'] += "Enhanced features in $fileName"
                }
                elseif ($file -match 'bug|fix') {
                    $changes['fixes'] += "Fixed issues in $fileName"
                }
                # Backend/API changes could be features if substantial
                elseif ($file -match 'server|backend|api') {
                    # Default to improvement, but message can override
                    $changes['improvements'] += "Updated backend functionality in $fileName"
                }
                # Frontend changes could be features if substantial
                elseif ($file -match 'frontend|ui|component') {
                    # Default to improvement, but message can override
                    $changes['improvements'] += "Enhanced user interface in $fileName"
                }
                elseif ($fileName -eq 'package.json') {
                    $changes['other'] += "Updated dependencies"
                }
                elseif ($extension -match '\.(md|txt)$') {
                    $changes['other'] += "Updated documentation: $fileName"
                }
                else {
                    $changes['improvements'] += "Modified $fileName"
                }
            }
            'D' {  # Deleted
                $changes['other'] += "Removed $fileName"
            }
            'R*' {  # Renamed
                $changes['other'] += "Renamed $fileName"
            }
        }
    }
    
    # Analyze commit message for additional context
    if ($Message) {
        $msgLower = $Message.ToLower()
        
        # Check for FEATURES first (most important for version bumping)
        if ($msgLower -match '^feat:|^feature:|add |new |implement |create ') {
            # Generic feature detection
            $changes['features'] += "Added new functionality"
            
            # Specific feature types
            if ($msgLower -match 'chart|graph|visual|dashboard') {
                $changes['features'] += "Added data visualization features"
            }
            if ($msgLower -match 'export|import|csv|data') {
                $changes['features'] += "Added data import/export capabilities"
            }
            if ($msgLower -match 'budget|transaction|category|account') {
                $changes['features'] += "Added new budgeting features"
            }
            if ($msgLower -match 'report|analysis|insight') {
                $changes['features'] += "Added reporting and analysis features"
            }
            if ($msgLower -match 'notification|alert|reminder') {
                $changes['features'] += "Added notification system"
            }
        }
        # Check for FIXES (patch version)
        elseif ($msgLower -match '^fix:|^bug:|fix |bug |error |issue |problem ') {
            if ($msgLower -match 'calculation|compute|math') {
                $changes['fixes'] += "Fixed calculation errors"
            }
            elseif ($msgLower -match 'display|show|render|ui') {
                $changes['fixes'] += "Fixed display issues"
            }
            elseif ($msgLower -match 'crash|error|exception') {
                $changes['fixes'] += "Fixed application crashes"
            }
            elseif ($msgLower -match 'data|save|load|persist') {
                $changes['fixes'] += "Fixed data handling issues"
            }
            else {
                $changes['fixes'] += "Fixed bugs and issues"
            }
        }
        # Check for IMPROVEMENTS (patch version)
        elseif ($msgLower -match 'improve|enhance|better|optimize|update|refactor') {
            if ($msgLower -match 'performance|speed|fast') {
                $changes['improvements'] += "Improved application performance"
            }
            elseif ($msgLower -match 'ui|interface|design|style') {
                $changes['improvements'] += "Enhanced user interface design"
            }
            elseif ($msgLower -match 'code|structure|architecture') {
                $changes['improvements'] += "Improved code quality"
            }
            else {
                $changes['improvements'] += "General improvements"
            }
        }
        
        # Check for BREAKING CHANGES (major version)
        if ($msgLower -match 'breaking|major change|incompatible|migration') {
            $changes['breaking'] += "Made breaking changes requiring user action"
        }
    }
    
    return $changes
}

# Function to generate human-readable summary
function Get-ChangeSummary {
    param($changes)
    
    $summary = @()
    
    if ($changes['features'].Count -gt 0) {
        $summary += "New: " + ($changes['features'] -join ', ')
    }
    if ($changes['fixes'].Count -gt 0) {
        $summary += "Fixed: " + ($changes['fixes'] -join ', ')
    }
    if ($changes['improvements'].Count -gt 0) {
        $summary += "Improved: " + ($changes['improvements'] -join ', ')
    }
    if ($changes['breaking'].Count -gt 0) {
        $summary += "⚠️ Breaking: " + ($changes['breaking'] -join ', ')
    }
    
    if ($summary.Count -eq 0) {
        return "General updates and maintenance"
    }
    
    return $summary -join '. '
}

# Function to determine version bump
function Get-VersionBump {
    param($changes, [string]$message)
    
    $msgLower = $message.ToLower()
    
    # MAJOR version (1.x.x) - Breaking changes
    if ($changes['breaking'].Count -gt 0) {
        return "major"
    }
    if ($msgLower -match '^breaking:|breaking change|major change|incompatible|migration required') {
        return "major"
    }
    
    # MINOR version (x.1.x) - New features, added functionality
    if ($changes['features'].Count -gt 0) {
        return "minor"
    }
    if ($msgLower -match '^feat:|^feature:|add new |new feature|implement new|create new') {
        return "minor"
    }
    # Added files in key directories suggest new features
    if ($msgLower -match 'add.*component|add.*page|add.*module|add.*functionality') {
        return "minor"
    }
    
    # PATCH version (x.x.1) - Bug fixes, improvements, updates
    # Explicit fixes
    if ($changes['fixes'].Count -gt 0) {
        return "patch"
    }
    if ($msgLower -match '^fix:|^bug:|fix bug|bug fix') {
        return "patch"
    }
    
    # Improvements and refactors
    if ($changes['improvements'].Count -gt 0) {
        return "patch"
    }
    if ($msgLower -match 'improve|enhance|optimize|refactor|update|tweak|adjust') {
        return "patch"
    }
    
    # Documentation and minor changes
    if ($msgLower -match 'docs:|documentation|readme|comment') {
        return "patch"
    }
    
    # Default to patch for any other changes
    return "patch"
}

# Function to bump version
function Get-NewVersion {
    param([string]$currentVersion, [string]$bumpType)
    
    $parts = $currentVersion.Split('.')
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    $patch = [int]$parts[2]
    
    switch ($bumpType) {
        "major" { $major++; $minor = 0; $patch = 0 }
        "minor" { $minor++; $patch = 0 }
        "patch" { $patch++ }
    }
    
    return "$major.$minor.$patch"
}

# Function to save changelog to database
function Save-ToDatabase {
    param(
        [string]$version,
        [string]$versionType,
        [string]$summary,
        $changes,
        [bool]$isReleased
    )
    
    # Create a temporary Python script
    $tempScript = [System.IO.Path]::GetTempFileName() + ".py"
    
    $pythonCode = @"
import sys
sys.path.append('server')
from changelog_manager import ChangelogManager

manager = ChangelogManager()
version_id = manager.add_version('$version', '$versionType', '$summary', $isReleased)

"@
    
    # Add each change to the database
    foreach ($type in $changes.Keys) {
        foreach ($change in $changes[$type]) {
            if ($change) {
                $cleanChange = $change -replace "'", "''"
                $pythonCode += "manager.add_change(version_id, '$type', '$cleanChange')`n"
            }
        }
    }
    
    $pythonCode | Out-File -FilePath $tempScript -Encoding UTF8
    python $tempScript
    Remove-Item $tempScript -ErrorAction SilentlyContinue
}

# Check for changes
Write-Host "📋 Step 1: Analyzing changes..." -ForegroundColor Yellow
$status = git status --porcelain
if (-not $status) {
    Write-Host "   ⚠️  No changes to deploy" -ForegroundColor Yellow
    exit 0
}
Write-Host "   ✅ Found changes to analyze" -ForegroundColor Green

# Show changed files
Write-Host "`n📝 Changed files:" -ForegroundColor Cyan
git status --short | ForEach-Object { Write-Host "   $_" -ForegroundColor White }

# Get current version
$currentVersion = (Get-Content package.json -Raw | ConvertFrom-Json).version
Write-Host "`n📊 Current version: $currentVersion" -ForegroundColor Cyan

# Get commit message if not provided
if ([string]::IsNullOrWhiteSpace($Message)) {
    Write-Host "`n💬 Describe your changes (or press Enter to auto-generate):" -ForegroundColor Cyan
    Write-Host "   💡 Tip: Use 'feat:' for features, 'fix:' for bugs, 'breaking:' for breaking changes" -ForegroundColor DarkGray
    Write-Host "   Examples: 'feat: add charts' | 'fix: calculation error' | 'improve: performance'" -ForegroundColor DarkGray
    $Message = Read-Host "   Message"
}

# Stage changes for analysis
git add . 2>$null

# Analyze changes
Write-Host "`n🔍 Analyzing code changes..." -ForegroundColor Cyan
$diff = git diff --cached
$changes = Get-ChangeDescription -diff $diff

# Generate human-readable summary
$summary = Get-ChangeSummary -changes $changes
Write-Host "`n📄 Change Summary:" -ForegroundColor Cyan
Write-Host "   $summary" -ForegroundColor White

# Determine version bump
if ($SkipVersionBump) {
    Write-Host "`n🎯 Version bump: " -NoNewline -ForegroundColor Cyan
    Write-Host "SKIPPED (using current version)" -ForegroundColor Magenta
    $newVersion = $currentVersion
    $bumpType = "manual"
} else {
    $bumpType = Get-VersionBump -changes $changes -message $Message
    $newVersion = Get-NewVersion -currentVersion $currentVersion -bumpType $bumpType
    
    Write-Host "`n🎯 Detected change type: " -NoNewline -ForegroundColor Cyan
    switch ($bumpType) {
        "major" { 
            Write-Host "MAJOR (Breaking Change) 💥" -ForegroundColor Red 
            Write-Host "   → First number changes: $currentVersion → $newVersion" -ForegroundColor Red
        }
        "minor" { 
            Write-Host "MINOR (New Feature) ✨" -ForegroundColor Yellow 
            Write-Host "   → Second number changes: $currentVersion → $newVersion" -ForegroundColor Yellow
        }
        "patch" { 
            Write-Host "PATCH (Bug Fix/Update) 🔧" -ForegroundColor Green 
            Write-Host "   → Third number changes: $currentVersion → $newVersion" -ForegroundColor Green
        }
    }
}

# Show detailed changes
Write-Host "`n📋 Detailed Changes:" -ForegroundColor Cyan
if ($changes['features'].Count -gt 0) {
    Write-Host "   ✨ Features:" -ForegroundColor Yellow
    $changes['features'] | ForEach-Object { Write-Host "      • $_" -ForegroundColor White }
}
if ($changes['fixes'].Count -gt 0) {
    Write-Host "   🐛 Fixes:" -ForegroundColor Green
    $changes['fixes'] | ForEach-Object { Write-Host "      • $_" -ForegroundColor White }
}
if ($changes['improvements'].Count -gt 0) {
    Write-Host "   🚀 Improvements:" -ForegroundColor Cyan
    $changes['improvements'] | ForEach-Object { Write-Host "      • $_" -ForegroundColor White }
}
if ($changes['breaking'].Count -gt 0) {
    Write-Host "   💥 Breaking Changes:" -ForegroundColor Red
    $changes['breaking'] | ForEach-Object { Write-Host "      • $_" -ForegroundColor White }
}

# Confirm deployment
Write-Host "`n❓ Deploy version $newVersion? (Y/n): " -NoNewline -ForegroundColor Yellow
$confirm = Read-Host
if ($confirm -eq "n" -or $confirm -eq "no") {
    Write-Host "`n❌ Deployment cancelled" -ForegroundColor Red
    exit 0
}

# Use auto-generated message if none provided
if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = $summary
}

# Update package.json
Write-Host "`n📋 Step 2: Updating version..." -ForegroundColor Yellow
if ($SkipVersionBump) {
    Write-Host "   ⏭️  Skipped (using version $newVersion)" -ForegroundColor Magenta
} else {
    $packageJson = Get-Content package.json -Raw | ConvertFrom-Json
    $packageJson.version = $newVersion
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content package.json
    Write-Host "   ✅ Version updated: $currentVersion → $newVersion" -ForegroundColor Green
}

# Save to database
Write-Host "`n📋 Step 3: Recording changes in database..." -ForegroundColor Yellow
try {
    Save-ToDatabase -version $newVersion -versionType $bumpType -summary $summary -changes $changes -isReleased $CreateRelease
    Write-Host "   ✅ Changes recorded in changelog database" -ForegroundColor Green
}
catch {
    Write-Host "   ⚠️  Could not save to database: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Commit and push
Write-Host "`n📋 Step 4: Committing changes..." -ForegroundColor Yellow
git add .
git commit -m "$Message`n`n$summary"
Write-Host "   ✅ Changes committed" -ForegroundColor Green

Write-Host "`n📋 Step 5: Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Push failed" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Pushed to GitHub" -ForegroundColor Green

# Create release if requested
if ($CreateRelease) {
    Write-Host "`n📋 Step 6: Creating Release v$newVersion..." -ForegroundColor Yellow
    
    git tag "v$newVersion"
    git push origin "v$newVersion"
    
    Write-Host "   ✅ Release v$newVersion created!" -ForegroundColor Green
    Write-Host "`n🔄 GitHub Actions is building your release..." -ForegroundColor Cyan
    
    # Clean old releases
    Write-Host "`n🧹 Cleaning old releases (keeping last 5)..." -ForegroundColor Yellow
    try {
        $releases = gh release list --limit 100 --json tagName,createdAt | ConvertFrom-Json
        if ($releases.Count -gt 5) {
            $oldReleases = $releases | Sort-Object -Property createdAt -Descending | Select-Object -Skip 5
            foreach ($release in $oldReleases) {
                Write-Host "   🗑️  Deleting: $($release.tagName)" -ForegroundColor Gray
                gh release delete $release.tagName --yes --cleanup-tag 2>$null
            }
            Write-Host "   ✅ Cleaned up $($oldReleases.Count) old release(s)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "   ⚠️  Could not clean old releases" -ForegroundColor Yellow
    }
}

# Export changelog
Write-Host "`n📄 Exporting changelog..." -ForegroundColor Yellow
try {
    python -c @"
import sys
sys.path.append('server')
from changelog_manager import ChangelogManager
manager = ChangelogManager()
markdown = manager.export_changelog_markdown()
with open('CHANGELOG.md', 'w', encoding='utf-8') as f:
    f.write(markdown)
"@
    git add CHANGELOG.md 2>$null
    git commit -m "docs: update changelog" 2>$null
    git push origin main 2>$null
    Write-Host "   ✅ CHANGELOG.md updated" -ForegroundColor Green
}
catch {
    Write-Host "   ⚠️  Could not export changelog" -ForegroundColor Yellow
}

# Summary
Write-Host "`n✅ Deployment Complete! 🎉" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Deployed Version $newVersion" -ForegroundColor Cyan
Write-Host "   Type: $bumpType" -ForegroundColor White
Write-Host "   Summary: $summary" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Repository: https://github.com/kuntz09matthew/budget-tool" -ForegroundColor White
if ($CreateRelease) {
    Write-Host "📦 Release: https://github.com/kuntz09matthew/budget-tool/releases/tag/v$newVersion" -ForegroundColor White
}
Write-Host ""

# Monitor build status if release was created
if ($CreateRelease) {
    Write-Host "🔍 Monitoring GitHub Actions build..." -ForegroundColor Cyan
    Write-Host ""
    
    $tag = "v$newVersion"
    $maxWaitTime = 600  # 10 minutes max
    $startTime = Get-Date
    $checkInterval = 15
    
    do {
        Start-Sleep -Seconds 5  # Initial wait for workflow to start
        
        try {
            $runs = gh run list --limit 1 --json status,conclusion,name,createdAt,url | ConvertFrom-Json
            
            if ($runs) {
                $status = $runs.status
                $conclusion = $runs.conclusion
                $workflowUrl = $runs.url
                $elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
                
                if ($status -eq "completed") {
                    if ($conclusion -eq "success") {
                        Write-Host "✅ Build completed successfully after $elapsed seconds!" -ForegroundColor Green
                        Write-Host ""
                        Write-Host "📦 Checking release assets..." -ForegroundColor Cyan
                        
                        # Wait a moment for assets to be fully uploaded
                        Start-Sleep -Seconds 5
                        
                        $assets = gh release view $tag --json assets --jq '.assets[].name' 2>$null
                        if ($assets -match "\.exe") {
                            Write-Host ""
                            Write-Host "🎉 Windows installer is ready!" -ForegroundColor Green
                            Write-Host ""
                            Write-Host "✨ YOU CAN NOW OPEN YOUR INSTALLED APP TO GET THE UPDATE!" -ForegroundColor Yellow -BackgroundColor DarkGreen
                            Write-Host ""
                            Write-Host "📦 Available assets:" -ForegroundColor Cyan
                            $assets | ForEach-Object { Write-Host "   • $_" -ForegroundColor White }
                            Write-Host ""
                        } else {
                            Write-Host "⚠️  Build succeeded but .exe not found yet. Check manually." -ForegroundColor Yellow
                        }
                        break
                    } else {
                        Write-Host "❌ Build failed after $elapsed seconds" -ForegroundColor Red
                        Write-Host "🔗 View logs: $workflowUrl" -ForegroundColor Yellow
                        break
                    }
                }
                
                # Show progress
                Write-Host "⏳ Build in progress... ($elapsed seconds elapsed)" -ForegroundColor Yellow
                Start-Sleep -Seconds $checkInterval
                
                # Check if we've exceeded max wait time
                if ($elapsed -gt $maxWaitTime) {
                    Write-Host ""
                    Write-Host "⏰ Monitoring timeout. Build is still running." -ForegroundColor Yellow
                    Write-Host "🔗 Check status: $workflowUrl" -ForegroundColor Cyan
                    break
                }
            }
        }
        catch {
            Write-Host "⚠️  Error monitoring build: $_" -ForegroundColor Yellow
            break
        }
    } while ($true)
}
