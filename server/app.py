from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Determine the correct path to frontend files
# In packaged app, server is in app.asar.unpacked/server
# frontend is in app.asar/frontend (or app.asar.unpacked/frontend if we unpack it)
script_dir = Path(__file__).parent
frontend_path = script_dir.parent / 'frontend'

print(f"Looking for frontend at: {frontend_path}")
print(f"Frontend exists: {frontend_path.exists()}")

app = Flask(__name__, static_folder=str(frontend_path), static_url_path='')
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

# Import changelog manager
try:
    from changelog_manager import ChangelogManager
    changelog_manager = ChangelogManager()
    CHANGELOG_AVAILABLE = True
except ImportError:
    CHANGELOG_AVAILABLE = False
    changelog_manager = None

# In-memory data storage (in production, use SQLite or similar)
budget_data = {
    'categories': [],
    'transactions': [],
    'total_budget': 0,
    'accounts': [],  # Account balances (checking, savings, credit cards)
    'income_sources': [],  # Income sources (salary, freelance, etc.)
    'fixed_expenses': []  # Monthly fixed expenses (bills, subscriptions, etc.)
}

# Serve frontend
@app.route('/')
def index():
    response = send_from_directory(app.static_folder, 'index.html')
    # Disable caching for development
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/<path:path>')
def serve_static(path):
    response = send_from_directory(app.static_folder, path)
    # Disable caching for development
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

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

@app.route('/api/transactions/month-to-date', methods=['GET'])
def get_month_to_date_transactions():
    """Get transactions for the current month"""
    from datetime import datetime
    
    now = datetime.now()
    current_year = now.year
    current_month = now.month
    
    # Filter transactions for current month
    mtd_transactions = []
    total_spent = 0
    
    for transaction in budget_data['transactions']:
        try:
            # Parse transaction date
            trans_date = datetime.fromisoformat(transaction['date'])
            
            # Check if transaction is from current month
            if trans_date.year == current_year and trans_date.month == current_month:
                mtd_transactions.append(transaction)
                # Only count expenses (negative amounts or amounts with type='expense')
                amount = float(transaction.get('amount', 0))
                if amount > 0:  # Assuming positive amounts are expenses
                    total_spent += amount
        except (ValueError, KeyError):
            continue
    
    # Calculate days passed in current month
    days_passed = now.day
    average_per_day = total_spent / days_passed if days_passed > 0 else 0
    
    return jsonify({
        'total': round(total_spent, 2),
        'count': len(mtd_transactions),
        'average_per_day': round(average_per_day, 2),
        'days_passed': days_passed,
        'transactions': mtd_transactions
    })

@app.route('/api/categories', methods=['GET'])
def get_categories():
    return jsonify(budget_data['categories'])

@app.route('/api/categories', methods=['POST'])
def add_category():
    category = request.json
    category['id'] = int(datetime.now().timestamp() * 1000)
    budget_data['categories'].append(category)
    return jsonify({'success': True, 'data': category})

# Account endpoints
@app.route('/api/accounts', methods=['GET'])
def get_accounts():
    """Get all accounts"""
    return jsonify(budget_data['accounts'])

@app.route('/api/accounts', methods=['POST'])
def add_account():
    """Add a new account"""
    account = request.json
    account['id'] = int(datetime.now().timestamp() * 1000)
    account['created_at'] = datetime.now().isoformat()
    account['updated_at'] = datetime.now().isoformat()
    budget_data['accounts'].append(account)
    return jsonify({'success': True, 'data': account})

@app.route('/api/accounts/<int:account_id>', methods=['PUT'])
def update_account(account_id):
    """Update an existing account"""
    updated_data = request.json
    for account in budget_data['accounts']:
        if account['id'] == account_id:
            account.update(updated_data)
            account['updated_at'] = datetime.now().isoformat()
            return jsonify({'success': True, 'data': account})
    return jsonify({'success': False, 'error': 'Account not found'}), 404

@app.route('/api/accounts/<int:account_id>', methods=['DELETE'])
def delete_account(account_id):
    """Delete an account"""
    budget_data['accounts'] = [
        a for a in budget_data['accounts'] 
        if a['id'] != account_id
    ]
    return jsonify({'success': True})

# Income endpoints
@app.route('/api/income', methods=['GET'])
def get_income_sources():
    """Get all income sources"""
    return jsonify(budget_data['income_sources'])

@app.route('/api/income', methods=['POST'])
def add_income_source():
    """Add a new income source"""
    income = request.json
    income['id'] = int(datetime.now().timestamp() * 1000)
    income['created_at'] = datetime.now().isoformat()
    income['updated_at'] = datetime.now().isoformat()
    budget_data['income_sources'].append(income)
    return jsonify({'success': True, 'data': income})

