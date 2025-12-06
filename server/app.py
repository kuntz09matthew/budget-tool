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

# Data file path - use environment variable if provided (for production)
# In production, Electron will set this to userData directory
# In development, it will be in server directory
if os.environ.get('BUDGET_APP_DATA_DIR'):
    # Production: Store in Electron's userData directory (persists across updates)
    DATA_DIR = Path(os.environ.get('BUDGET_APP_DATA_DIR'))
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DATA_FILE = DATA_DIR / 'budget_data.json'
    print(f"Production mode: Data will be stored in {DATA_FILE}")
else:
    # Development: Store in server directory
    DATA_FILE = Path(__file__).parent / 'budget_data.json'
    print(f"Development mode: Data will be stored in {DATA_FILE}")

# In-memory data storage
budget_data = {
    'categories': [],
    'transactions': [],
    'total_budget': 0,
    'accounts': [],  # Account balances (checking, savings, credit cards)
    'income_sources': [],  # Income sources (salary, freelance, etc.)
    'fixed_expenses': []  # Monthly fixed expenses (bills, subscriptions, etc.)
}

# Load data from file if it exists
def load_data():
    """Load budget data from JSON file"""
    global budget_data
    try:
        if DATA_FILE.exists():
            with open(DATA_FILE, 'r') as f:
                loaded_data = json.load(f)
                budget_data.update(loaded_data)
                print(f"Data loaded successfully from {DATA_FILE}")
        else:
            print(f"No existing data file found. Starting with empty data.")
    except Exception as e:
        print(f"Error loading data: {e}")

# Save data to file
def save_data():
    """Save budget data to JSON file"""
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(budget_data, f, indent=2)
        print(f"Data saved successfully to {DATA_FILE}")
        return True
    except Exception as e:
        print(f"Error saving data: {e}")
        return False

# Load data on startup
load_data()

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
    save_data()
    return jsonify({'success': True, 'data': transaction})

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    budget_data['transactions'] = [
        t for t in budget_data['transactions'] 
        if t['id'] != transaction_id
    ]
    save_data()
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
    try:
        return jsonify(budget_data['accounts'])
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/accounts', methods=['POST'])
def add_account():
    """Add a new account with validation"""
    try:
        account = request.json
        
        # Validation
        if not account.get('name'):
            return jsonify({'success': False, 'error': 'Account name is required'}), 400
        
        if not account.get('type'):
            return jsonify({'success': False, 'error': 'Account type is required'}), 400
        
        if 'balance' not in account:
            return jsonify({'success': False, 'error': 'Account balance is required'}), 400
        
        # Validate account type
        valid_types = ['checking', 'savings', 'credit', 'investment']
        if account['type'] not in valid_types:
            return jsonify({'success': False, 'error': 'Invalid account type'}), 400
        
        # Validate balance is a number
        try:
            balance = float(account['balance'])
            account['balance'] = round(balance, 2)
        except (ValueError, TypeError):
            return jsonify({'success': False, 'error': 'Balance must be a valid number'}), 400
        
        # Add metadata
        account['id'] = int(datetime.now().timestamp() * 1000)
        account['created_at'] = datetime.now().isoformat()
        account['updated_at'] = datetime.now().isoformat()
        
        # Save account
        budget_data['accounts'].append(account)
        save_data()
        
        return jsonify({'success': True, 'data': account}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/accounts/<int:account_id>', methods=['PUT'])
def update_account(account_id):
    """Update an existing account with validation"""
    try:
        updated_data = request.json
        
        # Find account
        account = None
        for acc in budget_data['accounts']:
            if acc['id'] == account_id:
                account = acc
                break
        
        if not account:
            return jsonify({'success': False, 'error': 'Account not found'}), 404
        
        # Validate updated data
        if 'name' in updated_data and not updated_data['name']:
            return jsonify({'success': False, 'error': 'Account name cannot be empty'}), 400
        
        if 'type' in updated_data:
            valid_types = ['checking', 'savings', 'credit', 'investment']
            if updated_data['type'] not in valid_types:
                return jsonify({'success': False, 'error': 'Invalid account type'}), 400
        
        if 'balance' in updated_data:
            try:
                balance = float(updated_data['balance'])
                updated_data['balance'] = round(balance, 2)
            except (ValueError, TypeError):
                return jsonify({'success': False, 'error': 'Balance must be a valid number'}), 400
        
        # Update account
        account.update(updated_data)
        account['updated_at'] = datetime.now().isoformat()
        save_data()
        
        return jsonify({'success': True, 'data': account})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/accounts/<int:account_id>', methods=['DELETE'])
def delete_account(account_id):
    """Delete an account"""
    try:
        initial_length = len(budget_data['accounts'])
        budget_data['accounts'] = [
            a for a in budget_data['accounts'] 
            if a['id'] != account_id
        ]
        
        if len(budget_data['accounts']) == initial_length:
            return jsonify({'success': False, 'error': 'Account not found'}), 404
        
        save_data()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/accounts/summary', methods=['GET'])
def get_accounts_summary():
    """Get summary of all accounts by type"""
    try:
        summary = {
            'checking_total': 0,
            'savings_total': 0,
            'credit_total': 0,
            'investment_total': 0,
            'net_worth': 0,
            'total_assets': 0,
            'total_liabilities': 0
        }
        
        for account in budget_data['accounts']:
            balance = float(account.get('balance', 0))
            account_type = account.get('type', '')
            
            if account_type == 'checking':
                summary['checking_total'] += balance
                summary['total_assets'] += balance
            elif account_type == 'savings':
                summary['savings_total'] += balance
                summary['total_assets'] += balance
            elif account_type == 'credit':
                summary['credit_total'] += balance
                # Credit card balances are liabilities
                summary['total_liabilities'] += balance
            elif account_type == 'investment':
                summary['investment_total'] += balance
                summary['total_assets'] += balance
        
        # Calculate net worth (assets - liabilities)
        summary['net_worth'] = summary['total_assets'] - summary['total_liabilities']
        
        # Round all values
        for key in summary:
            summary[key] = round(summary[key], 2)
        
        return jsonify(summary)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

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
    save_data()
    return jsonify({'success': True, 'data': income})

@app.route('/api/income/<int:income_id>', methods=['PUT'])
def update_income_source(income_id):
    """Update an existing income source"""
    updated_data = request.json
    for income in budget_data['income_sources']:
        if income['id'] == income_id:
            income.update(updated_data)
            income['updated_at'] = datetime.now().isoformat()
            save_data()
            return jsonify({'success': True, 'data': income})
    return jsonify({'success': False, 'error': 'Income source not found'}), 404

@app.route('/api/income/<int:income_id>', methods=['DELETE'])
def delete_income_source(income_id):
    """Delete an income source"""
    budget_data['income_sources'] = [
        i for i in budget_data['income_sources'] 
        if i['id'] != income_id
    ]
    save_data()
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

@app.route('/api/dashboard/next-paycheck', methods=['GET'])
def get_next_paycheck():
    """Calculate days until next paycheck from all income sources"""
    from datetime import datetime, timedelta
    
    try:
        income_sources = budget_data.get('income_sources', [])
        
        if not income_sources:
            return jsonify({
                'has_paycheck': False,
                'message': 'No income sources configured'
            })
        
        # Find the soonest paycheck from all income sources
        next_paychecks = []
        
        for income in income_sources:
            next_pay_date = income.get('next_pay_date')
            frequency = income.get('frequency', 'monthly')
            
            if not next_pay_date:
                continue
            
            # Parse the date
            try:
                pay_date = datetime.fromisoformat(next_pay_date.replace('Z', '+00:00'))
                if pay_date.tzinfo:
                    pay_date = pay_date.replace(tzinfo=None)
            except:
                continue
            
            # If the pay date is in the past, calculate the next one based on frequency
            now = datetime.now()
            while pay_date < now:
                if frequency == 'weekly':
                    pay_date += timedelta(days=7)
                elif frequency == 'bi-weekly':
                    pay_date += timedelta(days=14)
                elif frequency == 'monthly':
                    # Add one month
                    month = pay_date.month
                    year = pay_date.year
                    if month == 12:
                        month = 1
                        year += 1
                    else:
                        month += 1
                    try:
                        pay_date = pay_date.replace(month=month, year=year)
                    except ValueError:
                        # Handle day overflow (e.g., Jan 31 -> Feb 31)
                        # Set to last day of month
                        import calendar
                        last_day = calendar.monthrange(year, month)[1]
                        pay_date = pay_date.replace(day=last_day, month=month, year=year)
                elif frequency == 'annual':
                    pay_date = pay_date.replace(year=pay_date.year + 1)
                else:
                    break
            
            if pay_date >= now:
                next_paychecks.append({
                    'date': pay_date,
                    'source': income.get('name', 'Unknown'),
                    'amount': income.get('amount', 0),
                    'frequency': frequency
                })
        
        if not next_paychecks:
            return jsonify({
                'has_paycheck': False,
                'message': 'No upcoming paychecks configured'
            })
        
        # Get the soonest paycheck
        next_paycheck = min(next_paychecks, key=lambda x: x['date'])
        days_until = (next_paycheck['date'] - datetime.now()).days
        
        return jsonify({
            'has_paycheck': True,
            'days_until': days_until,
            'date': next_paycheck['date'].strftime('%Y-%m-%d'),
            'formatted_date': next_paycheck['date'].strftime('%B %d, %Y'),
            'source': next_paycheck['source'],
            'amount': next_paycheck['amount'],
            'frequency': next_paycheck['frequency']
        })
        
    except Exception as e:
        print(f"Error calculating next paycheck: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'has_paycheck': False,
            'message': f'Error calculating paycheck: {str(e)}'
        }), 500

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
    save_data()
    return jsonify({'success': True, 'data': expense})

