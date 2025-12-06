// Configuration and Constants
export const API_BASE_URL = 'http://localhost:5000/api';

export const CHART_COLORS = {
    primary: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
    dark: {
        text: '#e5e7eb',
        grid: '#374151',
        background: 'rgba(31, 41, 55, 0.8)'
    },
    light: {
        text: '#1f2937',
        grid: '#d1d5db',
        background: 'rgba(255, 255, 255, 0.8)'
    }
};

export const ACCOUNT_TYPES = {
    checking: { icon: '💳', label: 'Checking' },
    savings: { icon: '🏦', label: 'Savings' },
    credit: { icon: '💳', label: 'Credit Card' },
    investment: { icon: '📈', label: 'Investment' }
};

export const INCOME_TYPES = {
    salary: { icon: '💼', label: 'Salary/Wages' },
    freelance: { icon: '💻', label: 'Freelance' },
    business: { icon: '🏢', label: 'Business Income' },
    rental: { icon: '🏠', label: 'Rental Income' },
    investment: { icon: '📈', label: 'Investment Income' },
    pension: { icon: '👴', label: 'Pension/Retirement' },
    other: { icon: '💵', label: 'Other Income' }
};

export const EXPENSE_CATEGORIES = {
    housing: { icon: '🏠', label: 'Housing (Rent/Mortgage)' },
    utilities: { icon: '💡', label: 'Utilities (Electric, Gas, Water)' },
    internet: { icon: '🌐', label: 'Internet & Phone' },
    insurance: { icon: '🛡️', label: 'Insurance' },
    transportation: { icon: '🚗', label: 'Transportation (Car Payment, Gas)' },
    debt: { icon: '💳', label: 'Debt Payments' },
    subscriptions: { icon: '📺', label: 'Subscriptions & Memberships' },
    childcare: { icon: '👶', label: 'Childcare & Education' },
    other: { icon: '📝', label: 'Other Fixed Expense' }
};

export const FREQUENCY_MULTIPLIERS = {
    weekly: 52 / 12,
    biweekly: 26 / 12,
    semimonthly: 2,
    monthly: 1,
    quarterly: 1 / 3,
    semiannual: 1 / 6,
    annual: 1 / 12
};
