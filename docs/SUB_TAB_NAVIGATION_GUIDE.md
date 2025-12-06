# Sub-Tab Navigation System Guide

## Overview
The Budget Tool now features a comprehensive **hierarchical navigation system** with main tabs and sub-tabs. Each feature has its own dedicated sub-tab, making it easy to find and access specific functionality without excessive scrolling.

## 🎨 Features

### 1. **Main Tab Navigation**
- 7 main tabs across the top of the app
- Each tab has a tooltip describing its purpose
- Hover over any main tab to see what it contains

### 2. **Sub-Tab Navigation**
- Each main tab contains 4-6 sub-tabs
- Sub-tabs organize related features together
- Clean, modern design with icons and labels
- Smooth animations when switching between sub-tabs

### 3. **Interactive Tooltips**
- **Main Tabs**: Hover to see what the tab contains
- **Sub-Tabs**: Hover to see detailed descriptions
- Tooltips appear above buttons with smooth animations
- Works in both light and dark mode

### 4. **Description Banners**
- Each active sub-tab shows a description banner
- Banner updates automatically when switching sub-tabs
- Provides context about what you're viewing

## 📊 Main Tab Structure

### 1. **Dashboard** (📊)
*View your complete financial overview*

| Sub-Tab | Icon | Description |
|---------|------|-------------|
| **Overview** | 🏠 | Complete snapshot with key metrics and summary cards |
| **Insights** | 💡 | Smart recommendations and spending pattern analysis |
| **Alerts & Warnings** | ⚠️ | Overdraft risks, upcoming bills, and budget health |
| **Accounts** | 💳 | Detailed view of all account balances and activity |
| **Spending Pace** | ⚡ | Spending velocity and paycheck countdown |

### 2. **Income** (💵)
*Manage all income sources and track payments*

| Sub-Tab | Icon | Description |
|---------|------|-------------|
| **Sources** | 💵 | Manage all income sources (employment, freelance, etc.) |
| **Schedule** | 📅 | View paycheck schedules and upcoming payments |
| **Payment History** | 📊 | Complete history of received vs expected income |
| **Trends & Analytics** | 📈 | Income growth trends and year-over-year comparisons |
| **Retirement** | 🏦 | Track retirement contributions and employer matches |

### 3. **Monthly Expenses** (📝)
*Track fixed monthly bills and obligations*

| Sub-Tab | Icon | Description |
|---------|------|-------------|
| **Fixed Expenses** | 📝 | Recurring bills like rent, utilities, insurance |
| **Variable Expenses** | 💸 | Expenses that change monthly (groceries, entertainment) |
| **Categories** | 📊 | Organize and analyze by expense category |
| **Bill Calendar** | 📅 | Calendar view of all bills with due dates |

### 4. **Spending Accounts** (🛒)
*Allocate and track spending in different categories*

| Sub-Tab | Icon | Description |
|---------|------|-------------|
| **Accounts** | 🛒 | Create virtual accounts for spending categories |
| **Transactions** | 💳 | Record and categorize all spending transactions |
| **Category Breakdown** | 📊 | Analyze spending by category vs budget |
| **Trends** | 📈 | View spending patterns and identify trends |

### 5. **Savings** (🏦)
*Monitor savings accounts and contribution progress*

| Sub-Tab | Icon | Description |
|---------|------|-------------|
| **Accounts** | 🏦 | Track all savings accounts and balances |
| **Savings Goals** | 🎯 | Set and track savings targets |
| **Contributions** | 💰 | Record deposits and track contribution history |
| **Analysis** | 📊 | Analyze savings rate and project future growth |

### 6. **Goals** (🎯)
*Set, track, and achieve financial goals*

| Sub-Tab | Icon | Description |
|---------|------|-------------|
| **Active Goals** | 🎯 | View all current goals at a glance |
| **Progress Tracking** | 📊 | Monitor progress with visual indicators |
| **Goal Planning** | 📝 | Create new goals and action plans |
| **Achievements** | 🏆 | Celebrate completed goals and milestones |

### 7. **Reports** (📈)
*Analyze spending patterns and generate reports*

