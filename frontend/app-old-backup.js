// Base URL for API calls - always use localhost:5000
const API_BASE_URL = 'http://localhost:5000';

// Load app version dynamically
function loadAppVersion() {
    if (window.electron) {
        const version = window.electron.getVersion();
        const footerVersion = document.getElementById('footer-version');
        
        if (version && footerVersion) {
            footerVersion.textContent = `v${version}`;
        }
    }
}

// Initialize app
function initializeApp() {
    // Setup tab navigation
    setupTabs();
    
    // Setup theme toggle
    setupThemeToggle();
    
    // Load current date
    updateDashboardDate();
    
    // Setup Electron update handlers if available
    setupElectronUpdates();
    
    // Load app version dynamically
    loadAppVersion();
    
    // Check server health
    checkServerHealth();
}

// Setup theme toggle
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const app = document.querySelector('.app');
    const themeIcon = document.querySelector('.theme-icon');
    
    // Load saved theme or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    app.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme, themeIcon);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = app.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        app.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme, themeIcon);
    });
}

// Update theme icon
function updateThemeIcon(theme, iconElement) {
    iconElement.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Setup tab navigation
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(`tab-${tabName}`).classList.add('active');
            
            // Setup sub-tabs for the newly activated tab
            setupSubTabs(tabName);
        });
    });
    
    // Setup sub-tabs for the initially active tab (dashboard)
    setupSubTabs('dashboard');
}

// Setup sub-tab navigation
function setupSubTabs(parentTab) {
    const parentTabElement = document.getElementById(`tab-${parentTab}`);
    if (!parentTabElement) return;
    
    const subTabButtons = parentTabElement.querySelectorAll('.sub-tab-btn');
    const subTabContents = parentTabElement.querySelectorAll('.sub-tab-content');
    const descriptionElement = parentTabElement.querySelector('.sub-tab-description');
    
    if (subTabButtons.length === 0) return; // No sub-tabs in this tab
    
    subTabButtons.forEach(button => {
        // Remove any existing listeners by cloning the button
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', () => {
            const subTabName = newButton.getAttribute('data-subtab');
            
            // Remove active class from all sub-tab buttons and contents in this parent tab
            subTabButtons.forEach(btn => {
                const actualBtn = parentTabElement.querySelector(`[data-subtab="${btn.getAttribute('data-subtab')}"]`);
                if (actualBtn) actualBtn.classList.remove('active');
            });
            subTabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked sub-tab button and corresponding content
            newButton.classList.add('active');
            const targetContent = document.getElementById(`subtab-${subTabName}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // Update description
            if (descriptionElement) {
                updateSubTabDescription(subTabName, descriptionElement);
            }
        });
    });
}

// Update sub-tab description based on active sub-tab
function updateSubTabDescription(subTabName, descriptionElement) {
    const descriptions = {
        // Dashboard sub-tabs
        'dashboard-overview': '📊 <strong>Overview:</strong> Get a complete snapshot of your financial health with key metrics, summary cards, and month-over-month comparisons.',
        'dashboard-insights': '💡 <strong>Insights:</strong> Receive personalized recommendations and spending pattern analysis to improve your financial decisions.',
        'dashboard-alerts': '⚠️ <strong>Alerts & Warnings:</strong> Stay informed about overdraft risks, upcoming bills, and budget health with proactive alerts.',
        'dashboard-accounts': '💳 <strong>Accounts:</strong> View detailed balances and recent activity across all your financial accounts in one place.',
        'dashboard-velocity': '⚡ <strong>Spending Pace:</strong> Monitor your spending velocity, daily budget remaining, and countdown to your next paycheck.',
        
        // Income sub-tabs
        'income-sources': '💵 <strong>Sources:</strong> Manage all your income sources including employment, freelance work, and passive income streams.',
        'income-schedule': '📅 <strong>Schedule:</strong> Track paycheck schedules, payment frequencies, and upcoming income deposits.',
        'income-history': '📊 <strong>Payment History:</strong> View complete income payment history and track received vs. expected income.',
        'income-trends': '📈 <strong>Trends & Analytics:</strong> Analyze income patterns, growth trends, and year-over-year comparisons.',
        'income-retirement': '🏦 <strong>Retirement:</strong> Track retirement account contributions, employer matches, and progress toward annual limits.',
        
        // Expenses sub-tabs
        'expenses-fixed': '📝 <strong>Fixed Expenses:</strong> Manage recurring monthly bills like rent, utilities, insurance, and subscriptions.',
        'expenses-variable': '💸 <strong>Variable Expenses:</strong> Track expenses that change month-to-month like groceries and entertainment.',
        'expenses-categories': '📊 <strong>Categories:</strong> Organize and analyze expenses by category to identify spending patterns.',
        'expenses-calendar': '📅 <strong>Bill Calendar:</strong> See all upcoming bills on a calendar view with due date reminders.',
        
        // Spending sub-tabs
        'spending-accounts': '🛒 <strong>Spending Accounts:</strong> Allocate funds to different spending categories and track account balances.',
        'spending-transactions': '💳 <strong>Transactions:</strong> Record and categorize all spending transactions with detailed notes.',
        'spending-categories': '📊 <strong>Category Breakdown:</strong> Analyze spending by category and compare against budgets.',
        'spending-trends': '📈 <strong>Spending Trends:</strong> View spending patterns, identify trends, and spot unusual spending.',
        
        // Savings sub-tabs
        'savings-accounts': '🏦 <strong>Savings Accounts:</strong> Track all savings accounts including emergency fund, vacation fund, and special savings.',
        'savings-goals': '🎯 <strong>Savings Goals:</strong> Set and track progress toward specific savings targets and milestones.',
        'savings-contributions': '💰 <strong>Contributions:</strong> Record deposits, track contribution history, and monitor savings growth.',
        'savings-analysis': '📊 <strong>Savings Analysis:</strong> Analyze savings rate, growth trends, and project future balances.',
        
        // Goals sub-tabs
        'goals-active': '🎯 <strong>Active Goals:</strong> View and manage all your current financial goals in one place.',
        'goals-progress': '📊 <strong>Progress Tracking:</strong> Monitor progress toward each goal with visual progress bars and timelines.',
        'goals-planning': '📝 <strong>Goal Planning:</strong> Create new goals, set targets, and plan actionable steps to achieve them.',
        'goals-achievements': '🏆 <strong>Achievements:</strong> Celebrate completed goals and review your financial accomplishments.',
        
        // Reports sub-tabs
        'reports-overview': '📊 <strong>Overview:</strong> Get a comprehensive view of all key financial metrics and summaries.',
        'reports-spending': '💸 <strong>Spending Analysis:</strong> Detailed breakdown of spending by category, trends, and comparisons.',
        'reports-income': '💵 <strong>Income Analysis:</strong> Analyze income sources, growth patterns, and income stability.',
        'reports-trends': '📈 <strong>Trends & Patterns:</strong> Identify financial trends, seasonal patterns, and spending behaviors.',
        'reports-networth': '💎 <strong>Net Worth:</strong> Track your net worth over time including assets, liabilities, and growth.',
        'reports-export': '📄 <strong>Export & Print:</strong> Generate PDF reports and export data for external analysis.'
    };
    
    descriptionElement.innerHTML = descriptions[subTabName] || '📊 <strong>Loading...</strong> Preparing your financial information.';
}

// Update dashboard date
function updateDashboardDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date().toLocaleDateString('en-US', options);
        dateElement.textContent = today;
    }
}

// Check server health on load
async function checkServerHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        const data = await response.json();
        
        if (data.status) {
            console.log('Server connected:', data.status);
            loadBudgetData();
            checkForUpdates();
        }
    } catch (error) {
        console.log('Server offline - running in offline mode');
    }
}

// Load budget data
async function loadBudgetData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/budget`);
        const data = await response.json();
        
        // Load dashboard metrics
        loadOverdraftStatus();
        loadTotalIncome();
        loadTotalExpenses();
        calculateAvailableSpending();
        loadMonthToDateSpending();
        loadSpendingVelocity();
        loadNextPaycheck();
        loadMoneyPerDay();
        loadBudgetHealthScore();
        loadMonthComparison();
        loadUpcomingBills();
        loadSpendingPatterns();
        loadSmartRecommendations();
        
        console.log('Budget data loaded:', data);
    } catch (error) {
        console.error('Failed to load budget data:', error);
    }
}

// Python auto-updater
let installerPath = null;

async function checkForUpdates() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/updates/check`);
        const data = await response.json();
        
        if (data.available) {
            showUpdateBanner(data);
        }
    } catch (error) {
        console.log('Update check failed:', error);
    }
}

function showUpdateBanner(updateInfo) {
    const updateBanner = document.getElementById('update-banner');
    const updateMessage = document.getElementById('update-message');
    const updateButton = document.getElementById('update-button');
    
    updateBanner.style.display = 'block';
    updateMessage.innerHTML = `
        🎉 New version available: <strong>v${updateInfo.latest}</strong>
        <br>Current version: v${updateInfo.current}
    `;
    updateButton.style.display = 'inline-block';
    updateButton.textContent = 'Download & Install';
    
    updateButton.onclick = async () => {
        updateButton.disabled = true;
        updateButton.textContent = 'Downloading...';
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/updates/download`, { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                installerPath = result.path;
                updateMessage.innerHTML = `
                    ✅ Update downloaded!
                    <br><small>Saved to: ${installerPath}</small>
                `;
                updateButton.textContent = 'Install & Restart';
                updateButton.disabled = false;
                updateButton.onclick = installUpdate;
            } else {
                updateMessage.textContent = '❌ Download failed. Please try again.';
                updateButton.disabled = false;
                updateButton.textContent = 'Retry';
            }
        } catch (error) {
            console.error('Download error:', error);
            updateMessage.textContent = '❌ Download failed. Please try again.';
            updateButton.disabled = false;
        }
    };
}

async function installUpdate() {
    if (!installerPath) return;
    
    try {
        await fetch(`${API_BASE_URL}/api/updates/install`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: installerPath })
        });
        
        // App will close automatically
        document.getElementById('update-message').textContent = 'Installing update...';
    } catch (error) {
        console.error('Install error:', error);
    }
}

// Electron update handlers will be set up in setupElectronUpdates() after DOM is ready

// Navigation handling
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.welcome-section, .budget-section, .next-steps, .status-section').forEach(el => {
        el.style.display = 'none';
    });
    
    // Update nav button states
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    if (section === 'home') {
        document.querySelector('.welcome-section').style.display = 'block';
        document.querySelector('.budget-section').style.display = 'block';
        document.querySelector('.next-steps').style.display = 'block';
        document.getElementById('menu-home').classList.add('active');
    } else if (section === 'status') {
        document.getElementById('status-section').style.display = 'block';
        document.getElementById('menu-status').classList.add('active');
        checkServerHealth(); // Refresh status when viewing
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkServerHealth();
    
    // Refresh data every 30 seconds
    setInterval(loadBudgetData, 30000);
    
    // Navigation event listeners
    document.getElementById('menu-home').addEventListener('click', () => showSection('home'));
    document.getElementById('menu-status').addEventListener('click', () => showSection('status'));
    
    // Refresh status button
    document.getElementById('refresh-status').addEventListener('click', () => {
        checkServerHealth();
    });
    
    // Show home section by default
    showSection('home');
});

// Electron Update Handlers
function setupElectronUpdates() {
    // Check if running in Electron
    if (typeof window.electron === 'undefined') {
        console.log('Not running in Electron, skipping update setup');
        return;
    }
    
    console.log('Setting up Electron update handlers...');
    
    // Listen for update available
    window.electron.onUpdateAvailable((info) => {
        console.log('Update available:', info);
        const updateBanner = document.getElementById('update-banner');
        const updateMessage = document.getElementById('update-message');
        
        updateBanner.style.display = 'block';
        updateMessage.innerHTML = `
            <strong>🎉 Update Available!</strong>
            <br><small>Version ${info.version} is available. The download will start when you click OK in the dialog.</small>
        `;
    });
    
    // Listen for download starting
    window.electron.onUpdateDownloading(() => {
        console.log('Download starting...');
        const updateBanner = document.getElementById('update-banner');
        const updateMessage = document.getElementById('update-message');
        const progressContainer = document.getElementById('progress-container');
        
        updateBanner.style.display = 'block';
        progressContainer.style.display = 'block';
        updateMessage.innerHTML = `
            <strong>📥 Downloading Update...</strong>
            <br><small>Please wait while the update is being downloaded.</small>
        `;
    });
    
    // Listen for update download progress
    window.electron.onUpdateDownloadProgress((progress) => {
        console.log('Download progress:', progress);
        showUpdateProgress(progress);
    });
    
    // Listen for update downloaded
    window.electron.onUpdateDownloaded((info) => {
        console.log('Update downloaded:', info);
        showUpdateReady(info);
    });
    
    // Listen for update errors
    window.electron.onUpdateError((error) => {
        console.error('Update error:', error);
        showUpdateError(error);
    });
}

function showUpdateProgress(progress) {
    const updateBanner = document.getElementById('update-banner');
    const updateMessage = document.getElementById('update-message');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    const progressSize = document.getElementById('progress-size');
    const updateButton = document.getElementById('update-button');
    
    // Show banner and progress
    updateBanner.style.display = 'block';
    progressContainer.style.display = 'block';
    updateButton.style.display = 'none';
    
    // Update progress bar
    const percent = Math.round(progress.percent) || 0;
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    
    // Update size info with speed
    if (progress.transferredMB && progress.totalMB) {
        let sizeText = `${progress.transferredMB} MB / ${progress.totalMB} MB`;
        if (progress.speedMB && progress.speedMB !== '0.00') {
            sizeText += ` (${progress.speedMB} MB/s)`;
        }
        progressSize.textContent = sizeText;
    } else {
        progressSize.textContent = 'Starting download...';
    }
    
    // Update message with current status
    updateMessage.innerHTML = `
        <strong>📥 Downloading Update... ${percent}%</strong>
        <br><small>Please wait while the update is being downloaded. Do not close the application.</small>
    `;
}

function showUpdateReady(info) {
    const updateBanner = document.getElementById('update-banner');
    const updateMessage = document.getElementById('update-message');
    const progressContainer = document.getElementById('progress-container');
    const updateButton = document.getElementById('update-button');
    
    // Hide progress, show button
    progressContainer.style.display = 'none';
    updateButton.style.display = 'inline-block';
    updateButton.textContent = 'Restart & Install';
    
    updateMessage.innerHTML = `
        <strong>✅ Update Downloaded!</strong>
        <br><small>Version ${info.version} is ready to install.</small>
    `;
    
    updateButton.onclick = () => {
        if (window.electron && window.electron.installUpdate) {
            window.electron.installUpdate();
        }
    };
}

function showUpdateError(error) {
    const updateBanner = document.getElementById('update-banner');
    const updateMessage = document.getElementById('update-message');
    const progressContainer = document.getElementById('progress-container');
    const updateButton = document.getElementById('update-button');
    
    progressContainer.style.display = 'none';
    updateButton.style.display = 'none';
    
    updateMessage.innerHTML = `
        <strong>❌ Update Failed</strong>
        <br><small>${error}</small>
    `;
    
    // Hide banner after 10 seconds
    setTimeout(() => {
        updateBanner.style.display = 'none';
    }, 10000);
}

// Listen for navigation events from menu
if (window.electron && window.electron.onNavigate) {
    window.electron.onNavigate((page) => {
        const tabButton = document.querySelector(`.tab-btn[data-tab="${page}"]`);
        if (tabButton) {
            tabButton.click();
        }
    });
}

// ============================================
// ACCOUNT MANAGEMENT
// ============================================

let currentEditAccountId = null;

