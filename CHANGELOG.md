# Changelog

All notable changes to Budget Tool.


## [Unreleased]

### ✨ New Features - Retirement Contribution Tracking
**Comprehensive retirement account management with contribution tracking and progress monitoring**

#### Retirement Accounts Management
- Multiple retirement account types supported:
  - 401(k) and 403(b) employer-sponsored plans
  - Traditional IRA and Roth IRA individual retirement accounts
  - SEP IRA and SIMPLE IRA for self-employed/small business
- Full CRUD operations (Create, Read, Update, Delete) for accounts
- 2025 IRS contribution limits auto-filled based on account type
- Pre-tax and post-tax contribution type support
- Link retirement accounts to income sources for tracking
- Per-paycheck contribution amount tracking
- Comprehensive account notes and details
- Account creation and edit modals with validation

#### Employer Matching Support
- Employer match percentage configuration (e.g., 100% = dollar-for-dollar)
- Match limit as percentage of salary (e.g., 6% cap)
- Automatic employer match tracking in contribution history
- Year-to-date employer match totals displayed separately
- Visual indicators showing match amounts in account cards
- Match calculations integrated into contribution tracking

#### Contribution Tracking System
- Add contributions with date, amount, type, and notes
- Four contribution types:
  - Employee contributions (your deposits)
  - Employer match (company contributions)
  - Bonus/additional contributions
  - Rollovers from other accounts
- Full contribution history with deletion capability
- Multi-year contribution tracking (2023-2025+)
- Contribution ID system for precise tracking
- Auto-update of account balance on contribution changes

#### Year-to-Date Progress Tracking
- Real-time YTD contribution calculations for current year
- Separate tracking of employee vs employer contributions
- Visual progress bars showing percentage of annual limit
- Remaining contribution limit displayed prominently
- Color-coded limit status indicators:
  - Green: Under 80% of limit
  - Yellow: 80-99% of limit (⚠️ Near Limit badge)
  - Green: 100%+ of limit (✓ Limit Reached badge)
- Current year badge showing which year is being tracked

#### Retirement Summary Dashboard
- Four key summary cards with visual icons:
  - Total retirement balance across all accounts
  - Year-to-date total contributions
  - Year-to-date employee contributions only
  - Year-to-date employer match contributions
- Real-time calculations updated on every change
- Beautiful gradient design with theme awareness
- Summary appears at top of Retirement sub-tab

#### Account Cards Display
- Individual cards for each retirement account
- Account type badges (401k, IRA, etc.)
- Contribution type badges (Pre-Tax, Post-Tax)
- Limit status badges with visual warnings
- Current balance prominently displayed
- YTD contribution statistics
- Employer match information (if applicable)
- Progress bar showing contribution limit progress
- Remaining limit amount in dollars
- Per-paycheck contribution display
- Quick action buttons (Add Contribution, Edit, Delete)
- "View Contribution History" link to detailed modal
- Hover effects and smooth transitions
- Responsive grid layout (2 columns on desktop, 1 on mobile)

#### Account Detail Modal
- Comprehensive account information display
- Full contribution history timeline
- Contributions sorted by date (newest first)
- Individual contribution items showing:
  - Date of contribution
  - Contribution type with icon
  - Amount with green highlighting
  - Optional note/description
  - Delete button for each contribution
- Account summary section with all key metrics
- Modal opens from account card detail link
- Theme-aware styling with smooth animations

#### Contribution Entry Modal
- Quick add contribution form
- Date picker with default to today
- Amount input with validation
- Contribution type dropdown selector
- Optional note field for context
- Submit/cancel actions with confirmation
- Real-time validation and error handling
- Auto-refreshes account display after adding

#### Account Form Modal
- Comprehensive account creation/editing
- Account name input with helpful placeholder
- Account type dropdown with all IRS account types
- Contribution type selector (pre-tax/post-tax)
- Annual limit field with auto-fill on type selection
- Current balance input
- Employer match section (shows for 401k/403b only)
  - Match percentage input
  - Match limit as % of salary input