@app.route('/api/expenses/<int:expense_id>', methods=['PUT'])
def update_fixed_expense(expense_id):
    """Update an existing fixed expense"""
    updated_data = request.json
    for expense in budget_data['fixed_expenses']:
        if expense['id'] == expense_id:
            expense.update(updated_data)
            expense['updated_at'] = datetime.now().isoformat()
            save_data()
            return jsonify({'success': True, 'data': expense})
    return jsonify({'success': False, 'error': 'Expense not found'}), 404

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def delete_fixed_expense(expense_id):
    """Delete a fixed expense"""
    budget_data['fixed_expenses'] = [
        e for e in budget_data['fixed_expenses'] 
        if e['id'] != expense_id
    ]
    save_data()
    return jsonify({'success': True})

@app.route('/api/expenses/total', methods=['GET'])
def get_total_monthly_expenses():
    """Calculate total monthly fixed expenses"""
    total = 0
    for expense in budget_data['fixed_expenses']:
        amount = float(expense.get('amount', 0))
        total += amount
    
    return jsonify({'total': round(total, 2)})

# Dashboard endpoints
@app.route('/api/dashboard/available-spending', methods=['GET'])
def get_available_spending():
    """
    Calculate available spending money after fixed expenses.
    Formula: Total Income - Fixed Expenses = Available for Spending
    """
    # Calculate total monthly income
    total_income = 0
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
            
        total_income += monthly_amount
    
    # Calculate total monthly fixed expenses
    total_expenses = 0
    for expense in budget_data['fixed_expenses']:
        amount = float(expense.get('amount', 0))
        total_expenses += amount
    
    # Calculate available spending
    available = total_income - total_expenses
    
    # Determine status based on available amount
    if available < 0:
        status = 'danger'
        message = 'Warning: Expenses exceed income!'
    elif available < 500:
        status = 'warning'
        message = 'Caution: Low available funds'
    else:
        status = 'success'
        message = 'Healthy budget'
    
    return jsonify({
        'total_income': round(total_income, 2),
        'total_expenses': round(total_expenses, 2),
        'available': round(available, 2),
        'status': status,
        'message': message
    })