// Load and display accounts with loading state and error handling
async function loadAccounts() {
    const container = document.getElementById('accounts-container');
    
    try {
        // Show loading state
        container.innerHTML = '<div class="loading-spinner">Loading accounts...</div>';
        
        const response = await fetch(`${API_BASE_URL}/api/accounts`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const accounts = await response.json();
        displayAccounts(accounts);
        updateAccountSummaries(accounts);
        
        // Also load account summary
        loadAccountSummary();
        
        // Reload overdraft status when accounts change
        loadOverdraftStatus();
    } catch (error) {
        console.error('Failed to load accounts:', error);
        container.innerHTML = `
            <div class="error-message">
                <p>⚠️ Failed to load accounts</p>
                <button class="btn-primary btn-sm" onclick="loadAccounts()">Retry</button>
            </div>
        `;
    }
}

// Load account summary (totals by type)
async function loadAccountSummary() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/accounts/summary`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const summary = await response.json();
        updateDashboardSummaryCards(summary);
    } catch (error) {
        console.error('Failed to load account summary:', error);
    }
}

// Update dashboard summary cards with account data
function updateDashboardSummaryCards(summary) {
    // Update total savings card (savings + investment)
    const savingsCard = document.querySelector('.savings-card .summary-amount');
    if (savingsCard) {
        const totalSavings = summary.savings_total + summary.investment_total;
        savingsCard.textContent = `$${formatCurrency(totalSavings)}`;
    }
    
    // Update available to spend (if income is loaded, we'll calculate it properly)
    updateAvailableToSpend();
}

// Display accounts in the dashboard with enhanced UI
function displayAccounts(accounts) {
    const container = document.getElementById('accounts-container');
    
    if (!accounts || accounts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💳</div>
                <p class="empty-state-text">No accounts added yet</p>
                <p class="empty-state-subtext">Add your checking, savings, credit cards, and investment accounts to get started</p>
            </div>
        `;
        return;
    }
    
    // Sort accounts by type for better organization
    const sortOrder = { 'checking': 1, 'savings': 2, 'investment': 3, 'credit': 4 };
    const sortedAccounts = [...accounts].sort((a, b) => {
        return (sortOrder[a.type] || 999) - (sortOrder[b.type] || 999);
    });
    
    container.innerHTML = sortedAccounts.map(account => {
        const accountIcon = getAccountIcon(account.type);
        const balanceClass = getBalanceClass(account.type, account.balance);
        const formattedBalance = formatCurrency(account.balance);
        const accountTypeLabel = formatAccountType(account.type);
        
        // Sanitize account name for display
        const accountName = escapeHtml(account.name);
        
        return `
            <div class="account-card ${account.type}-account" data-account-id="${account.id}">
                <div class="account-header">
                    <span class="account-icon">${accountIcon}</span>
                    <h4 class="account-name">${accountName}</h4>
                </div>
                <div class="account-balance ${balanceClass}">
                    $${formattedBalance}
                </div>
                <div class="account-footer">
                    <span class="account-type-label">${accountTypeLabel}</span>
                    <div class="account-actions">
                        <button class="btn-icon" onclick="editAccount(${account.id})" title="Edit account" aria-label="Edit ${accountName}">
                            ✏️
                        </button>
                        <button class="btn-icon btn-danger" onclick="deleteAccount(${account.id})" title="Delete account" aria-label="Delete ${accountName}">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Update summary cards with account data
function updateAccountSummaries(accounts) {
    const checking = accounts.filter(a => a.type === 'checking').reduce((sum, a) => sum + parseFloat(a.balance), 0);
    const savings = accounts.filter(a => a.type === 'savings').reduce((sum, a) => sum + parseFloat(a.balance), 0);
    const credit = accounts.filter(a => a.type === 'credit').reduce((sum, a) => sum + parseFloat(a.balance), 0);
    const investment = accounts.filter(a => a.type === 'investment').reduce((sum, a) => sum + parseFloat(a.balance), 0);
    
    // Update total savings card (savings + investment)
    const savingsCard = document.querySelector('.savings-card .summary-amount');
    if (savingsCard) {
        savingsCard.textContent = `$${formatCurrency(savings + investment)}`;
    }
}

// Update available to spend calculation
async function updateAvailableToSpend() {
    try {
        // Get total monthly income
        const incomeResponse = await fetch(`${API_BASE_URL}/api/income/total`);
        const incomeData = await incomeResponse.json();
        const totalIncome = incomeData.total || 0;
        
        // Get total fixed expenses (when implemented)
        // For now, set to 0
        const totalExpenses = 0;
        
        // Get account summary
        const summaryResponse = await fetch(`${API_BASE_URL}/api/accounts/summary`);
        const summary = await summaryResponse.json();
        
        // Calculate available to spend: Income - Fixed Expenses
        const availableToSpend = totalIncome - totalExpenses;
        
        // Update the card
        const availableCard = document.querySelector('.available-card .summary-amount');
        if (availableCard) {
            availableCard.textContent = `$${formatCurrency(availableToSpend)}`;
            
            // Add color coding based on amount
            if (availableToSpend < 0) {
                availableCard.style.color = 'var(--danger-color, #dc3545)';
            } else if (availableToSpend < 100) {
                availableCard.style.color = 'var(--warning-color, #ffc107)';
            } else {
                availableCard.style.color = 'var(--success-color, #28a745)';
            }
        }
    } catch (error) {
        console.error('Failed to calculate available to spend:', error);
    }
}

// Get icon for account type
function getAccountIcon(type) {
    const icons = {
        'checking': '💵',
        'savings': '🏦',
        'credit': '💳',
        'investment': '📈'
    };
    return icons[type] || '💰';
}

// Get balance class for styling (negative for credit cards)
function getBalanceClass(type, balance) {
    if (type === 'credit' && balance > 0) {
        return 'negative-balance';
    }
    return '';
}

// Format account type for display
function formatAccountType(type) {
    const types = {
        'checking': 'Checking Account',
        'savings': 'Savings Account',
        'credit': 'Credit Card',
        'investment': 'Investment Account'
    };
    return types[type] || type;
}

// Format currency
function formatCurrency(amount) {
    return parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Show account modal
function showAccountModal(accountId = null) {
    const modal = document.getElementById('account-modal');
    const title = document.getElementById('account-modal-title');
    const form = document.getElementById('account-form');
    
    currentEditAccountId = accountId;
    
    if (accountId) {
        title.textContent = 'Edit Account';
        // Load account data
        loadAccountData(accountId);
    } else {
        title.textContent = 'Add Account';
        form.reset();
    }
    
    modal.style.display = 'flex';
}

// Hide account modal
function hideAccountModal() {
    const modal = document.getElementById('account-modal');
    modal.style.display = 'none';
    currentEditAccountId = null;
    document.getElementById('account-form').reset();
}

// Load account data for editing
async function loadAccountData(accountId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/accounts`);
        const accounts = await response.json();
        const account = accounts.find(a => a.id === accountId);
        
        if (account) {
            document.getElementById('account-type').value = account.type;
            document.getElementById('account-name').value = account.name;
            document.getElementById('account-balance').value = account.balance;
        }
    } catch (error) {
        console.error('Failed to load account data:', error);
    }
}

// Save account (add or update) with enhanced validation and feedback
async function saveAccount(event) {
    event.preventDefault();
    
    const saveButton = document.getElementById('save-account-btn');
    const originalButtonText = saveButton.textContent;
    
    try {
        // Get form values
        const type = document.getElementById('account-type').value.trim();
        const name = document.getElementById('account-name').value.trim();
        const balanceInput = document.getElementById('account-balance').value.trim();
        
        // Client-side validation
        if (!type) {
            showAccountError('Please select an account type');
            return;
        }
        
        if (!name) {
            showAccountError('Please enter an account name');
            return;
        }
        
        if (name.length < 2) {
            showAccountError('Account name must be at least 2 characters');
            return;
        }
        
        if (name.length > 50) {
            showAccountError('Account name must be less than 50 characters');
            return;
        }
        
        if (!balanceInput) {
            showAccountError('Please enter a balance');
            return;
        }
        
        const balance = parseFloat(balanceInput);
        if (isNaN(balance)) {
            showAccountError('Balance must be a valid number');
            return;
        }
        
        // Construct account data
        const accountData = {
            type: type,
            name: name,
            balance: balance
        };
        
        // Show loading state
        saveButton.disabled = true;
        saveButton.textContent = currentEditAccountId ? 'Updating...' : 'Saving...';
        
        let response;
        if (currentEditAccountId) {
            // Update existing account
            response = await fetch(`${API_BASE_URL}/api/accounts/${currentEditAccountId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(accountData)
            });
        } else {
            // Add new account
            response = await fetch(`${API_BASE_URL}/api/accounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(accountData)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Success! Close modal and reload
            hideAccountModal();
            await loadAccounts();
            
            // Show success message
            showNotification(
                currentEditAccountId ? 'Account updated successfully!' : 'Account added successfully!',
                'success'
            );
        } else {
            // Server returned an error
            showAccountError(result.error || 'Failed to save account');
        }
    } catch (error) {
        console.error('Failed to save account:', error);
        showAccountError('Failed to save account. Please check your connection and try again.');
    } finally {
        // Restore button state
        saveButton.disabled = false;
        saveButton.textContent = originalButtonText;
    }
}

// Show error in account modal
function showAccountError(message) {
    const form = document.getElementById('account-form');
    
    // Remove existing error if present
    const existingError = form.querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.textContent = message;
    form.insertBefore(errorDiv, form.firstChild);
    
    // Remove error after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Show notification toast
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Edit account
function editAccount(accountId) {
    showAccountModal(accountId);
}

// Delete account with enhanced confirmation and feedback
async function deleteAccount(accountId) {
    // Find the account to get its name
    let accountName = 'this account';
    try {
        const response = await fetch(`${API_BASE_URL}/api/accounts`);
        if (response.ok) {
            const accounts = await response.json();
            const account = accounts.find(a => a.id === accountId);
            if (account) {
                accountName = account.name;
            }
        }
    } catch (error) {
        console.error('Failed to fetch account details:', error);
    }
    
    // Confirm deletion with account name
    if (!confirm(`Are you sure you want to delete "${accountName}"?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/accounts/${accountId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            await loadAccounts();
            showNotification('Account deleted successfully', 'success');
        } else {
            throw new Error(result.error || 'Failed to delete account');
        }
    } catch (error) {
        console.error('Failed to delete account:', error);
        showNotification('Failed to delete account. Please try again.', 'error');
    }
}

// Setup account event listeners
function setupAccountListeners() {
    // Add account button
    const addAccountBtn = document.getElementById('add-account-btn');
    if (addAccountBtn) {
        addAccountBtn.addEventListener('click', () => showAccountModal());
    }
    
    // Close modal buttons
    const closeModalBtn = document.getElementById('close-account-modal');
    const cancelBtn = document.getElementById('cancel-account-btn');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideAccountModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideAccountModal);
    }
    
    // Form submission
    const accountForm = document.getElementById('account-form');
    if (accountForm) {
        accountForm.addEventListener('submit', saveAccount);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('account-modal');
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                hideAccountModal();
            }
        });
    }
}

// ============================================
// INCOME MANAGEMENT
// ============================================

let currentEditIncomeId = null;

// Load and display total monthly income
async function loadTotalIncome() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/income/total`);
        const data = await response.json();
        updateIncomeDisplay(data.total);
    } catch (error) {
        console.error('Failed to load total income:', error);
    }
}

// Update income display on dashboard
function updateIncomeDisplay(total) {
    const incomeCard = document.querySelector('.income-card .summary-amount');
    if (incomeCard) {
        incomeCard.textContent = `$${formatCurrency(total)}`;
    }
    
    // Update income page total if element exists
    const incomeTotalDisplay = document.getElementById('income-total-display');
    if (incomeTotalDisplay) {
        incomeTotalDisplay.textContent = `$${formatCurrency(total)}`;
    }
    
    // After updating income, recalculate available spending money
    calculateAvailableSpending();
}

// Load and display total monthly fixed expenses
async function loadTotalExpenses() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/expenses/total`);
        const data = await response.json();
        updateExpensesDisplay(data.total);
    } catch (error) {
        console.error('Failed to load total expenses:', error);
    }
}

// Update expenses display on dashboard
function updateExpensesDisplay(total) {
    const expenseCard = document.querySelector('.expense-card .summary-amount');
    if (expenseCard) {
        expenseCard.textContent = `$${formatCurrency(total)}`;
    }
    
    // Update expenses page total if element exists
    const expenseTotalDisplay = document.getElementById('expense-total-display');
    if (expenseTotalDisplay) {
        expenseTotalDisplay.textContent = `$${formatCurrency(total)}`;
    }
    
    // After updating expenses, recalculate available spending money
    calculateAvailableSpending();
}

// Calculate and display available spending money
async function calculateAvailableSpending() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/available-spending`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update display
        const availableCard = document.querySelector('.available-card .summary-amount');
        const availableLabel = document.querySelector('.available-card .summary-label');
        
        if (availableCard) {
            availableCard.textContent = `$${formatCurrency(data.available)}`;
            
            // Add color coding based on status from backend
            const availableCardParent = document.querySelector('.available-card');
            
            // Remove previous status classes
            availableCardParent.classList.remove('status-success', 'status-warning', 'status-danger');
            
            // Add appropriate status class
            if (data.status === 'danger') {
                availableCardParent.classList.add('status-danger');
                availableCard.style.color = '#ff4444';
            } else if (data.status === 'warning') {
                availableCardParent.classList.add('status-warning');
                availableCard.style.color = '#ff9800';
            } else {
                availableCardParent.classList.add('status-success');
                availableCard.style.color = '#4caf50';
            }
            
            // Update label with status message
            if (availableLabel) {
                availableLabel.textContent = data.message;
            }
        }
        
        console.log('Available spending calculated:', data);
    } catch (error) {
        console.error('Failed to calculate available spending:', error);
        
        // Fallback to showing $0.00 if API fails
        const availableCard = document.querySelector('.available-card .summary-amount');
        if (availableCard) {
            availableCard.textContent = '$0.00';
        }
    }
}

// Load and display month-to-date spending
async function loadMonthToDateSpending() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/transactions/month-to-date`);
        const data = await response.json();
        
        // Update total spent
        const mtdTotal = document.getElementById('mtd-total');
        if (mtdTotal) {
            mtdTotal.textContent = `$${formatCurrency(data.total)}`;
        }
        
        // Update transaction count
        const mtdCount = document.getElementById('mtd-count');
        if (mtdCount) {
            mtdCount.textContent = data.count;
        }
        
        // Update average per day
        const mtdAverage = document.getElementById('mtd-average');
        if (mtdAverage) {
            mtdAverage.textContent = `$${formatCurrency(data.average_per_day)}`;
        }
        
        // Update date range
        const mtdDateRange = document.getElementById('mtd-date-range');
        if (mtdDateRange) {
            const now = new Date();
            const monthName = now.toLocaleString('default', { month: 'long' });
            mtdDateRange.textContent = `${monthName} 1 - ${now.getDate()}, ${now.getFullYear()}`;
        }
    } catch (error) {
        console.error('Failed to load month-to-date spending:', error);
    }
}

// Load and display spending velocity indicator
async function loadSpendingVelocity() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/spending-velocity`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update velocity status
        const velocityStatus = document.getElementById('velocity-status');
        const velocityIcon = document.getElementById('velocity-icon');
        const velocityStatusText = document.getElementById('velocity-status-text');
        
        if (velocityStatus && velocityIcon && velocityStatusText) {
            // Remove all status classes
            velocityStatus.classList.remove('status-success', 'status-warning', 'status-danger');
            
            // Add appropriate status class
            velocityStatus.classList.add(`status-${data.status}`);
            
            // Update icon based on status
            const icons = {
                'success': '✅',
                'warning': '⚠️',
                'danger': '🚨'
            };
            velocityIcon.textContent = icons[data.status] || '⏱️';
            
            // Update status text
            velocityStatusText.textContent = data.status_text;
        }
        
        // Update velocity details
        const velocityActual = document.getElementById('velocity-actual');
        const velocityTarget = document.getElementById('velocity-target');
        const velocityDays = document.getElementById('velocity-days');
        
        if (velocityActual) {
            velocityActual.textContent = `$${formatCurrency(data.actual_daily_rate)}/day`;
        }
        
        if (velocityTarget) {
            velocityTarget.textContent = `$${formatCurrency(data.safe_daily_rate)}/day`;
        }
        
        if (velocityDays) {
            const dayText = data.days_remaining === 1 ? 'day' : 'days';
            velocityDays.textContent = `${data.days_remaining} ${dayText}`;
        }
        
        // Update velocity message
        const velocityMessage = document.getElementById('velocity-message');
        if (velocityMessage) {
            velocityMessage.textContent = data.message;
        }
        
        // Update projection
        const velocityProjection = document.getElementById('velocity-projection');
        const velocityProjected = document.getElementById('velocity-projected');
        
        if (velocityProjection && velocityProjected) {
            // Show projection if there's transaction data
            if (data.transaction_count > 0) {
                velocityProjection.style.display = 'block';
                
                const projectedValue = data.projected_remaining;
                velocityProjected.textContent = `$${formatCurrency(Math.abs(projectedValue))} ${projectedValue >= 0 ? 'remaining' : 'over budget'}`;
                
                // Remove old classes
                velocityProjected.classList.remove('positive', 'negative');
                
                // Add appropriate class
                if (projectedValue >= 0) {
                    velocityProjected.classList.add('positive');
                } else {
                    velocityProjected.classList.add('negative');
                }
            } else {
                velocityProjection.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error('Failed to load spending velocity:', error);
        
        // Show error state in UI
        const velocityMessage = document.getElementById('velocity-message');
        if (velocityMessage) {
            velocityMessage.textContent = 'Unable to calculate velocity. Add income and transactions to get started.';
        }
    }
}

