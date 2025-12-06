# 🚀 Quick Reference: Efficient Updates

## ✅ What Changed?

Your update system now uses **differential/delta downloads** instead of full downloads!

### Before:
```
Update 1.2.0 → 1.2.1 = 150 MB download ❌
```

### After:
```
Update 1.2.0 → 1.2.1 = 10-15 MB download ✅ (90% smaller!)
```

---

## 📦 Files in Each Release

When you deploy, these files are created:

| File | Size | Purpose |
|------|------|---------|
| `Budget-Tool-1.3.0-Setup.exe` | ~150 MB | Full installer (fresh installs) |
| `Budget-Tool-1.3.0-Setup.nsis.7z` | ~10-40 MB | **Differential package** ⚡ |
| `Budget-Tool-1.3.0-Setup.exe.blockmap` | ~100 KB | Binary diff metadata |
| `latest.yml` | ~1 KB | Update metadata |

**All files automatically uploaded to GitHub by workflow!**

---

## 🎯 How It Works Now

1. User opens app → checks for updates
2. electron-updater finds `.nsis.7z` differential package
3. Downloads ONLY the differences (10-40 MB instead of 150 MB)
4. Applies patch to existing installation
5. User installs update quickly!

**If differential fails**: Automatically falls back to full `.exe` download

---

## 🚀 Deploy Workflow

### Automatic Version Bumping (Default)
```powershell
# Regular commit (auto-bump version)
.\ultra-deploy.ps1 -Message "Your changes"

# Deploy + Release (triggers auto-update)
.\ultra-deploy.ps1 -Message "Your changes" -CreateRelease
```

### Manual Version Control
```powershell
# 1. Update version in package.json manually
# 2. Deploy without auto-bump
.\ultra-deploy.ps1 -SkipVersionBump -CreateRelease
```

**Use `-SkipVersionBump` when:**
- You've already changed the version in `package.json`
- You want full control over version numbers
- Prevents double version bumping!

**Nothing else changes for you!** The system handles differential packages automatically.

---

## 📊 Expected Savings

| Version Jump | Old Size | New Size | Time Saved |
|--------------|----------|----------|------------|
| 1.0.0 → 1.0.1 | 150 MB | 10 MB | 4 mins → 30 sec |
| 1.0.0 → 1.1.0 | 150 MB | 30 MB | 4 mins → 1 min |
| 1.0.0 → 2.0.0 | 150 MB | 80 MB | 4 mins → 2 min |

**Average savings: 70-90%** for patch/minor updates!

---

## 🔍 Verify It's Working

### Check Build Output:
After `npm run dist`, you should see:
```
✓ Building NSIS installer...
✓ Building differential package...
  • Comparing with previous version
  • Creating Budget-Tool-Setup.nsis.7z
✓ Done in 45s
```

### Check GitHub Release:
Should contain:
- ✅ `.exe` file
- ✅ `.nsis.7z` file (differential)
- ✅ `.blockmap` file
- ✅ `latest.yml` file

### Check Update Logs:
After user updates, check logs:
```
%USERPROFILE%\AppData\Roaming\Budget Tool\logs\main.log
```

Look for:
```
[info] Found differential package
[info] Download size: 12.4 MB (vs 150 MB full)
```

---

## ⚠️ Important Notes

1. **First update after enabling**: Still uses full download (no previous version to diff against)
2. **Subsequent updates**: Use differential downloads automatically
3. **Major version jumps**: Larger diffs (but still smaller than full download)
4. **Multiple versions behind**: May fall back to full download

---

## 🎓 Best Practices

✅ **Release frequently** - Smaller changes = smaller diffs
✅ **Use semantic versioning** - Helps users understand update size
✅ **Keep dependencies stable** - Fewer dependency changes = smaller diffs
✅ **Test updates locally** - Build two versions and test update between them

---

## 🛠️ Troubleshooting

### "Still downloading full installer"
→ Check GitHub release has `.nsis.7z` file
→ Rebuild with updated `package.json`

### "Build doesn't create .nsis.7z"
→ Run `npm run dist` again
→ Check `package.json` has `"differentialPackage": true`

### "Update fails"
→ Normal! Falls back to full download automatically
→ Check logs for details

---

## 📚 More Info

See `EFFICIENT_UPDATES.md` for detailed guide!

---

**You're all set!** Next release will enable differential updates. 🎉
