# Changelog

All notable changes to Budget Tool.


## [Unreleased]

### ✨ New Features
- **Month-to-Month Comparison**: Added comprehensive financial comparison between current and previous month
  - **Dashboard → Overview**: New comparison section displays automatically when multi-month data exists
    - **Visual Section Divider**: Clear header showing "📊 Month Comparison" with subtitle indicating which months are being compared
    - **Five Comparison Cards**:
      - **Income Comparison**: Shows current vs previous month income with change amount and percentage
      - **Fixed Expenses Comparison**: Compares monthly bills and obligations month-over-month
      - **Variable Spending Comparison**: Tracks changes in day-to-day spending (groceries, gas, dining, etc.)
      - **Net Savings Comparison**: Displays savings/deficit changes with support for negative values
      - **Transaction Count Comparison**: Shows how many more or fewer transactions occurred
    - **Smart Trend Indicators**:
      - Color-coded arrows showing direction (↗️ up, ↘️ down, ➡️ same)
      - Green highlighting for positive trends (income up, expenses down, savings up)
      - Red highlighting for negative trends (income down, expenses up, savings down)
      - Neutral gray for no change
      - Contextual meaning: For expenses/spending, decrease is good; for income/savings, increase is good
    - **Detailed Metrics**:
      - Current month value displayed prominently
      - Previous month value shown for reference
      - Absolute change amount in dollars
      - Percentage change with +/- indicator
      - Both values and changes formatted as currency
    - **Automated Insights Section**:
      - Dynamic insights based on significant changes (>5-10% threshold)
      - Positive reinforcement for improvements (e.g., "Great job! Spending decreased by 13.5%")
      - Warnings for concerning trends (e.g., "Spending increased by 15% from last month")
      - Transaction count observations for unusual activity
      - Icon-coded messages (📉 for decreases, 📈 for increases, 💰 for savings, etc.)
    - **Theme-Aware Design**: Full light/dark mode support with gradient backgrounds and borders
    - **Responsive Layout**: Cards automatically adjust for mobile and tablet screens
    - **Hover Effects**: Cards lift and scale on hover for interactive feel
  - **Backend API Integration**:
    - Utilizes existing `/api/dashboard/month-comparison` endpoint
    - Aggregates income, expenses, and transaction data by month
    - Calculates percentage changes and trend directions
    - Generates contextual insights based on data patterns
  - **Test Data Support**: Test data generator updated to include realistic November and December 2025 transactions for a family making ~$60k/year combined
  - **Modular Design**: Comparison feature built as separate `renderMonthComparisonSection()` function maintaining project's modular architecture
- **Budget Health Score (0-100)**: Comprehensive financial health scoring system with detailed breakdown
  - **Dashboard → Overview**: Interactive health score card showing overall budget health
    - Large score display (0-100) with color-coded indicator
    - Letter grade (A+ to F) with descriptive text (Excellent, Good, Fair, etc.)
    - Click card to view detailed breakdown modal
    - Color-coded based on score: Green (80+), Blue (70-79), Amber (60-69), Orange (50-59), Red (<50)
  - **Five Key Scoring Categories** (100 points total):
    - **Account Health (25 points)**: Evaluates checking balance, emergency fund adequacy (3-6 months expenses), and credit card management
    - **Spending Adherence (25 points)**: Compares actual spending to budget, rewards staying on track or under budget
    - **Savings Rate (20 points)**: Measures monthly savings rate, targeting 10-20% or more of income
    - **Bill Payment Status (20 points)**: Checks funds for upcoming bills (next 7 days) and overall payment capacity
    - **Setup Completeness (10 points)**: Rewards proper tracking of accounts, income, expenses, and transactions
  - **Detailed Breakdown Modal**:
    - Overall score summary with large visual display
    - Category-by-category breakdown with progress bars
    - Individual factor analysis for each category
    - Visual progress bars with color-coding per category performance
    - Financial summary showing key metrics (income, expenses, liquid assets, savings, spending)
    - Personalized recommendations based on weak areas
    - Educational section explaining how score is calculated
    - Grading scale reference (A+ through F)
  - **Smart Recommendations**:
    - Targeted advice for improving weak scoring areas
    - Emergency fund building guidance
    - Spending reduction strategies
    - Budget setup completion suggestions
    - Positive reinforcement for high scores
  - **Real-Time Updates**: Score recalculates automatically when financial data changes
  - **Theme-Aware Design**: Full support for light and dark modes
  - **Smooth Animations**: Fade-in effects and slide-up animations for visual polish
  - **Responsive Layout**: Optimized for all screen sizes including mobile devices