@app.route('/api/income/<int:income_id>', methods=['PUT'])
def update_income_source(income_id):
    """Update an existing income source"""
    updated_data = request.json
    for income in budget_data['income_sources']:
        if income['id'] == income_id:
            income.update(updated_data)
            income['updated_at'] = datetime.now().isoformat()
            return jsonify({'success': True, 'data': income})
    return jsonify({'success': False, 'error': 'Income source not found'}), 404

@app.route('/api/income/<int:income_id>', methods=['DELETE'])
def delete_income_source(income_id):
    """Delete an income source"""
    budget_data['income_sources'] = [
        i for i in budget_data['income_sources'] 
        if i['id'] != income_id
    ]
    return jsonify({'success': True})

@app.route('/api/income/total', methods=['GET'])
def get_total_monthly_income():
    """Calculate total monthly income from all sources"""
    total = 0
    for income in budget_data['income_sources']:
        amount = float(income.get('amount', 0))
        frequency = income.get('frequency', 'monthly')
        
        # Convert all frequencies to monthly
        if frequency == 'weekly':
            monthly_amount = amount * 52 / 12
        elif frequency == 'bi-weekly':
            monthly_amount = amount * 26 / 12
        elif frequency == 'monthly':
            monthly_amount = amount
        elif frequency == 'annual':
            monthly_amount = amount / 12
        else:
            monthly_amount = amount
            
        total += monthly_amount
    
    return jsonify({'total': round(total, 2)})

# Fixed Expenses endpoints
@app.route('/api/expenses', methods=['GET'])
def get_fixed_expenses():
    """Get all fixed expenses"""
    return jsonify(budget_data['fixed_expenses'])

@app.route('/api/expenses', methods=['POST'])
def add_fixed_expense():
    """Add a new fixed expense"""
    expense = request.json
    expense['id'] = int(datetime.now().timestamp() * 1000)
    expense['created_at'] = datetime.now().isoformat()
    expense['updated_at'] = datetime.now().isoformat()
    budget_data['fixed_expenses'].append(expense)
    return jsonify({'success': True, 'data': expense})

@app.route('/api/expenses/<int:expense_id>', methods=['PUT'])
def update_fixed_expense(expense_id):
    """Update an existing fixed expense"""
    updated_data = request.json
    for expense in budget_data['fixed_expenses']:
        if expense['id'] == expense_id:
            expense.update(updated_data)
            expense['updated_at'] = datetime.now().isoformat()
            return jsonify({'success': True, 'data': expense})
    return jsonify({'success': False, 'error': 'Expense not found'}), 404

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def delete_fixed_expense(expense_id):
    """Delete a fixed expense"""
    budget_data['fixed_expenses'] = [
        e for e in budget_data['fixed_expenses'] 
        if e['id'] != expense_id
    ]
    return jsonify({'success': True})

@app.route('/api/expenses/total', methods=['GET'])
def get_total_monthly_expenses():
    """Calculate total monthly fixed expenses"""
    total = 0
    for expense in budget_data['fixed_expenses']:
        amount = float(expense.get('amount', 0))
        total += amount
    
    return jsonify({'total': round(total, 2)})

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

# Changelog endpoints
@app.route('/api/changelog', methods=['GET'])
def get_changelog():
    """Get all version history"""
    if not CHANGELOG_AVAILABLE or not changelog_manager:
        return jsonify({'error': 'Changelog not available'}), 503
    
    versions = changelog_manager.get_all_versions()
    return jsonify({'versions': versions})

@app.route('/api/changelog/<version>', methods=['GET'])
def get_version_changes(version):
    """Get changes for a specific version"""
    if not CHANGELOG_AVAILABLE or not changelog_manager:
        return jsonify({'error': 'Changelog not available'}), 503
    
    version_data = changelog_manager.get_version(version)
    if not version_data:
        return jsonify({'error': 'Version not found'}), 404
    
    return jsonify(version_data)

@app.route('/api/changelog/latest', methods=['GET'])
def get_latest_version():
    """Get the latest version info"""
    if not CHANGELOG_AVAILABLE or not changelog_manager:
        return jsonify({'error': 'Changelog not available'}), 503
    
    latest = changelog_manager.get_latest_version()
    if not latest:
        return jsonify({'error': 'No versions found'}), 404
    
    return jsonify(latest)

@app.route('/api/changelog/markdown', methods=['GET'])
def get_changelog_markdown():
    """Get changelog as markdown"""
    if not CHANGELOG_AVAILABLE or not changelog_manager:
        return jsonify({'error': 'Changelog not available'}), 503
    
    markdown = changelog_manager.export_changelog_markdown()
    return jsonify({'markdown': markdown})

if __name__ == '__main__':
    print('Starting Budget Tool Flask server...')
    print('Server running at http://localhost:5000')
    app.run(host='127.0.0.1', port=5000, debug=False)
