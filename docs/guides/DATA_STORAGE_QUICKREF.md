# Data Storage & Update Safety - Quick Reference

## 📊 Data Location Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT MODE (VS Code)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Project Folder: C:\Users\kuntz\Desktop\Budget Tool\            │
│  ├── electron/                                                   │
│  ├── frontend/                                                   │
│  ├── server/                                                     │
│  │   ├── app.py                                                  │
│  │   └── budget_data.json  ← TEST DATA (gitignored)            │
│  └── package.json                                                │
│                                                                  │
│  Git commits: ✅ Code    ❌ Test Data                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

                            ⬇️  npm run build

┌─────────────────────────────────────────────────────────────────┐
│                   PRODUCTION MODE (Installed)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  App Files: C:\Program Files\Budget Tool\                       │
│  ├── electron.exe                                                │
│  ├── resources/                                                  │
│  │   ├── app.asar (readonly, packaged)                          │
│  │   └── app.asar.unpacked/                                     │
│  │       └── server/                                             │
│  │           └── app.py                                          │
│  └── (NO DATA FILES HERE)                                        │
│                                                                  │
│  ⚠️ Updates REPLACE these files ⚠️                              │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Data: C:\Users\<username>\AppData\Roaming\budget-tool\    │
│  └── budget_data.json  ← REAL USER DATA                         │
│                                                                  │
│  ✅ Updates NEVER touch this directory ✅                        │
│  ✅ Persists across updates, reinstalls ✅                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Update Process Flow

```
┌─────────────────┐
│  User clicks    │
│  "Update"       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Download new   │
│  version to     │
│  temp folder    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Close app      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Installer runs:                         │
│  ✅ Replaces: C:\Program Files\...      │
│  ❌ Ignores:  C:\Users\...\AppData\...  │
└────────┬─────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Restart app    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Load data from │
│  AppData folder │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ✅ All data    │
│  intact!        │
└─────────────────┘
```

---

## 🔍 Data Location by Platform

### Windows
```
User Data: %APPDATA%\budget-tool\budget_data.json
Full Path: C:\Users\<username>\AppData\Roaming\budget-tool\budget_data.json

App Files: C:\Program Files\Budget Tool\
```

### macOS
```
User Data: ~/Library/Application Support/budget-tool/budget_data.json
Full Path: /Users/<username>/Library/Application Support/budget-tool/budget_data.json

App Files: /Applications/Budget Tool.app/
```

### Linux
```
User Data: ~/.config/budget-tool/budget_data.json
Full Path: /home/<username>/.config/budget-tool/budget_data.json

App Files: /opt/Budget Tool/ or ~/Applications/
```

---

## ✅ Safety Checklist

### Before Release:
- [x] `.gitignore` includes `server/budget_data.json`
- [x] Environment variable set in Electron main process
- [x] Python checks for production mode
- [x] Test data stays in development
- [x] Documentation complete

### After Release:
- [ ] Test update on clean install
- [ ] Verify data persists after update
- [ ] Confirm no test data in production
- [ ] Check logs show correct data path
- [ ] User can find their data file

---

## 🎯 Key Principles

1. **Separation**: App code ≠ User data
2. **Isolation**: Dev data ≠ Prod data
3. **Persistence**: Updates preserve user data
4. **Portability**: Data backed up easily
5. **Transparency**: Users can access their data

---

## 🆘 Quick Troubleshooting

### "Where's my data?"
```bash
# Windows (PowerShell)
cd $env:APPDATA\budget-tool

# macOS/Linux
cd ~/Library/Application\ Support/budget-tool
```

### "Update lost my data!"
1. Check userData directory (see above)
2. Data should still be there
3. Restart app
4. If truly missing, restore from backup

### "I want to move my data"
1. Close app
2. Copy `budget_data.json` from old computer
3. Paste into userData directory on new computer
4. Start app
5. Done! ✅

---

## 📝 Environment Variable

```javascript
// Electron sets this:
BUDGET_APP_DATA_DIR = app.getPath('userData')

// Python receives this:
DATA_FILE = os.environ.get('BUDGET_APP_DATA_DIR') + '/budget_data.json'
```

---

## 🎉 Bottom Line

- ✅ Your data is SAFE
- ✅ Updates won't delete it
- ✅ Test data won't reach users
- ✅ Everything is documented
- ✅ Recovery is possible

**Sleep well knowing your financial data is protected!** 💤💰