| Sub-Tab | Icon | Description |
|---------|------|-------------|
| **Overview** | 📊 | Comprehensive financial health summary |
| **Spending Analysis** | 💸 | Detailed spending breakdown and trends |
| **Income Analysis** | 💵 | Income sources, growth, and stability analysis |
| **Trends & Patterns** | 📈 | Identify financial trends and behaviors |
| **Net Worth** | 💎 | Track net worth, assets, and liabilities |
| **Export & Print** | 📄 | Generate PDF reports and export data |

## 🎯 How to Use

### Navigation
1. **Click a main tab** at the top to switch between major sections
2. **Click a sub-tab** within that section to view specific features
3. **Hover over tabs** to see tooltips describing their content
4. **Read the description banner** to understand what you're viewing

### Features Currently Available
- ✅ Dashboard Overview (all sub-tabs functional)
- ✅ Income Sources management
- ✅ Income Trends & Analytics (charts and statistics)
- ✅ Income Retirement tracking
- ✅ Monthly Expenses management
- ✅ All navigation and tooltips

### Features Coming Soon
- 🔜 Income Schedule & Payment History
- 🔜 Variable Expenses & Bill Calendar
- 🔜 Spending Accounts (all sub-tabs)
- 🔜 Savings (all sub-tabs)
- 🔜 Goals (all sub-tabs)
- 🔜 Reports (all sub-tabs)

## 🎨 Design Features

### Visual Hierarchy
- **Main tabs**: Larger, top-level navigation
- **Sub-tabs**: Secondary navigation within each section
- **Description banners**: Context for current view

### Responsiveness
- Sub-tab navigation scrolls horizontally on smaller screens
- Tooltips adjust position automatically
- Smooth animations and transitions

### Accessibility
- Clear visual indicators for active tabs
- Hover states for all interactive elements
- Keyboard navigation support
- High contrast in both light and dark modes

### Theme Support
- Full support for light and dark themes
- Tooltips adapt to current theme
- All colors follow theme variables

## 💡 Tips for Best Experience

1. **Explore with tooltips**: Hover over tabs to learn what they contain before clicking
2. **Read descriptions**: The banner at the top of each sub-tab explains its purpose
3. **Organize your workflow**: Use sub-tabs to focus on specific tasks
4. **Less scrolling**: Sub-tabs eliminate the need to scroll through long pages
5. **Quick access**: Jump directly to the feature you need

## 🔧 Technical Implementation

### HTML Structure
```html
<!-- Main Tab -->
<div id="tab-income" class="tab-content">
    <!-- Sub-Tab Navigation -->
    <nav class="sub-tab-nav">
        <button class="sub-tab-btn active" data-subtab="income-sources" data-tooltip="...">
            <span class="sub-tab-icon">💵</span>
            <span class="sub-tab-label">Sources</span>
        </button>
        <!-- More sub-tab buttons... -->
    </nav>
    
    <!-- Description Banner -->
    <div class="sub-tab-description">
        💵 <strong>Sources:</strong> Description text...
    </div>
    
    <!-- Sub-Tab Contents -->
    <div id="subtab-income-sources" class="sub-tab-content active">
        <!-- Content goes here -->
    </div>
    <!-- More sub-tab contents... -->
</div>
```

### CSS Classes
- `.sub-tab-nav` - Navigation container
- `.sub-tab-btn` - Individual sub-tab button
- `.sub-tab-content` - Content container for each sub-tab
- `.sub-tab-description` - Description banner
- `.active` - Currently active tab/content

### JavaScript Functions
- `setupSubTabs(parentTab)` - Initialize sub-tab navigation
- `updateSubTabDescription(subTabName, element)` - Update description text

## 📝 Future Enhancements

Potential improvements for the navigation system:
- Breadcrumb navigation showing current location
- Search function to find specific features
- Keyboard shortcuts for quick navigation
- Recently viewed sub-tabs
- Customizable tab order
- Collapsible sub-tab groups
- Pin favorite sub-tabs

---

**Last Updated**: December 6, 2025  
**Version**: 1.5.10+
