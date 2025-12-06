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
        loadTotalIncome();
        loadTotalExpenses();
        loadMonthToDateSpending();
        
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

// Load and display accounts
async function loadAccounts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/accounts`);
        const accounts = await response.json();
        displayAccounts(accounts);
        updateAccountSummaries(accounts);
    } catch (error) {
        console.error('Failed to load accounts:', error);
    }
}

// Display accounts in the dashboard
function displayAccounts(accounts) {
    const container = document.getElementById('accounts-container');
    
    if (!accounts || accounts.length === 0) {
        container.innerHTML = '<p class="placeholder-text">No accounts added yet. Click "Add Account" to get started.</p>';
        return;
    }
    
    container.innerHTML = accounts.map(account => {
        const accountIcon = getAccountIcon(account.type);
        const balanceClass = getBalanceClass(account.type, account.balance);
        return `
            <div class="account-card ${account.type}-account">
                <div class="account-header">
                    <span class="account-icon">${accountIcon}</span>
                    <h4>${account.name}</h4>
                </div>
                <p class="account-balance ${balanceClass}">$${formatCurrency(account.balance)}</p>
                <p class="account-type">${formatAccountType(account.type)}</p>
                <div class="account-actions">
                    <button class="btn-icon" onclick="editAccount(${account.id})" title="Edit">✏️</button>
                    <button class="btn-icon" onclick="deleteAccount(${account.id})" title="Delete">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
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

// Save account (add or update)
async function saveAccount(event) {
    event.preventDefault();
    
    const accountData = {
        type: document.getElementById('account-type').value,
        name: document.getElementById('account-name').value,
        balance: parseFloat(document.getElementById('account-balance').value)
    };
    
    try {
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
            hideAccountModal();
            loadAccounts();
        }
    } catch (error) {
        console.error('Failed to save account:', error);
        alert('Failed to save account. Please try again.');
    }
}

// Edit account
function editAccount(accountId) {
    showAccountModal(accountId);
}

// Delete account
async function deleteAccount(accountId) {
    if (!confirm('Are you sure you want to delete this account?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/accounts/${accountId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        if (result.success) {
            loadAccounts();
        }
    } catch (error) {
        console.error('Failed to delete account:', error);
        alert('Failed to delete account. Please try again.');
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
        // Fetch both income and expenses totals
        const [incomeResponse, expensesResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/income/total`),
            fetch(`${API_BASE_URL}/api/expenses/total`)
        ]);
        
        const incomeData = await incomeResponse.json();
        const expensesData = await expensesResponse.json();
        
        const totalIncome = incomeData.total || 0;
        const totalExpenses = expensesData.total || 0;
        
        // Calculate available money (Income - Fixed Expenses)
        const available = totalIncome - totalExpenses;
        
        // Update display
        const availableCard = document.querySelector('.available-card .summary-amount');
        if (availableCard) {
            availableCard.textContent = `$${formatCurrency(available)}`;
            
            // Add color coding based on available amount
            if (available < 0) {
                availableCard.style.color = 'var(--danger-color, #ff4444)';
            } else if (available < 500) {
                availableCard.style.color = 'var(--warning-color, #ff9800)';
            } else {
                availableCard.style.color = 'var(--success-color, #4caf50)';
            }
        }
    } catch (error) {
        console.error('Failed to calculate available spending:', error);
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

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupAccountListeners();
    setupIncomeListeners();
    loadAccounts();
    loadIncomeSources();
    loadTotalIncome();
});


