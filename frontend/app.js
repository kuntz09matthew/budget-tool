// Base URL for API calls - always use localhost:5000
const API_BASE_URL = 'http://localhost:5000';

// Check server health on load
async function checkServerHealth() {
    const statusElement = document.getElementById('server-status');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        const data = await response.json();
        
        if (data.status) {
            statusElement.textContent = `${data.status} (${data.backend})`;
            statusElement.className = 'status-ok';
            loadBudgetData();
            checkForUpdates();
        }
    } catch (error) {
        statusElement.textContent = 'Server offline';
        statusElement.className = 'status-error';
        console.error('Server health check failed:', error);
    }
}

// Load budget data
async function loadBudgetData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/budget`);
        const data = await response.json();
        
        // Update transaction count
        document.getElementById('transaction-count').textContent = data.transactions?.length || 0;
        
        // Update category count
        document.getElementById('category-count').textContent = data.categories?.length || 0;
    } catch (error) {
        console.error('Failed to load budget data:', error);
    }
}

// Python auto-updater
let installerPath = null;

async function checkForUpdates() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/updates/check`);
        const data = await response.json();
        
        if (data.available) {
            showUpdateBanner(data);
        }
    } catch (error) {
        console.log('Update check failed:', error);
    }
}

function showUpdateBanner(updateInfo) {
    const updateBanner = document.getElementById('update-banner');
    const updateMessage = document.getElementById('update-message');
    const updateButton = document.getElementById('update-button');
    
    updateBanner.style.display = 'block';
    updateMessage.innerHTML = `
        🎉 New version available: <strong>v${updateInfo.latest}</strong>
        <br>Current version: v${updateInfo.current}
    `;
    updateButton.style.display = 'inline-block';
    updateButton.textContent = 'Download & Install';
    
    updateButton.onclick = async () => {
        updateButton.disabled = true;
        updateButton.textContent = 'Downloading...';
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/updates/download`, { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                installerPath = result.path;
                updateMessage.innerHTML = `
                    ✅ Update downloaded!
                    <br><small>Saved to: ${installerPath}</small>
                `;
                updateButton.textContent = 'Install & Restart';
                updateButton.disabled = false;
                updateButton.onclick = installUpdate;
            } else {
                updateMessage.textContent = '❌ Download failed. Please try again.';
                updateButton.disabled = false;
                updateButton.textContent = 'Retry';
            }
        } catch (error) {
            console.error('Download error:', error);
            updateMessage.textContent = '❌ Download failed. Please try again.';
            updateButton.disabled = false;
        }
    };
}

async function installUpdate() {
    if (!installerPath) return;
    
    try {
        await fetch(`${API_BASE_URL}/api/updates/install`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: installerPath })
        });
        
        // App will close automatically
        document.getElementById('update-message').textContent = 'Installing update...';
    } catch (error) {
        console.error('Install error:', error);
    }
}

// Handle Electron update events (if running in Electron - legacy support)
if (window.electron) {
    const updateBanner = document.getElementById('update-banner');
    const updateMessage = document.getElementById('update-message');
    const updateButton = document.getElementById('update-button');
    
    window.electron.onUpdateAvailable(() => {
        updateBanner.style.display = 'block';
        updateMessage.textContent = '⏳ Update available! Downloading...';
    });
    
    window.electron.onUpdateDownloaded(() => {
        updateMessage.textContent = '✅ Update downloaded! Click to restart and install.';
        updateButton.style.display = 'inline-block';
    });
    
    updateButton.addEventListener('click', () => {
        window.electron.restartApp();
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkServerHealth();
    
    // Refresh data every 30 seconds
    setInterval(loadBudgetData, 30000);
});
