// Savings Accounts Module
import { injectTab } from '../templates.js';

// Savings Tab HTML Template
const savingsHTML = `
    <div class="section-header">
        <h2>Savings Accounts</h2>
        <button class="btn-primary" id="add-savings-btn">+ Add Savings Account</button>
    </div>
    
    <div id="savings-accounts-list">
        <p class="coming-soon">Savings accounts feature coming soon...</p>
    </div>
`;

export function init() {
    console.log('Initializing Savings module...');
    injectTab('savings', savingsHTML);
}
