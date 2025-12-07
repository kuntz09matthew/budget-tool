// Income Management Module
import * as API from '../api.js';
import { formatCurrency, showNotification, calculateMonthlyAmount } from '../utils.js';
import { showLoading, showError, showModal, hideModal, showEmptyState } from '../ui.js';
import { injectTab, injectModal } from '../templates.js';
import * as Retirement from './retirement.js';

let currentEditIncomeId = null;

// Income Tab HTML Template with Sub-Tabs
const incomeHTML = `
    <div class="section-header">
        <h2>💵 Income Management</h2>
        <button class="btn-primary" id="add-income-btn">+ Add Income Source</button>
    </div>
    
    <!-- Income Sub-Tabs -->
    <nav class="sub-tab-nav">
        <button class="sub-tab-btn active" data-subtab="income-overview" data-tooltip="View all income sources and monthly totals">
            <span class="sub-tab-icon">📋</span>
            <span class="sub-tab-label">Overview</span>
        </button>
        <button class="sub-tab-btn" data-subtab="income-by-earner" data-tooltip="View income grouped by household member">
            <span class="sub-tab-icon">👥</span>
            <span class="sub-tab-label">By Earner</span>
        </button>
        <button class="sub-tab-btn" data-subtab="income-variable" data-tooltip="Track and analyze variable income sources">
            <span class="sub-tab-icon">📊</span>
            <span class="sub-tab-label">Variable Income</span>
        </button>
        <button class="sub-tab-btn" data-subtab="income-trends" data-tooltip="View income trends and charts over time">
            <span class="sub-tab-icon">📈</span>
            <span class="sub-tab-label">Trends</span>
        </button>
        <button class="sub-tab-btn" data-subtab="income-year-over-year" data-tooltip="Compare income across different years">
            <span class="sub-tab-icon">📅</span>
            <span class="sub-tab-label">Year-over-Year</span>
        </button>
        <button class="sub-tab-btn" data-subtab="income-tax" data-tooltip="Estimate federal taxes based on income">
            <span class="sub-tab-icon">🧾</span>
            <span class="sub-tab-label">Tax Estimator</span>
        </button>
        <button class="sub-tab-btn" data-subtab="income-retirement" data-tooltip="Track retirement contributions and accounts">
            <span class="sub-tab-icon">💰</span>
            <span class="sub-tab-label">Retirement</span>
        </button>
    </nav>
    
    <div class="sub-tab-description" id="income-overview-desc"></div>
    
    <!-- Overview Sub-Tab -->
    <div id="income-overview" class="sub-tab-content active">
        <div class="income-summary" id="income-summary-cards"></div>
        <div id="income-list"></div>
    </div>
    
    <!-- By Earner Sub-Tab -->
    <div id="income-by-earner" class="sub-tab-content">
        <div id="income-by-earner-container"></div>
    </div>
    
    <!-- Variable Income Sub-Tab -->
    <div id="income-variable" class="sub-tab-content">
        <div id="variable-income-container"></div>
    </div>
    
    <!-- Trends Sub-Tab -->
    <div id="income-trends" class="sub-tab-content">
        <div id="income-trends-container"></div>
    </div>
    
    <!-- Year-over-Year Sub-Tab -->
    <div id="income-year-over-year" class="sub-tab-content">
        <div id="year-over-year-container"></div>
    </div>
    
    <!-- Tax Estimator Sub-Tab -->
    <div id="income-tax" class="sub-tab-content">
        <div id="tax-estimator-container"></div>
    </div>
    
    <!-- Retirement Sub-Tab -->
    <div id="income-retirement" class="sub-tab-content">
        <div class="section-header">
            <h3>Retirement Accounts</h3>
            <button class="btn-primary" id="add-retirement-btn">+ Add Retirement Account</button>
        </div>
        <div id="retirement-container"></div>
    </div>
`;

// Income Modal HTML Template
const incomeModalHTML = `
    <div id="income-modal" class="modal">
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h3 id="income-modal-title">Add Income Source</h3>
                <button class="modal-close" id="close-income-modal">&times;</button>
            </div>
            <form id="income-form">
                <!-- Basic Information Section -->
                <div class="form-section">
                    <h4>📋 Basic Information</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="income-name">Income Source Name *</label>
                            <input type="text" id="income-name" placeholder="e.g., Main Job, Side Hustle" required>
                        </div>
                        <div class="form-group">
                            <label for="income-earner">Earner Name</label>
                            <input type="text" id="income-earner" placeholder="e.g., John, Jane (optional)">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="income-type">Income Type *</label>
                            <select id="income-type" required>
                                <option value="">Select type...</option>
                                <option value="salary">💼 Primary Salary</option>
                                <option value="secondary-salary">💼 Secondary Salary</option>
                                <option value="freelance">💻 Freelance / Side Hustle</option>
                                <option value="investment">📈 Investment Income</option>
                                <option value="rental">🏠 Rental Income</option>
                                <option value="other">� Other Income</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="income-frequency">Payment Frequency *</label>
                            <select id="income-frequency" required>
                                <option value="">Select frequency...</option>
                                <option value="weekly">Weekly (52 times/year)</option>
                                <option value="bi-weekly">Bi-weekly (26 times/year)</option>
                                <option value="monthly">Monthly (12 times/year)</option>
                                <option value="annual">Annual (once/year)</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Income Amount Section -->
                <div class="form-section">
                    <h4>💰 Income Amount</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="income-amount">Expected Gross Amount *</label>
                            <input type="number" id="income-amount" placeholder="0.00" step="0.01" min="0" required>
                            <small>Amount before taxes and deductions</small>
                        </div>
                        <div class="form-group">
                            <label for="income-next-pay">Next Payment Date</label>
                            <input type="date" id="income-next-pay">
                            <small>When you expect the next payment</small>
                        </div>
                    </div>
                </div>
                
                <!-- Tax Withholding Section -->
                <div class="form-section">
                    <h4>🧾 Tax Withholding & Deductions</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="income-federal-tax">Federal Tax %</label>
                            <input type="number" id="income-federal-tax" placeholder="0" step="0.01" min="0" max="100" value="0">
                            <small>Typical: 10-22% for most earners</small>
                        </div>
                        <div class="form-group">
                            <label for="income-state-tax">State Tax %</label>
                            <input type="number" id="income-state-tax" placeholder="0" step="0.01" min="0" max="100" value="0">
                            <small>Varies by state (0-13%)</small>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="income-social-security">Social Security %</label>
                            <input type="number" id="income-social-security" placeholder="6.2" step="0.01" min="0" max="100" value="6.2">
                            <small>Standard: 6.2%</small>
                        </div>
                        <div class="form-group">
                            <label for="income-medicare">Medicare %</label>
                            <input type="number" id="income-medicare" placeholder="1.45" step="0.01" min="0" max="100" value="1.45">
                            <small>Standard: 1.45%</small>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="income-other-deductions">Other Deductions ($)</label>
                            <input type="number" id="income-other-deductions" placeholder="0.00" step="0.01" min="0" value="0">
                            <small>Health insurance, 401k, etc. (flat amount)</small>
                        </div>
                        <div class="form-group net-income-display">
                            <label>Estimated Net Income</label>
                            <div class="net-income-value" id="income-net-preview">$0.00</div>
                            <small>After all taxes and deductions</small>
                        </div>
                    </div>
                </div>
                
                <!-- Notes Section -->
                <div class="form-section">
                    <h4>📝 Additional Notes</h4>
                    <div class="form-group">
                        <label for="income-notes">Notes (Optional)</label>
                        <textarea id="income-notes" rows="3" placeholder="Any additional information about this income source..."></textarea>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" id="cancel-income-btn">Cancel</button>
                    <button type="submit" class="btn-primary" id="save-income-btn">Save Income Source</button>
                </div>
            </form>
        </div>
    </div>
`;

/**
 * Initialize income module
 */
export function init() {
    console.log('Initializing Income module...');
    
    // Inject HTML templates
    injectTab('income', incomeHTML);
    injectModal('income-modal', incomeModalHTML);
    
    // Setup event listeners
    setupEventListeners();
}

/**
 * Setup income-specific event listeners
 */
function setupEventListeners() {
    // Listen for tab changes
    window.addEventListener('tabChange', (e) => {
        if (e.detail.tab === 'income') {
            loadIncomeOverview();
        }
    });
    
    // Listen for sub-tab changes in income
    window.addEventListener('subTabChange', (e) => {
        if (e.detail.parentTab === 'income') {
            handleSubTabChange(e.detail.subTab);
        }
    });
    
    // Setup add income button
    const addIncomeBtn = document.getElementById('add-income-btn');
    if (addIncomeBtn) {
        addIncomeBtn.addEventListener('click', () => showIncomeModal());
    }
    
    // Setup add retirement button
    const addRetirementBtn = document.getElementById('add-retirement-btn');
    if (addRetirementBtn) {
        addRetirementBtn.addEventListener('click', () => Retirement.openAddAccountModal());
    }
    
    // Setup income form
    const incomeForm = document.getElementById('income-form');
    if (incomeForm) {
        incomeForm.addEventListener('submit', handleIncomeSubmit);
    }
}

