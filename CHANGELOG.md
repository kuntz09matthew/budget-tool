# Changelog

All notable changes to Budget Tool.


## [Unreleased]

### 🎉 New Features
- **Month-to-Date Spending Summary**: Comprehensive spending tracking and analysis for current month
  - **Complete Spending Overview**: Track all spending from the beginning of the month
    - Total amount spent so far this month
    - Spending by category with percentages
    - Daily average spending calculation
    - Days elapsed and remaining in the month
    - Transaction count for the period
  - **Interactive Breakdown Modal**: Click the "Spent This Month" card for detailed view
    - Beautiful visual summary with status-based colors
    - Progress bar comparing spending vs time elapsed
    - Category breakdown with individual percentages and transaction counts
    - Month-end projection based on current spending pace
    - Recent transactions list (last 10) with dates, merchants, and categories
  - **Smart Budget Progress Tracking**: Visual indicators showing spending pace
    - Progress bar with spending percentage
    - Time marker showing current position in month
    - Color-coded status (green/yellow/red) based on spending pace
    - Legend explaining spending vs time elapsed
  - **Month-End Projections**: Predict final spending based on current patterns
    - Projected total spending for the month
    - Projected remaining budget
    - Visual indicators for over/under budget projection
  - **Status Indicators**: Intelligent warnings and messages
    - 🟢 Success: Spending below expected pace
    - 🟡 Warning: Spending on pace or slightly fast
    - 🔴 Danger: Spending too fast or over budget
    - Personalized recommendations based on spending patterns
  - **Category Analysis**: Detailed breakdown of where money is going
    - Spending amount per category
    - Percentage of total for each category
    - Transaction count per category
    - Visual bars showing relative category sizes
  - **Spending Insights**: Smart tips and recommendations
    - Remaining daily budget calculation
    - Comparison of spending pace vs month progress
    - Warnings for low remaining balance
    - Positive reinforcement for good spending habits
  - **Enhanced Dashboard Card**: Improved visual presentation
    - Shows daily average spending at a glance
    - Color-coded by budget status
    - Displays month progress percentage
    - Clickable with hover effect
  - **Test Data Added**: Realistic December 2025 transactions for $60k/year family
    - 12 transactions spanning December 1-6
    - Multiple categories: Groceries, Gas, Dining Out, Clothing, Medical, Childcare
    - Real-world merchants and amounts
    - Total: $551.08 spent in first 6 days
    - Includes both debit and credit card transactions
    - Realistic family spending patterns
- **Enhanced Available Spending Calculation**: Comprehensive "safe to spend" money calculator
  - **Complete Financial Picture**: Calculates available discretionary spending money
    - Formula: Income - Fixed Expenses - Retirement Contributions - Savings Allocations
    - Accounts for all committed expenses and savings
    - Shows true available spending for variable expenses (groceries, dining, entertainment, etc.)
  - **Detailed Breakdown Modal**: Click the Available Spending card to see comprehensive breakdown
    - Visual calculation flow showing each component
    - Income sources breakdown by earner
    - Fixed expenses breakdown by category
    - Retirement contributions included
    - Savings goals allocations included
  - **Multiple Time Perspectives**: View your available spending in different ways
    - Monthly total available spending
    - Per-paycheck amount (adapts to your pay frequency)
    - Per-day average spending budget
    - Percentage of income available for discretionary spending
  - **Smart Status Indicators**: Color-coded warnings based on financial health
    - 🔴 Danger: Expenses exceed income or very tight budget (<$200/month)
    - 🟡 Warning: Limited cushion ($200-$1000/month)
    - 🟢 Success: Healthy budget with good flexibility (>$1000/month)
  - **Intelligent Recommendations**: Personalized advice based on your situation
    - Budget management tips
    - Warning messages for tight budgets
    - Overdraft prevention guidance
  - **User-Friendly Tips**: Educational content explaining what the numbers mean
    - What counts as discretionary spending
    - How to use this number for budgeting
    - Importance of keeping a buffer for emergencies
  - **Enhanced Dashboard Card**: Improved visual presentation
    - Shows per-day spending amount at a glance
    - Color-coded by status (danger/warning/success)
    - Clickable with hover effect and tooltip
    - Responsive design for all screen sizes
  - **Test Data Updated**: Added realistic savings goals for $60k/year family
    - Emergency Fund (6 months expenses): $150/month
    - Summer Vacation 2026: $75/month
    - Christmas Fund: $50/month
    - New Car Down Payment: $100/month
    - Home Repair Fund: $50/month
    - Total: $425/month in savings allocations
