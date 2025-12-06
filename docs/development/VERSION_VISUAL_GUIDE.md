# 🎯 Version Number Visual Guide

```
╔════════════════════════════════════════════════════════════════╗
║                    SEMANTIC VERSIONING                          ║
║                                                                  ║
║                    MAJOR . MINOR . PATCH                         ║
║                      1   .   5   .   13                         ║
║                      ↓       ↓       ↓                          ║
║                    First  Second  Third                         ║
║                                                                  ║
╠════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  💥 MAJOR (First Number)          1.5.13 → 2.0.0               ║
║     Breaking Changes                                            ║
║     ├─ Incompatible API changes                                ║
║     ├─ Requires user action                                    ║
║     └─ Keywords: breaking, major change                        ║
║                                                                  ║
║  ✨ MINOR (Second Number)         1.5.13 → 1.6.0               ║
║     New Features                                               ║
║     ├─ Added functionality                                     ║
║     ├─ Backwards compatible                                    ║
║     └─ Keywords: feat, add new, implement                      ║
║                                                                  ║
║  🔧 PATCH (Third Number)          1.5.13 → 1.5.14              ║
║     Bug Fixes & Improvements                                   ║
║     ├─ Bug fixes                                               ║
║     ├─ Performance improvements                                ║
║     └─ Keywords: fix, improve, update                          ║
║                                                                  ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 📊 Decision Tree

```
                    Making a change?
                          |
        ┌─────────────────┼─────────────────┐
        |                 |                 |
    Breaking           New              Fix or
    Change?          Feature?         Improve?
        |                 |                 |
        ↓                 ↓                 ↓
     MAJOR             MINOR             PATCH
    (1.x.x)           (x.1.x)           (x.x.1)
        |                 |                 |
    2.0.0             1.6.0             1.5.14
```

---

## 🎓 Quick Examples

### ✨ MINOR (Features) → Second Number
```
1.5.13  →  1.6.0    feat: add expense charts
1.6.0   →  1.7.0    implement CSV export
1.7.0   →  1.8.0    add new dashboard
1.8.0   →  1.9.0    create budget templates
```

### 🔧 PATCH (Fixes) → Third Number
```
1.5.13  →  1.5.14   fix: calculation error
1.5.14  →  1.5.15   improve: UI performance
1.5.15  →  1.5.16   update: dependencies
1.5.16  →  1.5.17   refactor: code cleanup
```

### 💥 MAJOR (Breaking) → First Number
```
1.5.13  →  2.0.0    breaking: removed API
2.0.0   →  3.0.0    major change: data format
```

---

## 📝 Commit Message Cheat Sheet

```
┌─────────────────────────────────────────────────────────┐
│  TYPE       │  VERSION  │  EXAMPLE                      │
├─────────────────────────────────────────────────────────┤
│  feat:      │  MINOR    │  "feat: add expense charts"   │
│  feature:   │  MINOR    │  "feature: CSV export"        │
│  add new    │  MINOR    │  "add new budget categories"  │
│  implement  │  MINOR    │  "implement notifications"    │
├─────────────────────────────────────────────────────────┤
│  fix:       │  PATCH    │  "fix: calculation error"     │
│  bug:       │  PATCH    │  "bug: display issue"         │
│  improve    │  PATCH    │  "improve: performance"       │
│  update     │  PATCH    │  "update: dependencies"       │
├─────────────────────────────────────────────────────────┤
│  breaking:  │  MAJOR    │  "breaking: remove API"       │
│  major      │  MAJOR    │  "major change: data format"  │
└─────────────────────────────────────────────────────────┘
```

---

## ⚠️ Common Mistakes

### ❌ WRONG
```
"add expense charts"          → 1.5.14  (PATCH)
  Missing "feat:" or "new"!

"feat: fix bug"               → 1.6.0   (MINOR)
  Don't use feat: for fixes!

"fix: add new feature"        → 1.5.14  (PATCH)
  Don't use fix: for features!
```

### ✅ CORRECT
```
"feat: add expense charts"    → 1.6.0   (MINOR) ✓
"add new expense charts"      → 1.6.0   (MINOR) ✓
"fix: calculation bug"        → 1.5.14  (PATCH) ✓
"improve: UI performance"     → 1.5.14  (PATCH) ✓
```

---

## 🎯 Remember

```
┌──────────────────────────────────────────────────┐
│  NEW FEATURES = SECOND NUMBER  (MINOR)           │
│                                                  │
│  Example: 1.5.13 → 1.6.0                        │
│           feat: add expense charts              │
│                                                  │
│  Use: feat:, add new, implement, create new     │
└──────────────────────────────────────────────────┘
```

---

## 🚀 Ultra-Deploy Output

When you run `.\ultra-deploy.ps1`, you'll see:

```
🎯 Detected change type: MINOR (New Feature) ✨
   → Second number changes: 1.5.13 → 1.6.0

📋 Detailed Changes:
   ✨ Features:
      • Added new module: expense-charts.js
      • Enhanced user interface in dashboard.html

❓ Deploy version 1.6.0? (Y/n):
```

This makes it crystal clear:
- **What type of change** was detected
- **Which number** will change
- **What the new version** will be

---

**For full documentation, see:** `docs/development/VERSIONING_GUIDE.md`