/**
 * Handle sub-tab changes
 */
function handleSubTabChange(subTab) {
    switch (subTab) {
        case 'income-overview':
            loadIncomeOverview();
            break;
        case 'income-by-earner':
            loadIncomeByEarner();
            break;
        case 'income-variable':
            loadVariableIncome();
            break;
        case 'income-trends':
            loadIncomeTrends();
            break;
        case 'income-year-over-year':
            loadYearOverYear();
            break;
        case 'income-tax':
            loadTaxEstimator();
            break;
        case 'income-retirement':
            loadRetirement();
            break;
    }
}

/**
 * Load income overview sub-tab
 */
export async function loadIncomeOverview() {
    console.log('Loading income overview...');
    showLoading('income-summary-cards', 'Loading income data...');
    showLoading('income-list', 'Loading income sources...');
    
    try {
        const [sources, totalIncome] = await Promise.all([
            API.getIncomeSources(),
            API.getTotalIncome()
        ]);
        
        renderIncomeSummary(totalIncome, sources);
        displayIncomeSources(sources);
    } catch (error) {
        console.error('Error loading income overview:', error);
        showError('income-list', 'Failed to load income sources');
    }
}

/**
 * Render income summary cards
 */
function renderIncomeSummary(totalIncomeData, sources = []) {
    const container = document.getElementById('income-summary-cards');
    if (!container) return;
    
    const monthlyTotal = totalIncomeData.total || 0;
    const annualTotal = monthlyTotal * 12;
    
    // Get unique earners
    const earners = [...new Set(sources.map(s => s.earner_name).filter(Boolean))];
    const sourceCount = sources.length;
    
    const html = `
        <div class="summary-card">
            <div class="card-icon">💵</div>
            <h3>Total Monthly Income</h3>
            <p class="card-value">${formatCurrency(monthlyTotal)}</p>
            <p class="card-detail">${sourceCount} income source${sourceCount !== 1 ? 's' : ''}</p>
        </div>
        <div class="summary-card">
            <div class="card-icon">💰</div>
            <h3>Annual Income</h3>
            <p class="card-value">${formatCurrency(annualTotal)}</p>
        </div>
        <div class="summary-card">
            <div class="card-icon">👨‍👩‍👧‍👦</div>
            <h3>Household Earners</h3>
            <p class="card-value">${earners.length}</p>
            <p class="card-detail">${earners.length > 0 ? earners.join(', ') : 'No earners listed'}</p>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Load and display income sources (backwards compatibility)
 */
export async function loadIncomeSources() {
    await loadIncomeOverview();
}

/**
 * Load income by earner sub-tab
 */
export async function loadIncomeByEarner() {
    console.log('Loading income by earner...');
    const container = document.getElementById('income-by-earner-container');
    if (!container) return;
    
    showLoading('income-by-earner-container', 'Loading earner data...');
    
    try {
        const data = await API.getIncomeByEarner();
        displayIncomeByEarner(data);
    } catch (error) {
        console.error('Error loading income by earner:', error);
        showError('income-by-earner-container', 'Failed to load earner data');
    }
}

/**
 * Display income grouped by earner
 */
function displayIncomeByEarner(data) {
    const container = document.getElementById('income-by-earner-container');
    if (!container) return;
    
    const { earners, unassigned, household_totals } = data;
    
    if (earners.length === 0 && unassigned.length === 0) {
        showEmptyState(
            'income-by-earner-container',
            '👥',
            'No income sources yet. Add income sources and assign them to household members to see individual earnings.',
            { text: 'Add Income Source', action: 'BudgetApp.modules.Income.showIncomeModal()' }
        );
        return;
    }
    
    let html = '';
    
    // Household Summary
    if (earners.length > 0) {
        html += `
            <div class="earner-household-summary">
                <h3>👨‍👩‍👧‍👦 Household Income Summary</h3>
                <div class="household-stats">
                    <div class="stat-card">
                        <label>Total Monthly (Net)</label>
                        <span class="stat-value">${formatCurrency(household_totals.monthly_net)}</span>
                    </div>
                    <div class="stat-card">
                        <label>Total Annual (Net)</label>
                        <span class="stat-value">${formatCurrency(household_totals.annual_net)}</span>
                    </div>
                    <div class="stat-card">
                        <label>Total Earners</label>
                        <span class="stat-value">${household_totals.earner_count}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Individual Earner Cards
    if (earners.length > 0) {
        html += '<div class="earners-grid">';
        
        earners.forEach((earner, index) => {
            const percentOfHousehold = earner.contribution_percent_net.toFixed(1);
            const deductionAmount = earner.total_deductions;
            const deductionPercent = earner.total_monthly_gross > 0 
                ? ((deductionAmount / earner.total_monthly_gross) * 100).toFixed(1) 
                : 0;
            
            html += `
                <div class="earner-card">
                    <div class="earner-header">
                        <div class="earner-icon">${index === 0 ? '👤' : '👥'}</div>
                        <div class="earner-title-block">
                            <h4>${earner.name}</h4>
                            <p class="earner-subtitle">${earner.source_count} income source${earner.source_count !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    
                    <div class="earner-totals">
                        <div class="earner-total-row">
                            <div class="earner-total-item">
                                <label>Monthly Gross</label>
                                <span class="amount-gross">${formatCurrency(earner.total_monthly_gross)}</span>
                            </div>
                            <div class="earner-total-item">
                                <label>Monthly Net</label>
                                <span class="amount-net highlight">${formatCurrency(earner.total_monthly_net)}</span>
                            </div>
                        </div>
                        <div class="earner-total-row">
                            <div class="earner-total-item">
                                <label>Annual Net</label>
                                <span>${formatCurrency(earner.total_annual_net)}</span>
                            </div>
                            <div class="earner-total-item">
                                <label>% of Household</label>
                                <span class="contribution-percent">${percentOfHousehold}%</span>
                            </div>
                        </div>
                        ${deductionAmount > 0 ? `
                            <div class="earner-deductions">
                                <label>Total Deductions</label>
                                <span class="deductions-amount">${formatCurrency(deductionAmount)} (${deductionPercent}%)</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="earner-contribution-bar">
                        <div class="contribution-fill" style="width: ${percentOfHousehold}%"></div>
                    </div>
                    
                    <div class="earner-sources">
                        <h5>Income Sources:</h5>
                        ${earner.income_sources.map(source => {
                            const icon = getIncomeIcon(source.type);
                            return `
                                <div class="earner-source-item">
                                    <span class="source-icon">${icon}</span>
                                    <div class="source-details">
                                        <span class="source-name">${source.name}</span>
                                        <span class="source-amount">${formatCurrency(source.monthly_net)}/mo net</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <div class="earner-actions">
                        <button class="btn-secondary btn-sm" onclick="BudgetApp.modules.Income.filterByEarner('${earner.name}')">
                            View All Sources
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    // Unassigned Income Sources
    if (unassigned.length > 0) {
        html += `
            <div class="unassigned-income">
                <h3>⚠️ Unassigned Income Sources</h3>
                <p class="unassigned-note">These income sources haven't been assigned to a household member. Edit them to assign an earner.</p>
                <div class="unassigned-grid">
                    ${unassigned.map(source => {
                        const icon = getIncomeIcon(source.type);
                        return `
                            <div class="unassigned-source">
                                <span class="source-icon">${icon}</span>
                                <div class="source-info">
                                    <span class="source-name">${source.name}</span>
                                    <span class="source-amount">${formatCurrency(source.monthly_net)}/mo</span>
                                </div>
                                <button class="btn-secondary btn-sm" onclick="BudgetApp.modules.Income.editIncome(${source.id})">
                                    Assign
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

/**
 * Filter income sources by earner (switches to Overview tab with filter)
 */
export function filterByEarner(earnerName) {
    // Switch to overview tab
    const overviewBtn = document.querySelector('[data-subtab="income-overview"]');
    if (overviewBtn) {
        overviewBtn.click();
    }
    
    // TODO: Implement actual filtering in the overview tab
    // For now, just switch to the tab
    showNotification(`Viewing all income for ${earnerName}`, 'info');
}

/**
 * Display income sources
 */
function displayIncomeSources(sources) {
    const container = document.getElementById('income-list');
    if (!container) return;
    
    if (sources.length === 0) {
        showEmptyState(
            'income-list',
            '💵',
            'No income sources yet. Add your first income source to start tracking your earnings!',
            { text: 'Add Income Source', action: 'BudgetApp.modules.Income.showIncomeModal()' }
        );
        return;
    }
    
    let html = '<h3>Income Sources</h3><div class="income-grid">';
    sources.forEach(source => {
        const monthlyAmount = calculateMonthlyAmount(source.amount, source.frequency);
        const isVariable = source.is_variable || false;
        const paymentCount = source.actual_payments ? source.actual_payments.length : 0;
        const lastPayment = source.actual_payments && source.actual_payments.length > 0 
            ? source.actual_payments[source.actual_payments.length - 1]
            : null;
        
        // Get net income breakdown
        const netBreakdown = source.net_income_breakdown || {};
        const netIncome = netBreakdown.net_income || source.amount;
        const monthlyNet = calculateMonthlyAmount(netIncome, source.frequency);
        const totalDeductions = netBreakdown.total_deductions || 0;
        const deductionPercent = source.amount > 0 ? ((totalDeductions / source.amount) * 100).toFixed(1) : 0;
        
        // Calculate expected vs actual for current month (if payments exist)
        let actualVsExpected = null;
        if (paymentCount > 0) {
            const currentMonth = new Date().toISOString().slice(0, 7);
            const currentMonthPayments = source.actual_payments.filter(p => p.date.startsWith(currentMonth));
            if (currentMonthPayments.length > 0) {
                const actualThisMonth = currentMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                const variance = actualThisMonth - source.amount;
                const variancePercent = source.amount > 0 ? ((variance / source.amount) * 100).toFixed(1) : 0;
                actualVsExpected = {
                    actual: actualThisMonth,
                    expected: source.amount,
                    variance: variance,
                    variancePercent: variancePercent,
                    status: variance >= 0 ? 'above' : 'below'
                };
            }
        }
        
        html += `
            <div class="income-card ${isVariable ? 'variable' : ''}">
                <div class="income-header">
                    <span class="income-icon">${getIncomeIcon(source.type)}</span>
                    <div class="income-title-block">
                        <h4>${source.name}</h4>
                        ${source.earner_name ? `<p class="income-earner">👤 ${source.earner_name}</p>` : ''}
                        ${isVariable ? '<span class="variable-badge">📊 Variable</span>' : ''}
                    </div>
                </div>
                <div class="income-details">
                    <div class="income-detail-row">
                        <div class="income-amount">
                            <label>Gross Amount</label>
                            <span class="amount-gross">${formatCurrency(source.amount)}</span>
                        </div>
                        <div class="income-net-amount">
                            <label>Net Amount</label>
                            <span class="amount-net">${formatCurrency(netIncome)}</span>
                        </div>
                    </div>
                    <div class="income-detail-row">
                        <div class="income-frequency">
                            <label>Frequency</label>
                            <span>${formatFrequency(source.frequency)}</span>
                        </div>
                        <div class="income-monthly">
                            <label>Monthly Net</label>
                            <span class="highlight">${formatCurrency(monthlyNet)}/mo</span>
                        </div>
                    </div>
                    ${totalDeductions > 0 ? `
                        <div class="income-deductions">
                            <label>Deductions</label>
                            <span class="deductions-amount">${formatCurrency(totalDeductions)} (${deductionPercent}%)</span>
                            <div class="deductions-breakdown">
                                ${netBreakdown.federal_tax ? `<small>Federal: ${formatCurrency(netBreakdown.federal_tax)}</small>` : ''}
                                ${netBreakdown.state_tax ? `<small>State: ${formatCurrency(netBreakdown.state_tax)}</small>` : ''}
                                ${netBreakdown.social_security ? `<small>SS: ${formatCurrency(netBreakdown.social_security)}</small>` : ''}
                                ${netBreakdown.medicare ? `<small>Medicare: ${formatCurrency(netBreakdown.medicare)}</small>` : ''}
                                ${netBreakdown.other_deductions ? `<small>Other: ${formatCurrency(netBreakdown.other_deductions)}</small>` : ''}
                            </div>
                        </div>
                    ` : ''}
                    ${source.next_pay_date ? `
                        <div class="income-next-pay">
                            <label>Next Payment</label>
                            <span>📅 ${formatDate(source.next_pay_date)}</span>
                        </div>
                    ` : ''}
                    ${actualVsExpected ? `
                        <div class="income-actual-vs-expected ${actualVsExpected.status}">
                            <label>This Month (Actual vs Expected)</label>
                            <span>${formatCurrency(actualVsExpected.actual)} vs ${formatCurrency(actualVsExpected.expected)}</span>
                            <small class="variance ${actualVsExpected.status}">
                                ${actualVsExpected.variance >= 0 ? '+' : ''}${formatCurrency(actualVsExpected.variance)} 
                                (${actualVsExpected.variance >= 0 ? '+' : ''}${actualVsExpected.variancePercent}%)
                            </small>
                        </div>
                    ` : ''}
                    ${paymentCount > 0 && !actualVsExpected ? `
                        <div class="income-payment-history">
                            <label>Payment History</label>
                            <span>${paymentCount} payment${paymentCount !== 1 ? 's' : ''} recorded</span>
                            ${lastPayment ? `<small>Last: ${formatCurrency(lastPayment.amount)} on ${formatDate(lastPayment.date)}</small>` : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="income-actions">
                    ${isVariable ? `<button class="btn-small btn-info" onclick="BudgetApp.modules.Income.showVariableAnalysis('${source.id}')" title="View Variable Income Analysis">📊 Analysis</button>` : ''}
                    <button class="btn-icon" onclick="BudgetApp.modules.Income.editIncome('${source.id}')" title="Edit">✏️</button>
                    <button class="btn-icon" onclick="BudgetApp.modules.Income.deleteIncome('${source.id}')" title="Delete">🗑️</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

/**
 * Format frequency for display
 */
function formatFrequency(freq) {
    const freqMap = {
        'weekly': 'Weekly',
        'biweekly': 'Bi-weekly',
        'bi-weekly': 'Bi-weekly',
        'semimonthly': 'Semi-monthly',
        'semi-monthly': 'Semi-monthly',
        'monthly': 'Monthly',
        'quarterly': 'Quarterly',
        'annual': 'Annual'
    };
    return freqMap[freq] || freq;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Get icon for income type
 */
function getIncomeIcon(type) {
    const icons = {
        'salary': '💼',
        'secondary-salary': '💼',
        'freelance': '💻',
        'investment': '📈',
        'rental': '🏠',
        'other': '💵'
    };
    return icons[type] || '💵';
}

/**
 * Get display name for income type
 */
function getIncomeTypeName(type) {
    const names = {
        'salary': 'Primary Salary',
        'secondary-salary': 'Secondary Salary',
        'freelance': 'Freelance / Side Hustle',
        'investment': 'Investment Income',
        'rental': 'Rental Income',
        'other': 'Other Income'
    };
    return names[type] || type;
}

/**
 * Show income modal
 */
export function showIncomeModal(incomeId = null) {
    currentEditIncomeId = incomeId;
    
    const modal = document.getElementById('income-modal');
    const title = document.getElementById('income-modal-title');
    const form = document.getElementById('income-form');
    
    if (incomeId) {
        title.textContent = 'Edit Income Source';
        loadIncomeData(incomeId);
    } else {
        title.textContent = 'Add Income Source';
        form.reset();
        // Set default values for new income
        document.getElementById('income-social-security').value = '6.2';
        document.getElementById('income-medicare').value = '1.45';
        document.getElementById('income-federal-tax').value = '0';
        document.getElementById('income-state-tax').value = '0';
        document.getElementById('income-other-deductions').value = '0';
        updateNetIncomePreview();
    }
    
    // Setup real-time net income calculation
    setupNetIncomeCalculator();
    
    showModal('income-modal');
    
    // Setup modal close handlers
    document.getElementById('close-income-modal')?.addEventListener('click', () => {
        hideModal('income-modal');
    });
    
    document.getElementById('cancel-income-btn')?.addEventListener('click', () => {
        hideModal('income-modal');
    });
}

/**
 * Load income data for editing
 */
async function loadIncomeData(incomeId) {
    try {
        const sources = await API.getIncomeSources();
        const income = sources.find(s => s.id == incomeId);
        
        if (!income) {
            showNotification('Income source not found', 'error');
            return;
        }
        
        // Populate basic information
        document.getElementById('income-name').value = income.name || '';
        document.getElementById('income-earner').value = income.earner_name || '';
        document.getElementById('income-type').value = income.type || '';
        document.getElementById('income-frequency').value = income.frequency || '';
        
        // Populate income amount
        document.getElementById('income-amount').value = income.amount || '';
        document.getElementById('income-next-pay').value = income.next_pay_date || '';
        
        // Populate tax withholding fields
        document.getElementById('income-federal-tax').value = income.federal_tax_percent || 0;
        document.getElementById('income-state-tax').value = income.state_tax_percent || 0;
        document.getElementById('income-social-security').value = income.social_security_percent || 6.2;
        document.getElementById('income-medicare').value = income.medicare_percent || 1.45;
        document.getElementById('income-other-deductions').value = income.other_deductions || 0;
        
        // Populate notes
        document.getElementById('income-notes').value = income.notes || '';
        
        // Update net income preview
        updateNetIncomePreview();
    } catch (error) {
        console.error('Error loading income data:', error);
        showNotification('Failed to load income data', 'error');
    }
}

/**
 * Handle income form submission
 */
async function handleIncomeSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const formData = {
        name: document.getElementById('income-name').value.trim(),
        earner_name: document.getElementById('income-earner').value.trim() || null,
        type: document.getElementById('income-type').value,
        amount: parseFloat(document.getElementById('income-amount').value),
        frequency: document.getElementById('income-frequency').value,
        next_pay_date: document.getElementById('income-next-pay').value || null,
        federal_tax_percent: parseFloat(document.getElementById('income-federal-tax').value) || 0,
        state_tax_percent: parseFloat(document.getElementById('income-state-tax').value) || 0,
        social_security_percent: parseFloat(document.getElementById('income-social-security').value) || 6.2,
        medicare_percent: parseFloat(document.getElementById('income-medicare').value) || 1.45,
        other_deductions: parseFloat(document.getElementById('income-other-deductions').value) || 0,
        notes: document.getElementById('income-notes').value.trim() || null
    };
    
    // Validate required fields
    if (!formData.name || !formData.type || !formData.amount || !formData.frequency) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate amount
    if (formData.amount <= 0) {
        showNotification('Amount must be greater than 0', 'error');
        return;
    }
    
    // Validate tax percentages
    if (formData.federal_tax_percent < 0 || formData.federal_tax_percent > 100 ||
        formData.state_tax_percent < 0 || formData.state_tax_percent > 100 ||
        formData.social_security_percent < 0 || formData.social_security_percent > 100 ||
        formData.medicare_percent < 0 || formData.medicare_percent > 100) {
        showNotification('Tax percentages must be between 0 and 100', 'error');
        return;
    }
    
    // Validate deductions
    if (formData.other_deductions < 0) {
        showNotification('Deductions cannot be negative', 'error');
        return;
    }
    
    try {
        if (currentEditIncomeId) {
            await API.updateIncomeSource(currentEditIncomeId, formData);
            showNotification('Income source updated successfully!', 'success');
        } else {
            await API.createIncomeSource(formData);
            showNotification('Income source added successfully!', 'success');
        }
        
        hideModal('income-modal');
        loadIncomeOverview();
    } catch (error) {
        console.error('Error saving income source:', error);
        showNotification(error.message || 'Failed to save income source', 'error');
    }
}

/**
 * Edit income source
 */
export function editIncome(incomeId) {
    showIncomeModal(incomeId);
}

/**
 * Delete income source
 */
export async function deleteIncome(incomeId) {
    if (!confirm('Are you sure you want to delete this income source?')) {
        return;
    }
    
    try {
        await API.deleteIncomeSource(incomeId);
        showNotification('Income source deleted successfully', 'success');
        loadIncomeSources();
    } catch (error) {
        console.error('Error deleting income source:', error);
        showNotification('Failed to delete income source', 'error');
    }
}

/**
 * Setup real-time net income calculator
 */
function setupNetIncomeCalculator() {
    const fields = [
        'income-amount',
        'income-federal-tax',
        'income-state-tax',
        'income-social-security',
        'income-medicare',
        'income-other-deductions'
    ];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.removeEventListener('input', updateNetIncomePreview); // Remove old listener
            field.addEventListener('input', updateNetIncomePreview);
        }
    });
}

/**
 * Update net income preview in real-time
 */
function updateNetIncomePreview() {
    const amount = parseFloat(document.getElementById('income-amount')?.value) || 0;
    const federalTax = parseFloat(document.getElementById('income-federal-tax')?.value) || 0;
    const stateTax = parseFloat(document.getElementById('income-state-tax')?.value) || 0;
    const socialSecurity = parseFloat(document.getElementById('income-social-security')?.value) || 6.2;
    const medicare = parseFloat(document.getElementById('income-medicare')?.value) || 1.45;
    const otherDeductions = parseFloat(document.getElementById('income-other-deductions')?.value) || 0;
    
    // Calculate tax amounts
    const federalAmount = (amount * federalTax) / 100;
    const stateAmount = (amount * stateTax) / 100;
    const socialSecurityAmount = (amount * socialSecurity) / 100;
    const medicareAmount = (amount * medicare) / 100;
    
    // Calculate net income
    const netIncome = amount - federalAmount - stateAmount - socialSecurityAmount - medicareAmount - otherDeductions;
    
    // Update the preview display
    const previewElement = document.getElementById('income-net-preview');
    if (previewElement) {
        previewElement.textContent = formatCurrency(netIncome);
        
        // Add visual indicator if net is significantly different from gross
        const deductionPercent = ((amount - netIncome) / amount) * 100;
        if (deductionPercent > 30) {
            previewElement.style.color = '#ff6b6b';
        } else if (deductionPercent > 20) {
            previewElement.style.color = '#ffa500';
        } else {
            previewElement.style.color = '#51cf66';
        }
    }
}

/**
 * Load Variable Income sub-tab
 */
async function loadVariableIncome() {
    console.log('Loading variable income analysis...');
    showLoading('variable-income-container', 'Loading variable income analysis...');
    
    try {
        const sources = await API.getIncomeSources();
        const variableSources = sources.filter(s => s.is_variable);
        
        if (variableSources.length === 0) {
            showEmptyState(
                'variable-income-container',
                '📊',
                'No variable income sources found. Variable income sources like freelance or investment income will appear here.',
                { text: 'Learn More', action: 'BudgetApp.modules.Income.showVariableIncomeInfo()' }
            );
            return;
        }
        
        let html = `
            <div class="variable-income-header">
                <h3>💼 Variable Income Analysis</h3>
                <p class="section-description">
                    Track and analyze income that varies month-to-month, such as freelance work, commissions, or investments.
                    Understanding your variable income patterns helps you budget more effectively.
                </p>
            </div>
            <div class="variable-income-grid">
        `;
        
        for (const source of variableSources) {
            const analysis = await API.getVariableIncomeAnalysis(source.id);
            html += renderVariableIncomeCard(source, analysis);
        }
        
        html += '</div>';
        document.getElementById('variable-income-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading variable income:', error);
        showError('variable-income-container', 'Failed to load variable income analysis');
    }
}

/**
 * Render variable income card
 */
function renderVariableIncomeCard(source, data) {
    if (!data || !data.success) return '';
    
    // Handle case when there's no data yet
    if (!data.has_data) {
        return `
            <div class="variable-income-card no-data">
                <div class="card-header">
                    <h4>${source.name}</h4>
                    <span class="income-type-badge">${getIncomeTypeIcon(source.type)} ${source.type}</span>
                </div>
                <div class="no-data-message">
                    <p>📊 No payment history yet</p>
                    <small>Record payments to see analysis and trends</small>
                </div>
                <button class="btn-small btn-secondary" onclick="BudgetApp.modules.Income.editIncome('${source.id}')">
                    Record Payment
                </button>
            </div>
        `;
    }
    
    const stats = data.statistics || {};
    const stability = data.stability || {};
    const trend = data.trend || {};
    const currentMonth = data.current_month || {};
    
    // Determine stability class for styling
    let stabilityClass = 'stable';
    let stabilityColor = '#22c55e';
    if (stability.level === 'Moderately Variable') {
        stabilityClass = 'moderate';
        stabilityColor = '#f59e0b';
    } else if (stability.level === 'Highly Variable') {
        stabilityClass = 'highly-variable';
        stabilityColor = '#ef4444';
    }
    
    return `
        <div class="variable-income-card ${stabilityClass}">
            <div class="card-header">
                <div class="header-left">
                    <h4>${source.name}</h4>
                    <span class="income-type-badge">${getIncomeTypeIcon(source.type)} ${source.type}</span>
                </div>
                <div class="stability-indicator" style="color: ${stabilityColor};">
                    <span class="stability-icon">${stability.icon || '✓'}</span>
                    <span class="stability-label">${stability.level || 'Stable'}</span>
                </div>
            </div>
            
            <div class="card-stats-grid">
                <div class="stat-box">
                    <label>Average Monthly</label>
                    <strong class="amount-large">${formatCurrency(stats.average_monthly || 0)}</strong>
                    <small class="stat-note">Based on ${data.months_tracked || 0} months</small>
                </div>
                <div class="stat-box">
                    <label>Variability</label>
                    <strong class="variability">${(stats.coefficient_of_variation || 0).toFixed(1)}%</strong>
                    <small class="stat-note">Lower is more stable</small>
                </div>
                <div class="stat-box">
                    <label>Range</label>
                    <strong class="range-display">
                        ${formatCurrency(stats.minimum_monthly || 0)} - ${formatCurrency(stats.maximum_monthly || 0)}
                    </strong>
                    <small class="stat-note">Min to Max</small>
                </div>
                <div class="stat-box trend-box">
                    <label>Trend</label>
                    <strong class="trend-indicator ${trend.direction?.toLowerCase() || ''}">
                        ${trend.icon || '→'} ${trend.direction || 'Stable'}
                    </strong>
                    <small class="stat-note">${trend.percent_change > 0 ? '+' : ''}${(trend.percent_change || 0).toFixed(1)}%</small>
                </div>
            </div>
            
            <div class="current-month-highlight">
                <div class="highlight-header">
                    <span>📅 Current Month</span>
                    <strong>${formatCurrency(currentMonth.total || 0)}</strong>
                </div>
                <div class="vs-average">
                    <span class="${currentMonth.vs_average_percent >= 0 ? 'positive' : 'negative'}">
                        ${currentMonth.vs_average_percent >= 0 ? '▲' : '▼'} 
                        ${Math.abs(currentMonth.vs_average_percent || 0).toFixed(1)}% vs average
                    </span>
                </div>
            </div>
            
            <button class="btn-primary btn-analyze" onclick="BudgetApp.modules.Income.showVariableAnalysis(${source.id})">
                📊 View Detailed Analysis
            </button>
        </div>
    `;
}

/**
 * Show variable income analysis modal with comprehensive details
 */
export async function showVariableAnalysis(incomeId) {
    try {
        showLoading('modal-container', 'Loading detailed analysis...');
        
        const data = await API.getVariableIncomeAnalysis(incomeId);
        
        if (!data.success || !data.has_data) {
            showNotification('Not enough data for detailed analysis. Record more payments first.', 'info');
            return;
        }
        
        const stats = data.statistics || {};
        const stability = data.stability || {};
        const trend = data.trend || {};
        const currentMonth = data.current_month || {};
        const forecast = data.forecast || {};
        const monthlyBreakdown = data.monthly_breakdown || [];
        const recommendations = data.recommendations || [];
        
        const modalHTML = `
            <div id="variable-analysis-modal" class="modal active">
                <div class="modal-content modal-xl">
                    <div class="modal-header">
                        <h3>📊 Variable Income Analysis: ${data.income_name}</h3>
                        <button class="modal-close" onclick="BudgetApp.modules.Income.closeVariableAnalysis()">&times;</button>
                    </div>
                    
                    <div class="modal-body variable-analysis-body">
                        <!-- Summary Banner -->
                        <div class="analysis-summary-banner" style="background: linear-gradient(135deg, ${stability.color === 'green' ? '#22c55e' : stability.color === 'orange' ? '#f59e0b' : '#ef4444'} 0%, ${stability.color === 'green' ? '#16a34a' : stability.color === 'orange' ? '#d97706' : '#dc2626'} 100%);">
                            <div class="summary-main">
                                <div class="summary-icon">${stability.icon || '📊'}</div>
                                <div class="summary-text">
                                    <h4>${stability.level || 'Analysis'}</h4>
                                    <p>${stability.description || 'Income stability assessment'}</p>
                                </div>
                            </div>
                            <div class="summary-stats">
                                <div class="summary-stat">
                                    <label>Tracked</label>
                                    <strong>${data.months_tracked || 0} months</strong>
                                </div>
                                <div class="summary-stat">
                                    <label>Payments</label>
                                    <strong>${data.payment_count || 0}</strong>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Key Statistics -->
                        <div class="analysis-section">
                            <h4>📈 Monthly Statistics</h4>
                            <div class="stats-grid-detailed">
                                <div class="stat-card">
                                    <div class="stat-icon">📊</div>
                                    <label>Average</label>
                                    <strong>${formatCurrency(stats.average_monthly || 0)}</strong>
                                    <small>Most likely monthly income</small>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">📍</div>
                                    <label>Median</label>
                                    <strong>${formatCurrency(stats.median_monthly || 0)}</strong>
                                    <small>Middle point of your income</small>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">📉</div>
                                    <label>Minimum</label>
                                    <strong>${formatCurrency(stats.minimum_monthly || 0)}</strong>
                                    <small>Lowest month recorded</small>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">📈</div>
                                    <label>Maximum</label>
                                    <strong>${formatCurrency(stats.maximum_monthly || 0)}</strong>
                                    <small>Highest month recorded</small>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Trend Analysis -->
                        <div class="analysis-section">
                            <h4>${trend.icon || '📊'} Trend Analysis</h4>
                            <div class="trend-analysis-box">
                                <div class="trend-indicator-large ${trend.direction?.toLowerCase() || ''}">
                                    <span class="trend-icon-large">${trend.icon || '→'}</span>
                                    <div class="trend-text">
                                        <strong>${trend.direction || 'Stable'}</strong>
                                        <p>${trend.description || 'No significant trend detected'}</p>
                                    </div>
                                    <div class="trend-percent">
                                        ${trend.percent_change !== 0 ? `<span class="${trend.percent_change > 0 ? 'positive' : 'negative'}">${trend.percent_change > 0 ? '+' : ''}${(trend.percent_change || 0).toFixed(1)}%</span>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Current Month vs Average -->
                        <div class="analysis-section">
                            <h4>📅 Current Month Performance</h4>
                            <div class="current-month-analysis">
                                <div class="month-comparison">
                                    <div class="comparison-bar">
                                        <div class="bar-label">Current Month</div>
                                        <div class="bar-visual">
                                            <div class="bar-fill current" style="width: ${Math.min((currentMonth.total / stats.maximum_monthly) * 100, 100)}%"></div>
                                            <span class="bar-amount">${formatCurrency(currentMonth.total || 0)}</span>
                                        </div>
                                    </div>
                                    <div class="comparison-bar">
                                        <div class="bar-label">Average Month</div>
                                        <div class="bar-visual">
                                            <div class="bar-fill average" style="width: ${Math.min((stats.average_monthly / stats.maximum_monthly) * 100, 100)}%"></div>
                                            <span class="bar-amount">${formatCurrency(stats.average_monthly || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="comparison-summary">
                                    <p class="${currentMonth.vs_average >= 0 ? 'positive' : 'negative'}">
                                        ${currentMonth.vs_average >= 0 ? '⬆️' : '⬇️'}
                                        <strong>${formatCurrency(Math.abs(currentMonth.vs_average || 0))}</strong>
                                        ${currentMonth.vs_average >= 0 ? 'above' : 'below'} your average
                                        (${Math.abs(currentMonth.vs_average_percent || 0).toFixed(1)}%)
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Next Month Forecast -->
                        <div class="analysis-section">
                            <h4>🔮 Next Month Forecast</h4>
                            <div class="forecast-grid">
                                <div class="forecast-card conservative">
                                    <label>Conservative</label>
                                    <strong>${formatCurrency(forecast.conservative_estimate || 0)}</strong>
                                    <small>Based on your minimum</small>
                                </div>
                                <div class="forecast-card expected">
                                    <label>Expected</label>
                                    <strong>${formatCurrency(forecast.next_month || 0)}</strong>
                                    <small>Based on recent average</small>
                                </div>
                                <div class="forecast-card optimistic">
                                    <label>Optimistic</label>
                                    <strong>${formatCurrency(forecast.optimistic_estimate || 0)}</strong>
                                    <small>Based on your maximum</small>
                                </div>
                            </div>
                            <p class="forecast-note">
                                💡 <strong>Budgeting Tip:</strong> For variable income, budget based on your conservative estimate 
                                (${formatCurrency(forecast.conservative_estimate || 0)}) to avoid overspending.
                            </p>
                        </div>
                        
                        <!-- 12-Month Chart -->
                        <div class="analysis-section">
                            <h4>📊 12-Month Income History</h4>
                            <div class="chart-container">
                                <canvas id="variable-income-chart" height="80"></canvas>
                            </div>
                        </div>
                        
                        <!-- Personalized Recommendations -->
                        ${recommendations.length > 0 ? `
                            <div class="analysis-section">
                                <h4>💡 Personalized Recommendations</h4>
                                <div class="recommendations-list">
                                    ${recommendations.map(rec => `
                                        <div class="recommendation-card ${rec.type}">
                                            <span class="rec-icon">${rec.icon}</span>
                                            <p>${rec.message}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="BudgetApp.modules.Income.closeVariableAnalysis()">Close</button>
                        <button class="btn-primary" onclick="BudgetApp.modules.Income.editIncome(${incomeId})">Record Payment</button>
                    </div>
                </div>
            </div>
        `;
        
        // Inject modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Initialize chart after modal is in DOM
        setTimeout(() => {
            initVariableIncomeChart(monthlyBreakdown, stats.average_monthly);
        }, 100);
        
    } catch (error) {
        console.error('Error showing variable income analysis:', error);
        showNotification('Failed to load detailed analysis', 'error');
    }
}

/**
 * Initialize Chart.js chart for variable income
 */
function initVariableIncomeChart(monthlyBreakdown, average) {
    const canvas = document.getElementById('variable-income-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Prepare data
    const labels = monthlyBreakdown.map(m => m.month_short);
    const amounts = monthlyBreakdown.map(m => m.total);
    const averageLine = new Array(amounts.length).fill(average);
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        ctx.fillStyle = '#666';
        ctx.font = '16px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Chart.js not loaded - chart unavailable', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Monthly Income',
                    data: amounts,
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Average',
                    data: averageLine,
                    type: 'line',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Close variable analysis modal
 */
export function closeVariableAnalysis() {
    const modal = document.getElementById('variable-analysis-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Show variable income info modal
 */
export function showVariableIncomeInfo() {
    const infoHTML = `
        <div id="variable-info-modal" class="modal active">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📊 About Variable Income</h3>
                    <button class="modal-close" onclick="document.getElementById('variable-info-modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p><strong>Variable income</strong> is income that changes from month to month, such as:</p>
                    <ul>
                        <li>💼 Freelance or contract work</li>
                        <li>💰 Commission-based sales</li>
                        <li>📈 Investment income (dividends, capital gains)</li>
                        <li>🏠 Rental income that varies</li>
                        <li>💡 Side hustles and gig work</li>
                    </ul>
                    <p>This analysis helps you:</p>
                    <ul>
                        <li>✅ Understand your income patterns and trends</li>
                        <li>✅ Predict future income based on historical data</li>
                        <li>✅ Budget conservatively to avoid overspending</li>
                        <li>✅ Identify if your income is stable or volatile</li>
                        <li>✅ Get personalized recommendations for financial planning</li>
                    </ul>
                    <p class="info-note">
                        <strong>Tip:</strong> Income sources marked as "freelance," "investment," or "other" are 
                        automatically tracked as variable income. Record your payments regularly to get accurate insights!
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="document.getElementById('variable-info-modal').remove()">Got it!</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', infoHTML);
}

/**
 * Get income type icon
 */
function getIncomeTypeIcon(type) {
    const icons = {
        'salary': '💼',
        'freelance': '💻',
        'investment': '📈',
        'rental': '🏠',
        'other': '💰'
    };
    return icons[type] || '💵';
}

/**
 * Load Income Trends sub-tab
 */
async function loadIncomeTrends(months = 12) {
    console.log(`Loading income trends for ${months} months...`);
    showLoading('income-trends-container', 'Loading income trends...');
    
    try {
        const trends = await API.getIncomeTrends(months);
        renderIncomeTrends(trends);
    } catch (error) {
        console.error('Error loading income trends:', error);
        showError('income-trends-container', 'Failed to load income trends');
    }
}

/**
 * Render income trends with charts
 */
function renderIncomeTrends(trends) {
    const container = document.getElementById('income-trends-container');
    if (!container) return;
    
    // Check if we have data
    if (!trends || !trends.success) {
        showError('income-trends-container', 'Failed to load income trends data');
        return;
    }
    
    // Check for empty data
    if (!trends.statistics || trends.statistics.months_with_income === 0) {
        showEmptyState(
            'income-trends-container',
            '📈',
            'No income data available yet',
            'Add income sources and record payments to see trends and charts.'
        );
        return;
    }
    
    const isDarkMode = document.querySelector('.app')?.getAttribute('data-theme') === 'dark';
    const textColor = isDarkMode ? '#ffffff' : '#333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
    
    // Build the HTML
    let html = `
        <div class="income-trends-header">
            <div>
                <h3>📈 Income Trends</h3>
                <p class="sub-description">Analyze your income patterns over time</p>
            </div>
            <div class="period-selector">
                <label>Period:</label>
                <select id="trends-period-selector" class="period-select">
                    <option value="6" ${trends.period.months === 6 ? 'selected' : ''}>Last 6 Months</option>
                    <option value="12" ${trends.period.months === 12 ? 'selected' : ''}>Last 12 Months</option>
                    <option value="24" ${trends.period.months === 24 ? 'selected' : ''}>Last 24 Months</option>
                </select>
            </div>
        </div>
        
        <!-- Statistics Summary -->
        <div class="trends-stats-grid">
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                    <label>Average Monthly</label>
                    <strong>${formatCurrency(trends.statistics.average)}</strong>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📈</div>
                <div class="stat-content">
                    <label>Highest Month</label>
                    <strong>${formatCurrency(trends.statistics.max)}</strong>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📉</div>
                <div class="stat-content">
                    <label>Lowest Month</label>
                    <strong>${formatCurrency(trends.statistics.min)}</strong>
                </div>
            </div>
            <div class="stat-card trend-${trends.statistics.trend}">
                <div class="stat-icon">
                    ${trends.statistics.trend === 'increasing' ? '⬆️' : 
                      trends.statistics.trend === 'decreasing' ? '⬇️' : '➡️'}
                </div>
                <div class="stat-content">
                    <label>Trend</label>
                    <strong>${trends.statistics.trend.charAt(0).toUpperCase() + trends.statistics.trend.slice(1)}</strong>
                </div>
            </div>
        </div>
        
        <!-- Total Income Over Time Chart -->
        <div class="chart-section">
            <h4>Total Income Over Time</h4>
            <div class="chart-container">
                <canvas id="total-income-chart"></canvas>
            </div>
        </div>
        
        <!-- Income by Source Chart -->
        <div class="chart-section">
            <h4>Income by Source</h4>
            <div class="chart-container">
                <canvas id="income-by-source-chart"></canvas>
            </div>
        </div>
        
        <!-- Income by Earner Chart -->
        <div class="chart-section">
            <h4>Income by Household Member</h4>
            <div class="chart-container">
                <canvas id="income-by-earner-chart"></canvas>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Add event listener for period selector
    const periodSelector = document.getElementById('trends-period-selector');
    if (periodSelector) {
        periodSelector.addEventListener('change', async (e) => {
            const months = parseInt(e.target.value);
            await loadIncomeTrends(months);
        });
    }
    
    // Render charts after DOM is updated
    setTimeout(() => {
        // Set Chart.js defaults for better dark mode support
        if (typeof Chart !== 'undefined' && Chart.defaults) {
            Chart.defaults.color = textColor;
            Chart.defaults.borderColor = gridColor;
        }
        
        renderTotalIncomeChart(trends.total_income, textColor, gridColor);
        renderIncomeBySourceChart(trends.by_source, textColor, gridColor);
        renderIncomeByEarnerChart(trends.by_earner, textColor, gridColor);
    }, 0);
}

/**
 * Render total income over time chart
 */
function renderTotalIncomeChart(data, textColor, gridColor) {
    const canvas = document.getElementById('total-income-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.totalIncomeChart) {
        window.totalIncomeChart.destroy();
    }
    
    const isDarkMode = document.querySelector('.app')?.getAttribute('data-theme') === 'dark';
    console.log('Chart colors - Dark mode:', isDarkMode, 'Text color:', textColor, 'Grid color:', gridColor);
    
    window.totalIncomeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Total Income',
                data: data.data,
                borderColor: '#4CAF50',
                backgroundColor: isDarkMode 
                    ? 'rgba(76, 175, 80, 0.2)'
                    : 'rgba(76, 175, 80, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#4CAF50',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return 'Income: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: isDarkMode ? '#ffffff' : '#333',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)',
                        drawBorder: true,
                        borderColor: isDarkMode ? '#ffffff' : '#333'
                    },
                    title: {
                        color: isDarkMode ? '#ffffff' : '#333'
                    }
                },
                x: {
                    ticks: {
                        color: isDarkMode ? '#ffffff' : '#333',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)',
                        drawBorder: true,
                        borderColor: isDarkMode ? '#ffffff' : '#333'
                    },
                    title: {
                        color: isDarkMode ? '#ffffff' : '#333'
                    }
                }
            }
        }
    });
}

/**
 * Render income by source stacked area chart
 */
function renderIncomeBySourceChart(data, textColor, gridColor) {
    const canvas = document.getElementById('income-by-source-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.incomeBySourceChart) {
        window.incomeBySourceChart.destroy();
    }
    
    // Check if we have datasets
    if (!data.datasets || data.datasets.length === 0) {
        canvas.parentElement.innerHTML = '<p class="empty-chart-message">No income sources to display</p>';
        return;
    }
    
    const isDarkMode = document.querySelector('.app')?.getAttribute('data-theme') === 'dark';
    
    // Color palette for different sources
    const colors = [
        { border: '#2196F3', bg: isDarkMode ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.2)' },
        { border: '#4CAF50', bg: isDarkMode ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.2)' },
        { border: '#FF9800', bg: isDarkMode ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.2)' },
        { border: '#9C27B0', bg: isDarkMode ? 'rgba(156, 39, 176, 0.3)' : 'rgba(156, 39, 176, 0.2)' },
        { border: '#F44336', bg: isDarkMode ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.2)' },
        { border: '#00BCD4', bg: isDarkMode ? 'rgba(0, 188, 212, 0.3)' : 'rgba(0, 188, 212, 0.2)' }
    ];
    
    // Apply colors to datasets
    const datasets = data.datasets.map((dataset, index) => ({
        ...dataset,
        borderColor: colors[index % colors.length].border,
        backgroundColor: colors[index % colors.length].bg,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4
    }));
    
    window.incomeBySourceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        color: isDarkMode ? '#ffffff' : '#333',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)',
                        drawBorder: true,
                        borderColor: isDarkMode ? '#ffffff' : '#333'
                    },
                    title: {
                        color: isDarkMode ? '#ffffff' : '#333'
                    }
                },
                x: {
                    stacked: true,
                    ticks: {
                        color: isDarkMode ? '#ffffff' : '#333',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)',
                        drawBorder: true,
                        borderColor: isDarkMode ? '#ffffff' : '#333'
                    },
                    title: {
                        color: isDarkMode ? '#ffffff' : '#333'
                    }
                }
            }
        }
    });
}

/**
 * Render income by earner grouped bar chart
 */
function renderIncomeByEarnerChart(data, textColor, gridColor) {
    const canvas = document.getElementById('income-by-earner-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.incomeByEarnerChart) {
        window.incomeByEarnerChart.destroy();
    }
    
    // Check if we have datasets
    if (!data.datasets || data.datasets.length === 0) {
        canvas.parentElement.innerHTML = '<p class="empty-chart-message">No earner data to display</p>';
        return;
    }
    
    const isDarkMode = document.querySelector('.app')?.getAttribute('data-theme') === 'dark';
    
    // Color palette for different earners
    const colors = [
        { border: '#2196F3', bg: isDarkMode ? 'rgba(33, 150, 243, 0.7)' : 'rgba(33, 150, 243, 0.6)' },
        { border: '#E91E63', bg: isDarkMode ? 'rgba(233, 30, 99, 0.7)' : 'rgba(233, 30, 99, 0.6)' },
        { border: '#9C27B0', bg: isDarkMode ? 'rgba(156, 39, 176, 0.7)' : 'rgba(156, 39, 176, 0.6)' },
        { border: '#FF9800', bg: isDarkMode ? 'rgba(255, 152, 0, 0.7)' : 'rgba(255, 152, 0, 0.6)' }
    ];
    
    // Apply colors to datasets
    const datasets = data.datasets.map((dataset, index) => ({
        ...dataset,
        backgroundColor: colors[index % colors.length].bg,
        borderColor: colors[index % colors.length].border,
        borderWidth: 2,
        borderRadius: 4
    }));
    
    window.incomeByEarnerChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: isDarkMode ? '#ffffff' : '#333',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)',
                        drawBorder: true,
                        borderColor: isDarkMode ? '#ffffff' : '#333'
                    },
                    title: {
                        color: isDarkMode ? '#ffffff' : '#333'
                    }
                },
                x: {
                    ticks: {
                        color: isDarkMode ? '#ffffff' : '#333',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)',
                        drawBorder: true,
                        borderColor: isDarkMode ? '#ffffff' : '#333'
                    },
                    title: {
                        color: isDarkMode ? '#ffffff' : '#333'
                    }
                }
            }
        }
    });
}

