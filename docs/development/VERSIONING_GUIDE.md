# 📋 Semantic Versioning Guide

## Version Format: `MAJOR.MINOR.PATCH` (e.g., 1.5.13)

---

## 🎯 When Each Number Changes

### 1️⃣ MAJOR Version (First Number) - Breaking Changes
**Changes from:** `1.5.13` → `2.0.0`

**Use when:**
- Making breaking changes that require user action
- Removing or significantly changing existing features
- Making incompatible API changes
- Requiring data migration

**Examples:**
```
breaking: removed legacy transaction format
major change: restructured data storage
migration: moved from JSON to SQLite
```

**Commit Message Keywords:**
- `breaking:`
- `breaking change`
- `major change`
- `incompatible`
- `migration required`

---

### 2️⃣ MINOR Version (Second Number) - New Features
**Changes from:** `1.5.13` → `1.6.0`

**Use when:**
- Adding new features or functionality
- Adding new user-facing capabilities
- Implementing new modules/components
- Adding new configuration options

**Examples:**
```
feat: add expense charts and graphs
add new budget category system
implement CSV export feature
create transaction search functionality
new feature: spending insights dashboard
```

**Commit Message Keywords:**
- `feat:` or `feature:`
- `add new`
- `new feature`
- `implement new`
- `create new`

**File-based Detection:**
- Adding new `.js`, `.py`, `.jsx`, `.tsx` files
- Adding new HTML/CSS components
- Any message with "add new [feature]"

---

### 3️⃣ PATCH Version (Third Number) - Bug Fixes & Improvements
**Changes from:** `1.5.13` → `1.5.14`

**Use when:**
- Fixing bugs or errors
- Making improvements to existing features
- Optimizing performance
- Updating dependencies
- Refactoring code
- Updating documentation

**Examples:**
```
fix: incorrect budget calculation
bug: resolve display issue on charts
improve: enhance UI performance
update: dependency versions
refactor: simplify transaction logic
docs: update README
```

**Commit Message Keywords:**
- `fix:` or `bug:`
- `improve`
- `enhance`
- `optimize`
- `refactor`
- `update`
- `docs:`

---

## 🚀 Using ultra-deploy.ps1

### Automatic Detection (Recommended)
```powershell
.\ultra-deploy.ps1
```
The script will:
1. Analyze your code changes
2. Detect the type of change
3. Suggest the appropriate version bump
4. Show you what it detected

### Manual Specification
```powershell
# For new features
.\ultra-deploy.ps1 -Message "feat: add transaction filtering"

# For bug fixes
.\ultra-deploy.ps1 -Message "fix: calculation error in budget totals"

# For breaking changes
.\ultra-deploy.ps1 -Message "breaking: changed API structure"
```

### Skip Version Bump
```powershell
.\ultra-deploy.ps1 -SkipVersionBump
```
Use this when you want to deploy without changing the version number.

---

## 📊 Real-World Examples from Budget App

### MINOR Version Bumps (New Features)
- ✅ `feat: add budget health score feature` → 1.5.0 → 1.6.0
- ✅ `implement expense categorization` → 1.6.0 → 1.7.0
- ✅ `add new dashboard with charts` → 1.7.0 → 1.8.0
- ✅ `create CSV export functionality` → 1.8.0 → 1.9.0

### PATCH Version Bumps (Fixes/Improvements)
- ✅ `fix: available spending calculation` → 1.5.0 → 1.5.1
- ✅ `improve: UI responsiveness` → 1.5.1 → 1.5.2
- ✅ `update: dependencies to latest versions` → 1.5.2 → 1.5.3
- ✅ `refactor: simplify transaction processing` → 1.5.3 → 1.5.4

### MAJOR Version Bumps (Breaking Changes)
- ✅ `breaking: remove legacy data format` → 1.9.0 → 2.0.0
- ✅ `migration: switch to new storage system` → 2.0.0 → 3.0.0

---

## 🎨 Visual Version Guide

```
    1    .    5    .    13
    ↓         ↓         ↓
 MAJOR     MINOR     PATCH
    |         |         |
    |         |         └─ Bug fixes, improvements, updates
    |         |            Keywords: fix, improve, update
    |         |
    |         └─────────── New features, added functionality
    |                      Keywords: feat, add new, implement
    |
    └─────────────────── Breaking changes, incompatible
                          Keywords: breaking, major change
```

---

## ⚠️ Common Mistakes

### ❌ WRONG: Using PATCH for new features
```
fix: add new expense charts  → Only bumps to 1.5.14
```
**Problem:** "add new" should trigger MINOR bump

### ✅ CORRECT: Using MINOR for new features
```
feat: add expense charts  → Bumps to 1.6.0
```

---

### ❌ WRONG: Using MINOR for bug fixes
```
feat: fix calculation error  → Bumps to 1.6.0
```
**Problem:** "fix" should trigger PATCH bump

### ✅ CORRECT: Using PATCH for bug fixes
```
fix: calculation error  → Bumps to 1.5.14
```

---

## 🔍 How the Script Detects Changes

### Priority Order:
1. **Check commit message first** - Your message is the primary indicator
2. **Analyze file changes** - New files suggest features
3. **Default to PATCH** - When uncertain, conservative bump

### Detection Rules:
```
MAJOR: breaking > features > fixes > improvements
MINOR: features > breaking > fixes > improvements  
PATCH: fixes > improvements > other changes
```

---

## 💡 Pro Tips

1. **Be explicit** - Use `feat:`, `fix:`, or `breaking:` prefixes
2. **One change type per commit** - Don't mix features and fixes
3. **Use meaningful messages** - Help the auto-detection work better
4. **Review before confirming** - The script shows what it detected
5. **Features = MINOR** - Always remember: new functionality = second number

---

## 📞 Quick Reference Card

| Change Type | Version | Keywords | Example |
|------------|---------|----------|---------|
| 💥 Breaking | `2.0.0` | breaking, major | "breaking: removed API" |
| ✨ Feature | `1.6.0` | feat, add new | "feat: add charts" |
| 🐛 Bug Fix | `1.5.14` | fix, bug | "fix: calculation error" |
| 🚀 Improvement | `1.5.14` | improve, enhance | "improve: performance" |
| 📝 Docs | `1.5.14` | docs, readme | "docs: update guide" |

---

**Remember:** The ultra-deploy script is now configured to properly detect features and bump the MINOR version (second number) when you add new functionality! 🎉
