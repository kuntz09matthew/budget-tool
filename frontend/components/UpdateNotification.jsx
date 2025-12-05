/**
 * Update Notification Component
 * 
 * Add this to your React frontend to show update notifications to users.
 * This is optional - the Electron dialogs will still work without this.
 */

// Example React component
import React, { useState, useEffect } from 'react';

export function UpdateNotification() {
  const [updateState, setUpdateState] = useState({
    available: false,
    downloading: false,
    downloaded: false,
    progress: 0,
    version: '',
    error: null
  });

  useEffect(() => {
    // Check if electron API is available
    if (!window.electron) return;

    // Listen for update available
    window.electron.onUpdateAvailable((info) => {
      setUpdateState(prev => ({
        ...prev,
        available: true,
        version: info.version
      }));
    });

    // Listen for download start
    window.electron.onUpdateDownloading(() => {
      setUpdateState(prev => ({
        ...prev,
        downloading: true
      }));
    });

    // Listen for download progress
    window.electron.onUpdateDownloadProgress((progress) => {
      setUpdateState(prev => ({
        ...prev,
        progress: Math.round(progress.percent)
      }));
    });

    // Listen for download complete
    window.electron.onUpdateDownloaded((info) => {
      setUpdateState(prev => ({
        ...prev,
        downloaded: true,
        downloading: false,
        version: info.version
      }));
    });

    // Listen for errors
    window.electron.onUpdateError((error) => {
      setUpdateState(prev => ({
        ...prev,
        error: error,
        downloading: false
      }));
    });

    // Cleanup listeners when component unmounts
    return () => {
      window.electron.removeUpdateListeners();
    };
  }, []);

  const handleDownload = () => {
    window.electron.downloadUpdate();
  };

  const handleInstall = () => {
    window.electron.installUpdate();
  };

  const handleCheckUpdates = () => {
    window.electron.checkForUpdates();
  };

  // Don't show anything if no update
  if (!updateState.available && !updateState.error) {
    return null;
  }

  return (
    <div className="update-notification">
      {/* Update Available */}
      {updateState.available && !updateState.downloading && !updateState.downloaded && (
        <div className="update-banner update-available">
          <div className="update-content">
            <span className="update-icon">🔔</span>
            <div className="update-text">
              <strong>Update Available</strong>
              <p>Version {updateState.version} is ready to download</p>
            </div>
          </div>
          <button onClick={handleDownload} className="update-button">
            Download Update
          </button>
        </div>
      )}

      {/* Downloading */}
      {updateState.downloading && (
        <div className="update-banner update-downloading">
          <div className="update-content">
            <span className="update-icon">⬇️</span>
            <div className="update-text">
              <strong>Downloading Update</strong>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${updateState.progress}%` }}
                />
              </div>
              <p>{updateState.progress}% complete</p>
            </div>
          </div>
        </div>
      )}

      {/* Downloaded */}
      {updateState.downloaded && (
        <div className="update-banner update-ready">
          <div className="update-content">
            <span className="update-icon">✅</span>
            <div className="update-text">
              <strong>Update Ready</strong>
              <p>Version {updateState.version} is ready to install</p>
            </div>
          </div>
          <button onClick={handleInstall} className="update-button">
            Restart & Install
          </button>
        </div>
      )}

      {/* Error */}
      {updateState.error && (
        <div className="update-banner update-error">
          <div className="update-content">
            <span className="update-icon">⚠️</span>
            <div className="update-text">
              <strong>Update Error</strong>
              <p>{updateState.error}</p>
            </div>
          </div>
          <button onClick={handleCheckUpdates} className="update-button">
            Try Again
          </button>
        </div>
      )}

      <style jsx>{`
        .update-notification {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
        }

        .update-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .update-available {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .update-downloading {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .update-ready {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .update-error {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }

        .update-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .update-icon {
          font-size: 24px;
        }

        .update-text strong {
          display: block;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .update-text p {
          margin: 0;
          font-size: 12px;
          opacity: 0.9;
        }

        .progress-bar {
          width: 200px;
          height: 6px;
          background: rgba(255,255,255,0.3);
          border-radius: 3px;
          overflow: hidden;
          margin: 4px 0;
        }

        .progress-fill {
          height: 100%;
          background: white;
          transition: width 0.3s ease;
        }

        .update-button {
          background: white;
          color: #333;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .update-button:hover {
          transform: scale(1.05);
        }

        .update-button:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}

// ============================================
// Vanilla JavaScript Version (No React)
// ============================================

/*
// Add this to your frontend/app.js if not using React

class UpdateNotification {
  constructor() {
    this.state = {
      available: false,
      downloading: false,
      downloaded: false,
      progress: 0,
      version: '',
      error: null
    };
    
    this.element = null;
    this.init();
  }

  init() {
    if (!window.electron) return;

    // Create notification element
    this.element = document.createElement('div');
    this.element.className = 'update-notification';
    document.body.prepend(this.element);

    // Setup listeners
    window.electron.onUpdateAvailable((info) => {
      this.state.available = true;
      this.state.version = info.version;
      this.render();
    });

    window.electron.onUpdateDownloading(() => {
      this.state.downloading = true;
      this.render();
    });

    window.electron.onUpdateDownloadProgress((progress) => {
      this.state.progress = Math.round(progress.percent);
      this.render();
    });

    window.electron.onUpdateDownloaded((info) => {
      this.state.downloaded = true;
      this.state.downloading = false;
      this.state.version = info.version;
      this.render();
    });

    window.electron.onUpdateError((error) => {
      this.state.error = error;
      this.state.downloading = false;
      this.render();
    });
  }

  render() {
    if (!this.state.available && !this.state.error) {
      this.element.innerHTML = '';
      return;
    }

    let content = '';

    if (this.state.available && !this.state.downloading && !this.state.downloaded) {
      content = `
        <div class="update-banner update-available">
          <div class="update-content">
            <span class="update-icon">🔔</span>
            <div class="update-text">
              <strong>Update Available</strong>
              <p>Version ${this.state.version} is ready to download</p>
            </div>
          </div>
          <button onclick="window.electron.downloadUpdate()" class="update-button">
            Download Update
          </button>
        </div>
      `;
    } else if (this.state.downloading) {
      content = `
        <div class="update-banner update-downloading">
          <div class="update-content">
            <span class="update-icon">⬇️</span>
            <div class="update-text">
              <strong>Downloading Update</strong>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${this.state.progress}%"></div>
              </div>
              <p>${this.state.progress}% complete</p>
            </div>
          </div>
        </div>
      `;
    } else if (this.state.downloaded) {
      content = `
        <div class="update-banner update-ready">
          <div class="update-content">
            <span class="update-icon">✅</span>
            <div class="update-text">
              <strong>Update Ready</strong>
              <p>Version ${this.state.version} is ready to install</p>
            </div>
          </div>
          <button onclick="window.electron.installUpdate()" class="update-button">
            Restart & Install
          </button>
        </div>
      `;
    } else if (this.state.error) {
      content = `
        <div class="update-banner update-error">
          <div class="update-content">
            <span class="update-icon">⚠️</span>
            <div class="update-text">
              <strong>Update Error</strong>
              <p>${this.state.error}</p>
            </div>
          </div>
          <button onclick="window.electron.checkForUpdates()" class="update-button">
            Try Again
          </button>
        </div>
      `;
    }

    this.element.innerHTML = content;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new UpdateNotification();
});
*/
