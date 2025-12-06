// HTML Templates Module
// This module contains all HTML templates and handles DOM injection

/**
 * Inject all tab content containers into the DOM
 */
export function initializeTabContainers() {
    const container = document.getElementById('tabs-container');
    if (!container) return;
    
    // Clear any existing content
    container.innerHTML = '';
    
    // Dashboard will inject its own content
    // Other tabs will inject their own content
    // This keeps the main HTML file clean
}

/**
 * Inject all modal containers into the DOM
 */
export function initializeModalContainers() {
    const container = document.getElementById('modals-container');
    if (!container) return;
    
    // Clear any existing content
    container.innerHTML = '';
    
    // Modals will be injected by their respective modules
}

/**
 * Create a tab content container
 */
export function createTabContainer(tabId, isActive = false) {
    const activeClass = isActive ? ' active' : '';
    const container = document.createElement('div');
    container.id = `tab-${tabId}`;
    container.className = `tab-content${activeClass}`;
    return container;
}

/**
 * Inject a tab into the DOM
 */
export function injectTab(tabId, htmlContent, isActive = false) {
    const tabsContainer = document.getElementById('tabs-container');
    if (!tabsContainer) {
        console.error('tabs-container not found!');
        return;
    }
    
    const container = createTabContainer(tabId, isActive);
    container.innerHTML = htmlContent;
    tabsContainer.appendChild(container);
}

/**
 * Inject a modal into the DOM
 */
export function injectModal(modalId, htmlContent) {
    const modalsContainer = document.getElementById('modals-container');
    if (!modalsContainer) return;
    
    const modalWrapper = document.createElement('div');
    modalWrapper.innerHTML = htmlContent;
    modalsContainer.appendChild(modalWrapper.firstElementChild);
}

/**
 * Update tab content (for dynamic updates)
 */
export function updateTabContent(tabId, htmlContent) {
    const tab = document.getElementById(`tab-${tabId}`);
    if (tab) {
        tab.innerHTML = htmlContent;
    }
}
