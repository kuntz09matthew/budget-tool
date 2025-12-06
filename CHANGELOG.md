# Changelog

All notable changes to Budget Tool.


## [Unreleased]
*In Development*

### ✨ New Features
- **Tax Withholding & Net Income Calculator**: Calculate your take-home pay after taxes and deductions
  - Federal income tax withholding (customizable percentage)
  - State income tax withholding (customizable percentage)
  - Social Security tax (6.2% default, adjustable)
  - Medicare tax (1.45% default, adjustable)
  - Other deductions support (401k, HSA, health insurance, etc.)
  - Real-time net income calculator in the income modal
  - Shows gross income, total deductions, and net take-home pay
  - Net income displayed on income cards in the income list
  - Fully integrated with backend data storage
  - Comprehensive validation for all tax fields (0-100% range)

- **Expected vs Actual Income Tracking**: Track whether your expected income matches what you actually receive
  - Record actual payments received for each income source
  - View expected vs actual income comparison for current month
  - Automatic variance calculation showing differences between expected and actual
  - Visual status indicators (on-track, above expected, below expected)
  - Payment history tracking with dates, amounts, and optional notes
  - Delete individual payment records
  - Detailed income analysis showing payment counts, variance percentages, and status
  - One-click "Record Payment" button on each income source
  - Fully integrated with existing income sources

- **Income Tracking - Phase 1 Complete**: Full income management system with add/edit/delete functionality
  - Support for 6 income types: Primary Salary, Secondary Salary, Freelance/Side Hustle, Investment Income, Rental Income, and Other Income
  - Flexible frequency settings: Weekly, Bi-weekly, Monthly, and Annual payments
  - Automatic monthly equivalent calculations for all income frequencies
  - Next pay date tracking with dashboard countdown
  - Optional notes field for additional income source details
  - Professional UI with icons and clear categorization
  - Real-time dashboard integration showing total monthly income

### 🔒 Security & Validation
- Added comprehensive backend input validation for income payment recording
  - Payment amount validation (must be positive numbers)
  - Date format validation (YYYY-MM-DD)
  - String sanitization for payment notes
- Added comprehensive backend input validation for all income operations
  - Type validation for income types and frequency settings
  - Amount validation (must be positive numbers)
  - String sanitization to prevent XSS attacks
  - Field length limits (names max 100 chars, notes max 500 chars)
- Enhanced frontend form validation with user-friendly error messages
- Double-submission prevention on form saves

### 🎨 UI/UX Improvements
- Enhanced income display with expandable tracking section
- Color-coded variance indicators (green for on-track, yellow for warnings)
- Clean payment history list with inline delete buttons
- Responsive grid layout for tracking statistics
- Professional analysis report in modal dialog

### 📊 Dashboard Integration
- Income totals now accurately reflect all income sources
- Available spending calculation includes all income streams
- Budget health score incorporates income data
- Smart recommendations consider income patterns

## [1.5.13] - Released
*2025-12-06 14:32:32*

Improved: Enhanced user interface in app.js, Enhanced user interface in index.html, Enhanced user interface in styles.css, Updated backend functionality in app.py

### 📝 Other Changes
- Updated documentation: CHANGELOG.md
- Updated documentation: FINANCIAL_ASSISTANT_ROADMAP.md

### 📝 Changes
- Enhanced user interface in app.js
- Enhanced user interface in index.html
- Enhanced user interface in styles.css
- Updated backend functionality in app.py


## [1.5.12] - Released
*2025-12-06 14:06:22*

Improved: Modified .gitignore, Modified main.js, Enhanced user interface in app.js, Enhanced user interface in index.html, Enhanced user interface in styles.css, Updated backend functionality in app.py

### 📝 Other Changes
- Updated documentation: CHANGELOG.md
- Updated documentation: FINANCIAL_ASSISTANT_ROADMAP.md
- Updated documentation: README.md
- Added new file: README.md
- Added tests for TESTING_AVAILABLE_SPENDING.md
- Added new file: BUDGET_HEALTH_SCORE_FEATURE.md
- Added new file: DATA_STORAGE_GUIDE.md
- Added new file: DATA_STORAGE_QUICKREF.md

### 📝 Changes
- Modified .gitignore
- Modified main.js
- Enhanced user interface in app.js
- Enhanced user interface in index.html
- Enhanced user interface in styles.css
- Updated backend functionality in app.py


## [1.5.11] - Released
*2025-12-06 05:18:15*

Improved: Modified main.js, Modified preload.js, Enhanced user interface in app.js, Enhanced user interface in index.html, Enhanced user interface in styles.css, Updated backend functionality in app.py

### 📝 Other Changes
- Updated documentation: CHANGELOG.md
- Added new file: FINANCIAL_ASSISTANT_ROADMAP.md

### 📝 Changes
- Modified main.js
- Modified preload.js
- Enhanced user interface in app.js
- Enhanced user interface in index.html
- Enhanced user interface in styles.css
- Updated backend functionality in app.py


## [1.5.10] - Released
*2025-12-06 03:59:45*

Improved: Enhanced user interface in index.html

### 📝 Other Changes
- Updated documentation: CHANGELOG.md

### 📝 Changes
- Enhanced user interface in index.html


## [1.5.9] - Released
*2025-12-06 03:53:32*

Fixed: Fixed application crashes

### 📝 Other Changes
- Updated documentation: CHANGELOG.md
- Updated dependencies

### 📝 Changes
- Fixed application crashes


