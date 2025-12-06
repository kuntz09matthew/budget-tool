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
    
    // Setup Electron update handlers if available
    setupElectronUpdates();
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
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    const progressSize = document.getElementById('progress-size');
    
    window.electron.onUpdateAvailable(() => {
        updateBanner.style.display = 'block';
        updateMessage.textContent = '🎉 Update available! Preparing download...';
    });
    
    window.electron.onUpdateDownloading(() => {
        updateMessage.textContent = '⬇️ Downloading update...';
        progressContainer.style.display = 'block';
    });
    
    window.electron.onUpdateDownloadProgress((progress) => {
        const percent = Math.round(progress.percent);
        const transferred = (progress.transferred / 1024 / 1024).toFixed(2);
        const total = (progress.total / 1024 / 1024).toFixed(2);
        
        progressBar.style.width = percent + '%';
        progressPercent.textContent = percent + '%';
        progressSize.textContent = `${transferred} MB / ${total} MB`;
    });
    
    window.electron.onUpdateDownloaded(() => {
        progressContainer.style.display = 'none';
        updateMessage.textContent = '✅ Update downloaded! Click to restart and install.';
        updateButton.style.display = 'inline-block';
    });
    
    updateButton.addEventListener('click', () => {
        window.electron.installUpdate();
    });
}

// Navigation handling
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.welcome-section, .budget-section, .next-steps, .status-section').forEach(el => {
        el.style.display = 'none';
    });
    
    // Update nav button states
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    if (section === 'home') {
        document.querySelector('.welcome-section').style.display = 'block';
        document.querySelector('.budget-section').style.display = 'block';
        document.querySelector('.next-steps').style.display = 'block';
        document.getElementById('menu-home').classList.add('active');
    } else if (section === 'status') {
        document.getElementById('status-section').style.display = 'block';
        document.getElementById('menu-status').classList.add('active');
        checkServerHealth(); // Refresh status when viewing
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkServerHealth();
    
    // Refresh data every 30 seconds
    setInterval(loadBudgetData, 30000);
    
    // Navigation event listeners
    document.getElementById('menu-home').addEventListener('click', () => showSection('home'));
    document.getElementById('menu-status').addEventListener('click', () => showSection('status'));
    
    // Refresh status button
    document.getElementById('refresh-status').addEventListener('click', () => {
        checkServerHealth();
    });
    
    // Show home section by default
    showSection('home');
});

// Electron Update Handlers
function setupElectronUpdates() {
    // Check if running in Electron
    if (typeof window.electron === 'undefined') {
        console.log('Not running in Electron, skipping update setup');
        return;
    }
    
    console.log('Setting up Electron update handlers...');
    
    // Listen for update download progress
    window.electron.onUpdateDownloadProgress((progress) => {
        console.log('Download progress:', progress);
        showUpdateProgress(progress);
    });
    
    // Listen for update downloaded
    window.electron.onUpdateDownloaded((info) => {
        console.log('Update downloaded:', info);
        showUpdateReady(info);
    });
    
    // Listen for update errors
    window.electron.onUpdateError((error) => {
        console.error('Update error:', error);
        showUpdateError(error);
    });
}

function showUpdateProgress(progress) {
    const updateBanner = document.getElementById('update-banner');
    const updateMessage = document.getElementById('update-message');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    const progressSize = document.getElementById('progress-size');
    const updateButton = document.getElementById('update-button');
    
    // Show banner and progress
    updateBanner.style.display = 'block';
    progressContainer.style.display = 'block';
    updateButton.style.display = 'none';
    
    // Update progress bar
    const percent = Math.round(progress.percent) || 0;
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    
    // Update size info
    if (progress.transferredMB && progress.totalMB) {
        progressSize.textContent = `${progress.transferredMB} MB / ${progress.totalMB} MB`;
        if (progress.speedMB) {
            progressSize.textContent += ` @ ${progress.speedMB} MB/s`;
        }
    } else {
        progressSize.textContent = 'Downloading...';
    }
    
    updateMessage.innerHTML = `
        <strong>📥 Downloading Update...</strong>
        <br><small>Please wait while the update is being downloaded.</small>
    `;
}

function showUpdateReady(info) {
    const updateBanner = document.getElementById('update-banner');
    const updateMessage = document.getElementById('update-message');
    const progressContainer = document.getElementById('progress-container');
    const updateButton = document.getElementById('update-button');
    
    // Hide progress, show button
    progressContainer.style.display = 'none';
    updateButton.style.display = 'inline-block';
    updateButton.textContent = 'Restart & Install';
    
    updateMessage.innerHTML = `
        <strong>✅ Update Downloaded!</strong>
        <br><small>Version ${info.version} is ready to install.</small>
    `;
    
    updateButton.onclick = () => {
        if (window.electron && window.electron.installUpdate) {
            window.electron.installUpdate();
        }
    };
}

function showUpdateError(error) {
    const updateBanner = document.getElementById('update-banner');
    const updateMessage = document.getElementById('update-message');
    const progressContainer = document.getElementById('progress-container');
    const updateButton = document.getElementById('update-button');
    
    progressContainer.style.display = 'none';
    updateButton.style.display = 'none';
    
    updateMessage.innerHTML = `
        <strong>❌ Update Failed</strong>
        <br><small>${error}</small>
    `;
    
    // Hide banner after 10 seconds
    setTimeout(() => {
        updateBanner.style.display = 'none';
    }, 10000);
}
