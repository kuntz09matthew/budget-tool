// Dashboard Module
import * as API from '../api.js';
import { formatCurrency, showNotification } from '../utils.js';
import { showLoading, showError, showEmptyState, setupSubTabs } from '../ui.js';
import { setState, getState, onStateChange } from '../state.js';
import { injectTab } from '../templates.js';

// Dashboard HTML Template
const dashboardHTML = `
    <div class="dashboard-header">
        <h2>Financial Overview</h2>
        <p class="dashboard-date" id="current-date"></p>
    </div>
    
    <!-- Dashboard Sub-Tabs -->
    <nav class="sub-tab-nav">
        <button class="sub-tab-btn active" data-subtab="dashboard-overview" data-tooltip="Quick view of all key financial metrics and account balances">
            <span class="sub-tab-icon">🏠</span>
            <span class="sub-tab-label">Overview</span>
        </button>
        <button class="sub-tab-btn" data-subtab="dashboard-insights" data-tooltip="Smart recommendations and spending pattern analysis">
            <span class="sub-tab-icon">💡</span>
            <span class="sub-tab-label">Insights</span>
        </button>
        <button class="sub-tab-btn" data-subtab="dashboard-alerts" data-tooltip="Overdraft warnings, upcoming bills, and budget health monitoring">
            <span class="sub-tab-icon">⚠️</span>
            <span class="sub-tab-label">Alerts & Warnings</span>
        </button>
        <button class="sub-tab-btn" data-subtab="dashboard-accounts" data-tooltip="Detailed view of all account balances and recent activity">
            <span class="sub-tab-icon">💳</span>
            <span class="sub-tab-label">Accounts</span>
        </button>
        <button class="sub-tab-btn" data-subtab="dashboard-velocity" data-tooltip="Track spending pace and countdown to next paycheck">
            <span class="sub-tab-icon">⚡</span>
            <span class="sub-tab-label">Spending Pace</span>
        </button>
    </nav>
    
    <div class="sub-tab-description" id="dashboard-overview-desc"></div>
    
    <!-- Overview Sub-Tab -->
    <div id="dashboard-overview" class="sub-tab-content active">
        <div class="summary-cards" id="summary-cards"></div>
    </div>
    
    <!-- Insights Sub-Tab -->
    <div id="dashboard-insights" class="sub-tab-content">
        <div id="insights-container"></div>
    </div>
    
    <!-- Alerts Sub-Tab -->
    <div id="dashboard-alerts" class="sub-tab-content">
        <div id="alerts-container"></div>
    </div>
    
    <!-- Accounts Sub-Tab -->
    <div id="dashboard-accounts" class="sub-tab-content">
        <div class="section-header">
            <h3>All Accounts</h3>
            <button class="btn-primary" id="add-account-btn">+ Add Account</button>
        </div>
        <div id="accounts-container"></div>
    </div>
    
    <!-- Velocity Sub-Tab -->
    <div id="dashboard-velocity" class="sub-tab-content">
        <div id="velocity-container"></div>
    </div>
`;

/**
 * Initialize dashboard module
 */
export function init() {
    console.log('Initializing Dashboard module...');
    
    // Inject HTML template
    injectTab('dashboard', dashboardHTML, true);
    
    // Setup sub-tab navigation
    setupSubTabs('dashboard');
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    loadDashboardData();
}

/**
 * Setup dashboard-specific event listeners
 */
function setupEventListeners() {
    // Listen for tab changes
    window.addEventListener('tabChange', (e) => {
        if (e.detail.tab === 'dashboard') {
            refreshDashboard();
        }
    });
    
    // Listen for sub-tab changes in dashboard
    window.addEventListener('subTabChange', (e) => {
        if (e.detail.parentTab === 'dashboard') {
            handleSubTabChange(e.detail.subTab);
        }
    });
    
    // Setup account management buttons
    const addAccountBtn = document.getElementById('add-account-btn');
    if (addAccountBtn) {
        addAccountBtn.addEventListener('click', () => showAccountModal());
    }
}

/**
 * Load all dashboard data
 */
export async function loadDashboardData() {
    // Load the overview by default
    await loadOverview();
}

/**
 * Refresh dashboard (reload all data)
 */
export async function refreshDashboard() {
    // Reload the current sub-tab
    const activeSubTab = document.querySelector('.sub-tab-btn.active');
    if (activeSubTab) {
        const subTab = activeSubTab.dataset.subtab;
        handleSubTabChange(subTab);
    } else {
        await loadOverview();
    }
}

/**
 * Handle sub-tab changes
 */
function handleSubTabChange(subTab) {
    switch (subTab) {
        case 'dashboard-overview':
            loadOverview();
            break;
        case 'dashboard-insights':
            loadInsights();
            break;
        case 'dashboard-alerts':
            loadAlerts();
            break;
        case 'dashboard-accounts':
            loadAccounts();
            break;
        case 'dashboard-velocity':
            loadSpendingVelocity();
            break;
    }
}

// Old update functions removed - now using renderOverviewCards() instead

/**
 * Load overview sub-tab
 */
