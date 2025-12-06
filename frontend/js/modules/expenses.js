// Expense Management Module
import * as API from '../api.js';
import { formatCurrency, showNotification, ordinalSuffix } from '../utils.js';
import { showLoading, showError, showModal, hideModal } from '../ui.js';
import { injectTab, injectModal } from '../templates.js';

let currentEditExpenseId = null;

// Expenses Tab HTML Template
const expensesHTML = `
    <div class="section-header">
        <h2>Monthly Fixed Expenses</h2>
        <button class="btn-primary" id="add-expense-btn">+ Add Expense</button>
    </div>
    
    <div class="expense-summary" id="expense-summary">
        <div class="summary-card">
            <h3>Total Monthly Expenses</h3>
            <p class="summary-amount" id="total-monthly-expenses">$0.00</p>
        </div>
    </div>
    
    <div id="expenses-list"></div>
`;

// Expense Modal HTML Template
const expenseModalHTML = `
    <div id="expense-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="expense-modal-title">Add Fixed Expense</h3>
                <button class="modal-close" id="close-expense-modal">&times;</button>
            </div>
            <form id="expense-form">
                <div class="form-group">
                    <label for="expense-category">Category</label>
                    <select id="expense-category" required>
                        <option value="">Select category...</option>
                        <option value="housing">🏠 Housing (Rent/Mortgage)</option>
                        <option value="utilities">💡 Utilities (Electric, Gas, Water)</option>
                        <option value="internet">🌐 Internet & Phone</option>
                        <option value="insurance">🛡️ Insurance</option>
                        <option value="transportation">🚗 Transportation (Car Payment, Gas)</option>
                        <option value="debt">💳 Debt Payments</option>
                        <option value="subscriptions">📺 Subscriptions & Memberships</option>
                        <option value="childcare">👶 Childcare & Education</option>
                        <option value="other">📝 Other Fixed Expense</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="expense-name">Expense Name</label>
                    <input type="text" id="expense-name" placeholder="e.g., Mortgage Payment, Electric Bill" required>
                </div>
                <div class="form-group">
                    <label for="expense-amount">Monthly Amount</label>
                    <input type="number" id="expense-amount" placeholder="0.00" step="0.01" required>
                </div>
                <div class="form-group">
                    <label for="expense-due-date">Due Date (Day of Month)</label>
                    <input type="number" id="expense-due-date" placeholder="e.g., 15" min="1" max="31">
                </div>
                <div class="form-group checkbox-group">
                    <label>
                        <input type="checkbox" id="expense-autopay">
                        <span>Auto-pay enabled</span>
                    </label>
                </div>
                <div class="form-group">
                    <label for="expense-notes">Notes (Optional)</label>
                    <textarea id="expense-notes" placeholder="Additional details about this expense..." rows="3"></textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" id="cancel-expense-btn">Cancel</button>
                    <button type="submit" class="btn-primary" id="save-expense-btn">Save Expense</button>
                </div>
            </form>
        </div>
    </div>
`;

/**
 * Initialize expense module
 */
export function init() {
    console.log('Initializing Expense module...');
    
    // Inject HTML templates
    injectTab('expenses', expensesHTML);
    injectModal('expense-modal', expenseModalHTML);
    
    // Setup event listeners
    setupEventListeners();
}

/**
 * Setup expense-specific event listeners
 */
function setupEventListeners() {
    // Listen for tab changes
    window.addEventListener('tabChange', (e) => {
        if (e.detail.tab === 'expenses') {
            loadExpenses();
        }
    });
    
    // Setup add expense button
    const addExpenseBtn = document.getElementById('add-expense-btn');
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => showExpenseModal());
    }
}

/**
 * Load and display expenses
 */
export async function loadExpenses() {
    const container = document.getElementById('expenses-list');
    if (!container) return;
    
    showLoading('expenses-list', 'Loading expenses...');
    
    try {
        const expenses = await API.getExpenses();
        displayExpenses(expenses);
    } catch (error) {
        console.error('Error loading expenses:', error);
        showError('expenses-list', 'Failed to load expenses');
    }
}

/**
 * Display expenses
 */
function displayExpenses(expenses) {
    const container = document.getElementById('expenses-list');
    if (!container) return;
    
    if (expenses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📝</span>
                <p>No fixed expenses yet. Add your first expense!</p>
                <button class="btn-primary" onclick="BudgetApp.modules.Expenses.showExpenseModal()">Add Expense</button>
            </div>
        `;
        return;
    }
    
    let html = '<div class="expenses-grid">';
    expenses.forEach(expense => {
        html += `
            <div class="expense-card">
                <div class="expense-header">
                    <span class="expense-icon">${getExpenseIcon(expense.category)}</span>
                    <h4>${expense.name}</h4>
                </div>
                <div class="expense-amount">${formatCurrency(expense.amount)}</div>
                ${expense.dueDate ? `<div class="expense-due">Due: ${ordinalSuffix(expense.dueDate)}</div>` : ''}
                ${expense.autopay ? '<span class="autopay-badge">Auto-pay</span>' : ''}
                <div class="expense-actions">
                    <button class="btn-icon" onclick="BudgetApp.modules.Expenses.editExpense('${expense.id}')">✏️</button>
                    <button class="btn-icon" onclick="BudgetApp.modules.Expenses.deleteExpense('${expense.id}')">🗑️</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

/**
 * Get icon for expense category
 */
function getExpenseIcon(category) {
    const icons = {
        housing: '🏠',
        utilities: '💡',
        internet: '🌐',
        insurance: '🛡️',
        transportation: '🚗',
        debt: '💳',
        subscriptions: '📺',
        childcare: '👶',
        other: '📝'
    };
    return icons[category] || '📝';
}

/**
 * Show expense modal
 */
export function showExpenseModal(expenseId = null) {
    currentEditExpenseId = expenseId;
    
    const modal = document.getElementById('expense-modal');
    const title = document.getElementById('expense-modal-title');
    
    if (expenseId) {
        title.textContent = 'Edit Fixed Expense';
        // Load expense data
    } else {
        title.textContent = 'Add Fixed Expense';
        document.getElementById('expense-form').reset();
    }
    
    showModal('expense-modal');
}

/**
 * Edit expense
 */
export function editExpense(expenseId) {
    showExpenseModal(expenseId);
}

/**
 * Delete expense
 */
export async function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    try {
        await API.deleteExpense(expenseId);
        showNotification('Expense deleted successfully', 'success');
        loadExpenses();
    } catch (error) {
        console.error('Error deleting expense:', error);
        showNotification('Failed to delete expense', 'error');
    }
}
