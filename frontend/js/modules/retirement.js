// Retirement Accounts Module
import * as API from '../api.js';
import { formatCurrency, showNotification } from '../utils.js';
import { showLoading, showError, showModal, hideModal, showEmptyState } from '../ui.js';

let currentEditAccountId = null;
let currentAccountForContribution = null;

// 2025 IRS Contribution Limits
const CONTRIBUTION_LIMITS = {
    '401k': 23500,
    '403b': 23500,
    'traditional_ira': 7000,
    'roth_ira': 7000,
    'sep_ira': 69000,
    'simple_ira': 16000
};

const ACCOUNT_TYPE_LABELS = {
    '401k': '401(k)',
    '403b': '403(b)',
    'traditional_ira': 'Traditional IRA',
    'roth_ira': 'Roth IRA',
    'sep_ira': 'SEP IRA',
    'simple_ira': 'SIMPLE IRA'
};

// Retirement Account Modal HTML
const retirementAccountModalHTML = `
    <div id="retirement-account-modal" class="modal">
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h3 id="retirement-account-modal-title">Add Retirement Account</h3>
                <button class="modal-close" id="close-retirement-account-modal">&times;</button>
            </div>
            <form id="retirement-account-form">
                <!-- Account Information -->
                <div class="form-section">
                    <h4>Account Information</h4>
                    
                    <div class="form-group">
                        <label for="account-name">Account Name *</label>
                        <input type="text" id="account-name" required placeholder="e.g., Company 401(k), Personal IRA">
                        <small>Give this account a descriptive name</small>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="account-type">Account Type *</label>
                            <select id="account-type" required>
                                <option value="">Select account type</option>
                                <option value="401k">401(k)</option>
                                <option value="403b">403(b)</option>
                                <option value="traditional_ira">Traditional IRA</option>
                                <option value="roth_ira">Roth IRA</option>
                                <option value="sep_ira">SEP IRA</option>
                                <option value="simple_ira">SIMPLE IRA</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="contribution-type">Contribution Type *</label>
                            <select id="contribution-type" required>
                                <option value="pre_tax">Pre-Tax (Traditional)</option>
                                <option value="post_tax">Post-Tax (Roth)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="annual-limit">Annual Contribution Limit *</label>
                            <input type="number" id="annual-limit" step="0.01" required placeholder="0.00">
                            <small id="limit-hint">2025 IRS limit will auto-fill</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="current-balance">Current Balance</label>
                            <input type="number" id="current-balance" step="0.01" value="0" placeholder="0.00">
                            <small>Total account value</small>
                        </div>
                    </div>
                </div>
                
                <!-- Employer Matching (for 401k/403b) -->
                <div class="form-section" id="employer-match-section" style="display: none;">
                    <h4>Employer Matching</h4>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="employer-match-percent">Match Percentage</label>
                            <input type="number" id="employer-match-percent" step="0.01" min="0" max="100" value="0" placeholder="0">
                            <small>e.g., 100 for dollar-for-dollar match</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="employer-match-limit">Match Limit (% of Salary)</label>
                            <input type="number" id="employer-match-limit" step="0.01" min="0" max="100" value="0" placeholder="0">
                            <small>e.g., 6 for 6% of salary cap</small>
                        </div>
                    </div>
                </div>
                
                <!-- Link to Income -->
                <div class="form-section">
                    <h4>Link to Income Source (Optional)</h4>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="linked-income">Income Source</label>
                            <select id="linked-income">
                                <option value="">Not linked to income</option>
                                <!-- Will be populated dynamically -->
                            </select>
                            <small>Link to track per-paycheck contributions</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="contribution-per-paycheck">Contribution per Paycheck</label>
                            <input type="number" id="contribution-per-paycheck" step="0.01" min="0" value="0" placeholder="0.00">
                            <small>Amount deducted each pay period</small>
                        </div>
                    </div>
                </div>
                
                <!-- Notes -->
                <div class="form-section">
                    <div class="form-group">
                        <label for="account-notes">Notes (Optional)</label>
                        <textarea id="account-notes" rows="3" placeholder="Additional information about this account..."></textarea>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" id="cancel-retirement-account-btn">Cancel</button>
                    <button type="submit" class="btn-primary" id="submit-retirement-account-btn">Save Account</button>
                </div>
            </form>
        </div>
    </div>
`;

