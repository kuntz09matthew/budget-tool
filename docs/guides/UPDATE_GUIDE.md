# Auto-Update Setup Guide

## How Auto-Updates Work

Your Budget Tool checks GitHub Releases for new versions on startup. When an update is found:
1. User sees notification banner in the app
2. User clicks "Download & Install"
3. Update downloads to Downloads folder
4. User clicks "Install & Restart"
5. Installer launches and app closes
6. User runs installer to update

## Setup Steps

### 1. Update Configuration

Edit `updater.py` and set your GitHub repo:
```python
GITHUB_REPO = "your-username/budget-tool"
CURRENT_VERSION = "1.0.0"
```

### 2. Create GitHub Release

When you have a new version:

1. **Update version** in `updater.py`:
   ```python
   CURRENT_VERSION = "1.1.0"
   ```

2. **Build executable**:
   ```bash
   pip install pyinstaller
   pyinstaller --onefile --windowed --name BudgetTool main.py
   ```

3. **Create GitHub Release**:
   - Go to your GitHub repo
   - Click "Releases" → "Create a new release"
   - Tag version: `v1.1.0`
   - Release title: `Budget Tool v1.1.0`
   - Description: List changes/fixes
   - Upload: `dist/BudgetTool.exe`
   - Click "Publish release"

### 3. Users Get Auto-Updates

When users launch the app:
- App checks GitHub for latest release
- If newer version exists, shows update banner
- User clicks button to download & install
- App downloads from GitHub release assets
- Installer runs and updates the app

## Testing Updates

Test locally before releasing:

```bash
# Test update checker
python updater.py

# Check API endpoints
curl http://localhost:5000/api/updates/check
```

## Version Numbering

Use semantic versioning:
- `1.0.0` - Major.Minor.Patch
- `1.0.1` - Bug fixes
- `1.1.0` - New features
- `2.0.0` - Breaking changes

## Security Notes

- Updates download from your GitHub releases (secure)
- No automatic installation without user approval
- User sees what they're downloading
- Installer path is validated before running

## Benefits vs Electron Updater

✅ **Pure Python** - No Node.js required
✅ **Simpler** - Just upload .exe to GitHub
✅ **Transparent** - User sees download progress
✅ **Control** - User decides when to install
✅ **Small** - No Electron auto-updater bloat