// Load and display next paycheck countdown
async function loadNextPaycheck() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/next-paycheck`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        const paycheckContainer = document.getElementById('paycheck-container');
        const paycheckCountdown = document.getElementById('paycheck-countdown');
        const paycheckDetails = document.getElementById('paycheck-details');
        const paycheckMessage = document.getElementById('paycheck-message');
        
        if (!data.has_paycheck) {
            // No paycheck configured - show message
            if (paycheckCountdown) paycheckCountdown.style.display = 'none';
            if (paycheckDetails) paycheckDetails.style.display = 'none';
            if (paycheckMessage) {
                paycheckMessage.style.display = 'block';
                paycheckMessage.textContent = data.message || 'Add income sources with pay dates to see your next paycheck countdown';
            }
            return;
        }
        
        // Update countdown display
        const paycheckDays = document.getElementById('paycheck-days');
        if (paycheckDays) {
            paycheckDays.textContent = data.days_until;
        }
        
        // Update paycheck details
        const paycheckDate = document.getElementById('paycheck-date');
        const paycheckSource = document.getElementById('paycheck-source');
        const paycheckAmount = document.getElementById('paycheck-amount');
        
        if (paycheckDate) {
            paycheckDate.textContent = data.formatted_date;
        }
        
        if (paycheckSource) {
            paycheckSource.textContent = data.source;
        }
        
        if (paycheckAmount) {
            paycheckAmount.textContent = `$${formatCurrency(data.amount)}`;
        }
        
        // Show appropriate sections
        if (paycheckCountdown) paycheckCountdown.style.display = 'flex';
        if (paycheckDetails) paycheckDetails.style.display = 'block';
        if (paycheckMessage) paycheckMessage.style.display = 'none';
        
        // Apply color coding based on days until payday
        if (paycheckContainer) {
            paycheckContainer.classList.remove('paycheck-soon', 'paycheck-today', 'paycheck-upcoming');
            
            if (data.days_until === 0) {
                paycheckContainer.classList.add('paycheck-today');
            } else if (data.days_until <= 3) {
                paycheckContainer.classList.add('paycheck-soon');
            } else {
                paycheckContainer.classList.add('paycheck-upcoming');
            }
        }
        
    } catch (error) {
        console.error('Failed to load next paycheck:', error);
        
        // Show error state
        const paycheckMessage = document.getElementById('paycheck-message');
        if (paycheckMessage) {
            paycheckMessage.style.display = 'block';
            paycheckMessage.textContent = 'Unable to calculate next paycheck. Add income sources with pay dates to get started.';
        }
    }
}

// Load and display overdraft warning status
async function loadOverdraftStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/overdraft-status`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Get the overdraft warning element
        const overdraftWarning = document.getElementById('overdraft-warning');
        if (!overdraftWarning) return;
        
        // Remove old risk level classes
        overdraftWarning.classList.remove('risk-critical', 'risk-warning', 'risk-safe');
        
        // Add new risk level class
        overdraftWarning.classList.add(`risk-${data.risk_level}`);
        
        // Update icon
        const iconElement = document.getElementById('overdraft-icon');
        if (iconElement) {
            iconElement.textContent = data.alert_icon;
        }
        
        // Update warnings
        const warningsContainer = document.getElementById('overdraft-warnings');
        if (warningsContainer && data.warnings && data.warnings.length > 0) {
            warningsContainer.innerHTML = '';
            data.warnings.forEach(warning => {
                const warningDiv = document.createElement('div');
                warningDiv.className = 'overdraft-warning-message';
                warningDiv.innerHTML = `
                    <span class="overdraft-warning-message-icon">${data.alert_icon}</span>
                    <span class="overdraft-warning-message-text">${warning}</span>
                `;
                warningsContainer.appendChild(warningDiv);
            });
        }
        
        // Update recommendations
        const recommendationsList = document.getElementById('overdraft-recommendations-list');
        if (recommendationsList && data.recommendations && data.recommendations.length > 0) {
            recommendationsList.innerHTML = '';
            data.recommendations.forEach(recommendation => {
                const li = document.createElement('li');
                li.textContent = recommendation;
                recommendationsList.appendChild(li);
            });
        }
        
        // Update metrics
        const metricsContainer = document.getElementById('overdraft-metrics');
        if (metricsContainer && data.metrics) {
            metricsContainer.innerHTML = '';
            
            // Define which metrics to show
            const metricsToShow = [
                { key: 'checking_balance', label: 'Checking', format: 'currency', checkSign: true },
                { key: 'savings_balance', label: 'Savings', format: 'currency', checkSign: true },
                { key: 'remaining_money', label: 'Remaining', format: 'currency', checkSign: true },
                { key: 'upcoming_bills', label: 'Bills Due Soon', format: 'currency', checkSign: false },
                { key: 'days_remaining', label: 'Days Left', format: 'number', checkSign: false }
            ];
            
            metricsToShow.forEach(metric => {
                const value = data.metrics[metric.key];
                if (value !== undefined && value !== null) {
                    const metricDiv = document.createElement('div');
                    metricDiv.className = 'overdraft-metric';
                    
                    let displayValue = value;
                    let valueClass = 'neutral';
                    
                    if (metric.format === 'currency') {
                        displayValue = `$${formatCurrency(Math.abs(value))}`;
                        if (value < 0) displayValue = `-${displayValue}`;
                        
                        if (metric.checkSign) {
                            if (value > 0) valueClass = 'positive';
                            else if (value < 0) valueClass = 'negative';
                        }
                    } else if (metric.format === 'number') {
                        displayValue = Math.round(value);
                    }
                    
                    metricDiv.innerHTML = `
                        <span class="overdraft-metric-label">${metric.label}</span>
                        <span class="overdraft-metric-value ${valueClass}">${displayValue}</span>
                    `;
                    metricsContainer.appendChild(metricDiv);
                }
            });
        }
        
        // Show the overdraft warning section
        overdraftWarning.style.display = 'block';
        
    } catch (error) {
        console.error('Failed to load overdraft status:', error);
        
        // Hide the overdraft warning on error
        const overdraftWarning = document.getElementById('overdraft-warning');
        if (overdraftWarning) {
            overdraftWarning.style.display = 'none';
        }
    }
}

// Load and display money left per day
async function loadMoneyPerDay() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/money-per-day`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update the main display amount
        const moneyPerDayAmount = document.getElementById('money-per-day-amount');
        if (moneyPerDayAmount) {
            moneyPerDayAmount.textContent = `$${formatCurrency(data.money_per_day)}`;
        }
        
        // Update status indicator
        const statusIndicator = document.getElementById('money-per-day-indicator');
        const statusIcon = document.getElementById('money-per-day-icon');
        const statusText = document.getElementById('money-per-day-status-text');
        
        if (statusIndicator && statusIcon && statusText) {
            // Remove old status classes
            statusIndicator.classList.remove('status-success', 'status-warning', 'status-danger');
            
            // Add new status class
            statusIndicator.classList.add(`status-${data.status}`);
            
            // Update icon based on status
            const icons = {
                'success': '✅',
                'warning': '⚠️',
                'danger': '🚨'
            };
            statusIcon.textContent = icons[data.status] || '💰';
            
            // Update status text
            statusText.textContent = data.status_text;
        }
        
        // Update details
        const remainingElement = document.getElementById('money-per-day-remaining');
        const daysElement = document.getElementById('money-per-day-days');
        
        if (remainingElement) {
            const remaining = data.remaining_money;
            remainingElement.textContent = `$${formatCurrency(Math.abs(remaining))}`;
            
            // Add positive/negative class
            remainingElement.classList.remove('positive', 'negative');
            if (remaining >= 0) {
                remainingElement.classList.add('positive');
            } else {
                remainingElement.classList.add('negative');
            }
        }
        
        if (daysElement) {
            const dayText = data.days_until_paycheck === 1 ? 'day' : 'days';
            daysElement.textContent = `${data.days_until_paycheck} ${dayText}`;
        }
        
        // Update message
        const messageElement = document.getElementById('money-per-day-message');
        if (messageElement) {
            messageElement.textContent = data.message;
        }
        
        // Show/hide sections based on data availability
        const displayElement = document.getElementById('money-per-day-display');
        const detailsElement = document.getElementById('money-per-day-details');
        const statusElement = document.getElementById('money-per-day-status');
        
        if (data.available_for_month === 0 && data.mtd_spent === 0) {
            // No data yet - show message only
            if (displayElement) displayElement.style.display = 'none';
            if (detailsElement) detailsElement.style.display = 'none';
            if (statusElement) statusElement.style.display = 'none';
            if (messageElement) messageElement.style.display = 'block';
        } else {
            // Has data - show all info
            if (displayElement) displayElement.style.display = 'flex';
            if (detailsElement) detailsElement.style.display = 'block';
            if (statusElement) statusElement.style.display = 'block';
            if (messageElement) messageElement.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Failed to load money per day:', error);
        
        // Show error state
        const messageElement = document.getElementById('money-per-day-message');
        if (messageElement) {
            messageElement.style.display = 'block';
            messageElement.textContent = 'Unable to calculate daily budget. Add income and transactions to get started.';
        }
        
        // Hide other elements
        const displayElement = document.getElementById('money-per-day-display');
        const detailsElement = document.getElementById('money-per-day-details');
        const statusElement = document.getElementById('money-per-day-status');
        
        if (displayElement) displayElement.style.display = 'none';
        if (detailsElement) detailsElement.style.display = 'none';
        if (statusElement) statusElement.style.display = 'none';
    }
}

// Load and display budget health score
async function loadBudgetHealthScore() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/budget-health-score`);
        const data = await response.json();
        
        // Update main score display
        const scoreNumber = document.getElementById('health-score-number');
        const scoreCircle = document.getElementById('health-score-circle');
        const gradeElement = document.getElementById('health-grade');
        const gradeText = document.getElementById('health-grade-text');
        
        if (scoreNumber) {
            scoreNumber.textContent = data.score;
        }
        
        if (scoreCircle) {
            scoreCircle.style.borderColor = data.color;
            scoreCircle.style.background = `conic-gradient(${data.color} ${data.score * 3.6}deg, var(--card-bg) 0deg)`;
        }
        
        if (gradeElement) {
            gradeElement.textContent = `${data.icon} ${data.grade}`;
            gradeElement.style.color = data.color;
        }
        
        if (gradeText) {
            gradeText.textContent = data.grade_text;
        }
        
        // Update breakdown sections
        const breakdownMap = {
            'account_health': 'account',
            'spending_adherence': 'spending',
            'savings_rate': 'savings',
            'bill_payment': 'bill',
            'setup_completeness': 'setup'
        };
        
        for (const [key, shortName] of Object.entries(breakdownMap)) {
            const categoryData = data.breakdown[key];
            
            // Update score
            const scoreElement = document.getElementById(`health-${shortName}-score`);
            if (scoreElement) {
                scoreElement.textContent = `${categoryData.score}/${categoryData.max}`;
            }
            
            // Update progress bar
            const progressElement = document.getElementById(`health-${shortName}-progress`);
            if (progressElement) {
                const percentage = (categoryData.score / categoryData.max) * 100;
                progressElement.style.width = `${percentage}%`;
                
                // Color code the progress bar
                if (percentage >= 80) {
                    progressElement.style.backgroundColor = '#10b981'; // Green
                } else if (percentage >= 60) {
                    progressElement.style.backgroundColor = '#3b82f6'; // Blue
                } else if (percentage >= 40) {
                    progressElement.style.backgroundColor = '#f59e0b'; // Amber
                } else {
                    progressElement.style.backgroundColor = '#ef4444'; // Red
                }
            }
            
            // Update factors list
            const factorsElement = document.getElementById(`health-${shortName}-factors`);
            if (factorsElement && categoryData.factors && categoryData.factors.length > 0) {
                factorsElement.innerHTML = categoryData.factors
                    .map(factor => `<li>${factor}</li>`)
                    .join('');
            }
        }
        
        // Update recommendations
        const recommendationsList = document.getElementById('health-recommendations-list');
        if (recommendationsList && data.recommendations && data.recommendations.length > 0) {
            recommendationsList.innerHTML = data.recommendations
                .map(rec => `<li>${rec}</li>`)
                .join('');
        }
        
    } catch (error) {
        console.error('Failed to load budget health score:', error);
        
        // Show error state
        const scoreNumber = document.getElementById('health-score-number');
        const gradeText = document.getElementById('health-grade-text');
        
        if (scoreNumber) {
            scoreNumber.textContent = '--';
        }
        
        if (gradeText) {
            gradeText.textContent = 'Unable to calculate';
        }
    }
}

// Load and display month comparison
async function loadMonthComparison() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/month-comparison`);
        const data = await response.json();
        
        // Always show the comparison section
        const section = document.getElementById('month-comparison-section');
        if (section) {
            section.style.display = 'block';
        }
        
        // If no data, show empty state
        if (!data.has_data) {
            const comparisonGrid = document.getElementById('comparison-grid');
            if (comparisonGrid) {
                comparisonGrid.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <div class="empty-state-icon">📊</div>
                        <p class="empty-state-text">No comparison data yet</p>
                        <p class="empty-state-subtext">Add transactions to your budget to see month-over-month comparisons</p>
                    </div>
                `;
            }
            
            const insightsContainer = document.getElementById('comparison-insights');
            if (insightsContainer) {
                insightsContainer.innerHTML = '';
            }
            return;
        }
        
        // Update subtitle with month names
        const subtitle = document.getElementById('comparison-subtitle');
        if (subtitle && data.current_month && data.previous_month) {
            subtitle.textContent = `${data.current_month.month_name} vs. ${data.previous_month.month_name}`;
        }
        
        // Build comparison cards
        const comparisonGrid = document.getElementById('comparison-grid');
        if (comparisonGrid) {
            const cards = [
                {
                    title: 'Monthly Spending',
                    icon: '💳',
                    data: data.spending,
                    goodDirection: 'down'
                },
                {
                    title: 'Net Savings',
                    icon: '💰',
                    data: data.savings,
                    goodDirection: 'up'
                },
                {
                    title: 'Transactions',
                    icon: '🛒',
                    data: data.transaction_count,
                    goodDirection: 'neutral',
                    hidePercent: false
                },
                {
                    title: 'Total Income',
                    icon: '💵',
                    data: data.income,
                    goodDirection: 'up'
                }
            ];
            
            comparisonGrid.innerHTML = cards.map(card => {
                const isGood = card.goodDirection === 'neutral' ? 'neutral' :
                    (card.goodDirection === 'up' && card.data.direction === 'up') ||
                    (card.goodDirection === 'down' && card.data.direction === 'down');
                
                const colorClass = card.data.direction === 'same' ? 'neutral' :
                    isGood ? 'positive' : 'negative';
                
                const arrow = card.data.direction === 'up' ? '↑' :
                    card.data.direction === 'down' ? '↓' : '→';
                
                const changeSign = card.data.change >= 0 ? '+' : '';
                
                return `
                    <div class="comparison-card ${colorClass}">
                        <div class="comparison-card-header">
                            <span class="comparison-icon">${card.icon}</span>
                            <h4 class="comparison-title">${card.title}</h4>
                        </div>
                        <div class="comparison-values">
                            <div class="comparison-current">
                                <span class="comparison-label">Current</span>
                                <span class="comparison-amount">$${formatCurrency(card.data.current)}</span>
                            </div>
                            <div class="comparison-previous">
                                <span class="comparison-label">Previous</span>
                                <span class="comparison-amount">$${formatCurrency(card.data.previous)}</span>
                            </div>
                        </div>
                        <div class="comparison-change">
                            <span class="change-arrow">${arrow}</span>
                            <span class="change-amount">${changeSign}$${Math.abs(card.data.change).toFixed(2)}</span>
                            ${card.hidePercent !== true ? `
                                <span class="change-percent">(${changeSign}${card.data.percent_change}%)</span>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        // Display insights
        const insightsContainer = document.getElementById('comparison-insights');
        if (insightsContainer && data.insights && data.insights.length > 0) {
            insightsContainer.innerHTML = `
                <div class="insights-list">
                    ${data.insights.map(insight => `
                        <div class="insight-item insight-${insight.type}">
                            <span class="insight-icon">${insight.icon}</span>
                            <span class="insight-message">${insight.message}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (insightsContainer) {
            insightsContainer.innerHTML = '';
        }
        
    } catch (error) {
        console.error('Failed to load month comparison:', error);
        const section = document.getElementById('month-comparison-section');
        if (section) {
            section.style.display = 'none';
        }
    }
}

// Load and display upcoming bills (next 7 days)
async function loadUpcomingBills() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/upcoming-bills`);
        const data = await response.json();
        
        const container = document.getElementById('upcoming-bills-list');
        const summary = document.getElementById('upcoming-bills-summary');
        const totalDue = document.getElementById('bills-total-due');
        const billsCount = document.getElementById('bills-count');
        const placeholder = document.getElementById('bills-placeholder');
        
        if (!container) return;
        
        // Update summary
        if (data.success && data.bills && data.bills.length > 0) {
            if (summary) {
                summary.style.display = 'flex';
            }
            if (totalDue) {
                totalDue.textContent = `$${formatCurrency(data.total_due)}`;
            }
            if (billsCount) {
                billsCount.textContent = data.unpaid_count;
            }
            if (placeholder) {
                placeholder.style.display = 'none';
            }
            
            // Display bills
            container.innerHTML = data.bills.map(bill => {
                const urgencyClass = bill.urgency; // 'urgent', 'soon', or 'upcoming'
                const urgencyText = bill.days_until_due === 0 ? 'DUE TODAY' :
                    bill.days_until_due === 1 ? 'DUE TOMORROW' :
                    `${bill.days_until_due} DAYS`;
                
                const paidClass = bill.is_paid ? ' paid' : '';
                
                return `
                    <div class="bill-item ${urgencyClass}${paidClass}">
                        <div class="bill-info">
                            <div class="bill-name">
                                ${bill.name}
                                ${bill.is_autopay ? '<span class="bill-autopay-badge">AUTO-PAY</span>' : ''}
                                ${bill.is_paid ? '<span class="bill-paid-badge">✓ PAID</span>' : ''}
                            </div>
                            <div class="bill-details">
                                <span class="bill-category">📁 ${bill.category}</span>
                                <span class="bill-due-date">📅 Due ${bill.due_date_formatted}</span>
                            </div>
                        </div>
                        <div class="bill-right">
                            <div class="bill-amount">$${formatCurrency(bill.amount)}</div>
                            <div class="bill-urgency ${urgencyClass}">${urgencyText}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            // No upcoming bills
            if (summary) {
                summary.style.display = 'none';
            }
            if (placeholder) {
                placeholder.style.display = 'block';
            }
            container.innerHTML = '';
        }
        
    } catch (error) {
        console.error('Failed to load upcoming bills:', error);
        const placeholder = document.getElementById('bills-placeholder');
        if (placeholder) {
            placeholder.textContent = 'Unable to load bills';
            placeholder.style.display = 'block';
        }
    }
}