@app.route('/api/dashboard/spending-velocity', methods=['GET'])
def get_spending_velocity():
    """
    Calculate spending velocity - how fast the user is spending compared to a safe rate.
    This helps prevent overdrafts by warning when spending too quickly.
    """
    from datetime import datetime
    from calendar import monthrange
    
    now = datetime.now()
    current_year = now.year
    current_month = now.month
    current_day = now.day
    
    # Get days in current month
    days_in_month = monthrange(current_year, current_month)[1]
    days_remaining = days_in_month - current_day
    
    # Calculate available spending (income - fixed expenses)
    total_income = 0
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
            
        total_income += monthly_amount
    
    total_expenses = 0
    for expense in budget_data['fixed_expenses']:
        amount = float(expense.get('amount', 0))
        total_expenses += amount
    
    available_for_month = total_income - total_expenses
    
    # Calculate month-to-date spending from transactions
    mtd_spent = 0
    transaction_count = 0
    
    for transaction in budget_data['transactions']:
        try:
            trans_date = datetime.fromisoformat(transaction['date'])
            if trans_date.year == current_year and trans_date.month == current_month:
                amount = float(transaction.get('amount', 0))
                if amount > 0:  # Only count expenses (positive amounts)
                    mtd_spent += amount
                    transaction_count += 1
        except (ValueError, KeyError):
            continue
    
    # Calculate actual daily spending rate
    actual_daily_rate = mtd_spent / current_day if current_day > 0 else 0
    
    # Calculate remaining money after MTD spending
    remaining_money = available_for_month - mtd_spent
    
    # Calculate safe daily rate (remaining money / remaining days)
    safe_daily_rate = remaining_money / days_remaining if days_remaining > 0 else 0
    
    # If we're at the end of the month (last day), use a different calculation
    if days_remaining == 0:
        safe_daily_rate = 0
        if remaining_money < 0:
            status = 'danger'
            status_text = 'Over Budget'
            message = f'You spent ${abs(remaining_money):.2f} more than your budget this month.'
        else:
            status = 'success'
            status_text = 'Month Complete'
            message = f'Great job! You have ${remaining_money:.2f} left over.'
    else:
        # Determine velocity status
        if actual_daily_rate <= safe_daily_rate * 0.9:
            # Spending well under safe rate (10% buffer)
            status = 'success'
            status_text = 'On Track'
            message = f'You\'re spending at a healthy pace! Keep it up.'
        elif actual_daily_rate <= safe_daily_rate * 1.1:
            # Within 10% of safe rate
            status = 'success'
            status_text = 'Good Pace'
            message = f'You\'re right on track with your spending.'
        elif actual_daily_rate <= safe_daily_rate * 1.3:
            # 10-30% over safe rate
            status = 'warning'
            status_text = 'Spending Fast'
            message = f'You\'re spending a bit fast. Try to slow down to ${safe_daily_rate:.2f}/day.'
        else:
            # More than 30% over safe rate
            status = 'danger'
            status_text = 'Too Fast!'
            message = f'Warning: At this rate, you\'ll overspend by ${(actual_daily_rate - safe_daily_rate) * days_remaining:.2f} this month!'
    
    # Calculate projected end-of-month balance
    projected_spending = actual_daily_rate * days_in_month
    projected_remaining = available_for_month - projected_spending
    
    return jsonify({
        'actual_daily_rate': round(actual_daily_rate, 2),
        'safe_daily_rate': round(safe_daily_rate, 2),
        'status': status,
        'status_text': status_text,
        'message': message,
        'days_passed': current_day,
        'days_remaining': days_remaining,
        'mtd_spent': round(mtd_spent, 2),
        'remaining_money': round(remaining_money, 2),
        'projected_remaining': round(projected_remaining, 2),
        'transaction_count': transaction_count
    })

@app.route('/api/dashboard/money-per-day', methods=['GET'])
def get_money_per_day():
    """
    Calculate how much money is available to spend per day until the next paycheck.
    This helps users budget their daily spending to avoid running out before payday.
    """
    from datetime import datetime, timedelta
    from calendar import monthrange
    
    now = datetime.now()
    current_year = now.year
    current_month = now.month
    
    # Calculate available spending (income - fixed expenses)
    total_income = 0
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
            
        total_income += monthly_amount
    
    total_expenses = 0
    for expense in budget_data['fixed_expenses']:
        amount = float(expense.get('amount', 0))
        total_expenses += amount
    
    available_for_month = total_income - total_expenses
    
    # Calculate month-to-date spending from transactions
    mtd_spent = 0
    
    for transaction in budget_data['transactions']:
        try:
            trans_date = datetime.fromisoformat(transaction['date'])
            if trans_date.year == current_year and trans_date.month == current_month:
                amount = float(transaction.get('amount', 0))
                if amount > 0:  # Only count expenses (positive amounts)
                    mtd_spent += amount
        except (ValueError, KeyError):
            continue
    
    # Calculate remaining money
    remaining_money = available_for_month - mtd_spent
    
    # Find days until next paycheck
    income_sources = budget_data.get('income_sources', [])
    days_until_paycheck = None
    next_paycheck_date = None
    
    if income_sources:
        next_paychecks = []
        
        for income in income_sources:
            next_pay_date = income.get('next_pay_date')
            frequency = income.get('frequency', 'monthly')
            
            if not next_pay_date:
                continue
            
            try:
                pay_date = datetime.fromisoformat(next_pay_date.replace('Z', '+00:00'))
                if pay_date.tzinfo:
                    pay_date = pay_date.replace(tzinfo=None)
            except:
                continue
            
            # If the pay date is in the past, calculate the next one
            while pay_date < now:
                if frequency == 'weekly':
                    pay_date += timedelta(days=7)
                elif frequency == 'bi-weekly':
                    pay_date += timedelta(days=14)
                elif frequency == 'monthly':
                    month = pay_date.month
                    year = pay_date.year
                    if month == 12:
                        month = 1
                        year += 1
                    else:
                        month += 1
                    try:
                        pay_date = pay_date.replace(month=month, year=year)
                    except ValueError:
                        import calendar
                        last_day = calendar.monthrange(year, month)[1]
                        pay_date = pay_date.replace(day=last_day, month=month, year=year)
                elif frequency == 'annual':
                    pay_date = pay_date.replace(year=pay_date.year + 1)
                else:
                    break
            
            if pay_date >= now:
                next_paychecks.append(pay_date)
        
        if next_paychecks:
            next_paycheck_date = min(next_paychecks)
            days_until_paycheck = (next_paycheck_date - now).days
            if days_until_paycheck == 0:
                days_until_paycheck = 1  # Treat today as having 1 day left
    
    # If no paycheck date found, use days remaining in month
    if days_until_paycheck is None:
        days_in_month = monthrange(current_year, current_month)[1]
        days_until_paycheck = days_in_month - now.day
        if days_until_paycheck == 0:
            days_until_paycheck = 1
    
    # Calculate money per day
    money_per_day = remaining_money / days_until_paycheck if days_until_paycheck > 0 else 0
    
    # Determine status based on how much is available
    if remaining_money < 0:
        status = 'danger'
        status_text = 'Over Budget'
        message = f'You\'ve overspent by ${abs(remaining_money):.2f}. Avoid additional spending.'
    elif money_per_day < 10:
        status = 'danger'
        status_text = 'Very Tight'
        message = f'Budget very tight! Only ${money_per_day:.2f} available per day.'
    elif money_per_day < 30:
        status = 'warning'
        status_text = 'Limited'
        message = f'Budget is limited. Stick to essentials only.'
    elif money_per_day < 50:
        status = 'success'
        status_text = 'Moderate'
        message = f'You have a reasonable daily budget. Spend wisely.'
    else:
        status = 'success'
        status_text = 'Comfortable'
        message = f'You have good spending room. Stay on track!'
    
    # Handle edge case: no income or expense data
    if total_income == 0:
        message = 'Add income sources to calculate your daily budget.'
        money_per_day = 0
        status = 'warning'
        status_text = 'No Data'
    
    return jsonify({
        'money_per_day': round(money_per_day, 2),
        'remaining_money': round(remaining_money, 2),
        'days_until_paycheck': days_until_paycheck,
        'status': status,
        'status_text': status_text,
        'message': message,
        'available_for_month': round(available_for_month, 2),
        'mtd_spent': round(mtd_spent, 2),
        'next_paycheck_date': next_paycheck_date.strftime('%Y-%m-%d') if next_paycheck_date else None
    })

