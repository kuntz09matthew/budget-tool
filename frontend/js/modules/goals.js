// Financial Goals Module
import { injectTab } from '../templates.js';

// Goals Tab HTML Template
const goalsHTML = `
    <div class="section-header">
        <h2>Financial Goals</h2>
        <button class="btn-primary" id="add-goal-btn">+ Add Goal</button>
    </div>
    
    <div id="goals-list">
        <p class="coming-soon">Goals tracking feature coming soon...</p>
    </div>
`;

export function init() {
    console.log('Initializing Goals module...');
    injectTab('goals', goalsHTML);
}