- **Total Fixed Expenses Display**: Dashboard now shows total monthly fixed expenses (bills & obligations)
  - Displays total of all monthly fixed expenses (rent, utilities, insurance, subscriptions, etc.)
  - Professional card display with warning styling (yellow/orange) to emphasize expenses
  - Shows "Monthly bills & obligations" subtitle for clarity
  - Positioned between Monthly Income and Available Spending for logical flow
  - Helps users quickly understand their fixed monthly financial commitments
  - Updated test data with comprehensive realistic expenses for $60k/year family:
    - Housing (Rent/Mortgage: $1,800)
    - Transportation (Car Payment: $450)
    - Utilities (Electric: $120, Internet: $89.99, Water/Sewer: $65, Phone: $95)
    - Insurance (Car: $180, Health: $285)
    - Debt (Student Loan: $225)
    - Childcare ($600)
    - Subscriptions (Netflix: $15.99, Spotify: $16.99)
    - Total: $3,943.97/month in fixed expenses
- **Total Monthly Income Display**: Dashboard now shows total expected monthly income
  - Displays total monthly income from all income sources
  - Automatically converts different payment frequencies (weekly, bi-weekly, monthly, annual) to monthly totals
  - Professional card display with green success styling
  - Shows "Expected per month" subtitle for clarity
  - Integrates seamlessly with existing dashboard overview cards
- **Real-time Account Balances Dashboard**: Complete account management system
  - **Account Management**: Full CRUD operations for tracking all financial accounts
    - Add, edit, and delete accounts with validation
    - Support for multiple account types:
      - 💳 Checking accounts
      - 🏦 Savings accounts
      - 💳 Credit cards
      - 📈 Investment accounts
  - **Rich Account Information**: Store detailed account data
    - Account name and type
    - Current balance (with negative balance indicators for credit cards)
    - Bank/institution name
    - Custom notes for each account
    - Creation and update timestamps
  - **Dashboard Overview Cards**: Real-time account balance display on main dashboard
    - Total net worth calculation (assets - liabilities)
    - Individual totals for checking, savings, credit, and investment accounts
    - Quick view of all account balances
    - Account count display
  - **Dedicated Accounts Sub-Tab**: Detailed account management interface
    - Accounts grouped by type for easy viewing
    - Beautiful card-based layout with hover effects
    - Color-coded borders by account type
    - Quick edit and delete actions
    - Empty state with helpful onboarding message
  - **Professional Modal Interface**: Intuitive add/edit account modal
    - Clean, modern design with smooth animations
    - Real-time form validation
    - Currency input with $ prefix
    - Helpful tooltips and guidance
    - Separate optional fields for institution and notes
    - Context-sensitive help text (e.g., credit card balance instructions)
  - **Realistic Test Data**: Updated test data for $60k/year family
    - 5 sample accounts (checking, savings, vacation fund, credit card)
    - Realistic balances reflecting typical household finances
    - Bank institution names included
    - Helpful notes on each account