// Load and display spending pattern insights
async function loadSpendingPatterns() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/spending-patterns`);
        const data = await response.json();
        
        const loading = document.getElementById('patterns-loading');
        const alertsContainer = document.getElementById('patterns-alerts');
        const insightsContainer = document.getElementById('patterns-insights');
        const placeholder = document.getElementById('patterns-placeholder');
        
        if (loading) {
            loading.style.display = 'none';
        }
        
        if (!data.success || !data.has_sufficient_data) {
            // Not enough data to show patterns
            if (placeholder) {
                placeholder.style.display = 'block';
            }
            return;
        }
        
        // Display alerts (overspending warnings)
        if (alertsContainer && data.alerts && data.alerts.length > 0) {
            alertsContainer.style.display = 'flex';
            alertsContainer.innerHTML = data.alerts.slice(0, 3).map(alert => `
                <div class="pattern-alert ${alert.type}">
                    <div class="pattern-icon">${alert.icon}</div>
                    <div class="pattern-content">
                        <div class="pattern-message">${alert.message}</div>
                        <div class="pattern-detail">${alert.detail}</div>
                    </div>
                </div>
            `).join('');
        }
        
        // Display insights (positive trends or useful information)
        if (insightsContainer && data.insights && data.insights.length > 0) {
            insightsContainer.style.display = 'flex';
            insightsContainer.innerHTML = data.insights.slice(0, 3).map(insight => `
                <div class="pattern-alert ${insight.type}">
                    <div class="pattern-icon">${insight.icon}</div>
                    <div class="pattern-content">
                        <div class="pattern-message">${insight.message}</div>
                        ${insight.detail ? `<div class="pattern-detail">${insight.detail}</div>` : ''}
                    </div>
                </div>
            `).join('');
        }
        
        // If no alerts or insights, show placeholder
        if ((!data.alerts || data.alerts.length === 0) && (!data.insights || data.insights.length === 0)) {
            if (placeholder) {
                placeholder.innerHTML = '<p class="placeholder-text">✅ Your spending patterns look normal - no alerts at this time</p>';
                placeholder.style.display = 'block';
            }
        }
        
    } catch (error) {
        console.error('Failed to load spending patterns:', error);
        const loading = document.getElementById('patterns-loading');
        const placeholder = document.getElementById('patterns-placeholder');
        
        if (loading) {
            loading.style.display = 'none';
        }
        if (placeholder) {
            placeholder.innerHTML = '<p class="placeholder-text">Unable to load spending patterns</p>';
            placeholder.style.display = 'block';
        }
    }
}

// Load and display smart recommendations
async function loadSmartRecommendations() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/smart-recommendations`);
        const data = await response.json();
        
        const container = document.getElementById('smart-recommendations');
        const priorityActionsContainer = document.getElementById('priority-actions-container');
        const priorityActionsList = document.getElementById('priority-actions-list');
        const recommendationsList = document.getElementById('recommendations-list');
        
        if (!data.success || (!data.priority_actions?.length && !data.recommendations?.length)) {
            // No recommendations to show
            if (container) {
                container.style.display = 'none';
            }
            return;
        }
        
        // Show the recommendations container
        if (container) {
            container.style.display = 'block';
        }
        
        // Display priority actions (critical/urgent)
        if (priorityActionsContainer && priorityActionsList && data.priority_actions && data.priority_actions.length > 0) {
            priorityActionsContainer.style.display = 'block';
            priorityActionsList.innerHTML = data.priority_actions.map(action => `
                <div class="recommendation-item priority-${action.priority}">
                    <div class="recommendation-icon">${action.icon}</div>
                    <div class="recommendation-content">
                        <div class="recommendation-main">
                            <div class="recommendation-action">${action.action}</div>
                            <div class="recommendation-category">${action.category}</div>
                        </div>
                        <div class="recommendation-reason">${action.reason}</div>
                        <div class="recommendation-impact">${action.impact}</div>
                    </div>
                </div>
            `).join('');
        } else if (priorityActionsContainer) {
            priorityActionsContainer.style.display = 'none';
        }
        
        // Display regular recommendations
        if (recommendationsList && data.recommendations && data.recommendations.length > 0) {
            recommendationsList.innerHTML = data.recommendations.map(rec => `
                <div class="recommendation-item priority-${rec.priority}">
                    <div class="recommendation-icon">${rec.icon}</div>
                    <div class="recommendation-content">
                        <div class="recommendation-main">
                            <div class="recommendation-action">${rec.action}</div>
                            <div class="recommendation-category">${rec.category}</div>
                        </div>
                        <div class="recommendation-reason">${rec.reason}</div>
                        <div class="recommendation-impact">${rec.impact}</div>
                    </div>
                </div>
            `).join('');
        } else if (recommendationsList) {
            recommendationsList.innerHTML = '<p class="placeholder-text">✅ No recommendations at this time - you\'re doing great!</p>';
        }
        
    } catch (error) {
        console.error('Failed to load smart recommendations:', error);
        const container = document.getElementById('smart-recommendations');
        if (container) {
            container.style.display = 'none';
        }
    }
}

