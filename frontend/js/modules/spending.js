// Spending Accounts Module
import { injectTab } from '../templates.js';

// Spending Tab HTML Template
const spendingHTML = `
    <div class="section-header">
        <h2>Spending Accounts</h2>
        <button class="btn-primary" id="add-spending-btn">+ Add Spending Account</button>
    </div>
    
    <div id="spending-accounts-list">
        <p class="coming-soon">Spending accounts feature coming soon...</p>
    </div>
`;

export function init() {
    console.log('Initializing Spending module...');
    injectTab('spending', spendingHTML);
}