- Income source linking dropdown
  - Populated with all available income sources
  - Shows earner name for easy selection
- Per-paycheck contribution amount
- Optional notes textarea
- Dynamic form sections based on account type
- Real-time limit hints and suggestions
- Full validation with user-friendly error messages

#### Backend API Integration
- RESTful API endpoints for all operations:
  - `GET /api/retirement-accounts` - Fetch all accounts
  - `POST /api/retirement-accounts` - Create new account
  - `PUT /api/retirement-accounts/:id` - Update account
  - `DELETE /api/retirement-accounts/:id` - Delete account
  - `POST /api/retirement-accounts/:id/contributions` - Add contribution
  - `DELETE /api/retirement-accounts/:id/contributions/:id` - Delete contribution
  - `GET /api/retirement-accounts/summary` - Get YTD summary
- Automatic YTD calculations on backend
- Contribution limit tracking and warnings
- Data persistence in budget_data.json
- Error handling with user-friendly messages
- Server-side validation of all inputs

#### User Interface Excellence
- Beautiful card-based layout with shadows and hover effects
- Color-coded progress bars with smooth animations
- Visual badges for account types and status indicators
- Theme-aware design (light and dark mode support)
- Responsive mobile-optimized layout
- Empty state with helpful onboarding message
- Loading states during API calls
- Success/error notifications for all actions
- Smooth modal transitions and overlays
- Icon-based visual hierarchy
- Consistent spacing and typography
- Professional gradient color schemes

#### Test Data Generation
- Realistic test data for ~$60k/year household
- Two retirement accounts:
  - Company 401(k) with employer match
  - Personal Roth IRA
- Multi-year contribution history (2023-2025)
- Realistic contribution amounts based on income
- Employer match calculations
- Progressive salary increases reflected in contributions
- Varied contribution patterns (bi-weekly, monthly, irregular)
- Account balances consistent with contribution history

#### Integration Features
- Integrated into Income section as "Retirement" sub-tab
- Sub-tab navigation with icon and tooltip
- Seamless switching between income sub-tabs
- Links to income sources for contribution tracking
- Modular architecture maintaining app design patterns
- Shared state management with rest of application
- Consistent with existing Income tracking features

---

### ✨ New Features - Year-over-Year Income Comparison
**Comprehensive annual income analysis and multi-year trend tracking**

#### Year-over-Year Comparison Sub-Tab
- New dedicated sub-tab in Income section for annual income comparisons
- Beautiful visual design with comprehensive statistics and charts
- Compare income across multiple years (2023-2025+)
- Identify long-term income growth trends and patterns
- Theme-aware design with responsive mobile layout

#### Overall Statistics Banner
- Total years of data tracked across all income sources
- Cumulative earnings showing total income across all years
- Average income per year with monthly breakdown
- Overall trend indicator (increasing/decreasing/stable)
- Visual stat cards with emoji icons and color coding
- Real-time calculations based on actual payment history

#### Individual Year Cards
- Detailed breakdown card for each year with data
- Annual total income with month-by-month tracking
- Year-over-year change calculations (amount & percentage)
- Monthly average income showing consistent patterns
- Payment count statistics per year
- Visual badges showing growth direction (↗️↘️➡️)
- Color-coded change indicators (green for growth, red for decline)
- Top 5 income sources per year with contribution percentages
- Visual progress bars showing source distribution
- "View Monthly Breakdown" button for detailed analysis

#### Year-over-Year Change Tracking
- Automatic calculation of year-to-year differences
- Percentage change with visual direction indicators
- Dollar amount change prominently displayed
- Comparison context showing baseline vs growth years
- Positive/negative/stable classification with color coding
- Historical growth rate analysis

#### Visual Comparison Charts
- Annual Income Comparison Bar Chart with Chart.js
  - Side-by-side bars showing total income per year
  - Color-coded based on growth direction
  - Latest year highlighted in blue
  - Interactive tooltips with monthly averages and payment counts
  - Scaled Y-axis showing values in thousands
  - Clear visual representation of multi-year trends

