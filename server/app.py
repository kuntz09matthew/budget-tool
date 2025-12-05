from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os
import sys
from datetime import datetime
from pathlib import Path

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Import updater if available
try:
    parent_dir = Path(__file__).parent.parent
    sys.path.insert(0, str(parent_dir))
    from updater import updater
    UPDATER_AVAILABLE = True
except ImportError:
    UPDATER_AVAILABLE = False
    updater = None

# In-memory data storage (in production, use SQLite or similar)
budget_data = {
    'categories': [],
    'transactions': [],
    'total_budget': 0
}

# Serve frontend
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# API Routes
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'Server is running', 'backend': 'Python Flask'})

@app.route('/api/budget', methods=['GET'])
def get_budget():
    return jsonify(budget_data)

@app.route('/api/budget', methods=['POST'])
def update_budget():
    data = request.json
    budget_data.update(data)
    return jsonify({'success': True, 'data': budget_data})

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    return jsonify(budget_data['transactions'])

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    transaction = request.json
    transaction['id'] = int(datetime.now().timestamp() * 1000)
    transaction['date'] = datetime.now().isoformat()
    budget_data['transactions'].append(transaction)
    return jsonify({'success': True, 'data': transaction})

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    budget_data['transactions'] = [
        t for t in budget_data['transactions'] 
        if t['id'] != transaction_id
    ]
    return jsonify({'success': True})

@app.route('/api/categories', methods=['GET'])
def get_categories():
    return jsonify(budget_data['categories'])

@app.route('/api/categories', methods=['POST'])
def add_category():
    category = request.json
    category['id'] = int(datetime.now().timestamp() * 1000)
    budget_data['categories'].append(category)
    return jsonify({'success': True, 'data': category})

# Update endpoints
@app.route('/api/updates/check', methods=['GET'])
def check_updates():
    """Check for available updates"""
    if not UPDATER_AVAILABLE or not updater:
        return jsonify({'available': False, 'error': 'Updater not available'})
    
    result = updater.check_for_updates()
    return jsonify(result)

@app.route('/api/updates/download', methods=['POST'])
def download_update():
    """Download the update"""
    if not UPDATER_AVAILABLE or not updater:
        return jsonify({'success': False, 'error': 'Updater not available'})
    
    if not updater.update_available:
        return jsonify({'success': False, 'error': 'No update available'})
    
    installer_path = updater.download_update()
    if installer_path:
        return jsonify({'success': True, 'path': installer_path})
    else:
        return jsonify({'success': False, 'error': 'Download failed'})

@app.route('/api/updates/install', methods=['POST'])
def install_update():
    """Install the downloaded update"""
    data = request.json
    installer_path = data.get('path')
    
    if not installer_path or not os.path.exists(installer_path):
        return jsonify({'success': False, 'error': 'Installer not found'})
    
    # This will exit the app and launch installer
    updater.install_update(installer_path)
    return jsonify({'success': True})

if __name__ == '__main__':
    print('Starting Budget Tool Flask server...')
    print('Server running at http://localhost:5000')
    app.run(host='127.0.0.1', port=5000, debug=False)
