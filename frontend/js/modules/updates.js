// Auto-Update Module
import { setState, getState } from '../state.js';

let installerPath = null;

/**
 * Initialize updates module
 */
export function init() {
    console.log('Initializing Updates module...');
    setupElectronUpdates();
}

/**
 * Setup Electron update handlers
 */
function setupElectronUpdates() {
    if (!window.electron) {
        console.log('Not running in Electron, skipping update setup');
        return;
    }
    
    // Listen for update available
    window.electron.on('update-available', (info) => {
        console.log('Update available:', info);
        showUpdateBanner(info);
    });
    
    // Listen for download progress
    window.electron.on('download-progress', (progress) => {
        showUpdateProgress(progress);
    });
    
    // Listen for update downloaded
    window.electron.on('update-downloaded', (info) => {
        console.log('Update downloaded:', info);
        showUpdateReady(info);
    });
    
    // Listen for update error
    window.electron.on('update-error', (error) => {
        console.error('Update error:', error);
        showUpdateError(error);
    });
    
    // Setup update button click handler
    const updateButton = document.getElementById('update-button');
    if (updateButton) {
        updateButton.addEventListener('click', () => {
            window.electron.send('quit-and-install');
        });
    }
}

/**
 * Show update banner
 */
function showUpdateBanner(updateInfo) {
    const banner = document.getElementById('update-banner');
    const message = document.getElementById('update-message');
    
    if (!banner || !message) return;
    
    message.textContent = `A new version (${updateInfo.version}) is available! Downloading...`;
    banner.style.display = 'block';
    banner.className = 'update-banner update-info';
}

/**
 * Show update progress
 */
function showUpdateProgress(progress) {
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    const progressSize = document.getElementById('progress-size');
    
    if (!progressContainer) return;
    
    progressContainer.style.display = 'block';
    
    if (progressBar) {
        progressBar.style.width = `${progress.percent}%`;
    }
    
    if (progressPercent) {
        progressPercent.textContent = `${Math.round(progress.percent)}%`;
    }
    
    if (progressSize) {
        const transferredMB = (progress.transferred / 1024 / 1024).toFixed(1);
        const totalMB = (progress.total / 1024 / 1024).toFixed(1);
        progressSize.textContent = `${transferredMB} MB / ${totalMB} MB`;
    }
}

/**
 * Show update ready
 */
function showUpdateReady(info) {
    const banner = document.getElementById('update-banner');
    const message = document.getElementById('update-message');
    const progressContainer = document.getElementById('progress-container');
    const updateButton = document.getElementById('update-button');
    
    if (!banner || !message) return;
    
    message.textContent = `Update downloaded! Version ${info.version} is ready to install.`;
    banner.className = 'update-banner update-success';
    
    if (progressContainer) {
        progressContainer.style.display = 'none';
    }
    
    if (updateButton) {
        updateButton.style.display = 'block';
        updateButton.textContent = 'Restart & Update';
    }
}

/**
 * Show update error
 */
function showUpdateError(error) {
    const banner = document.getElementById('update-banner');
    const message = document.getElementById('update-message');
    const progressContainer = document.getElementById('progress-container');
    
    if (!banner || !message) return;
    
    message.textContent = `Update failed: ${error.message || 'Unknown error'}`;
    banner.className = 'update-banner update-error';
    
    if (progressContainer) {
        progressContainer.style.display = 'none';
    }
    
    // Auto-hide error after 10 seconds
    setTimeout(() => {
        banner.style.display = 'none';
    }, 10000);
}
