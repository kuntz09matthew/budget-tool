# Git Commit Message Template

## Format
```
<type>: <subject>

<body>

<footer>
```

## Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only changes
- **style**: Code style (formatting, semicolons, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvement
- **test**: Adding or updating tests
- **chore**: Changes to build process or dependencies

## Examples

### Feature
```
feat: add monthly budget overview chart

Added Chart.js visualization showing monthly spending by category.
Users can now see spending trends at a glance.

Closes #123
```

### Bug Fix
```
fix: correct transaction total calculation

Fixed issue where negative values weren't being summed correctly
in the monthly total calculation.

Fixes #456
```

### Documentation
```
docs: update README with installation steps

Added detailed prerequisites and troubleshooting section.
```

### Chore
```
chore: bump version to 1.1.0

Preparing for release with new features from this sprint.
```

## Quick Reference

### First Commit
```powershell
git add .
git commit -m "Initial commit: Budget Tool with auto-updates"
```

### Feature Branch Workflow
```powershell
# Create branch
git checkout -b feature/transaction-history

# Make changes, then commit
git add .
git commit -m "feat: add transaction history view"

# Push to GitHub
git push origin feature/transaction-history

# Create Pull Request on GitHub, then merge

# Switch back to main and pull
git checkout main
git pull origin main
```

### Release Workflow
```powershell
# Update version in package.json to 1.1.0

# Commit version bump
git add package.json
git commit -m "chore: bump version to 1.1.0"

# Create and push tag
git tag v1.1.0
git push origin main
git push origin v1.1.0

# GitHub Actions builds automatically!
```

### Useful Commands
```powershell
# Check status
git status

# See commit history
git log --oneline

# See what changed
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Create new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main

# Delete branch
git branch -d feature/old-feature

# View all branches
git branch -a

# Sync with remote
git fetch origin
git pull origin main
```

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
  - Example: Complete UI redesign, database migration
  
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
  - Example: Add CSV export, new chart types
  
- **PATCH** (1.0.0 → 1.0.1): Bug fixes
  - Example: Fix calculation error, UI glitch

## Branching Strategy

### Main Branch
- Always production-ready
- Protected (no direct pushes)
- Only accepts Pull Requests

### Feature Branches
- Name: `feature/description`
- Example: `feature/csv-export`
- Merge via Pull Request

### Bugfix Branches
- Name: `fix/description`
- Example: `fix/total-calculation`
- Merge via Pull Request

### Release Branches (Optional)
- Name: `release/v1.1.0`
- For preparing releases
- Final testing before merge

## Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] All tests pass
- [ ] Added new tests if needed

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows project style
- [ ] Self-reviewed
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
```

## Tips

1. **Commit Often**: Small, focused commits are better than large ones
2. **Write Clear Messages**: Future you will thank you
3. **Test Before Committing**: Run the app to make sure it works
4. **Keep Main Clean**: Always use branches for features
5. **Tag Releases**: Use version tags for every release
6. **Document Changes**: Update CHANGELOG for each release

## Auto-Commit Script (Optional)

Create `commit.ps1`:
```powershell
param($message)
git add .
git commit -m $message
git push origin main
```

Usage:
```powershell
.\commit.ps1 "feat: add new feature"
```
