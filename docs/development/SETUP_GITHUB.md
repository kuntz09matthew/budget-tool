# GitHub Version Control & Auto-Update Setup Guide

## Part 1: Initialize Git Repository and Connect to GitHub

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **+** icon in the top right → **New repository**
3. Repository name: `budget-tool` (or your preferred name)
4. Description: "A local desktop budgeting application with Python backend"
5. Choose **Private** or **Public**
6. **Do NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **Create repository**

### Step 2: Update package.json

Edit `package.json` and update the `build.publish` section with your GitHub username:

```json
"publish": {
  "provider": "github",
  "owner": "YOUR-GITHUB-USERNAME",
  "repo": "budget-tool"
}
```

### Step 3: Initialize and Push to GitHub

Open PowerShell in your project directory and run:

```powershell
# Initialize Git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Budget Tool with auto-update functionality"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR-GITHUB-USERNAME/budget-tool.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Part 2: Auto-Update System

### How It Works

1. **On App Launch**: The app automatically checks GitHub for new releases (only when connected to internet)
2. **Update Available**: User sees a dialog asking if they want to download
3. **Download**: If accepted, the update downloads in the background with progress indicator
4. **Install**: Once downloaded, user can choose to restart and install immediately or later
5. **Silent Failure**: If no internet, the check fails silently and app continues normally

### Creating a New Release

When you want to release a new version:

#### Option A: Automated Release (Recommended)

1. **Update version** in `package.json`:
   ```json
   "version": "1.1.0"
   ```

2. **Commit and tag**:
   ```powershell
   git add package.json
   git commit -m "Bump version to 1.1.0"
   git tag v1.1.0
   git push origin main
   git push origin v1.1.0
   ```

3. **GitHub Actions builds automatically**: The workflow will:
   - Build the app for Windows, macOS, and Linux
   - Create a GitHub Release with the tag
   - Upload installers automatically
   - Generate release notes from commits

#### Option B: Manual Release

1. **Update version** in `package.json`

2. **Build the app**:
   ```powershell
   npm run dist
   ```

3. **Create GitHub Release**:
   - Go to your GitHub repo → Releases → Draft a new release
   - Tag version: `v1.1.0` (must match package.json version)
   - Release title: `Budget Tool v1.1.0`
   - Description: List your changes
   - Upload files from `dist/` folder:
     - `Budget Tool Setup 1.1.0.exe` (Windows installer)
     - `latest.yml` (required for auto-update)
   - Click **Publish release**

### Testing Auto-Updates

1. **Test in production mode**:
   ```powershell
   # Build the app
   npm run dist
   
   # Run the built executable (not npm start)
   .\dist\win-unpacked\Budget Tool.exe
   ```

2. **Create a test release** on GitHub with a higher version number

3. **Launch the app** - you should see the update dialog within a few seconds

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (1.1.0): New features, backwards compatible
- **PATCH** (1.0.1): Bug fixes

## Part 3: User Experience

### What Users See

1. **Update Available Dialog**:
   - Shows new version number
   - Options: "Download & Install" or "Later"

2. **Download Progress** (optional UI implementation):
   - Percentage complete
   - Download speed
   - Time remaining

3. **Update Ready Dialog**:
   - Confirms download complete
   - Options: "Restart Now" or "Restart Later"

### Frontend Integration (Optional)

You can add a UI notification banner in your React frontend. Add this to your main app component:

```javascript
// Add to frontend/app.js or your React component

useEffect(() => {
  if (window.electron) {
    // Listen for update available
    window.electron.onUpdateAvailable((info) => {
      console.log('Update available:', info.version);
      // Show notification banner in your UI
      setUpdateInfo({
        available: true,
        version: info.version,
        downloading: false
      });
    });
    
    // Listen for download progress
    window.electron.onUpdateDownloadProgress((progress) => {
      setUpdateInfo(prev => ({
        ...prev,
        downloading: true,
        progress: progress.percent
      }));
    });
    
    // Listen for download complete
    window.electron.onUpdateDownloaded((info) => {
      setUpdateInfo(prev => ({
        ...prev,
        downloaded: true,
        downloading: false
      }));
    });
    
    // Cleanup
    return () => {
      window.electron.removeUpdateListeners();
    };
  }
}, []);

// Button to manually check for updates
const checkForUpdates = () => {
  if (window.electron) {
    window.electron.checkForUpdates();
  }
};

// Button to install downloaded update
const installUpdate = () => {
  if (window.electron) {
    window.electron.installUpdate();
  }
};
```

## Part 4: Common Issues & Solutions

### Issue: Update check fails silently
**Solution**: This is normal when offline. The app continues without updates.

### Issue: Update downloads but doesn't install
**Solution**: Make sure to upload BOTH the `.exe` installer AND `latest.yml` file to GitHub releases.

### Issue: App says "Update available" but won't download
**Solution**: Check that `package.json` has correct GitHub owner/repo in `build.publish` section.

### Issue: Build fails in GitHub Actions
**Solution**: Make sure Python dependencies are correct in `server/requirements.txt`.

## Part 5: Development vs Production

### Development Mode
```powershell
npm start
# Updates are DISABLED in dev mode
```

### Production Mode
```powershell
npm run dist
.\dist\win-unpacked\Budget Tool.exe
# Updates are ENABLED
```

## Part 6: Security Best Practices

1. **Code Signing** (Optional but recommended):
   - Get a code signing certificate
   - Add to electron-builder config
   - Prevents Windows SmartScreen warnings

2. **Private Releases**:
   - Use private GitHub repo
   - Set up GitHub tokens for authentication
   - Updates work the same way

3. **Version Verification**:
   - electron-updater verifies update signatures
   - Only downloads from your GitHub repo

## Need Help?

- [electron-updater Documentation](https://www.electron.build/auto-update)
- [electron-builder Documentation](https://www.electron.build/)
- [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github)