- **Retirement Contribution Tracking**: Comprehensive retirement account and contribution management
  - **Multiple Account Types Supported**: Track all major retirement account types
    - 401(k) plans
    - 403(b) plans
    - Traditional IRA
    - Roth IRA
    - SEP IRA
    - SIMPLE IRA
  - **Automatic Contribution Limits**: 2025 IRS contribution limits auto-filled based on account type
    - 401(k)/403(b): $23,500 annual limit
    - Traditional/Roth IRA: $7,000 annual limit
    - SEP IRA: $69,000 annual limit
    - SIMPLE IRA: $16,000 annual limit
  - **Employer Matching Support**: Track employer contributions
    - Set employer match percentage (e.g., 100%, 50%)
    - Set employer match limit (% of salary)
    - Separate tracking of employee vs employer contributions
  - **Comprehensive Contribution Tracking**: Record all contributions with details
    - Employee contributions
    - Employer match
    - Bonus contributions
    - Rollovers
    - Date and amount tracking
    - Optional notes for each contribution
  - **Year-to-Date Progress Tracking**: Real-time tracking of annual contributions
    - Current balance display
    - YTD employee contributions
    - YTD employer match
    - Remaining contribution limit
    - Visual progress bar showing % of limit used
    - Warning indicators when approaching or at limit
  - **Income Source Integration**: Link retirement accounts to income sources for automated tracking
    - Set contribution amount per paycheck
    - Track which income source funds which retirement account
  - **Contribution History**: View all contributions for each account
    - Recent contributions display
    - Toggle to show/hide full history
    - Contribution type badges (employee, employer match, bonus, rollover)
    - Delete individual contributions with balance adjustment
  - **Summary Dashboard**: Overview cards showing:
    - Total retirement account balance across all accounts
    - Year-to-date total contributions
    - Employee vs employer contribution breakdown
    - Number of active retirement accounts
    - Current year indicator
  - **Account Management**: Full CRUD operations
    - Add new retirement accounts with validation
    - Edit existing accounts
    - Delete accounts (with confirmation)
    - Account notes field for additional details
  - **Pre-tax and Post-tax Support**: Track contribution tax treatment
    - Pre-tax contributions (Traditional)
    - Post-tax contributions (Roth)
    - Mixed contributions (both types)
  - **Beautiful UI Design**:
    - Individual cards for each account with stats
    - Color-coded progress indicators
    - Theme-aware styling (light/dark mode)
    - Responsive design for all screen sizes
    - Empty state messaging when no accounts exist
  - **Backend API Endpoints**:
    - `GET /api/retirement-accounts` - Get all accounts with YTD calculations
    - `POST /api/retirement-accounts` - Create new account
    - `PUT /api/retirement-accounts/:id` - Update account
    - `DELETE /api/retirement-accounts/:id` - Delete account
    - `POST /api/retirement-accounts/:id/contributions` - Add contribution
    - `DELETE /api/retirement-accounts/:id/contributions/:contributionId` - Delete contribution
    - `GET /api/retirement-accounts/summary` - Get summary statistics
  - **Test Data Generation**: Sample retirement accounts with multi-year contribution history
  - Integrated into Income tab for easy access alongside income tracking
- **Tax Bracket Estimator**: Comprehensive federal tax calculation and planning tool
  - **2025 Federal Tax Brackets**: Complete and accurate tax brackets for all IRS filing statuses
    - Single filers
    - Married filing jointly
    - Married filing separately
    - Head of household
  - **Standard Deduction Calculator**: Automatically applies correct 2025 standard deductions per filing status
  - **Progressive Tax Calculation**: Accurate bracket-by-bracket tax calculations showing exactly how your income is taxed
  - **Tax Summary Dashboard**: Six key cards displaying:
    - Annual and monthly gross income
    - Standard deduction amount
    - Estimated federal tax (annual and monthly)
    - Effective tax rate (average rate you pay)
    - Marginal tax rate (rate on your next dollar earned)
    - After-tax income (annual and monthly)
  - **Tax Brackets Breakdown**: Visual display of each tax bracket you fall into with:
    - Bracket tax rate percentage
    - Income range for each bracket
    - Amount of income taxed in that bracket
    - Tax amount per bracket
  - **Paycheck Withholding Recommendations**: Suggested withholding amounts per pay period:
    - Weekly paychecks
    - Bi-weekly paychecks
    - Semi-monthly paychecks
    - Monthly paychecks
  - **Income Source Breakdown**: Detailed list of all income sources included in calculation
  - **Flexible Calculation Options**:
    - Toggle between expected income vs actual payments from last 12 months
    - Change filing status on-the-fly to see how it affects taxes
    - Real-time updates when income changes
  - **Comprehensive Disclaimer**: Clear notes about what's NOT included (state taxes, FICA, deductions, credits, AMT)
  - **Theme-Aware Design**: Beautiful styling for both light and dark modes
  - **Responsive Layout**: Works perfectly on mobile, tablet, and desktop
  - **Empty State Handling**: Graceful display when no income data exists
  - Backend API endpoint `/api/income/tax-estimate` with query parameters for filing status and actual income toggle
  - Automatic integration with existing income tracking system
  - Test data includes multiple income sources with proper tax fields

- **Year-over-Year Income Comparison**: Compare income performance across multiple years
  - **Comprehensive Year Cards**: Individual cards for each year showing total income, monthly average, and payment count
  - **Year-over-Year Change Indicators**: Visual indicators showing growth/decline with percentage and dollar amounts
  - **Top Income Sources**: Display top contributing income sources for each year
  - **Annual Comparison Bar Chart**: Visual bar chart comparing total annual income across all years
  - **Monthly Breakdown Line Chart**: Multi-line chart showing monthly patterns across years for seasonal analysis
  - **Overall Trend Analysis**: Automatic detection of increasing, decreasing, or stable income trends
  - **Statistics Summary**: Key metrics including years of data, average per year, and total all-time income
  - **Latest Year Badge**: Visual badge highlighting the most recent year
  - **Positive/Negative Styling**: Green for growth, red for decline, blue for stable performance
  - **Empty State Handling**: Graceful message when less than 2 years of data available
  - **Theme-Aware Design**: Full support for light and dark modes
  - **Responsive Layout**: Grid-based layout that adapts to mobile, tablet, and desktop
  - Backend API endpoint `/api/income/year-over-year` with comprehensive yearly data aggregation
  - Automatic percentage change calculations between consecutive years
  - Smart sorting (most recent year first) for easy comparison
  - Test data generator script creating sample data spanning 2023-2025

