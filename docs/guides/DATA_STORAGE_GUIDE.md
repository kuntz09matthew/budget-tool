# Data Storage & Update Safety Guide

## Overview
This document explains how user data is stored, protected, and preserved across app updates.

---

## 🗄️ Data Storage Architecture

### Development vs Production

#### **Development Mode** (VS Code)
- **Location**: `server/budget_data.json` (local to project)
- **Purpose**: Testing and development
- **Behavior**: Data stays in project folder
- **Git**: `.gitignore` prevents committing test data

#### **Production Mode** (Installed App)
- **Location**: Electron `userData` directory
- **Windows**: `C:\Users\<username>\AppData\Roaming\budget-tool\budget_data.json`
- **macOS**: `~/Library/Application Support/budget-tool/budget_data.json`
- **Linux**: `~/.config/budget-tool/budget_data.json`
- **Purpose**: User's actual financial data
- **Behavior**: Persists across all app updates

---

## 🔒 Data Safety Guarantees

### ✅ What's Protected:

1. **User Data Never Overwritten**
   - User data lives outside the app installation directory
   - Updates only replace app files, not user data
   - Your financial records are safe

2. **Development Data Never Shipped**
   - Test data in `server/budget_data.json` is gitignored
   - Only clean code is committed to repository
   - Released apps start with empty database

3. **Separation of Concerns**
   - App code: `/Program Files/` or `/Applications/`
   - User data: `AppData` or `Application Support`
   - Never the twain shall mix

### ❌ What Can't Happen:

- ❌ Updates can't delete user data
- ❌ Test data can't reach production
- ❌ App uninstall doesn't remove data (by design)
- ❌ Reinstalls don't affect existing data

---

## 🔄 How Updates Work

### Update Process:
```
1. User clicks "Update & Restart"
2. New app files download → temp directory
3. App closes
4. Installer replaces OLD app files with NEW app files
5. User data directory is NEVER touched
6. App restarts
7. App loads user data from userData directory
8. User sees all their data intact ✅
```

### Data Flow Diagram:
```
Development:
├── server/budget_data.json (test data) ← gitignored
└── App code → Git → GitHub

Production Install:
├── C:\Program Files\Budget Tool\ (app files)
│   └── Updates replace ONLY these files
└── C:\Users\YourName\AppData\Roaming\budget-tool\
    └── budget_data.json ← USER DATA (never touched by updates)
```

---

## 🛠️ Technical Implementation

### Backend (server/app.py)
```python
# Checks for BUDGET_APP_DATA_DIR environment variable
if os.environ.get('BUDGET_APP_DATA_DIR'):
    # Production: Use Electron's userData directory
    DATA_FILE = Path(env_var) / 'budget_data.json'
else:
    # Development: Use local server directory
    DATA_FILE = Path(__file__).parent / 'budget_data.json'
```

### Electron (electron/main.js)
```javascript
// Get persistent user data directory
const userDataPath = app.getPath('userData');

// Pass to Python via environment variable
const env = Object.assign({}, process.env, {
  BUDGET_APP_DATA_DIR: userDataPath
});

// Start server with environment
serverProcess = spawn(pythonCommand, [serverPath], { env });
```

---

## 📍 Finding Your Data

### Windows:
1. Press `Win + R`
2. Type: `%APPDATA%\budget-tool`
3. Press Enter
4. You'll see `budget_data.json`

### macOS:
1. Open Finder
2. Press `Cmd + Shift + G`
3. Type: `~/Library/Application Support/budget-tool`
4. Press Go
5. You'll see `budget_data.json`

### Linux:
```bash
cd ~/.config/budget-tool
ls -la
```

---

## 🔐 Data Backup Recommendations

### Automatic Protection:
- Data persists across updates ✅
- Data persists across reinstalls ✅

### Manual Backup (Recommended):
1. Locate your `budget_data.json` file (see above)
2. Copy it to:
   - Cloud storage (Dropbox, Google Drive, OneDrive)
   - External drive
   - Second computer
3. Do this monthly or before major updates

### Restore from Backup:
1. Uninstall app (if needed)
2. Reinstall app
3. Close app
4. Replace `budget_data.json` in userData directory with backup
5. Restart app
6. All data restored ✅

---

## 🧪 Testing Data Safety

### Before Each Release:
1. ✅ Create test account with dummy data
2. ✅ Note the account details
3. ✅ Install new version over old version
4. ✅ Verify test data still exists
5. ✅ Verify no development data appears

### Checklist:
- [ ] `.gitignore` includes `server/budget_data.json`
- [ ] Environment variable `BUDGET_APP_DATA_DIR` is set in production
- [ ] `userData` path logged in console for verification
- [ ] Test update doesn't lose data
- [ ] Fresh install has empty database

---

## 🆘 Data Recovery

### If Data Seems Lost:
1. **Check the right location**: Make sure you're looking in userData, not install directory
2. **Check file permissions**: Ensure app can read/write the file
3. **Check logs**: Look for file path in console output
4. **Restore from backup**: Copy backup over current file

### File Corruption:
If `budget_data.json` becomes corrupted:
1. Rename bad file to `budget_data.json.backup`
2. Restart app (creates new empty database)
3. Try to recover data from backup file manually
4. Contact support if needed

---

## 📊 Data Format

### JSON Structure:
```json
{
  "accounts": [
    {
      "id": 1733479200000,
      "type": "checking",
      "name": "Chase Checking",
      "balance": 2500.50,
      "created_at": "2025-12-06T12:00:00",
      "updated_at": "2025-12-06T12:00:00"
    }
  ],
  "income_sources": [],
  "fixed_expenses": [],
  "transactions": [],
  "categories": [],
  "total_budget": 0
}
```

### Editing Manually:
- ⚠️ **Not recommended** while app is running
- ✅ Close app first
- ✅ Make a backup before editing
- ✅ Validate JSON syntax before saving
- ✅ Restart app to reload

---

## 🔮 Future: Database Migration

When we migrate to SQLite:
- Same userData directory location
- Migration script will run on first launch
- Converts `budget_data.json` → `budget.db`
- Original JSON file kept as backup
- Same update safety guarantees apply

---

## ✅ Summary

### For Users:
- Your data is safe across updates
- Data lives separate from the app
- Backup manually for extra safety
- Updates never touch your financial records

### For Developers:
- Test data stays local (gitignored)
- Production uses Electron userData
- Updates only touch app files
- Environment variable controls data location

**Bottom Line**: Your financial data is protected, persistent, and portable! 🎉