// Load and display all income sources
async function loadIncomeSources() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/income`);
        const incomeSources = await response.json();
        displayIncomeSources(incomeSources);
        
        // Update count
        const countDisplay = document.getElementById('income-count-display');
        if (countDisplay) {
            countDisplay.textContent = incomeSources.length;
        }
        
        // Load earner filter if there are earners
        loadIncomeEarnerFilter();
        
        // Populate earner name suggestions for autocomplete
        populateEarnerSuggestions(incomeSources);
        
        // Refresh total
        loadTotalIncome();
        
        // Reload overdraft status when income changes
        loadOverdraftStatus();
    } catch (error) {
        console.error('Failed to load income sources:', error);
    }
}

// Populate earner name autocomplete suggestions
function populateEarnerSuggestions(sources) {
    const datalist = document.getElementById('earner-suggestions');
    if (!datalist) return;
    
    // Get unique earner names
    const earnerNames = new Set();
    sources.forEach(source => {
        if (source.earner_name) {
            earnerNames.add(source.earner_name);
        }
    });
    
    // Populate datalist
    datalist.innerHTML = Array.from(earnerNames)
        .map(name => `<option value="${name}">`)
        .join('');
}

// Load and display earner filter section
async function loadIncomeEarnerFilter() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/income/by-earner`);
        const data = await response.json();
        
        const filterSection = document.getElementById('income-filter-section');
        const earnerFilterButtons = document.getElementById('earner-filter-buttons');
        const earnerSummaryCards = document.getElementById('earner-summary-cards');
        
        if (!filterSection || !earnerFilterButtons || !earnerSummaryCards) return;
        
        // Show filter section only if there are earners
        if (data.earners.length > 0) {
            filterSection.style.display = 'block';
            
            // Create filter buttons for each earner
            earnerFilterButtons.innerHTML = data.earners.map(earner => 
                `<button class="filter-btn" data-filter="${earner.name}">${earner.name}</button>`
            ).join('');
            
            // Create summary cards for each earner
            earnerSummaryCards.innerHTML = data.earners.map(earner => `
                <div class="earner-summary-card">
                    <div class="earner-header">
                        <h4>👤 ${earner.name}</h4>
                        <span class="earner-income-count">${earner.income_sources.length} source${earner.income_sources.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="earner-total">
                        <span class="total-label">Monthly Income</span>
                        <span class="total-amount">$${formatCurrency(earner.total_monthly)}</span>
                    </div>
                    <ul class="earner-income-list">
                        ${earner.income_sources.map(income => `
                            <li class="earner-income-item">
                                <span class="income-item-name">${getIncomeIcon(income.type)} ${income.name}</span>
                                <span class="income-item-amount">$${formatCurrency(calculateMonthlyAmount(income.amount, income.frequency))}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `).join('');
            
            // Add unassigned card if there are unassigned incomes
            if (data.unassigned.length > 0) {
                const unassignedTotal = data.unassigned.reduce((sum, income) => {
                    return sum + calculateMonthlyAmount(income.amount, income.frequency);
                }, 0);
                
                earnerSummaryCards.innerHTML += `
                    <div class="earner-summary-card unassigned-card">
                        <div class="earner-header">
                            <h4>📋 Unassigned</h4>
                            <span class="earner-income-count">${data.unassigned.length} source${data.unassigned.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="earner-total">
                            <span class="total-label">Monthly Income</span>
                            <span class="total-amount">$${formatCurrency(unassignedTotal)}</span>
                        </div>
                        <ul class="earner-income-list">
                            ${data.unassigned.map(income => `
                                <li class="earner-income-item">
                                    <span class="income-item-name">${getIncomeIcon(income.type)} ${income.name}</span>
                                    <span class="income-item-amount">$${formatCurrency(calculateMonthlyAmount(income.amount, income.frequency))}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }
            
            // Setup filter button event listeners
            setupEarnerFilterListeners();
        } else {
            filterSection.style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to load earner filter:', error);
    }
}

// Setup event listeners for earner filter buttons
function setupEarnerFilterListeners() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', async () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            const filter = button.dataset.filter;
            
            // Load and filter income sources
            const response = await fetch(`${API_BASE_URL}/api/income`);
            const allIncome = await response.json();
            
            let filteredIncome;
            if (filter === 'all') {
                filteredIncome = allIncome;
            } else if (filter === 'unassigned') {
                filteredIncome = allIncome.filter(income => !income.earner_name);
            } else {
                filteredIncome = allIncome.filter(income => income.earner_name === filter);
            }
            
            displayIncomeSources(filteredIncome);
        });
    });
}

// Display income sources in the income tab
function displayIncomeSources(sources) {
    const container = document.getElementById('income-list-container');
    
    if (!container) return;
    
    if (!sources || sources.length === 0) {
        container.innerHTML = '<p class="placeholder-text">No income sources added yet. Click "Add Income Source" to get started.</p>';
        return;
    }
    
    container.innerHTML = sources.map(source => {
        const icon = getIncomeIcon(source.type);
        const monthlyAmount = calculateMonthlyAmount(source.amount, source.frequency);
        const actualPayments = source.actual_payments || [];
        const hasPayments = actualPayments.length > 0;
        
        // Variable income detection
        const isVariable = source.is_variable || false;
        const averageMonthly = source.average_monthly || monthlyAmount;
        const incomeVariance = source.income_variance || 0;
        const paymentCount = source.payment_count || 0;
        
        // Determine variability level
        let variabilityBadge = '';
        if (isVariable && paymentCount >= 2) {
            let variabilityClass = '';
            let variabilityText = '';
            let variabilityIcon = '';
            
            if (incomeVariance < 10) {
                variabilityClass = 'stable';
                variabilityText = 'Stable';
                variabilityIcon = '✅';
            } else if (incomeVariance < 25) {
                variabilityClass = 'moderate';
                variabilityText = 'Variable';
                variabilityIcon = '⚠️';
            } else {
                variabilityClass = 'high';
                variabilityText = 'Highly Variable';
                variabilityIcon = '🔴';
            }
            
            variabilityBadge = `<span class="variability-badge ${variabilityClass}" title="Income varies by ${incomeVariance.toFixed(1)}% month-to-month">${variabilityIcon} ${variabilityText}</span>`;
        }
        
        // Calculate net income if tax withholding is set
        const hasTaxInfo = source.federal_tax_percent || source.state_tax_percent || 
                          source.social_security_percent || source.medicare_percent || 
                          source.other_deductions;
        let netIncome = null;
        if (hasTaxInfo) {
            const netCalc = calculateNetIncome(
                source.amount,
                source.federal_tax_percent || 0,
                source.state_tax_percent || 0,
                source.social_security_percent || 0,
                source.medicare_percent || 0,
                source.other_deductions || 0
            );
            netIncome = netCalc.net;
        }
        
        // Calculate total actual for current month
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const currentMonthPayments = actualPayments.filter(p => {
            const pDate = new Date(p.date);
            return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
        });
        const totalActual = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
        
        return `
            <div class="income-item">
                <div class="income-item-header">
                    <span class="income-icon">${icon}</span>
                    <div class="income-info">
                        <h4>${source.name}</h4>
                        <div class="income-meta">
                            <span class="income-type-label">${formatIncomeType(source.type)}</span>
                            ${source.earner_name ? `<span class="income-earner-badge">👤 ${source.earner_name}</span>` : ''}
                            ${variabilityBadge}
                        </div>
                    </div>
                    <div class="income-amount-section">
                        ${isVariable && paymentCount >= 2 ? `
                            <div class="variable-income-display">
                                <div class="expected-income">
                                    <span class="income-label">Expected:</span>
                                    <p class="income-amount">$${formatCurrency(source.amount)}</p>
                                </div>
                                <div class="average-income">
                                    <span class="income-label">Avg (${paymentCount} payments):</span>
                                    <p class="income-amount average">$${formatCurrency(averageMonthly)}</p>
                                </div>
                            </div>
                        ` : `
                            <p class="income-amount">$${formatCurrency(source.amount)}</p>
                        `}
                        <span class="income-frequency">${formatFrequency(source.frequency)}</span>
                        ${netIncome !== null ? `
                            <div class="net-income-badge">
                                <span class="net-label">Net Take-Home:</span>
                                <span class="net-value">$${formatCurrency(netIncome)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="income-item-body">
                    <div class="income-monthly">
                        <span class="monthly-label">Monthly equivalent:</span>
                        <span class="monthly-amount">$${formatCurrency(monthlyAmount)}</span>
                    </div>
                    
                    <!-- Expected vs Actual Tracking -->
                    <div class="income-tracking">
                        <div class="tracking-header">
                            <strong>📊 This Month's Income</strong>
                            <button class="btn-secondary btn-sm" onclick="recordIncomePayment(${source.id})" title="Record Payment">
                                💵 Record Payment
                            </button>
                        </div>
                        <div class="tracking-stats">
                            <div class="tracking-stat">
                                <span class="stat-label">Expected:</span>
                                <span class="stat-value">$${formatCurrency(monthlyAmount)}</span>
                            </div>
                            <div class="tracking-stat ${hasPayments ? '' : 'stat-warning'}">
                                <span class="stat-label">Actual:</span>
                                <span class="stat-value">$${formatCurrency(totalActual)}</span>
                            </div>
                            ${hasPayments ? `
                                <div class="tracking-stat ${totalActual >= monthlyAmount ? 'stat-success' : 'stat-warning'}">
                                    <span class="stat-label">Variance:</span>
                                    <span class="stat-value">${totalActual >= monthlyAmount ? '+' : ''}$${formatCurrency(totalActual - monthlyAmount)}</span>
                                </div>
                            ` : ''}
                        </div>
                        ${currentMonthPayments.length > 0 ? `
                            <div class="payment-history">
                                <strong>Payment History (This Month):</strong>
                                <ul class="payment-list">
                                    ${currentMonthPayments.map(p => `
                                        <li class="payment-item">
                                            <span class="payment-date">${formatDateShort(p.date)}</span>
                                            <span class="payment-amount">$${formatCurrency(p.amount)}</span>
                                            ${p.notes ? `<span class="payment-notes">${p.notes}</span>` : ''}
                                            <button class="btn-icon-sm" onclick="deleteIncomePayment(${source.id}, ${p.id})" title="Delete">🗑️</button>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : '<p class="no-payments-text">No payments recorded this month yet.</p>'}
                        ${isVariable || paymentCount >= 2 ? `
                            <button class="btn-link" onclick="viewVariableIncomeAnalysis(${source.id})">� View Variable Income Analysis</button>
                        ` : `
                            <button class="btn-link" onclick="viewIncomeAnalysis(${source.id})">�📈 View Detailed Analysis</button>
                        `}
                    </div>
                </div>
                <div class="income-item-footer">
                    <div class="income-actions">
                        <button class="btn-icon" onclick="editIncome(${source.id})" title="Edit">✏️</button>
                        <button class="btn-icon" onclick="deleteIncome(${source.id})" title="Delete">🗑️</button>
                    </div>
                </div>
                ${source.notes ? `<p class="income-notes">📝 ${source.notes}</p>` : ''}
            </div>
        `;
    }).join('');
}

// Calculate monthly amount based on frequency
function calculateMonthlyAmount(amount, frequency) {
    const amt = parseFloat(amount);
    switch(frequency) {
        case 'weekly':
            return amt * 52 / 12;
        case 'bi-weekly':
            return amt * 26 / 12;
        case 'monthly':
            return amt;
        case 'annual':
            return amt / 12;
        default:
            return amt;
    }
}

// Get icon for income type
function getIncomeIcon(type) {
    const icons = {
        'salary': '💼',
        'secondary-salary': '💼',
        'freelance': '💻',
        'investment': '📈',
        'rental': '🏠',
        'other': '💰'
    };
    return icons[type] || '💰';
}

// Format income type for display
function formatIncomeType(type) {
    const types = {
        'salary': 'Primary Salary',
        'secondary-salary': 'Secondary Salary',
        'freelance': 'Freelance/Side Hustle',
        'investment': 'Investment Income',
        'rental': 'Rental Income',
        'other': 'Other Income'
    };
    return types[type] || type;
}

// Format frequency for display
function formatFrequency(frequency) {
    const frequencies = {
        'weekly': 'per week',
        'bi-weekly': 'bi-weekly',
        'monthly': 'per month',
        'annual': 'per year'
    };
    return frequencies[frequency] || frequency;
}

// Calculate net income (take-home pay)
function calculateNetIncome(grossAmount, federalTax, stateTax, socialSecurity, medicare, otherDeductions) {
    // Calculate tax amounts (percentages)
    const federalTaxAmount = grossAmount * (federalTax / 100);
    const stateTaxAmount = grossAmount * (stateTax / 100);
    const socialSecurityAmount = grossAmount * (socialSecurity / 100);
    const medicareAmount = grossAmount * (medicare / 100);
    
    // Total deductions
    const totalDeductions = federalTaxAmount + stateTaxAmount + socialSecurityAmount + medicareAmount + otherDeductions;
    
    // Net income
    const netAmount = grossAmount - totalDeductions;
    
    return {
        gross: grossAmount,
        totalDeductions: totalDeductions,
        net: netAmount,
        breakdown: {
            federalTax: federalTaxAmount,
            stateTax: stateTaxAmount,
            socialSecurity: socialSecurityAmount,
            medicare: medicareAmount,
            otherDeductions: otherDeductions
        }
    };
}

// Update net income calculator in the modal
function updateNetIncomeCalculator() {
    const amountInput = document.getElementById('income-amount');
    const federalTaxInput = document.getElementById('income-federal-tax');
    const stateTaxInput = document.getElementById('income-state-tax');
    const socialSecurityInput = document.getElementById('income-social-security');
    const medicareInput = document.getElementById('income-medicare');
    const otherDeductionsInput = document.getElementById('income-other-deductions');
    
    const grossAmount = parseFloat(amountInput.value) || 0;
    const federalTax = parseFloat(federalTaxInput.value) || 0;
    const stateTax = parseFloat(stateTaxInput.value) || 0;
    const socialSecurity = parseFloat(socialSecurityInput.value) || 0;
    const medicare = parseFloat(medicareInput.value) || 0;
    const otherDeductions = parseFloat(otherDeductionsInput.value) || 0;
    
    const netCalc = calculateNetIncome(grossAmount, federalTax, stateTax, socialSecurity, medicare, otherDeductions);
    
    // Update display
    document.getElementById('calc-gross-income').textContent = `$${netCalc.gross.toFixed(2)}`;
    document.getElementById('calc-total-deductions').textContent = `-$${netCalc.totalDeductions.toFixed(2)}`;
    document.getElementById('calc-net-income').textContent = `$${netCalc.net.toFixed(2)}`;
}

// Show income modal
function showIncomeModal(incomeId = null) {
    const modal = document.getElementById('income-modal');
    const title = document.getElementById('income-modal-title');
    const form = document.getElementById('income-form');
    
    currentEditIncomeId = incomeId;
    
    if (incomeId) {
        title.textContent = 'Edit Income Source';
        loadIncomeData(incomeId);
    } else {
        title.textContent = 'Add Income Source';
        form.reset();
        // Set default values for new income
        document.getElementById('income-social-security').value = 6.2;
        document.getElementById('income-medicare').value = 1.45;
        updateNetIncomeCalculator();
    }
    
    modal.style.display = 'flex';
    
    // Setup income type change listener for auto-suggesting variable income
    const incomeTypeSelect = document.getElementById('income-type');
    const variableCheckbox = document.getElementById('income-is-variable');
    
    if (!incomeTypeSelect.hasVariableListener) {
        incomeTypeSelect.addEventListener('change', function() {
            const variableTypes = ['freelance', 'investment', 'other'];
            if (variableTypes.includes(this.value)) {
                variableCheckbox.checked = true;
            }
        });
        incomeTypeSelect.hasVariableListener = true;
    }
    
    // Attach event listeners for real-time calculation (only once)
    if (!window.incomeCalculatorInitialized) {
        const calculatorInputs = [
            'income-amount',
            'income-federal-tax',
            'income-state-tax',
            'income-social-security',
            'income-medicare',
            'income-other-deductions'
        ];
        
        calculatorInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', updateNetIncomeCalculator);
            }
        });
        
        window.incomeCalculatorInitialized = true;
    }
}

// Hide income modal
function hideIncomeModal() {
    const modal = document.getElementById('income-modal');
    modal.style.display = 'none';
    currentEditIncomeId = null;
    document.getElementById('income-form').reset();
}

// Load income data for editing
async function loadIncomeData(incomeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/income`);
        const sources = await response.json();
        const income = sources.find(i => i.id === incomeId);
        
        if (income) {
            document.getElementById('income-type').value = income.type;
            document.getElementById('income-name').value = income.name;
            document.getElementById('income-earner-name').value = income.earner_name || '';
            document.getElementById('income-amount').value = income.amount;
            document.getElementById('income-frequency').value = income.frequency;
            document.getElementById('income-next-pay-date').value = income.next_pay_date || '';
            document.getElementById('income-is-variable').checked = income.is_variable || false;
            document.getElementById('income-notes').value = income.notes || '';
            
            // Load tax withholding fields
            document.getElementById('income-federal-tax').value = income.federal_tax_percent || 0;
            document.getElementById('income-state-tax').value = income.state_tax_percent || 0;
            document.getElementById('income-social-security').value = income.social_security_percent || 6.2;
            document.getElementById('income-medicare').value = income.medicare_percent || 1.45;
            document.getElementById('income-other-deductions').value = income.other_deductions || 0;
            
            // Update net income calculator
            updateNetIncomeCalculator();
        }
    } catch (error) {
        console.error('Failed to load income data:', error);
    }
}

// Save income source (add or update)
async function saveIncome(event) {
    event.preventDefault();
    
    // Get and validate form data
    const type = document.getElementById('income-type').value;
    const name = document.getElementById('income-name').value.trim();
    const earnerName = document.getElementById('income-earner-name').value.trim();
    const amountInput = document.getElementById('income-amount').value;
    const frequency = document.getElementById('income-frequency').value;
    const nextPayDate = document.getElementById('income-next-pay-date').value || null;
    const isVariable = document.getElementById('income-is-variable').checked;
    const notes = document.getElementById('income-notes').value.trim();
    
    // Client-side validation
    if (!type) {
        alert('Please select an income type');
        return;
    }
    
    if (!name) {
        alert('Please enter a name for this income source');
        return;
    }
    
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount greater than 0');
        return;
    }
    
    if (!frequency) {
        alert('Please select a payment frequency');
        return;
    }
    
    // Get tax withholding data
    const federalTax = parseFloat(document.getElementById('income-federal-tax').value) || 0;
    const stateTax = parseFloat(document.getElementById('income-state-tax').value) || 0;
    const socialSecurity = parseFloat(document.getElementById('income-social-security').value) || 0;
    const medicare = parseFloat(document.getElementById('income-medicare').value) || 0;
    const otherDeductions = parseFloat(document.getElementById('income-other-deductions').value) || 0;
    
    // Validate tax percentages
    if (federalTax < 0 || federalTax > 100) {
        alert('Federal tax must be between 0 and 100%');
        return;
    }
    if (stateTax < 0 || stateTax > 100) {
        alert('State tax must be between 0 and 100%');
        return;
    }
    if (socialSecurity < 0 || socialSecurity > 100) {
        alert('Social Security must be between 0 and 100%');
        return;
    }
    if (medicare < 0 || medicare > 100) {
        alert('Medicare must be between 0 and 100%');
        return;
    }
    if (otherDeductions < 0) {
        alert('Other deductions cannot be negative');
        return;
    }
    
    const incomeData = {
        type,
        name,
        earner_name: earnerName || null,
        amount,
        frequency,
        next_pay_date: nextPayDate,
        is_variable: isVariable,
        notes: notes || '',
        federal_tax_percent: federalTax,
        state_tax_percent: stateTax,
        social_security_percent: socialSecurity,
        medicare_percent: medicare,
        other_deductions: otherDeductions
    };
    
    // Disable submit button to prevent double-submission
    const submitBtn = document.getElementById('save-income-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    
    try {
        let response;
        if (currentEditIncomeId) {
            // Update existing income
            response = await fetch(`${API_BASE_URL}/api/income/${currentEditIncomeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(incomeData)
            });
        } else {
            // Add new income
            response = await fetch(`${API_BASE_URL}/api/income`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(incomeData)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            hideIncomeModal();
            loadIncomeSources();
        } else {
            // Show error message from server
            alert(`Error: ${result.error || 'Failed to save income source'}`);
        }
    } catch (error) {
        console.error('Failed to save income:', error);
        alert('Failed to save income source. Please check your connection and try again.');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Edit income source
function editIncome(incomeId) {
    showIncomeModal(incomeId);
}

// Delete income source
async function deleteIncome(incomeId) {
    if (!confirm('Are you sure you want to delete this income source?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/income/${incomeId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        if (result.success) {
            loadIncomeSources();
        }
    } catch (error) {
        console.error('Failed to delete income:', error);
        alert('Failed to delete income source. Please try again.');
    }
}

// Record income payment
async function recordIncomePayment(incomeId) {
    const amount = prompt('Enter the amount received:');
    if (!amount) return;
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        alert('Please enter a valid amount greater than 0');
        return;
    }
    
    const date = prompt('Enter the date received (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!date) return;
    
    const notes = prompt('Add any notes (optional):') || '';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/income/${incomeId}/record-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: parsedAmount,
                date: date,
                notes: notes
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadIncomeSources();
            alert('Payment recorded successfully!');
        } else {
            alert(`Error: ${result.error || 'Failed to record payment'}`);
        }
    } catch (error) {
        console.error('Failed to record payment:', error);
        alert('Failed to record payment. Please try again.');
    }
}

// Delete income payment
async function deleteIncomePayment(incomeId, paymentId) {
    if (!confirm('Are you sure you want to delete this payment record?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/income/${incomeId}/payments/${paymentId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadIncomeSources();
        } else {
            alert(`Error: ${result.error || 'Failed to delete payment'}`);
        }
    } catch (error) {
        console.error('Failed to delete payment:', error);
        alert('Failed to delete payment. Please try again.');
    }
}

// View income analysis
async function viewIncomeAnalysis(incomeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/income/${incomeId}/analysis`);
        const analysis = await response.json();
        
        if (analysis.error) {
            alert(`Error: ${analysis.error}`);
            return;
        }
        
        // Create a formatted analysis message
        const message = `
📊 Income Analysis for ${analysis.income_name}

Expected Income This Month: $${analysis.expected_this_month.toFixed(2)}
Actual Income Received: $${analysis.total_actual.toFixed(2)}
Variance: ${analysis.variance >= 0 ? '+' : ''}$${analysis.variance.toFixed(2)} (${analysis.variance_percent >= 0 ? '+' : ''}${analysis.variance_percent.toFixed(1)}%)

Status: ${analysis.status_message}

Expected Payments: ${analysis.expected_count}
Actual Payments: ${analysis.payment_count}

${analysis.payments.length > 0 ? 'Recent Payments:\n' + analysis.payments.map(p => 
    `• ${p.date}: $${p.amount.toFixed(2)}${p.notes ? ' - ' + p.notes : ''}`
).join('\n') : 'No payments recorded this month.'}
        `.trim();
        
        alert(message);
    } catch (error) {
        console.error('Failed to load analysis:', error);
        alert('Failed to load income analysis. Please try again.');
    }
}

// View variable income analysis (for commission/freelance income)
async function viewVariableIncomeAnalysis(incomeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/income/${incomeId}/variable-analysis`);
        const data = await response.json();
        
        if (!data.success) {
            alert(`Error: ${data.error || 'Failed to load analysis'}`);
            return;
        }
        
        if (!data.has_data) {
            alert(data.message || 'No payment history available yet.');
            return;
        }
        
        // Show detailed variable income analysis modal
        showVariableIncomeAnalysisModal(data);
    } catch (error) {
        console.error('Failed to load variable income analysis:', error);
        alert('Failed to load analysis. Please try again.');
    }
}