// Contribution Modal HTML
const contributionModalHTML = `
    <div id="contribution-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Add Contribution</h3>
                <button class="modal-close" id="close-contribution-modal">&times;</button>
            </div>
            <form id="contribution-form">
                <div class="form-group">
                    <label for="contribution-date">Date *</label>
                    <input type="date" id="contribution-date" required>
                </div>
                
                <div class="form-group">
                    <label for="contribution-amount">Amount *</label>
                    <input type="number" id="contribution-amount" step="0.01" min="0.01" required placeholder="0.00">
                </div>
                
                <div class="form-group">
                    <label for="contribution-category">Type *</label>
                    <select id="contribution-category" required>
                        <option value="employee">Employee Contribution</option>
                        <option value="employer_match">Employer Match</option>
                        <option value="bonus">Bonus/Additional</option>
                        <option value="rollover">Rollover</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="contribution-note">Note (Optional)</label>
                    <textarea id="contribution-note" rows="2" placeholder="Additional details..."></textarea>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" id="cancel-contribution-btn">Cancel</button>
                    <button type="submit" class="btn-primary">Add Contribution</button>
                </div>
            </form>
        </div>
    </div>
`;

// Account Detail Modal HTML
const accountDetailModalHTML = `
    <div id="account-detail-modal" class="modal">
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h3 id="account-detail-title">Account Details</h3>
                <button class="modal-close" id="close-account-detail-modal">&times;</button>
            </div>
            <div id="account-detail-content"></div>
        </div>
    </div>
`;

// Initialize retirement module
export function initRetirement() {
    // Inject modals
    const modalsContainer = document.getElementById('modals-container');
    if (modalsContainer && !document.getElementById('retirement-account-modal')) {
        modalsContainer.insertAdjacentHTML('beforeend', retirementAccountModalHTML);
        modalsContainer.insertAdjacentHTML('beforeend', contributionModalHTML);
        modalsContainer.insertAdjacentHTML('beforeend', accountDetailModalHTML);
        setupRetirementModalHandlers();
    }
    
    loadRetirementAccounts();
}

// Setup modal event handlers
function setupRetirementModalHandlers() {
    // Account modal handlers
    const accountModal = document.getElementById('retirement-account-modal');
    const accountForm = document.getElementById('retirement-account-form');
    const closeAccountModal = document.getElementById('close-retirement-account-modal');
    const cancelAccountBtn = document.getElementById('cancel-retirement-account-btn');
    
    if (closeAccountModal) {
        closeAccountModal.addEventListener('click', () => hideModal('retirement-account-modal'));
    }
    
    if (cancelAccountBtn) {
        cancelAccountBtn.addEventListener('click', () => hideModal('retirement-account-modal'));
    }
    
    if (accountForm) {
        accountForm.addEventListener('submit', handleRetirementAccountSubmit);
    }
    
    // Account type change handler - auto-fill limits and show/hide employer match
    const accountTypeSelect = document.getElementById('account-type');
    if (accountTypeSelect) {
        accountTypeSelect.addEventListener('change', (e) => {
            const accountType = e.target.value;
            const limitInput = document.getElementById('annual-limit');
            const employerMatchSection = document.getElementById('employer-match-section');
            
            if (accountType && CONTRIBUTION_LIMITS[accountType]) {
                limitInput.value = CONTRIBUTION_LIMITS[accountType];
            }
            
            // Show employer match section for 401k and 403b
            if (accountType === '401k' || accountType === '403b') {
                employerMatchSection.style.display = 'block';
            } else {
                employerMatchSection.style.display = 'none';
            }
        });
    }
    
    // Contribution modal handlers
    const contributionModal = document.getElementById('contribution-modal');
    const contributionForm = document.getElementById('contribution-form');
    const closeContributionModal = document.getElementById('close-contribution-modal');
    const cancelContributionBtn = document.getElementById('cancel-contribution-btn');
    
    if (closeContributionModal) {
        closeContributionModal.addEventListener('click', () => hideModal('contribution-modal'));
    }
    
    if (cancelContributionBtn) {
        cancelContributionBtn.addEventListener('click', () => hideModal('contribution-modal'));
    }
    
    if (contributionForm) {
        contributionForm.addEventListener('submit', handleContributionSubmit);
    }
    
    // Account detail modal handler
    const closeDetailModal = document.getElementById('close-account-detail-modal');
    if (closeDetailModal) {
        closeDetailModal.addEventListener('click', () => hideModal('account-detail-modal'));
    }
    
    // Click outside to close
    window.addEventListener('click', (e) => {
        if (e.target === accountModal) {
            hideModal('retirement-account-modal');
        }
        if (e.target === contributionModal) {
            hideModal('contribution-modal');
        }
        if (e.target === document.getElementById('account-detail-modal')) {
            hideModal('account-detail-modal');
        }
    });
}

