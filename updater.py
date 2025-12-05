"""
Auto-updater for Budget Tool
Checks GitHub releases for updates and downloads them
"""
import requests
import json
import os
import sys
import subprocess
from pathlib import Path
from packaging import version

# Configuration
GITHUB_REPO = "your-github-username/budget-tool"  # Update this!
CURRENT_VERSION = "1.0.0"  # Keep in sync with your releases
UPDATE_CHECK_URL = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"

class Updater:
    def __init__(self):
        self.current_version = CURRENT_VERSION
        self.latest_version = None
        self.download_url = None
        self.update_available = False
        
    def check_for_updates(self):
        """Check GitHub for newer version"""
        try:
            response = requests.get(UPDATE_CHECK_URL, timeout=5)
            if response.status_code == 200:
                release_data = response.json()
                self.latest_version = release_data['tag_name'].lstrip('v')
                
                # Compare versions
                if version.parse(self.latest_version) > version.parse(self.current_version):
                    self.update_available = True
                    
                    # Find the Windows executable in assets
                    for asset in release_data.get('assets', []):
                        if asset['name'].endswith('.exe'):
                            self.download_url = asset['browser_download_url']
                            break
                    
                    return {
                        'available': True,
                        'current': self.current_version,
                        'latest': self.latest_version,
                        'download_url': self.download_url,
                        'release_notes': release_data.get('body', 'No release notes')
                    }
            
            return {'available': False, 'current': self.current_version}
            
        except Exception as e:
            print(f"Update check failed: {e}")
            return {'available': False, 'error': str(e)}
    
    def download_update(self, save_path=None):
        """Download the update file"""
        if not self.download_url:
            return False
        
        try:
            if save_path is None:
                save_path = Path.home() / 'Downloads' / f'BudgetTool-v{self.latest_version}.exe'
            
            print(f"Downloading update to {save_path}...")
            response = requests.get(self.download_url, stream=True, timeout=30)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            
            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        # Progress callback could go here
                        progress = (downloaded / total_size) * 100 if total_size > 0 else 0
                        print(f"Progress: {progress:.1f}%", end='\r')
            
            print(f"\nUpdate downloaded to: {save_path}")
            return str(save_path)
            
        except Exception as e:
            print(f"Download failed: {e}")
            return None
    
    def install_update(self, installer_path):
        """Launch the installer and exit current app"""
        try:
            # Launch installer
            if sys.platform == 'win32':
                os.startfile(installer_path)
            else:
                subprocess.Popen([installer_path])
            
            # Exit current app to allow update
            sys.exit(0)
            
        except Exception as e:
            print(f"Failed to launch installer: {e}")
            return False

# Singleton instance
updater = Updater()

if __name__ == '__main__':
    # Test the updater
    print(f"Current version: {CURRENT_VERSION}")
    print("Checking for updates...")
    
    result = updater.check_for_updates()
    
    if result.get('available'):
        print(f"✅ Update available: v{result['latest']}")
        print(f"Download URL: {result['download_url']}")
        print(f"\nRelease Notes:\n{result['release_notes']}")
    else:
        print("✅ You're running the latest version!")
