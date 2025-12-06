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
        });
    });
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
        
        // Refresh total
        loadTotalIncome();
        
        // Reload overdraft status when income changes
        loadOverdraftStatus();
    } catch (error) {
        console.error('Failed to load income sources:', error);
    }
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
        return `
            <div class="income-item">
                <div class="income-item-header">
                    <span class="income-icon">${icon}</span>
                    <div class="income-info">
                        <h4>${source.name}</h4>
                        <span class="income-type-label">${formatIncomeType(source.type)}</span>
                    </div>
                    <div class="income-amount-section">
                        <p class="income-amount">$${formatCurrency(source.amount)}</p>
                        <span class="income-frequency">${formatFrequency(source.frequency)}</span>
                    </div>
                </div>
                <div class="income-item-footer">
                    <div class="income-monthly">
                        <span class="monthly-label">Monthly equivalent:</span>
                        <span class="monthly-amount">$${formatCurrency(monthlyAmount)}</span>
                    </div>
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
    }
    
    modal.style.display = 'flex';
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
            document.getElementById('income-amount').value = income.amount;
            document.getElementById('income-frequency').value = income.frequency;
            document.getElementById('income-next-pay-date').value = income.next_pay_date || '';
            document.getElementById('income-notes').value = income.notes || '';
        }
    } catch (error) {
        console.error('Failed to load income data:', error);
    }
}

// Save income source (add or update)
async function saveIncome(event) {
    event.preventDefault();
    
    const incomeData = {
        type: document.getElementById('income-type').value,
        name: document.getElementById('income-name').value,
        amount: parseFloat(document.getElementById('income-amount').value),
        frequency: document.getElementById('income-frequency').value,
        next_pay_date: document.getElementById('income-next-pay-date').value || null,
        notes: document.getElementById('income-notes').value
    };
    
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
        }
    } catch (error) {
        console.error('Failed to save income:', error);
        alert('Failed to save income source. Please try again.');
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

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupAccountListeners();
    setupIncomeListeners();
    setupExpenseListeners();
    loadAccounts();
    loadIncomeSources();
    loadExpenses();
    loadTotalIncome();
    loadTotalExpenses();
    calculateAvailableSpending();
    loadMonthToDateSpending();
    loadSpendingVelocity();
});