- **Income Trend Charts**: Visual analysis of income patterns over time
  - **Total Income Over Time**: Line chart showing monthly income trends with beautiful gradient fill
  - **Income by Source**: Stacked area chart breaking down income contributions by each source
  - **Income by Household Member**: Grouped bar chart comparing income across earners
  - **Trend Statistics**: Key metrics including average, highest, lowest monthly income and trend direction (increasing/decreasing/stable)
  - **Interactive Controls**: Select time period (6, 12, or 24 months) with refresh button
  - **Theme-Aware Charts**: Charts automatically adapt colors for light/dark mode
  - **Empty State Handling**: Graceful display when no income data is available
  - **Responsive Design**: Charts scale beautifully on mobile and desktop
  - **Chart.js Integration**: Professional-quality interactive charts with hover tooltips
  - Backend API endpoint `/api/income/trends` providing comprehensive monthly data aggregation
  - Automatic trend analysis with linear regression for pattern detection
  - Performance optimized with proper chart cleanup and refresh on theme change

- **Variable Income Tracking for Commission/Freelance Workers**: Comprehensive analysis for income that varies month-to-month
  - **Manual toggle checkbox** to mark any income as variable (in Add/Edit Income form)
  - Automatic detection of variable income types (freelance, investment, other)
  - Auto-suggests variable checkbox when selecting freelance/investment types
  - Real-time calculation of average monthly income based on payment history
  - Variability metrics showing income stability (coefficient of variation)
  - Visual stability badges (Stable ✅, Variable ⚠️, Highly Variable 🔴)
  - Detailed variable income analysis modal with:
    - Monthly income statistics (average, median, min, max)
    - Income trend analysis (increasing, decreasing, stable)
    - Current month performance vs. historical average
    - Next month forecast (conservative, expected, optimistic estimates)
    - Interactive bar chart showing 12-month income history
    - Personalized recommendations based on income patterns
  - Automatic statistics updates when recording or deleting payments
  - Smart budgeting suggestions based on minimum or average income

- **Multiple Income Earners in Household**: Track income sources by household member
  - Add earner name to each income source (optional field)
  - Filter and view income by person
  - Summary cards showing each earner's total monthly income
  - Visual badges displaying earner names on income items
  - Autocomplete suggestions for earner names

### 🔧 Backend Changes
- Added variable income tracking fields: `is_variable`, `average_monthly`, `income_variance`, `payment_count`
- New helper function `_update_variable_income_stats()` to calculate income statistics
- New API endpoint `/api/income/<id>/variable-analysis` for comprehensive analysis
- Automatic calculation of:
  - 3-month and 6-month rolling averages
  - Standard deviation and coefficient of variation
  - Monthly income totals and trends
  - Forecast projections
- Enhanced `record_income_payment` to auto-update statistics
- Enhanced `delete_income_payment` to recalculate after deletion
- Input validation for all variable income calculations

### 🎨 UI Enhancements
- Variability badges showing income stability level with color coding
- Dual-amount display for variable income (expected vs. average)
- Beautiful variable income analysis modal with:
  - Gradient cards for forecasts
  - Color-coded bar charts
  - Trend indicators with icons
  - Professional statistics layout
  - Responsive design for mobile devices
- Context-aware button (shows variable analysis for variable income)
- Added comprehensive CSS styling for all variable income components
- Dark mode support for all new variable income features
- Responsive adjustments for smaller screens

### 💡 Intelligence Features
- Automatic income variability detection
- Smart recommendations based on income patterns:
  - Emergency fund suggestions for high variability
  - Budget safety tips (use minimum or 3-month average)
  - Trend-based financial advice
  - Encouragement for positive trends
- Progressive data collection (more accurate as payment history grows)

### 📊 Roadmap Progress
- ✅ Completed: Income Tracking - Phase 2 - Variable Income Tracking (for commission/freelance)
  - Fully functional with comprehensive analysis
  - Professional UI with charts and visualizations
  - Smart recommendations and forecasting
  - Production-ready with error handling


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