// Show variable income analysis in a modal
function showVariableIncomeAnalysisModal(analysis) {
    // Create modal HTML
    const modalHTML = `
        <div id="variable-income-modal" class="modal" style="display: flex;">
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3>📊 Variable Income Analysis: ${analysis.income_name}</h3>
                    <button class="modal-close" onclick="closeVariableIncomeModal()">&times;</button>
                </div>
                <div class="modal-body variable-income-analysis">
                    
                    <!-- Stability Assessment -->
                    <div class="analysis-section">
                        <h4>Income Stability</h4>
                        <div class="stability-card" style="border-color: ${analysis.stability.color}">
                            <div class="stability-header">
                                <span class="stability-icon">${analysis.stability.icon}</span>
                                <span class="stability-level">${analysis.stability.level}</span>
                            </div>
                            <p class="stability-description">${analysis.stability.description}</p>
                        </div>
                    </div>
                    
                    <!-- Key Statistics -->
                    <div class="analysis-section">
                        <h4>Income Statistics (${analysis.months_tracked} months)</h4>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <span class="stat-label">Average Monthly</span>
                                <span class="stat-value">$${formatCurrency(analysis.statistics.average_monthly)}</span>
                            </div>
                            <div class="stat-card">
                                <span class="stat-label">Median Monthly</span>
                                <span class="stat-value">$${formatCurrency(analysis.statistics.median_monthly)}</span>
                            </div>
                            <div class="stat-card">
                                <span class="stat-label">Minimum</span>
                                <span class="stat-value minimum">$${formatCurrency(analysis.statistics.minimum_monthly)}</span>
                            </div>
                            <div class="stat-card">
                                <span class="stat-label">Maximum</span>
                                <span class="stat-value maximum">$${formatCurrency(analysis.statistics.maximum_monthly)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Trend Analysis -->
                    <div class="analysis-section">
                        <h4>Income Trend</h4>
                        <div class="trend-card">
                            <div class="trend-header">
                                <span class="trend-icon">${analysis.trend.icon}</span>
                                <span class="trend-direction">${analysis.trend.direction}</span>
                                ${analysis.trend.percent_change !== 0 ? `
                                    <span class="trend-percent ${analysis.trend.percent_change > 0 ? 'positive' : 'negative'}">
                                        ${analysis.trend.percent_change > 0 ? '+' : ''}${analysis.trend.percent_change.toFixed(1)}%
                                    </span>
                                ` : ''}
                            </div>
                            <p class="trend-description">${analysis.trend.description}</p>
                        </div>
                    </div>
                    
                    <!-- Current Month -->
                    <div class="analysis-section">
                        <h4>Current Month Performance</h4>
                        <div class="current-month-card">
                            <div class="stat-row">
                                <span class="stat-label">Total Received:</span>
                                <span class="stat-value">$${formatCurrency(analysis.current_month.total)}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Payments:</span>
                                <span class="stat-value">${analysis.current_month.payment_count}</span>
                            </div>
                            <div class="stat-row ${analysis.current_month.vs_average >= 0 ? 'positive' : 'negative'}">
                                <span class="stat-label">vs. Average:</span>
                                <span class="stat-value">
                                    ${analysis.current_month.vs_average >= 0 ? '+' : ''}$${formatCurrency(Math.abs(analysis.current_month.vs_average))}
                                    (${analysis.current_month.vs_average_percent >= 0 ? '+' : ''}${analysis.current_month.vs_average_percent.toFixed(1)}%)
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Forecast -->
                    <div class="analysis-section">
                        <h4>Income Forecast</h4>
                        <div class="forecast-card">
                            <div class="forecast-row main-forecast">
                                <span class="forecast-label">Expected Next Month:</span>
                                <span class="forecast-value">$${formatCurrency(analysis.forecast.next_month)}</span>
                            </div>
                            <div class="forecast-range">
                                <div class="forecast-row">
                                    <span class="forecast-label">Conservative (Min):</span>
                                    <span class="forecast-value">$${formatCurrency(analysis.forecast.conservative_estimate)}</span>
                                </div>
                                <div class="forecast-row">
                                    <span class="forecast-label">Optimistic (Max):</span>
                                    <span class="forecast-value">$${formatCurrency(analysis.forecast.optimistic_estimate)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Monthly Breakdown Chart -->
                    <div class="analysis-section">
                        <h4>Monthly Income History</h4>
                        <div class="monthly-chart">
                            ${analysis.monthly_breakdown.map(month => {
                                const percentage = (month.total / analysis.statistics.maximum_monthly) * 100;
                                const isAboveAvg = month.total >= analysis.statistics.average_monthly;
                                return `
                                    <div class="chart-bar-container">
                                        <div class="chart-bar-wrapper">
                                            <div class="chart-bar ${isAboveAvg ? 'above-avg' : 'below-avg'}" 
                                                 style="height: ${percentage}%"
                                                 title="$${formatCurrency(month.total)}">
                                            </div>
                                        </div>
                                        <div class="chart-label">
                                            <div class="chart-month">${month.month_short}</div>
                                            <div class="chart-amount">$${formatCurrency(month.total)}</div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <div class="chart-legend">
                            <div class="legend-item">
                                <span class="legend-color above-avg"></span>
                                <span>Above Average</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color below-avg"></span>
                                <span>Below Average</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-line"></span>
                                <span>Average: $${formatCurrency(analysis.statistics.average_monthly)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Recommendations -->
                    ${analysis.recommendations.length > 0 ? `
                        <div class="analysis-section">
                            <h4>💡 Recommendations</h4>
                            <div class="recommendations-list">
                                ${analysis.recommendations.map(rec => `
                                    <div class="recommendation-item ${rec.type}">
                                        <span class="rec-icon">${rec.icon}</span>
                                        <span class="rec-message">${rec.message}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="closeVariableIncomeModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    const existingModal = document.getElementById('variable-income-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close variable income analysis modal
function closeVariableIncomeModal() {
    const modal = document.getElementById('variable-income-modal');
    if (modal) {
        modal.remove();
    }
}

// Helper function to format dates
function formatDateShort(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Setup income event listeners
function setupIncomeListeners() {
    // Add income button
    const addIncomeBtn = document.getElementById('add-income-btn');
    if (addIncomeBtn) {
        addIncomeBtn.addEventListener('click', () => showIncomeModal());
    }
    
    // Close modal buttons
    const closeModalBtn = document.getElementById('close-income-modal');
    const cancelBtn = document.getElementById('cancel-income-btn');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideIncomeModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideIncomeModal);
    }
    
    // Form submission
    const incomeForm = document.getElementById('income-form');
    if (incomeForm) {
        incomeForm.addEventListener('submit', saveIncome);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('income-modal');
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                hideIncomeModal();
            }
        });
    }
}

// ============================================
// EXPENSE MANAGEMENT
// ============================================

let currentEditExpenseId = null;

// Load and display all fixed expenses
async function loadExpenses() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/expenses`);
        const expenses = await response.json();
        displayExpenses(expenses);
        
        // Update count
        const countDisplay = document.getElementById('expense-count-display');
        if (countDisplay) {
            countDisplay.textContent = expenses.length;
        }
        
        // Refresh total
        loadTotalExpenses();
        
        // Reload overdraft status when expenses change
        loadOverdraftStatus();
    } catch (error) {
        console.error('Failed to load expenses:', error);
    }
}

// Display expenses in the expenses tab
function displayExpenses(expenses) {
    const container = document.getElementById('expense-list-container');
    
    if (!container) return;
    
    if (!expenses || expenses.length === 0) {
        container.innerHTML = '<p class="placeholder-text">No expenses added yet. Click "Add Expense" to get started.</p>';
        return;
    }
    
    // Sort expenses by due date
    expenses.sort((a, b) => (a.due_date || 99) - (b.due_date || 99));
    
    container.innerHTML = expenses.map(expense => {
        const icon = getExpenseIcon(expense.category);
        const dueDate = expense.due_date ? `Due: ${ordinalSuffix(expense.due_date)} of month` : 'No due date set';
        const autopay = expense.autopay ? '<span class="autopay-badge">⚡ Auto-pay</span>' : '';
        
        return `
            <div class="expense-item">
                <div class="expense-item-header">
                    <span class="expense-icon">${icon}</span>
                    <div class="expense-info">
                        <h4>${expense.name}</h4>
                        <span class="expense-category-label">${formatExpenseCategory(expense.category)}</span>
                    </div>
                    <div class="expense-amount-section">
                        <p class="expense-amount">$${formatCurrency(expense.amount)}</p>
                        <span class="expense-frequency">per month</span>
                    </div>
                </div>
                <div class="expense-item-footer">
                    <div class="expense-details">
                        <span class="due-date-label">${dueDate}</span>
                        ${autopay}
                    </div>
                    <div class="expense-actions">
                        <button class="btn-icon" onclick="editExpense(${expense.id})" title="Edit">✏️</button>
                        <button class="btn-icon" onclick="deleteExpense(${expense.id})" title="Delete">🗑️</button>
                    </div>
                </div>
                ${expense.notes ? `<p class="expense-notes">📝 ${expense.notes}</p>` : ''}
            </div>
        `;
    }).join('');
}

// Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
function ordinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return num + "st";
    if (j === 2 && k !== 12) return num + "nd";
    if (j === 3 && k !== 13) return num + "rd";
    return num + "th";
}

// Get icon for expense category
function getExpenseIcon(category) {
    const icons = {
        'housing': '🏠',
        'utilities': '💡',
        'internet': '🌐',
        'insurance': '🛡️',
        'transportation': '🚗',
        'debt': '💳',
        'subscriptions': '📺',
        'childcare': '👶',
        'other': '📝'
    };
    return icons[category] || '📝';
}

// Format expense category for display
function formatExpenseCategory(category) {
    const categories = {
        'housing': 'Housing',
        'utilities': 'Utilities',
        'internet': 'Internet & Phone',
        'insurance': 'Insurance',
        'transportation': 'Transportation',
        'debt': 'Debt Payments',
        'subscriptions': 'Subscriptions',
        'childcare': 'Childcare & Education',
        'other': 'Other'
    };
    return categories[category] || category;
}

// Show expense modal
function showExpenseModal(expenseId = null) {
    const modal = document.getElementById('expense-modal');
    const title = document.getElementById('expense-modal-title');
    const form = document.getElementById('expense-form');
    
    currentEditExpenseId = expenseId;
    
    if (expenseId) {
        title.textContent = 'Edit Fixed Expense';
        loadExpenseData(expenseId);
    } else {
        title.textContent = 'Add Fixed Expense';
        form.reset();
    }
    
    modal.style.display = 'flex';
}

// Hide expense modal
function hideExpenseModal() {
    const modal = document.getElementById('expense-modal');
    modal.style.display = 'none';
    currentEditExpenseId = null;
    document.getElementById('expense-form').reset();
}

// Load expense data for editing
async function loadExpenseData(expenseId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/expenses`);
        const expenses = await response.json();
        const expense = expenses.find(e => e.id === expenseId);
        
        if (expense) {
            document.getElementById('expense-category').value = expense.category;
            document.getElementById('expense-name').value = expense.name;
            document.getElementById('expense-amount').value = expense.amount;
            document.getElementById('expense-due-date').value = expense.due_date || '';
            document.getElementById('expense-autopay').checked = expense.autopay || false;
            document.getElementById('expense-notes').value = expense.notes || '';
        }
    } catch (error) {
        console.error('Failed to load expense data:', error);
    }
}

// Save expense (add or update)
async function saveExpense(event) {
    event.preventDefault();
    
    const expenseData = {
        category: document.getElementById('expense-category').value,
        name: document.getElementById('expense-name').value,
        amount: parseFloat(document.getElementById('expense-amount').value),
        due_date: document.getElementById('expense-due-date').value ? parseInt(document.getElementById('expense-due-date').value) : null,
        autopay: document.getElementById('expense-autopay').checked,
        notes: document.getElementById('expense-notes').value
    };
    
    try {
        let response;
        if (currentEditExpenseId) {
            // Update existing expense
            response = await fetch(`${API_BASE_URL}/api/expenses/${currentEditExpenseId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expenseData)
            });
        } else {
            // Add new expense
            response = await fetch(`${API_BASE_URL}/api/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expenseData)
            });
        }
        
        const result = await response.json();
        if (result.success) {
            hideExpenseModal();
            loadExpenses();
        }
    } catch (error) {
        console.error('Failed to save expense:', error);
        alert('Failed to save expense. Please try again.');
    }
}

// Edit expense
function editExpense(expenseId) {
    showExpenseModal(expenseId);
}

// Delete expense
async function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/expenses/${expenseId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        if (result.success) {
            loadExpenses();
        }
    } catch (error) {
        console.error('Failed to delete expense:', error);
        alert('Failed to delete expense. Please try again.');
    }
}

// Setup expense event listeners
function setupExpenseListeners() {
    // Add expense button
    const addExpenseBtn = document.getElementById('add-expense-btn');
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => showExpenseModal());
    }
    
    // Close modal buttons
    const closeModalBtn = document.getElementById('close-expense-modal');
    const cancelBtn = document.getElementById('cancel-expense-btn');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideExpenseModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideExpenseModal);
    }
    
    // Form submission
    const expenseForm = document.getElementById('expense-form');
    if (expenseForm) {
        expenseForm.addEventListener('submit', saveExpense);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('expense-modal');
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                hideExpenseModal();
            }
        });
    }
}

// ==========================================
// INCOME TRENDS CHARTS
// ==========================================

// Store chart instances for cleanup
let totalIncomeChart = null;
let incomeBySourceChart = null;
let incomeByEarnerChart = null;

// Get theme-aware colors
function getChartColors() {
    const theme = document.querySelector('.app').getAttribute('data-theme');
    const isDark = theme === 'dark';
    
    return {
        text: isDark ? '#e0e0e0' : '#333333',
        grid: isDark ? '#404040' : '#e0e0e0',
        background: isDark ? 'rgba(66, 133, 244, 0.2)' : 'rgba(66, 133, 244, 0.1)',
        border: isDark ? 'rgba(66, 133, 244, 0.8)' : 'rgba(66, 133, 244, 1)',
        // Color palette for multiple datasets
        palette: [
            { bg: 'rgba(66, 133, 244, 0.2)', border: 'rgba(66, 133, 244, 1)' },
            { bg: 'rgba(52, 168, 83, 0.2)', border: 'rgba(52, 168, 83, 1)' },
            { bg: 'rgba(251, 188, 4, 0.2)', border: 'rgba(251, 188, 4, 1)' },
            { bg: 'rgba(234, 67, 53, 0.2)', border: 'rgba(234, 67, 53, 1)' },
            { bg: 'rgba(156, 39, 176, 0.2)', border: 'rgba(156, 39, 176, 1)' },
            { bg: 'rgba(255, 112, 67, 0.2)', border: 'rgba(255, 112, 67, 1)' },
            { bg: 'rgba(0, 172, 193, 0.2)', border: 'rgba(0, 172, 193, 1)' },
            { bg: 'rgba(233, 30, 99, 0.2)', border: 'rgba(233, 30, 99, 1)' }
        ]
    };
}

// Load and display income trends
async function loadIncomeTrends() {
    const periodSelect = document.getElementById('trends-period-select');
    const months = periodSelect ? periodSelect.value : 12;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/income/trends?months=${months}`);
        const data = await response.json();
        
        if (data.success) {
            // Update statistics
            updateTrendsStatistics(data.statistics);
            
            // Render charts
            renderTotalIncomeChart(data.total_income);
            renderIncomeBySourceChart(data.by_source);
            renderIncomeByEarnerChart(data.by_earner);
            
            // Show trends section
            const trendsSection = document.getElementById('income-trends-section');
            if (trendsSection) {
                trendsSection.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading income trends:', error);
    }
}

// Update trends statistics display
function updateTrendsStatistics(stats) {
    const statsContainer = document.getElementById('trends-stats-summary');
    if (!statsContainer) return;
    
    // Show stats if there's data
    if (stats.months_with_income > 0) {
        statsContainer.style.display = 'grid';
        
        // Update values
        const avgEl = document.getElementById('trends-stat-average');
        const maxEl = document.getElementById('trends-stat-max');
        const minEl = document.getElementById('trends-stat-min');
        const trendEl = document.getElementById('trends-stat-trend');
        
        if (avgEl) avgEl.textContent = `$${stats.average.toLocaleString()}`;
        if (maxEl) maxEl.textContent = `$${stats.max.toLocaleString()}`;
        if (minEl) minEl.textContent = `$${stats.min.toLocaleString()}`;
        
        if (trendEl) {
            let trendText = '';
            let trendClass = '';
            
            switch(stats.trend) {
                case 'increasing':
                    trendText = '📈 Increasing';
                    trendClass = 'trend-up';
                    break;
                case 'decreasing':
                    trendText = '📉 Decreasing';
                    trendClass = 'trend-down';
                    break;
                default:
                    trendText = '➡️ Stable';
                    trendClass = 'trend-stable';
            }
            
            trendEl.textContent = trendText;
            trendEl.className = `stat-value trend-indicator ${trendClass}`;
        }
    } else {
        statsContainer.style.display = 'none';
    }
}

// Render total income over time chart
function renderTotalIncomeChart(data) {
    const canvas = document.getElementById('total-income-chart');
    const emptyState = document.getElementById('total-income-empty');
    
    if (!canvas) return;
    
    // Check if there's any data
    const hasData = data.data && data.data.some(val => val > 0);
    
    if (!hasData) {
        canvas.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    
    canvas.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    
    // Destroy existing chart
    if (totalIncomeChart) {
        totalIncomeChart.destroy();
    }
    
    const colors = getChartColors();
    const ctx = canvas.getContext('2d');
    
    totalIncomeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Total Income',
                data: data.data,
                backgroundColor: colors.background,
                borderColor: colors.border,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Income: $${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: colors.text,
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: colors.grid
                    }
                },
                x: {
                    ticks: {
                        color: colors.text
                    },
                    grid: {
                        color: colors.grid
                    }
                }
            }
        }
    });
}

// Render income by source chart (stacked area)
function renderIncomeBySourceChart(data) {
    const canvas = document.getElementById('income-by-source-chart');
    const emptyState = document.getElementById('source-chart-empty');
    
    if (!canvas) return;
    
    // Check if there's any data
    const hasData = data.datasets && data.datasets.length > 0 && 
                    data.datasets.some(ds => ds.data.some(val => val > 0));
    
    if (!hasData) {
        canvas.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    
    canvas.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    
    // Destroy existing chart
    if (incomeBySourceChart) {
        incomeBySourceChart.destroy();
    }
    
    const colors = getChartColors();
    const ctx = canvas.getContext('2d');
    
    // Apply colors to datasets
    const coloredDatasets = data.datasets.map((dataset, index) => ({
        ...dataset,
        backgroundColor: colors.palette[index % colors.palette.length].bg,
        borderColor: colors.palette[index % colors.palette.length].border,
        borderWidth: 2,
        fill: true,
        tension: 0.4
    }));
    
    incomeBySourceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: coloredDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: colors.text,
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        color: colors.text,
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: colors.grid
                    }
                },
                x: {
                    stacked: true,
                    ticks: {
                        color: colors.text
                    },
                    grid: {
                        color: colors.grid
                    }
                }
            }
        }
    });
}

// Render income by earner chart (grouped bars)
function renderIncomeByEarnerChart(data) {
    const canvas = document.getElementById('income-by-earner-chart');
    const emptyState = document.getElementById('earner-chart-empty');
    
    if (!canvas) return;
    
    // Check if there's any data
    const hasData = data.datasets && data.datasets.length > 0 && 
                    data.datasets.some(ds => ds.data.some(val => val > 0));
    
    if (!hasData) {
        canvas.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    
    canvas.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    
    // Destroy existing chart
    if (incomeByEarnerChart) {
        incomeByEarnerChart.destroy();
    }
    
    const colors = getChartColors();
    const ctx = canvas.getContext('2d');
    
    // Apply colors to datasets
    const coloredDatasets = data.datasets.map((dataset, index) => ({
        ...dataset,
        backgroundColor: colors.palette[index % colors.palette.length].bg,
        borderColor: colors.palette[index % colors.palette.length].border,
        borderWidth: 2
    }));
    
    incomeByEarnerChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: coloredDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: colors.text,
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: colors.text,
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: colors.grid
                    }
                },
                x: {
                    ticks: {
                        color: colors.text
                    },
                    grid: {
                        color: colors.grid
                    }
                }
            }
        }
    });
}

// ==================== Year-over-Year Comparison Functions ====================

// Global chart variables for YoY
let yoyAnnualChart = null;
let yoyMonthlyChart = null;

// Load and display year-over-year comparison
async function loadYearOverYearComparison() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/income/year-over-year`);
        const data = await response.json();
        
        if (data.success && data.has_data) {
            // Show the YoY section
            const yoySection = document.getElementById('yoy-comparison-section');
            if (yoySection) {
                yoySection.style.display = 'block';
            }
            
            // Hide empty state, show content
            const emptyState = document.getElementById('yoy-empty-state');
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            
            // Update statistics
            updateYoYStatistics(data.statistics);
            
            // Render year cards
            renderYearCards(data.years);
            
            // Render charts
            renderYoYAnnualChart(data.years);
            renderYoYMonthlyChart(data.years);
            
        } else {
            // Show empty state
            const yoySection = document.getElementById('yoy-comparison-section');
            const emptyState = document.getElementById('yoy-empty-state');
            
            if (yoySection) {
                yoySection.style.display = 'block';
            }
            if (emptyState) {
                emptyState.style.display = 'flex';
            }
            
            // Hide other elements
            const statsEl = document.getElementById('yoy-stats-summary');
            const gridEl = document.getElementById('yoy-years-grid');
            const chartsEl = document.querySelector('.yoy-charts-grid');
            
            if (statsEl) statsEl.style.display = 'none';
            if (gridEl) gridEl.innerHTML = '';
            if (chartsEl) chartsEl.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading year-over-year comparison:', error);
    }
}