- **Overdraft Warning System (Color-Coded Alerts)**: Added comprehensive overdraft risk monitoring with real-time alerts
  - **Dashboard → Overview**: Prominent warning banner appears on main dashboard when overdraft risk detected
    - Full-width alert card with animated icon and pulsing border
    - Shows primary warning message at a glance
    - Click to navigate to detailed analysis in Alerts & Warnings tab
    - Critical alerts (red) have urgent shake animation
    - Warning alerts (yellow) have gentler attention pulse
    - Only appears when risk level is "warning" or "critical"
  - **Dashboard → Alerts & Warnings**: New dedicated tab showing overdraft risk status
  - **Three-Tier Risk System**:
    - 🟢 **Safe (Green)**: Healthy financial position with sufficient funds
    - 🟡 **Warning (Yellow)**: Approaching overdraft risk, take precautions
    - 🔴 **Critical (Red)**: Immediate overdraft danger, action required
  - **Visual Risk Indicator Bar**: Interactive progress bar showing current risk level
  - **Real-Time Account Monitoring**:
    - Tracks checking and savings balances
    - Monitors bills due in next 7 days
    - Analyzes spending velocity and rate
    - Calculates projected end-of-month balance
  - **Detailed Financial Metrics Display**:
    - Checking balance with color-coded warnings (<$200 = yellow, <$0 = red)
    - Savings balance showing emergency fund status
    - Total liquid funds available
    - Days remaining in month
    - Money left for the month
    - Upcoming bills amount (7-day window)
  - **Smart Warning Messages**:
    - Overdrawn account alerts
    - Insufficient funds for upcoming bills
    - Overspending notifications
    - Projected overdraft warnings
    - Low balance alerts
  - **Actionable Recommendations**:
    - Immediate actions for critical situations
    - Spending reduction strategies
    - Fund transfer suggestions
    - Budget reallocation advice
    - Bill payment prioritization
  - **Educational Help Section**:
    - Explanation of how overdraft protection works
    - Description of monitoring factors
    - Tips for maintaining healthy balances
    - Best practices for avoiding overdraft fees
  - **Visual Enhancements**:
    - Animated icons indicating risk level
    - Pulsing borders for critical alerts
    - Color-coded metric values
    - Responsive design for mobile devices
    - Theme-aware styling (light/dark mode)
  - **Empty State Handling**: Guides users to add accounts and income when no data exists
  - **Integration**: Works seamlessly with existing budget health score and upcoming bills features

- **Money Left Per Day Calculator**: Added intelligent daily budget calculator to help families stay on track until payday
  - Prominent dashboard card showing available money per day with color-coded status
  - Click to view comprehensive breakdown with detailed calculations
  - Visual timeline showing daily budget allocation until next paycheck
  - Step-by-step calculation display (income - expenses - spent = remaining ÷ days = daily budget)
  - Smart status indicators (Comfortable/Moderate/Limited/Very Tight/Over Budget)
  - Color-coded alerts based on daily budget amount:
    - Green (Success): $50+ or $30-50 per day - comfortable spending room
    - Yellow (Warning): $10-30 per day - limited budget, essentials only
    - Red (Danger): <$10 per day or overspent - very tight or over budget
  - Spending scenarios showing impact of staying on budget vs overspending vs saving
  - Contextual spending tips and recommendations based on financial situation
  - Automatically uses next paycheck date or end of month for calculations
  - Accounts for both income and already-spent money for accurate daily budgets
  - Beautiful responsive design with theme-aware styling
  - Empty state handling when no income data exists
  - Integration with existing paycheck countdown feature
- **Next Paycheck Countdown**: Added intelligent paycheck countdown feature in Dashboard → Spending Pace
  - Shows days remaining until the next paycheck from any income source
  - Displays detailed paycheck information (amount, earner, source, date, frequency)
  - Lists all upcoming paychecks with visual timeline
  - Color-coded status based on urgency (today, soon, this week, next week, distant)
  - Smart status messages that adapt to days remaining
  - Shows total expected income in next 30 days
  - Automatically calculates next occurrence for recurring paychecks (weekly, bi-weekly, monthly, annual)
  - Special celebration animation for payday
  - Handles multiple income earners in household
  - Responsive design with mobile support
  - Empty state guidance for users without configured income sources
  - **Quick Access Card**: Added clickable "Next Paycheck" card on Dashboard Overview
    - Shows days until next paycheck with dynamic icon
    - Displays earner name and amount at a glance
    - Click to navigate directly to full paycheck countdown details
    - Smooth scroll animation with highlight effect
    - Color-coded based on urgency (green for soon, yellow for distant)
    - Special "Payday!" indicator when paycheck is today

