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
        // Load all data including overdraft warning and month comparison
        const [accounts, summary, availableSpending, mtdSpending, nextPaycheck, healthScore, totalIncome, totalExpenses, moneyPerDay, overdraft, monthComparison] = await Promise.all([
            API.getAccounts(),
            API.getAccountSummary(),
            API.getAvailableSpending(),
            API.getMonthToDateSpending(),
            API.getNextPaycheckCountdown(),
            API.getBudgetHealthScore(),
            API.getTotalIncome(),
            API.getTotalExpenses(),
            API.getMoneyLeftPerDay(),
            API.getOverdraftWarning(),
            API.getMonthComparison()
        ]);
        
        // Render the overview cards
        renderOverviewCards({ accounts, summary, availableSpending, mtdSpending, nextPaycheck, healthScore, totalIncome, totalExpenses, moneyPerDay, overdraft, monthComparison });
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
    
    const { accounts, summary, availableSpending, mtdSpending, nextPaycheck, healthScore, totalIncome, totalExpenses, moneyPerDay, overdraft, monthComparison } = data;
    
    // Check if we have ANY data at all
    const hasAnyData = (
        summary?.has_data || 
        availableSpending?.has_data || 
        mtdSpending?.has_data || 
        healthScore?.has_data ||
        moneyPerDay?.money_per_day !== undefined ||
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
    let html = ``;
    
    // ==========================================
    // OVERDRAFT WARNING CARD (if warning or critical)
    // ==========================================
    if (overdraft && (overdraft.risk_level === 'warning' || overdraft.risk_level === 'critical')) {
        const riskLevel = overdraft.risk_level;
        const alertIcon = overdraft.alert_icon || '⚠️';
        const warnings = overdraft.warnings || [];
        const primaryWarning = warnings[0] || 'Review your finances';
        
        html += `
            <!-- Overdraft Warning Banner -->
            <div class="summary-card overdraft-warning-card ${riskLevel === 'critical' ? 'card-critical' : 'card-warning'} clickable full-width" 
                 onclick="window.dashboardModule.navigateToAlertsTab()" 
                 style="cursor: pointer;" 
                 title="Click to view full overdraft analysis">
                <div class="overdraft-warning-content">
                    <div class="warning-icon-large">${alertIcon}</div>
                    <div class="warning-info">
                        <h3 class="warning-title">${riskLevel === 'critical' ? '🚨 Critical: Overdraft Risk Detected' : '⚠️ Warning: Overdraft Risk'}</h3>
                        <p class="warning-message">${primaryWarning}</p>
                        <p class="warning-action">Click to view detailed analysis and recommendations →</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    html += `
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
        
        <!-- Money Left Per Day Calculator -->
        <div class="summary-card clickable ${moneyPerDay?.status === 'danger' ? 'card-danger' : moneyPerDay?.status === 'warning' ? 'card-warning' : 'card-success'}" 
             onclick="window.dashboardModule.showMoneyPerDayBreakdown()" 
             style="cursor: pointer;" 
             title="Click for detailed breakdown">
            <div class="card-icon">${moneyPerDay?.status === 'danger' ? '🚨' : moneyPerDay?.status === 'warning' ? '⚠️' : '💰'}</div>
            <h3>Money Left Per Day</h3>
            <p class="card-value ${(moneyPerDay?.remaining_money || 0) < 0 ? 'negative' : ''}">${formatCurrency(moneyPerDay?.money_per_day || 0)}/day</p>
            <p class="card-detail">${moneyPerDay?.status_text || 'Daily budget'}</p>
            ${moneyPerDay?.days_until_paycheck ? `<p class="card-extra-detail">${moneyPerDay.days_until_paycheck} day${moneyPerDay.days_until_paycheck !== 1 ? 's' : ''} until paycheck</p>` : ''}
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
        <div class="summary-card clickable ${nextPaycheck.has_paychecks ? getPaycheckStatusClass(nextPaycheck.days_until_next) : 'card-info'}" 
             onclick="window.dashboardModule.navigateToPaycheckCountdown()" 
             style="cursor: pointer;" 
             title="Click to view full paycheck countdown">
            <div class="card-icon">${nextPaycheck.has_paychecks ? getPaycheckIcon(nextPaycheck.days_until_next) : '📅'}</div>
            <h3>Next Paycheck</h3>
            <p class="card-value">${nextPaycheck.has_paychecks ? `${nextPaycheck.days_until_next} day${nextPaycheck.days_until_next !== 1 ? 's' : ''}` : 'Not Set'}</p>
            <p class="card-detail">${nextPaycheck.has_paychecks ? (nextPaycheck.next_paycheck ? `${nextPaycheck.next_paycheck.earner_name} - ${formatCurrency(nextPaycheck.next_paycheck.amount)}` : nextPaycheck.formatted_date || nextPaycheck.date) : 'Add income sources'}</p>
            ${nextPaycheck.has_paychecks && nextPaycheck.days_until_next === 0 ? '<p class="card-extra-detail" style="color: #22c55e; font-weight: bold;">🎉 Payday!</p>' : ''}
        </div>
        
        <!-- Budget Health Score -->
        <div class="summary-card ${healthScore.score >= 80 ? 'card-success' : healthScore.score >= 60 ? 'card-warning' : 'card-danger'}"
             onclick="window.dashboardModule.showHealthScoreModal()" 
             style="cursor: pointer;" 
             title="Click to view detailed breakdown">
            <div class="card-icon">${healthScore.icon || '💪'}</div>
            <h3>Budget Health</h3>
            <p class="card-value">${healthScore.score !== undefined ? `${healthScore.score}/100` : 'N/A'}</p>
            <p class="card-detail">${healthScore.grade_text || healthScore.grade || ''} ${healthScore.grade ? `(${healthScore.grade})` : ''}</p>
            ${healthScore.score !== undefined ? `<p class="card-extra-detail" style="font-size: 0.8em; opacity: 0.8; margin-top: 0.25rem;">Click for detailed breakdown</p>` : ''}
        </div>
    `;
    
    // Add Month Comparison Section if we have data
    if (monthComparison && monthComparison.has_data) {
        html += renderMonthComparisonSection(monthComparison);
    }
    
    container.innerHTML = html;
}

/**
 * Helper function to get paycheck status class based on days until paycheck
 */
function getPaycheckStatusClass(daysUntil) {
    if (daysUntil === undefined || daysUntil === null) return 'card-info';
    if (daysUntil === 0) return 'card-success';
    if (daysUntil <= 3) return 'card-success';
    if (daysUntil <= 7) return 'card-info';
    if (daysUntil <= 14) return 'card-warning';
    return 'card-warning';
}

/**
 * Helper function to get paycheck icon based on days until paycheck
 */
function getPaycheckIcon(daysUntil) {
    if (daysUntil === undefined || daysUntil === null) return '📅';
    if (daysUntil === 0) return '🎉';
    if (daysUntil <= 3) return '🎯';
    if (daysUntil <= 7) return '⏰';
    return '📆';
}

/**
 * Navigate to the full paycheck countdown in Spending Pace tab
 */
function navigateToPaycheckCountdown() {
    // Switch to dashboard velocity sub-tab
    const velocityBtn = document.querySelector('[data-subtab="dashboard-velocity"]');
    if (velocityBtn) {
        velocityBtn.click();
        
        // Scroll to the paycheck countdown after a brief delay
        setTimeout(() => {
            const paycheckCard = document.querySelector('.paycheck-countdown-card');
            if (paycheckCard) {
                paycheckCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Add a brief highlight effect
                paycheckCard.style.animation = 'highlight-pulse 2s ease-in-out';
                setTimeout(() => {
                    paycheckCard.style.animation = '';
                }, 2000);
            }
        }, 300);
    }
}

/**
 * Navigate to the Alerts & Warnings tab
 */
function navigateToAlertsTab() {
    // Switch to dashboard alerts sub-tab
    const alertsBtn = document.querySelector('[data-subtab="dashboard-alerts"]');
    if (alertsBtn) {
        alertsBtn.click();
        
        // Scroll to top after switching tabs
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);
    }
}

/**
 * Render month comparison section
 * Shows comparison between current and previous month for key metrics
 */
function renderMonthComparisonSection(comparison) {
    // Helper to get trend arrow and color
    const getTrendIndicator = (direction, isExpense = false) => {
        // For expenses/spending, down is good, up is bad
        // For income/savings, up is good, down is bad
        if (direction === 'same') return { arrow: '➡️', class: 'trend-neutral' };
        
        if (isExpense) {
            return direction === 'up' 
                ? { arrow: '↗️', class: 'trend-bad' }
                : { arrow: '↘️', class: 'trend-good' };
        } else {
            return direction === 'up'
                ? { arrow: '↗️', class: 'trend-good' }
                : { arrow: '↘️', class: 'trend-bad' };
        }
    };
    
    // Format percentage with sign
    const formatPercent = (percent) => {
        const sign = percent > 0 ? '+' : '';
        return `${sign}${percent}%`;
    };
    
    let html = `
        <!-- Month Comparison Section Header -->
        <div class="section-divider full-width">
            <h3>📊 Month Comparison</h3>
            <p class="section-subtitle">Comparing ${comparison.current_month.month_name} vs ${comparison.previous_month.month_name}</p>
        </div>
    `;
    
    // Income Comparison
    const incomeTrend = getTrendIndicator(comparison.income.direction, false);
    html += `
        <div class="summary-card comparison-card">
            <div class="card-icon">💰</div>
            <h3>Income</h3>
            <div class="comparison-values">
                <div class="current-value">
                    <span class="label">Current:</span>
                    <span class="value">${formatCurrency(comparison.income.current)}</span>
                </div>
                <div class="previous-value">
                    <span class="label">Previous:</span>
                    <span class="value">${formatCurrency(comparison.income.previous)}</span>
                </div>
            </div>
            <div class="comparison-change ${incomeTrend.class}">
                <span class="trend-arrow">${incomeTrend.arrow}</span>
                <span class="change-amount">${formatCurrency(Math.abs(comparison.income.change))}</span>
                <span class="change-percent">(${formatPercent(comparison.income.percent_change)})</span>
            </div>
        </div>
    `;
    
    // Fixed Expenses Comparison
    const expensesTrend = getTrendIndicator(comparison.expenses.direction, true);
    html += `
        <div class="summary-card comparison-card">
            <div class="card-icon">💸</div>
            <h3>Fixed Expenses</h3>
            <div class="comparison-values">
                <div class="current-value">
                    <span class="label">Current:</span>
                    <span class="value">${formatCurrency(comparison.expenses.current)}</span>
                </div>
                <div class="previous-value">
                    <span class="label">Previous:</span>
                    <span class="value">${formatCurrency(comparison.expenses.previous)}</span>
                </div>
            </div>
            <div class="comparison-change ${expensesTrend.class}">
                <span class="trend-arrow">${expensesTrend.arrow}</span>
                <span class="change-amount">${formatCurrency(Math.abs(comparison.expenses.change))}</span>
                <span class="change-percent">(${formatPercent(comparison.expenses.percent_change)})</span>
            </div>
        </div>
    `;
    
    // Spending Comparison
    const spendingTrend = getTrendIndicator(comparison.spending.direction, true);
    html += `
        <div class="summary-card comparison-card">
            <div class="card-icon">🛒</div>
            <h3>Variable Spending</h3>
            <div class="comparison-values">
                <div class="current-value">
                    <span class="label">Current:</span>
                    <span class="value">${formatCurrency(comparison.spending.current)}</span>
                </div>
                <div class="previous-value">
                    <span class="label">Previous:</span>
                    <span class="value">${formatCurrency(comparison.spending.previous)}</span>
                </div>
            </div>
            <div class="comparison-change ${spendingTrend.class}">
                <span class="trend-arrow">${spendingTrend.arrow}</span>
                <span class="change-amount">${formatCurrency(Math.abs(comparison.spending.change))}</span>
                <span class="change-percent">(${formatPercent(comparison.spending.percent_change)})</span>
            </div>
        </div>
    `;
    
    // Savings Comparison
    const savingsTrend = getTrendIndicator(comparison.savings.direction, false);
    html += `
        <div class="summary-card comparison-card">
            <div class="card-icon">🏦</div>
            <h3>Net Savings</h3>
            <div class="comparison-values">
                <div class="current-value">
                    <span class="label">Current:</span>
                    <span class="value ${comparison.savings.current < 0 ? 'negative' : ''}">${formatCurrency(comparison.savings.current)}</span>
                </div>
                <div class="previous-value">
                    <span class="label">Previous:</span>
                    <span class="value ${comparison.savings.previous < 0 ? 'negative' : ''}">${formatCurrency(comparison.savings.previous)}</span>
                </div>
            </div>
            <div class="comparison-change ${savingsTrend.class}">
                <span class="trend-arrow">${savingsTrend.arrow}</span>
                <span class="change-amount">${formatCurrency(Math.abs(comparison.savings.change))}</span>
                <span class="change-percent">(${formatPercent(comparison.savings.percent_change)})</span>
            </div>
        </div>
    `;
    
    // Transaction Count Comparison
    const transactionTrend = getTrendIndicator(comparison.transaction_count.direction, true);
    html += `
        <div class="summary-card comparison-card">
            <div class="card-icon">📝</div>
            <h3>Transactions</h3>
            <div class="comparison-values">
                <div class="current-value">
                    <span class="label">Current:</span>
                    <span class="value">${Math.round(comparison.transaction_count.current)}</span>
                </div>
                <div class="previous-value">
                    <span class="label">Previous:</span>
                    <span class="value">${Math.round(comparison.transaction_count.previous)}</span>
                </div>
            </div>
            <div class="comparison-change ${transactionTrend.class}">
                <span class="trend-arrow">${transactionTrend.arrow}</span>
                <span class="change-amount">${Math.round(Math.abs(comparison.transaction_count.change))} transactions</span>
                <span class="change-percent">(${formatPercent(comparison.transaction_count.percent_change)})</span>
            </div>
        </div>
    `;
    
    // Add insights section if available
    if (comparison.insights && comparison.insights.length > 0) {
        html += `
            <div class="comparison-insights full-width">
                <h4>💡 Key Insights</h4>
                <div class="insights-list">
        `;
        
        comparison.insights.forEach(insight => {
            const insightClass = insight.type === 'positive' ? 'insight-positive' : 
                               insight.type === 'warning' ? 'insight-warning' : 'insight-info';
            html += `
                <div class="insight-item ${insightClass}">
                    <span class="insight-icon">${insight.icon}</span>
                    <span class="insight-message">${insight.message}</span>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    return html;
}

// Expose functions to window for onclick handlers
window.dashboardModule = window.dashboardModule || {};
window.dashboardModule.navigateToPaycheckCountdown = navigateToPaycheckCountdown;
window.dashboardModule.navigateToAlertsTab = navigateToAlertsTab;

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
 * Display alerts with comprehensive overdraft warning system
 */
function displayAlerts(overdraft, upcomingBills, healthScore) {
    const container = document.getElementById('alerts-container');
    if (!container) return;
    
    // Check if we have any data
    const hasData = overdraft || (upcomingBills?.bills && upcomingBills.bills.length > 0) || healthScore;
    
    if (!hasData) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">ℹ️</div>
                <h3>No Alerts Yet</h3>
                <p>Add accounts, income, and expenses to start monitoring your financial health.</p>
                <div class="empty-actions">
                    <button class="btn-primary" onclick="BudgetApp.switchTab('income')">Add Income</button>
                    <button class="btn-secondary" onclick="window.dashboardModule.showAccountModal()">Add Account</button>
                </div>
            </div>
        `;
        return;
    }
    
    let html = '<div class="alerts-grid">';
    
    // ==========================================
    // OVERDRAFT WARNING SYSTEM (COLOR-CODED)
    // ==========================================
    if (overdraft) {
        const riskLevel = overdraft.risk_level || 'safe';
        const alertColor = overdraft.alert_color || '#10b981';
        const alertIcon = overdraft.alert_icon || '✅';
        const warnings = overdraft.warnings || [];
        const recommendations = overdraft.recommendations || [];
        const metrics = overdraft.metrics || {};
        
        // Determine alert class based on risk level
        let alertClass = 'alert-safe';
        if (riskLevel === 'critical') {
            alertClass = 'alert-critical';
        } else if (riskLevel === 'warning') {
            alertClass = 'alert-warning';
        }
        
        // Build the overdraft warning card with detailed information
        html += `
            <div class="overdraft-alert-card ${alertClass}" style="--alert-color: ${alertColor}">
                <div class="overdraft-header">
                    <span class="overdraft-icon">${alertIcon}</span>
                    <div class="overdraft-title">
                        <h3>Overdraft Risk: ${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}</h3>
                        <p class="overdraft-subtitle">Real-time account monitoring</p>
                    </div>
                </div>
                
                <!-- Risk Indicator Bar -->
                <div class="risk-indicator-bar">
                    <div class="risk-level ${riskLevel}"></div>
                    <div class="risk-labels">
                        <span class="risk-label safe">Safe</span>
                        <span class="risk-label warning">Warning</span>
                        <span class="risk-label critical">Critical</span>
                    </div>
                </div>
                
                <!-- Account Balances Summary -->
                ${metrics.checking_balance !== undefined || metrics.savings_balance !== undefined ? `
                    <div class="overdraft-metrics">
                        <div class="metric-row">
                            <div class="metric-item">
                                <span class="metric-label">💳 Checking</span>
                                <span class="metric-value ${metrics.checking_balance < 0 ? 'negative' : metrics.checking_balance < 200 ? 'warning' : ''}">${formatCurrency(metrics.checking_balance)}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">🏦 Savings</span>
                                <span class="metric-value">${formatCurrency(metrics.savings_balance)}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">💰 Total Liquid</span>
                                <span class="metric-value">${formatCurrency(metrics.total_liquid)}</span>
                            </div>
                        </div>
                        <div class="metric-row">
                            <div class="metric-item">
                                <span class="metric-label">📅 Days Remaining</span>
                                <span class="metric-value">${metrics.days_remaining} days</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">💵 Money Left</span>
                                <span class="metric-value ${metrics.remaining_money < 0 ? 'negative' : metrics.remaining_money < 100 ? 'warning' : ''}">${formatCurrency(metrics.remaining_money)}</span>
                            </div>
                            ${metrics.upcoming_bills > 0 ? `
                                <div class="metric-item">
                                    <span class="metric-label">📋 Bills (7 days)</span>
                                    <span class="metric-value">${formatCurrency(metrics.upcoming_bills)}</span>
                                </div>
                            ` : `
                                <div class="metric-item">
                                    <span class="metric-label">📈 Projected End</span>
                                    <span class="metric-value ${metrics.projected_remaining < 0 ? 'negative' : ''}">${formatCurrency(metrics.projected_remaining)}</span>
                                </div>
                            `}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Warnings -->
                ${warnings.length > 0 ? `
                    <div class="overdraft-warnings">
                        <h4 class="section-heading">
                            ${riskLevel === 'critical' ? '🚨' : riskLevel === 'warning' ? '⚠️' : 'ℹ️'} 
                            ${riskLevel === 'critical' ? 'Critical Warnings' : riskLevel === 'warning' ? 'Warnings' : 'Status'}
                        </h4>
                        <ul class="warning-list">
                            ${warnings.map(warning => `<li>${warning}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                <!-- Recommendations -->
                ${recommendations.length > 0 ? `
                    <div class="overdraft-recommendations">
                        <h4 class="section-heading">💡 Recommendations</h4>
                        <ul class="recommendation-list">
                            ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                <!-- Help Section -->
                <details class="overdraft-help">
                    <summary>ℹ️ How Overdraft Protection Works</summary>
                    <div class="help-content">
                        <p><strong>Color-Coded Risk Levels:</strong></p>
                        <ul>
                            <li><strong style="color: #10b981;">🟢 Safe (Green):</strong> Healthy financial position with sufficient funds</li>
                            <li><strong style="color: #f59e0b;">🟡 Warning (Yellow):</strong> Approaching overdraft risk, take precautions</li>
                            <li><strong style="color: #ef4444;">🔴 Critical (Red):</strong> Immediate overdraft danger, action required</li>
                        </ul>
                        <p><strong>We monitor:</strong></p>
                        <ul>
                            <li>Current checking and savings balances</li>
                            <li>Bills due in the next 7 days</li>
                            <li>Your spending rate vs. remaining budget</li>
                            <li>Projected end-of-month balance</li>
                        </ul>
                        <p class="help-tip">💡 <strong>Tip:</strong> Keep at least $200 in checking as a buffer to avoid overdraft fees!</p>
                    </div>
                </details>
            </div>
        `;
    }
    
    // ==========================================
    // BUDGET HEALTH SCORE
    // ==========================================
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
    
    // ==========================================
    // UPCOMING BILLS (NEXT 7 DAYS)
    // ==========================================
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
        const [velocity, paycheckCountdown] = await Promise.all([
            API.getSpendingVelocity(),
            API.getNextPaycheckCountdown()
        ]);
        displaySpendingVelocity(velocity, paycheckCountdown);
    } catch (error) {
        console.error('Error loading spending velocity:', error);
        showError('velocity-container', 'Failed to load spending pace');
    }
}

/**
 * Display spending velocity indicator
 */
function displaySpendingVelocity(velocity, paycheckCountdown) {
    const container = document.getElementById('velocity-container');
    if (!container) return;
    
    // Get status icon based on velocity status
    let statusIcon = '';
    switch (velocity.status) {
        case 'success':
            statusIcon = '✅';
            break;
        case 'warning':
            statusIcon = '⚠️';
            break;
        case 'danger':
            statusIcon = '🚨';
            break;
        default:
            statusIcon = 'ℹ️';
    }
    
    // Calculate percentage of days passed
    const totalDays = velocity.days_passed + velocity.days_remaining;
    const daysPassedPercent = (velocity.days_passed / totalDays) * 100;
    
    // Calculate percentage of budget spent
    const totalBudget = velocity.mtd_spent + velocity.remaining_money;
    const spentPercent = totalBudget > 0 ? (velocity.mtd_spent / totalBudget) * 100 : 0;
    
    // Calculate safe rate percentage (for visualization)
    const maxRate = Math.max(velocity.actual_daily_rate, velocity.safe_daily_rate, 1);
    const actualRatePercent = (velocity.actual_daily_rate / maxRate) * 100;
    const safeRatePercent = (velocity.safe_daily_rate / maxRate) * 100;
    
    let html = `
        <div class="velocity-header">
            <div class="velocity-title-section">
                <h3>💨 Spending Velocity Tracker</h3>
                <p class="velocity-subtitle">How fast are you spending your money this month?</p>
            </div>
        </div>
        
        <!-- Main Status Card -->
        <div class="velocity-status status-${velocity.status}">
            <div class="velocity-icon">${statusIcon}</div>
            <div class="velocity-status-text">
                <div class="status-label">${velocity.status_text}</div>
                <div class="status-message">${velocity.message}</div>
            </div>
        </div>
        
        <!-- Next Paycheck Countdown -->
        ${displayPaycheckCountdown(paycheckCountdown)}
        
        <!-- Days Progress Bar -->
        <div class="metric-card">
            <h4>📅 Month Progress</h4>
            <div class="progress-info">
                <span>Day ${velocity.days_passed} of ${totalDays}</span>
                <span>${velocity.days_remaining} days remaining</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar progress-bar-primary" style="width: ${daysPassedPercent}%"></div>
            </div>
            <p class="progress-detail">${Math.round(daysPassedPercent)}% of the month has passed</p>
        </div>
        
        <!-- Budget Progress Bar -->
        <div class="metric-card">
            <h4>💰 Budget Usage</h4>
            <div class="progress-info">
                <span>Spent: ${formatCurrency(velocity.mtd_spent)}</span>
                <span>Remaining: ${formatCurrency(velocity.remaining_money)}</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar progress-bar-${velocity.status}" style="width: ${Math.min(spentPercent, 100)}%"></div>
            </div>
            <p class="progress-detail">${Math.round(spentPercent)}% of available money spent (${velocity.transaction_count} transactions)</p>
        </div>
        
        <!-- Daily Spending Rate Comparison -->
        <div class="velocity-comparison-card">
            <h4>📊 Daily Spending Rate Comparison</h4>
            <div class="rate-comparison">
                <div class="rate-item">
                    <div class="rate-label">Your Actual Rate</div>
                    <div class="rate-value rate-actual">${formatCurrency(velocity.actual_daily_rate)}/day</div>
                    <div class="rate-bar-container">
                        <div class="rate-bar rate-bar-actual" style="width: ${actualRatePercent}%"></div>
                    </div>
                </div>
                <div class="rate-divider">vs</div>
                <div class="rate-item">
                    <div class="rate-label">Safe Target Rate</div>
                    <div class="rate-value rate-safe">${formatCurrency(velocity.safe_daily_rate)}/day</div>
                    <div class="rate-bar-container">
                        <div class="rate-bar rate-bar-safe" style="width: ${safeRatePercent}%"></div>
                    </div>
                </div>
            </div>
            <div class="rate-explanation">
                ${velocity.actual_daily_rate <= velocity.safe_daily_rate 
                    ? '🎯 You\'re spending at or below the safe rate. Keep it up!' 
                    : `⚠️ You\'re spending ${formatCurrency(velocity.actual_daily_rate - velocity.safe_daily_rate)}/day more than the safe rate.`
                }
            </div>
        </div>
        
        <!-- Velocity Details Grid -->
        <div class="velocity-details-grid">
            <div class="velocity-detail-card">
                <div class="detail-icon">💸</div>
                <div class="detail-content">
                    <div class="detail-label">Month-to-Date Spending</div>
                    <div class="detail-value">${formatCurrency(velocity.mtd_spent)}</div>
                    <div class="detail-subtext">${velocity.transaction_count} transactions</div>
                </div>
            </div>
            
            <div class="velocity-detail-card">
                <div class="detail-icon">💵</div>
                <div class="detail-content">
                    <div class="detail-label">Money Remaining</div>
                    <div class="detail-value ${velocity.remaining_money < 0 ? 'text-danger' : 'text-success'}">
                        ${formatCurrency(velocity.remaining_money)}
                    </div>
                    <div class="detail-subtext">
                        ${velocity.remaining_money < 0 ? 'Over budget!' : 'Before upcoming bills'}
                    </div>
                </div>
            </div>
            
            <div class="velocity-detail-card">
                <div class="detail-icon">📋</div>
                <div class="detail-content">
                    <div class="detail-label">Upcoming Bills</div>
                    <div class="detail-value ${velocity.upcoming_bills > 0 ? 'text-warning' : 'text-success'}">
                        ${formatCurrency(velocity.upcoming_bills || 0)}
                    </div>
                    <div class="detail-subtext">
                        ${velocity.upcoming_bill_count > 0 
                            ? `${velocity.upcoming_bill_count} bill${velocity.upcoming_bill_count > 1 ? 's' : ''} due this month` 
                            : 'No bills remaining'}
                    </div>
                </div>
            </div>
            
            <div class="velocity-detail-card">
                <div class="detail-icon">💰</div>
                <div class="detail-content">
                    <div class="detail-label">After Bills Deducted</div>
                    <div class="detail-value ${velocity.remaining_money_after_bills < 0 ? 'text-danger' : 'text-success'}">
                        ${formatCurrency(velocity.remaining_money_after_bills || 0)}
                    </div>
                    <div class="detail-subtext">
                        ${velocity.remaining_money_after_bills < 0 
                            ? 'Not enough for bills!' 
                            : 'True available money'}
                    </div>
                </div>
            </div>
            
            <div class="velocity-detail-card">
                <div class="detail-icon">📈</div>
                <div class="detail-content">
                    <div class="detail-label">Projected End-of-Month</div>
                    <div class="detail-value ${velocity.projected_remaining < 0 ? 'text-danger' : 'text-success'}">
                        ${formatCurrency(velocity.projected_remaining)}
                    </div>
                    <div class="detail-subtext">
                        ${velocity.projected_remaining < 0 
                            ? `Over by ${formatCurrency(Math.abs(velocity.projected_remaining))}` 
                            : 'On track!'}
                    </div>
                </div>
            </div>
            
            <div class="velocity-detail-card">
                <div class="detail-icon">⏱️</div>
                <div class="detail-content">
                    <div class="detail-label">Daily Spending Average</div>
                    <div class="detail-value">${formatCurrency(velocity.actual_daily_rate)}</div>
                    <div class="detail-subtext">Based on ${velocity.days_passed} days</div>
                </div>
            </div>
        </div>
        
        <!-- Upcoming Bills Detail Section -->
        ${velocity.upcoming_bills > 0 && velocity.upcoming_bills_list && velocity.upcoming_bills_list.length > 0 ? `
            <div class="upcoming-bills-section">
                <h4>📋 Upcoming Bills This Month</h4>
                <div class="bills-list">
                    ${velocity.upcoming_bills_list.map(bill => `
                        <div class="bill-item">
                            <div class="bill-name">${bill.name}</div>
                            <div class="bill-details">
                                <span class="bill-amount">${formatCurrency(bill.amount)}</span>
                                <span class="bill-due">Due: Day ${bill.due_date}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="bills-total">
                    <strong>Total Upcoming:</strong> ${formatCurrency(velocity.upcoming_bills)}
                </div>
            </div>
        ` : ''}
        </div>
        
        <!-- Recommendations -->
        ${velocity.status === 'warning' || velocity.status === 'danger' ? `
            <div class="velocity-recommendations">
                <h4>💡 Recommendations</h4>
                <ul>
                    ${velocity.status === 'danger' ? `
                        <li>🚨 <strong>Urgent:</strong> Reduce daily spending to ${formatCurrency(velocity.safe_daily_rate)} or less</li>
                        <li>📋 Review your recent transactions and identify unnecessary expenses</li>
                        <li>🍽️ Consider cooking at home more to reduce dining out costs</li>
                        <li>⛽ Combine errands to reduce gas expenses</li>
                    ` : `
                        <li>⚠️ Slow down spending by ${formatCurrency((velocity.actual_daily_rate - velocity.safe_daily_rate))} per day</li>
                        <li>📊 Review your spending in high-expense categories</li>
                        <li>🎯 Focus on essential purchases only for the next few days</li>
                    `}
                    <li>💰 Consider moving funds to savings if you stay under budget</li>
                </ul>
            </div>
        ` : velocity.status === 'success' && velocity.remaining_money > 50 ? `
            <div class="velocity-success-message">
                <h4>🎉 Great Job!</h4>
                <p>You're doing excellent with your spending! Since you're on track, consider:</p>
                <ul>
                    <li>💰 Moving ${formatCurrency(Math.min(velocity.remaining_money * 0.5, 100))} to your emergency fund</li>
                    <li>🎯 Setting aside money for a savings goal</li>
                    <li>📈 Investing in your future</li>
                </ul>
            </div>
        ` : ''}
        
        <!-- Help Section -->
        <div class="velocity-help">
            <details>
                <summary>❓ How does Spending Velocity work?</summary>
                <div class="help-content">
                    <p><strong>Spending Velocity</strong> tracks how fast you're spending compared to how fast you <em>should</em> be spending to stay within budget.</p>
                    
                    <h5>How it's calculated:</h5>
                    <ul>
                        <li><strong>Actual Daily Rate:</strong> Your total spending this month ÷ days that have passed</li>
                        <li><strong>Safe Daily Rate:</strong> (Your remaining money - upcoming bills) ÷ days left in the month</li>
                    </ul>
                    
                    <h5>⭐ New: Upcoming Bills Protection</h5>
                    <p>The safe daily rate now <strong>automatically subtracts upcoming bills</strong> that are due later this month. This ensures you don't accidentally spend money you need for bills!</p>
                    <ul>
                        <li>✅ Bills due before today are already accounted for in your spending</li>
                        <li>📋 Bills due after today are subtracted from your remaining money</li>
                        <li>💡 This gives you the <strong>true available spending money</strong> for the rest of the month</li>
                    </ul>
                    
                    <h5>Status Indicators:</h5>
                    <ul>
                        <li><strong>✅ On Track / Good Pace:</strong> You're spending at or below the safe rate</li>
                        <li><strong>⚠️ Spending Fast:</strong> You're 10-30% over the safe rate</li>
                        <li><strong>🚨 Too Fast / Critical:</strong> You're more than 30% over the safe rate, or don't have enough for upcoming bills</li>
                    </ul>
                    
                    <p><strong>Pro Tip:</strong> Check this page every few days to make sure you're staying on track! The system automatically adjusts as bills are paid.</p>
                </div>
            </details>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Display next paycheck countdown
 */
function displayPaycheckCountdown(paycheckData) {
    if (!paycheckData || !paycheckData.has_paychecks) {
        return `
            <div class="paycheck-countdown-card status-info">
                <div class="paycheck-icon">💼</div>
                <div class="paycheck-content">
                    <h4>No Upcoming Paychecks</h4>
                    <p>Add income sources with payment dates to see your paycheck countdown!</p>
                    <button class="btn-secondary btn-sm" onclick="BudgetApp.switchTab('income')">
                        Add Income Sources
                    </button>
                </div>
            </div>
        `;
    }
    
    const { next_paycheck, days_until_next, status, status_text, message, urgency, all_upcoming, next_30_days_count, next_30_days_total } = paycheckData;
    
    // Determine the display style based on urgency
    let countdownClass = 'status-info';
    let countdownIcon = '📅';
    
    if (days_until_next === 0) {
        countdownClass = 'status-success paycheck-today';
        countdownIcon = '🎉';
    } else if (days_until_next <= 3) {
        countdownClass = 'status-success';
        countdownIcon = '🎯';
    } else if (days_until_next <= 7) {
        countdownClass = 'status-info';
        countdownIcon = '⏰';
    } else if (days_until_next <= 14) {
        countdownClass = 'status-warning';
        countdownIcon = '⏳';
    } else {
        countdownClass = 'status-warning';
        countdownIcon = '📆';
    }
    
    return `
        <div class="paycheck-countdown-card ${countdownClass}">
            <div class="paycheck-header">
                <div class="paycheck-icon-large">${countdownIcon}</div>
                <div class="paycheck-title-section">
                    <h4>Next Paycheck Countdown</h4>
                    <p class="paycheck-subtitle">${message}</p>
                </div>
            </div>
            
            <div class="paycheck-countdown-main">
                <div class="countdown-display">
                    <div class="countdown-number">${days_until_next}</div>
                    <div class="countdown-label">${days_until_next === 1 ? 'Day' : 'Days'}</div>
                </div>
                
                <div class="paycheck-details">
                    <div class="paycheck-detail-row">
                        <span class="detail-label">💰 Amount:</span>
                        <span class="detail-value">${formatCurrency(next_paycheck.amount)}</span>
                    </div>
                    <div class="paycheck-detail-row">
                        <span class="detail-label">👤 Earner:</span>
                        <span class="detail-value">${next_paycheck.earner_name}</span>
                    </div>
                    <div class="paycheck-detail-row">
                        <span class="detail-label">💼 Source:</span>
                        <span class="detail-value">${next_paycheck.source_name}</span>
                    </div>
                    <div class="paycheck-detail-row">
                        <span class="detail-label">📅 Date:</span>
                        <span class="detail-value">${next_paycheck.next_pay_date_formatted}</span>
                    </div>
                    <div class="paycheck-detail-row">
                        <span class="detail-label">🔄 Frequency:</span>
                        <span class="detail-value">${capitalizeFrequency(next_paycheck.frequency)}</span>
                    </div>
                </div>
            </div>
            
            ${all_upcoming && all_upcoming.length > 1 ? `
                <div class="upcoming-paychecks-summary">
                    <h5>📋 All Upcoming Paychecks</h5>
                    <div class="upcoming-paychecks-list">
                        ${all_upcoming.map(paycheck => `
                            <div class="upcoming-paycheck-item ${paycheck.days_until === days_until_next ? 'is-next' : ''}">
                                <div class="paycheck-item-left">
                                    <span class="paycheck-item-earner">${paycheck.earner_name}</span>
                                    <span class="paycheck-item-date">${paycheck.next_pay_date_formatted}</span>
                                </div>
                                <div class="paycheck-item-right">
                                    <span class="paycheck-item-amount">${formatCurrency(paycheck.amount)}</span>
                                    <span class="paycheck-item-days">${paycheck.days_until === 0 ? 'Today' : paycheck.days_until === 1 ? 'Tomorrow' : `${paycheck.days_until} days`}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${next_30_days_count > 0 ? `
                <div class="paycheck-summary-footer">
                    <strong>Next 30 Days:</strong> ${next_30_days_count} paycheck${next_30_days_count > 1 ? 's' : ''} totaling ${formatCurrency(next_30_days_total)}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Helper function to capitalize frequency text
 */
function capitalizeFrequency(frequency) {
    if (!frequency) return 'Unknown';
    
    const frequencyMap = {
        'weekly': 'Weekly',
        'bi-weekly': 'Bi-Weekly',
        'semi-monthly': 'Semi-Monthly',
        'monthly': 'Monthly',
        'annual': 'Annual'
    };
    
    return frequencyMap[frequency.toLowerCase()] || frequency.charAt(0).toUpperCase() + frequency.slice(1);
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

/**
 * Show Money Left Per Day Calculator Breakdown Modal
 */
export async function showMoneyPerDayBreakdown() {
    try {
        // Fetch the latest data
        const data = await API.getMoneyLeftPerDay();
        
        // Create modal HTML
        const modalHTML = `
            <div class="modal-overlay" id="money-per-day-modal">
                <div class="modal-content large-modal">
                    <div class="modal-header">
                        <h2>💰 Daily Budget Calculator</h2>
                        <button class="btn-close" onclick="document.getElementById('money-per-day-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <!-- Main Status Card -->
                        <div class="money-per-day-status status-${data.status}">
                            <div class="status-icon-large">
                                ${data.status === 'danger' ? '🚨' : data.status === 'warning' ? '⚠️' : '✅'}
                            </div>
                            <div class="status-content">
                                <h3>${data.status_text}</h3>
                                <div class="money-per-day-value ${data.remaining_money < 0 ? 'negative' : ''}">${formatCurrency(data.money_per_day)}/day</div>
                                <p class="status-message">${data.message}</p>
                            </div>
                        </div>
                        
                        <!-- Key Metrics Grid -->
                        <div class="metrics-grid">
                            <div class="metric-card">
                                <div class="metric-icon">💵</div>
                                <div class="metric-content">
                                    <div class="metric-label">Remaining Money</div>
                                    <div class="metric-value ${data.remaining_money < 0 ? 'negative' : 'positive'}">
                                        ${formatCurrency(data.remaining_money)}
                                    </div>
                                    <div class="metric-detail">Available for spending</div>
                                </div>
                            </div>
                            
                            <div class="metric-card">
                                <div class="metric-icon">📅</div>
                                <div class="metric-content">
                                    <div class="metric-label">Days Until Paycheck</div>
                                    <div class="metric-value">${data.days_until_paycheck || 0}</div>
                                    <div class="metric-detail">${data.next_paycheck_date ? `Next: ${new Date(data.next_paycheck_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Based on month end'}</div>
                                </div>
                            </div>
                            
                            <div class="metric-card">
                                <div class="metric-icon">💰</div>
                                <div class="metric-content">
                                    <div class="metric-label">Money Per Day</div>
                                    <div class="metric-value">${formatCurrency(data.money_per_day)}</div>
                                    <div class="metric-detail">Safe daily spending limit</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Calculation Breakdown -->
                        <div class="calculation-section">
                            <h3>📊 How It's Calculated</h3>
                            <div class="calculation-steps">
                                <div class="calc-step">
                                    <div class="calc-label">Available for Month</div>
                                    <div class="calc-value">${formatCurrency(data.available_for_month)}</div>
                                    <div class="calc-note">Income - Fixed Expenses</div>
                                </div>
                                <div class="calc-operator">−</div>
                                <div class="calc-step">
                                    <div class="calc-label">Spent So Far</div>
                                    <div class="calc-value">${formatCurrency(data.mtd_spent)}</div>
                                    <div class="calc-note">Month-to-date spending</div>
                                </div>
                                <div class="calc-operator">=</div>
                                <div class="calc-step highlight">
                                    <div class="calc-label">Money Remaining</div>
                                    <div class="calc-value ${data.remaining_money < 0 ? 'negative' : 'positive'}">${formatCurrency(data.remaining_money)}</div>
                                    <div class="calc-note">What's left to spend</div>
                                </div>
                                <div class="calc-operator">÷</div>
                                <div class="calc-step">
                                    <div class="calc-label">Days Until Paycheck</div>
                                    <div class="calc-value">${data.days_until_paycheck || 0}</div>
                                    <div class="calc-note">Time remaining</div>
                                </div>
                                <div class="calc-operator">=</div>
                                <div class="calc-step highlight-primary">
                                    <div class="calc-label">Daily Budget</div>
                                    <div class="calc-value large">${formatCurrency(data.money_per_day)}/day</div>
                                    <div class="calc-note">Your safe spending rate</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Visual Timeline -->
                        ${data.days_until_paycheck && data.days_until_paycheck > 0 ? `
                            <div class="timeline-section">
                                <h3>📆 Days Until Paycheck</h3>
                                <div class="timeline-visual">
                                    <div class="timeline-bar">
                                        <div class="timeline-today">Today</div>
                                        ${Array.from({length: Math.min(data.days_until_paycheck, 14)}, (_, i) => `
                                            <div class="timeline-day">
                                                <div class="day-dot"></div>
                                                <div class="day-label">Day ${i + 1}</div>
                                                <div class="day-amount">${formatCurrency(data.money_per_day)}</div>
                                            </div>
                                        `).join('')}
                                        ${data.days_until_paycheck > 14 ? `
                                            <div class="timeline-day">
                                                <div class="day-dot">...</div>
                                                <div class="day-label">${data.days_until_paycheck} days</div>
                                            </div>
                                        ` : ''}
                                        <div class="timeline-paycheck">
                                            <div class="paycheck-icon">💰</div>
                                            <div class="paycheck-label">Payday!</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Spending Scenarios -->
                        <div class="scenarios-section">
                            <h3>💭 Spending Scenarios</h3>
                            <div class="scenarios-grid">
                                ${data.money_per_day > 0 ? `
                                    <div class="scenario-card success">
                                        <div class="scenario-icon">✅</div>
                                        <div class="scenario-title">If you stick to the budget</div>
                                        <div class="scenario-amount">${formatCurrency(data.money_per_day * (data.days_until_paycheck || 1))}</div>
                                        <div class="scenario-note">Total available until payday</div>
                                    </div>
                                    
                                    <div class="scenario-card warning">
                                        <div class="scenario-icon">⚠️</div>
                                        <div class="scenario-title">If you spend 20% more per day</div>
                                        <div class="scenario-amount">${formatCurrency(data.money_per_day * 1.2 * (data.days_until_paycheck || 1))}</div>
                                        <div class="scenario-note">You'll be over by ${formatCurrency(data.money_per_day * 0.2 * (data.days_until_paycheck || 1))}</div>
                                    </div>
                                    
                                    <div class="scenario-card success">
                                        <div class="scenario-icon">🎯</div>
                                        <div class="scenario-title">If you save 20% per day</div>
                                        <div class="scenario-amount">${formatCurrency(data.money_per_day * 0.2 * (data.days_until_paycheck || 1))}</div>
                                        <div class="scenario-note">Extra money for savings or goals!</div>
                                    </div>
                                ` : `
                                    <div class="scenario-card danger">
                                        <div class="scenario-icon">🚨</div>
                                        <div class="scenario-title">Budget Alert</div>
                                        <div class="scenario-note">You've exceeded your monthly budget. Avoid additional spending and review your expenses.</div>
                                    </div>
                                `}
                            </div>
                        </div>
                        
                        <!-- Tips & Recommendations -->
                        <div class="tips-section">
                            <h3>💡 Smart Spending Tips</h3>
                            <ul class="tips-list">
                                ${data.status === 'danger' && data.remaining_money < 0 ? `
                                    <li class="danger-tip">🚨 You've overspent this month. Focus on essentials only and avoid discretionary purchases.</li>
                                ` : ''}
                                ${data.status === 'danger' && data.money_per_day < 10 && data.remaining_money >= 0 ? `
                                    <li class="danger-tip">🚨 Your daily budget is very tight. Stick to absolute necessities only.</li>
                                    <li>Consider meal planning to minimize food costs.</li>
                                    <li>Avoid impulse purchases - every dollar counts!</li>
                                ` : ''}
                                ${data.status === 'warning' ? `
                                    <li class="warning-tip">⚠️ Your budget is limited. Be mindful of every purchase.</li>
                                    <li>Look for ways to reduce discretionary spending.</li>
                                    <li>Consider bringing lunch instead of eating out.</li>
                                ` : ''}
                                ${data.status === 'success' && data.money_per_day >= 50 ? `
                                    <li class="success-tip">✅ You have good spending room! Consider setting aside some for savings.</li>
                                    <li>Great job staying on budget! Keep up the momentum.</li>
                                ` : ''}
                                ${data.status === 'success' && data.money_per_day < 50 ? `
                                    <li class="success-tip">✅ You're doing well! Stay disciplined to maintain this pace.</li>
                                ` : ''}
                                ${data.days_until_paycheck && data.days_until_paycheck <= 3 ? `
                                    <li>🎯 You're almost at payday! Just ${data.days_until_paycheck} more day${data.days_until_paycheck !== 1 ? 's' : ''} to go.</li>
                                ` : ''}
                                ${data.days_until_paycheck && data.days_until_paycheck > 14 ? `
                                    <li>📆 It's still early in the pay period. Pace yourself to avoid running out later.</li>
                                ` : ''}
                                <li>💭 Ask yourself before each purchase: "Do I really need this, or can it wait until after payday?"</li>
                                <li>📊 Check this daily budget calculator every morning to stay aware of your spending limits.</li>
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="document.getElementById('money-per-day-modal').remove()">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Close on overlay click
        const modal = document.getElementById('money-per-day-modal');
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
        console.error('Error showing money per day breakdown:', error);
        showNotification('Failed to load daily budget calculator', 'error');
    }
}

/**
 * Show detailed Budget Health Score breakdown modal
 */
async function showHealthScoreModal() {
    try {
        showLoading('dashboard-overview', 'Loading health score details...');
        
        const healthScore = await API.getBudgetHealthScore();
        
        if (!healthScore || healthScore.score === undefined) {
            showError('dashboard-overview', 'Unable to load health score. Please add financial data first.');
            return;
        }
        
        const breakdown = healthScore.breakdown || {};
        
        // Build the detailed modal with all scoring factors
        const modalHTML = `
            <div class="modal-overlay" id="health-score-modal">
                <div class="modal-content large-modal">
                    <div class="modal-header">
                        <h2>${healthScore.icon} Budget Health Score</h2>
                        <button class="modal-close" onclick="document.getElementById('health-score-modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <!-- Overall Score Display -->
                        <div class="health-score-summary" style="background: linear-gradient(135deg, ${healthScore.color}15, ${healthScore.color}30); border: 2px solid ${healthScore.color}; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; text-align: center;">
                            <div style="font-size: 4rem; font-weight: bold; color: ${healthScore.color};">
                                ${healthScore.score}
                            </div>
                            <div style="font-size: 1.5rem; font-weight: 600; margin-top: 0.5rem;">
                                ${healthScore.grade} - ${healthScore.grade_text}
                            </div>
                            <div style="font-size: 0.9rem; opacity: 0.8; margin-top: 0.5rem;">
                                Overall Budget Health Score
                            </div>
                        </div>
                        
                        <!-- Score Breakdown by Category -->
                        <div class="health-score-breakdown">
                            <h3 style="margin-bottom: 1rem;">Score Breakdown</h3>
                            
                            ${Object.entries(breakdown).map(([categoryName, categoryData]) => {
                                const percentage = (categoryData.score / categoryData.max) * 100;
                                const displayName = categoryName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                
                                // Determine color based on percentage
                                let barColor = '#ef4444'; // Red
                                if (percentage >= 80) barColor = '#10b981'; // Green
                                else if (percentage >= 60) barColor = '#3b82f6'; // Blue
                                else if (percentage >= 40) barColor = '#f59e0b'; // Amber
                                
                                return `
                                    <div class="health-category" style="margin-bottom: 1.5rem;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                            <h4 style="margin: 0; font-size: 1rem;">${displayName}</h4>
                                            <span style="font-weight: 600; color: ${barColor};">
                                                ${categoryData.score}/${categoryData.max} points
                                            </span>
                                        </div>
                                        
                                        <!-- Progress Bar -->
                                        <div style="width: 100%; height: 20px; background: rgba(0,0,0,0.1); border-radius: 10px; overflow: hidden; margin-bottom: 0.75rem;">
                                            <div style="width: ${percentage}%; height: 100%; background: ${barColor}; transition: width 0.5s ease;"></div>
                                        </div>
                                        
                                        <!-- Factors List -->
                                        ${categoryData.factors && categoryData.factors.length > 0 ? `
                                            <ul style="list-style: none; padding-left: 0; margin: 0;">
                                                ${categoryData.factors.map(factor => `
                                                    <li style="padding: 0.25rem 0; font-size: 0.9rem;">
                                                        ${factor}
                                                    </li>
                                                `).join('')}
                                            </ul>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        
                        <!-- Financial Summary -->
                        ${healthScore.summary ? `
                            <div class="health-summary" style="background: var(--card-bg); border-radius: 8px; padding: 1rem; margin-top: 2rem;">
                                <h3 style="margin-top: 0;">Financial Summary</h3>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                                    <div>
                                        <div style="font-size: 0.85rem; opacity: 0.7;">Total Income</div>
                                        <div style="font-size: 1.25rem; font-weight: 600;">${formatCurrency(healthScore.summary.total_income)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 0.85rem; opacity: 0.7;">Total Expenses</div>
                                        <div style="font-size: 1.25rem; font-weight: 600;">${formatCurrency(healthScore.summary.total_expenses)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 0.85rem; opacity: 0.7;">Total Liquid Assets</div>
                                        <div style="font-size: 1.25rem; font-weight: 600;">${formatCurrency(healthScore.summary.total_liquid)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 0.85rem; opacity: 0.7;">Savings Balance</div>
                                        <div style="font-size: 1.25rem; font-weight: 600;">${formatCurrency(healthScore.summary.savings_balance)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 0.85rem; opacity: 0.7;">Month-to-Date Spent</div>
                                        <div style="font-size: 1.25rem; font-weight: 600;">${formatCurrency(healthScore.summary.mtd_spent)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 0.85rem; opacity: 0.7;">Remaining Money</div>
                                        <div style="font-size: 1.25rem; font-weight: 600; color: ${healthScore.summary.remaining_money < 0 ? '#ef4444' : '#10b981'};">
                                            ${formatCurrency(healthScore.summary.remaining_money)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Recommendations -->
                        ${healthScore.recommendations && healthScore.recommendations.length > 0 ? `
                            <div class="health-recommendations" style="background: var(--card-bg); border-radius: 8px; padding: 1rem; margin-top: 2rem;">
                                <h3 style="margin-top: 0;">💡 Recommendations</h3>
                                <ul style="margin: 0; padding-left: 1.5rem;">
                                    ${healthScore.recommendations.map(rec => `
                                        <li style="margin-bottom: 0.5rem;">${rec}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        <!-- How It's Calculated -->
                        <details style="margin-top: 2rem; padding: 1rem; background: var(--card-bg); border-radius: 8px;">
                            <summary style="cursor: pointer; font-weight: 600; font-size: 1rem;">
                                ℹ️ How is the Budget Health Score Calculated?
                            </summary>
                            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                                <p style="margin-bottom: 1rem;">Your Budget Health Score is calculated based on five key areas of your financial health:</p>
                                <ol style="line-height: 1.8;">
                                    <li><strong>Account Health (25 points):</strong> Evaluates your checking balance, emergency fund adequacy (3-6 months expenses), and credit card management.</li>
                                    <li><strong>Spending Adherence (25 points):</strong> Compares your actual spending to your budget, rewarding staying on track or under budget.</li>
                                    <li><strong>Savings Rate (20 points):</strong> Measures how much you're saving each month. Target: 10-20% or more of income.</li>
                                    <li><strong>Bill Payment Status (20 points):</strong> Checks if you have sufficient funds for upcoming bills (next 7 days) and overall bill payment capacity.</li>
                                    <li><strong>Setup Completeness (10 points):</strong> Rewards having your accounts, income sources, expenses, and transactions properly tracked.</li>
                                </ol>
                                <div style="margin-top: 1rem; padding: 1rem; background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; border-radius: 4px;">
                                    <strong>Grading Scale:</strong><br>
                                    90-100: A+ (Excellent) | 80-89: A (Very Good) | 70-79: B (Good) | 60-69: C (Fair) | 50-59: D (Needs Improvement) | 0-49: F (Critical)
                                </div>
                            </div>
                        </details>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="document.getElementById('health-score-modal').remove()">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove loading state
        const loadingElement = document.querySelector('#dashboard-overview .loading-overlay');
        if (loadingElement) {
            loadingElement.remove();
        }
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Close on overlay click
        const modal = document.getElementById('health-score-modal');
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
        console.error('Error showing health score modal:', error);
        showNotification('Failed to load health score details', 'error');
        
        // Remove loading state if error
        const loadingElement = document.querySelector('#dashboard-overview .loading-overlay');
        if (loadingElement) {
            loadingElement.remove();
        }
    }
}

// Expose functions to global scope for onclick handlers
window.dashboardModule = window.dashboardModule || {};
window.dashboardModule.showAvailableSpendingBreakdown = showAvailableSpendingBreakdown;
window.dashboardModule.showMTDSpendingBreakdown = showMTDSpendingBreakdown;
window.dashboardModule.showMoneyPerDayBreakdown = showMoneyPerDayBreakdown;
window.dashboardModule.showHealthScoreModal = showHealthScoreModal;
window.dashboardModule.navigateToPaycheckCountdown = navigateToPaycheckCountdown;
window.dashboardModule.showAccountModal = showAccountModal;
