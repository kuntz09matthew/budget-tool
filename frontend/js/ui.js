// Core UI Functions (tabs, theme, modals, navigation)
import { getState, setState, setTheme, getTheme } from './state.js';
import { getCurrentDate } from './utils.js';

/**
 * Initialize theme
 */
export function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    updateThemeIcon(savedTheme);
}

/**
 * Setup theme toggle
 */
export function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');
    
    if (!themeToggle) return;
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = getTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        updateThemeIcon(newTheme);
        
        // Emit event for charts to update
        window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: newTheme } }));
    });
}

/**
 * Update theme icon
 */
function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

/**
 * Setup main tab navigation
 */
export function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

/**
 * Switch to a specific tab
 */
export function switchTab(tabName) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Remove active class from all
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to selected
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`tab-${tabName}`);
    
    if (activeButton) activeButton.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
    
    // Update state
    setState('currentTab', tabName);
    
    // Setup sub-tabs for the new tab
    setupSubTabs(tabName);
    
    // Emit tab change event
    window.dispatchEvent(new CustomEvent('tabChange', { detail: { tab: tabName } }));
}

/**
 * Setup sub-tab navigation
 */
export function setupSubTabs(parentTab) {
    const parentTabElement = document.getElementById(`tab-${parentTab}`);
    if (!parentTabElement) return;
    
    const subTabButtons = parentTabElement.querySelectorAll('.sub-tab-btn');
    const subTabContents = parentTabElement.querySelectorAll('.sub-tab-content');
    const descriptionElement = parentTabElement.querySelector('.sub-tab-description');
    
    if (subTabButtons.length === 0) return;
    
    subTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const subTabName = button.getAttribute('data-subtab');
            
            // Remove active class from all
            subTabButtons.forEach(btn => btn.classList.remove('active'));
            subTabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to selected
            button.classList.add('active');
            const activeSubContent = parentTabElement.querySelector(`#${subTabName}`);
            if (activeSubContent) {
                activeSubContent.classList.add('active');
            }
            
            // Update description
            if (descriptionElement) {
                updateSubTabDescription(subTabName, descriptionElement);
            }
            
            // Update state
            setState('currentSubTab', subTabName);
            
            // Emit sub-tab change event
            window.dispatchEvent(new CustomEvent('subTabChange', { 
                detail: { parentTab, subTab: subTabName } 
            }));
        });
    });
    
    // Activate first sub-tab by default
    if (subTabButtons.length > 0) {
        subTabButtons[0].click();
    }
}

/**
 * Update sub-tab description
 */
function updateSubTabDescription(subTabName, descriptionElement) {
    const button = document.querySelector(`[data-subtab="${subTabName}"]`);
    if (button && descriptionElement) {
        const tooltip = button.getAttribute('data-tooltip');
        descriptionElement.textContent = tooltip || '';
    }
}

/**
 * Update dashboard date display
 */
export function updateDashboardDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.textContent = getCurrentDate();
    }
}

/**
 * Show loading state
 */
export function showLoading(containerId, message = 'Loading...') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
    }
}

/**
 * Show error state
 */
export function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="error-state">
                <span class="error-icon">⚠️</span>
                <p>${message}</p>
                <button class="btn-secondary" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

/**
 * Show empty state
 */
export function showEmptyState(containerId, icon, message, actionButton = null) {
    const container = document.getElementById(containerId);
    if (container) {
        let html = `
            <div class="empty-state">
                <span class="empty-icon">${icon}</span>
                <p>${message}</p>
        `;
        
        if (actionButton) {
            html += `<button class="btn-primary" onclick="${actionButton.action}">${actionButton.text}</button>`;
        }
        
        html += '</div>';
        container.innerHTML = html;
    }
}

/**
 * Modal management
 */
export function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

export function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

export function setupModalClose(modalId, closeButtonId) {
    const modal = document.getElementById(modalId);
    const closeButton = document.getElementById(closeButtonId);
    
    if (closeButton) {
        closeButton.addEventListener('click', () => hideModal(modalId));
    }
    
    if (modal) {
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modalId);
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                hideModal(modalId);
            }
        });
    }
}

/**
 * Navigate to section (from external triggers like menu)
 */
export function showSection(section) {
    const tabMap = {
        dashboard: 'dashboard',
        income: 'income',
        expenses: 'expenses',
        spending: 'spending',
        savings: 'savings',
        goals: 'goals',
        reports: 'reports',
        settings: 'dashboard'
    };
    
    const tab = tabMap[section] || 'dashboard';
    switchTab(tab);
}