// Load and display retirement accounts
export async function loadRetirementAccounts() {
    const container = document.getElementById('retirement-container');
    if (!container) return;
    
    showLoading(container);
    
    try {
        const [accountsData, summaryData] = await Promise.all([
            API.getRetirementAccounts(),
            API.getRetirementSummary()
        ]);
        
        if (!accountsData.success) {
            throw new Error(accountsData.error || 'Failed to load retirement accounts');
        }
        
        const accounts = accountsData.accounts || [];
        const summary = summaryData.success ? summaryData.summary : null;
        
        // Clear the container (removes loading state)
        container.innerHTML = '';
        
        // Display summary and accounts
        displayRetirementSummary(summary);
        displayRetirementAccounts(accounts);
        
    } catch (error) {
        console.error('Error loading retirement accounts:', error);
        showError(container, 'Failed to load retirement accounts. Please try again.');
    }
}

// Display retirement summary
function displayRetirementSummary(summary) {
    const container = document.getElementById('retirement-container');
    if (!container) return;
    
    if (!summary || summary.total_accounts === 0) {
        return; // Will show empty state in main display
    }
    
    // Remove any existing summary
    const existingSummary = container.querySelector('.retirement-summary');
    if (existingSummary) {
        existingSummary.remove();
    }
    
    const summaryHTML = `
        <div class="retirement-summary">
            <div class="summary-cards">
                <div class="summary-card">
                    <div class="summary-icon">💰</div>
                    <div class="summary-content">
                        <div class="summary-label">Total Balance</div>
                        <div class="summary-value">${formatCurrency(summary.total_balance)}</div>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">📊</div>
                    <div class="summary-content">
                        <div class="summary-label">${summary.current_year} YTD Contributions</div>
                        <div class="summary-value">${formatCurrency(summary.ytd_contributions)}</div>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">👤</div>
                    <div class="summary-content">
                        <div class="summary-label">Your Contributions</div>
                        <div class="summary-value">${formatCurrency(summary.ytd_employee_contributions)}</div>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">🏢</div>
                    <div class="summary-content">
                        <div class="summary-label">Employer Match</div>
                        <div class="summary-value">${formatCurrency(summary.ytd_employer_contributions)}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Insert summary at the beginning of the container
    container.insertAdjacentHTML('afterbegin', summaryHTML);
}

// Display retirement accounts
function displayRetirementAccounts(accounts) {
    const container = document.getElementById('retirement-container');
    if (!container) return;
    
    // Remove any existing accounts list
    const existingList = container.querySelector('.retirement-accounts-list');
    if (existingList) {
        existingList.remove();
    }
    
    // Remove any existing empty state
    const existingEmptyState = container.querySelector('.empty-state');
    if (existingEmptyState) {
        existingEmptyState.remove();
    }
    
    // Remove any loading state
    const loadingState = container.querySelector('.loading');
    if (loadingState) {
        loadingState.remove();
    }
    
    if (accounts.length === 0) {
        const emptyStateHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💰</div>
                <h3>No Retirement Accounts Yet</h3>
                <p>Start tracking your retirement savings by adding your first account.</p>
                <p class="empty-state-hint">Track 401(k), IRA, and other retirement accounts with contribution limits and employer matching.</p>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', emptyStateHTML);
        return;
    }
    
    const accountsHTML = `
        <div class="retirement-accounts-list">
            ${accounts.map(account => createAccountCard(account)).join('')}
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', accountsHTML);
    
    // Attach event listeners
    accounts.forEach(account => {
        attachAccountEventListeners(account.id);
    });
}

