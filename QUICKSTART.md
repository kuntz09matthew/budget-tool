# Quick Start Guide - GitHub & Auto-Update Setup

## 🎯 You're Almost Done!

Your Budget Tool now has:
- ✅ Git repository initialized
- ✅ Enhanced auto-update system with user dialogs
- ✅ GitHub Actions workflow for automated releases
- ✅ Update notification UI components
- ✅ Proper .gitignore for Python and Electron

## 📋 Next Steps (5 minutes)

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `budget-tool`
3. Make it Private or Public (your choice)
4. **Don't** initialize with README
5. Click "Create repository"

### Step 2: Update package.json

Open `package.json` and find line ~35 with:
```json
"owner": "your-github-username",
```

Replace `your-github-username` with your actual GitHub username.

### Step 3: Push to GitHub

Run these commands in PowerShell:

```powershell
# Stage all files
git add .

# Create first commit
git commit -m "Initial commit: Budget Tool with auto-updates"

# Add your GitHub repo (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/budget-tool.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Test It Works

```powershell
# Install dependencies
npm install

# Run in development mode
npm start
```

## 🚀 Creating Your First Release

When you're ready to distribute:

### Option A: Automatic (Recommended)

```powershell
# 1. Make sure package.json version is correct (e.g., "1.0.0")

# 2. Create and push a version tag
git tag v1.0.0
git push origin v1.0.0

# 3. GitHub Actions automatically:
#    - Builds for Windows, Mac, Linux
#    - Creates GitHub Release
#    - Uploads installers
```

### Option B: Manual

```powershell
# 1. Build locally
npm run dist

# 2. Go to GitHub → Releases → "Draft a new release"
# 3. Tag: v1.0.0
# 4. Upload files from dist/ folder
# 5. Publish release
```

## 🔧 How Updates Work

### For Users:
1. Open app → Automatic check happens (2 seconds after launch)
2. If update found → Dialog: "Version X.X.X available. Download?"
3. Click "Download & Install" → Progress shown
4. When done → Dialog: "Update ready. Restart now?"
5. Click "Restart Now" → App restarts with new version

### For You (Developer):
1. Make changes to your code
2. Update version in `package.json` (e.g., 1.0.0 → 1.1.0)
3. Commit and tag: `git tag v1.1.0 && git push origin v1.1.0`
4. GitHub Actions builds automatically
5. Users get notified next time they open the app

## 📁 Important Files

- **electron/main.js** - Auto-update logic (checks GitHub, downloads, installs)
- **electron/preload.js** - Exposes update APIs to frontend
- **package.json** - Version number and GitHub config
- **.github/workflows/release.yml** - Automated build pipeline
- **SETUP_GITHUB.md** - Detailed documentation

## 💡 Tips

### Development vs Production
- `npm start` = Development mode (updates DISABLED)
- `npm run dist` = Production build (updates ENABLED)

### Version Numbers
- Follow Semantic Versioning: MAJOR.MINOR.PATCH
- Example: 1.2.3 → 1.2.4 (bug fix)
- Example: 1.2.4 → 1.3.0 (new feature)
- Example: 1.3.0 → 2.0.0 (breaking change)

### Testing Updates
1. Build current version: `npm run dist`
2. Install and run the built app
3. Create a GitHub release with higher version
4. Reopen app → Should see update notification

## 🐛 Troubleshooting

**Q: Update check not working?**
- Make sure you're running the built app (not `npm start`)
- Check internet connection
- Verify package.json has correct GitHub owner/repo

**Q: Can't push to GitHub?**
- Make sure remote URL is correct: `git remote -v`
- Check GitHub credentials/authentication

**Q: Build fails?**
- Run `npm install` to ensure dependencies are installed
- Check Python is available: `python --version`

**Q: No update notification shown?**
- Updates only work in production build, not dev mode
- Check GitHub release exists with higher version number
- Look at console logs for errors

## 📚 More Information

- Full setup guide: [SETUP_GITHUB.md](SETUP_GITHUB.md)
- Update examples: [UPDATE_GUIDE.md](UPDATE_GUIDE.md)
- Main README: [README.md](README.md)

## ✨ What's New

Your app now has:
- ✅ Automatic update checks on launch
- ✅ User-controlled update downloads
- ✅ Progress indicators during download
- ✅ Choice to install immediately or later
- ✅ GitHub Actions for automated releases
- ✅ Proper version control with Git
- ✅ Optional UI notification components

---

**Need help?** Open an issue on GitHub or review the detailed guides.
