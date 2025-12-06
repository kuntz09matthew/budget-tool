// Reports and Analytics Module
import { injectTab } from '../templates.js';

// Reports Tab HTML Template
const reportsHTML = `
    <div class="section-header">
        <h2>Reports & Analytics</h2>
    </div>
    
    <div id="reports-container">
        <p class="coming-soon">Reports and analytics features coming soon...</p>
    </div>
`;

export function init() {
    console.log('Initializing Reports module...');
    injectTab('reports', reportsHTML);
}