// Create account card HTML
function createAccountCard(account) {
    const limitPercentage = account.limit_percentage || 0;
    const isNearLimit = limitPercentage >= 80;
    const isAtLimit = limitPercentage >= 100;
    
    let limitStatusClass = '';
    let limitStatusText = '';
    
    if (isAtLimit) {
        limitStatusClass = 'limit-reached';
        limitStatusText = '✓ Limit Reached';
    } else if (isNearLimit) {
        limitStatusClass = 'near-limit';
        limitStatusText = '⚠️ Near Limit';
    }
    
    const contributionTypeLabel = account.contribution_type === 'pre_tax' ? 'Pre-Tax' : 'Post-Tax';
    const accountTypeLabel = ACCOUNT_TYPE_LABELS[account.account_type] || account.account_type;
    
    return `
        <div class="retirement-account-card" data-account-id="${account.id}">
            <div class="account-card-header">
                <div class="account-card-title">
                    <h3>${account.account_name}</h3>
                    <div class="account-badges">
                        <span class="badge badge-type">${accountTypeLabel}</span>
                        <span class="badge badge-contribution">${contributionTypeLabel}</span>
                        ${limitStatusText ? `<span class="badge badge-limit ${limitStatusClass}">${limitStatusText}</span>` : ''}
                    </div>
                </div>
                <div class="account-card-actions">
                    <button class="btn-icon" data-action="add-contribution" data-account-id="${account.id}" title="Add Contribution">
                        <span>➕</span>
                    </button>
                    <button class="btn-icon" data-action="edit-account" data-account-id="${account.id}" title="Edit Account">
                        <span>✏️</span>
                    </button>
                    <button class="btn-icon btn-danger" data-action="delete-account" data-account-id="${account.id}" title="Delete Account">
                        <span>🗑️</span>
                    </button>
                </div>
            </div>
            
            <div class="account-card-body">
                <div class="account-stats">
                    <div class="stat-item">
                        <div class="stat-label">Current Balance</div>
                        <div class="stat-value">${formatCurrency(account.current_balance || 0)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">YTD Contributions</div>
                        <div class="stat-value">${formatCurrency(account.ytd_employee || 0)}</div>
                    </div>
                    ${account.ytd_employer > 0 ? `
                        <div class="stat-item">
                            <div class="stat-label">YTD Employer Match</div>
                            <div class="stat-value">${formatCurrency(account.ytd_employer)}</div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="contribution-limit-section">
                    <div class="limit-header">
                        <span class="limit-label">Contribution Progress</span>
                        <span class="limit-value">${formatCurrency(account.ytd_employee || 0)} / ${formatCurrency(account.annual_limit)}</span>
                    </div>
                    <div class="progress-bar-wrapper">
                        <div class="progress-bar ${limitStatusClass}" style="width: ${Math.min(limitPercentage, 100)}%"></div>
                    </div>
                    <div class="limit-footer">
                        <span>${limitPercentage.toFixed(1)}% of annual limit</span>
                        <span class="remaining-amount">${formatCurrency(account.remaining_limit || 0)} remaining</span>
                    </div>
                </div>
                
                ${account.contribution_per_paycheck > 0 ? `
                    <div class="per-paycheck-info">
                        <span class="info-icon">💵</span>
                        <span>Contributing ${formatCurrency(account.contribution_per_paycheck)} per paycheck</span>
                    </div>
                ` : ''}
                
                ${account.employer_match_percent > 0 ? `
                    <div class="employer-match-info">
                        <span class="info-icon">🏢</span>
                        <span>Employer matches ${account.employer_match_percent}% up to ${account.employer_match_limit}% of salary</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="account-card-footer">
                <button class="btn-text view-details-btn" data-account-id="${account.id}">
                    View Contribution History →
                </button>
            </div>
        </div>
    `;
}

// Attach event listeners to account card
function attachAccountEventListeners(accountId) {
    // Add contribution button
    const addContribBtn = document.querySelector(`[data-action="add-contribution"][data-account-id="${accountId}"]`);
    if (addContribBtn) {
        addContribBtn.addEventListener('click', () => openAddContributionModal(accountId));
    }
    
    // Edit account button
    const editBtn = document.querySelector(`[data-action="edit-account"][data-account-id="${accountId}"]`);
    if (editBtn) {
        editBtn.addEventListener('click', () => openEditAccountModal(accountId));
    }
    
    // Delete account button
    const deleteBtn = document.querySelector(`[data-action="delete-account"][data-account-id="${accountId}"]`);
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => handleDeleteAccount(accountId));
    }
    
    // View details button
    const viewDetailsBtn = document.querySelector(`.view-details-btn[data-account-id="${accountId}"]`);
    if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', () => openAccountDetailModal(accountId));
    }
}

