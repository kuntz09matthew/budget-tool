# 🤖 Smart Auto-Deploy System

## Automatic Version Management

Your deployment system now **automatically determines** the version bump based on your commit message!

---

## How It Works

The system analyzes your commit message and automatically bumps the version:

### **Major Version (1.0.0 → 2.0.0)** 💥
Breaking changes that aren't backward compatible
- Keywords: `breaking:`, `major:`
- Example: `"breaking: Changed API structure"`

### **Minor Version (1.0.0 → 1.1.0)** ✨
New features, backward compatible
- Keywords: `feat:`, `feature:`, `add`, `new`, `implement`
- Example: `"feat: Added CSV export"`

### **Patch Version (1.0.0 → 1.0.1)** 🔧
Bug fixes and small updates
- Keywords: `fix:`, `bugfix:`, `patch:`, `bug`, `error`, `docs:`, `chore:`, `refactor:`
- Example: `"fix: Corrected calculation error"`

---

## 🚀 How to Use

### **Method 1: Double-Click (Easiest!)**
Double-click `quick-deploy.ps1`:
1. Enter your message (e.g., `"feat: Added charts"`)
2. System automatically determines version bump
3. Asks if you want to create a release
4. Deploys everything!

### **Method 2: Command Line**

**Regular deploy (auto-version):**
```powershell
.\smart-deploy.ps1 -Message "feat: Added budget dashboard"
# Automatically bumps to next minor version (e.g., 1.0.0 → 1.1.0)
```

**Deploy and create release:**
```powershell
.\smart-deploy.ps1 -Message "fix: Fixed bug" -CreateRelease
# Automatically bumps patch version and creates release (e.g., 1.1.0 → 1.1.1)
```

**Manual version control:**
```powershell
.\smart-deploy.ps1 -Message "Updated code" -BumpType patch
.\smart-deploy.ps1 -Message "New feature" -BumpType minor
.\smart-deploy.ps1 -Message "Breaking change" -BumpType major
```

### **Method 3: VS Code**
Press `Ctrl+Shift+B` → Choose "🤖 Smart Deploy (Auto-Version)"

---

## 📝 Commit Message Examples

### Good Examples (Auto-detected):

| Message | Version Change | Type |
|---------|---------------|------|
| `"feat: Added transaction charts"` | 1.0.0 → 1.1.0 | Minor ✨ |
| `"fix: Fixed calculation bug"` | 1.1.0 → 1.1.1 | Patch 🔧 |
| `"breaking: New database schema"` | 1.1.1 → 2.0.0 | Major 💥 |
| `"add budget categories"` | 2.0.0 → 2.1.0 | Minor ✨ |
| `"bugfix in export"` | 2.1.0 → 2.1.1 | Patch 🔧 |
| `"docs: Updated README"` | 2.1.1 → 2.1.2 | Patch 🔧 |

---

## 🧹 Automatic Cleanup

The system automatically **keeps only the last 5 releases**:
- Old releases are deleted automatically
- Keeps GitHub clean
- Saves storage space
- Maintains release history of recent versions

This happens automatically when you use `-CreateRelease` flag.

---

## 🎯 Daily Workflow

### **Regular Update:**
1. Make your changes
2. Run: `.\smart-deploy.ps1 -Message "fix: Fixed issue"`
3. Version automatically bumps to 1.0.1
4. Code pushed to GitHub ✅

### **New Feature:**
1. Add new feature
2. Run: `.\smart-deploy.ps1 -Message "feat: Added charts"`
3. Version automatically bumps to 1.1.0
4. Code pushed to GitHub ✅

### **Ready to Release:**
1. Make your changes
2. Run: `.\smart-deploy.ps1 -Message "feat: Major update" -CreateRelease`
3. Version bumps to 1.2.0
4. GitHub Actions builds installer
5. Old releases cleaned up automatically
6. Users get update notification ✅

---

## 📊 Version Tracking

Your `package.json` always shows your current version:
```json
{
  "version": "1.2.3"
}
```

- Every deployment updates this automatically
- GitHub releases are tagged with the same version
- Users see the correct version in the app

---

## 🎓 Advanced Usage

### **Override Auto-Detection:**
```powershell
# Force a specific bump type
.\smart-deploy.ps1 -Message "Updated code" -BumpType major
.\smart-deploy.ps1 -Message "Updated code" -BumpType minor
.\smart-deploy.ps1 -Message "Updated code" -BumpType patch
```

### **Check What Version Would Be:**
The script shows you the detected version bump before deploying:
```
📊 Current version: 1.0.0
🎯 Detected change type: MINOR (New Feature) ✨
📈 New version: 1.1.0
❓ Deploy with version 1.1.0? (Y/n):
```

---

## 💡 Pro Tips

✅ **Use conventional commit prefixes** for auto-detection:
- `feat:` for features
- `fix:` for bug fixes
- `breaking:` for breaking changes
- `docs:`, `chore:`, `refactor:` for small updates

✅ **Only create releases** when you want users to get updates:
- Regular commits: Just push to GitHub
- User-facing updates: Add `-CreateRelease` flag

✅ **The system is smart** - if you forget the prefix:
- "Added new feature" → Minor bump (detected "added")
- "Fixed the bug" → Patch bump (detected "fixed")
- "Update code" → Patch bump (default)

---

## 🔧 What Happens Behind the Scenes

1. ✅ Analyzes your commit message
2. ✅ Determines appropriate version bump
3. ✅ Updates `package.json` with new version
4. ✅ Commits changes + version bump
5. ✅ Pushes to GitHub
6. ✅ (If release) Creates tag and triggers build
7. ✅ (If release) Cleans up old releases (keeps last 5)

---

## 🆚 Comparison

| Old Way | Smart Way |
|---------|-----------|
| Remember version number | ✨ Automatic |
| Manually update package.json | ✨ Automatic |
| Decide major/minor/patch | ✨ Automatic |
| Clean old releases | ✨ Automatic |
| Multiple commands | ✨ One command |

---

## 🐛 Troubleshooting

**Wrong version bump detected?**
```powershell
# Use manual override
.\smart-deploy.ps1 -Message "Your message" -BumpType minor
```

**Want to see what would happen?**
The script always shows you the version before deploying and asks for confirmation.

**Need to keep more than 5 releases?**
Edit `smart-deploy.ps1` and change the number in `Select-Object -Skip 5`

---

## 📚 Quick Reference

```powershell
# Simple auto-version deploy
.\smart-deploy.ps1 -Message "feat: New feature"

# Deploy and create release
.\smart-deploy.ps1 -Message "fix: Bug fix" -CreateRelease

# Force specific version bump
.\smart-deploy.ps1 -Message "Updated" -BumpType major

# Use the interactive version
.\quick-deploy.ps1
```

---

**You now have a fully automated, intelligent deployment system!** 🎉

Just write good commit messages and let the system handle versioning! 🚀