// Update YoY statistics display
function updateYoYStatistics(stats) {
    const statsContainer = document.getElementById('yoy-stats-summary');
    if (!statsContainer) return;
    
    statsContainer.style.display = 'grid';
    
    // Update values
    const yearsEl = document.getElementById('yoy-stat-years');
    const avgEl = document.getElementById('yoy-stat-average');
    const trendEl = document.getElementById('yoy-stat-trend');
    const totalEl = document.getElementById('yoy-stat-total');
    
    if (yearsEl) yearsEl.textContent = stats.total_years;
    if (avgEl) avgEl.textContent = `$${stats.average_per_year.toLocaleString()}`;
    if (totalEl) totalEl.textContent = `$${stats.total_all_years.toLocaleString()}`;
    
    if (trendEl) {
        let trendText = '';
        let trendClass = '';
        
        switch(stats.overall_trend) {
            case 'increasing':
                trendText = '📈 Increasing';
                trendClass = 'trend-up';
                break;
            case 'decreasing':
                trendText = '📉 Decreasing';
                trendClass = 'trend-down';
                break;
            default:
                trendText = '➡️ Stable';
                trendClass = 'trend-stable';
        }
        
        trendEl.textContent = trendText;
        trendEl.className = `stat-value trend-indicator ${trendClass}`;
    }
}

// Render year cards
function renderYearCards(years) {
    const grid = document.getElementById('yoy-years-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    years.forEach((yearData, index) => {
        const card = document.createElement('div');
        card.className = 'yoy-year-card';
        if (index === 0) {
            card.classList.add('latest-year');
        }
        
        // Build change indicator HTML
        let changeHTML = '';
        if (yearData.change_from_previous) {
            const change = yearData.change_from_previous;
            const icon = change.direction === 'increase' ? '📈' : 
                        change.direction === 'decrease' ? '📉' : '➡️';
            const cssClass = change.direction === 'increase' ? 'positive' :
                           change.direction === 'decrease' ? 'negative' : 'neutral';
            const sign = change.amount > 0 ? '+' : '';
            
            changeHTML = `
                <div class="yoy-change-indicator ${cssClass}">
                    <span class="yoy-change-icon">${icon}</span>
                    <div class="yoy-change-text">
                        <span class="yoy-change-amount">${sign}$${Math.abs(change.amount).toLocaleString()}</span>
                        <span class="yoy-change-percent">${sign}${change.percent.toFixed(1)}% from ${yearData.year - 1}</span>
                    </div>
                </div>
            `;
        }
        
        // Build top sources HTML
        let topSourcesHTML = '';
        if (yearData.top_sources && yearData.top_sources.length > 0) {
            const sourcesItems = yearData.top_sources.slice(0, 3).map(source => `
                <div class="yoy-source-item">
                    <span class="yoy-source-name">${source.name}</span>
                    <span class="yoy-source-amount">$${source.amount.toLocaleString()}</span>
                </div>
            `).join('');
            
            topSourcesHTML = `
                <div class="yoy-top-sources">
                    <div class="yoy-top-sources-title">Top Income Sources</div>
                    ${sourcesItems}
                </div>
            `;
        }
        
        card.innerHTML = `
            <div class="yoy-year-header">
                <h3 class="yoy-year-title">${yearData.year}</h3>
                ${index === 0 ? '<span class="yoy-year-badge">Latest</span>' : ''}
            </div>
            <div class="yoy-year-total">$${yearData.total.toLocaleString()}</div>
            <div class="yoy-year-stats">
                <div class="yoy-stat-row">
                    <span class="yoy-stat-label">Monthly Average</span>
                    <span class="yoy-stat-value">$${yearData.monthly_average.toLocaleString()}</span>
                </div>
                <div class="yoy-stat-row">
                    <span class="yoy-stat-label">Months with Income</span>
                    <span class="yoy-stat-value">${yearData.months_with_income}</span>
                </div>
                <div class="yoy-stat-row">
                    <span class="yoy-stat-label">Total Payments</span>
                    <span class="yoy-stat-value">${yearData.payment_count}</span>
                </div>
            </div>
            ${changeHTML}
            ${topSourcesHTML}
        `;
        
        grid.appendChild(card);
    });
}

// Render annual comparison bar chart
function renderYoYAnnualChart(years) {
    const canvas = document.getElementById('yoy-annual-chart');
    const emptyState = document.getElementById('yoy-annual-empty');
    const chartsGrid = document.querySelector('.yoy-charts-grid');
    
    if (!canvas) return;
    
    if (years.length === 0) {
        canvas.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        if (chartsGrid) chartsGrid.style.display = 'none';
        return;
    }
    
    canvas.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    if (chartsGrid) chartsGrid.style.display = 'grid';
    
    // Destroy existing chart
    if (yoyAnnualChart) {
        yoyAnnualChart.destroy();
    }
    
    const colors = getChartColors();
    const ctx = canvas.getContext('2d');
    
    // Sort years chronologically for display
    const sortedYears = [...years].reverse();
    
    yoyAnnualChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedYears.map(y => y.year.toString()),
            datasets: [{
                label: 'Total Annual Income',
                data: sortedYears.map(y => y.total),
                backgroundColor: colors.palette[0].bg,
                borderColor: colors.palette[0].border,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Total: $${context.parsed.y.toLocaleString()}`;
                        },
                        afterLabel: function(context) {
                            const yearData = sortedYears[context.dataIndex];
                            return `Avg/Month: $${yearData.monthly_average.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: colors.text,
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: colors.grid
                    }
                },
                x: {
                    ticks: {
                        color: colors.text
                    },
                    grid: {
                        color: colors.grid
                    }
                }
            }
        }
    });
}

// Render monthly breakdown by year
function renderYoYMonthlyChart(years) {
    const canvas = document.getElementById('yoy-monthly-chart');
    const emptyState = document.getElementById('yoy-monthly-empty');
    
    if (!canvas) return;
    
    if (years.length === 0) {
        canvas.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    
    canvas.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    
    // Destroy existing chart
    if (yoyMonthlyChart) {
        yoyMonthlyChart.destroy();
    }
    
    const colors = getChartColors();
    const ctx = canvas.getContext('2d');
    
    // Month labels
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Create datasets for each year
    const datasets = years.map((yearData, index) => {
        const monthlyData = Array(12).fill(0);
        
        // Fill in the data for months that have income
        Object.entries(yearData.by_month).forEach(([month, amount]) => {
            const monthIndex = parseInt(month) - 1;
            if (monthIndex >= 0 && monthIndex < 12) {
                monthlyData[monthIndex] = amount;
            }
        });
        
        return {
            label: yearData.year.toString(),
            data: monthlyData,
            backgroundColor: colors.palette[index % colors.palette.length].bg,
            borderColor: colors.palette[index % colors.palette.length].border,
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5
        };
    });
    
    yoyMonthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthNames,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: colors.text,
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: colors.text,
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: colors.grid
                    }
                },
                x: {
                    ticks: {
                        color: colors.text
                    },
                    grid: {
                        color: colors.grid
                    }
                }
            }
        }
    });
}

// Setup YoY event listeners
function setupYoYListeners() {
    const refreshBtn = document.getElementById('refresh-yoy-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadYearOverYearComparison);
    }
}

// Setup trends event listeners
function setupTrendsListeners() {
    // Period selector
    const periodSelect = document.getElementById('trends-period-select');
    if (periodSelect) {
        periodSelect.addEventListener('change', loadIncomeTrends);
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-trends-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadIncomeTrends);
    }
}

// Refresh charts when theme changes
function refreshChartsOnThemeChange() {
    if (totalIncomeChart || incomeBySourceChart || incomeByEarnerChart) {
        loadIncomeTrends();
    }
    if (yoyAnnualChart || yoyMonthlyChart) {
        loadYearOverYearComparison();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupAccountListeners();
    setupIncomeListeners();
    setupExpenseListeners();
    setupTrendsListeners();
    setupYoYListeners();
    loadAccounts();
    loadIncomeSources();
    loadExpenses();
    loadTotalIncome();
    loadTotalExpenses();
    calculateAvailableSpending();
    loadMonthToDateSpending();
    loadSpendingVelocity();
    loadIncomeTrends();
    loadYearOverYearComparison();
    loadTaxEstimate();
    setupTaxEstimatorListeners();
    initRetirementAccounts();
    
    // Add listener to refresh charts when theme changes
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            setTimeout(refreshChartsOnThemeChange, 100);
        });
    }
});

// ============================================
// TAX BRACKET ESTIMATOR
// ============================================

// Setup tax estimator event listeners
function setupTaxEstimatorListeners() {
    // Filing status change
    const filingStatusSelect = document.getElementById('filing-status-select');
    if (filingStatusSelect) {
        filingStatusSelect.addEventListener('change', loadTaxEstimate);
    }
    
    // Use actual income toggle
    const useActualToggle = document.getElementById('use-actual-income-toggle');
    if (useActualToggle) {
        useActualToggle.addEventListener('change', loadTaxEstimate);
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-tax-estimate-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadTaxEstimate);
    }
}

// Load and display tax estimate
async function loadTaxEstimate() {
    try {
        const filingStatus = document.getElementById('filing-status-select')?.value || 'married-joint';
        const useActual = document.getElementById('use-actual-income-toggle')?.checked || false;
        
        const response = await fetch(`${API_BASE_URL}/api/income/tax-estimate?filing_status=${filingStatus}&use_actual=${useActual}`);
        const data = await response.json();
        
        if (!data.success) {
            console.error('Failed to load tax estimate:', data.error);
            showTaxEmptyState();
            return;
        }
        
        // Check if there's any income data
        if (data.income.annual_gross === 0) {
            showTaxEmptyState();
            return;
        }
        
        // Hide empty state and show content
        const emptyState = document.getElementById('tax-empty-state');
        const summaryCards = document.getElementById('tax-summary-cards');
        const bracketsSection = document.querySelector('.tax-brackets-section');
        const withholdingSection = document.querySelector('.withholding-section');
        
        if (emptyState) emptyState.style.display = 'none';
        if (summaryCards) summaryCards.style.display = 'grid';
        if (bracketsSection) bracketsSection.style.display = 'block';
        if (withholdingSection) withholdingSection.style.display = 'block';
        
        // Update summary cards
        updateElement('tax-gross-income', formatCurrency(data.income.annual_gross));
        updateElement('tax-gross-monthly', `$${formatCurrency(data.income.monthly_gross)}/month`);
        updateElement('tax-deduction', formatCurrency(data.deductions.standard_deduction));
        updateElement('tax-total', formatCurrency(data.tax.total_annual));
        updateElement('tax-monthly', `$${formatCurrency(data.tax.total_monthly)}/month`);
        updateElement('tax-effective-rate', `${data.tax.effective_rate_percent}%`);
        updateElement('tax-marginal-rate', `${data.tax.marginal_rate_percent}%`);
        updateElement('tax-after-tax', formatCurrency(data.after_tax.annual));
        updateElement('tax-after-tax-monthly', `$${formatCurrency(data.after_tax.monthly)}/month`);
        
        // Update withholding recommendations
        updateElement('withholding-weekly', `$${formatCurrency(data.paycheck_withholding.weekly)}`);
        updateElement('withholding-biweekly', `$${formatCurrency(data.paycheck_withholding.bi_weekly)}`);
        updateElement('withholding-semimonthly', `$${formatCurrency(data.paycheck_withholding.semi_monthly)}`);
        updateElement('withholding-monthly', `$${formatCurrency(data.paycheck_withholding.monthly)}`);
        
        // Update tax brackets breakdown
        displayTaxBrackets(data.tax.by_bracket);
        
        // Update income breakdown
        if (data.income.breakdown && data.income.breakdown.length > 0) {
            displayIncomeBreakdown(data.income.breakdown);
        }
        
    } catch (error) {
        console.error('Error loading tax estimate:', error);
        showTaxEmptyState();
    }
}