@app.route('/api/dashboard/overdraft-status', methods=['GET'])
def get_overdraft_status():
    """
    Calculate overdraft risk based on account balances, available spending, 
    and spending velocity. Returns color-coded alert levels.
    
    Risk Levels:
    - Critical (Red): Immediate overdraft danger
    - Warning (Yellow): Approaching overdraft 
    - Safe (Green): Healthy financial position
    """
    from datetime import datetime
    from calendar import monthrange
    
    now = datetime.now()
    current_year = now.year
    current_month = now.month
    current_day = now.day
    
    # Get days in current month and days remaining
    days_in_month = monthrange(current_year, current_month)[1]
    days_remaining = days_in_month - current_day
    if days_remaining == 0:
        days_remaining = 1
    
    # Calculate total liquid account balances (checking + savings, not credit)
    total_liquid = 0
    checking_balance = 0
    savings_balance = 0
    credit_balance = 0
    
    for account in budget_data['accounts']:
        balance = float(account.get('balance', 0))
        account_type = account.get('type', '').lower()
        
        if account_type == 'checking':
            checking_balance += balance
            total_liquid += balance
        elif account_type == 'savings':
            savings_balance += balance
            total_liquid += balance
        elif account_type == 'credit':
            credit_balance += balance
    
    # Calculate available spending (income - fixed expenses)
    total_income = 0
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
            
        total_income += monthly_amount
    
    total_expenses = 0
    upcoming_bills = 0  # Bills due in next 7 days
    
    for expense in budget_data['fixed_expenses']:
        amount = float(expense.get('amount', 0))
        total_expenses += amount
        
        # Check if bill is due soon
        due_day = expense.get('due_day')
        if due_day:
            try:
                due_day = int(due_day)
                days_until_due = due_day - current_day
                if days_until_due < 0:
                    days_until_due += days_in_month
                    
                # Count bills due in next 7 days
                if 0 <= days_until_due <= 7:
                    upcoming_bills += amount
            except (ValueError, TypeError):
                pass
    
    available_for_month = total_income - total_expenses
    
    # Calculate month-to-date spending
    mtd_spent = 0
    for transaction in budget_data['transactions']:
        try:
            trans_date = datetime.fromisoformat(transaction['date'])
            if trans_date.year == current_year and trans_date.month == current_month:
                amount = float(transaction.get('amount', 0))
                if amount > 0:  # Only count expenses
                    mtd_spent += amount
        except (ValueError, KeyError):
            continue
    
    # Calculate remaining for the month
    remaining_money = available_for_month - mtd_spent
    
    # Calculate projected spending rate
    actual_daily_rate = mtd_spent / current_day if current_day > 0 else 0
    projected_month_end_spending = actual_daily_rate * days_in_month
    projected_remaining = available_for_month - projected_month_end_spending
    
    # Determine risk level and generate warnings
    risk_level = 'safe'
    alert_color = '#10b981'  # Green
    alert_icon = '✅'
    warnings = []
    recommendations = []
    
    # CRITICAL RISK FACTORS (Red Alert)
    if checking_balance < 0:
        risk_level = 'critical'
        alert_color = '#ef4444'  # Red
        alert_icon = '🚨'
        warnings.append(f'Your checking account is overdrawn by ${abs(checking_balance):.2f}')
        recommendations.append('Contact your bank immediately to avoid overdraft fees')
        recommendations.append('Transfer from savings if available')
    elif checking_balance < 100 and upcoming_bills > checking_balance:
        risk_level = 'critical'
        alert_color = '#ef4444'
        alert_icon = '🚨'
        warnings.append(f'Insufficient funds for upcoming bills (${upcoming_bills:.2f} due)')
        recommendations.append(f'Transfer ${(upcoming_bills - checking_balance + 50):.2f} from savings to checking')
    elif remaining_money < 0:
        risk_level = 'critical'
        alert_color = '#ef4444'
        alert_icon = '🚨'
        warnings.append(f'You\'ve overspent by ${abs(remaining_money):.2f} this month')
        recommendations.append('Stop all non-essential spending immediately')
        recommendations.append('Review recent transactions for unnecessary expenses')
    elif projected_remaining < -100:
        risk_level = 'critical'
        alert_color = '#ef4444'
        alert_icon = '🚨'
        warnings.append(f'At current spending rate, you\'ll be ${abs(projected_remaining):.2f} over budget')
        recommendations.append(f'Reduce daily spending to ${remaining_money / days_remaining:.2f} per day')
    
    # WARNING RISK FACTORS (Yellow Alert)
    elif checking_balance < 200:
        risk_level = 'warning'
        alert_color = '#f59e0b'  # Amber
        alert_icon = '⚠️'
        warnings.append(f'Low checking balance: ${checking_balance:.2f}')
        recommendations.append('Transfer funds from savings if needed')
        recommendations.append('Postpone non-essential purchases')
    elif upcoming_bills > 0 and checking_balance < upcoming_bills * 1.5:
        risk_level = 'warning'
        alert_color = '#f59e0b'
        alert_icon = '⚠️'
        warnings.append(f'${upcoming_bills:.2f} in bills due within 7 days')
        recommendations.append('Ensure funds are available for upcoming bills')
    elif remaining_money < 100:
        risk_level = 'warning'
        alert_color = '#f59e0b'
        alert_icon = '⚠️'
        warnings.append(f'Only ${remaining_money:.2f} left for the month')
        recommendations.append(f'Limit spending to ${remaining_money / days_remaining:.2f} per day')
    elif projected_remaining < 0:
        risk_level = 'warning'
        alert_color = '#f59e0b'
        alert_icon = '⚠️'
        warnings.append('Spending faster than recommended')
        recommendations.append(f'Slow down to ${remaining_money / days_remaining:.2f} per day to avoid overdraft')
    
    # SAFE STATUS (Green)
    else:
        if total_liquid > 0:
            warnings.append('Your finances are on track')
            recommendations.append('Keep monitoring your spending')
            recommendations.append('Consider saving any surplus funds')
        else:
            risk_level = 'warning'
            alert_color = '#f59e0b'
            alert_icon = '⚠️'
            warnings.append('Add account balances to track overdraft risk')
            recommendations.append('Link your checking and savings accounts')
    
    # Handle no data scenario
    if total_income == 0 and len(budget_data['accounts']) == 0:
        risk_level = 'warning'
        alert_color = '#6b7280'  # Gray
        alert_icon = 'ℹ️'
        warnings = ['Set up your income and accounts to track overdraft risk']
        recommendations = [
            'Add your checking account balance',
            'Add your income sources',
            'Add your fixed monthly expenses'
        ]
    
    return jsonify({
        'risk_level': risk_level,
        'alert_color': alert_color,
        'alert_icon': alert_icon,
        'warnings': warnings,
        'recommendations': recommendations,
        'metrics': {
            'checking_balance': round(checking_balance, 2),
            'savings_balance': round(savings_balance, 2),
            'total_liquid': round(total_liquid, 2),
            'remaining_money': round(remaining_money, 2),
            'upcoming_bills': round(upcoming_bills, 2),
            'projected_remaining': round(projected_remaining, 2),
            'days_remaining': days_remaining
        }
    })

