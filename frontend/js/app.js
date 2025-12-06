// Main Application Entry Point
import { checkServerHealth } from './api.js';
import { initTheme, setupThemeToggle, setupTabs, updateDashboardDate, showSection, switchTab } from './ui.js';
import { showNotification } from './utils.js';

// Import feature modules
import * as Dashboard from './modules/dashboard.js';
import * as Income from './modules/income.js';
import * as Expenses from './modules/expenses.js';
import * as Spending from './modules/spending.js';
import * as Savings from './modules/savings.js';
import * as Goals from './modules/goals.js';
import * as Reports from './modules/reports.js';
import * as Updates from './modules/updates.js';
import { initializeTabContainers, initializeModalContainers } from './templates.js';

/**
 * Load app version from Electron
 */
function loadAppVersion() {
    if (window.electron) {
        const version = window.electron.getVersion();
        const footerVersion = document.getElementById('footer-version');
        
        if (version && footerVersion) {
            footerVersion.textContent = `v${version}`;
        }
    }
}

/**
 * Check server health on startup
 */
async function performHealthCheck() {
    try {
        const health = await checkServerHealth();
        console.log('Server health check:', health);
    } catch (error) {
        console.error('Server health check failed:', error);
        showNotification('Unable to connect to server. Please restart the app.', 'error');
    }
}

/**
 * Initialize all feature modules
 */
function initializeModules() {
    // Initialize template containers
    initializeTabContainers();
    initializeModalContainers();
    
    // Initialize feature modules (they will inject their HTML)
    if (Dashboard.init) Dashboard.init();
    if (Income.init) Income.init();
    if (Expenses.init) Expenses.init();
    if (Spending.init) Spending.init();
    if (Savings.init) Savings.init();
    if (Goals.init) Goals.init();
    if (Reports.init) Reports.init();
    
    // Initialize update system
    if (Updates.init) Updates.init();
    
    console.log('All modules initialized');
}

/**
 * Setup global event listeners
 */
function setupGlobalListeners() {
    // Listen for navigation events from Electron menu
    if (window.electron && window.electron.onNavigate) {
        window.electron.onNavigate((page) => {
            showSection(page);
        });
    }
}

/**
 * Main initialization function
 */
async function initializeApp() {
    console.log('Initializing Budget App...');
    
    // 1. Initialize theme
    initTheme();
    setupThemeToggle();
    
    // 2. Setup navigation
    setupTabs();
    
    // 3. Update UI elements
    updateDashboardDate();
    loadAppVersion();
    
    // 4. Setup global listeners
    setupGlobalListeners();
    
    // 5. Check server health
    await performHealthCheck();
    
    // 6. Initialize feature modules
    initializeModules();
    
    // 7. Show the default tab (dashboard)
    switchTab('dashboard');
    
    console.log('Budget App initialized successfully!');
}

/**
 * Initialize when DOM is loaded
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export for debugging and global access
window.BudgetApp = {
    version: '2.0.0-modular',
    switchTab: switchTab,  // Export for welcome screen navigation
    modules: {
        Dashboard,
        Income,
        Expenses,
        Spending,
        Savings,
        Goals,
        Reports,
        Updates
    }
};