async function loadOverview() {
    console.log('Loading overview...');
    showLoading('summary-cards', 'Loading dashboard metrics...');
    
    try {
        // Load all data
        const [accounts, summary, availableSpending, mtdSpending, nextPaycheck, healthScore, totalIncome, totalExpenses] = await Promise.all([
            API.getAccounts(),
            API.getAccountSummary(),
            API.getAvailableSpending(),
            API.getMonthToDateSpending(),
            API.getNextPaycheckCountdown(),
            API.getBudgetHealthScore(),
            API.getTotalIncome(),
            API.getTotalExpenses()
        ]);
        
        // Render the overview cards
        renderOverviewCards({ accounts, summary, availableSpending, mtdSpending, nextPaycheck, healthScore, totalIncome, totalExpenses });
    } catch (error) {
        console.error('Error loading overview:', error);
        showError('summary-cards', 'Failed to load dashboard overview');
    }
}

/**
 * Render overview cards with all dashboard metrics
 */
function renderOverviewCards(data) {
    const container = document.getElementById('summary-cards');
    if (!container) return;
    
    const { accounts, summary, availableSpending, mtdSpending, nextPaycheck, healthScore, totalIncome, totalExpenses } = data;
    
    // Check if we have ANY data at all
    const hasAnyData = (
        summary?.has_data || 
        availableSpending?.has_data || 
        mtdSpending?.has_data || 
        healthScore?.has_data ||
        (accounts && accounts.length > 0) ||
        (totalIncome && totalIncome.total > 0) ||
        (totalExpenses && totalExpenses.total > 0)
    );
    
    // Show welcome screen if no data
    if (!hasAnyData) {
        showWelcomeScreen(container);
        return;
    }
    
    // Build the HTML for all summary cards
    let html = `
        <!-- Account Balances -->
        <div class="summary-card">
            <div class="card-icon">💰</div>
            <h3>Total Balance</h3>
            <p class="card-value">${formatCurrency(summary.net_worth || 0)}</p>
            <p class="card-detail">${accounts.length} account${accounts.length !== 1 ? 's' : ''}</p>
        </div>
        
        <div class="summary-card">
            <div class="card-icon">💳</div>
            <h3>Checking</h3>
            <p class="card-value">${formatCurrency(summary.checking_total || 0)}</p>
        </div>
        
        <div class="summary-card">
            <div class="card-icon">🏦</div>
            <h3>Savings</h3>
            <p class="card-value">${formatCurrency(summary.savings_total || 0)}</p>
        </div>
        
        <div class="summary-card">
            <div class="card-icon">💳</div>
            <h3>Credit</h3>
            <p class="card-value ${summary.credit_total < 0 ? 'negative' : ''}">${formatCurrency(summary.credit_total || 0)}</p>
        </div>
        
        <!-- Total Monthly Income -->
        <div class="summary-card card-success">
            <div class="card-icon">💰</div>
            <h3>Monthly Income</h3>
            <p class="card-value">${formatCurrency(totalIncome?.total || 0)}</p>
            <p class="card-detail">Expected per month</p>
        </div>
        
        <!-- Total Fixed Expenses -->
        <div class="summary-card card-warning">
            <div class="card-icon">💸</div>
            <h3>Fixed Expenses</h3>
            <p class="card-value">${formatCurrency(totalExpenses?.total || 0)}</p>
            <p class="card-detail">Monthly bills & obligations</p>
        </div>
        
        <!-- Available Spending -->
        <div class="summary-card clickable ${availableSpending.status === 'danger' ? 'card-danger' : availableSpending.status === 'warning' ? 'card-warning' : 'card-success'}" 
             onclick="window.dashboardModule.showAvailableSpendingBreakdown()" 
             style="cursor: pointer;" 
             title="Click for detailed breakdown">
            <div class="card-icon">💵</div>
            <h3>Available Spending</h3>
            <p class="card-value ${availableSpending.available < 0 ? 'negative' : ''}">${formatCurrency(availableSpending.available || 0)}</p>
            <p class="card-detail">${availableSpending.message || 'After bills & expenses'}</p>
            ${availableSpending.available_per_day ? `<p class="card-extra-detail">${formatCurrency(availableSpending.available_per_day)}/day</p>` : ''}
        </div>
        
        <!-- Month to Date Spending -->
        <div class="summary-card clickable ${mtdSpending.status === 'danger' ? 'card-danger' : mtdSpending.status === 'warning' ? 'card-warning' : 'card-info'}" 
             onclick="window.dashboardModule.showMTDSpendingBreakdown()" 
             style="cursor: pointer;" 
             title="Click for detailed breakdown">
            <div class="card-icon">📊</div>
            <h3>Spent This Month</h3>
            <p class="card-value">${formatCurrency(mtdSpending.total || 0)}</p>
            <p class="card-detail">${mtdSpending.percent_of_month ? `${mtdSpending.percent_of_month.toFixed(1)}% of month elapsed` : ''}</p>
            ${mtdSpending.daily_average ? `<p class="card-extra-detail">${formatCurrency(mtdSpending.daily_average)}/day average</p>` : ''}
        </div>
        
        <!-- Next Paycheck -->
        <div class="summary-card">
            <div class="card-icon">📅</div>
            <h3>Next Paycheck</h3>
            <p class="card-value">${nextPaycheck.days_until !== undefined ? `${nextPaycheck.days_until} days` : 'N/A'}</p>
            <p class="card-detail">${nextPaycheck.date || 'No upcoming paycheck'}</p>
        </div>
        
        <!-- Budget Health Score -->
        <div class="summary-card ${healthScore.score >= 80 ? 'card-success' : healthScore.score >= 60 ? 'card-warning' : 'card-danger'}">
            <div class="card-icon">${healthScore.icon || '💪'}</div>
            <h3>Budget Health</h3>
            <p class="card-value">${healthScore.score !== undefined ? `${healthScore.score}/100` : 'N/A'}</p>
            <p class="card-detail">${healthScore.grade_text || healthScore.grade || ''} ${healthScore.grade ? `(${healthScore.grade})` : ''}</p>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Load insights sub-tab
 */
async function loadInsights() {
    console.log('Loading insights...');
    showLoading('insights-container', 'Loading insights...');
    
    try {
        const [patterns, recommendations] = await Promise.all([
            API.getSpendingPatterns(),
            API.getSmartRecommendations()
        ]);
        
        displayInsights(patterns, recommendations);
    } catch (error) {
        console.error('Error loading insights:', error);
        showError('insights-container', 'Failed to load insights');
    }
}

/**
 * Display insights
 */
function displayInsights(patternsData, recommendationsData) {
    const container = document.getElementById('insights-container');
    if (!container) return;
    
    // Extract the actual arrays from the API response
    const patterns = patternsData?.patterns || patternsData || [];
    const alerts = patternsData?.alerts || [];
    const insights = patternsData?.insights || [];
    const recommendations = recommendationsData?.recommendations || recommendationsData || [];
    const priorityActions = recommendationsData?.priority_actions || [];
    
    let html = '<div class="insights-grid">';
    
    // Display priority actions first (urgent/critical)
    if (priorityActions && priorityActions.length > 0) {
        html += '<div class="insight-section priority"><h3>⚡ Priority Actions</h3>';
        priorityActions.forEach(action => {
            const priorityClass = action.priority === 'critical' ? 'critical' : action.priority === 'urgent' ? 'urgent' : 'high';
            html += `
                <div class="insight-card ${priorityClass}">
                    <span class="insight-icon">${action.icon || '⚠️'}</span>
                    <h4>${action.action}</h4>
                    <p><strong>${action.reason}</strong></p>
                    <small>${action.impact}</small>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Display spending alerts
    if (alerts && alerts.length > 0) {
        html += '<div class="insight-section"><h3>⚠️ Spending Alerts</h3>';
        alerts.forEach(alert => {
            html += `
                <div class="insight-card alert-${alert.severity || 'medium'}">
                    <span class="insight-icon">${alert.icon || '📊'}</span>
                    <h4>${alert.message}</h4>
                    <p>${alert.detail || ''}</p>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Display positive insights
    if (insights && insights.length > 0) {
        html += '<div class="insight-section"><h3>💡 Insights</h3>';
        insights.forEach(insight => {
            html += `
                <div class="insight-card insight-${insight.type}">
                    <span class="insight-icon">${insight.icon || '📊'}</span>
                    <h4>${insight.message}</h4>
                    <p>${insight.detail || ''}</p>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Display recommendations
    if (recommendations && recommendations.length > 0) {
        html += '<div class="insight-section"><h3>💡 Recommendations</h3>';
        recommendations.forEach(rec => {
            const recObj = typeof rec === 'string' ? { message: rec } : rec;
            html += `
                <div class="recommendation-card priority-${recObj.priority || 'low'}">
                    <span class="rec-icon">${recObj.icon || '💡'}</span>
                    <h4>${recObj.action || recObj.message || rec}</h4>
                    ${recObj.reason ? `<p>${recObj.reason}</p>` : ''}
                    ${recObj.impact ? `<small>Impact: ${recObj.impact}</small>` : ''}
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Show empty state if no insights
    if (priorityActions.length === 0 && alerts.length === 0 && insights.length === 0 && recommendations.length === 0) {
        html += `
            <div class="empty-insights">
                <span class="empty-icon">📊</span>
                <p>Keep tracking your income and expenses to get personalized insights and recommendations!</p>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Load alerts sub-tab
 */
async function loadAlerts() {
    console.log('Loading alerts...');
    showLoading('alerts-container', 'Loading alerts...');
    
    try {
        const [overdraft, upcomingBills, healthScore] = await Promise.all([
            API.getOverdraftWarning(),
            API.getUpcomingBills(),
            API.getBudgetHealthScore()
        ]);
        
        displayAlerts(overdraft, upcomingBills, healthScore);
    } catch (error) {
        console.error('Error loading alerts:', error);
        showError('alerts-container', 'Failed to load alerts');
    }
}

/**
 * Display alerts
 */
function displayAlerts(overdraft, upcomingBills, healthScore) {
    const container = document.getElementById('alerts-container');
    if (!container) return;
    
    let html = '<div class="alerts-grid">';
    
    // Overdraft warning
    if (overdraft && overdraft.warning) {
        html += `
            <div class="alert-card alert-danger">
                <span class="alert-icon">⚠️</span>
                <h4>Overdraft Warning</h4>
                <p>${overdraft.message}</p>
            </div>
        `;
    }
    
    // Budget health
    if (healthScore) {
        const healthClass = healthScore.score >= 80 ? 'alert-success' : 
                           healthScore.score >= 60 ? 'alert-warning' : 'alert-danger';
        const recommendations = healthScore.recommendations || [];
        html += `
            <div class="alert-card ${healthClass}">
                <span class="alert-icon">${healthScore.icon || '💪'}</span>
                <h4>Budget Health: ${healthScore.score}/100 (${healthScore.grade || 'N/A'})</h4>
                <p><strong>${healthScore.grade_text || ''}</strong></p>
                ${recommendations.length > 0 ? `
                    <ul class="recommendations-list">
                        ${recommendations.slice(0, 3).map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        `;
    }
    
    // Upcoming bills
    const bills = upcomingBills?.bills || upcomingBills || [];
    if (bills && bills.length > 0) {
        const totalDue = upcomingBills?.total_due || 0;
        html += `
            <div class="alert-card alert-info">
                <span class="alert-icon">📅</span>
                <h4>Upcoming Bills (${bills.length})</h4>
                <p class="alert-subtitle">Total Due: ${formatCurrency(totalDue)}</p>
                <ul class="bills-list">
        `;
        bills.forEach(bill => {
            const urgencyClass = bill.urgency === 'urgent' ? 'urgent' : '';
            html += `<li class="${urgencyClass}">${bill.name}: ${formatCurrency(bill.amount)} due ${bill.due_date_formatted || bill.due_date} (${bill.days_until_due} days)</li>`;
        });
        html += '</ul></div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Load accounts sub-tab
 */
async function loadAccounts() {
    console.log('Loading accounts...');
    showLoading('accounts-container', 'Loading accounts...');
    
    try {
        const accounts = await API.getAccounts();
        displayAccounts(accounts);
    } catch (error) {
        console.error('Error loading accounts:', error);
        showError('accounts-container', 'Failed to load accounts');
    }
}

/**
 * Display accounts
 */
function displayAccounts(accounts) {
    const container = document.getElementById('accounts-container');
    if (!container) return;
    
    if (accounts.length === 0) {
        showEmptyState(
            'accounts-container',
            '💳',
            'No accounts yet. Add your first account to get started!',
            { text: 'Add Account', action: 'BudgetApp.modules.Dashboard.showAccountModal()' }
        );
        return;
    }
    
    // Group accounts by type
    const groupedAccounts = {
        checking: [],
        savings: [],
        credit: [],
        investment: []
    };
    
    accounts.forEach(account => {
        if (groupedAccounts[account.type]) {
            groupedAccounts[account.type].push(account);
        }
    });
    
    let html = '';
    
    // Display accounts by type
    const typeLabels = {
        checking: '💳 Checking Accounts',
        savings: '🏦 Savings Accounts',
        credit: '💳 Credit Cards',
        investment: '📈 Investment Accounts'
    };
    
    Object.entries(groupedAccounts).forEach(([type, typeAccounts]) => {
        if (typeAccounts.length > 0) {
            html += `
                <div class="account-type-section">
                    <h3 class="account-type-header">${typeLabels[type]}</h3>
                    <div class="accounts-grid">
            `;
            
            typeAccounts.forEach(account => {
                const balanceClass = account.balance < 0 ? 'negative-balance' : '';
                const lastUpdated = account.updated_at 
                    ? new Date(account.updated_at).toLocaleDateString()
                    : 'N/A';
                
                html += `
                    <div class="account-card ${type}-account">
                        <div class="account-header">
                            <span class="account-icon">${getAccountIcon(account.type)}</span>
                            <div class="account-title">
                                <h4>${account.name}</h4>
                                ${account.institution ? `<span class="account-institution">${account.institution}</span>` : ''}
                            </div>
                        </div>
                        <div class="account-balance ${balanceClass}">
                            ${formatCurrency(account.balance)}
                        </div>
                        ${account.notes ? `<div class="account-notes">${account.notes}</div>` : ''}
                        <div class="account-meta">
                            <span class="account-updated">Updated: ${lastUpdated}</span>
                        </div>
                        <div class="account-actions">
                            <button class="btn-icon" onclick="BudgetApp.modules.Dashboard.editAccount('${account.id}')" title="Edit Account">✏️</button>
                            <button class="btn-icon btn-icon-danger" onclick="BudgetApp.modules.Dashboard.deleteAccount('${account.id}')" title="Delete Account">🗑️</button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div></div>';
        }
    });
    
    container.innerHTML = html;
}

/**
 * Get account icon
 */
function getAccountIcon(type) {
    const icons = {
        checking: '💳',
        savings: '🏦',
        credit: '💳',
        investment: '📈'
    };
    return icons[type] || '💰';
}

/**
 * Load spending velocity sub-tab
 */
async function loadSpendingVelocity() {
    console.log('Loading spending velocity...');
    showLoading('velocity-container', 'Loading spending pace...');
    
    try {
        const velocity = await API.getSpendingVelocity();
        displaySpendingVelocity(velocity);
    } catch (error) {
        console.error('Error loading spending velocity:', error);
        showError('velocity-container', 'Failed to load spending pace');
    }
}

/**
 * Display spending velocity
 */
function displaySpendingVelocity(velocity) {
    const container = document.getElementById('velocity-container');
    if (!container) return;
    
    let html = `
        <div class="velocity-card">
            <h3>Spending Pace</h3>
            <div class="velocity-meter">
                <div class="velocity-bar" style="width: ${velocity.percentOfBudget || 0}%"></div>
            </div>
            <p>You've spent <strong>${formatCurrency(velocity.spent || 0)}</strong> of your <strong>${formatCurrency(velocity.budget || 0)}</strong> budget</p>
            <p class="velocity-status">${velocity.status || ''}</p>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Show welcome/empty state screen
 */
function showWelcomeScreen(container) {
    const html = `
        <div class="welcome-screen">
            <div class="welcome-content">
                <div class="welcome-icon">👋</div>
                <h2>Welcome to Your Financial Assistant!</h2>
                <p class="welcome-subtitle">Let's get started by setting up your budget</p>
                
                <div class="welcome-steps">
                    <div class="welcome-step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h3>Add Your Accounts</h3>
                            <p>Start by adding your checking, savings, and credit card accounts to track your total balance.</p>
                            <button class="btn-primary" onclick="BudgetApp.switchTab('spending', 'spending-accounts')">
                                <span class="btn-icon">💳</span> Add Accounts
                            </button>
                        </div>
                    </div>
                    
                    <div class="welcome-step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h3>Set Up Income Sources</h3>
                            <p>Add your salary, freelance income, or any other income sources to know how much money you have coming in.</p>
                            <button class="btn-primary" onclick="BudgetApp.switchTab('income')">
                                <span class="btn-icon">💰</span> Add Income
                            </button>
                        </div>
                    </div>
                    
                    <div class="welcome-step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h3>Track Fixed Expenses</h3>
                            <p>Enter your monthly bills like rent, utilities, and subscriptions to calculate your available spending money.</p>
                            <button class="btn-primary" onclick="BudgetApp.switchTab('expenses')">
                                <span class="btn-icon">📝</span> Add Expenses
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="welcome-footer">
                    <p class="welcome-tip">💡 <strong>Tip:</strong> You can start with just one or two items and add more later. The app will grow with you!</p>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Show account modal for adding or editing
 */
export async function showAccountModal(accountId = null) {
    const isEdit = accountId !== null;
    let account = null;
    
    // If editing, fetch the account data
    if (isEdit) {
        try {
            const accounts = await API.getAccounts();
            account = accounts.find(a => a.id === parseInt(accountId));
            if (!account) {
                showNotification('Account not found', 'error');
                return;
            }
        } catch (error) {
            showNotification('Failed to load account', 'error');
            return;
        }
    }
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal-overlay" id="account-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${isEdit ? 'Edit Account' : 'Add Account'}</h2>
                    <button class="modal-close" onclick="BudgetApp.modules.Dashboard.closeAccountModal()">&times;</button>
                </div>
                <form id="account-form" class="modal-form">
                    <div class="form-group">
                        <label for="account-name">Account Name <span class="required">*</span></label>
                        <input 
                            type="text" 
                            id="account-name" 
                            name="name" 
                            placeholder="e.g., Chase Checking, Wells Fargo Savings"
                            value="${account?.name || ''}"
                            required
                        />
                        <small>Give this account a memorable name</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="account-type">Account Type <span class="required">*</span></label>
                        <select id="account-type" name="type" required>
                            <option value="">-- Select Type --</option>
                            <option value="checking" ${account?.type === 'checking' ? 'selected' : ''}>💳 Checking</option>
                            <option value="savings" ${account?.type === 'savings' ? 'selected' : ''}>🏦 Savings</option>
                            <option value="credit" ${account?.type === 'credit' ? 'selected' : ''}>💳 Credit Card</option>
                            <option value="investment" ${account?.type === 'investment' ? 'selected' : ''}>📈 Investment</option>
                        </select>
                        <small>Select the type of account</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="account-balance">Current Balance <span class="required">*</span></label>
                        <div class="input-with-prefix">
                            <span class="input-prefix">$</span>
                            <input 
                                type="number" 
                                id="account-balance" 
                                name="balance" 
                                step="0.01"
                                placeholder="0.00"
                                value="${account?.balance || ''}"
                                required
                            />
                        </div>
                        <small id="balance-help">Enter the current balance of this account</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="account-institution">Bank/Institution (Optional)</label>
                        <input 
                            type="text" 
                            id="account-institution" 
                            name="institution" 
                            placeholder="e.g., Chase, Wells Fargo, Capital One"
                            value="${account?.institution || ''}"
                        />
                        <small>The name of the bank or financial institution</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="account-notes">Notes (Optional)</label>
                        <textarea 
                            id="account-notes" 
                            name="notes" 
                            rows="3"
                            placeholder="Add any additional notes about this account..."
                        >${account?.notes || ''}</textarea>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="BudgetApp.modules.Dashboard.closeAccountModal()">Cancel</button>
                        <button type="submit" class="btn-primary" id="save-account-btn">
                            ${isEdit ? 'Update Account' : 'Add Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Add modal to page
    const existingModal = document.getElementById('account-modal');
    if (existingModal) {
        existingModal.remove();
    }
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup form submission
    const form = document.getElementById('account-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveAccount(accountId);
    });
    
    // Update help text based on account type
    const typeSelect = document.getElementById('account-type');
    typeSelect.addEventListener('change', (e) => {
        const helpText = document.getElementById('balance-help');
        if (e.target.value === 'credit') {
            helpText.textContent = 'For credit cards, enter the amount you owe as a positive number (e.g., $1,200.00)';
        } else {
            helpText.textContent = 'Enter the current balance of this account';
        }
    });
    
    // Trigger the change event to set initial help text
    typeSelect.dispatchEvent(new Event('change'));
    
    // Focus on first input
    document.getElementById('account-name').focus();
}

/**
 * Close account modal
 */
export function closeAccountModal() {
    const modal = document.getElementById('account-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Save account (create or update)
 */
async function saveAccount(accountId = null) {
    const form = document.getElementById('account-form');
    const saveBtn = document.getElementById('save-account-btn');
    const isEdit = accountId !== null;
    
    // Get form data
    const formData = new FormData(form);
    const accountData = {
        name: formData.get('name').trim(),
        type: formData.get('type'),
        balance: parseFloat(formData.get('balance')),
        institution: formData.get('institution')?.trim() || '',
        notes: formData.get('notes')?.trim() || ''
    };
    
    // Validation
    if (!accountData.name) {
        showNotification('Please enter an account name', 'error');
        return;
    }
    
    if (!accountData.type) {
        showNotification('Please select an account type', 'error');
        return;
    }
    
    if (isNaN(accountData.balance)) {
        showNotification('Please enter a valid balance', 'error');
        return;
    }
    
    // Disable button and show loading
    saveBtn.disabled = true;
    saveBtn.textContent = isEdit ? 'Updating...' : 'Adding...';
    
    try {
        if (isEdit) {
            await API.updateAccount(accountId, accountData);
            showNotification('Account updated successfully!', 'success');
        } else {
            await API.createAccount(accountData);
            showNotification('Account added successfully!', 'success');
        }
        
        // Close modal
        closeAccountModal();
        
        // Refresh dashboard
        await refreshDashboard();
        
    } catch (error) {
        console.error('Error saving account:', error);
        showNotification('Failed to save account. Please try again.', 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? 'Update Account' : 'Add Account';
    }
}

/**
 * Edit account
 */
export function editAccount(accountId) {
    showAccountModal(accountId);
}

/**
 * Delete account
 */
export async function deleteAccount(accountId) {
    const confirmed = confirm('Are you sure you want to delete this account? This action cannot be undone.');
    
    if (!confirmed) return;
    
    try {
        await API.deleteAccount(accountId);
        showNotification('Account deleted successfully', 'success');
        
        // Refresh dashboard
        await refreshDashboard();
        
    } catch (error) {
        console.error('Error deleting account:', error);
        showNotification('Failed to delete account. Please try again.', 'error');
    }
}

/**
 * Show Available Spending Breakdown Modal
 */
export async function showAvailableSpendingBreakdown() {
    try {
        // Fetch the latest data
        const data = await API.getAvailableSpending();
        
        if (!data.has_data) {
            showNotification('No financial data available yet', 'info');
            return;
        }
        
        // Create modal HTML
        const modalHTML = `
            <div class="modal-overlay" id="available-spending-modal">
                <div class="modal-content large-modal">
                    <div class="modal-header">
                        <h2>💵 Available Spending Breakdown</h2>
                        <button class="btn-close" onclick="document.getElementById('available-spending-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <!-- Summary Section -->
                        <div class="breakdown-summary ${data.status}">
                            <div class="summary-main">
                                <div class="summary-amount">
                                    <h3>Available for Spending</h3>
                                    <p class="amount-large ${data.available < 0 ? 'negative' : 'positive'}">${formatCurrency(data.available)}</p>
                                    <p class="amount-subtitle">${data.message}</p>
                                </div>
                                <div class="summary-breakdown-mini">
                                    <div class="mini-stat">
                                        <span class="mini-label">Per Paycheck</span>
                                        <span class="mini-value">${formatCurrency(data.available_per_paycheck)}</span>
                                        <span class="mini-note">(${data.pay_frequency})</span>
                                    </div>
                                    <div class="mini-stat">
                                        <span class="mini-label">Per Day</span>
                                        <span class="mini-value">${formatCurrency(data.available_per_day)}</span>
                                        <span class="mini-note">(average)</span>
                                    </div>
                                    <div class="mini-stat">
                                        <span class="mini-label">Of Income</span>
                                        <span class="mini-value">${data.percent_available}%</span>
                                        <span class="mini-note">discretionary</span>
                                    </div>
                                </div>
                            </div>
                            ${data.recommendation ? `
                                <div class="recommendation-box ${data.status}">
                                    <span class="rec-icon">💡</span>
                                    <p>${data.recommendation}</p>
                                </div>
                            ` : ''}
                        </div>
                        
                        <!-- Calculation Breakdown -->
                        <div class="calculation-flow">
                            <h3>How It's Calculated</h3>
                            
                            <div class="calc-step positive">
                                <div class="calc-label">
                                    <span class="calc-icon">💰</span>
                                    <span class="calc-title">Total Monthly Income</span>
                                </div>
                                <div class="calc-amount positive">${formatCurrency(data.total_income)}</div>
                            </div>
                            
                            ${data.breakdown.income.length > 0 ? `
                                <div class="calc-details">
                                    ${data.breakdown.income.map(income => `
                                        <div class="detail-row">
                                            <span class="detail-name">${income.name} (${income.earner})</span>
                                            <span class="detail-amount">${formatCurrency(income.monthly_amount)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            <div class="calc-minus">−</div>
                            
                            <div class="calc-step negative">
                                <div class="calc-label">
                                    <span class="calc-icon">💸</span>
                                    <span class="calc-title">Fixed Expenses (Bills)</span>
                                </div>
                                <div class="calc-amount negative">${formatCurrency(data.total_expenses)}</div>
                            </div>
                            
                            ${data.breakdown.expenses.length > 0 ? `
                                <div class="calc-details">
                                    ${data.breakdown.expenses.slice(0, 5).map(expense => `
                                        <div class="detail-row">
                                            <span class="detail-name">${expense.name} (${expense.category})</span>
                                            <span class="detail-amount">${formatCurrency(expense.amount)}</span>
                                        </div>
                                    `).join('')}
                                    ${data.breakdown.expenses.length > 5 ? `
                                        <div class="detail-row more">
                                            <span class="detail-name">... and ${data.breakdown.expenses.length - 5} more</span>
                                            <span class="detail-amount"></span>
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}
                            
                            ${data.total_retirement > 0 ? `
                                <div class="calc-minus">−</div>
                                
                                <div class="calc-step negative">
                                    <div class="calc-label">
                                        <span class="calc-icon">🏦</span>
                                        <span class="calc-title">Retirement Contributions</span>
                                    </div>
                                    <div class="calc-amount negative">${formatCurrency(data.total_retirement)}</div>
                                </div>
                            ` : ''}
                            
                            ${data.total_savings_allocations > 0 ? `
                                <div class="calc-minus">−</div>
                                
                                <div class="calc-step negative">
                                    <div class="calc-label">
                                        <span class="calc-icon">🎯</span>
                                        <span class="calc-title">Savings Goals</span>
                                    </div>
                                    <div class="calc-amount negative">${formatCurrency(data.total_savings_allocations)}</div>
                                </div>
                            ` : ''}
                            
                            <div class="calc-equals">=</div>
                            
                            <div class="calc-step result ${data.available < 0 ? 'negative' : 'positive'}">
                                <div class="calc-label">
                                    <span class="calc-icon">💵</span>
                                    <span class="calc-title">Available for Discretionary Spending</span>
                                </div>
                                <div class="calc-amount ${data.available < 0 ? 'negative' : 'positive'}">${formatCurrency(data.available)}</div>
                            </div>
                        </div>
                        
                        <!-- Tips Section -->
                        <div class="tips-section">
                            <h3>💡 What This Means</h3>
                            <ul class="tips-list">
                                <li>This is your "safe to spend" money for groceries, dining out, entertainment, shopping, and other variable expenses.</li>
                                <li>Budget your spending accounts within this amount to avoid overdrafts.</li>
                                <li>Try to leave some buffer for unexpected expenses or emergencies.</li>
                                ${data.available_per_day ? `<li>On average, you can spend about <strong>${formatCurrency(data.available_per_day)}</strong> per day on discretionary items.</li>` : ''}
                                ${data.available < 500 && data.available > 0 ? `<li class="warning-tip">⚠️ Your available spending is quite low. Consider reviewing expenses or finding ways to increase income.</li>` : ''}
                                ${data.available < 0 ? `<li class="danger-tip">🚨 You're spending more than you earn! This is unsustainable and needs immediate attention.</li>` : ''}
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="document.getElementById('available-spending-modal').remove()">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Close on overlay click
        const modal = document.getElementById('available-spending-modal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
    } catch (error) {
        console.error('Error showing available spending breakdown:', error);
        showNotification('Failed to load spending breakdown', 'error');
    }
}

/**
 * Show Month-to-Date Spending Breakdown Modal
 */
export async function showMTDSpendingBreakdown() {
    try {
        // Fetch the latest data
        const data = await API.getMonthToDateSpending();
        
        if (!data.has_data) {
            showNotification('No spending data available yet', 'info');
            return;
        }
        
        // Create modal HTML
        const modalHTML = `
            <div class="modal-overlay" id="mtd-spending-modal">
                <div class="modal-content large-modal">
                    <div class="modal-header">
                        <h2>📊 ${data.month_name} ${data.year} Spending Summary</h2>
                        <button class="btn-close" onclick="document.getElementById('mtd-spending-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <!-- Summary Section -->
                        <div class="mtd-summary ${data.status}">
                            <div class="summary-main">
                                <div class="summary-amount">
                                    <h3>Total Spent This Month</h3>
                                    <p class="amount-large">${formatCurrency(data.total)}</p>
                                    <p class="amount-subtitle">${data.status_message}</p>
                                </div>
                                <div class="summary-breakdown-mini">
                                    <div class="mini-stat">
                                        <span class="mini-label">Daily Average</span>
                                        <span class="mini-value">${formatCurrency(data.daily_average)}</span>
                                        <span class="mini-note">over ${data.days_elapsed} days</span>
                                    </div>
                                    <div class="mini-stat">
                                        <span class="mini-label">Budget Used</span>
                                        <span class="mini-value">${data.percent_spent}%</span>
                                        <span class="mini-note">of ${formatCurrency(data.available)}</span>
                                    </div>
                                    <div class="mini-stat">
                                        <span class="mini-label">Remaining</span>
                                        <span class="mini-value ${data.remaining < 0 ? 'negative' : 'positive'}">${formatCurrency(data.remaining)}</span>
                                        <span class="mini-note">${data.days_remaining} days left</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Progress Bar -->
                        <div class="progress-section">
                            <div class="progress-header">
                                <h3>Budget Progress</h3>
                                <span class="progress-stats">Day ${data.days_elapsed} of ${data.days_in_month} (${data.percent_of_month}% elapsed)</span>
                            </div>
                            <div class="progress-bar-container">
                                <div class="progress-bar ${data.status}" style="width: ${Math.min(data.percent_spent, 100)}%">
                                    <span class="progress-label">${data.percent_spent}%</span>
                                </div>
                                <div class="progress-marker" style="left: ${data.percent_of_month}%">
                                    <span class="marker-label">Today</span>
                                </div>
                            </div>
                            <div class="progress-legend">
                                <span class="legend-item">
                                    <span class="legend-dot spending"></span>
                                    Spending: ${data.percent_spent}%
                                </span>
                                <span class="legend-item">
                                    <span class="legend-dot time"></span>
                                    Time Elapsed: ${data.percent_of_month}%
                                </span>
                            </div>
                        </div>
                        
                        <!-- Category Breakdown -->
                        ${data.category_breakdown && data.category_breakdown.length > 0 ? `
                            <div class="category-section">
                                <h3>Spending by Category</h3>
                                <div class="category-list">
                                    ${data.category_breakdown.map(cat => `
                                        <div class="category-item">
                                            <div class="category-info">
                                                <span class="category-name">${cat.category}</span>
                                                <span class="category-count">${cat.transaction_count} transaction${cat.transaction_count !== 1 ? 's' : ''}</span>
                                            </div>
                                            <div class="category-amount-section">
                                                <span class="category-amount">${formatCurrency(cat.amount)}</span>
                                                <span class="category-percent">${cat.percent}%</span>
                                            </div>
                                            <div class="category-bar">
                                                <div class="category-bar-fill" style="width: ${cat.percent}%"></div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : `
                            <div class="empty-state">
                                <p>No category data available</p>
                            </div>
                        `}
                        
                        <!-- Projection Section -->
                        <div class="projection-section">
                            <h3>Month-End Projection</h3>
                            <div class="projection-cards">
                                <div class="projection-card">
                                    <span class="projection-label">Projected Total Spending</span>
                                    <span class="projection-value">${formatCurrency(data.projected_total)}</span>
                                    <span class="projection-note">Based on current daily average</span>
                                </div>
                                <div class="projection-card ${data.projected_remaining < 0 ? 'negative' : 'positive'}">
                                    <span class="projection-label">Projected Remaining</span>
                                    <span class="projection-value ${data.projected_remaining < 0 ? 'negative' : 'positive'}">${formatCurrency(data.projected_remaining)}</span>
                                    <span class="projection-note">${data.projected_remaining < 0 ? 'Over budget!' : 'Under budget'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Recent Transactions -->
                        ${data.recent_transactions && data.recent_transactions.length > 0 ? `
                            <div class="transactions-section">
                                <h3>Recent Transactions (Last 10)</h3>
                                <div class="transactions-list">
                                    ${data.recent_transactions.map(trans => {
                                        const transDate = new Date(trans.date);
                                        const dateStr = transDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        return `
                                            <div class="transaction-item">
                                                <div class="transaction-date">${dateStr}</div>
                                                <div class="transaction-details">
                                                    <span class="transaction-desc">${trans.description}</span>
                                                    ${trans.merchant ? `<span class="transaction-merchant">${trans.merchant}</span>` : ''}
                                                </div>
                                                <div class="transaction-category">${trans.category}</div>
                                                <div class="transaction-amount">${formatCurrency(trans.amount)}</div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                                ${data.transaction_count > 10 ? `
                                    <p class="transactions-more">... and ${data.transaction_count - 10} more transactions this month</p>
                                ` : ''}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <span class="empty-icon">📝</span>
                                <h4>No Transactions Yet</h4>
                                <p>No spending transactions recorded for this month</p>
                            </div>
                        `}
                        
                        <!-- Tips Section -->
                        <div class="tips-section">
                            <h3>💡 Spending Insights</h3>
                            <ul class="tips-list">
                                ${data.percent_spent < data.percent_of_month - 10 ? `
                                    <li class="success-tip">✓ Excellent! You're spending well below the expected pace for this point in the month.</li>
                                ` : ''}
                                ${data.percent_spent > data.percent_of_month + 15 ? `
                                    <li class="danger-tip">🚨 Warning: You're spending significantly faster than the month is progressing. Consider reducing spending.</li>
                                ` : ''}
                                ${data.remaining < 100 && data.remaining > 0 ? `
                                    <li class="warning-tip">⚠️ You have less than $100 remaining for the month. Be very careful with additional spending.</li>
                                ` : ''}
                                ${data.remaining < 0 ? `
                                    <li class="danger-tip">🚨 You've exceeded your budget! Avoid additional spending if possible.</li>
                                ` : ''}
                                ${data.days_remaining > 0 && data.remaining > 0 ? `
                                    <li>You have about <strong>${formatCurrency(data.remaining / data.days_remaining)}</strong> available per day for the rest of the month.</li>
                                ` : ''}
                                ${data.transaction_count > 0 ? `
                                    <li>You've made ${data.transaction_count} transaction${data.transaction_count !== 1 ? 's' : ''} this month with a daily average of ${formatCurrency(data.daily_average)}.</li>
                                ` : ''}
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="document.getElementById('mtd-spending-modal').remove()">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Close on overlay click
        const modal = document.getElementById('mtd-spending-modal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
    } catch (error) {
        console.error('Error showing MTD spending breakdown:', error);
        showNotification('Failed to load spending breakdown', 'error');
    }
}

// Expose functions to global scope for onclick handlers
window.dashboardModule = window.dashboardModule || {};
window.dashboardModule.showAvailableSpendingBreakdown = showAvailableSpendingBreakdown;
window.dashboardModule.showMTDSpendingBreakdown = showMTDSpendingBreakdown;