@app.route('/api/dashboard/budget-health-score', methods=['GET'])
def get_budget_health_score():
    """
    Calculate a comprehensive budget health score (0-100) based on multiple factors:
    - Account balances and emergency fund adequacy (25 points)
    - Spending vs budget adherence (25 points)
    - Savings rate (20 points)
    - Bill payment status and overdraft risk (20 points)
    - Financial setup completeness (10 points)
    
    Returns a score with breakdown, grade, and recommendations.
    """
    from datetime import datetime
    from calendar import monthrange
    
    now = datetime.now()
    current_year = now.year
    current_month = now.month
    current_day = now.day
    
    # Get days in current month
    days_in_month = monthrange(current_year, current_month)[1]
    days_remaining = days_in_month - current_day
    if days_remaining == 0:
        days_remaining = 1
    
    # Initialize score components
    score_breakdown = {
        'account_health': {'score': 0, 'max': 25, 'factors': []},
        'spending_adherence': {'score': 0, 'max': 25, 'factors': []},
        'savings_rate': {'score': 0, 'max': 20, 'factors': []},
        'bill_payment': {'score': 0, 'max': 20, 'factors': []},
        'setup_completeness': {'score': 0, 'max': 10, 'factors': []}
    }
    
    # Calculate account balances
    total_liquid = 0
    checking_balance = 0
    savings_balance = 0
    credit_balance = 0
    num_accounts = len(budget_data['accounts'])
    
    for account in budget_data['accounts']:
        balance = float(account.get('balance', 0))
        account_type = account.get('type', '').lower()
        
        if account_type == 'checking':
            checking_balance += balance
            total_liquid += balance
        elif account_type == 'savings':
            savings_balance += balance
            total_liquid += balance
        elif account_type == 'credit':
            credit_balance += balance
    
    # Calculate income and expenses
    total_income = 0
    num_income_sources = len(budget_data['income_sources'])
    
    for income in budget_data['income_sources']:
        amount = float(income.get('amount', 0))
        frequency = income.get('frequency', 'monthly')
        
        # Convert to monthly
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
            
        total_income += monthly_amount
    
    total_expenses = 0
    num_expenses = len(budget_data['fixed_expenses'])
    upcoming_bills = 0
    
    for expense in budget_data['fixed_expenses']:
        amount = float(expense.get('amount', 0))
        total_expenses += amount
        
        # Check bills due in next 7 days
        due_day = expense.get('due_day')
        if due_day:
            try:
                due_day = int(due_day)
                days_until_due = due_day - current_day
                if days_until_due < 0:
                    days_until_due += days_in_month
                if 0 <= days_until_due <= 7:
                    upcoming_bills += amount
            except (ValueError, TypeError):
                pass
    
    available_for_month = total_income - total_expenses
    
    # Calculate month-to-date spending
    mtd_spent = 0
    num_transactions = 0
    
    for transaction in budget_data['transactions']:
        try:
            trans_date = datetime.fromisoformat(transaction['date'])
            if trans_date.year == current_year and trans_date.month == current_month:
                amount = float(transaction.get('amount', 0))
                if amount > 0:
                    mtd_spent += amount
                    num_transactions += 1
        except (ValueError, KeyError):
            continue
    
    remaining_money = available_for_month - mtd_spent
    
    # ====================
    # 1. ACCOUNT HEALTH (25 points)
    # ====================
    if num_accounts > 0:
        # Checking balance health (10 points)
        if checking_balance >= 1000:
            score_breakdown['account_health']['score'] += 10
            score_breakdown['account_health']['factors'].append('✅ Healthy checking balance')
        elif checking_balance >= 500:
            score_breakdown['account_health']['score'] += 7
            score_breakdown['account_health']['factors'].append('⚠️ Adequate checking balance')
        elif checking_balance >= 200:
            score_breakdown['account_health']['score'] += 4
            score_breakdown['account_health']['factors'].append('⚠️ Low checking balance')
        elif checking_balance >= 0:
            score_breakdown['account_health']['score'] += 2
            score_breakdown['account_health']['factors'].append('🚨 Very low checking balance')
        else:
            score_breakdown['account_health']['factors'].append('🚨 Overdrawn checking account')
        
        # Emergency fund adequacy (10 points)
        # Target: 3-6 months of expenses
        if total_expenses > 0:
            months_covered = savings_balance / total_expenses
            if months_covered >= 6:
                score_breakdown['account_health']['score'] += 10
                score_breakdown['account_health']['factors'].append(f'✅ Strong emergency fund ({months_covered:.1f} months)')
            elif months_covered >= 3:
                score_breakdown['account_health']['score'] += 8
                score_breakdown['account_health']['factors'].append(f'✅ Adequate emergency fund ({months_covered:.1f} months)')
            elif months_covered >= 1:
                score_breakdown['account_health']['score'] += 5
                score_breakdown['account_health']['factors'].append(f'⚠️ Building emergency fund ({months_covered:.1f} months)')
            elif savings_balance > 0:
                score_breakdown['account_health']['score'] += 3
                score_breakdown['account_health']['factors'].append('⚠️ Emergency fund needs growth')
            else:
                score_breakdown['account_health']['factors'].append('🚨 No emergency fund')
        elif savings_balance > 1000:
            score_breakdown['account_health']['score'] += 8
            score_breakdown['account_health']['factors'].append('✅ Good savings balance')
        elif savings_balance > 0:
            score_breakdown['account_health']['score'] += 4
            score_breakdown['account_health']['factors'].append('⚠️ Savings needs growth')
        
        # Credit card management (5 points)
        if credit_balance != 0:
            if credit_balance > 0:
                score_breakdown['account_health']['score'] += 5
                score_breakdown['account_health']['factors'].append('✅ Credit card has positive balance')
            else:
                debt_amount = abs(credit_balance)
                if debt_amount < 1000:
                    score_breakdown['account_health']['score'] += 3
                    score_breakdown['account_health']['factors'].append(f'⚠️ Small credit debt (${debt_amount:.2f})')
                elif debt_amount < 5000:
                    score_breakdown['account_health']['score'] += 2
                    score_breakdown['account_health']['factors'].append(f'⚠️ Moderate credit debt (${debt_amount:.2f})')
                else:
                    score_breakdown['account_health']['score'] += 1
                    score_breakdown['account_health']['factors'].append(f'🚨 High credit debt (${debt_amount:.2f})')
        else:
            score_breakdown['account_health']['score'] += 5
            score_breakdown['account_health']['factors'].append('✅ No credit card tracked')
    else:
        score_breakdown['account_health']['factors'].append('⚠️ No accounts added yet')
    
    # ====================
    # 2. SPENDING ADHERENCE (25 points)
    # ====================
    if total_income > 0 and available_for_month > 0:
        # Compare actual spending to budget
        days_elapsed = current_day
        expected_spent = (available_for_month / days_in_month) * days_elapsed
        
        if expected_spent > 0:
            spending_ratio = mtd_spent / expected_spent
            
            if spending_ratio <= 0.8:
                score_breakdown['spending_adherence']['score'] += 25
                score_breakdown['spending_adherence']['factors'].append('✅ Excellent spending discipline (under budget)')
            elif spending_ratio <= 1.0:
                score_breakdown['spending_adherence']['score'] += 20
                score_breakdown['spending_adherence']['factors'].append('✅ On track with budget')
            elif spending_ratio <= 1.2:
                score_breakdown['spending_adherence']['score'] += 15
                score_breakdown['spending_adherence']['factors'].append('⚠️ Slightly over budget')
            elif spending_ratio <= 1.5:
                score_breakdown['spending_adherence']['score'] += 10
                score_breakdown['spending_adherence']['factors'].append('⚠️ Over budget - reduce spending')
            else:
                score_breakdown['spending_adherence']['score'] += 5
                score_breakdown['spending_adherence']['factors'].append('🚨 Significantly over budget')
        
        # Remaining budget health
        if remaining_money >= available_for_month * 0.5:
            score_breakdown['spending_adherence']['factors'].append('✅ Plenty of budget remaining')
        elif remaining_money >= 0:
            score_breakdown['spending_adherence']['factors'].append('⚠️ Budget running low')
        else:
            score_breakdown['spending_adherence']['factors'].append('🚨 Over budget for the month')
    else:
        score_breakdown['spending_adherence']['factors'].append('⚠️ Add income to track spending adherence')
    
    # ====================
    # 3. SAVINGS RATE (20 points)
    # ====================
    if total_income > 0:
        # Calculate net savings (income - expenses - spending)
        net_savings = total_income - total_expenses - mtd_spent
        savings_rate = (net_savings / total_income) * 100
        
        if savings_rate >= 20:
            score_breakdown['savings_rate']['score'] += 20
            score_breakdown['savings_rate']['factors'].append(f'✅ Excellent savings rate ({savings_rate:.1f}%)')
        elif savings_rate >= 10:
            score_breakdown['savings_rate']['score'] += 15
            score_breakdown['savings_rate']['factors'].append(f'✅ Good savings rate ({savings_rate:.1f}%)')
        elif savings_rate >= 5:
            score_breakdown['savings_rate']['score'] += 10
            score_breakdown['savings_rate']['factors'].append(f'⚠️ Modest savings rate ({savings_rate:.1f}%)')
        elif savings_rate >= 0:
            score_breakdown['savings_rate']['score'] += 5
            score_breakdown['savings_rate']['factors'].append(f'⚠️ Low savings rate ({savings_rate:.1f}%)')
        else:
            score_breakdown['savings_rate']['factors'].append(f'🚨 Negative savings rate ({savings_rate:.1f}%)')
        
        # Additional points for having savings goals
        num_goals = len(budget_data.get('savings_goals', []))
        if num_goals > 0:
            score_breakdown['savings_rate']['factors'].append(f'✅ {num_goals} savings goal(s) set')
    else:
        score_breakdown['savings_rate']['factors'].append('⚠️ Add income to calculate savings rate')
    
    # ====================
    # 4. BILL PAYMENT STATUS (20 points)
    # ====================
    if num_expenses > 0:
        # Check if upcoming bills can be covered
        if upcoming_bills > 0:
            if checking_balance >= upcoming_bills * 1.5:
                score_breakdown['bill_payment']['score'] += 10
                score_breakdown['bill_payment']['factors'].append('✅ Upcoming bills fully covered')
            elif checking_balance >= upcoming_bills:
                score_breakdown['bill_payment']['score'] += 7
                score_breakdown['bill_payment']['factors'].append('✅ Upcoming bills covered')
            else:
                score_breakdown['bill_payment']['score'] += 3
                score_breakdown['bill_payment']['factors'].append('🚨 Insufficient funds for upcoming bills')
        else:
            score_breakdown['bill_payment']['score'] += 10
            score_breakdown['bill_payment']['factors'].append('✅ No bills due in next 7 days')
        
        # Check overall bill coverage
        if total_liquid >= total_expenses * 2:
            score_breakdown['bill_payment']['score'] += 10
            score_breakdown['bill_payment']['factors'].append('✅ Strong bill payment capacity')
        elif total_liquid >= total_expenses:
            score_breakdown['bill_payment']['score'] += 7
            score_breakdown['bill_payment']['factors'].append('✅ Adequate bill payment capacity')
        elif total_liquid >= total_expenses * 0.5:
            score_breakdown['bill_payment']['score'] += 4
            score_breakdown['bill_payment']['factors'].append('⚠️ Limited bill payment capacity')
        else:
            score_breakdown['bill_payment']['score'] += 2
            score_breakdown['bill_payment']['factors'].append('🚨 Low bill payment capacity')
    else:
        score_breakdown['bill_payment']['score'] += 10
        score_breakdown['bill_payment']['factors'].append('⚠️ No expenses tracked yet')
    
    # ====================
    # 5. SETUP COMPLETENESS (10 points)
    # ====================
    setup_points = 0
    
    if num_accounts > 0:
        setup_points += 3
        score_breakdown['setup_completeness']['factors'].append('✅ Accounts configured')
    else:
        score_breakdown['setup_completeness']['factors'].append('⚠️ Add accounts')
    
    if num_income_sources > 0:
        setup_points += 3
        score_breakdown['setup_completeness']['factors'].append('✅ Income sources added')
    else:
        score_breakdown['setup_completeness']['factors'].append('⚠️ Add income sources')
    
    if num_expenses > 0:
        setup_points += 2
        score_breakdown['setup_completeness']['factors'].append('✅ Expenses tracked')
    else:
        score_breakdown['setup_completeness']['factors'].append('⚠️ Add expenses')
    
    if num_transactions > 0:
        setup_points += 2
        score_breakdown['setup_completeness']['factors'].append('✅ Transactions recorded')
    else:
        score_breakdown['setup_completeness']['factors'].append('⚠️ Record transactions')
    
    score_breakdown['setup_completeness']['score'] = setup_points
    
    # ====================
    # CALCULATE TOTAL SCORE
    # ====================
    total_score = sum(category['score'] for category in score_breakdown.values())
    
    # Determine grade and color
    if total_score >= 90:
        grade = 'A+'
        grade_text = 'Excellent'
        color = '#10b981'  # Green
        icon = '🌟'
    elif total_score >= 80:
        grade = 'A'
        grade_text = 'Very Good'
        color = '#10b981'
        icon = '✅'
    elif total_score >= 70:
        grade = 'B'
        grade_text = 'Good'
        color = '#3b82f6'  # Blue
        icon = '👍'
    elif total_score >= 60:
        grade = 'C'
        grade_text = 'Fair'
        color = '#f59e0b'  # Amber
        icon = '⚠️'
    elif total_score >= 50:
        grade = 'D'
        grade_text = 'Needs Improvement'
        color = '#f97316'  # Orange
        icon = '⚡'
    else:
        grade = 'F'
        grade_text = 'Critical'
        color = '#ef4444'  # Red
        icon = '🚨'
    
    # Generate recommendations based on weak areas
    recommendations = []
    
    # Check each category for improvement opportunities
    for category_name, category_data in score_breakdown.items():
        percentage = (category_data['score'] / category_data['max']) * 100
        
        if percentage < 50:
            if category_name == 'account_health':
                if checking_balance < 500:
                    recommendations.append('Build up your checking account buffer to at least $500')
                if savings_balance < total_expenses * 3:
                    recommendations.append('Focus on building an emergency fund (target: 3-6 months expenses)')
            elif category_name == 'spending_adherence':
                recommendations.append('Reduce spending to stay within budget')
                recommendations.append('Review and cut non-essential expenses')
            elif category_name == 'savings_rate':
                recommendations.append('Increase savings rate to at least 10% of income')
                recommendations.append('Look for ways to reduce expenses or increase income')
            elif category_name == 'bill_payment':
                recommendations.append('Ensure sufficient funds for upcoming bills')
                recommendations.append('Consider setting up automatic transfers for bill payment')
            elif category_name == 'setup_completeness':
                recommendations.append('Complete your budget setup for better tracking')
    
    # If score is good, provide positive reinforcement
    if total_score >= 80:
        recommendations.append('Great job! Keep up the good financial habits')
        recommendations.append('Consider increasing savings goals')
    elif total_score >= 70:
        recommendations.append('You\'re doing well - focus on weak areas to improve further')
    
    # Default recommendations if list is empty
    if not recommendations:
        recommendations = [
            'Complete your budget setup by adding accounts, income, and expenses',
            'Track your spending regularly',
            'Build an emergency fund',
            'Review your budget weekly'
        ]
    
    return jsonify({
        'score': total_score,
        'grade': grade,
        'grade_text': grade_text,
        'color': color,
        'icon': icon,
        'breakdown': score_breakdown,
        'recommendations': recommendations,
        'summary': {
            'total_income': round(total_income, 2),
            'total_expenses': round(total_expenses, 2),
            'total_liquid': round(total_liquid, 2),
            'savings_balance': round(savings_balance, 2),
            'mtd_spent': round(mtd_spent, 2),
            'remaining_money': round(remaining_money, 2)
        }
    })

