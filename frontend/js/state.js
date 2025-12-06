// Application State Management

// Global state object
const state = {
    // App state
    theme: 'dark',
    currentTab: 'dashboard',
    currentSubTab: null,
    
    // Data state
    accounts: [],
    incomeSources: [],
    expenses: [],
    spendingAccounts: [],
    savingsAccounts: [],
    goals: [],
    
    // Edit state
    currentEditAccountId: null,
    currentEditIncomeId: null,
    currentEditExpenseId: null,
    currentRetirementAccountId: null,
    
    // Chart instances (for cleanup)
    charts: {
        totalIncome: null,
        incomeBySource: null,
        incomeByEarner: null,
        yoyAnnual: null,
        yoyMonthly: null
    },
    
    // Update state
    installerPath: null,
    updateAvailable: false,
    
    // Loading states
    loading: {
        accounts: false,
        income: false,
        expenses: false,
        dashboard: false
    }
};

// State getters
export function getState(key) {
    if (key) {
        return key.split('.').reduce((obj, k) => obj?.[k], state);
    }
    return state;
}

// State setters
export function setState(key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, k) => {
        if (!obj[k]) obj[k] = {};
        return obj[k];
    }, state);
    target[lastKey] = value;
    
    // Trigger state change event
    emitStateChange(key, value);
}

// Update nested state
export function updateState(updates) {
    Object.entries(updates).forEach(([key, value]) => {
        setState(key, value);
    });
}

// State change listeners
const stateListeners = {};

export function onStateChange(key, callback) {
    if (!stateListeners[key]) {
        stateListeners[key] = [];
    }
    stateListeners[key].push(callback);
}

function emitStateChange(key, value) {
    if (stateListeners[key]) {
        stateListeners[key].forEach(callback => callback(value));
    }
}

// Theme state
export function getTheme() {
    return state.theme;
}

export function setTheme(theme) {
    state.theme = theme;
    localStorage.setItem('theme', theme);
    document.querySelector('.app').setAttribute('data-theme', theme);
}

// Loading state helpers
export function setLoading(key, isLoading) {
    setState(`loading.${key}`, isLoading);
}

export function isLoading(key) {
    return getState(`loading.${key}`);
}

// Chart management
export function setChart(name, chartInstance) {
    if (state.charts[name]) {
        state.charts[name].destroy();
    }
    state.charts[name] = chartInstance;
}

export function getChart(name) {
    return state.charts[name];
}

export function destroyChart(name) {
    if (state.charts[name]) {
        state.charts[name].destroy();
        state.charts[name] = null;
    }
}

export function destroyAllCharts() {
    Object.keys(state.charts).forEach(name => {
        destroyChart(name);
    });
}

// Data cache helpers
export function cacheAccounts(accounts) {
    setState('accounts', accounts);
}

export function getCachedAccounts() {
    return getState('accounts');
}

export function cacheIncomeSources(sources) {
    setState('incomeSources', sources);
}

export function getCachedIncomeSources() {
    return getState('incomeSources');
}

export function cacheExpenses(expenses) {
    setState('expenses', expenses);
}

export function getCachedExpenses() {
    return getState('expenses');
}

// Clear all cached data
export function clearCache() {
    setState('accounts', []);
    setState('incomeSources', []);
    setState('expenses', []);
    setState('spendingAccounts', []);
    setState('savingsAccounts', []);
    setState('goals', []);
}

// Export entire state for debugging
export function dumpState() {
    console.log('Current State:', JSON.parse(JSON.stringify(state)));
}
