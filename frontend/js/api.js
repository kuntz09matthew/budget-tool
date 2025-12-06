// API Communication Layer
import { API_BASE_URL } from './config.js';

/**
 * Generic fetch wrapper with error handling
 */
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API request failed: ${endpoint}`, error);
        throw error;
    }
}

// Health Check
export async function checkServerHealth() {
    return apiRequest('/health');
}

// Account APIs
export async function getAccounts() {
    return apiRequest('/accounts');
}

export async function getAccountSummary() {
    return apiRequest('/accounts/summary');
}

export async function getAccount(id) {
    return apiRequest(`/accounts/${id}`);
}

export async function createAccount(accountData) {
    return apiRequest('/accounts', {
        method: 'POST',
        body: JSON.stringify(accountData)
    });
}

export async function updateAccount(id, accountData) {
    return apiRequest(`/accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(accountData)
    });
}

export async function deleteAccount(id) {
    return apiRequest(`/accounts/${id}`, {
        method: 'DELETE'
    });
}

// Income APIs
export async function getIncomeSources() {
    return apiRequest('/income');
}

export async function getTotalIncome() {
    return apiRequest('/income/total');
}

export async function getIncomeSource(id) {
    return apiRequest(`/income/${id}`);
}

export async function createIncomeSource(incomeData) {
    return apiRequest('/income', {
        method: 'POST',
        body: JSON.stringify(incomeData)
    });
}

export async function updateIncomeSource(id, incomeData) {
    return apiRequest(`/income/${id}`, {
        method: 'PUT',
        body: JSON.stringify(incomeData)
    });
}

export async function deleteIncomeSource(id) {
    return apiRequest(`/income/${id}`, {
        method: 'DELETE'
    });
}

export async function recordIncomePayment(id, paymentData) {
    return apiRequest(`/income/${id}/payment`, {
        method: 'POST',
        body: JSON.stringify(paymentData)
    });
}

export async function deleteIncomePayment(incomeId, paymentId) {
    return apiRequest(`/income/${incomeId}/payment/${paymentId}`, {
        method: 'DELETE'
    });
}

export async function getIncomeAnalysis(id) {
    return apiRequest(`/income/${id}/analysis`);
}

export async function getIncomeTrends(months = 6) {
    return apiRequest(`/income/trends?months=${months}`);
}

export async function getIncomeYearOverYear() {
    return apiRequest('/income/year-over-year');
}

// Expense APIs
export async function getExpenses() {
    return apiRequest('/expenses');
}

export async function getTotalExpenses() {
    return apiRequest('/expenses/total');
}

export async function getExpense(id) {
    return apiRequest(`/expenses/${id}`);
}

export async function createExpense(expenseData) {
    return apiRequest('/expenses', {
        method: 'POST',
        body: JSON.stringify(expenseData)
    });
}

export async function updateExpense(id, expenseData) {
    return apiRequest(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(expenseData)
    });
}

export async function deleteExpense(id) {
    return apiRequest(`/expenses/${id}`, {
        method: 'DELETE'
    });
}

export async function getUpcomingBills(days = 7) {
    return apiRequest(`/dashboard/upcoming-bills?days=${days}`);
}

// Dashboard APIs
export async function getAvailableSpending() {
    return apiRequest('/dashboard/available-spending');
}

export async function getMonthToDateSpending() {
    return apiRequest('/dashboard/mtd-spending');
}

export async function getSpendingVelocity() {
    return apiRequest('/dashboard/spending-velocity');
}

export async function getNextPaycheckCountdown() {
    return apiRequest('/dashboard/next-paycheck');
}

export async function getOverdraftWarning() {
    return apiRequest('/dashboard/overdraft-warning');
}

export async function getMoneyLeftPerDay() {
    return apiRequest('/dashboard/money-per-day');
}

export async function getBudgetHealthScore() {
    return apiRequest('/dashboard/health-score');
}

export async function getMonthComparison() {
    return apiRequest('/dashboard/month-comparison');
}

export async function getSpendingPatterns() {
    return apiRequest('/dashboard/spending-patterns');
}

export async function getSmartRecommendations() {
    return apiRequest('/dashboard/recommendations');
}

// Tax APIs
export async function getTaxEstimate(filingStatus, taxYear) {
    return apiRequest(`/tax/estimate?filing_status=${filingStatus}&tax_year=${taxYear}`);
}

// Retirement APIs
export async function getRetirementAccounts() {
    return apiRequest('/retirement/accounts');
}

export async function createRetirementAccount(accountData) {
    return apiRequest('/retirement/accounts', {
        method: 'POST',
        body: JSON.stringify(accountData)
    });
}

export async function updateRetirementAccount(id, accountData) {
    return apiRequest(`/retirement/accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(accountData)
    });
}

export async function deleteRetirementAccount(id) {
    return apiRequest(`/retirement/accounts/${id}`, {
        method: 'DELETE'
    });
}
