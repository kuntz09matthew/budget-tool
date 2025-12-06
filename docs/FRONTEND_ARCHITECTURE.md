# Frontend Refactoring Structure

## Architecture Overview

The frontend has been refactored from a monolithic structure into a modular architecture:

### Core Files
- **js/config.js** - Configuration constants and app-wide settings
- **js/api.js** - All API communication with the backend
- **js/utils.js** - Utility functions and helpers
- **js/state.js** - Application state management
- **js/ui.js** - Core UI functions (tabs, theme, modals)
- **js/app.js** - Main application initialization

### Feature Modules (js/modules/)
- **dashboard.js** - Dashboard tab and all sub-tabs
- **income.js** - Income management functionality
- **expenses.js** - Expense tracking functionality
- **spending.js** - Spending accounts module
- **savings.js** - Savings accounts module
- **goals.js** - Financial goals tracking
- **reports.js** - Reports and analytics
- **charts.js** - Chart rendering and management
- **updates.js** - Auto-update functionality

## File Responsibilities

### config.js
- API base URL
- Theme colors
- Chart color schemes
- Icon mappings
- Category definitions
- Frequency multipliers

### api.js
- All fetch() calls to backend
- Request/response handling
- Error handling
- Endpoint management

### utils.js
- Currency formatting
- Date formatting
- HTML escaping
- Mathematical calculations
- Notification system
- DOM helpers

### state.js
- Global application state
- State getters/setters
- Data caching
- State change listeners

### ui.js
- Tab navigation
- Sub-tab navigation
- Theme toggle
- Modal management
- Loading states
- Error displays

### app.js
- App initialization
- Feature module loading
- Event listener setup
- Initial data loading

## Module Pattern

Each module exports functions that can be called from other modules:

```javascript
// Example module structure
import { apiCall } from '../api.js';
import { formatCurrency } from '../utils.js';

let moduleState = {};

export function init() {
    setupEventListeners();
    loadInitialData();
}

export function loadData() {
    // Load module data
}

function setupEventListeners() {
    // Private function
}
```

## Benefits

1. **Maintainability** - Each file has a single, clear responsibility
2. **Scalability** - Easy to add new features without affecting existing code
3. **Testability** - Individual modules can be tested in isolation
4. **Collaboration** - Multiple developers can work on different modules
5. **Performance** - Modules can be lazy-loaded as needed
6. **Debugging** - Easier to trace issues to specific modules

## Migration Strategy

1. Keep original `app.js` as backup
2. Create new modular structure
3. Update `index.html` to load new module system
4. Test each module independently
5. Remove old `app.js` when fully migrated