- Monthly Income Patterns Line Chart
  - Multi-year line chart comparing monthly income patterns
  - Separate line for each year with distinct colors
  - Smooth bezier curves for better visualization
  - Month-by-month comparison (Jan-Dec)
  - Interactive legend to show/hide specific years
  - Hover tooltips showing exact amounts per month
  - Identifies seasonal income patterns across years

#### Detailed Year Breakdown Modal
- Comprehensive modal view for individual year analysis
- Summary statistics section with 4 key metrics
- Year-over-year comparison card with visual indicators
- Monthly timeline visualization showing income distribution
  - Visual bars showing relative income amounts per month
  - Color coding for months with vs without income
  - Exact dollar amounts displayed for each month
  - Easy identification of income gaps or spikes

- Top Income Sources breakdown with rankings
  - Ranked list (#1, #2, #3, etc.) of income sources
  - Individual source cards with percentage of total
  - Visual progress bars showing contribution
  - Detailed amount and percentage calculations

- Income by Household Member section
  - Breakdown showing each earner's contribution
  - Percentage of total household income per member
  - Visual bars representing distribution
  - Helps understand family income dynamics

#### Backend API Enhancement
- `/api/income/year-over-year` endpoint fully implemented
- Automatic year detection from actual payment data
- Comprehensive data aggregation by year, month, source, and earner
- Year-over-year change calculations with percentages
- Top sources identification per year (top 5)
- Payment count tracking for each year
- Months with income tracking for accurate averages
- Overall trend analysis across all available years

#### Test Data Integration
- Multi-year test data spanning 2023-2025
- Realistic income growth pattern (~$54k → $58k → $62k)
- Primary salary growth (raises over 3 years)
- Secondary income expansion (part-time job growth)
- Freelance income progression (side hustle growth)
- Investment income addition in 2024
- Demonstrates increasing, stable, and variable income patterns
- Perfect for testing all year-over-year features

#### User Experience Features
- Empty state with helpful guidance when insufficient data
- Requires at least 2 years of income history for comparison
- Loading states during data fetching
- Error handling with user-friendly messages
- Smooth animations and transitions
- Mobile-optimized responsive design
- Touch-friendly buttons and interactions
- Collapsible sections for detailed data
- Intuitive navigation between years
- Quick access to detailed breakdowns

### ✨ New Features - Income Trend Charts
**Visual analysis of income patterns over time**

#### Income Trends Sub-Tab
- New interactive charts section in Income tab showing income over time
- Period selector allowing 6, 12, or 24-month views
- Three comprehensive charts with Chart.js integration
- Real-time statistics dashboard with trend indicators
- Theme-aware charts (automatic light/dark mode support)
- Responsive design for mobile and desktop viewing

#### Total Income Over Time Chart
- Line chart with gradient fill showing monthly income totals
- Smooth bezier curves for better visualization
- Interactive tooltips showing exact amounts on hover
- Visual trend line to identify income patterns
- Color-coded in theme-friendly green

#### Income by Source Stacked Area Chart
- Stacked line chart showing contribution of each income source
- Different colors for each income source (salary, freelance, investment, etc.)
- Visual breakdown showing which sources contribute most
- Interactive legend to show/hide specific sources
- Helps identify income diversification

#### Income by Household Member Grouped Bar Chart
- Grouped bar chart comparing income by family member
- Side-by-side comparison of each earner's contributions
- Color-coded bars for easy identification
- Shows household income distribution clearly
- Helps with financial planning discussions

#### Trend Statistics Dashboard
- Average monthly income calculation
- Highest and lowest month identification
- Automatic trend detection (increasing/decreasing/stable)
- Visual indicators with emoji and color coding
- Summary cards showing key metrics at a glance

#### Backend Data Aggregation
- `/api/income/trends` endpoint with flexible date ranges
- Monthly income aggregation from actual payments
- Income grouped by source and earner
- Statistical calculations (average, median, min, max)
- Trend analysis using 3-month rolling comparison
- Efficient data processing for multi-year histories

#### User Experience
- Loading states while fetching data
- Empty states with helpful guidance for new users
- Smooth animations and transitions
- Accessible color palette meeting WCAG standards
- Responsive charts that adapt to screen size
- Period selector persists user preference during session

### ✨ New Features - Variable Income Tracking
**Comprehensive analysis for commission, freelance, and other variable income sources**

#### Variable Income Analysis View
- New "Variable Income" sub-tab in Income section displaying all variable income sources
- Auto-detection of variable income types (freelance, investment, other)
- Individual analysis cards for each variable income source with key metrics
- Real-time variability calculations (coefficient of variation)
- Stability assessment with color-coded indicators (Stable/Moderately Variable/Highly Variable)
- Current month performance tracking vs historical average
- Trend analysis showing if income is increasing, decreasing, or stable

#### Comprehensive Analysis Modal
- Detailed 12-month income history with interactive Chart.js visualization
- Monthly statistics (average, median, minimum, maximum)
- Variability metrics with standard deviation calculations
- Trend analysis comparing last 3 months to previous 3 months
- Current month vs average comparison with visual progress bars
- Next month forecast with three estimates:
  - Conservative (based on minimum)
  - Expected (based on 3-month average)
  - Optimistic (based on maximum)
- Personalized recommendations based on income stability and trends

#### Smart Insights & Recommendations
- Warning alerts for high variability (>20% coefficient of variation)
- Emergency fund recommendations for variable income earners
- Conservative budgeting suggestions based on minimum/average income
- Trend-based advice (celebrate increases, address decreases)
- Actionable tips for managing variable income effectively

#### Backend Analytics Engine
- `/api/income/<id>/variable-analysis` endpoint with comprehensive calculations
- Historical pattern analysis (6 months of data)
- Monthly aggregation with payment counts
- Statistical analysis (mean, median, std deviation, CV)
- Three-month rolling trend detection (±10% threshold)
- Forecast generation using recent payment history
- Context-aware recommendations engine

#### User Experience
- Beautiful gradient summary banners with stability indicators
- Responsive grid layout for income source cards
- Theme-aware design (light/dark mode support)
- Empty states with helpful guidance for new users
- Info modal explaining variable income concepts
- Mobile-optimized layout with collapsible sections
- Real-time chart rendering with hover tooltips

#### Test Data Enhancement
- Variable income sources already included in test data:
  - Freelance web development ($500-$2,000/month variable)
  - Investment dividend income (quarterly payments)
- Multi-year payment history (2023-2025) for trend analysis
- Realistic variability patterns matching $60k/year household

### ✨ New Features - Multiple Income Earners in Household
**Track and visualize income contributions from each household member**

#### By Earner View
- New "By Earner" sub-tab in Income section
- Individual earner cards showing comprehensive statistics
- Visual contribution bars displaying each earner's percentage of total household income
- Household summary with combined totals (monthly/annual net income)
- Breakdown of all income sources per earner
- Quick access to view individual earner's income sources

#### Enhanced Backend API
- Comprehensive `/api/income/by-earner` endpoint with detailed statistics
- Calculates gross and net monthly/annual totals per earner
- Automatic contribution percentage calculations (both gross and net)
- Source counts and deduction totals per earner
- Support for unassigned income sources with warnings

#### Updated Test Data
- Realistic two-earner household data (~$60k/year combined)
- John Kuntz: Manufacturing Supervisor ($2,500/month) + Freelance ($650/month variable)
- Sarah Kuntz: Part-time Retail ($850 bi-weekly)
- Properly distributed historical payment data across multiple years

#### User Experience Improvements
- Responsive design for mobile devices
- Color-coded visual indicators for each earner
- "Unassigned Income" section with warnings for sources without earners
- One-click navigation to assign earners to income sources
- Beautiful gradient household summary card
- Percentage contribution visualization with progress bars

### ✨ New Features - Basic Income Management (Phase 1)
**Comprehensive income tracking system with tax withholding and deductions**

#### Add/Edit/Delete Income Sources
- Full CRUD operations for income sources
- Support for 6 income types:
  - 💼 Primary Salary
  - 💼 Secondary Salary  
  - 💻 Freelance / Side Hustle
  - 📈 Investment Income
  - 🏠 Rental Income
  - 💵 Other Income
- 4 payment frequency options: Weekly, Bi-weekly, Monthly, Annual
- Earner name field for tracking multiple household income earners
- Optional notes field for additional context

#### Tax Withholding & Deductions Calculator
- Federal tax withholding percentage
- State tax withholding percentage
- Social Security tax (default 6.2%)
- Medicare tax (default 1.45%)
- Other deductions (flat amount for health insurance, 401k, etc.)
- Real-time net income calculator in modal form
- Visual color indicators for deduction impact (green/orange/red based on percentage)

#### Expected vs Actual Income Tracking
- Record actual payment amounts as they are received
- Compare actual vs expected income for current month
- Visual variance indicators (above/below expected)
- Payment history display with dates and amounts
- Automatic calculation of variance percentage

#### Net Income Display
- Comprehensive net income breakdown on each income card
- Shows gross amount, total deductions, and net amount
- Detailed deduction breakdown (federal, state, SS, Medicare, other)
- Monthly net income equivalent for all frequencies
- Deduction percentage display

#### Enhanced Income Overview
- Summary cards showing total monthly income, annual income, and household earners
- Individual income cards with all relevant information
- Support for multiple earners per household
- Next payment date tracking
- Integration with variable income analysis (existing feature)

#### Backend Enhancements
- Added `calculate_net_income()` helper function
- Enhanced GET `/api/income` endpoint to include net income calculations
- Comprehensive validation for all income fields
- Support for all 6 income types and 4 frequency options
- Tax and deduction fields properly validated and sanitized

#### Test Data
- Updated test data generator with realistic $60k/year household
- Primary job: $36k/year with full benefits and tax withholding
- Secondary job: $26k/year part-time retail
- Freelance income: $14-18k/year variable side work
- Investment income: $600-800/year dividend income
- Comprehensive tax withholding and deduction examples
- Multi-year payment history for trend analysis


## [1.8.0] - Released
*2025-12-07 01:15:54*

New: Added new module: check_patterns_data.py. Improved: Updated backend functionality in api.js, Enhanced user interface in dashboard.js, Enhanced user interface in updates.js, Enhanced user interface in styles.css, Modified generate_test_data.py, Updated backend functionality in app.py

### 📝 Changes
- Added new module: check_patterns_data.py

### 📝 Changes
- Updated backend functionality in api.js
- Enhanced user interface in dashboard.js
- Enhanced user interface in updates.js
- Enhanced user interface in styles.css
- Modified generate_test_data.py
- Updated backend functionality in app.py

### 📝 Other Changes
- Updated documentation: CHANGELOG.md
- Updated documentation: FINANCIAL_ASSISTANT_ROADMAP.md
- Added tests for test_api_direct.py
- Added tests for test_patterns.py


## [1.7.1] - Released
*2025-12-06 23:34:44*

Improved: Updated backend functionality in api.js, Enhanced user interface in dashboard.js, Enhanced user interface in styles.css, Modified generate_test_data.py, Updated backend functionality in app.py, Modified ultra-deploy.ps1

### 📝 Changes
- Updated backend functionality in api.js
- Enhanced user interface in dashboard.js
- Enhanced user interface in styles.css
- Modified generate_test_data.py
- Updated backend functionality in app.py
- Modified ultra-deploy.ps1

### 📝 Other Changes
- Updated documentation: CHANGELOG.md
- Updated documentation: FINANCIAL_ASSISTANT_ROADMAP.md


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

