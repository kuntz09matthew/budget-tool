"""
Budget Tool - Desktop Application Launcher
Runs the Flask server and opens it in a desktop window
"""
import webview
import threading
import time
import sys
from pathlib import Path

# Add server directory to path
server_path = Path(__file__).parent / 'server'
sys.path.insert(0, str(server_path))

from server.app import app
from updater import updater

def start_flask():
    """Start Flask server in a separate thread"""
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)

def check_updates_async():
    """Check for updates in background"""
    time.sleep(5)  # Wait for app to fully load
    print("Checking for updates...")
    update_info = updater.check_for_updates()
    
    if update_info.get('available'):
        print(f"Update available: v{update_info['latest']}")
        # The frontend will show the update banner via API

def main():
    """Main application entry point"""
    print("Starting Budget Tool...")
    
    # Start Flask in background thread
    flask_thread = threading.Thread(target=start_flask, daemon=True)
    flask_thread.start()
    
    # Check for updates in background
    update_thread = threading.Thread(target=check_updates_async, daemon=True)
    update_thread.start()
    
    # Wait for server to start
    time.sleep(2)
    
    print("Opening Budget Tool window...")
    
    # Create desktop window
    window = webview.create_window(
        'Budget Tool',
        'http://localhost:5000',
        width=1200,
        height=800,
        resizable=True,
        text_select=True
    )
    
    # Start the GUI (blocking call)
    webview.start()
    
    print("Budget Tool closed")

if __name__ == '__main__':
    main()
