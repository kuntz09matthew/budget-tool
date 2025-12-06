# 🎯 SEMANTIC VERSIONING QUICK REFERENCE

## Format: `MAJOR.MINOR.PATCH`

---

## 🔢 What Each Number Means

```
    1    .    5    .    13
    ↓         ↓         ↓
 MAJOR     MINOR     PATCH
```

### 1️⃣ MAJOR (Breaking Changes)
- **Changes incompatible features**
- **Requires user action**
- Keywords: `breaking:`, `major change`, `migration`
- Example: `1.5.13` → `2.0.0`

### 2️⃣ MINOR (New Features) ⭐
- **Adds new functionality**
- **Backwards compatible**
- Keywords: `feat:`, `add new`, `implement`
- Example: `1.5.13` → `1.6.0`

### 3️⃣ PATCH (Fixes & Improvements)
- **Bug fixes and small updates**
- **No new features**
- Keywords: `fix:`, `improve`, `update`
- Example: `1.5.13` → `1.5.14`

---

## ✅ CORRECT Usage Examples

```bash
# MINOR - New Feature
.\ultra-deploy.ps1 -Message "feat: add expense charts"
# Result: 1.5.13 → 1.6.0 ✓

# PATCH - Bug Fix
.\ultra-deploy.ps1 -Message "fix: calculation error"
# Result: 1.5.13 → 1.5.14 ✓

# PATCH - Improvement
.\ultra-deploy.ps1 -Message "improve: UI performance"
# Result: 1.5.13 → 1.5.14 ✓

# MAJOR - Breaking Change
.\ultra-deploy.ps1 -Message "breaking: removed legacy API"
# Result: 1.5.13 → 2.0.0 ✓
```

---

## ❌ WRONG vs ✅ CORRECT

### Adding New Features

**❌ WRONG:**
```bash
.\ultra-deploy.ps1 -Message "add expense charts"
# Might only bump to 1.5.14 (PATCH)
```

**✅ CORRECT:**
```bash
.\ultra-deploy.ps1 -Message "feat: add expense charts"
# Correctly bumps to 1.6.0 (MINOR)
```

### Fixing Bugs

**❌ WRONG:**
```bash
.\ultra-deploy.ps1 -Message "feat: fix calculation"
# Incorrectly bumps to 1.6.0 (MINOR)
```

**✅ CORRECT:**
```bash
.\ultra-deploy.ps1 -Message "fix: calculation error"
# Correctly bumps to 1.5.14 (PATCH)
```

---

## 🎨 Commit Message Prefixes

| Prefix | Version | Use For |
|--------|---------|---------|
| `feat:` | MINOR | New features |
| `fix:` | PATCH | Bug fixes |
| `breaking:` | MAJOR | Breaking changes |
| `improve:` | PATCH | Improvements |
| `update:` | PATCH | Updates |
| `docs:` | PATCH | Documentation |

---

## 💡 Remember

- **New feature = MINOR** (second number) ⭐
- **Bug fix = PATCH** (third number)
- **Breaking change = MAJOR** (first number)
- **Use `feat:` prefix for new features!**

---

For detailed guide, see: `docs/development/VERSIONING_GUIDE.md`