- **Spending Velocity Indicator**: Added comprehensive spending velocity tracker to help families monitor spending pace
  - Real-time tracking of actual vs safe daily spending rate
  - Visual progress bars showing month progress and budget usage
  - Color-coded status indicators (success/warning/danger/critical)
  - Daily rate comparison with interactive visualizations
  - Projected end-of-month balance calculations
  - Smart recommendations based on spending patterns
  - Detailed metrics grid showing MTD spending, remaining money, and projections
  - **Upcoming Bills Protection**: Safe daily rate now automatically accounts for unpaid bills due this month
  - Shows upcoming bills list with due dates and amounts
  - Displays "true available spending money" after bills are deducted
  - Critical warning status when not enough money for upcoming bills
  - Responsive design with mobile support
  - Comprehensive help section explaining velocity calculations

### 🔧 Improvements
- **Enhanced Safe Daily Rate Calculation**: Now subtracts upcoming bills from remaining money to prevent overspending
  - Identifies bills due after today but before end of month
  - Automatically adjusts as bills are paid throughout the month
  - Provides realistic spending targets that account for financial obligations
  - Shows detailed breakdown of upcoming bills and their due dates
  - Messages now include bill amounts in warnings and recommendations
- Enhanced test data generator with realistic December 2025 transactions for $60k/year family
- Added 37+ realistic transactions across groceries, gas, dining, healthcare, gifts, and more
- Improved dashboard velocity sub-tab with professional UI/UX
- Added detailed category breakdowns in test data output

### 📝 Documentation
- Updated roadmap marking spending velocity indicator as complete
- Added inline help documentation for velocity calculations


## [1.7.0] - Released
*2025-12-06 21:44:00*

New: Added new UI component: index-old-backup.html, Added new module: api.js, Added new module: app.js, Added new module: config.js, Added new module: charts.js, Added new module: dashboard.js, Added new module: expenses.js, Added new module: goals.js, Added new module: income.js, Added new module: reports.js, Added new module: savings.js, Added new module: spending.js, Added new module: updates.js, Added new module: state.js, Added new module: templates.js, Added new module: ui.js, Added new module: utils.js. Improved: Enhanced user interface in index.html, Enhanced user interface in styles.css, Updated backend functionality in app.py

### 📝 Changes
- Added new UI component: index-old-backup.html
- Added new module: api.js
- Added new module: app.js
- Added new module: config.js
- Added new module: charts.js
- Added new module: dashboard.js
- Added new module: expenses.js
- Added new module: goals.js
- Added new module: income.js
- Added new module: reports.js
- Added new module: savings.js
- Added new module: spending.js
- Added new module: updates.js
- Added new module: state.js
- Added new module: templates.js
- Added new module: ui.js
- Added new module: utils.js

### 📝 Other Changes
- Updated documentation: CHANGELOG.md
- Updated documentation: FINANCIAL_ASSISTANT_ROADMAP.md
- Added new file: clear_data.ps1
- Added new file: ARCHITECTURE_VISUAL.md
- Added new file: CLEANUP_SUMMARY.md
- Added new file: FRONTEND_ARCHITECTURE.md
- Added new file: HTML_MODULARIZATION_COMPLETE.md
- Added new file: IMPLEMENTATION_CHECKLIST.md
- Added new file: IMPLEMENTATION_STATUS.md
- Added new file: MIGRATION_GUIDE.md
- Added new file: MODULAR_QUICKREF.md
- Added new file: REFACTORING_SUMMARY.md
- Added new file: SUB_TAB_NAVIGATION_GUIDE.md
- Added tests for TESTING_CHECKLIST.md
- Added tests for generate_test_data.py

### 📝 Changes
- Enhanced user interface in index.html
- Enhanced user interface in styles.css
- Updated backend functionality in app.py


## [1.6.0] - Released
*2025-12-06 15:08:03*

New: Added new functionality. Improved: Enhanced user interface in app.js, Enhanced user interface in index.html, Enhanced user interface in styles.css, Updated backend functionality in app.py, Modified ultra-deploy.ps1

### 📝 Other Changes
- Updated documentation: CHANGELOG.md
- Updated documentation: FINANCIAL_ASSISTANT_ROADMAP.md
- Added new file: VERSIONING_GUIDE.md
- Added new file: VERSIONING_QUICKREF.md
- Added new file: VERSION_SYSTEM_UPDATE.md
- Added new file: VERSION_VISUAL_GUIDE.md

### 📝 Changes
- Added new functionality

### 📝 Changes
- Enhanced user interface in app.js
- Enhanced user interface in index.html
- Enhanced user interface in styles.css
- Updated backend functionality in app.py
- Modified ultra-deploy.ps1


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

