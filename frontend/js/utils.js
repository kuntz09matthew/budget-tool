// Utility Functions

/**
 * Format currency values
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

/**
 * Format date to short format (e.g., "Jan 15")
 */
export function formatDateShort(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format date to full format (e.g., "January 15, 2025")
 */
export function formatDateFull(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Get current date formatted
 */
export function getCurrentDate() {
    return new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

/**
 * Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
 */
export function ordinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return num + 'st';
    if (j === 2 && k !== 12) return num + 'nd';
    if (j === 3 && k !== 13) return num + 'rd';
    return num + 'th';
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Calculate monthly amount based on frequency
 */
export function calculateMonthlyAmount(amount, frequency) {
    const multipliers = {
        weekly: 52 / 12,
        biweekly: 26 / 12,
        semimonthly: 2,
        monthly: 1,
        quarterly: 1 / 3,
        semiannual: 1 / 6,
        annual: 1 / 12
    };
    
    return amount * (multipliers[frequency] || 1);
}

/**
 * Calculate net income (take-home pay)
 */
export function calculateNetIncome(grossAmount, federalTax, stateTax, socialSecurity, medicare, otherDeductions) {
    const federal = parseFloat(federalTax) || 0;
    const state = parseFloat(stateTax) || 0;
    const ss = parseFloat(socialSecurity) || 0;
    const med = parseFloat(medicare) || 0;
    const other = parseFloat(otherDeductions) || 0;
    
    const totalDeductions = federal + state + ss + med + other;
    const netIncome = grossAmount - totalDeductions;
    
    return {
        netIncome,
        totalDeductions,
        deductions: {
            federal,
            state,
            socialSecurity: ss,
            medicare: med,
            other
        }
    };
}

/**
 * Show notification toast
 */
export function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Update element text content safely
 */
export function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

/**
 * Get theme-aware chart colors
 */
export function getChartColors() {
    const theme = document.querySelector('.app').getAttribute('data-theme');
    const isDark = theme === 'dark';
    
    return {
        text: isDark ? '#e5e7eb' : '#1f2937',
        grid: isDark ? '#374151' : '#d1d5db',
        background: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)'
    };
}

/**
 * Debounce function for performance
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Deep clone an object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if element is visible in viewport
 */
export function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}
