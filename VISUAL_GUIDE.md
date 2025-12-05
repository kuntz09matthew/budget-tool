# 🎯 Budget Tool - Complete Auto-Update System

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR DEVELOPMENT FLOW                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  1. Make code changes
                              │
                              ▼
            2. Update version in package.json
                    (e.g., 1.0.0 → 1.1.0)
                              │
                              ▼
                  3. Commit & Tag release
                   git tag v1.1.0 && push
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              GITHUB ACTIONS (Automatic Build)                │
│  • Builds for Windows, macOS, Linux                          │
│  • Creates GitHub Release                                    │
│  • Uploads installers + latest.yml                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   GITHUB RELEASE CREATED                     │
│  📦 Budget Tool Setup 1.1.0.exe                              │
│  📄 latest.yml (update manifest)                             │
│  📝 Release notes (auto-generated)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 USER'S EXPERIENCE (Next Launch)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    User opens app
                              │
                              ▼
              App checks GitHub (2 sec delay)
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
        No Update Found              Update Found (1.1.0)
              │                               │
              ▼                               ▼
      Continue normally          ┌─────────────────────────┐
                                 │ Dialog appears:         │
                                 │ "Version 1.1.0          │
                                 │  available. Download?"  │
                                 │  [Download] [Later]     │
                                 └─────────────────────────┘
                                              │
                          ┌───────────────────┴──────────────────┐
                          │                                      │
                          ▼                                      ▼
                   User clicks "Later"              User clicks "Download"
                          │                                      │
                          ▼                                      ▼
                  Continue using app              Download starts (background)
                                                                 │
                                                                 ▼
                                            Progress bar shows: 45%... 80%...
                                                                 │
                                                                 ▼
                                                    Download complete
                                                                 │
                                                                 ▼
                                            ┌─────────────────────────┐
                                            │ Dialog appears:         │
                                            │ "Update downloaded!     │
                                            │  Restart to install?"   │
                                            │  [Restart] [Later]      │
                                            └─────────────────────────┘
                                                                 │
                                            ┌────────────────────┴──────────────────┐
                                            │                                       │
                                            ▼                                       ▼
                                     User clicks "Later"             User clicks "Restart"
                                            │                                       │
                                            ▼                                       ▼
                                  Update waits for                      App restarts
                                  manual restart                               │
                                                                              ▼
                                                                   Installer runs
                                                                              │
                                                                              ▼
                                                              App opens with v1.1.0 ✨
```

## File Structure

```
Budget Tool/
│
├── 📁 .github/
│   ├── workflows/
│   │   └── release.yml          ← GitHub Actions (auto-build)
│   └── GIT_GUIDE.md             ← Git workflow reference
│
├── 📁 electron/
│   ├── main.js                  ← Auto-update logic ⭐
│   └── preload.js               ← Update API exposure ⭐
│
├── 📁 frontend/
│   ├── components/
│   │   └── UpdateNotification.jsx   ← UI component (optional)
│   └── styles/
│       └── update-notification.css  ← UI styles (optional)
│
├── 📁 server/                   ← Your Python Flask backend
│
├── 📄 package.json              ← Version & GitHub config ⭐
├── 📄 .gitignore                ← Git ignore patterns ⭐
│
├── 📖 QUICKSTART.md             ← Start here! (5 min)
├── 📖 SETUP_GITHUB.md           ← Complete guide
├── 📖 SUMMARY.md                ← What was changed
└── 📖 README.md                 ← Main documentation

⭐ = Modified or critical files
```

## Key Features

### ✅ Automatic Update Checks
- Happens 2 seconds after app launch
- Only in production builds (not `npm start`)
- Fails silently if offline
- Non-intrusive to user

### ✅ User Control
- User decides whether to download
- User decides when to install
- Can postpone to later
- Clear dialogs with version info

### ✅ Developer Friendly
- Tag & push → automatic build
- GitHub Actions handles everything
- Cross-platform builds
- Auto-generated release notes

### ✅ Secure
- Updates only from your GitHub repo
- Signature verification built-in
- Context isolation enabled
- No Node integration in renderer

## Quick Commands Reference

### Development
```powershell
npm start                 # Run in dev mode (updates disabled)
```

### Testing Updates
```powershell
npm run dist             # Build production version
.\dist\win-unpacked\Budget Tool.exe   # Test the built app
```

### Creating Release
```powershell
# Option A: Automated (recommended)
git tag v1.1.0
git push origin v1.1.0
# GitHub Actions builds automatically

# Option B: Manual
npm run dist
# Upload files from dist/ to GitHub Release manually
```

### Git Workflow
```powershell
git status               # Check what changed
git add .                # Stage all changes
git commit -m "message"  # Commit with message
git push origin main     # Push to GitHub
```

## Configuration Points

### 1. package.json (Line 43)
```json
"publish": {
  "provider": "github",
  "owner": "YOUR-GITHUB-USERNAME",  ← Change this!
  "repo": "budget-tool"
}
```

### 2. Version Number (Line 3)
```json
"version": "1.0.0"  ← Increment for each release
```

### 3. App Name (Line 27)
```json
"productName": "Budget Tool"  ← Your app's display name
```

## Update Flow (Technical)

1. **App Launch** → `electron/main.js` → `createWindow()`
2. **Check Trigger** → After window loads + 2 sec delay
3. **autoUpdater.checkForUpdates()** → Queries GitHub API
4. **GitHub API** → Returns latest release info
5. **Compare Versions** → Current vs Latest
6. **If Newer** → Emit 'update-available' event
7. **Show Dialog** → User sees notification
8. **User Accepts** → Call `autoUpdater.downloadUpdate()`
9. **Download** → Progress events emitted
10. **Complete** → Emit 'update-downloaded' event
11. **User Restarts** → Call `autoUpdater.quitAndInstall()`
12. **Installer Runs** → NSIS installer updates app
13. **App Relaunches** → Now running new version

## Testing Checklist

- [ ] Updated package.json with GitHub username
- [ ] Created GitHub repository
- [ ] Pushed code to GitHub
- [ ] Created a test release (v1.0.0)
- [ ] Built production app: `npm run dist`
- [ ] Ran built app (not npm start)
- [ ] Created higher version release (v1.0.1)
- [ ] Reopened app - saw update dialog
- [ ] Downloaded update successfully
- [ ] Installed update successfully
- [ ] App running new version

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No update dialog appears | Check you're running built app, not `npm start` |
| "Update available" but won't download | Ensure `latest.yml` is uploaded to GitHub release |
| Build fails | Run `npm install` and ensure Python is available |
| Can't push to GitHub | Check remote URL: `git remote -v` |
| Update downloads but app doesn't restart | Make sure user clicked "Restart Now" in dialog |

## Next Steps

1. ✅ Read `QUICKSTART.md` for setup steps
2. ✅ Update `package.json` with your GitHub info
3. ✅ Create GitHub repository
4. ✅ Push your code
5. ✅ Create first release (v1.0.0)
6. ✅ Test the update system
7. 🎨 Optional: Add UI notification component
8. 🚀 Continue building your budget features!

---

**Need help?** Open the relevant guide:
- Quick setup → `QUICKSTART.md`
- Detailed docs → `SETUP_GITHUB.md`
- Git workflow → `.github/GIT_GUIDE.md`
- Changes summary → `SUMMARY.md`