## [1.5.8] - Released
*2025-12-06 03:48:00*

Improved: Enhanced user interface in index.html, Enhanced user interface in styles.css

### 📝 Other Changes
- Updated documentation: CHANGELOG.md

### 📝 Changes
- Enhanced user interface in index.html
- Enhanced user interface in styles.css


## [1.5.7] - Released
*2025-12-06 03:40:20*

Fixed: Fixed application crashes. Improved: Modified main.js

### 📝 Changes
- Modified main.js

### 📝 Other Changes
- Updated documentation: CHANGELOG.md

### 📝 Changes
- Fixed application crashes


## [1.5.6] - Released
*2025-12-06 03:35:01*

Improved: Enhanced user interface in index.html, Enhanced user interface in styles.css

### 📝 Changes
- Enhanced user interface in index.html
- Enhanced user interface in styles.css

### 📝 Other Changes
- Updated documentation: CHANGELOG.md


## [1.5.5] - Released
*2025-12-06 03:25:28*

Improved: Modified main.js, Enhanced user interface in app.js, Enhanced user interface in styles.css

### 📝 Changes
- Modified main.js
- Enhanced user interface in app.js
- Enhanced user interface in styles.css

### 📝 Other Changes
- Updated documentation: CHANGELOG.md


## [1.5.4] - Released
*2025-12-06 03:15:54*

Improved: Enhanced user interface in EFFICIENT_UPDATES_QUICKREF.md, Enhanced user interface in index.html, Modified ultra-deploy.ps1

### 📝 Changes
- Enhanced user interface in EFFICIENT_UPDATES_QUICKREF.md
- Enhanced user interface in index.html
- Modified ultra-deploy.ps1

### 📝 Other Changes
- Updated documentation: ULTRA-DEPLOY.md
- Updated dependencies


## [1.5.3] - Released
*2025-12-06 03:04:32*

Improved: Enhanced user interface in EFFICIENT_UPDATES_QUICKREF.md, Modified ultra-deploy.ps1

### 📝 Changes
- Enhanced user interface in EFFICIENT_UPDATES_QUICKREF.md
- Modified ultra-deploy.ps1

### 📝 Other Changes
- Updated documentation: CHANGELOG.md
- Updated documentation: ULTRA-DEPLOY.md


## [1.5.2] - Released
*2025-12-06 02:56:09*

Improved: Enhanced user interface in index.html, Enhanced user interface in styles.css

### 📝 Changes
- Enhanced user interface in index.html
- Enhanced user interface in styles.css

### 📝 Other Changes
- Updated documentation: CHANGELOG.md
- Updated dependencies


## [1.5.0] - Released
*2025-12-06 02:42:00*

New: Added data visualization features. Improved: Modified main.js, Enhanced user interface in app.js

### 📝 Changes
- Added data visualization features

### 📝 Other Changes
- Updated documentation: CHANGELOG.md

### 📝 Changes
- Modified main.js
- Enhanced user interface in app.js


## [1.4.0] - Released
*2025-12-06 02:21:43*

Improved: Modified release.yml, Modified main.js, Modified package-lock.json

### 📝 Other Changes
- Updated documentation: CHANGELOG.md
- Added new file: EFFICIENT_UPDATES.md
- Added new file: EFFICIENT_UPDATES_QUICKREF.md
- Added new file: EFFICIENT_UPDATES_VISUAL.md
- Updated dependencies

### 📝 Changes
- Modified release.yml
- Modified main.js
- Modified package-lock.json


## [1.3.0] - Released
*2025-12-06 01:59:09*

New: Added data visualization features. Improved: Enhanced user interface in app.js, Enhanced user interface in index.html, Enhanced user interface in styles.css

### 📝 Other Changes
- Updated dependencies

### 📝 Changes
- Added data visualization features

### 📝 Changes
- Enhanced user interface in app.js
- Enhanced user interface in index.html
- Enhanced user interface in styles.css


## [1.2.11] - Released
*2025-12-06 01:43:55*

Improved: Enhanced user interface in app.js, Enhanced user interface in index.html, Enhanced user interface in styles.css, Enhanced user interface design

### 📝 Other Changes
- Updated documentation: CHANGELOG.md
- Updated dependencies

### 📝 Changes
- Enhanced user interface in app.js
- Enhanced user interface in index.html
- Enhanced user interface in styles.css
- Enhanced user interface design


## [1.2.9] - Released
*2025-12-06 01:35:26*

Fixed: Fixed display issues. Improved: Modified main.js, Enhanced user interface in app.js, Updated backend functionality in changelog_manager.py

### 📝 Changes
- Modified main.js
- Enhanced user interface in app.js
- Updated backend functionality in changelog_manager.py

### 📝 Changes
- Fixed display issues

### 📝 Other Changes
- Updated dependencies


## [1.2.2] - Unreleased
*2025-12-06 00:18:49*

General updates and maintenance

### 📝 Other Changes
- Removed AUTO-DEPLOY.md
- Updated documentation: CHANGELOG.md
- Removed QUICKSTART.md
- Removed SMART-DEPLOY.md
- Removed deploy.ps1
- Added new file: package-lock.json
- Removed quick-deploy.ps1
- Removed smart-deploy.ps1


## [1.2.1] - Unreleased
*2025-12-05 23:57:32*

Improved: Modified ultra-deploy.ps1

### 📝 Changes
- Modified ultra-deploy.ps1

### 📝 Other Changes
- Added new file: CHANGELOG.md