/**
 * Load Year-over-Year sub-tab
 */
async function loadYearOverYear() {
    console.log('Loading year-over-year comparison...');
    showLoading('year-over-year-container', 'Loading year-over-year data...');
    
    try {
        const yoyData = await API.getIncomeYearOverYear();
        renderYearOverYear(yoyData);
    } catch (error) {
        console.error('Error loading year-over-year:', error);
        showError('year-over-year-container', 'Failed to load year-over-year comparison');
    }
}

/**
 * Render year-over-year comparison
 */
function renderYearOverYear(data) {
    const container = document.getElementById('year-over-year-container');
    if (!container) return;
    
    if (!data || !data.has_data || !data.years || data.years.length === 0) {
        showEmptyState(
            'year-over-year-container',
            '📅',
            'Not Enough Historical Data',
            'Add income payments spanning multiple years to see year-over-year comparisons. This feature helps you track income growth and identify trends over time.'
        );
        return;
    }
    
    const stats = data.statistics || {};
    const years = data.years || [];
    
    // Build comprehensive year-over-year UI
    let html = `
        <div class="yoy-header">
            <h3>📊 Year-over-Year Income Comparison</h3>
            <p class="yoy-subtitle">Compare your income across different years to identify growth trends and patterns</p>
        </div>
        
        <!-- Overall Statistics Banner -->
        <div class="yoy-stats-banner">
            <div class="yoy-stat-card">
                <div class="stat-icon">📆</div>
                <div class="stat-content">
                    <div class="stat-label">Years of Data</div>
                    <div class="stat-value">${stats.total_years || 0}</div>
                    <div class="stat-detail">${stats.earliest_year || 'N/A'} - ${stats.latest_year || 'N/A'}</div>
                </div>
            </div>
            <div class="yoy-stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-content">
                    <div class="stat-label">Total All Years</div>
                    <div class="stat-value">${formatCurrency(stats.total_all_years || 0)}</div>
                    <div class="stat-detail">Cumulative earnings</div>
                </div>
            </div>
            <div class="yoy-stat-card">
                <div class="stat-icon">📈</div>
                <div class="stat-content">
                    <div class="stat-label">Average Per Year</div>
                    <div class="stat-value">${formatCurrency(stats.average_per_year || 0)}</div>
                    <div class="stat-detail">${formatCurrency((stats.average_per_year || 0) / 12)}/month</div>
                </div>
            </div>
            <div class="yoy-stat-card trend-${stats.overall_trend || 'stable'}">
                <div class="stat-icon">${stats.overall_trend === 'increasing' ? '📈' : stats.overall_trend === 'decreasing' ? '📉' : '➡️'}</div>
                <div class="stat-content">
                    <div class="stat-label">Overall Trend</div>
                    <div class="stat-value">${(stats.overall_trend || 'stable').charAt(0).toUpperCase() + (stats.overall_trend || 'stable').slice(1)}</div>
                    <div class="stat-detail">${years.length >= 2 ? `${stats.earliest_year} to ${stats.latest_year}` : 'Need more years'}</div>
                </div>
            </div>
        </div>
        
        <!-- Individual Year Cards -->
        <div class="yoy-years-section">
            <h4 class="section-title">📅 Year-by-Year Breakdown</h4>
            <div class="yoy-year-cards">
    `;
    
    // Render each year card
    years.forEach((year, index) => {
        const changeFromPrev = year.change_from_previous || {};
        const hasChange = changeFromPrev.amount !== undefined;
        const changeClass = hasChange ? 
            (changeFromPrev.direction === 'increase' ? 'positive' : 
             changeFromPrev.direction === 'decrease' ? 'negative' : 'neutral') : '';
        
        html += `
            <div class="yoy-year-card">
                <div class="year-card-header">
                    <h4 class="year-title">${year.year}</h4>
                    ${hasChange ? `
                        <div class="year-badge ${changeClass}">
                            ${changeFromPrev.direction === 'increase' ? '↗️' : changeFromPrev.direction === 'decrease' ? '↘️' : '➡️'}
                            ${changeFromPrev.percent > 0 ? '+' : ''}${changeFromPrev.percent.toFixed(1)}%
                        </div>
                    ` : `
                        <div class="year-badge baseline">Baseline</div>
                    `}
                </div>
                
                <div class="year-card-body">
                    <!-- Main Stats -->
                    <div class="year-main-stats">
                        <div class="main-stat">
                            <div class="main-stat-label">Total Income</div>
                            <div class="main-stat-value">${formatCurrency(year.total)}</div>
                            ${hasChange ? `
                                <div class="main-stat-change ${changeClass}">
                                    ${changeFromPrev.amount > 0 ? '+' : ''}${formatCurrency(changeFromPrev.amount)} vs ${year.year - 1}
                                </div>
                            ` : ''}
                        </div>
                        <div class="main-stat">
                            <div class="main-stat-label">Monthly Average</div>
                            <div class="main-stat-value">${formatCurrency(year.monthly_average)}</div>
                            <div class="main-stat-detail">${year.months_with_income} months with income</div>
                        </div>
                        <div class="main-stat">
                            <div class="main-stat-label">Payment Count</div>
                            <div class="main-stat-value">${year.payment_count}</div>
                            <div class="main-stat-detail">${(year.payment_count / year.months_with_income).toFixed(1)} per month</div>
                        </div>
                    </div>
                    
                    <!-- Top Income Sources -->
                    ${year.top_sources && year.top_sources.length > 0 ? `
                        <div class="year-top-sources">
                            <div class="sources-header">
                                <span class="sources-title">💼 Top Income Sources</span>
                            </div>
                            <div class="sources-list">
                                ${year.top_sources.map(source => `
                                    <div class="source-item">
                                        <div class="source-info">
                                            <span class="source-name">${source.name}</span>
                                            <span class="source-amount">${formatCurrency(source.amount)}</span>
                                        </div>
                                        <div class="source-bar">
                                            <div class="source-bar-fill" style="width: ${(source.amount / year.total * 100).toFixed(1)}%"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- View Details Button -->
                    <button class="btn-view-year-details" onclick="BudgetApp.modules.Income.showYearDetails(${year.year}, ${index})">
                        📊 View Monthly Breakdown
                    </button>
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
        
        <!-- Annual Comparison Charts Section -->
        <div class="yoy-charts-section">
            <h4 class="section-title">📊 Visual Comparisons</h4>
            
            <!-- Annual Total Comparison Chart -->
            <div class="chart-card">
                <div class="chart-header">
                    <h5>💰 Annual Income Comparison</h5>
                    <p class="chart-description">Total income earned each year</p>
                </div>
                <div class="chart-container">
                    <canvas id="yoy-annual-chart"></canvas>
                </div>
            </div>
            
            <!-- Monthly Pattern Comparison Chart -->
            <div class="chart-card">
                <div class="chart-header">
                    <h5>📅 Monthly Income Patterns</h5>
                    <p class="chart-description">Compare how income flows throughout the year</p>
                </div>
                <div class="chart-container">
                    <canvas id="yoy-monthly-chart"></canvas>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Render charts after DOM is updated
    setTimeout(() => {
        renderYearOverYearCharts(data);
    }, 100);
}

/**
 * Render year-over-year comparison charts
 */
function renderYearOverYearCharts(data) {
    if (!data || !data.years || data.years.length === 0) return;
    
    const years = data.years;
    
    // Annual Total Comparison Bar Chart
    const annualChartCanvas = document.getElementById('yoy-annual-chart');
    if (annualChartCanvas) {
        const ctx = annualChartCanvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (window.yoyAnnualChart) {
            window.yoyAnnualChart.destroy();
        }
        
        const chartData = {
            labels: years.map(y => y.year.toString()),
            datasets: [{
                label: 'Total Annual Income',
                data: years.map(y => y.total),
                backgroundColor: years.map((y, i) => {
                    if (i === 0) return 'rgba(59, 130, 246, 0.8)'; // Latest year - blue
                    const change = y.change_from_previous;
                    if (!change) return 'rgba(107, 114, 128, 0.6)';
                    if (change.direction === 'increase') return 'rgba(34, 197, 94, 0.6)'; // Green
                    if (change.direction === 'decrease') return 'rgba(239, 68, 68, 0.6)'; // Red
                    return 'rgba(107, 114, 128, 0.6)'; // Gray
                }),
                borderColor: years.map((y, i) => {
                    if (i === 0) return 'rgba(59, 130, 246, 1)';
                    const change = y.change_from_previous;
                    if (!change) return 'rgba(107, 114, 128, 1)';
                    if (change.direction === 'increase') return 'rgba(34, 197, 94, 1)';
                    if (change.direction === 'decrease') return 'rgba(239, 68, 68, 1)';
                    return 'rgba(107, 114, 128, 1)';
                }),
                borderWidth: 2
            }]
        };
        
        window.yoyAnnualChart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.5,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const year = years[context.dataIndex];
                                const lines = [
                                    `Total: ${formatCurrency(context.parsed.y)}`,
                                    `Monthly Avg: ${formatCurrency(year.monthly_average)}`,
                                    `Payments: ${year.payment_count}`
                                ];
                                if (year.change_from_previous) {
                                    const change = year.change_from_previous;
                                    lines.push(`vs Previous: ${change.percent > 0 ? '+' : ''}${change.percent.toFixed(1)}%`);
                                }
                                return lines;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000).toFixed(0) + 'k';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Monthly Pattern Comparison Line Chart
    const monthlyChartCanvas = document.getElementById('yoy-monthly-chart');
    if (monthlyChartCanvas) {
        const ctx = monthlyChartCanvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (window.yoyMonthlyChart) {
            window.yoyMonthlyChart.destroy();
        }
        
        // Prepare monthly data for each year
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const colors = [
            'rgba(59, 130, 246, 0.8)',   // Blue
            'rgba(34, 197, 94, 0.8)',    // Green
            'rgba(168, 85, 247, 0.8)',   // Purple
            'rgba(251, 146, 60, 0.8)',   // Orange
            'rgba(236, 72, 153, 0.8)',   // Pink
            'rgba(14, 165, 233, 0.8)',   // Sky
            'rgba(245, 158, 11, 0.8)',   // Amber
            'rgba(139, 92, 246, 0.8)'    // Violet
        ];
        
        const datasets = years.map((year, index) => {
            const monthlyData = year.by_month || {};
            const data = monthNames.map((_, monthNum) => monthlyData[monthNum + 1] || 0);
            
            return {
                label: year.year.toString(),
                data: data,
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length].replace('0.8', '0.1'),
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
            };
        });
        
        window.yoyMonthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthNames,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.5,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000).toFixed(0) + 'k';
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }
}

/**
 * Show detailed year breakdown modal
 */
export async function showYearDetails(year, yearIndex) {
    try {
        // Fetch fresh data to ensure we have the most recent information
        const yoyData = await API.getIncomeYearOverYear();
        const yearData = yoyData.years[yearIndex];
        
        if (!yearData) {
            showNotification('Year data not found', 'error');
            return;
        }
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const monthlyData = yearData.by_month || {};
        
        let modalHTML = `
            <div class="modal-header">
                <h3>📊 ${year} Detailed Breakdown</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body year-details-modal">
                <!-- Summary Stats -->
                <div class="year-details-summary">
                    <div class="summary-stat">
                        <div class="stat-label">Total Income</div>
                        <div class="stat-value">${formatCurrency(yearData.total)}</div>
                    </div>
                    <div class="summary-stat">
                        <div class="stat-label">Monthly Average</div>
                        <div class="stat-value">${formatCurrency(yearData.monthly_average)}</div>
                    </div>
                    <div class="summary-stat">
                        <div class="stat-label">Months Active</div>
                        <div class="stat-value">${yearData.months_with_income}</div>
                    </div>
                    <div class="summary-stat">
                        <div class="stat-label">Total Payments</div>
                        <div class="stat-value">${yearData.payment_count}</div>
                    </div>
                </div>
                
                ${yearData.change_from_previous ? `
                    <div class="year-comparison-info ${yearData.change_from_previous.direction}">
                        <div class="comparison-icon">
                            ${yearData.change_from_previous.direction === 'increase' ? '📈' : 
                              yearData.change_from_previous.direction === 'decrease' ? '📉' : '➡️'}
                        </div>
                        <div class="comparison-text">
                            <strong>${yearData.change_from_previous.direction === 'increase' ? 'Income Increased' : 
                                     yearData.change_from_previous.direction === 'decrease' ? 'Income Decreased' : 'Income Stable'}</strong>
                            <span>
                                ${yearData.change_from_previous.amount > 0 ? '+' : ''}${formatCurrency(yearData.change_from_previous.amount)} 
                                (${yearData.change_from_previous.percent > 0 ? '+' : ''}${yearData.change_from_previous.percent.toFixed(1)}%) 
                                compared to ${year - 1}
                            </span>
                        </div>
                    </div>
                ` : ''}
                
                <!-- Monthly Timeline -->
                <div class="monthly-timeline-section">
                    <h4>📅 Monthly Breakdown</h4>
                    <div class="monthly-timeline">
                        ${monthNames.map((monthName, index) => {
                            const monthNum = index + 1;
                            const amount = monthlyData[monthNum] || 0;
                            const hasIncome = amount > 0;
                            const maxMonthly = Math.max(...Object.values(monthlyData));
                            const barWidth = maxMonthly > 0 ? (amount / maxMonthly * 100) : 0;
                            
                            return `
                                <div class="timeline-month ${hasIncome ? 'has-income' : 'no-income'}">
                                    <div class="month-label">${monthName}</div>
                                    <div class="month-bar-container">
                                        <div class="month-bar" style="width: ${barWidth}%"></div>
                                    </div>
                                    <div class="month-amount">${hasIncome ? formatCurrency(amount) : 'No income'}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <!-- Income Sources Breakdown -->
                ${yearData.top_sources && yearData.top_sources.length > 0 ? `
                    <div class="sources-breakdown-section">
                        <h4>💼 Income Sources for ${year}</h4>
                        <div class="sources-breakdown-list">
                            ${yearData.top_sources.map((source, idx) => `
                                <div class="source-breakdown-item">
                                    <div class="source-rank">#${idx + 1}</div>
                                    <div class="source-details">
                                        <div class="source-name">${source.name}</div>
                                        <div class="source-stats">
                                            <span class="source-amount">${formatCurrency(source.amount)}</span>
                                            <span class="source-percent">${(source.amount / yearData.total * 100).toFixed(1)}% of total</span>
                                        </div>
                                    </div>
                                    <div class="source-visual-bar">
                                        <div class="source-visual-fill" style="width: ${(source.amount / yearData.total * 100).toFixed(1)}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <!-- By Earner Breakdown -->
                ${yearData.by_earner && Object.keys(yearData.by_earner).length > 0 ? `
                    <div class="earners-breakdown-section">
                        <h4>👥 Income by Household Member</h4>
                        <div class="earners-breakdown-list">
                            ${Object.entries(yearData.by_earner)
                                .sort((a, b) => b[1] - a[1])
                                .map(([earner, amount]) => `
                                    <div class="earner-breakdown-item">
                                        <div class="earner-info">
                                            <span class="earner-name">${earner}</span>
                                            <span class="earner-amount">${formatCurrency(amount)}</span>
                                        </div>
                                        <div class="earner-bar">
                                            <div class="earner-bar-fill" style="width: ${(amount / yearData.total * 100).toFixed(1)}%"></div>
                                        </div>
                                        <span class="earner-percent">${(amount / yearData.total * 100).toFixed(1)}%</span>
                                    </div>
                                `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        showModal('year-details-modal', modalHTML);
    } catch (error) {
        console.error('Error loading year details:', error);
        showNotification('Failed to load year details', 'error');
    }
}

/**
 * Load Tax Estimator sub-tab
 */
async function loadTaxEstimator() {
    console.log('Loading tax estimator...');
    const container = document.getElementById('tax-estimator-container');
    if (!container) {
        console.error('Tax estimator container not found');
        return;
    }
    
    try {
        // Import and initialize the tax estimator module
        const TaxEstimator = await import('./tax-estimator.js');
        TaxEstimator.initTaxEstimator();
    } catch (error) {
        console.error('Error loading tax estimator module:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <h3>Error Loading Tax Estimator</h3>
                <p>Unable to load the tax estimator module. Please refresh the app.</p>
                <pre>${error.message}</pre>
            </div>
        `;
    }
}

/**
 * Load Retirement sub-tab
 */
async function loadRetirement() {
    console.log('Loading retirement accounts...');
    // Initialize the retirement module which will handle all loading and display
    Retirement.initRetirement();
}