// Display tax brackets breakdown
function displayTaxBrackets(brackets) {
    const container = document.getElementById('tax-brackets-list');
    if (!container) return;
    
    if (!brackets || brackets.length === 0) {
        container.innerHTML = '<p class="placeholder-text">No tax bracket data available</p>';
        return;
    }
    
    container.innerHTML = brackets.map((bracket, index) => {
        const rangeText = bracket.bracket_max 
            ? `$${formatCurrency(bracket.bracket_min)} - $${formatCurrency(bracket.bracket_max)}`
            : `Over $${formatCurrency(bracket.bracket_min)}`;
        
        return `
            <div class="tax-bracket-item">
                <div class="tax-bracket-header">
                    <span class="tax-bracket-rate">${bracket.rate_percent}%</span>
                    <span class="tax-bracket-range">${rangeText}</span>
                </div>
                <div class="tax-bracket-details">
                    <div class="tax-bracket-detail">
                        <span class="tax-bracket-detail-label">Income in Bracket</span>
                        <span class="tax-bracket-detail-value">$${formatCurrency(bracket.income_in_bracket)}</span>
                    </div>
                    <div class="tax-bracket-detail">
                        <span class="tax-bracket-detail-label">Tax Amount</span>
                        <span class="tax-bracket-detail-value">$${formatCurrency(bracket.tax_amount)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Display income breakdown
function displayIncomeBreakdown(breakdown) {
    const container = document.getElementById('income-breakdown-list');
    const section = document.getElementById('income-breakdown-section');
    
    if (!container || !section) return;
    
    if (!breakdown || breakdown.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    
    container.innerHTML = breakdown.map(income => {
        const typeLabel = income.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const earnerLabel = income.earner || income.earner_name || 'Unassigned';
        
        return `
            <div class="income-breakdown-item">
                <div class="income-breakdown-info">
                    <span class="income-breakdown-name">${income.name}</span>
                    <span class="income-breakdown-meta">${typeLabel} • ${earnerLabel}</span>
                </div>
                <span class="income-breakdown-amount">$${formatCurrency(income.annual_amount)}</span>
            </div>
        `;
    }).join('');
}

// Show empty state for tax estimator
function showTaxEmptyState() {
    const emptyState = document.getElementById('tax-empty-state');
    const summaryCards = document.getElementById('tax-summary-cards');
    const bracketsSection = document.querySelector('.tax-brackets-section');
    const withholdingSection = document.querySelector('.withholding-section');
    const breakdownSection = document.getElementById('income-breakdown-section');
    
    if (emptyState) emptyState.style.display = 'block';
    if (summaryCards) summaryCards.style.display = 'none';
    if (bracketsSection) bracketsSection.style.display = 'none';
    if (withholdingSection) withholdingSection.style.display = 'none';
    if (breakdownSection) breakdownSection.style.display = 'none';
}

// Helper function to update element text content
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// ============================================================================
// RETIREMENT ACCOUNTS FUNCTIONALITY
// ============================================================================

let currentRetirementAccountId = null;
let currentEditingAccountId = null;

// Initialize retirement accounts functionality
function initRetirementAccounts() {
    const addAccountBtn = document.getElementById('add-retirement-account-btn');
    const refreshBtn = document.getElementById('refresh-retirement-btn');
    const closeModalBtn = document.getElementById('close-retirement-account-modal');
    const cancelBtn = document.getElementById('cancel-retirement-account-btn');
    const accountForm = document.getElementById('retirement-account-form');
    const accountTypeSelect = document.getElementById('retirement-account-type');
    
    // Refresh button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            console.log('Refresh button clicked - reloading retirement accounts');
            loadRetirementAccounts();
        });
    }
    
    // Add account button
    if (addAccountBtn) {
        addAccountBtn.addEventListener('click', () => {
            currentEditingAccountId = null;
            document.getElementById('retirement-account-modal-title').textContent = 'Add Retirement Account';
            document.getElementById('save-retirement-account-btn').textContent = 'Save Account';
            accountForm.reset();
            showModal('retirement-account-modal');
            loadIncomeSourcesForDropdown();
        });
    }
    
    // Close modal buttons
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => hideModal('retirement-account-modal'));
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => hideModal('retirement-account-modal'));
    }
    
    // Account type change - auto-fill limits
    if (accountTypeSelect) {
        accountTypeSelect.addEventListener('change', (e) => {
            const limitInput = document.getElementById('retirement-annual-limit');
            const limits = {
                '401k': 23500,
                '403b': 23500,
                'traditional_ira': 7000,
                'roth_ira': 7000,
                'sep_ira': 69000,
                'simple_ira': 16000
            };
            if (limitInput) {
                limitInput.value = limits[e.target.value] || 0;
            }
        });
    }
    
    // Form submission
    if (accountForm) {
        accountForm.addEventListener('submit', handleSaveRetirementAccount);
    }
    
    // Load retirement accounts
    loadRetirementAccounts();
    
    // Initialize contribution modal
    initContributionModal();
}

// Load income sources for dropdown
async function loadIncomeSourcesForDropdown() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/income`);
        const data = await response.json();
        
        const select = document.getElementById('retirement-linked-income');
        if (!select) return;
        
        // Clear existing options except the first one
        select.innerHTML = '<option value="">None - Not linked to income</option>';
        
        // Add income sources
        if (data && Array.isArray(data)) {
            data.forEach(income => {
                const option = document.createElement('option');
                option.value = income.id;
                option.textContent = `${income.name} (${income.earner_name || 'Unassigned'})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading income sources:', error);
    }
}

// Handle save retirement account
async function handleSaveRetirementAccount(e) {
    e.preventDefault();
    
    const accountData = {
        account_name: document.getElementById('retirement-account-name').value,
        account_type: document.getElementById('retirement-account-type').value,
        contribution_type: document.getElementById('retirement-contribution-type').value,
        annual_limit: parseFloat(document.getElementById('retirement-annual-limit').value) || 0,
        current_balance: parseFloat(document.getElementById('retirement-current-balance').value) || 0,
        linked_income_id: document.getElementById('retirement-linked-income').value || null,
        contribution_per_paycheck: parseFloat(document.getElementById('retirement-contribution-per-paycheck').value) || 0,
        employer_match_percent: parseFloat(document.getElementById('retirement-employer-match-percent').value) || 0,
        employer_match_limit: parseFloat(document.getElementById('retirement-employer-match-limit').value) || 0,
        notes: document.getElementById('retirement-notes').value
    };
    
    try {
        let response;
        if (currentEditingAccountId) {
            // Update existing account
            response = await fetch(`${API_BASE_URL}/api/retirement-accounts/${currentEditingAccountId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(accountData)
            });
        } else {
            // Create new account
            response = await fetch(`${API_BASE_URL}/api/retirement-accounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(accountData)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            hideModal('retirement-account-modal');
            loadRetirementAccounts();
            showNotification(currentEditingAccountId ? 'Retirement account updated successfully!' : 'Retirement account added successfully!', 'success');
        } else {
            showNotification('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error saving retirement account:', error);
        showNotification('Failed to save retirement account', 'error');
    }
}

// Load all retirement accounts
async function loadRetirementAccounts() {
    console.log('===== LOAD RETIREMENT ACCOUNTS CALLED =====');
    
    // Show loading state on refresh button if it exists
    const refreshBtn = document.getElementById('refresh-retirement-btn');
    const originalText = refreshBtn ? refreshBtn.textContent : null;
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.textContent = '⏳ Loading...';
    }
    
    try {
        console.log('Loading retirement accounts from:', `${API_BASE_URL}/api/retirement-accounts`);
        const response = await fetch(`${API_BASE_URL}/api/retirement-accounts`);
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Received data:', JSON.stringify(data, null, 2));
        console.log('Success:', data.success);
        console.log('Accounts:', data.accounts);
        console.log('Accounts length:', data.accounts ? data.accounts.length : 'undefined');
        
        if (!data.success) {
            console.error('Failed to load retirement accounts:', data.error);
            return;
        }
        
        console.log('About to call displayRetirementAccounts with', data.accounts.length, 'accounts');
        displayRetirementAccounts(data.accounts);
        
        // Load summary
        console.log('About to call loadRetirementSummary');
        loadRetirementSummary();
    } catch (error) {
        console.error('Error loading retirement accounts:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        // Restore refresh button state
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.textContent = originalText || '🔄 Refresh';
        }
    }
}

// Display retirement accounts
function displayRetirementAccounts(accounts) {
    console.log('displayRetirementAccounts called with:', accounts);
    const listContainer = document.getElementById('retirement-accounts-list');
    console.log('List container element:', listContainer);
    if (!listContainer) {
        console.error('retirement-accounts-list element not found!');
        return;
    }
    
    if (!accounts || accounts.length === 0) {
        console.log('No accounts to display, showing empty state');
        listContainer.innerHTML = `
            <div class="retirement-empty-state">
                <div class="empty-icon">🏦</div>
                <h4>No Retirement Accounts Yet</h4>
                <p>Add a retirement account to start tracking your contributions and progress toward annual limits.</p>
            </div>
        `;
        return;
    }
    
    console.log(`Displaying ${accounts.length} retirement accounts`);
    
    listContainer.innerHTML = accounts.map(account => {
        const accountTypes = {
            '401k': '401(k)',
            '403b': '403(b)',
            'traditional_ira': 'Traditional IRA',
            'roth_ira': 'Roth IRA',
            'sep_ira': 'SEP IRA',
            'simple_ira': 'SIMPLE IRA'
        };
        
        const contributionTypes = {
            'pre_tax': 'Pre-Tax',
            'post_tax': 'Post-Tax (Roth)',
            'both': 'Pre & Post-Tax'
        };
        
        const progressPercent = account.limit_percentage || 0;
        const isNearLimit = progressPercent >= 80;
        const isAtLimit = progressPercent >= 100;
        
        return `
            <div class="retirement-account-card" data-account-id="${account.id}">
                <div class="retirement-account-header">
                    <div class="retirement-account-title">
                        <h4>${account.account_name}</h4>
                        <div class="retirement-account-type">
                            <span class="retirement-account-badge">${accountTypes[account.account_type] || account.account_type}</span>
                            <span>${contributionTypes[account.contribution_type] || account.contribution_type}</span>
                        </div>
                    </div>
                    <div class="retirement-account-actions">
                        <button class="btn-add-contribution" onclick="openContributionModal(${account.id}, '${account.account_name}')">
                            💰 Add Contribution
                        </button>
                        <button class="btn-edit-account" onclick="editRetirementAccount(${account.id})">
                            ✏️ Edit
                        </button>
                        <button class="btn-delete-account" onclick="deleteRetirementAccount(${account.id}, '${account.account_name}')">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
                
                <div class="retirement-account-stats">
                    <div class="retirement-stat">
                        <span class="retirement-stat-label">Current Balance</span>
                        <span class="retirement-stat-value">$${formatNumber(account.current_balance)}</span>
                    </div>
                    <div class="retirement-stat">
                        <span class="retirement-stat-label">YTD Employee</span>
                        <span class="retirement-stat-value positive">$${formatNumber(account.ytd_employee)}</span>
                    </div>
                    <div class="retirement-stat">
                        <span class="retirement-stat-label">YTD Employer</span>
                        <span class="retirement-stat-value positive">$${formatNumber(account.ytd_employer)}</span>
                    </div>
                    <div class="retirement-stat">
                        <span class="retirement-stat-label">Annual Limit</span>
                        <span class="retirement-stat-value">$${formatNumber(account.annual_limit)}</span>
                    </div>
                    <div class="retirement-stat">
                        <span class="retirement-stat-label">Remaining</span>
                        <span class="retirement-stat-value ${isAtLimit ? 'danger' : isNearLimit ? 'warning' : 'positive'}">
                            $${formatNumber(account.remaining_limit)}
                        </span>
                    </div>
                </div>
                
                <div class="retirement-progress-bar">
                    <div class="retirement-progress-fill" style="width: ${Math.min(progressPercent, 100)}%">
                        ${progressPercent > 10 ? `<span class="retirement-progress-text">${progressPercent.toFixed(1)}%</span>` : ''}
                    </div>
                </div>
                
                ${account.contributions && account.contributions.length > 0 ? `
                    <div class="retirement-contributions-list">
                        <div class="retirement-contributions-header">
                            <h5>Recent Contributions (${account.contributions.length})</h5>
                            <button class="contributions-toggle-btn" onclick="toggleContributions(${account.id})">
                                View All
                            </button>
                        </div>
                        <div class="contributions-list" id="contributions-list-${account.id}" style="display: none;">
                            ${account.contributions.slice().reverse().slice(0, 10).map(contrib => `
                                <div class="contribution-item">
                                    <div class="contribution-info">
                                        <span class="contribution-date">${formatDate(contrib.date)}</span>
                                        <span class="contribution-amount">$${formatNumber(contrib.amount)}</span>
                                        <span class="contribution-type">${contrib.contribution_type === 'employer_match' ? 'Employer Match' : contrib.contribution_type === 'employee' ? 'Employee' : contrib.contribution_type}</span>
                                        ${contrib.note ? `<span class="contribution-note">${contrib.note}</span>` : ''}
                                    </div>
                                    <div class="contribution-actions">
                                        <button class="btn-delete-contribution" onclick="deleteContribution(${account.id}, ${contrib.id})">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${account.notes ? `<p class="account-notes"><strong>Notes:</strong> ${account.notes}</p>` : ''}
            </div>
        `;
    }).join('');
}

// Load retirement summary
async function loadRetirementSummary() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/retirement-accounts/summary`);
        const data = await response.json();
        
        if (!data.success) {
            console.error('Failed to load retirement summary');
            return;
        }
        
        const summary = data.summary;
        const summaryCards = document.getElementById('retirement-summary-cards');
        
        if (summary.total_accounts === 0) {
            if (summaryCards) summaryCards.style.display = 'none';
            return;
        }
        
        if (summaryCards) summaryCards.style.display = 'grid';
        
        updateElement('retirement-total-balance', `$${formatNumber(summary.total_balance)}`);
        updateElement('retirement-ytd-contributions', `$${formatNumber(summary.ytd_contributions)}`);
        updateElement('retirement-ytd-employee', `$${formatNumber(summary.ytd_employee_contributions)}`);
        updateElement('retirement-ytd-employer', `$${formatNumber(summary.ytd_employer_contributions)}`);
        updateElement('retirement-total-accounts', summary.total_accounts);
        updateElement('retirement-current-year', summary.current_year);
    } catch (error) {
        console.error('Error loading retirement summary:', error);
    }
}

// Edit retirement account
async function editRetirementAccount(accountId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/retirement-accounts`);
        const data = await response.json();
        
        if (!data.success) return;
        
        const account = data.accounts.find(acc => acc.id === accountId);
        if (!account) return;
        
        currentEditingAccountId = accountId;
        document.getElementById('retirement-account-modal-title').textContent = 'Edit Retirement Account';
        document.getElementById('save-retirement-account-btn').textContent = 'Update Account';
        
        // Fill form with existing data
        document.getElementById('retirement-account-name').value = account.account_name;
        document.getElementById('retirement-account-type').value = account.account_type;
        document.getElementById('retirement-contribution-type').value = account.contribution_type;
        document.getElementById('retirement-annual-limit').value = account.annual_limit;
        document.getElementById('retirement-current-balance').value = account.current_balance;
        document.getElementById('retirement-contribution-per-paycheck').value = account.contribution_per_paycheck || 0;
        document.getElementById('retirement-employer-match-percent').value = account.employer_match_percent || 0;
        document.getElementById('retirement-employer-match-limit').value = account.employer_match_limit || 0;
        document.getElementById('retirement-notes').value = account.notes || '';
        
        await loadIncomeSourcesForDropdown();
        if (account.linked_income_id) {
            document.getElementById('retirement-linked-income').value = account.linked_income_id;
        }
        
        showModal('retirement-account-modal');
    } catch (error) {
        console.error('Error loading account for editing:', error);
    }
}

// Delete retirement account
async function deleteRetirementAccount(accountId, accountName) {
    if (!confirm(`Are you sure you want to delete the retirement account "${accountName}"? This will also delete all contribution history.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/retirement-accounts/${accountId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadRetirementAccounts();
            showNotification('Retirement account deleted successfully', 'success');
        } else {
            showNotification('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error deleting retirement account:', error);
        showNotification('Failed to delete retirement account', 'error');
    }
}

// Toggle contributions visibility
function toggleContributions(accountId) {
    const list = document.getElementById(`contributions-list-${accountId}`);
    if (list) {
        list.style.display = list.style.display === 'none' ? 'flex' : 'none';
    }
}

// Initialize contribution modal
function initContributionModal() {
    const closeModalBtn = document.getElementById('close-contribution-modal');
    const cancelBtn = document.getElementById('cancel-contribution-btn');
    const contributionForm = document.getElementById('contribution-form');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => hideModal('contribution-modal'));
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => hideModal('contribution-modal'));
    }
    
    if (contributionForm) {
        contributionForm.addEventListener('submit', handleSaveContribution);
    }
    
    // Set default date to today
    const dateInput = document.getElementById('contribution-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}

// Open contribution modal
function openContributionModal(accountId, accountName) {
    currentRetirementAccountId = accountId;
    document.getElementById('contribution-account-id').value = accountId;
    document.getElementById('contribution-account-display').textContent = accountName;
    document.getElementById('contribution-form').reset();
    
    // Set default date to today
    const dateInput = document.getElementById('contribution-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    showModal('contribution-modal');
}

// Handle save contribution
async function handleSaveContribution(e) {
    e.preventDefault();
    
    const accountId = parseInt(document.getElementById('contribution-account-id').value);
    const contributionData = {
        date: document.getElementById('contribution-date').value,
        amount: parseFloat(document.getElementById('contribution-amount').value),
        contribution_type: document.getElementById('contribution-type').value,
        note: document.getElementById('contribution-note').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/retirement-accounts/${accountId}/contributions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contributionData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            hideModal('contribution-modal');
            loadRetirementAccounts();
            showNotification('Contribution added successfully!', 'success');
        } else {
            showNotification('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error saving contribution:', error);
        showNotification('Failed to save contribution', 'error');
    }
}

// Delete contribution
async function deleteContribution(accountId, contributionId) {
    if (!confirm('Are you sure you want to delete this contribution?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/retirement-accounts/${accountId}/contributions/${contributionId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadRetirementAccounts();
            showNotification('Contribution deleted successfully', 'success');
        } else {
            showNotification('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error deleting contribution:', error);
        showNotification('Failed to delete contribution', 'error');
    }
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}




