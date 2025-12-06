# 🎯 Modular Frontend - Quick Reference

## File Responsibilities

| File | Purpose | Key Exports |
|------|---------|-------------|
| **config.js** | Constants & configuration | `API_BASE_URL`, `CHART_COLORS`, `ACCOUNT_TYPES`, etc. |
| **api.js** | Backend communication | `getAccounts()`, `createIncome()`, `deleteExpense()`, etc. |
| **utils.js** | Helper functions | `formatCurrency()`, `formatDate()`, `showNotification()` |
| **state.js** | State management | `getState()`, `setState()`, `onStateChange()` |
| **ui.js** | Core UI functions | `switchTab()`, `showModal()`, `showLoading()` |
| **app.js** | Main entry point | `initializeApp()` |

## Module Structure

```javascript
// modules/[feature].js
import * as API from '../api.js';
import { formatCurrency } from '../utils.js';
import { setState, getState } from '../state.js';

// Module state
let moduleState = {};

// Initialize
export function init() {
    setupEventListeners();
    loadData();
}

// Public functions (exported)
export function loadData() { ... }
export function showModal(id) { ... }

// Private functions (not exported)
function setupEventListeners() { ... }
```

## Common Patterns

### Loading Data
```javascript
export async function loadData() {
    showLoading('container-id', 'Loading...');
    
    try {
        const data = await API.getData();
        displayData(data);
    } catch (error) {
        console.error('Error:', error);
        showError('container-id', 'Failed to load');
    }
}
```

### Showing Modals
```javascript
export function showModal(itemId = null) {
    if (itemId) {
        // Edit mode
        loadItemData(itemId);
    } else {
        // Add mode
        document.getElementById('form').reset();
    }
    
    showModal('modal-id');
}
```

### Form Submission
```javascript
async function handleSubmit(e) {
    e.preventDefault();
    
    const data = {
        field1: document.getElementById('field1').value,
        field2: parseFloat(document.getElementById('field2').value)
    };
    
    try {
        if (editingId) {
            await API.updateItem(editingId, data);
        } else {
            await API.createItem(data);
        }
        
        hideModal('modal-id');
        loadData();
        showNotification('Saved!', 'success');
    } catch (error) {
        showNotification('Failed to save', 'error');
    }
}
```

### Event Listeners
```javascript
function setupEventListeners() {
    // Tab change
    window.addEventListener('tabChange', (e) => {
        if (e.detail.tab === 'mytab') {
            loadData();
        }
    });
    
    // Button click
    document.getElementById('btn').addEventListener('click', handleClick);
    
    // Form submit
    document.getElementById('form').addEventListener('submit', handleSubmit);
}
```

## State Management

```javascript
// Set state
setState('accounts', accounts);
setState('loading.accounts', true);
setState('currentEditId', 123);

// Get state
const accounts = getState('accounts');
const isLoading = getState('loading.accounts');

// Listen to changes
onStateChange('accounts', (accounts) => {
    console.log('Accounts updated:', accounts);
});
```

## API Calls

```javascript
// GET
const accounts = await API.getAccounts();

// POST
const newAccount = await API.createAccount({ name: 'Checking', balance: 1000 });

// PUT
const updated = await API.updateAccount(123, { balance: 2000 });

// DELETE
await API.deleteAccount(123);
```

## Utilities

```javascript
// Format currency
formatCurrency(1234.56) // "$1,234.56"

// Format date
formatDateShort('2025-01-15') // "Jan 15"
formatDateFull('2025-01-15') // "January 15, 2025"

// Show notification
showNotification('Account added!', 'success');
showNotification('Failed to load', 'error');
showNotification('Processing...', 'info');

// Escape HTML
const safe = escapeHtml(userInput);

// Calculate monthly amount
calculateMonthlyAmount(5000, 'biweekly') // 10833.33
```

## UI Functions

```javascript
// Show/hide modals
showModal('my-modal');
hideModal('my-modal');

// Switch tabs
switchTab('dashboard');

// Loading states
showLoading('container', 'Loading...');
showError('container', 'Error message');
showEmptyState('container', '📝', 'No items', { 
    text: 'Add Item', 
    action: 'addItem()' 
});
```

## Chart Functions

```javascript
import * as Charts from './modules/charts.js';

// Render charts
Charts.renderLineChart('canvas-id', chartData);
Charts.renderBarChart('canvas-id', chartData);
Charts.renderPieChart('canvas-id', chartData);

// Update on theme change
Charts.refreshAllChartsOnThemeChange();
```

## Debugging

```javascript
// Access modules from console
window.BudgetApp.modules.Dashboard.loadData();
window.BudgetApp.modules.Income.showModal();

// Dump state
import { dumpState } from './state.js';
dumpState(); // Logs entire state to console
```

## Testing

```javascript
// Test module initialization
BudgetApp.modules.Dashboard.init();

// Test data loading
await BudgetApp.modules.Dashboard.loadData();

// Test modal
BudgetApp.modules.Income.showModal();
BudgetApp.modules.Income.showModal(123); // Edit mode
```

## Migration Checklist

- [ ] Backup original `app.js` → `app-old.js`
- [ ] Update `index.html` script tag: `<script type="module" src="js/app.js"></script>`
- [ ] Test dashboard functionality
- [ ] Test income management
- [ ] Test expense management
- [ ] Migrate spending accounts
- [ ] Migrate savings accounts
- [ ] Migrate goals
- [ ] Migrate reports
- [ ] Test all charts
- [ ] Test theme switching
- [ ] Test auto-updates
- [ ] Remove `app-old.js`

## Performance Tips

1. **Lazy load modules** - Only load when tab is active
2. **Debounce input handlers** - Use `debounce()` utility
3. **Cache API responses** - Use state management
4. **Destroy charts** - Clean up when switching tabs
5. **Batch updates** - Update DOM once, not per item

## Common Issues

| Issue | Solution |
|-------|----------|
| `Cannot use import` | Add `type="module"` to script tag |
| Function not found | Export the function with `export` keyword |
| CORS error | Ensure running through Electron or use local server |
| Chart doesn't update | Call `chart.update()` after data changes |
| Modal won't close | Verify modal ID matches in show/hide calls |