@app.route('/api/dashboard/month-comparison', methods=['GET'])
def get_month_comparison():
    """
    Compare current month metrics with previous months
    Returns comparison data for income, expenses, spending, and savings
    """
    from datetime import datetime
    from calendar import month_name
    
    try:
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        
        # Calculate previous month
        if current_month == 1:
            prev_year = current_year - 1
            prev_month = 12
        else:
            prev_year = current_year
            prev_month = current_month - 1
        
        # Helper function to get month metrics
        def get_month_metrics(year, month):
            metrics = {
                'income': 0,
                'expenses': 0,
                'spending': 0,
                'transaction_count': 0,
                'savings': 0
            }
            
            # Calculate income (this is typically constant, but we'll track it)
            for income in budget_data.get('income_sources', []):
                amount = float(income.get('amount', 0))
                frequency = income.get('frequency', 'monthly')
                
                # Convert to monthly
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
                
                metrics['income'] += monthly_amount
            
            # Calculate fixed expenses
            for expense in budget_data.get('fixed_expenses', []):
                amount = float(expense.get('amount', 0))
                metrics['expenses'] += amount
            
            # Calculate spending from transactions
            for transaction in budget_data.get('transactions', []):
                try:
                    trans_date = datetime.fromisoformat(transaction['date'])
                    if trans_date.year == year and trans_date.month == month:
                        amount = float(transaction.get('amount', 0))
                        if amount > 0:
                            metrics['spending'] += amount
                            metrics['transaction_count'] += 1
                except (ValueError, KeyError):
                    continue
            
            # Calculate available money and implied savings
            available = metrics['income'] - metrics['expenses']
            metrics['savings'] = available - metrics['spending']
            
            return metrics
        
        # Get current and previous month metrics
        current = get_month_metrics(current_year, current_month)
        previous = get_month_metrics(prev_year, prev_month)
        
        # Calculate changes and percentages
        def calculate_change(current_val, prev_val):
            change = current_val - prev_val
            if prev_val != 0:
                percent_change = (change / prev_val) * 100
            else:
                percent_change = 100 if change > 0 else 0
            
            return {
                'current': round(current_val, 2),
                'previous': round(prev_val, 2),
                'change': round(change, 2),
                'percent_change': round(percent_change, 1),
                'direction': 'up' if change > 0 else 'down' if change < 0 else 'same'
            }
        
        # Build comparison object
        comparison = {
            'current_month': {
                'year': current_year,
                'month': current_month,
                'month_name': now.strftime('%B %Y')
            },
            'previous_month': {
                'year': prev_year,
                'month': prev_month,
                'month_name': f"{month_name[prev_month]} {prev_year}"
            },
            'income': calculate_change(current['income'], previous['income']),
            'expenses': calculate_change(current['expenses'], previous['expenses']),
            'spending': calculate_change(current['spending'], previous['spending']),
            'savings': calculate_change(current['savings'], previous['savings']),
            'transaction_count': calculate_change(current['transaction_count'], previous['transaction_count']),
            'has_data': current['transaction_count'] > 0 or previous['transaction_count'] > 0
        }
        
        # Add insights
        insights = []
        
        # Spending insights
        if comparison['spending']['direction'] == 'down' and abs(comparison['spending']['percent_change']) > 5:
            insights.append({
                'type': 'positive',
                'icon': '📉',
                'message': f"Great job! Spending decreased by {abs(comparison['spending']['percent_change'])}% from last month"
            })
        elif comparison['spending']['direction'] == 'up' and comparison['spending']['percent_change'] > 10:
            insights.append({
                'type': 'warning',
                'icon': '📈',
                'message': f"Spending increased by {comparison['spending']['percent_change']}% from last month"
            })
        
        # Savings insights
        if comparison['savings']['direction'] == 'up' and comparison['savings']['change'] > 0:
            insights.append({
                'type': 'positive',
                'icon': '💰',
                'message': f"Saving ${abs(comparison['savings']['change']):.2f} more than last month"
            })
        elif comparison['savings']['direction'] == 'down' and abs(comparison['savings']['change']) > 100:
            insights.append({
                'type': 'warning',
                'icon': '⚠️',
                'message': f"Savings decreased by ${abs(comparison['savings']['change']):.2f} from last month"
            })
        
        # Transaction count insights
        if comparison['transaction_count']['direction'] == 'up' and comparison['transaction_count']['percent_change'] > 20:
            insights.append({
                'type': 'info',
                'icon': '🛒',
                'message': f"{int(comparison['transaction_count']['change'])} more transactions than last month"
            })
        
        comparison['insights'] = insights
        
        return jsonify(comparison)
        
    except Exception as e:
        print(f"Error in month comparison: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e), 'has_data': False}), 500

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
