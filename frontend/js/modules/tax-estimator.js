// Tax Estimator Module
import * as API from '../api.js';
import { formatCurrency, showNotification } from '../utils.js';
import { showLoading } from '../ui.js';

let currentFilingStatus = 'married-joint';
let useActualIncome = false;

/**
 * Initialize Tax Estimator
 */
export function initTaxEstimator() {
    console.log('Initializing Tax Estimator module');
    loadTaxEstimate();
}

/**
 * Render Tax Estimator UI
 */
export async function loadTaxEstimate() {
    const container = document.getElementById('tax-estimator-container');
    if (!container) return;

    showLoading('tax-estimator-container', 'Loading tax estimate...');

    try {
        const data = await API.getTaxEstimate(currentFilingStatus, useActualIncome);

        if (!data.success) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <h3>Unable to Calculate Taxes</h3>
                    <p>${data.error || 'An error occurred while calculating taxes.'}</p>
                </div>
            `;
            return;
        }

        // Check if there's any income data
        if (data.income.total_sources === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🧾</div>
                    <h3>No Income Data</h3>
                    <p>Add income sources to see your tax estimate.</p>
                    <button class="btn-primary" onclick="window.switchTab('income')">Add Income Sources</button>
                </div>
            `;
            return;
        }

        container.innerHTML = renderTaxEstimatorUI(data);

        // Attach event listeners
        attachEventListeners();

    } catch (error) {
        console.error('Error loading tax estimate:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <h3>Error Loading Tax Estimate</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

/**
 * Render Tax Estimator UI
 */
function renderTaxEstimatorUI(data) {
    const {
        filing_status_label,
        use_actual_income,
        income,
        deductions,
        tax,
        after_tax,
        paycheck_withholding,
        note
    } = data;

    // Determine tax status color
    let taxStatusColor = 'var(--success-color)';
    let taxStatusText = 'Healthy Tax Rate';
    if (tax.effective_rate_percent > 25) {
        taxStatusColor = 'var(--warning-color)';
        taxStatusText = 'High Tax Rate';
    } else if (tax.effective_rate_percent > 20) {
        taxStatusColor = 'var(--info-color)';
        taxStatusText = 'Moderate Tax Rate';
    }

    return `
        <!-- Tax Estimator Controls -->
        <div class="tax-controls">
            <div class="control-group">
                <label for="filing-status-select">Filing Status:</label>
                <select id="filing-status-select" class="form-control">
                    <option value="single" ${currentFilingStatus === 'single' ? 'selected' : ''}>Single</option>
                    <option value="married-joint" ${currentFilingStatus === 'married-joint' ? 'selected' : ''}>Married Filing Jointly</option>
                    <option value="married-separate" ${currentFilingStatus === 'married-separate' ? 'selected' : ''}>Married Filing Separately</option>
                    <option value="head-of-household" ${currentFilingStatus === 'head-of-household' ? 'selected' : ''}>Head of Household</option>
                </select>
            </div>
            <div class="control-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="use-actual-toggle" ${useActualIncome ? 'checked' : ''}>
                    Use actual payments from last 12 months
                </label>
                <div class="control-hint">
                    ${useActualIncome 
                        ? '✓ Using actual payments received' 
                        : 'Using expected income amounts'}
                </div>
            </div>
        </div>

        <!-- Tax Summary Banner -->
        <div class="tax-summary-banner" style="border-left: 4px solid ${taxStatusColor};">
            <div class="banner-content">
                <div class="banner-icon" style="color: ${taxStatusColor};">🧾</div>
                <div class="banner-info">
                    <h3>${filing_status_label}</h3>
                    <p class="banner-subtitle">${taxStatusText} • ${tax.effective_rate_percent}% Effective Rate</p>
                </div>
                <div class="banner-stats">
                    <div class="stat-item">
                        <div class="stat-label">Annual Tax</div>
                        <div class="stat-value" style="color: ${taxStatusColor};">${formatCurrency(tax.total_annual)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Monthly Tax</div>
                        <div class="stat-value" style="color: ${taxStatusColor};">${formatCurrency(tax.total_monthly)}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tax Details Grid -->
        <div class="tax-details-grid">
            <!-- Income Section -->
            <div class="tax-card">
                <div class="card-header">
                    <h3>💵 Income</h3>
                </div>
                <div class="card-content">
                    <div class="stat-row">
                        <span class="stat-label">Annual Gross Income</span>
                        <span class="stat-value">${formatCurrency(income.annual_gross)}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Monthly Gross Income</span>
                        <span class="stat-value">${formatCurrency(income.monthly_gross)}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Income Sources</span>
                        <span class="stat-value">${income.total_sources}</span>
                    </div>
                    <button class="btn-link" id="view-income-breakdown-btn">
                        View Income Breakdown →
                    </button>
                </div>
            </div>

            <!-- Deductions Section -->
            <div class="tax-card">
                <div class="card-header">
                    <h3>📝 Deductions</h3>
                </div>
                <div class="card-content">
                    <div class="stat-row">
                        <span class="stat-label">Standard Deduction</span>
                        <span class="stat-value">${formatCurrency(deductions.standard_deduction)}</span>
                    </div>
                    <div class="stat-row highlight">
                        <span class="stat-label"><strong>Taxable Income</strong></span>
                        <span class="stat-value"><strong>${formatCurrency(deductions.taxable_income)}</strong></span>
                    </div>
                    <div class="info-text">
                        <small>This estimate uses the standard deduction. Itemized deductions, credits, and other tax benefits are not included.</small>
                    </div>
                </div>
            </div>

            <!-- Tax Calculation Section -->
            <div class="tax-card full-width">
                <div class="card-header">
                    <h3>📊 Tax Calculation</h3>
                </div>
                <div class="card-content">
                    <div class="tax-rates-row">
                        <div class="rate-box">
                            <div class="rate-label">Effective Rate</div>
                            <div class="rate-value" style="color: ${taxStatusColor};">${tax.effective_rate_percent}%</div>
                            <div class="rate-description">Average tax on all income</div>
                        </div>
                        <div class="rate-box">
                            <div class="rate-label">Marginal Rate</div>
                            <div class="rate-value">${tax.marginal_rate_percent}%</div>
                            <div class="rate-description">Tax on next dollar earned</div>
                        </div>
                    </div>
                    
                    <div class="bracket-breakdown">
                        <h4>Tax by Bracket:</h4>
                        ${tax.by_bracket.map((bracket, index) => `
                            <div class="bracket-item">
                                <div class="bracket-header">
                                    <span class="bracket-rate">${bracket.rate_percent}% Bracket</span>
                                    <span class="bracket-range">
                                        ${formatCurrency(bracket.bracket_min)} - ${bracket.bracket_max ? formatCurrency(bracket.bracket_max) : '∞'}
                                    </span>
                                </div>
                                <div class="bracket-bar-container">
                                    <div class="bracket-bar" style="width: ${(bracket.tax_amount / tax.total_annual * 100).toFixed(1)}%; background: linear-gradient(90deg, var(--primary-color-light), var(--primary-color));">
                                    </div>
                                </div>
                                <div class="bracket-details">
                                    <span>Income in bracket: ${formatCurrency(bracket.income_in_bracket)}</span>
                                    <span class="bracket-tax">Tax: ${formatCurrency(bracket.tax_amount)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="total-tax-row">
                        <span class="stat-label"><strong>Total Federal Income Tax</strong></span>
                        <span class="stat-value" style="color: ${taxStatusColor};"><strong>${formatCurrency(tax.total_annual)}</strong></span>
                    </div>
                </div>
            </div>

            <!-- After-Tax Income Section -->
            <div class="tax-card">
                <div class="card-header">
                    <h3>💰 After-Tax Income</h3>
                </div>
                <div class="card-content">
                    <div class="stat-row highlight">
                        <span class="stat-label"><strong>Annual Take-Home</strong></span>
                        <span class="stat-value success"><strong>${formatCurrency(after_tax.annual)}</strong></span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Monthly Take-Home</span>
                        <span class="stat-value success">${formatCurrency(after_tax.monthly)}</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-label">
                            <span>After Tax: ${(100 - tax.effective_rate_percent).toFixed(1)}%</span>
                            <span style="color: ${taxStatusColor};">Tax: ${tax.effective_rate_percent}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill success" style="width: ${100 - tax.effective_rate_percent}%;"></div>
                            <div class="progress-fill" style="width: ${tax.effective_rate_percent}%; background: ${taxStatusColor};"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Paycheck Withholding Section -->
            <div class="tax-card">
                <div class="card-header">
                    <h3>💳 Paycheck Withholding</h3>
                </div>
                <div class="card-content">
                    <div class="withholding-info">
                        <p>Recommended federal income tax withholding per paycheck:</p>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Weekly (52 paychecks)</span>
                        <span class="stat-value">${formatCurrency(paycheck_withholding.weekly)}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Bi-Weekly (26 paychecks)</span>
                        <span class="stat-value">${formatCurrency(paycheck_withholding.bi_weekly)}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Semi-Monthly (24 paychecks)</span>
                        <span class="stat-value">${formatCurrency(paycheck_withholding.semi_monthly)}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Monthly (12 paychecks)</span>
                        <span class="stat-value">${formatCurrency(paycheck_withholding.monthly)}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Disclaimer -->
        <div class="tax-disclaimer">
            <div class="disclaimer-icon">⚠️</div>
            <div class="disclaimer-content">
                <h4>Important Tax Disclaimer</h4>
                <p>${note}</p>
                <ul>
                    <li>This estimate is for <strong>federal income tax only</strong></li>
                    <li>Does NOT include: State taxes, FICA (Social Security & Medicare), local taxes</li>
                    <li>Does NOT account for: Tax credits, itemized deductions, adjustments to income</li>
                    <li>Based on 2025 tax brackets and standard deduction</li>
                    <li>Your actual tax liability may differ based on your complete tax situation</li>
                    <li>Consult a tax professional for personalized advice</li>
                </ul>
            </div>
        </div>
    `;
}

/**
 * Attach Event Listeners
 */
function attachEventListeners() {
    // Filing status change
    const filingStatusSelect = document.getElementById('filing-status-select');
    if (filingStatusSelect) {
        filingStatusSelect.addEventListener('change', async (e) => {
            currentFilingStatus = e.target.value;
            await loadTaxEstimate();
            showNotification('Tax estimate updated', 'success');
        });
    }

    // Use actual income toggle
    const useActualToggle = document.getElementById('use-actual-toggle');
    if (useActualToggle) {
        useActualToggle.addEventListener('change', async (e) => {
            useActualIncome = e.target.checked;
            await loadTaxEstimate();
            showNotification('Tax estimate updated', 'success');
        });
    }

    // View income breakdown button
    const viewIncomeBtn = document.getElementById('view-income-breakdown-btn');
    if (viewIncomeBtn) {
        viewIncomeBtn.addEventListener('click', async () => {
            const data = await API.getTaxEstimate(currentFilingStatus, useActualIncome);
            if (data.success) {
                showIncomeBreakdownModal(data.income);
            }
        });
    }
}

/**
 * Show Income Breakdown Modal
 */
function showIncomeBreakdownModal(incomeData) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content modal-medium">
            <div class="modal-header">
                <h3>Income Source Breakdown</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="income-breakdown-summary">
                    <div class="summary-stat">
                        <span class="stat-label">Total Annual Income</span>
                        <span class="stat-value">${formatCurrency(incomeData.annual_gross)}</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-label">Total Monthly Income</span>
                        <span class="stat-value">${formatCurrency(incomeData.monthly_gross)}</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-label">Income Sources</span>
                        <span class="stat-value">${incomeData.total_sources}</span>
                    </div>
                </div>
                
                <h4>Sources:</h4>
                <div class="income-sources-list">
                    ${incomeData.breakdown.map(source => `
                        <div class="source-item">
                            <div class="source-header">
                                <span class="source-name">${source.name}</span>
                                <span class="source-amount">${formatCurrency(source.annual_amount)}/year</span>
                            </div>
                            <div class="source-details">
                                <span class="source-type">${formatSourceType(source.type)}</span>
                                <span class="source-earner">👤 ${source.earner}</span>
                            </div>
                            <div class="source-bar-container">
                                <div class="source-bar" style="width: ${(source.annual_amount / incomeData.annual_gross * 100).toFixed(1)}%;"></div>
                            </div>
                            <div class="source-percentage">${(source.annual_amount / incomeData.annual_gross * 100).toFixed(1)}% of total income</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

/**
 * Format Source Type
 */
function formatSourceType(type) {
    const types = {
        'primary-salary': '💼 Primary Salary',
        'secondary-salary': '💼 Secondary Salary',
        'freelance': '💻 Freelance',
        'investment': '📈 Investment',
        'rental': '🏠 Rental',
        'other': '💰 Other'
    };
    return types[type] || type;
}
