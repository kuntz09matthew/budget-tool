# 🚀 Auto-Deploy Guide

## Three Easy Ways to Deploy

### Method 1: Double-Click Deploy (Easiest!)

Just **double-click** `quick-deploy.ps1` in Windows Explorer:
1. It shows your changes
2. Asks for a commit message (optional)
3. Automatically pushes to GitHub

### Method 2: Command Line with Message

```powershell
.\deploy.ps1 -Message "Added new feature"
```

**Auto-generates message if you don't provide one:**
```powershell
.\deploy.ps1
```

### Method 3: VS Code Keyboard Shortcut

1. Press **Ctrl+Shift+B** (or Cmd+Shift+B on Mac)
2. Choose "🚀 Quick Deploy"
3. Done!

---

## Creating Releases

### Command Line:
```powershell
.\deploy.ps1 -Message "New features added" -Release -Version "1.1.0"
```

### VS Code:
1. Press **Ctrl+Shift+P**
2. Type "Run Task"
3. Choose "🏷️ Create Release"
4. Enter version and message

---

## What Happens Automatically

When you run the deploy script:
1. ✅ Checks for changes
2. ✅ Stages all modified files
3. ✅ Creates commit with your message
4. ✅ Pushes to GitHub
5. ✅ (If release) Updates version and creates tag
6. ✅ (If release) Triggers GitHub Actions build

---

## Examples

### Regular Updates:
```powershell
# Quick deploy with auto-message
.\deploy.ps1

# With your own message
.\deploy.ps1 -Message "Fixed transaction bug"

# Multiple word message
.\deploy.ps1 -Message "Added CSV export feature and fixed styling"
```

### Release New Version:
```powershell
# Create version 1.1.0
.\deploy.ps1 -Message "Added chart visualization" -Release -Version "1.1.0"

# Create version 1.0.1 (bug fix)
.\deploy.ps1 -Message "Fixed calculation error" -Release -Version "1.0.1"
```

---

## Daily Workflow

### End of Each Coding Session:
1. Save your files
2. Double-click `quick-deploy.ps1`
3. Type a quick message
4. Done! ✅

### Ready to Release:
1. Test your app thoroughly
2. Run: `.\deploy.ps1 -Message "Release notes" -Release -Version "1.x.x"`
3. GitHub Actions builds installers automatically
4. Users get notified of update

---

## Keyboard Shortcuts in VS Code

| Action | Shortcut |
|--------|----------|
| Quick Deploy | `Ctrl+Shift+B` |
| Run Any Task | `Ctrl+Shift+P` → "Run Task" |
| View Git Status | Use task: "📊 View Git Status" |

---

## Tips

✅ **Deploy often** - Small, frequent commits are better than large ones

✅ **Write clear messages** - Future you will thank you
   - Good: "Fixed transaction total calculation"
   - Bad: "Fixed stuff"

✅ **Version numbers matter**:
   - Patch (1.0.0 → 1.0.1): Bug fixes
   - Minor (1.0.0 → 1.1.0): New features
   - Major (1.0.0 → 2.0.0): Breaking changes

✅ **Test before releasing** - Run `npm start` and test your changes

---

## Troubleshooting

**Script won't run?**
```powershell
# Enable script execution (run once)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Authentication error?**
```powershell
# Re-authenticate
gh auth login
```

**No changes to deploy?**
- You haven't saved your files
- You haven't made any changes
- Everything is already up to date ✅

---

## What NOT to Worry About

❌ Git commands - The script handles everything  
❌ Staging files - Done automatically  
❌ Branch management - Always deploys to main  
❌ Authentication - Handled by GitHub CLI  

Just focus on coding! 🎯