// Open add account modal
export function openAddAccountModal() {
    currentEditAccountId = null;
    const modal = document.getElementById('retirement-account-modal');
    const title = document.getElementById('retirement-account-modal-title');
    const form = document.getElementById('retirement-account-form');
    
    if (!modal || !title || !form) return;
    
    title.textContent = 'Add Retirement Account';
    form.reset();
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    
    // Load income sources for linking
    loadIncomeSources();
    
    showModal('retirement-account-modal');
}

// Open edit account modal
async function openEditAccountModal(accountId) {
    currentEditAccountId = accountId;
    
    try {
        const response = await API.getRetirementAccounts();
        if (!response.success) {
            throw new Error(response.error || 'Failed to load account');
        }
        
        const account = response.accounts.find(acc => acc.id === accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        
        const modal = document.getElementById('retirement-account-modal');
        const title = document.getElementById('retirement-account-modal-title');
        
        if (!modal || !title) return;
        
        title.textContent = 'Edit Retirement Account';
        
        // Load income sources
        await loadIncomeSources();
        
        // Populate form
        document.getElementById('account-name').value = account.account_name || '';
        document.getElementById('account-type').value = account.account_type || '';
        document.getElementById('contribution-type').value = account.contribution_type || 'pre_tax';
        document.getElementById('annual-limit').value = account.annual_limit || '';
        document.getElementById('current-balance').value = account.current_balance || 0;
        document.getElementById('employer-match-percent').value = account.employer_match_percent || 0;
        document.getElementById('employer-match-limit').value = account.employer_match_limit || 0;
        document.getElementById('linked-income').value = account.linked_income_id || '';
        document.getElementById('contribution-per-paycheck').value = account.contribution_per_paycheck || 0;
        document.getElementById('account-notes').value = account.notes || '';
        
        // Show/hide employer match section
        const accountType = account.account_type;
        const employerMatchSection = document.getElementById('employer-match-section');
        if (accountType === '401k' || accountType === '403b') {
            employerMatchSection.style.display = 'block';
        }
        
        showModal('retirement-account-modal');
        
    } catch (error) {
        console.error('Error loading account for editing:', error);
        showNotification('Failed to load account details', 'error');
    }
}

// Load income sources for dropdown
async function loadIncomeSources() {
    try {
        const response = await API.getIncome();
        if (!response.success) return;
        
        const incomeSources = response.income_sources || [];
        const select = document.getElementById('linked-income');
        
        if (!select) return;
        
        // Clear existing options except the first one
        select.innerHTML = '<option value="">Not linked to income</option>';
        
        // Add income sources
        incomeSources.forEach(income => {
            const option = document.createElement('option');
            option.value = income.id;
            option.textContent = `${income.source_name} (${income.earner_name || 'Unassigned'})`;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading income sources:', error);
    }
}

// Handle account form submit
async function handleRetirementAccountSubmit(e) {
    e.preventDefault();
    
    const accountData = {
        account_name: document.getElementById('account-name').value,
        account_type: document.getElementById('account-type').value,
        contribution_type: document.getElementById('contribution-type').value,
        annual_limit: parseFloat(document.getElementById('annual-limit').value),
        current_balance: parseFloat(document.getElementById('current-balance').value) || 0,
        employer_match_percent: parseFloat(document.getElementById('employer-match-percent').value) || 0,
        employer_match_limit: parseFloat(document.getElementById('employer-match-limit').value) || 0,
        linked_income_id: document.getElementById('linked-income').value || null,
        contribution_per_paycheck: parseFloat(document.getElementById('contribution-per-paycheck').value) || 0,
        notes: document.getElementById('account-notes').value
    };
    
    try {
        let response;
        if (currentEditAccountId) {
            response = await API.updateRetirementAccount(currentEditAccountId, accountData);
        } else {
            response = await API.addRetirementAccount(accountData);
        }
        
        if (!response.success) {
            throw new Error(response.error || 'Failed to save account');
        }
        
        showNotification(
            currentEditAccountId ? 'Retirement account updated successfully' : 'Retirement account added successfully',
            'success'
        );
        
        hideModal('retirement-account-modal');
        loadRetirementAccounts();
        
    } catch (error) {
        console.error('Error saving retirement account:', error);
        showNotification(error.message, 'error');
    }
}

// Handle delete account
async function handleDeleteAccount(accountId) {
    if (!confirm('Are you sure you want to delete this retirement account? This will also delete all contribution history.')) {
        return;
    }
    
    try {
        const response = await API.deleteRetirementAccount(accountId);
        
        if (!response.success) {
            throw new Error(response.error || 'Failed to delete account');
        }
        
        showNotification('Retirement account deleted successfully', 'success');
        loadRetirementAccounts();
        
    } catch (error) {
        console.error('Error deleting retirement account:', error);
        showNotification(error.message, 'error');
    }
}

// Open add contribution modal
function openAddContributionModal(accountId) {
    currentAccountForContribution = accountId;
    
    const modal = document.getElementById('contribution-modal');
    const form = document.getElementById('contribution-form');
    
    if (!modal || !form) return;
    
    form.reset();
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('contribution-date').value = today;
    
    showModal('contribution-modal');
}

// Handle contribution form submit
async function handleContributionSubmit(e) {
    e.preventDefault();
    
    if (!currentAccountForContribution) return;
    
    const contributionData = {
        date: document.getElementById('contribution-date').value,
        amount: parseFloat(document.getElementById('contribution-amount').value),
        contribution_type: document.getElementById('contribution-category').value,
        note: document.getElementById('contribution-note').value
    };
    
    try {
        const response = await API.addRetirementContribution(currentAccountForContribution, contributionData);
        
        if (!response.success) {
            throw new Error(response.error || 'Failed to add contribution');
        }
        
        showNotification('Contribution added successfully', 'success');
        hideModal('contribution-modal');
        loadRetirementAccounts();
        
    } catch (error) {
        console.error('Error adding contribution:', error);
        showNotification(error.message, 'error');
    }
}

// Open account detail modal with contribution history
async function openAccountDetailModal(accountId) {
    try {
        const response = await API.getRetirementAccounts();
        if (!response.success) {
            throw new Error(response.error || 'Failed to load account');
        }
        
        const account = response.accounts.find(acc => acc.id === accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        
        const modal = document.getElementById('account-detail-modal');
        const title = document.getElementById('account-detail-title');
        const content = document.getElementById('account-detail-content');
        
        if (!modal || !title || !content) return;
        
        title.textContent = account.account_name;
        
        const contributions = account.contributions || [];
        const sortedContributions = contributions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const accountTypeLabel = ACCOUNT_TYPE_LABELS[account.account_type] || account.account_type;
        const contributionTypeLabel = account.contribution_type === 'pre_tax' ? 'Pre-Tax' : 'Post-Tax';
        
        const detailHTML = `
            <div class="account-detail-summary">
                <div class="detail-row">
                    <span class="detail-label">Account Type:</span>
                    <span class="detail-value">${accountTypeLabel} (${contributionTypeLabel})</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Current Balance:</span>
                    <span class="detail-value">${formatCurrency(account.current_balance || 0)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Annual Limit:</span>
                    <span class="detail-value">${formatCurrency(account.annual_limit)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">YTD Contributions:</span>
                    <span class="detail-value">${formatCurrency(account.ytd_employee || 0)}</span>
                </div>
                ${account.ytd_employer > 0 ? `
                    <div class="detail-row">
                        <span class="detail-label">YTD Employer Match:</span>
                        <span class="detail-value">${formatCurrency(account.ytd_employer)}</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="contribution-history-section">
                <h4>Contribution History</h4>
                ${sortedContributions.length === 0 ? `
                    <div class="empty-state-small">
                        <p>No contributions recorded yet.</p>
                    </div>
                ` : `
                    <div class="contribution-history-list">
                        ${sortedContributions.map(contrib => `
                            <div class="contribution-item">
                                <div class="contribution-date">${new Date(contrib.date).toLocaleDateString()}</div>
                                <div class="contribution-info">
                                    <div class="contribution-type">${getContributionTypeLabel(contrib.contribution_type)}</div>
                                    ${contrib.note ? `<div class="contribution-note">${contrib.note}</div>` : ''}
                                </div>
                                <div class="contribution-amount">${formatCurrency(contrib.amount)}</div>
                                <button class="btn-icon btn-danger btn-small delete-contribution-btn" data-account-id="${accountId}" data-contribution-id="${contrib.id}" title="Delete">
                                    <span>🗑️</span>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
        
        content.innerHTML = detailHTML;
        
        // Attach delete handlers for contributions
        sortedContributions.forEach(contrib => {
            const deleteBtn = content.querySelector(`[data-contribution-id="${contrib.id}"]`);
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => handleDeleteContribution(accountId, contrib.id));
            }
        });
        
        showModal('account-detail-modal');
        
    } catch (error) {
        console.error('Error loading account details:', error);
        showNotification('Failed to load account details', 'error');
    }
}

// Get contribution type label
function getContributionTypeLabel(type) {
    const labels = {
        'employee': 'Employee Contribution',
        'employer_match': 'Employer Match',
        'bonus': 'Bonus/Additional',
        'rollover': 'Rollover'
    };
    return labels[type] || type;
}

// Handle delete contribution
async function handleDeleteContribution(accountId, contributionId) {
    if (!confirm('Are you sure you want to delete this contribution?')) {
        return;
    }
    
    try {
        const response = await API.deleteRetirementContribution(accountId, contributionId);
        
        if (!response.success) {
            throw new Error(response.error || 'Failed to delete contribution');
        }
        
        showNotification('Contribution deleted successfully', 'success');
        
        // Reload the detail modal
        hideModal('account-detail-modal');
        loadRetirementAccounts();
        
    } catch (error) {
        console.error('Error deleting contribution:', error);
        showNotification(error.message, 'error');
    }
}
