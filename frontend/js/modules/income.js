// Income Management Module
import * as API from '../api.js';
import { formatCurrency, showNotification, calculateMonthlyAmount } from '../utils.js';
import { showLoading, showError, showModal, hideModal, showEmptyState } from '../ui.js';
import { injectTab, injectModal } from '../templates.js';

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
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="income-modal-title">Add Income Source</h3>
                <button class="modal-close" id="close-income-modal">&times;</button>
            </div>
            <form id="income-form">
                <div class="form-group">
                    <label for="income-name">Income Name</label>
                    <input type="text" id="income-name" placeholder="e.g., Main Job, Side Hustle" required>
                </div>
                <div class="form-group">
                    <label for="income-type">Income Type</label>
                    <select id="income-type" required>
                        <option value="">Select type...</option>
                        <option value="salary">💼 Salary/Wages</option>
                        <option value="freelance">💻 Freelance</option>
                        <option value="business">🏢 Business Income</option>
                        <option value="rental">🏠 Rental Income</option>
                        <option value="investment">📈 Investment Income</option>
                        <option value="pension">👴 Pension/Retirement</option>
                        <option value="other">💵 Other Income</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="income-amount">Amount</label>
                    <input type="number" id="income-amount" placeholder="0.00" step="0.01" required>
                </div>
                <div class="form-group">
                    <label for="income-frequency">Payment Frequency</label>
                    <select id="income-frequency" required>
                        <option value="">Select frequency...</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-weekly (every 2 weeks)</option>
                        <option value="semimonthly">Semi-monthly (twice a month)</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annual">Annual</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" id="cancel-income-btn">Cancel</button>
                    <button type="submit" class="btn-primary" id="save-income-btn">Save Income</button>
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
        addRetirementBtn.addEventListener('click', () => showRetirementModal());
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
                    <div class="income-amount">
                        <label>Expected Amount</label>
                        <span>${formatCurrency(source.amount)}</span>
                    </div>
                    <div class="income-frequency">
                        <label>Frequency</label>
                        <span>${formatFrequency(source.frequency)}</span>
                    </div>
                    <div class="income-monthly">
                        <label>Monthly Equivalent</label>
                        <span>${formatCurrency(monthlyAmount)}/mo</span>
                    </div>
                    ${source.next_pay_date ? `
                        <div class="income-next-pay">
                            <label>Next Payment</label>
                            <span>📅 ${formatDate(source.next_pay_date)}</span>
                        </div>
                    ` : ''}
                    ${paymentCount > 0 ? `
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
        salary: '💼',
        freelance: '💻',
        business: '🏢',
        rental: '🏠',
        investment: '📈',
        pension: '👴',
        other: '💵'
    };
    return icons[type] || '💵';
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
    }
    
    showModal('income-modal');
}

/**
 * Load income data for editing
 */
async function loadIncomeData(incomeId) {
    try {
        const income = await API.getIncomeSource(incomeId);
        
        // Populate form fields
        document.getElementById('income-name').value = income.name || '';
        document.getElementById('income-type').value = income.type || '';
        document.getElementById('income-amount').value = income.amount || '';
        document.getElementById('income-frequency').value = income.frequency || '';
        // ... populate other fields
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
    
    const formData = {
        name: document.getElementById('income-name').value,
        type: document.getElementById('income-type').value,
        amount: parseFloat(document.getElementById('income-amount').value),
        frequency: document.getElementById('income-frequency').value,
        // ... other fields
    };
    
    try {
        if (currentEditIncomeId) {
            await API.updateIncomeSource(currentEditIncomeId, formData);
            showNotification('Income source updated successfully', 'success');
        } else {
            await API.createIncomeSource(formData);
            showNotification('Income source added successfully', 'success');
        }
        
        hideModal('income-modal');
        loadIncomeSources();
    } catch (error) {
        console.error('Error saving income source:', error);
        showNotification('Failed to save income source', 'error');
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
                null
            );
            return;
        }
        
        let html = '<h3>Variable Income Sources</h3><div class="variable-income-grid">';
        
        for (const source of variableSources) {
            const analysis = await API.getIncomeAnalysis(source.id);
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
function renderVariableIncomeCard(source, analysis) {
    if (!analysis) return '';
    
    const stabilityClass = analysis.stability === 'Stable' ? 'stable' : 
                          analysis.stability === 'Variable' ? 'variable' : 'highly-variable';
    
    return `
        <div class="variable-income-card ${stabilityClass}">
            <div class="card-header">
                <h4>${source.name}</h4>
                <span class="stability-badge ${stabilityClass}">${analysis.stability}</span>
            </div>
            <div class="card-stats">
                <div class="stat">
                    <label>Average Monthly</label>
                    <strong>${formatCurrency(analysis.average_monthly || 0)}</strong>
                </div>
                <div class="stat">
                    <label>Variability</label>
                    <strong>${(analysis.coefficient_of_variation || 0).toFixed(1)}%</strong>
                </div>
                <div class="stat">
                    <label>Last 6 Months</label>
                    <strong>${formatCurrency(analysis.last_6_months_total || 0)}</strong>
                </div>
                <div class="stat">
                    <label>Payments</label>
                    <strong>${analysis.payment_count || 0}</strong>
                </div>
            </div>
            <button class="btn-small btn-primary" onclick="BudgetApp.modules.Income.showVariableAnalysis('${source.id}')">
                View Detailed Analysis
            </button>
        </div>
    `;
}

/**
 * Show variable income analysis modal
 */
export function showVariableAnalysis(incomeId) {
    showNotification('Variable income analysis modal coming soon!', 'info');
    // TODO: Implement detailed analysis modal with charts
}

/**
 * Load Income Trends sub-tab
 */
async function loadIncomeTrends() {
    console.log('Loading income trends...');
    showLoading('income-trends-container', 'Loading income trends...');
    
    try {
        const trends = await API.getIncomeTrends(12);
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
    
    // TODO: Implement with Chart.js
    container.innerHTML = `
        <h3>Income Trends</h3>
        <p>Income trend charts will be displayed here showing total income over time, income by source, and income by household member.</p>
        <div class="chart-placeholder" style="height: 300px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; margin: 20px 0;">
            📈 Chart.js integration coming soon
        </div>
    `;
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
    
    if (!data || !data.years || data.years.length === 0) {
        showEmptyState(
            'year-over-year-container',
            '📅',
            'Not enough data for year-over-year comparison. Need at least 2 years of income history.',
            null
        );
        return;
    }
    
    let html = '<h3>Year-over-Year Income Comparison</h3><div class="year-comparison-grid">';
    
    data.years.forEach(year => {
        const changeClass = year.change_percent > 0 ? 'positive' : year.change_percent < 0 ? 'negative' : 'neutral';
        html += `
            <div class="year-card">
                <h4>${year.year}</h4>
                <div class="year-stats">
                    <div class="stat">
                        <label>Total Income</label>
                        <strong>${formatCurrency(year.total || 0)}</strong>
                    </div>
                    <div class="stat">
                        <label>Monthly Average</label>
                        <strong>${formatCurrency(year.monthly_average || 0)}</strong>
                    </div>
                    <div class="stat">
                        <label>Payments</label>
                        <strong>${year.payment_count || 0}</strong>
                    </div>
                    ${year.change_amount !== undefined ? `
                        <div class="stat ${changeClass}">
                            <label>vs Previous Year</label>
                            <strong>${year.change_percent > 0 ? '+' : ''}${(year.change_percent || 0).toFixed(1)}%</strong>
                            <small>(${year.change_amount > 0 ? '+' : ''}${formatCurrency(year.change_amount || 0)})</small>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Load Tax Estimator sub-tab
 */
async function loadTaxEstimator() {
    console.log('Loading tax estimator...');
    showLoading('tax-estimator-container', 'Loading tax estimator...');
    
    try {
        const taxData = await API.getTaxEstimate('single', 2025);
        renderTaxEstimator(taxData);
    } catch (error) {
        console.error('Error loading tax estimator:', error);
        showError('tax-estimator-container', 'Failed to load tax estimator');
    }
}

/**
 * Render tax estimator
 */
function renderTaxEstimator(data) {
    const container = document.getElementById('tax-estimator-container');
    if (!container) return;
    
    // TODO: Implement full tax estimator UI
    container.innerHTML = `
        <h3>Federal Tax Estimator (2025)</h3>
        <div class="tax-form">
            <div class="form-group">
                <label>Filing Status</label>
                <select id="filing-status" onchange="BudgetApp.modules.Income.updateTaxEstimate()">
                    <option value="single">Single</option>
                    <option value="married_joint">Married Filing Jointly</option>
                    <option value="married_separate">Married Filing Separately</option>
                    <option value="head_of_household">Head of Household</option>
                </select>
            </div>
        </div>
        <div class="tax-summary">
            <p>Tax estimator interface will be displayed here with brackets, effective rate, and withholding recommendations.</p>
        </div>
    `;
}

/**
 * Update tax estimate
 */
export async function updateTaxEstimate() {
    const filingStatus = document.getElementById('filing-status')?.value || 'single';
    await loadTaxEstimator();
}

/**
 * Load Retirement sub-tab
 */
async function loadRetirement() {
    console.log('Loading retirement accounts...');
    showLoading('retirement-container', 'Loading retirement accounts...');
    
    try {
        const accounts = await API.getRetirementAccounts();
        renderRetirementAccounts(accounts);
    } catch (error) {
        console.error('Error loading retirement accounts:', error);
        showError('retirement-container', 'Failed to load retirement accounts');
    }
}

/**
 * Render retirement accounts
 */
function renderRetirementAccounts(accounts) {
    const container = document.getElementById('retirement-container');
    if (!container) return;
    
    if (!accounts || accounts.length === 0) {
        showEmptyState(
            'retirement-container',
            '💰',
            'No retirement accounts yet. Add your 401(k), IRA, or other retirement accounts to track contributions!',
            { text: 'Add Retirement Account', action: 'BudgetApp.modules.Income.showRetirementModal()' }
        );
        return;
    }
    
    let html = '<div class="retirement-grid">';
    
    accounts.forEach(account => {
        const ytdContributions = account.ytd_employee || 0;
        const ytdMatch = account.ytd_employer || 0;
        const limit = account.annual_limit || 23500;
        const progress = (ytdContributions / limit) * 100;
        const remaining = limit - ytdContributions;
        
        html += `
            <div class="retirement-account-card">
                <div class="account-header">
                    <h4>${account.account_name}</h4>
                    <span class="account-type-badge">${account.account_type?.toUpperCase()}</span>
                </div>
                <div class="account-balance">
                    <label>Current Balance</label>
                    <strong>${formatCurrency(account.current_balance || 0)}</strong>
                </div>
                <div class="contribution-progress">
                    <div class="progress-header">
                        <label>Year-to-Date Contributions</label>
                        <span>${formatCurrency(ytdContributions)} / ${formatCurrency(limit)}</span>
                    </div>
                    <div class="progress-bar-wrapper">
                        <div class="progress-bar" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                    <small>${remaining > 0 ? `${formatCurrency(remaining)} remaining` : 'Limit reached!'}</small>
                </div>
                ${account.employer_match_percent ? `
                    <div class="employer-match">
                        <label>Employer Match</label>
                        <p>${account.employer_match_percent}% up to ${account.employer_match_limit}% of salary</p>
                        <small>YTD Match: ${formatCurrency(ytdMatch)}</small>
                    </div>
                ` : ''}
                <div class="account-actions">
                    <button class="btn-icon" onclick="BudgetApp.modules.Income.editRetirement('${account.id}')" title="Edit">✏️</button>
                    <button class="btn-icon" onclick="BudgetApp.modules.Income.deleteRetirement('${account.id}')" title="Delete">🗑️</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Show retirement account modal
 */
export function showRetirementModal(accountId = null) {
    showNotification('Retirement account modal coming soon!', 'info');
    // TODO: Implement retirement account modal
}

/**
 * Edit retirement account
 */
export function editRetirement(accountId) {
    showRetirementModal(accountId);
}

/**
 * Delete retirement account
 */
export async function deleteRetirement(accountId) {
    if (!confirm('Are you sure you want to delete this retirement account?')) {
        return;
    }
    
    try {
        await API.deleteRetirementAccount(accountId);
        showNotification('Retirement account deleted successfully', 'success');
        loadRetirement();
    } catch (error) {
        console.error('Error deleting retirement account:', error);
        showNotification('Failed to delete retirement account', 'error');
    }
}
