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

# Helper function for variable income statistics
def _update_variable_income_stats(income):
    """Calculate and update statistics for variable income sources"""
    from datetime import datetime, timedelta
    from statistics import mean, stdev
    
    payments = income.get('actual_payments', [])
    if not payments:
        return
    
    # Initialize fields if they don't exist (backwards compatibility)
    if 'is_variable' not in income:
        income['is_variable'] = income.get('type') in ['freelance', 'investment', 'other']
    if 'payment_count' not in income:
        income['payment_count'] = 0
    
    income['payment_count'] = len(payments)
    
    # Only calculate if we have enough data (at least 2 payments)
    if income['payment_count'] < 2:
        income['average_monthly'] = income.get('amount', 0)
        income['income_variance'] = 0
        return
    
    # Get payments from last 6 months
    six_months_ago = datetime.now() - timedelta(days=180)
    recent_payments = [
        p for p in payments
        if datetime.strptime(p['date'], '%Y-%m-%d') >= six_months_ago
    ]
    
    if not recent_payments:
        return
    
    # Group payments by month to calculate monthly totals
    from collections import defaultdict
    monthly_totals = defaultdict(float)
    
    for payment in recent_payments:
        payment_date = datetime.strptime(payment['date'], '%Y-%m-%d')
        month_key = f"{payment_date.year}-{payment_date.month:02d}"
        monthly_totals[month_key] += payment['amount']
    
    # Calculate average and variance
    if monthly_totals:
        monthly_amounts = list(monthly_totals.values())
        income['average_monthly'] = mean(monthly_amounts)
        
        # Calculate coefficient of variation (standard deviation / mean * 100)
        if len(monthly_amounts) > 1 and income['average_monthly'] > 0:
            std_dev = stdev(monthly_amounts)
            income['income_variance'] = (std_dev / income['average_monthly']) * 100
        else:
            income['income_variance'] = 0
    
    # Mark as variable if variance is high (>15%)
    if income['income_variance'] > 15:
        income['is_variable'] = True

# Add test data for demonstration (only in development mode)
def load_test_data():
    """Load sample data for testing Phase 3 features"""
    from datetime import datetime, timedelta
    
    # Only load test data if the data file is empty or doesn't exist
    if budget_data['accounts'] or budget_data['income_sources'] or budget_data['transactions']:
        print("Existing data found. Skipping test data load.")
        return
    
    print("Loading test data for demonstration...")
    today = datetime.now()
    
    # Generate dates for the past 6 months
    def get_month_dates(months_ago):
        """Get a date from X months ago"""
        target_month = today.month - months_ago
        target_year = today.year
        while target_month <= 0:
            target_month += 12
            target_year -= 1
        return datetime(target_year, target_month, 15)
    
    # Sample Accounts
    budget_data['accounts'] = [
        {
            'id': 1,
            'name': 'Primary Checking',
            'type': 'checking',
            'balance': 2500.00,
            'created_at': datetime.now().isoformat()
        },
        {
            'id': 2,
            'name': 'Emergency Savings',
            'type': 'savings',
            'balance': 8500.00,
            'created_at': datetime.now().isoformat()
        },
        {
            'id': 3,
            'name': 'Credit Card',
            'type': 'credit',
            'balance': -450.00,
            'created_at': datetime.now().isoformat()
        }
    ]
    
    # Sample Income Sources with Variable Income Examples
    budget_data['income_sources'] = [
        # FIXED INCOME: Stable salary with consistent payments (12 months)
        {
            'id': 1,
            'name': 'Software Developer Salary',
            'type': 'salary',
            'earner_name': 'John',
            'amount': 5500.00,
            'frequency': 'monthly',
            'is_variable': False,
            'average_monthly': 5500.00,
            'income_variance': 0,
            'payment_count': 12,
            'created_at': (today - timedelta(days=365)).isoformat(),
            'actual_payments': [
                {'id': 1001, 'date': get_month_dates(11).strftime('%Y-%m-%d'), 'amount': 5500.00, 'notes': 'January salary', 'recorded_at': datetime.now().isoformat()},
                {'id': 1002, 'date': get_month_dates(10).strftime('%Y-%m-%d'), 'amount': 5500.00, 'notes': 'February salary', 'recorded_at': datetime.now().isoformat()},
                {'id': 1003, 'date': get_month_dates(9).strftime('%Y-%m-%d'), 'amount': 5500.00, 'notes': 'March salary', 'recorded_at': datetime.now().isoformat()},
                {'id': 1004, 'date': get_month_dates(8).strftime('%Y-%m-%d'), 'amount': 5500.00, 'notes': 'April salary', 'recorded_at': datetime.now().isoformat()},
                {'id': 1005, 'date': get_month_dates(7).strftime('%Y-%m-%d'), 'amount': 5500.00, 'notes': 'May salary', 'recorded_at': datetime.now().isoformat()},
                {'id': 1006, 'date': get_month_dates(6).strftime('%Y-%m-%d'), 'amount': 5500.00, 'notes': 'June salary', 'recorded_at': datetime.now().isoformat()},
                {'id': 1007, 'date': get_month_dates(5).strftime('%Y-%m-%d'), 'amount': 5500.00, 'notes': 'July salary', 'recorded_at': datetime.now().isoformat()},
                {'id': 1008, 'date': get_month_dates(4).strftime('%Y-%m-%d'), 'amount': 5500.00, 'notes': 'August salary', 'recorded_at': datetime.now().isoformat()},
                {'id': 1009, 'date': get_month_dates(3).strftime('%Y-%m-%d'), 'amount': 5500.00, 'notes': 'September salary', 'recorded_at': datetime.now().isoformat()},
                {'id': 1010, 'date': get_month_dates(2).strftime('%Y-%m-%d'), 'amount': 5500.00, 'notes': 'October salary', 'recorded_at': datetime.now().isoformat()},
                {'id': 1011, 'date': get_month_dates(1).strftime('%Y-%m-%d'), 'amount': 5500.00, 'notes': 'November salary', 'recorded_at': datetime.now().isoformat()},
                {'id': 1012, 'date': today.strftime('%Y-%m-%d'), 'amount': 5500.00, 'notes': 'December salary', 'recorded_at': datetime.now().isoformat()},
            ],
            'expected_next_payment': None,
            'federal_tax_percent': 12.0,
            'state_tax_percent': 5.0,
            'social_security_percent': 6.2,
            'medicare_percent': 1.45,
            'other_deductions': 300.00
        },
        
        # MODERATELY VARIABLE: Freelance work with some variation (12 months)
        {
            'id': 2,
            'name': 'Freelance Web Design',
            'type': 'freelance',
            'earner_name': 'John',
            'amount': 1200.00,
            'frequency': 'monthly',
            'is_variable': True,
            'average_monthly': 1383.33,  # Will be recalculated
            'income_variance': 28.5,  # Will be recalculated
            'payment_count': 12,
            'created_at': (today - timedelta(days=365)).isoformat(),
            'actual_payments': [
                {'id': 2001, 'date': get_month_dates(11).strftime('%Y-%m-%d'), 'amount': 850.00, 'notes': 'Slow month', 'recorded_at': datetime.now().isoformat()},
                {'id': 2002, 'date': get_month_dates(10).strftime('%Y-%m-%d'), 'amount': 1300.00, 'notes': 'Regular work', 'recorded_at': datetime.now().isoformat()},
                {'id': 2003, 'date': get_month_dates(9).strftime('%Y-%m-%d'), 'amount': 1450.00, 'notes': 'Good month', 'recorded_at': datetime.now().isoformat()},
                {'id': 2004, 'date': get_month_dates(8).strftime('%Y-%m-%d'), 'amount': 1100.00, 'notes': 'Average', 'recorded_at': datetime.now().isoformat()},
                {'id': 2005, 'date': get_month_dates(7).strftime('%Y-%m-%d'), 'amount': 1650.00, 'notes': 'Busy month', 'recorded_at': datetime.now().isoformat()},
                {'id': 2006, 'date': get_month_dates(6).strftime('%Y-%m-%d'), 'amount': 1200.00, 'notes': 'Normal', 'recorded_at': datetime.now().isoformat()},
                {'id': 2007, 'date': get_month_dates(5).strftime('%Y-%m-%d'), 'amount': 950.00, 'notes': 'Small project', 'recorded_at': datetime.now().isoformat()},
                {'id': 2008, 'date': get_month_dates(4).strftime('%Y-%m-%d'), 'amount': 1800.00, 'notes': 'Large client project', 'recorded_at': datetime.now().isoformat()},
                {'id': 2009, 'date': get_month_dates(3).strftime('%Y-%m-%d'), 'amount': 1100.00, 'notes': 'Two small projects', 'recorded_at': datetime.now().isoformat()},
                {'id': 2010, 'date': get_month_dates(2).strftime('%Y-%m-%d'), 'amount': 1600.00, 'notes': 'Medium project', 'recorded_at': datetime.now().isoformat()},
                {'id': 2011, 'date': get_month_dates(1).strftime('%Y-%m-%d'), 'amount': 1250.00, 'notes': 'Website redesign', 'recorded_at': datetime.now().isoformat()},
                {'id': 2012, 'date': today.strftime('%Y-%m-%d'), 'amount': 1600.00, 'notes': 'E-commerce site', 'recorded_at': datetime.now().isoformat()},
            ],
            'expected_next_payment': None,
            'federal_tax_percent': 0,
            'state_tax_percent': 0,
            'social_security_percent': 0,
            'medicare_percent': 0,
            'other_deductions': 0
        },
        
        # HIGHLY VARIABLE: Real estate commissions with big swings (12 months)
        {
            'id': 3,
            'name': 'Real Estate Sales Commission',
            'type': 'other',
            'earner_name': 'Sarah',
            'amount': 2500.00,
            'frequency': 'monthly',
            'is_variable': True,
            'average_monthly': 2583.33,  # Will be recalculated
            'income_variance': 67.2,  # Will be recalculated (high!)
            'payment_count': 12,
            'created_at': (today - timedelta(days=365)).isoformat(),
            'actual_payments': [
                {'id': 3001, 'date': get_month_dates(11).strftime('%Y-%m-%d'), 'amount': 3500.00, 'notes': 'Good start to year', 'recorded_at': datetime.now().isoformat()},
                {'id': 3002, 'date': get_month_dates(10).strftime('%Y-%m-%d'), 'amount': 1200.00, 'notes': 'Quiet month', 'recorded_at': datetime.now().isoformat()},
                {'id': 3003, 'date': get_month_dates(9).strftime('%Y-%m-%d'), 'amount': 2800.00, 'notes': 'Spring market', 'recorded_at': datetime.now().isoformat()},
                {'id': 3004, 'date': get_month_dates(8).strftime('%Y-%m-%d'), 'amount': 4200.00, 'notes': 'Great month!', 'recorded_at': datetime.now().isoformat()},
                {'id': 3005, 'date': get_month_dates(7).strftime('%Y-%m-%d'), 'amount': 2500.00, 'notes': 'Average', 'recorded_at': datetime.now().isoformat()},
                {'id': 3006, 'date': get_month_dates(6).strftime('%Y-%m-%d'), 'amount': 1800.00, 'notes': 'Summer slowdown', 'recorded_at': datetime.now().isoformat()},
                {'id': 3007, 'date': get_month_dates(5).strftime('%Y-%m-%d'), 'amount': 800.00, 'notes': 'Slow month, one small sale', 'recorded_at': datetime.now().isoformat()},
                {'id': 3008, 'date': get_month_dates(4).strftime('%Y-%m-%d'), 'amount': 4500.00, 'notes': 'Big sale! Luxury home', 'recorded_at': datetime.now().isoformat()},
                {'id': 3009, 'date': get_month_dates(3).strftime('%Y-%m-%d'), 'amount': 1500.00, 'notes': 'One condo sale', 'recorded_at': datetime.now().isoformat()},
                {'id': 3010, 'date': get_month_dates(2).strftime('%Y-%m-%d'), 'amount': 3200.00, 'notes': 'Two sales', 'recorded_at': datetime.now().isoformat()},
                {'id': 3011, 'date': get_month_dates(1).strftime('%Y-%m-%d'), 'amount': 2800.00, 'notes': 'Average month', 'recorded_at': datetime.now().isoformat()},
                {'id': 3012, 'date': today.strftime('%Y-%m-%d'), 'amount': 2700.00, 'notes': 'December sales', 'recorded_at': datetime.now().isoformat()},
            ],
            'expected_next_payment': None,
            'federal_tax_percent': 0,
            'state_tax_percent': 0,
            'social_security_percent': 0,
            'medicare_percent': 0,
            'other_deductions': 0
        },
        
        # STABLE VARIABLE: Part-time job marked as variable but actually stable (12 months)
        {
            'id': 4,
            'name': 'Part-Time Consulting',
            'type': 'other',
            'earner_name': 'Sarah',
            'amount': 800.00,
            'frequency': 'monthly',
            'is_variable': True,
            'average_monthly': 825.00,  # Will be recalculated
            'income_variance': 8.5,  # Will be recalculated (low variance)
            'payment_count': 12,
            'created_at': (today - timedelta(days=365)).isoformat(),
            'actual_payments': [
                {'id': 4001, 'date': get_month_dates(11).strftime('%Y-%m-%d'), 'amount': 800.00, 'notes': 'Regular hours', 'recorded_at': datetime.now().isoformat()},
                {'id': 4002, 'date': get_month_dates(10).strftime('%Y-%m-%d'), 'amount': 850.00, 'notes': 'Extra hours', 'recorded_at': datetime.now().isoformat()},
                {'id': 4003, 'date': get_month_dates(9).strftime('%Y-%m-%d'), 'amount': 800.00, 'notes': 'Regular hours', 'recorded_at': datetime.now().isoformat()},
                {'id': 4004, 'date': get_month_dates(8).strftime('%Y-%m-%d'), 'amount': 800.00, 'notes': 'Regular hours', 'recorded_at': datetime.now().isoformat()},
                {'id': 4005, 'date': get_month_dates(7).strftime('%Y-%m-%d'), 'amount': 850.00, 'notes': 'Extra hours', 'recorded_at': datetime.now().isoformat()},
                {'id': 4006, 'date': get_month_dates(6).strftime('%Y-%m-%d'), 'amount': 800.00, 'notes': 'Regular hours', 'recorded_at': datetime.now().isoformat()},
                {'id': 4007, 'date': get_month_dates(5).strftime('%Y-%m-%d'), 'amount': 800.00, 'notes': 'Regular hours', 'recorded_at': datetime.now().isoformat()},
                {'id': 4008, 'date': get_month_dates(4).strftime('%Y-%m-%d'), 'amount': 900.00, 'notes': 'Extra hours', 'recorded_at': datetime.now().isoformat()},
                {'id': 4009, 'date': get_month_dates(3).strftime('%Y-%m-%d'), 'amount': 800.00, 'notes': 'Regular hours', 'recorded_at': datetime.now().isoformat()},
                {'id': 4010, 'date': get_month_dates(2).strftime('%Y-%m-%d'), 'amount': 850.00, 'notes': 'Slightly more hours', 'recorded_at': datetime.now().isoformat()},
                {'id': 4011, 'date': get_month_dates(1).strftime('%Y-%m-%d'), 'amount': 800.00, 'notes': 'Regular hours', 'recorded_at': datetime.now().isoformat()},
                {'id': 4012, 'date': today.strftime('%Y-%m-%d'), 'amount': 800.00, 'notes': 'Regular hours', 'recorded_at': datetime.now().isoformat()},
            ],
            'expected_next_payment': None,
            'federal_tax_percent': 0,
            'state_tax_percent': 0,
            'social_security_percent': 0,
            'medicare_percent': 0,
            'other_deductions': 0
        },
        
        # NEW VARIABLE INCOME: Only 2 payments (minimal data)
        {
            'id': 5,
            'name': 'YouTube Ad Revenue',
            'type': 'other',
            'earner_name': None,
            'amount': 300.00,
            'frequency': 'monthly',
            'is_variable': True,
            'average_monthly': 300.00,  # Will be recalculated
            'income_variance': 0,  # Will be recalculated (needs more data)
            'payment_count': 2,
            'created_at': (today - timedelta(days=60)).isoformat(),
            'actual_payments': [
                {'id': 5001, 'date': get_month_dates(1).strftime('%Y-%m-%d'), 'amount': 180.00, 'notes': 'First month', 'recorded_at': datetime.now().isoformat()},
                {'id': 5002, 'date': today.strftime('%Y-%m-%d'), 'amount': 420.00, 'notes': 'Viral video!', 'recorded_at': datetime.now().isoformat()},
            ],
            'expected_next_payment': None,
            'federal_tax_percent': 0,
            'state_tax_percent': 0,
            'social_security_percent': 0,
            'medicare_percent': 0,
            'other_deductions': 0
        }
    ]
    
    # Recalculate statistics for all variable income sources
    for income in budget_data['income_sources']:
        if income.get('is_variable') and len(income.get('actual_payments', [])) > 0:
            _update_variable_income_stats(income)
    
    # Sample Fixed Expenses with various due dates
    # Realistic expenses for a family making ~$60k/year (~$5k/month)
    budget_data['fixed_expenses'] = [
        {
            'id': 1,
            'name': 'Rent/Mortgage',
            'category': 'Housing',
            'amount': 1800.00,
            'due_day': today.day + 2,  # Due in 2 days (urgent)
            'is_autopay': False,
            'is_paid': False,
            'created_at': datetime.now().isoformat()
        },
        {
            'id': 2,
            'name': 'Car Payment',
            'category': 'Transportation',
            'amount': 450.00,
            'due_day': today.day + 5,  # Due in 5 days (soon)
            'is_autopay': True,
            'is_paid': False,
            'created_at': datetime.now().isoformat()
        },
        {
            'id': 3,
            'name': 'Electric Bill',
            'category': 'Utilities',
            'amount': 120.00,
            'due_day': today.day + 6,  # Due in 6 days
            'is_autopay': False,
            'is_paid': False,
            'created_at': datetime.now().isoformat()
        },
        {
            'id': 4,
            'name': 'Internet',
            'category': 'Utilities',
            'amount': 89.99,
            'due_day': today.day + 15,  # Due later (not in 7-day window)
            'is_autopay': True,
            'is_paid': False,
            'created_at': datetime.now().isoformat()
        },
        {
            'id': 5,
            'name': 'Car Insurance',
            'category': 'Insurance',
            'amount': 180.00,
            'due_day': today.day + 1,  # Due tomorrow (critical)
            'is_autopay': False,
            'is_paid': False,
            'created_at': datetime.now().isoformat()
        },
        {
            'id': 6,
            'name': 'Phone Bill',
            'category': 'Utilities',
            'amount': 95.00,
            'due_day': today.day + 20,
            'is_autopay': True,
            'is_paid': False,
            'created_at': datetime.now().isoformat()
        },
        {
            'id': 7,
            'name': 'Water/Sewer',
            'category': 'Utilities',
            'amount': 65.00,
            'due_day': today.day + 12,
            'is_autopay': False,
            'is_paid': False,
            'created_at': datetime.now().isoformat()
        },
        {
            'id': 8,
            'name': 'Student Loan Payment',
            'category': 'Debt',
            'amount': 225.00,
            'due_day': today.day + 8,
            'is_autopay': True,
            'is_paid': False,
            'created_at': datetime.now().isoformat()
        },
        {
            'id': 9,
            'name': 'Netflix',
            'category': 'Subscriptions',
            'amount': 15.99,
            'due_day': today.day + 14,
            'is_autopay': True,
            'is_paid': False,
            'created_at': datetime.now().isoformat()
        },
        {
            'id': 10,
            'name': 'Spotify Family',
            'category': 'Subscriptions',
            'amount': 16.99,
            'due_day': today.day + 18,
            'is_autopay': True,
            'is_paid': False,
            'created_at': datetime.now().isoformat()
        },
        {
            'id': 11,
            'name': 'Health Insurance',
            'category': 'Insurance',
            'amount': 285.00,
            'due_day': today.day + 3,
            'is_autopay': True,
            'is_paid': False,
            'created_at': datetime.now().isoformat()
        },
        {
            'id': 12,
            'name': 'Childcare',
            'category': 'Childcare',
            'amount': 600.00,
            'due_day': today.day + 1,
            'is_autopay': False,
            'is_paid': False,
            'created_at': datetime.now().isoformat()
        }
    ]
    
    # Sample Transactions - Create realistic spending patterns
    transaction_id = 1
    
    # Current month transactions (for MTD spending and velocity)
    current_month_start = datetime(today.year, today.month, 1)
    categories_current = [
        ('Groceries', [85, 120, 95, 110, 88]),  # Higher this month
        ('Dining Out', [45, 60, 35, 52, 48]),
        ('Gas', [55, 60, 58]),
        ('Entertainment', [25, 40, 30]),
        ('Miscellaneous', [20, 35, 15, 28])
    ]
    
    for category, amounts in categories_current:
        for i, amount in enumerate(amounts):
            budget_data['transactions'].append({
                'id': transaction_id,
                'date': (current_month_start + timedelta(days=i*2 + 1)).isoformat(),
                'amount': amount,
                'category': category,
                'description': f'{category} purchase',
                'created_at': datetime.now().isoformat()
            })
            transaction_id += 1
    
    # Previous month transactions (for pattern comparison)
    prev_month = today.month - 1 if today.month > 1 else 12
    prev_year = today.year if today.month > 1 else today.year - 1
    prev_month_start = datetime(prev_year, prev_month, 1)
    
    categories_prev = [
        ('Groceries', [65, 70, 68, 72, 69, 71, 67, 70]),  # Lower last month (will trigger alert)
        ('Dining Out', [40, 38, 42, 45, 41, 39, 43]),
        ('Gas', [52, 55, 54, 53, 56]),
        ('Entertainment', [30, 35, 28, 32]),
        ('Miscellaneous', [18, 22, 25, 20])
    ]
    
    for category, amounts in categories_prev:
        for i, amount in enumerate(amounts):
            budget_data['transactions'].append({
                'id': transaction_id,
                'date': (prev_month_start + timedelta(days=i*3)).isoformat(),
                'amount': amount,
                'category': category,
                'description': f'{category} purchase',
                'created_at': datetime.now().isoformat()
            })
            transaction_id += 1
    
    # Two months ago transactions (for better pattern analysis)
    two_months_ago = prev_month - 1 if prev_month > 1 else 12
    two_months_year = prev_year if prev_month > 1 else prev_year - 1
    two_months_start = datetime(two_months_year, two_months_ago, 1)
    
    categories_two_months = [
        ('Groceries', [68, 72, 70, 71, 69, 73, 68]),
        ('Dining Out', [42, 45, 40, 43, 41]),
        ('Gas', [54, 56, 55, 57]),
        ('Entertainment', [32, 35, 30]),
        ('Miscellaneous', [20, 24, 22])
    ]
    
    for category, amounts in categories_two_months:
        for i, amount in enumerate(amounts):
            budget_data['transactions'].append({
                'id': transaction_id,
                'date': (two_months_start + timedelta(days=i*3)).isoformat(),
                'amount': amount,
                'category': category,
                'description': f'{category} purchase',
                'created_at': datetime.now().isoformat()
            })
            transaction_id += 1
    
    # Save the test data
    save_data()
    print(f"Test data loaded successfully!")
    print(f"  - {len(budget_data['accounts'])} accounts")
    print(f"  - {len(budget_data['income_sources'])} income sources")
    print(f"  - {len(budget_data['fixed_expenses'])} fixed expenses")
    print(f"  - {len(budget_data['transactions'])} transactions")

# Load test data in development mode - DISABLED TO START WITH CLEAN APP
# Uncomment the line below if you want test data
# if not os.environ.get('BUDGET_APP_DATA_DIR') or os.environ.get('LOAD_TEST_DATA', 'true').lower() == 'true':
#     load_test_data()

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
            'total_liabilities': 0,
            'has_data': len(budget_data['accounts']) > 0  # Flag to indicate if any accounts exist
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
        
        # Round all values (except has_data flag)
        for key in summary:
            if key != 'has_data':
                summary[key] = round(summary[key], 2)
        
        return jsonify(summary)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Helper function to update variable income statistics
# Income endpoints
@app.route('/api/income', methods=['GET'])
def get_income_sources():
    """Get all income sources"""
    return jsonify(budget_data['income_sources'])

@app.route('/api/income/by-earner', methods=['GET'])
def get_income_by_earner():
    """Get income sources grouped by earner"""
    earners = {}
    unassigned = []
    
    for income in budget_data['income_sources']:
        earner_name = income.get('earner_name')
        
        if earner_name:
            if earner_name not in earners:
                earners[earner_name] = {
                    'name': earner_name,
                    'income_sources': [],
                    'total_monthly': 0
                }
            
            earners[earner_name]['income_sources'].append(income)
            
            # Calculate monthly amount
            amount = income.get('amount', 0)
            frequency = income.get('frequency', 'monthly')
            
            if frequency == 'weekly':
                monthly = amount * 52 / 12
            elif frequency == 'bi-weekly':
                monthly = amount * 26 / 12
            elif frequency == 'annual':
                monthly = amount / 12
            else:  # monthly
                monthly = amount
            
            earners[earner_name]['total_monthly'] += monthly
        else:
            unassigned.append(income)
    
    return jsonify({
        'earners': list(earners.values()),
        'unassigned': unassigned
    })

@app.route('/api/income', methods=['POST'])
def add_income_source():
    """Add a new income source"""
    income = request.json
    
    # Validate required fields
    required_fields = ['type', 'name', 'amount', 'frequency']
    for field in required_fields:
        if field not in income or not income[field]:
            return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
    
    # Validate income type
    valid_types = ['salary', 'secondary-salary', 'freelance', 'investment', 'rental', 'other']
    if income['type'] not in valid_types:
        return jsonify({'success': False, 'error': 'Invalid income type'}), 400
    
    # Validate frequency
    valid_frequencies = ['weekly', 'bi-weekly', 'monthly', 'annual']
    if income['frequency'] not in valid_frequencies:
        return jsonify({'success': False, 'error': 'Invalid frequency'}), 400
    
    # Validate amount is a positive number
    try:
        amount = float(income['amount'])
        if amount <= 0:
            return jsonify({'success': False, 'error': 'Amount must be greater than 0'}), 400
        income['amount'] = amount
    except (ValueError, TypeError):
        return jsonify({'success': False, 'error': 'Invalid amount'}), 400
    
    # Sanitize name (prevent XSS)
    income['name'] = str(income['name']).strip()[:100]  # Limit to 100 characters
    if not income['name']:
        return jsonify({'success': False, 'error': 'Name cannot be empty'}), 400
    
    # Sanitize earner_name (for multiple income earners in household)
    if 'earner_name' in income and income['earner_name']:
        income['earner_name'] = str(income['earner_name']).strip()[:100]  # Limit to 100 characters
    else:
        income['earner_name'] = None  # Optional field
    
    # Sanitize notes if present
    if 'notes' in income and income['notes']:
        income['notes'] = str(income['notes']).strip()[:500]  # Limit to 500 characters
    
    # Validate and sanitize tax withholding fields
    # Federal tax percentage
    if 'federal_tax_percent' in income:
        try:
            federal_tax = float(income['federal_tax_percent'])
            if federal_tax < 0 or federal_tax > 100:
                return jsonify({'success': False, 'error': 'Federal tax must be between 0 and 100%'}), 400
            income['federal_tax_percent'] = federal_tax
        except (ValueError, TypeError):
            income['federal_tax_percent'] = 0
    else:
        income['federal_tax_percent'] = 0
    
    # State tax percentage
    if 'state_tax_percent' in income:
        try:
            state_tax = float(income['state_tax_percent'])
            if state_tax < 0 or state_tax > 100:
                return jsonify({'success': False, 'error': 'State tax must be between 0 and 100%'}), 400
            income['state_tax_percent'] = state_tax
        except (ValueError, TypeError):
            income['state_tax_percent'] = 0
    else:
        income['state_tax_percent'] = 0
    
    # Social Security percentage
    if 'social_security_percent' in income:
        try:
            ss_tax = float(income['social_security_percent'])
            if ss_tax < 0 or ss_tax > 100:
                return jsonify({'success': False, 'error': 'Social Security must be between 0 and 100%'}), 400
            income['social_security_percent'] = ss_tax
        except (ValueError, TypeError):
            income['social_security_percent'] = 6.2  # Default
    else:
        income['social_security_percent'] = 6.2  # Default
    
    # Medicare percentage
    if 'medicare_percent' in income:
        try:
            medicare = float(income['medicare_percent'])
            if medicare < 0 or medicare > 100:
                return jsonify({'success': False, 'error': 'Medicare must be between 0 and 100%'}), 400
            income['medicare_percent'] = medicare
        except (ValueError, TypeError):
            income['medicare_percent'] = 1.45  # Default
    else:
        income['medicare_percent'] = 1.45  # Default
    
    # Other deductions (flat dollar amount)
    if 'other_deductions' in income:
        try:
            other_ded = float(income['other_deductions'])
            if other_ded < 0:
                return jsonify({'success': False, 'error': 'Other deductions cannot be negative'}), 400
            income['other_deductions'] = other_ded
        except (ValueError, TypeError):
            income['other_deductions'] = 0
    else:
        income['other_deductions'] = 0
    
    income['id'] = int(datetime.now().timestamp() * 1000)
    income['created_at'] = datetime.now().isoformat()
    income['updated_at'] = datetime.now().isoformat()
    
    # Initialize actual income tracking fields
    income['actual_payments'] = []  # List of actual payments received: [{date, amount, notes}]
    income['expected_next_payment'] = None  # When the next payment is expected
    
    # Initialize variable income tracking fields
    # If user explicitly set is_variable, use that; otherwise auto-detect based on type
    if 'is_variable' not in income or income['is_variable'] is None:
        income['is_variable'] = income['type'] in ['freelance', 'investment', 'other']  # Auto-detect variable income types
    else:
        # User explicitly set it, convert to boolean
        income['is_variable'] = bool(income['is_variable'])
    
    income['average_monthly'] = income['amount']  # Start with expected amount, will update as payments come in
    income['income_variance'] = 0  # Track variability percentage
    income['payment_count'] = 0  # Number of payments received
    
    budget_data['income_sources'].append(income)
    save_data()
    return jsonify({'success': True, 'data': income})

@app.route('/api/income/<int:income_id>', methods=['PUT'])
def update_income_source(income_id):
    """Update an existing income source"""
    updated_data = request.json
    
    # Find the income source
    income = None
    for inc in budget_data['income_sources']:
        if inc['id'] == income_id:
            income = inc
            break
    
    if not income:
        return jsonify({'success': False, 'error': 'Income source not found'}), 404
    
    # Validate type if provided
    if 'type' in updated_data:
        valid_types = ['salary', 'secondary-salary', 'freelance', 'investment', 'rental', 'other']
        if updated_data['type'] not in valid_types:
            return jsonify({'success': False, 'error': 'Invalid income type'}), 400
    
    # Validate frequency if provided
    if 'frequency' in updated_data:
        valid_frequencies = ['weekly', 'bi-weekly', 'monthly', 'annual']
        if updated_data['frequency'] not in valid_frequencies:
            return jsonify({'success': False, 'error': 'Invalid frequency'}), 400
    
    # Validate amount if provided
    if 'amount' in updated_data:
        try:
            amount = float(updated_data['amount'])
            if amount <= 0:
                return jsonify({'success': False, 'error': 'Amount must be greater than 0'}), 400
            updated_data['amount'] = amount
        except (ValueError, TypeError):
            return jsonify({'success': False, 'error': 'Invalid amount'}), 400
    
    # Sanitize name if provided
    if 'name' in updated_data:
        updated_data['name'] = str(updated_data['name']).strip()[:100]
        if not updated_data['name']:
            return jsonify({'success': False, 'error': 'Name cannot be empty'}), 400
    
    # Sanitize earner_name if provided (for multiple income earners in household)
    if 'earner_name' in updated_data:
        if updated_data['earner_name']:
            updated_data['earner_name'] = str(updated_data['earner_name']).strip()[:100]
        else:
            updated_data['earner_name'] = None
    
    # Sanitize notes if provided
    if 'notes' in updated_data and updated_data['notes']:
        updated_data['notes'] = str(updated_data['notes']).strip()[:500]
    
    # Validate and sanitize tax withholding fields if provided
    if 'federal_tax_percent' in updated_data:
        try:
            federal_tax = float(updated_data['federal_tax_percent'])
            if federal_tax < 0 or federal_tax > 100:
                return jsonify({'success': False, 'error': 'Federal tax must be between 0 and 100%'}), 400
            updated_data['federal_tax_percent'] = federal_tax
        except (ValueError, TypeError):
            return jsonify({'success': False, 'error': 'Invalid federal tax value'}), 400
    
    if 'state_tax_percent' in updated_data:
        try:
            state_tax = float(updated_data['state_tax_percent'])
            if state_tax < 0 or state_tax > 100:
                return jsonify({'success': False, 'error': 'State tax must be between 0 and 100%'}), 400
            updated_data['state_tax_percent'] = state_tax
        except (ValueError, TypeError):
            return jsonify({'success': False, 'error': 'Invalid state tax value'}), 400
    
    if 'social_security_percent' in updated_data:
        try:
            ss_tax = float(updated_data['social_security_percent'])
            if ss_tax < 0 or ss_tax > 100:
                return jsonify({'success': False, 'error': 'Social Security must be between 0 and 100%'}), 400
            updated_data['social_security_percent'] = ss_tax
        except (ValueError, TypeError):
            return jsonify({'success': False, 'error': 'Invalid Social Security value'}), 400
    
    if 'medicare_percent' in updated_data:
        try:
            medicare = float(updated_data['medicare_percent'])
            if medicare < 0 or medicare > 100:
                return jsonify({'success': False, 'error': 'Medicare must be between 0 and 100%'}), 400
            updated_data['medicare_percent'] = medicare
        except (ValueError, TypeError):
            return jsonify({'success': False, 'error': 'Invalid Medicare value'}), 400
    
    if 'other_deductions' in updated_data:
        try:
            other_ded = float(updated_data['other_deductions'])
            if other_ded < 0:
                return jsonify({'success': False, 'error': 'Other deductions cannot be negative'}), 400
            updated_data['other_deductions'] = other_ded
        except (ValueError, TypeError):
            return jsonify({'success': False, 'error': 'Invalid other deductions value'}), 400
    
    # Update the income source
    income.update(updated_data)
    income['updated_at'] = datetime.now().isoformat()
    save_data()
    return jsonify({'success': True, 'data': income})

@app.route('/api/income/<int:income_id>', methods=['DELETE'])
def delete_income_source(income_id):
    """Delete an income source"""
    budget_data['income_sources'] = [
        i for i in budget_data['income_sources'] 
        if i['id'] != income_id
    ]
    save_data()
    return jsonify({'success': True})

@app.route('/api/income/<int:income_id>/record-payment', methods=['POST'])
def record_income_payment(income_id):
    """Record an actual payment received for an income source"""
    payment_data = request.json
    
    # Find the income source
    income = None
    for inc in budget_data['income_sources']:
        if inc['id'] == income_id:
            income = inc
            break
    
    if not income:
        return jsonify({'success': False, 'error': 'Income source not found'}), 404
    
    # Validate required fields
    if 'amount' not in payment_data:
        return jsonify({'success': False, 'error': 'Amount is required'}), 400
    
    # Validate amount
    try:
        amount = float(payment_data['amount'])
        if amount <= 0:
            return jsonify({'success': False, 'error': 'Amount must be greater than 0'}), 400
    except (ValueError, TypeError):
        return jsonify({'success': False, 'error': 'Invalid amount'}), 400
    
    # Get payment date (default to today)
    payment_date = payment_data.get('date', datetime.now().strftime('%Y-%m-%d'))
    
    # Validate date format
    try:
        datetime.strptime(payment_date, '%Y-%m-%d')
    except ValueError:
        return jsonify({'success': False, 'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    # Sanitize notes if present
    notes = ''
    if 'notes' in payment_data and payment_data['notes']:
        notes = str(payment_data['notes']).strip()[:500]
    
    # Initialize actual_payments if it doesn't exist (for backwards compatibility)
    if 'actual_payments' not in income:
        income['actual_payments'] = []
    
    # Create payment record
    payment = {
        'id': int(datetime.now().timestamp() * 1000),
        'date': payment_date,
        'amount': amount,
        'notes': notes,
        'recorded_at': datetime.now().isoformat()
    }
    
    income['actual_payments'].append(payment)
    income['updated_at'] = datetime.now().isoformat()
    
    # Update variable income statistics
    _update_variable_income_stats(income)
    
    save_data()
    return jsonify({'success': True, 'data': payment, 'income': income})

@app.route('/api/income/<int:income_id>/payments/<int:payment_id>', methods=['DELETE'])
def delete_income_payment(income_id, payment_id):
    """Delete a recorded payment from an income source"""
    # Find the income source
    income = None
    for inc in budget_data['income_sources']:
        if inc['id'] == income_id:
            income = inc
            break
    
    if not income:
        return jsonify({'success': False, 'error': 'Income source not found'}), 404
    
    # Remove the payment
    if 'actual_payments' in income:
        income['actual_payments'] = [
            p for p in income['actual_payments'] 
            if p['id'] != payment_id
        ]
        income['updated_at'] = datetime.now().isoformat()
        
        # Update variable income statistics after deletion
        _update_variable_income_stats(income)
        
        save_data()
    
    return jsonify({'success': True})

@app.route('/api/income/<int:income_id>/analysis', methods=['GET'])
def get_income_analysis(income_id):
    """Get analysis of expected vs actual income for a specific source"""
    # Find the income source
    income = None
    for inc in budget_data['income_sources']:
        if inc['id'] == income_id:
            income = inc
            break
    
    if not income:
        return jsonify({'success': False, 'error': 'Income source not found'}), 404
    
    expected_amount = float(income.get('amount', 0))
    frequency = income.get('frequency', 'monthly')
    actual_payments = income.get('actual_payments', [])
    
    # Calculate stats for the current month
    from datetime import datetime
    today = datetime.now()
    current_month = today.month
    current_year = today.year
    
    # Filter payments for current month
    current_month_payments = [
        p for p in actual_payments
        if datetime.strptime(p['date'], '%Y-%m-%d').month == current_month
        and datetime.strptime(p['date'], '%Y-%m-%d').year == current_year
    ]
    
    total_actual = sum(p['amount'] for p in current_month_payments)
    payment_count = len(current_month_payments)
    
    # Calculate expected payments for this month based on frequency
    if frequency == 'weekly':
        # Approximately 4.33 weeks per month
        expected_this_month = expected_amount * 4.33
        expected_count = 4
    elif frequency == 'bi-weekly':
        # Approximately 2.17 bi-weekly periods per month
        expected_this_month = expected_amount * 2.17
        expected_count = 2
    elif frequency == 'monthly':
        expected_this_month = expected_amount
        expected_count = 1
    elif frequency == 'annual':
        # Only expect one payment per year, check if it's this month
        expected_this_month = expected_amount if payment_count > 0 else 0
        expected_count = 1 if payment_count > 0 else 0
    else:
        expected_this_month = expected_amount
        expected_count = 1
    
    variance = total_actual - expected_this_month
    variance_percent = (variance / expected_this_month * 100) if expected_this_month > 0 else 0
    
    # Determine status
    if abs(variance_percent) < 1:  # Within 1%
        status = 'on-track'
        status_message = 'On Track'
    elif variance > 0:
        status = 'over'
        status_message = 'Above Expected'
    else:
        status = 'under'
        status_message = 'Below Expected'
    
    return jsonify({
        'income_id': income_id,
        'income_name': income.get('name', ''),
        'expected_amount': expected_amount,
        'expected_this_month': round(expected_this_month, 2),
        'expected_count': expected_count,
        'total_actual': round(total_actual, 2),
        'payment_count': payment_count,
        'variance': round(variance, 2),
        'variance_percent': round(variance_percent, 2),
        'status': status,
        'status_message': status_message,
        'payments': sorted(current_month_payments, key=lambda x: x['date'], reverse=True)
    })

@app.route('/api/income/<int:income_id>/variable-analysis', methods=['GET'])
def get_variable_income_analysis(income_id):
    """Get comprehensive analysis for variable income sources (commission, freelance)"""
    from datetime import datetime, timedelta
    from collections import defaultdict
    from statistics import mean, median, stdev
    
    # Find the income source
    income = None
    for inc in budget_data['income_sources']:
        if inc['id'] == income_id:
            income = inc
            break
    
    if not income:
        return jsonify({'success': False, 'error': 'Income source not found'}), 404
    
    payments = income.get('actual_payments', [])
    
    if not payments:
        return jsonify({
            'success': True,
            'income_id': income_id,
            'income_name': income.get('name', ''),
            'has_data': False,
            'message': 'No payment history yet. Record payments to see analysis.',
            'is_variable': income.get('is_variable', False)
        })
    
    # Calculate historical statistics
    six_months_ago = datetime.now() - timedelta(days=180)
    three_months_ago = datetime.now() - timedelta(days=90)
    
    # Group payments by month
    monthly_totals = defaultdict(float)
    monthly_counts = defaultdict(int)
    
    for payment in payments:
        payment_date = datetime.strptime(payment['date'], '%Y-%m-%d')
        month_key = f"{payment_date.year}-{payment_date.month:02d}"
        month_name = payment_date.strftime('%B %Y')
        monthly_totals[month_key] = monthly_totals[month_key] + payment['amount']
        monthly_counts[month_key] += 1
    
    # Get recent payments (last 6 months)
    recent_payments = [
        p for p in payments
        if datetime.strptime(p['date'], '%Y-%m-%d') >= six_months_ago
    ]
    
    # Get very recent payments (last 3 months)
    very_recent_payments = [
        p for p in payments
        if datetime.strptime(p['date'], '%Y-%m-%d') >= three_months_ago
    ]
    
    # Calculate monthly statistics
    monthly_amounts = list(monthly_totals.values())
    
    if not monthly_amounts:
        return jsonify({
            'success': True,
            'income_id': income_id,
            'income_name': income.get('name', ''),
            'has_data': False,
            'message': 'No payment history yet. Record payments to see analysis.'
        })
    
    # Basic statistics
    avg_monthly = mean(monthly_amounts)
    median_monthly = median(monthly_amounts)
    min_monthly = min(monthly_amounts)
    max_monthly = max(monthly_amounts)
    
    # Variability metrics
    std_deviation = stdev(monthly_amounts) if len(monthly_amounts) > 1 else 0
    coefficient_of_variation = (std_deviation / avg_monthly * 100) if avg_monthly > 0 else 0
    
    # Determine income stability
    if coefficient_of_variation < 10:
        stability = 'Stable'
        stability_icon = '✅'
        stability_color = 'green'
    elif coefficient_of_variation < 25:
        stability = 'Moderately Variable'
        stability_icon = '⚠️'
        stability_color = 'orange'
    else:
        stability = 'Highly Variable'
        stability_icon = '🔴'
        stability_color = 'red'
    
    # Calculate trends (last 3 months vs previous 3 months if available)
    recent_monthly = [monthly_totals[k] for k in sorted(monthly_totals.keys())[-3:]]
    previous_monthly = [monthly_totals[k] for k in sorted(monthly_totals.keys())[-6:-3]] if len(monthly_totals) >= 6 else []
    
    trend = 'Stable'
    trend_icon = '→'
    trend_percent = 0
    
    if recent_monthly and previous_monthly:
        recent_avg = mean(recent_monthly)
        previous_avg = mean(previous_monthly)
        trend_percent = ((recent_avg - previous_avg) / previous_avg * 100) if previous_avg > 0 else 0
        
        if trend_percent > 10:
            trend = 'Increasing'
            trend_icon = '📈'
        elif trend_percent < -10:
            trend = 'Decreasing'
            trend_icon = '📉'
        else:
            trend = 'Stable'
            trend_icon = '→'
    
    # Build monthly breakdown for charts
    monthly_breakdown = []
    for month_key in sorted(monthly_totals.keys()):
        date_obj = datetime.strptime(month_key + '-01', '%Y-%m-%d')
        monthly_breakdown.append({
            'month': date_obj.strftime('%B %Y'),
            'month_short': date_obj.strftime('%b %y'),
            'total': round(monthly_totals[month_key], 2),
            'payment_count': monthly_counts[month_key]
        })
    
    # Current month analysis
    today = datetime.now()
    current_month_key = f"{today.year}-{today.month:02d}"
    current_month_total = monthly_totals.get(current_month_key, 0)
    current_month_payments = monthly_counts.get(current_month_key, 0)
    
    # Forecast next month (use 3-month average)
    if len(recent_monthly) >= 3:
        forecast_next_month = mean(recent_monthly)
    else:
        forecast_next_month = avg_monthly
    
    # Recommendations
    recommendations = []
    
    if coefficient_of_variation > 20:
        recommendations.append({
            'type': 'warning',
            'icon': '⚠️',
            'message': 'Your income varies significantly month-to-month. Consider building a larger emergency fund.'
        })
        recommendations.append({
            'type': 'tip',
            'icon': '💡',
            'message': f'Budget based on your minimum income (${min_monthly:.2f}) or 3-month average (${forecast_next_month:.2f}) to avoid overspending.'
        })
    
    if trend == 'Decreasing':
        recommendations.append({
            'type': 'warning',
            'icon': '📉',
            'message': 'Your income has been decreasing recently. Review your expenses and consider additional income sources.'
        })
    
    if trend == 'Increasing':
        recommendations.append({
            'type': 'success',
            'icon': '🎉',
            'message': 'Your income has been increasing! Consider saving or investing the additional income.'
        })
    
    if len(monthly_amounts) < 3:
        recommendations.append({
            'type': 'info',
            'icon': 'ℹ️',
            'message': 'Track at least 3 months of income to get more accurate insights and forecasts.'
        })
    
    return jsonify({
        'success': True,
        'income_id': income_id,
        'income_name': income.get('name', ''),
        'income_type': income.get('type', ''),
        'has_data': True,
        'is_variable': income.get('is_variable', True),
        'payment_count': len(payments),
        'months_tracked': len(monthly_amounts),
        
        # Summary statistics
        'statistics': {
            'average_monthly': round(avg_monthly, 2),
            'median_monthly': round(median_monthly, 2),
            'minimum_monthly': round(min_monthly, 2),
            'maximum_monthly': round(max_monthly, 2),
            'std_deviation': round(std_deviation, 2),
            'coefficient_of_variation': round(coefficient_of_variation, 2)
        },
        
        # Stability assessment
        'stability': {
            'level': stability,
            'icon': stability_icon,
            'color': stability_color,
            'description': f'Your income varies by approximately {coefficient_of_variation:.1f}% from month to month.'
        },
        
        # Trend analysis
        'trend': {
            'direction': trend,
            'icon': trend_icon,
            'percent_change': round(trend_percent, 2),
            'description': f'Income is {trend.lower()} compared to previous months.'
        },
        
        # Current month
        'current_month': {
            'total': round(current_month_total, 2),
            'payment_count': current_month_payments,
            'vs_average': round(current_month_total - avg_monthly, 2),
            'vs_average_percent': round(((current_month_total - avg_monthly) / avg_monthly * 100), 2) if avg_monthly > 0 else 0
        },
        
        # Forecast
        'forecast': {
            'next_month': round(forecast_next_month, 2),
            'conservative_estimate': round(min_monthly, 2),
            'optimistic_estimate': round(max_monthly, 2)
        },
        
        # Monthly breakdown for charts
        'monthly_breakdown': monthly_breakdown[-12:],  # Last 12 months max
        
        # Recommendations
        'recommendations': recommendations
    })

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

@app.route('/api/income/trends', methods=['GET'])
def get_income_trends():
    """Get income trend data for the last 12 months"""
    from datetime import datetime, timedelta
    from collections import defaultdict
    
    # Get query parameters for customization
    months_back = int(request.args.get('months', 12))  # Default 12 months
    
    try:
        today = datetime.now()
        
        # Generate list of months for the specified period
        months = []
        for i in range(months_back - 1, -1, -1):
            target_date = today - timedelta(days=i * 30)  # Approximate months
            month_key = target_date.strftime('%Y-%m')
            month_label = target_date.strftime('%b %Y')
            months.append({
                'key': month_key,
                'label': month_label,
                'year': target_date.year,
                'month': target_date.month
            })
        
        # Initialize data structures
        income_by_month = {m['key']: 0 for m in months}
        income_by_source = defaultdict(lambda: {m['key']: 0 for m in months})
        income_by_earner = defaultdict(lambda: {m['key']: 0 for m in months})
        
        # Process each income source
        for income_source in budget_data.get('income_sources', []):
            source_name = income_source.get('source_name', 'Unknown')
            earner = income_source.get('earner', 'Unassigned')
            income_type = income_source.get('income_type', 'other')
            
            # Get actual payments for this income source
            actual_payments = income_source.get('actual_payments', [])
            
            # Process actual payments
            for payment in actual_payments:
                try:
                    payment_date = datetime.strptime(payment['date'], '%Y-%m-%d')
                    month_key = payment_date.strftime('%Y-%m')
                    
                    # Only include if within our date range
                    if month_key in income_by_month:
                        amount = float(payment.get('amount', 0))
                        
                        # Add to totals
                        income_by_month[month_key] += amount
                        income_by_source[source_name][month_key] += amount
                        income_by_earner[earner][month_key] += amount
                        
                except (ValueError, KeyError) as e:
                    continue
        
        # Format data for charts
        # Total income over time
        total_income_data = {
            'labels': [m['label'] for m in months],
            'data': [round(income_by_month[m['key']], 2) for m in months]
        }
        
        # Income by source (for stacked chart)
        source_datasets = []
        for source_name, monthly_data in income_by_source.items():
            source_datasets.append({
                'label': source_name,
                'data': [round(monthly_data[m['key']], 2) for m in months]
            })
        
        # Income by earner (for comparison chart)
        earner_datasets = []
        for earner_name, monthly_data in income_by_earner.items():
            earner_datasets.append({
                'label': earner_name,
                'data': [round(monthly_data[m['key']], 2) for m in months]
            })
        
        # Calculate statistics
        monthly_totals = [income_by_month[m['key']] for m in months]
        non_zero_months = [m for m in monthly_totals if m > 0]
        
        stats = {
            'average': round(sum(monthly_totals) / len(monthly_totals), 2) if monthly_totals else 0,
            'median': round(sorted(monthly_totals)[len(monthly_totals) // 2], 2) if monthly_totals else 0,
            'min': round(min(non_zero_months), 2) if non_zero_months else 0,
            'max': round(max(monthly_totals), 2) if monthly_totals else 0,
            'total': round(sum(monthly_totals), 2),
            'months_with_income': len(non_zero_months),
            'total_months': len(months)
        }
        
        # Calculate trend (simple linear trend)
        trend = 'stable'
        if len(non_zero_months) >= 3:
            first_half = non_zero_months[:len(non_zero_months)//2]
            second_half = non_zero_months[len(non_zero_months)//2:]
            
            if first_half and second_half:
                first_avg = sum(first_half) / len(first_half)
                second_avg = sum(second_half) / len(second_half)
                
                if second_avg > first_avg * 1.1:
                    trend = 'increasing'
                elif second_avg < first_avg * 0.9:
                    trend = 'decreasing'
        
        stats['trend'] = trend
        
        return jsonify({
            'success': True,
            'total_income': total_income_data,
            'by_source': {
                'labels': [m['label'] for m in months],
                'datasets': source_datasets
            },
            'by_earner': {
                'labels': [m['label'] for m in months],
                'datasets': earner_datasets
            },
            'statistics': stats,
            'period': {
                'months': months_back,
                'start': months[0]['label'] if months else None,
                'end': months[-1]['label'] if months else None
            }
        })
        
    except Exception as e:
        print(f"Error calculating income trends: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/income/year-over-year', methods=['GET'])
def get_year_over_year_income():
    """Get year-over-year income comparison data"""
    from datetime import datetime
    from collections import defaultdict
    
    try:
        # Get available years from actual payments
        available_years = set()
        for income_source in budget_data.get('income_sources', []):
            for payment in income_source.get('actual_payments', []):
                try:
                    payment_date = datetime.strptime(payment['date'], '%Y-%m-%d')
                    available_years.add(payment_date.year)
                except (ValueError, KeyError):
                    continue
        
        if not available_years:
            return jsonify({
                'success': True,
                'has_data': False,
                'message': 'No income data available for comparison',
                'years': []
            })
        
        # Sort years (most recent first)
        years = sorted(available_years, reverse=True)
        
        # Initialize data structures for each year
        yearly_data = {}
        for year in years:
            yearly_data[year] = {
                'total': 0,
                'by_month': defaultdict(float),
                'by_source': defaultdict(float),
                'by_earner': defaultdict(float),
                'payment_count': 0
            }
        
        # Process each income source
        for income_source in budget_data.get('income_sources', []):
            source_name = income_source.get('source_name', 'Unknown')
            earner = income_source.get('earner', 'Unassigned')
            
            # Process actual payments
            for payment in income_source.get('actual_payments', []):
                try:
                    payment_date = datetime.strptime(payment['date'], '%Y-%m-%d')
                    year = payment_date.year
                    month = payment_date.month
                    amount = float(payment.get('amount', 0))
                    
                    if year in yearly_data:
                        yearly_data[year]['total'] += amount
                        yearly_data[year]['by_month'][month] += amount
                        yearly_data[year]['by_source'][source_name] += amount
                        yearly_data[year]['by_earner'][earner] += amount
                        yearly_data[year]['payment_count'] += 1
                        
                except (ValueError, KeyError) as e:
                    continue
        
        # Format data for frontend
        comparison_data = []
        for year in years:
            data = yearly_data[year]
            
            # Calculate monthly average
            months_with_data = len([m for m in data['by_month'].values() if m > 0])
            monthly_average = data['total'] / months_with_data if months_with_data > 0 else 0
            
            # Get top sources
            top_sources = sorted(
                data['by_source'].items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]
            
            comparison_data.append({
                'year': year,
                'total': round(data['total'], 2),
                'monthly_average': round(monthly_average, 2),
                'payment_count': data['payment_count'],
                'months_with_income': months_with_data,
                'by_month': {
                    month: round(amount, 2) 
                    for month, amount in sorted(data['by_month'].items())
                },
                'top_sources': [
                    {'name': name, 'amount': round(amount, 2)}
                    for name, amount in top_sources
                ],
                'by_earner': {
                    earner: round(amount, 2)
                    for earner, amount in data['by_earner'].items()
                }
            })
        
        # Calculate year-over-year changes
        if len(comparison_data) >= 2:
            for i in range(len(comparison_data) - 1):
                current_year = comparison_data[i]
                previous_year = comparison_data[i + 1]
                
                # Calculate percentage change
                if previous_year['total'] > 0:
                    change_amount = current_year['total'] - previous_year['total']
                    change_percent = (change_amount / previous_year['total']) * 100
                    
                    current_year['change_from_previous'] = {
                        'amount': round(change_amount, 2),
                        'percent': round(change_percent, 2),
                        'direction': 'increase' if change_amount > 0 else 'decrease' if change_amount < 0 else 'stable'
                    }
                else:
                    current_year['change_from_previous'] = {
                        'amount': current_year['total'],
                        'percent': 100.0,
                        'direction': 'increase'
                    }
        
        # Overall statistics
        total_all_years = sum(y['total'] for y in comparison_data)
        average_per_year = total_all_years / len(comparison_data) if comparison_data else 0
        
        # Determine overall trend (comparing first and last year)
        overall_trend = 'stable'
        if len(comparison_data) >= 2:
            first_year_total = comparison_data[0]['total']
            last_year_total = comparison_data[-1]['total']
            
            if first_year_total > last_year_total * 1.1:
                overall_trend = 'increasing'
            elif first_year_total < last_year_total * 0.9:
                overall_trend = 'decreasing'
        
        return jsonify({
            'success': True,
            'has_data': True,
            'years': comparison_data,
            'statistics': {
                'total_years': len(years),
                'total_all_years': round(total_all_years, 2),
                'average_per_year': round(average_per_year, 2),
                'overall_trend': overall_trend,
                'earliest_year': years[-1] if years else None,
                'latest_year': years[0] if years else None
            }
        })
        
    except Exception as e:
        print(f"Error calculating year-over-year income: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/dashboard/next-paycheck', methods=['GET'])
def get_next_paycheck():
    """
    Calculate days until the next paycheck based on all income sources.
    Returns the soonest upcoming paycheck and information about all upcoming paychecks.
    """
    from datetime import datetime, timedelta
    
    try:
        now = datetime.now()
        income_sources = budget_data.get('income_sources', [])
        
        if not income_sources:
            return jsonify({
                'has_paychecks': False,
                'has_data': False,
                'message': 'No income sources configured. Please add income sources with payment dates.',
                'next_paycheck': None,
                'all_upcoming': []
            })
        
        # Find all upcoming paychecks from all income sources
        upcoming_paychecks = []
        
        for income in income_sources:
            next_pay_date_str = income.get('next_pay_date')
            frequency = income.get('frequency', 'monthly')
            
            if not next_pay_date_str:
                continue
            
            # Parse the date
            try:
                pay_date = datetime.fromisoformat(next_pay_date_str.replace('Z', '+00:00'))
                if pay_date.tzinfo:
                    pay_date = pay_date.replace(tzinfo=None)
            except:
                continue
            
            # If the pay date is in the past, calculate the next one based on frequency
            while pay_date.date() < now.date():
                if frequency == 'weekly':
                    pay_date += timedelta(days=7)
                elif frequency == 'bi-weekly':
                    pay_date += timedelta(days=14)
                elif frequency == 'semi-monthly':
                    # Semi-monthly is typically 15th and last day of month
                    if pay_date.day == 15:
                        # Next is last day of current month
                        from calendar import monthrange
                        last_day = monthrange(pay_date.year, pay_date.month)[1]
                        pay_date = pay_date.replace(day=last_day)
                    else:
                        # Next is 15th of next month
                        if pay_date.month == 12:
                            pay_date = pay_date.replace(year=pay_date.year + 1, month=1, day=15)
                        else:
                            pay_date = pay_date.replace(month=pay_date.month + 1, day=15)
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
                        import calendar
                        last_day = calendar.monthrange(year, month)[1]
                        pay_date = pay_date.replace(day=last_day, month=month, year=year)
                elif frequency == 'annual':
                    pay_date = pay_date.replace(year=pay_date.year + 1)
                else:
                    break
            
            # Only include future or today's paychecks
            if pay_date.date() >= now.date():
                days_until = (pay_date.date() - now.date()).days
                upcoming_paychecks.append({
                    'name': income.get('name', 'Unknown Income'),
                    'source_name': income.get('source_name', 'Unknown Source'),
                    'earner_name': income.get('earner_name', 'Unknown Earner'),
                    'amount': float(income.get('amount', 0)),
                    'frequency': frequency,
                    'next_pay_date': pay_date.strftime('%Y-%m-%d'),
                    'next_pay_date_formatted': pay_date.strftime('%B %d, %Y'),
                    'days_until': days_until
                })
        
        if not upcoming_paychecks:
            return jsonify({
                'has_paychecks': False,
                'has_data': len(income_sources) > 0,
                'message': 'No upcoming paychecks found. Please add income sources with payment dates.',
                'next_paycheck': None,
                'all_upcoming': []
            })
        
        # Sort by days_until (soonest first)
        upcoming_paychecks.sort(key=lambda x: x['days_until'])
        
        # Get the next (soonest) paycheck
        next_paycheck = upcoming_paychecks[0]
        days_until = next_paycheck['days_until']
        
        # Determine status and message based on days until paycheck
        if days_until == 0:
            status = 'success'
            status_text = 'Payday!'
            message = f"It's payday! {next_paycheck['earner_name']}'s {next_paycheck['source_name']} payment is today."
            urgency = 'none'
        elif days_until == 1:
            status = 'success'
            status_text = 'Tomorrow'
            message = f"Your next paycheck is tomorrow! {next_paycheck['earner_name']} gets paid ${next_paycheck['amount']:,.2f}."
            urgency = 'low'
        elif days_until <= 3:
            status = 'success'
            status_text = 'Very Soon'
            message = f"{days_until} days until your next paycheck from {next_paycheck['earner_name']}."
            urgency = 'low'
        elif days_until <= 7:
            status = 'info'
            status_text = 'This Week'
            message = f"{days_until} days until your next paycheck. Budget wisely!"
            urgency = 'medium'
        elif days_until <= 14:
            status = 'info'
            status_text = 'Next Week'
            message = f"{days_until} days until your next paycheck. Make your money last!"
            urgency = 'medium'
        else:
            status = 'warning'
            status_text = 'A While Away'
            message = f"{days_until} days until your next paycheck. Careful with spending!"
            urgency = 'high'
        
        # Calculate total amount from upcoming paychecks in next 30 days
        next_30_days_total = sum(p['amount'] for p in upcoming_paychecks if p['days_until'] <= 30)
        
        return jsonify({
            'has_paychecks': True,
            'has_data': True,
            'days_until_next': days_until,
            'status': status,
            'status_text': status_text,
            'message': message,
            'urgency': urgency,
            'next_paycheck': next_paycheck,
            'all_upcoming': upcoming_paychecks[:5],  # Return up to 5 upcoming paychecks
            'next_30_days_count': len([p for p in upcoming_paychecks if p['days_until'] <= 30]),
            'next_30_days_total': round(next_30_days_total, 2)
        })
        
    except Exception as e:
        print(f"Error calculating next paycheck: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'has_paychecks': False,
            'has_data': False,
            'message': f'Error calculating paycheck: {str(e)}',
            'next_paycheck': None,
            'all_upcoming': []
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
    Calculate available spending money after fixed expenses and savings allocations.
    Formula: Total Income - Fixed Expenses - Retirement Contributions - Savings Allocations = Available for Spending
    
    Returns comprehensive breakdown including:
    - Total monthly income
    - Fixed expenses
    - Retirement contributions
    - Savings allocations
    - Available spending (monthly, per paycheck, per day)
    - Status and recommendations
    """
    from datetime import datetime, timedelta
    
    # Check if we have meaningful data
    has_data = len(budget_data['income_sources']) > 0 or len(budget_data['fixed_expenses']) > 0
    
    # Calculate total monthly income
    total_income = 0
    income_breakdown = []
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
        income_breakdown.append({
            'name': income.get('name', 'Unnamed Income'),
            'earner': income.get('earner_name', 'Unknown'),
            'monthly_amount': round(monthly_amount, 2)
        })
    
    # Calculate total monthly fixed expenses
    total_expenses = 0
    expense_breakdown = []
    for expense in budget_data['fixed_expenses']:
        amount = float(expense.get('amount', 0))
        total_expenses += amount
        expense_breakdown.append({
            'name': expense.get('name', 'Unnamed Expense'),
            'category': expense.get('category', 'Other'),
            'amount': round(amount, 2)
        })
    
    # Calculate total monthly retirement contributions
    total_retirement = 0
    retirement_accounts = budget_data.get('retirement_accounts', [])
    for account in retirement_accounts:
        contribution = float(account.get('contribution_per_paycheck', 0))
        linked_income_id = account.get('linked_income_id')
        
        # Find the linked income source to determine pay frequency
        pay_frequency = 'monthly'  # default
        for income in budget_data['income_sources']:
            if income.get('id') == linked_income_id:
                pay_frequency = income.get('frequency', 'monthly')
                break
        
        # Convert to monthly contribution
        if pay_frequency == 'weekly':
            monthly_contribution = contribution * 52 / 12
        elif pay_frequency == 'bi-weekly':
            monthly_contribution = contribution * 26 / 12
        elif pay_frequency == 'monthly':
            monthly_contribution = contribution
        elif pay_frequency == 'annual':
            monthly_contribution = contribution / 12
        else:
            monthly_contribution = contribution
            
        total_retirement += monthly_contribution
    
    # Calculate total monthly savings allocations
    # This would be for savings goals that have automatic monthly contributions
    total_savings_allocations = 0
    savings_goals = budget_data.get('savings_goals', [])
    for goal in savings_goals:
        monthly_contribution = float(goal.get('monthly_contribution', 0))
        total_savings_allocations += monthly_contribution
    
    # Calculate available spending
    available = total_income - total_expenses - total_retirement - total_savings_allocations
    
    # Calculate per-paycheck amount (assuming bi-weekly as most common)
    # We'll use the most common pay frequency from income sources
    pay_frequencies = {}
    for income in budget_data['income_sources']:
        freq = income.get('frequency', 'monthly')
        pay_frequencies[freq] = pay_frequencies.get(freq, 0) + 1
    
    # Determine most common frequency
    most_common_freq = 'bi-weekly'  # default
    if pay_frequencies:
        most_common_freq = max(pay_frequencies, key=pay_frequencies.get)
    
    # Calculate per paycheck
    if most_common_freq == 'weekly':
        available_per_paycheck = available * 12 / 52
        paychecks_per_month = 52 / 12
    elif most_common_freq == 'bi-weekly':
        available_per_paycheck = available * 12 / 26
        paychecks_per_month = 26 / 12
    elif most_common_freq == 'monthly':
        available_per_paycheck = available
        paychecks_per_month = 1
    else:
        available_per_paycheck = available
        paychecks_per_month = 1
    
    # Calculate per day (30 day month average)
    available_per_day = available / 30
    
    # Determine status based on available amount
    if available < 0:
        status = 'danger'
        message = 'Critical: Expenses exceed income!'
        recommendation = 'You need to reduce expenses or increase income immediately.'
        color = '#dc3545'
    elif available < 200:
        status = 'danger'
        message = 'Very tight budget - high risk'
        recommendation = 'Consider finding ways to reduce expenses or increase income.'
        color = '#dc3545'
    elif available < 500:
        status = 'warning'
        message = 'Caution: Limited discretionary funds'
        recommendation = 'You have minimal room for unexpected expenses.'
        color = '#ffc107'
    elif available < 1000:
        status = 'warning'
        message = 'Moderate budget cushion'
        recommendation = 'You have some flexibility, but stay mindful of spending.'
        color = '#ffc107'
    else:
        status = 'success'
        message = 'Healthy budget with good flexibility'
        recommendation = 'Great job! You have room for discretionary spending and unexpected expenses.'
        color = '#28a745'
    
    # Calculate percentage of income available for spending
    percent_available = (available / total_income * 100) if total_income > 0 else 0
    
    return jsonify({
        'total_income': round(total_income, 2),
        'total_expenses': round(total_expenses, 2),
        'total_retirement': round(total_retirement, 2),
        'total_savings_allocations': round(total_savings_allocations, 2),
        'total_committed': round(total_expenses + total_retirement + total_savings_allocations, 2),
        'available': round(available, 2),
        'available_per_paycheck': round(available_per_paycheck, 2),
        'available_per_day': round(available_per_day, 2),
        'percent_available': round(percent_available, 1),
        'pay_frequency': most_common_freq,
        'paychecks_per_month': round(paychecks_per_month, 2),
        'status': status,
        'message': message,
        'recommendation': recommendation,
        'color': color,
        'has_data': has_data,
        'breakdown': {
            'income': income_breakdown,
            'expenses': expense_breakdown,
            'retirement_contribution': round(total_retirement, 2),
            'savings_allocations': round(total_savings_allocations, 2)
        }
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
    
    # Calculate total monthly fixed expenses
    total_monthly_expenses = 0
    for expense in budget_data['fixed_expenses']:
        amount = float(expense.get('amount', 0))
        total_monthly_expenses += amount
    
    # Calculate upcoming bills (bills due after today but before end of month)
    upcoming_bills = 0
    upcoming_bill_count = 0
    upcoming_bills_list = []
    
    for expense in budget_data['fixed_expenses']:
        due_date = expense.get('due_date', 1)
        amount = float(expense.get('amount', 0))
        
        # If due date is after today and within this month, it's upcoming
        if due_date > current_day:
            upcoming_bills += amount
            upcoming_bill_count += 1
            upcoming_bills_list.append({
                'name': expense.get('name', 'Unknown'),
                'amount': amount,
                'due_date': due_date
            })
    
    available_for_month = total_income - total_monthly_expenses
    
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
    
    # NEW: Subtract upcoming bills from remaining money to get TRUE available spending money
    remaining_money_after_bills = remaining_money - upcoming_bills
    
    # Calculate safe daily rate using money AFTER accounting for upcoming bills
    safe_daily_rate = remaining_money_after_bills / days_remaining if days_remaining > 0 else 0
    
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
        # Determine velocity status (comparing against safe rate that accounts for bills)
        if remaining_money_after_bills < 0:
            # Already underwater with upcoming bills
            status = 'danger'
            status_text = 'Critical!'
            message = f'Warning: You have ${upcoming_bills:.2f} in upcoming bills but only ${remaining_money:.2f} remaining. Reduce spending immediately!'
        elif actual_daily_rate <= safe_daily_rate * 0.9:
            # Spending well under safe rate (10% buffer)
            status = 'success'
            status_text = 'On Track'
            if upcoming_bills > 0:
                message = f'You\'re spending at a healthy pace! You have ${upcoming_bills:.2f} in upcoming bills accounted for.'
            else:
                message = f'You\'re spending at a healthy pace! Keep it up.'
        elif actual_daily_rate <= safe_daily_rate * 1.1:
            # Within 10% of safe rate
            status = 'success'
            status_text = 'Good Pace'
            if upcoming_bills > 0:
                message = f'You\'re on track with your spending. ${upcoming_bills:.2f} set aside for upcoming bills.'
            else:
                message = f'You\'re right on track with your spending.'
        elif actual_daily_rate <= safe_daily_rate * 1.3:
            # 10-30% over safe rate
            status = 'warning'
            status_text = 'Spending Fast'
            if upcoming_bills > 0:
                message = f'You\'re spending a bit fast. Remember, you have ${upcoming_bills:.2f} in bills coming up. Try to stay under ${safe_daily_rate:.2f}/day.'
            else:
                message = f'You\'re spending a bit fast. Try to slow down to ${safe_daily_rate:.2f}/day.'
        else:
            # More than 30% over safe rate
            status = 'danger'
            status_text = 'Too Fast!'
            if upcoming_bills > 0:
                message = f'Danger: At this rate, you\'ll overspend by ${(actual_daily_rate - safe_daily_rate) * days_remaining:.2f}! You also have ${upcoming_bills:.2f} in upcoming bills!'
            else:
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
        'remaining_money_after_bills': round(remaining_money_after_bills, 2),
        'upcoming_bills': round(upcoming_bills, 2),
        'upcoming_bill_count': upcoming_bill_count,
        'upcoming_bills_list': upcoming_bills_list,
        'projected_remaining': round(projected_remaining, 2),
        'transaction_count': transaction_count
    })

@app.route('/api/dashboard/mtd-spending', methods=['GET'])
def get_mtd_spending():
    """
    Get comprehensive month-to-date spending summary with category breakdown,
    budget comparison, daily averages, and progress indicators.
    
    Returns:
    - Total spending this month
    - Spending by category
    - Comparison to budget/available spending
    - Daily average spending
    - Days elapsed and remaining
    - Status indicators
    - Recent transactions
    """
    from datetime import datetime
    from calendar import monthrange
    from collections import defaultdict
    
    now = datetime.now()
    current_year = now.year
    current_month = now.month
    current_day = now.day
    
    # Get days in current month
    days_in_month = monthrange(current_year, current_month)[1]
    days_remaining = days_in_month - current_day
    percent_of_month = (current_day / days_in_month) * 100
    
    # Check if we have meaningful data
    has_data = (len(budget_data.get('transactions', [])) > 0 or 
                len(budget_data.get('income_sources', [])) > 0 or 
                len(budget_data.get('fixed_expenses', [])) > 0)
    
    # Calculate MTD spending from transactions
    mtd_spent = 0
    category_spending = defaultdict(float)
    mtd_transactions = []
    transactions = budget_data.get('transactions', [])
    
    for transaction in transactions:
        try:
            trans_date_str = transaction.get('date', '')
            trans_date = datetime.fromisoformat(trans_date_str.replace('Z', '+00:00'))
            
            if trans_date.year == current_year and trans_date.month == current_month:
                amount = float(transaction.get('amount', 0))
                category = transaction.get('category', 'Uncategorized')
                
                mtd_spent += amount
                category_spending[category] += amount
                
                # Add to recent transactions list
                mtd_transactions.append({
                    'id': transaction.get('id'),
                    'date': trans_date_str,
                    'description': transaction.get('description', 'No description'),
                    'amount': round(amount, 2),
                    'category': category,
                    'merchant': transaction.get('merchant', '')
                })
        except Exception as e:
            print(f"Error processing transaction: {e}")
            continue
    
    # Sort transactions by date (most recent first)
    mtd_transactions.sort(key=lambda x: x['date'], reverse=True)
    
    # Get available spending for the month
    total_income = 0
    for income in budget_data.get('income_sources', []):
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
    
    # Calculate total monthly commitments (expenses + retirement + savings)
    total_expenses = sum(float(expense.get('amount', 0)) for expense in budget_data.get('fixed_expenses', []))
    
    # Add retirement contributions
    total_retirement = 0
    for account in budget_data.get('retirement_accounts', []):
        contribution = float(account.get('contribution_per_paycheck', 0))
        linked_income_id = account.get('linked_income_id')
        
        # Find the linked income source to determine pay frequency
        pay_frequency = 'monthly'
        for income in budget_data.get('income_sources', []):
            if income.get('id') == linked_income_id:
                pay_frequency = income.get('frequency', 'monthly')
                break
        
        # Convert to monthly
        if pay_frequency == 'weekly':
            monthly_contribution = contribution * 52 / 12
        elif pay_frequency == 'bi-weekly':
            monthly_contribution = contribution * 26 / 12
        elif pay_frequency == 'monthly':
            monthly_contribution = contribution
        else:
            monthly_contribution = contribution
            
        total_retirement += monthly_contribution
    
    # Add savings allocations
    total_savings = sum(float(goal.get('monthly_contribution', 0)) for goal in budget_data.get('savings_goals', []))
    
    # Calculate available for discretionary spending
    available = total_income - total_expenses - total_retirement - total_savings
    
    # Calculate remaining and percentages
    remaining = available - mtd_spent
    percent_spent = (mtd_spent / available * 100) if available > 0 else 0
    
    # Calculate daily averages
    daily_average = mtd_spent / current_day if current_day > 0 else 0
    projected_total = daily_average * days_in_month
    projected_remaining = available - projected_total
    
    # Determine status
    if percent_spent >= 100:
        status = 'danger'
        status_message = 'Over budget! You\'ve spent all available funds.'
        color = '#dc3545'
    elif percent_spent >= 90:
        status = 'danger'
        status_message = 'Nearly out of budget - be very careful!'
        color = '#dc3545'
    elif percent_spent >= percent_of_month + 15:
        status = 'warning'
        status_message = 'Spending faster than expected - slow down!'
        color = '#ffc107'
    elif percent_spent >= percent_of_month:
        status = 'warning'
        status_message = 'On pace with budget - monitor closely'
        color = '#ffc107'
    else:
        status = 'success'
        status_message = 'Great job! Spending below target pace'
        color = '#28a745'
    
    # Convert category spending to sorted list
    category_breakdown = [
        {
            'category': category,
            'amount': round(amount, 2),
            'percent': round((amount / mtd_spent * 100) if mtd_spent > 0 else 0, 1),
            'transaction_count': sum(1 for t in mtd_transactions if t['category'] == category)
        }
        for category, amount in category_spending.items()
    ]
    category_breakdown.sort(key=lambda x: x['amount'], reverse=True)
    
    # Get top 10 recent transactions
    recent_transactions = mtd_transactions[:10]
    
    return jsonify({
        'total': round(mtd_spent, 2),
        'available': round(available, 2),
        'remaining': round(remaining, 2),
        'percent_spent': round(percent_spent, 1),
        'percent_of_month': round(percent_of_month, 1),
        'daily_average': round(daily_average, 2),
        'projected_total': round(projected_total, 2),
        'projected_remaining': round(projected_remaining, 2),
        'days_elapsed': current_day,
        'days_remaining': days_remaining,
        'days_in_month': days_in_month,
        'transaction_count': len(mtd_transactions),
        'status': status,
        'status_message': status_message,
        'color': color,
        'category_breakdown': category_breakdown,
        'recent_transactions': recent_transactions,
        'has_data': has_data,
        'month_name': now.strftime('%B'),
        'year': current_year
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

# Alias endpoints for frontend compatibility
@app.route('/api/dashboard/overdraft-warning', methods=['GET'])
def get_overdraft_warning():
    """Alias for overdraft-status endpoint"""
    return get_overdraft_status()

@app.route('/api/dashboard/health-score', methods=['GET'])
def get_health_score():
    """Alias for budget-health-score endpoint"""
    return get_budget_health_score()

@app.route('/api/dashboard/recommendations', methods=['GET'])
def get_recommendations():
    """Alias for smart-recommendations endpoint"""
    return get_smart_recommendations()

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
    
    # Check if we have meaningful data
    has_data = (num_accounts > 0 or num_income_sources > 0 or num_expenses > 0)
    
    return jsonify({
        'score': total_score,
        'grade': grade,
        'grade_text': grade_text,
        'color': color,
        'icon': icon,
        'breakdown': score_breakdown,
        'recommendations': recommendations,
        'has_data': has_data,
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

@app.route('/api/dashboard/upcoming-bills', methods=['GET'])
def get_upcoming_bills():
    """
    Get list of bills due in the next 7 days
    Returns detailed information about each upcoming bill
    """
    from datetime import datetime, timedelta
    from calendar import monthrange
    
    try:
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        current_day = now.day
        days_in_month = monthrange(current_year, current_month)[1]
        
        upcoming_bills = []
        total_due = 0
        
        for expense in budget_data['fixed_expenses']:
            due_day = expense.get('due_day')
            if due_day:
                try:
                    due_day = int(due_day)
                    amount = float(expense.get('amount', 0))
                    
                    # Calculate days until due
                    days_until_due = due_day - current_day
                    if days_until_due < 0:
                        days_until_due += days_in_month
                    
                    # Check if bill is due in next 7 days
                    if 0 <= days_until_due <= 7:
                        # Calculate the actual due date
                        if due_day >= current_day:
                            due_date = datetime(current_year, current_month, due_day)
                        else:
                            # Bill is due next month
                            next_month = current_month + 1 if current_month < 12 else 1
                            next_year = current_year if current_month < 12 else current_year + 1
                            due_date = datetime(next_year, next_month, due_day)
                        
                        bill_info = {
                            'id': expense.get('id'),
                            'name': expense.get('name', 'Unnamed Bill'),
                            'amount': round(amount, 2),
                            'due_day': due_day,
                            'due_date': due_date.strftime('%Y-%m-%d'),
                            'due_date_formatted': due_date.strftime('%b %d, %Y'),
                            'days_until_due': days_until_due,
                            'category': expense.get('category', 'Other'),
                            'is_autopay': expense.get('is_autopay', False),
                            'is_paid': expense.get('is_paid', False),
                            'urgency': 'urgent' if days_until_due <= 2 else 'soon' if days_until_due <= 5 else 'upcoming'
                        }
                        
                        upcoming_bills.append(bill_info)
                        if not bill_info['is_paid']:
                            total_due += amount
                            
                except (ValueError, TypeError) as e:
                    print(f"Error processing expense {expense.get('name')}: {e}")
                    continue
        
        # Sort by days until due (most urgent first)
        upcoming_bills.sort(key=lambda x: x['days_until_due'])
        
        return jsonify({
            'success': True,
            'bills': upcoming_bills,
            'total_count': len(upcoming_bills),
            'total_due': round(total_due, 2),
            'unpaid_count': len([b for b in upcoming_bills if not b['is_paid']])
        })
        
    except Exception as e:
        print(f"Error in upcoming bills: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e), 'bills': [], 'total_count': 0, 'total_due': 0}), 500

@app.route('/api/dashboard/spending-patterns', methods=['GET'])
def get_spending_patterns():
    """
    Analyze historical spending patterns and compare with current month
    Detects anomalies and provides insights about spending habits
    
    Returns spending pattern alerts like:
    - "You usually spend more on groceries this week"
    - "Dining out is 40% higher than usual"
    - "Gas spending is lower than typical"
    """
    from datetime import datetime, timedelta
    from collections import defaultdict
    import statistics
    from calendar import monthrange
    
    try:
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        current_day = now.day
        
        # Calculate what "week" of the month we're in (1-4)
        current_week = ((current_day - 1) // 7) + 1
        
        # Get transactions grouped by category and month
        category_history = defaultdict(lambda: defaultdict(list))
        current_month_spending = defaultdict(float)
        current_week_spending = defaultdict(float)
        
        # Also track weekly patterns (same week across multiple months)
        weekly_patterns = defaultdict(lambda: defaultdict(list))
        
        for transaction in budget_data['transactions']:
            try:
                trans_date = datetime.fromisoformat(transaction['date'])
                amount = float(transaction.get('amount', 0))
                category = transaction.get('category', 'Miscellaneous')
                
                if amount <= 0:  # Only analyze expenses
                    continue
                
                trans_day = trans_date.day
                trans_week = ((trans_day - 1) // 7) + 1
                
                # Track current month spending
                if trans_date.year == current_year and trans_date.month == current_month:
                    current_month_spending[category] += amount
                    
                    # Track current week spending
                    if trans_week == current_week:
                        current_week_spending[category] += amount
                else:
                    # Build historical monthly data
                    month_key = f"{trans_date.year}-{trans_date.month:02d}"
                    category_history[category][month_key].append(amount)
                    
                    # Build historical weekly data (same week number in past months)
                    if trans_week == current_week:
                        weekly_patterns[category][month_key].append(amount)
                    
            except (ValueError, KeyError) as e:
                continue
        
        # Calculate patterns and anomalies
        patterns = []
        alerts = []
        insights = []
        
        # For each category with history, analyze patterns
        for category, monthly_data in category_history.items():
            if len(monthly_data) < 2:  # Need at least 2 months of history
                continue
            
            # Calculate monthly totals for this category
            monthly_totals = [sum(transactions) for transactions in monthly_data.values()]
            
            if not monthly_totals:
                continue
            
            # Calculate statistics
            avg_monthly_spend = statistics.mean(monthly_totals)
            std_dev = statistics.stdev(monthly_totals) if len(monthly_totals) > 1 else 0
            min_spend = min(monthly_totals)
            max_spend = max(monthly_totals)
            
            # Get current month spending for this category
            current_spend = current_month_spending.get(category, 0)
            current_week_spend = current_week_spending.get(category, 0)
            
            # Calculate weekly averages from historical data
            weekly_data = weekly_patterns.get(category, {})
            if weekly_data:
                weekly_totals = [sum(transactions) for transactions in weekly_data.values()]
                avg_weekly_spend = statistics.mean(weekly_totals) if weekly_totals else 0
            else:
                # Estimate from monthly average (divide by ~4 weeks)
                avg_weekly_spend = avg_monthly_spend / 4
            
            # Project to end of month based on current pace
            days_in_month = monthrange(current_year, current_month)[1]
            if current_day > 0:
                daily_rate = current_spend / current_day
                projected_spend = daily_rate * days_in_month
            else:
                projected_spend = current_spend
            
            # Detect anomalies
            variance_threshold_high = 1.3  # 30% above average triggers alert
            variance_threshold_low = 0.7   # 30% below average is noteworthy
            
            pattern_data = {
                'category': category,
                'icon': get_category_icon(category),
                'historical_avg': round(avg_monthly_spend, 2),
                'avg_weekly_spend': round(avg_weekly_spend, 2),
                'current_mtd': round(current_spend, 2),
                'current_week': round(current_week_spend, 2),
                'projected': round(projected_spend, 2),
                'min': round(min_spend, 2),
                'max': round(max_spend, 2),
                'months_of_data': len(monthly_totals),
                'variance': round(((projected_spend - avg_monthly_spend) / avg_monthly_spend * 100) if avg_monthly_spend > 0 else 0, 1),
                'weekly_variance': round(((current_week_spend - avg_weekly_spend) / avg_weekly_spend * 100) if avg_weekly_spend > 0 else 0, 1),
                'status': 'normal'
            }
            
            # Generate alerts based on CURRENT month-to-date spending vs historical average
            # This is more intuitive: "You've spent $X so far this month vs typical $Y for the whole month"
            if avg_monthly_spend >= 50:  # Only for significant categories
                # Compare current spending to historical average
                if current_spend > avg_monthly_spend * variance_threshold_high:
                    pattern_data['status'] = 'high'
                    variance_pct = ((current_spend - avg_monthly_spend) / avg_monthly_spend * 100) if avg_monthly_spend > 0 else 0
                    
                    alerts.append({
                        'type': 'pattern_alert',
                        'icon': get_category_icon(category),
                        'category': category,
                        'message': f"{category}: Already {abs(variance_pct):.0f}% above your typical monthly spending",
                        'detail': f"You've spent ${current_spend:.2f} so far this month (typical full month: ${avg_monthly_spend:.2f})",
                        'severity': 'high' if variance_pct > 60 else 'medium',
                        'current_amount': round(current_spend, 2),
                        'typical_amount': round(avg_monthly_spend, 2),
                        'difference': round(current_spend - avg_monthly_spend, 2),
                        'variance_percent': abs(variance_pct)
                    })
                
                # For weekly patterns, compare this week to historical average week
                elif avg_weekly_spend >= 20 and len(weekly_data) >= 2:
                    if current_week_spend > avg_weekly_spend * variance_threshold_high:
                        pattern_data['status'] = 'high'
                        week_variance = ((current_week_spend - avg_weekly_spend) / avg_weekly_spend * 100) if avg_weekly_spend > 0 else 0
                        
                        alerts.append({
                            'type': 'pattern_alert',
                            'icon': get_category_icon(category),
                            'category': category,
                            'message': f"{category}: You're spending more than usual this week",
                            'detail': f"${current_week_spend:.2f} this week vs. typical ${avg_weekly_spend:.2f} for this time of month",
                            'severity': 'medium' if week_variance < 60 else 'high',
                            'current_amount': round(current_week_spend, 2),
                            'typical_amount': round(avg_weekly_spend, 2),
                            'difference': round(current_week_spend - avg_weekly_spend, 2),
                            'variance_percent': abs(week_variance)
                        })
                
                # Show positive insights for categories where spending is lower
                elif current_spend < avg_monthly_spend * variance_threshold_low and current_spend > 0:
                    pattern_data['status'] = 'low'
                    saved_amount = avg_monthly_spend - current_spend
                    
                    insights.append({
                        'type': 'positive',
                        'icon': '✨',
                        'category': category,
                        'message': f"{category}: Spending less than usual so far",
                        'detail': f"${current_spend:.2f} so far vs. typical ${avg_monthly_spend:.2f} for full month"
                    })
            
            patterns.append(pattern_data)
        
        # Sort patterns by variance (highest first)
        patterns.sort(key=lambda x: abs(x['variance']), reverse=True)
        
        # Sort alerts by severity and variance
        alerts.sort(key=lambda x: (0 if x['severity'] == 'high' else 1, -x.get('variance_percent', 0)))
        
        # Generate overall insights
        total_current_spending = sum(current_month_spending.values())
        
        # Calculate average spending rate
        if current_day > 0:
            daily_spending_rate = total_current_spending / current_day
            insights.append({
                'type': 'info',
                'icon': '📊',
                'category': 'Overall',
                'message': f"Daily spending rate: ${daily_spending_rate:.2f}/day",
                'detail': f"Based on {current_day} days of spending data this month"
            })
        
        # Add general recommendations
        recommendations = []
        
        if len(alerts) > 3:
            recommendations.append("Multiple categories are above typical levels - consider reviewing your spending priorities")
        elif len(alerts) > 0:
            top_alert = alerts[0]
            recommendations.append(f"Focus on {top_alert['category']} - it's the furthest from your typical pattern")
        
        if len(insights) > 2:
            recommendations.append("Great job! You're spending less than usual in several categories")
        
        if not recommendations:
            recommendations.append("Your spending patterns are consistent with your history - keep it up!")
        
        # Check if user has enough data
        has_sufficient_data = len(patterns) >= 3 and any(p['months_of_data'] >= 2 for p in patterns)
        
        if not has_sufficient_data:
            insights.insert(0, {
                'type': 'info',
                'icon': 'ℹ️',
                'category': 'Data',
                'message': "Building your spending history",
                'detail': "Add more transactions over time to get personalized spending pattern alerts"
            })
        
        return jsonify({
            'success': True,
            'patterns': patterns[:10],  # Top 10 categories
            'alerts': alerts,
            'insights': insights,
            'recommendations': recommendations,
            'has_sufficient_data': has_sufficient_data,
            'total_categories': len(patterns),
            'months_analyzed': max([p['months_of_data'] for p in patterns]) if patterns else 0,
            'current_week': current_week,
            'current_day': current_day
        })
        
    except Exception as e:
        print(f"Error in spending patterns: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'patterns': [],
            'alerts': [],
            'insights': [],
            'recommendations': [],
            'has_sufficient_data': False
        }), 500

def get_category_icon(category):
    """Return an icon for a given category"""
    category_icons = {
        'Groceries': '🛒',
        'Dining Out': '🍔',
        'Restaurants': '🍽️',
        'Gas': '⛽',
        'Transportation': '🚗',
        'Entertainment': '🎮',
        'Clothing': '👕',
        'Personal Care': '💇',
        'Medical': '🏥',
        'Healthcare': '💊',
        'Gifts': '🎁',
        'Home Improvement': '🏠',
        'Pet Care': '🐕',
        'Education': '📚',
        'Books': '📖',
        'Utilities': '💡',
        'Internet': '🌐',
        'Phone': '📱',
        'Insurance': '🛡️',
        'Rent': '🏘️',
        'Mortgage': '🏠',
        'Subscriptions': '📺',
        'Miscellaneous': '💰'
    }
    
    return category_icons.get(category, '📁')

@app.route('/api/dashboard/smart-recommendations', methods=['GET'])
def get_smart_recommendations():
    """
    Generate comprehensive AI-powered financial recommendations based on:
    - Account balances and trends
    - Spending patterns and behavioral insights
    - Upcoming bills and payment history
    - Budget health and goal progress
    - Historical data analysis (3-6 months)
    - Predictive analytics
    - Contextual timing (time of month, season, etc.)
    
    Returns priority actions, recommendations, insights, and tips organized by category.
    """
    from datetime import datetime, timedelta
    from calendar import monthrange
    from statistics import mean, median
    from collections import defaultdict
    
    try:
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        current_day = now.day
        days_in_month = monthrange(current_year, current_month)[1]
        days_remaining = days_in_month - current_day
        if days_remaining == 0:
            days_remaining = 1
        
        # Initialize recommendation categories
        priority_actions = []  # Critical/Urgent actions needed NOW
        recommendations = []   # Important suggestions for improvement
        insights = []          # Positive observations and trends
        tips = []             # General financial wisdom
        
        # ================================================================
        # PHASE 1: GATHER COMPREHENSIVE FINANCIAL DATA
        # ================================================================
        
        # Account balances
        checking_balance = 0
        savings_balance = 0
        credit_balance = 0
        total_liquid = 0
        account_count = len(budget_data['accounts'])
        
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
        
        # Income calculation
        total_monthly_income = 0
        income_sources_count = len(budget_data['income_sources'])
        income_by_earner = defaultdict(float)
        next_paychecks = []
        
        for income in budget_data['income_sources']:
            amount = float(income.get('amount', 0))
            frequency = income.get('frequency', 'monthly')
            earner_name = income.get('earner_name', 'Unknown')
            
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
            
            total_monthly_income += monthly_amount
            income_by_earner[earner_name] += monthly_amount
            
            # Calculate next paycheck date
            last_payment = income.get('last_payment_date')
            if last_payment:
                try:
                    last_date = datetime.fromisoformat(last_payment)
                    if frequency == 'weekly':
                        next_date = last_date + timedelta(days=7)
                    elif frequency == 'bi-weekly':
                        next_date = last_date + timedelta(days=14)
                    elif frequency == 'monthly':
                        next_date = (last_date.replace(day=1) + timedelta(days=32)).replace(day=last_date.day)
                    else:
                        next_date = None
                    
                    if next_date:
                        days_until = (next_date - now).days
                        if days_until >= 0:
                            next_paychecks.append({
                                'earner': earner_name,
                                'amount': amount,
                                'days': days_until,
                                'date': next_date
                            })
                except (ValueError, TypeError):
                    pass
        
        # Sort paychecks by soonest first
        next_paychecks.sort(key=lambda x: x['days'])
        
        # Fixed expenses calculation
        total_monthly_expenses = 0
        unpaid_bills = []
        upcoming_bills_7days = 0
        upcoming_bills_14days = 0
        autopay_total = 0
        manual_pay_total = 0
        
        for expense in budget_data['fixed_expenses']:
            amount = float(expense.get('amount', 0))
            total_monthly_expenses += amount
            
            is_autopay = expense.get('is_autopay', False)
            is_paid = expense.get('is_paid', False)
            
            if is_autopay:
                autopay_total += amount
            else:
                manual_pay_total += amount
            
            # Calculate upcoming bills
            due_day = expense.get('due_day')
            if due_day and not is_paid:
                try:
                    due_day = int(due_day)
                    days_until_due = due_day - current_day
                    if days_until_due < 0:
                        days_until_due += days_in_month
                    
                    if days_until_due <= 7:
                        upcoming_bills_7days += amount
                        unpaid_bills.append({
                            'name': expense.get('name', 'Bill'),
                            'amount': amount,
                            'days': days_until_due,
                            'is_autopay': is_autopay,
                            'category': expense.get('category', 'Other')
                        })
                    
                    if days_until_due <= 14:
                        upcoming_bills_14days += amount
                except (ValueError, TypeError):
                    pass
        
        # Sort unpaid bills by urgency
        unpaid_bills.sort(key=lambda x: x['days'])
        
        # Available for discretionary spending
        available_for_month = total_monthly_income - total_monthly_expenses
        
        # ================================================================
        # PHASE 2: ANALYZE SPENDING PATTERNS & HISTORICAL TRENDS
        # ================================================================
        
        # Current month spending
        mtd_spent = 0
        mtd_transaction_count = 0
        spending_by_category = defaultdict(float)
        spending_by_week = defaultdict(float)
        largest_transactions = []
        
        for transaction in budget_data['transactions']:
            try:
                trans_date = datetime.fromisoformat(transaction['date'])
                amount = float(transaction.get('amount', 0))
                category = transaction.get('category', 'Uncategorized')
                
                if trans_date.year == current_year and trans_date.month == current_month and amount > 0:
                    mtd_spent += amount
                    mtd_transaction_count += 1
                    spending_by_category[category] += amount
                    
                    # Track by week of month
                    week_num = (trans_date.day - 1) // 7 + 1
                    spending_by_week[week_num] += amount
                    
                    # Track large transactions
                    largest_transactions.append({
                        'date': trans_date,
                        'amount': amount,
                        'category': category,
                        'description': transaction.get('description', '')
                    })
            except (ValueError, KeyError):
                continue
        
        # Sort largest transactions
        largest_transactions.sort(key=lambda x: x['amount'], reverse=True)
        largest_transactions = largest_transactions[:5]
        
        # Historical spending analysis (last 3-6 months)
        historical_spending = defaultdict(float)
        historical_income = defaultdict(float)
        historical_savings = defaultdict(float)
        months_analyzed = []
        
        for i in range(1, 7):  # Look back 6 months
            past_month = current_month - i
            past_year = current_year
            if past_month <= 0:
                past_month += 12
                past_year -= 1
            
            month_key = f"{past_year}-{past_month:02d}"
            months_analyzed.append(month_key)
            
            # Calculate spending for that month
            month_spending = 0
            for transaction in budget_data['transactions']:
                try:
                    trans_date = datetime.fromisoformat(transaction['date'])
                    if trans_date.year == past_year and trans_date.month == past_month:
                        amount = float(transaction.get('amount', 0))
                        if amount > 0:
                            month_spending += amount
                except (ValueError, KeyError):
                    continue
            
            historical_spending[month_key] = month_spending
            # Income would be roughly the same each month
            historical_income[month_key] = total_monthly_income
            # Savings = Income - Expenses - Spending
            historical_savings[month_key] = total_monthly_income - total_monthly_expenses - month_spending
        
        # Calculate average historical spending
        spending_values = [v for v in historical_spending.values() if v > 0]
        avg_monthly_spending = mean(spending_values) if spending_values else 0
        median_monthly_spending = median(spending_values) if spending_values else 0
        
        # Calculate spending trends
        if len(spending_values) >= 3:
            recent_3mo_avg = mean(spending_values[:3])
            older_3mo_avg = mean(spending_values[3:6]) if len(spending_values) >= 6 else recent_3mo_avg
            spending_trend = 'increasing' if recent_3mo_avg > older_3mo_avg * 1.1 else 'decreasing' if recent_3mo_avg < older_3mo_avg * 0.9 else 'stable'
        else:
            spending_trend = 'insufficient_data'
        
        # Current month projections
        if current_day > 0:
            daily_spending_rate = mtd_spent / current_day
            projected_month_spending = daily_spending_rate * days_in_month
            remaining_budget = available_for_month - mtd_spent
            safe_daily_rate = remaining_budget / days_remaining if days_remaining > 0 else 0
        else:
            daily_spending_rate = 0
            projected_month_spending = 0
            remaining_budget = available_for_month
            safe_daily_rate = available_for_month / days_in_month
        
        # ================================================================
        # PHASE 3: CRITICAL & URGENT PRIORITY ACTIONS
        # ================================================================
        
        # CRITICAL: Overdrawn account
        if checking_balance < 0:
            priority_actions.append({
                'priority': 'critical',
                'icon': '🚨',
                'category': 'Account Emergency',
                'action': 'Transfer funds to cover overdraft immediately',
                'reason': f'Your checking account is overdrawn by {formatCurrency(abs(checking_balance))}',
                'impact': 'You may be charged overdraft fees ($25-35 per transaction). Act now!',
                'estimated_impact': abs(checking_balance),
                'actionable_steps': [
                    f'Transfer {formatCurrency(abs(checking_balance) + 100)} from savings to checking',
                    'Check for pending overdraft fees',
                    'Contact your bank if fees were charged to request fee reversal'
                ]
            })
        
        # CRITICAL: Insufficient funds for upcoming bills
        elif checking_balance > 0 and checking_balance < upcoming_bills_7days:
            deficit = upcoming_bills_7days - checking_balance
            priority_actions.append({
                'priority': 'critical',
                'icon': '⚠️',
                'category': 'Bill Payment Risk',
                'action': f'Transfer {formatCurrency(deficit + 200)} to checking for upcoming bills',
                'reason': f'Bills due in 7 days ({formatCurrency(upcoming_bills_7days)}) exceed checking balance ({formatCurrency(checking_balance)})',
                'impact': 'Prevent late payment fees and maintain good payment history',
                'estimated_impact': deficit,
                'actionable_steps': [
                    f'Transfer {formatCurrency(deficit + 200)} from savings (includes $200 buffer)',
                    'Review which bills are due in the next week',
                    'Consider setting up autopay for recurring bills'
                ]
            })
        
        # CRITICAL: Projected to run out of money before month end
        elif remaining_budget < 0:
            priority_actions.append({
                'priority': 'critical',
                'icon': '🛑',
                'category': 'Budget Overrun',
                'action': 'Immediately reduce spending - budget already exceeded',
                'reason': f'You\'ve already spent {formatCurrency(abs(remaining_budget))} more than your monthly budget with {days_remaining} days left',
                'impact': 'Prevent further debt accumulation and financial stress',
                'estimated_impact': abs(remaining_budget),
                'actionable_steps': [
                    'Stop all non-essential spending immediately',
                    'Review large recent purchases to see if any can be returned',
                    'Use only cash for remaining days of month',
                    f'Target: Spend less than {formatCurrency(max(remaining_budget / days_remaining, 0))}/day'
                ]
            })
        
        # URGENT: Bills due today/tomorrow
        urgent_bill_count = len([b for b in unpaid_bills if b['days'] <= 1 and not b['is_autopay']])
        if urgent_bill_count > 0:
            urgent_bills_list = [b for b in unpaid_bills if b['days'] <= 1 and not b['is_autopay']]
            total_urgent = sum(b['amount'] for b in urgent_bills_list)
            
            priority_actions.append({
                'priority': 'urgent',
                'icon': '⏰',
                'category': 'Bills Due Now',
                'action': f'Pay {urgent_bill_count} bill(s) due today/tomorrow',
                'reason': f'{formatCurrency(total_urgent)} in manual payments needed immediately',
                'impact': 'Avoid late fees ($25-50 per bill) and maintain credit score',
                'estimated_impact': total_urgent,
                'actionable_steps': [f'Pay {b["name"]}: {formatCurrency(b["amount"])} (due in {b["days"]} day{"s" if b["days"] != 1 else ""})' for b in urgent_bills_list[:3]]
            })
        
        # URGENT: Very low checking balance with bills coming
        if 0 < checking_balance < 200 and upcoming_bills_14days > 0:
            priority_actions.append({
                'priority': 'urgent',
                'icon': '💸',
                'category': 'Low Balance Warning',
                'action': 'Replenish checking account - dangerously low',
                'reason': f'Only {formatCurrency(checking_balance)} in checking with {formatCurrency(upcoming_bills_14days)} due in 2 weeks',
                'impact': 'Prevent overdrafts and maintain minimum balance requirements',
                'estimated_impact': max(500 - checking_balance, 0),
                'actionable_steps': [
                    f'Transfer {formatCurrency(max(500 - checking_balance, 0))} from savings to checking',
                    'Delay non-essential purchases until after next paycheck',
                    'Review which bills can be pushed to later in the month if needed'
                ]
            })
        
        # URGENT: Spending too fast
        if current_day >= 7 and daily_spending_rate > safe_daily_rate * 1.5:
            overspend_amount = (daily_spending_rate - safe_daily_rate) * days_remaining
            priority_actions.append({
                'priority': 'urgent',
                'icon': '⚡',
                'category': 'Spending Velocity',
                'action': f'Slow down spending immediately - tracking to overspend by {formatCurrency(overspend_amount)}',
                'reason': f'Current pace: {formatCurrency(daily_spending_rate)}/day. Safe pace: {formatCurrency(safe_daily_rate)}/day',
                'impact': f'Avoid going {formatCurrency(overspend_amount)} over budget this month',
                'estimated_impact': overspend_amount,
                'actionable_steps': [
                    f'Reduce daily spending to {formatCurrency(safe_daily_rate)} or less',
                    'Meal prep at home instead of dining out',
                    'Postpone non-essential purchases until next month',
                    'Track every purchase for the rest of the month'
                ]
            })
        
        # ================================================================
        # PHASE 4: IMPORTANT RECOMMENDATIONS
        # ================================================================
        
        # Emergency Fund Building
        emergency_fund_target = total_monthly_expenses * 3  # Minimum 3 months
        emergency_fund_ideal = total_monthly_expenses * 6   # Ideal 6 months
        
        if savings_balance < emergency_fund_target:
            shortage = emergency_fund_target - savings_balance
            months_to_build = shortage / (total_monthly_income * 0.10) if total_monthly_income > 0 else 0
            
            recommendations.append({
                'priority': 'high',
                'icon': '🏦',
                'category': 'Emergency Fund',
                'action': f'Build emergency fund to {formatCurrency(emergency_fund_target)} (3 months expenses)',
                'reason': f'Current savings: {formatCurrency(savings_balance)}. You\'re {formatCurrency(shortage)} short of a 3-month safety net',
                'impact': 'Financial security in case of job loss, medical emergency, or major expense',
                'estimated_impact': shortage,
                'timeline': f'~{int(months_to_build)} months at 10% savings rate',
                'actionable_steps': [
                    f'Save {formatCurrency(total_monthly_income * 0.10)}/month (10% of income)',
                    'Automate transfers to savings on payday',
                    'Put windfalls (tax refunds, bonuses) directly into savings',
                    f'Target date: {(now + timedelta(days=int(months_to_build * 30))).strftime("%B %Y")}'
                ]
            })
        elif savings_balance < emergency_fund_ideal:
            shortage = emergency_fund_ideal - savings_balance
            
            recommendations.append({
                'priority': 'medium',
                'icon': '✨',
                'category': 'Emergency Fund',
                'action': f'Boost emergency fund to {formatCurrency(emergency_fund_ideal)} (6 months)',
                'reason': f'You have the minimum 3-month fund. Consider building to ideal 6-month cushion',
                'impact': 'Maximum financial security and peace of mind',
                'estimated_impact': shortage,
                'actionable_steps': [
                    f'Increase savings to {formatCurrency(total_monthly_income * 0.15)}/month',
                    'Continue until reaching 6-month target',
                    'Keep funds in high-yield savings account (5%+ APY)'
                ]
            })
        
        # Spending Velocity Warning (not yet urgent)
        if current_day >= 5 and safe_daily_rate > 0:
            if daily_spending_rate > safe_daily_rate * 1.2:
                recommendations.append({
                    'priority': 'high',
                    'icon': '🎯',
                    'category': 'Spending Control',
                    'action': f'Reduce spending to {formatCurrency(safe_daily_rate)}/day',
                    'reason': f'Current pace ({formatCurrency(daily_spending_rate)}/day) is 20% too high',
                    'impact': f'Stay within budget and avoid {formatCurrency((daily_spending_rate - safe_daily_rate) * days_remaining)} overspend',
                    'estimated_impact': (daily_spending_rate - safe_daily_rate) * days_remaining,
                    'actionable_steps': [
                        'Review recent large purchases - were they necessary?',
                        'Use the "48-hour rule" for purchases over $50',
                        'Pack lunch instead of eating out',
                        'Have a "no-spend weekend" this week'
                    ]
                })
        
        # Credit Card Debt
        if credit_balance < 0:  # Negative = carrying debt
            recommendations.append({
                'priority': 'high',
                'icon': '💳',
                'category': 'Debt Payoff',
                'action': f'Pay down credit card debt: {formatCurrency(abs(credit_balance))}',
                'reason': 'High-interest debt costs you money every month',
                'impact': f'Save ~{formatCurrency(abs(credit_balance) * 0.20 / 12)}/month in interest (assuming 20% APR)',
                'estimated_impact': abs(credit_balance),
                'actionable_steps': [
                    f'Pay minimum + ${50-100} extra each month',
                    'Stop using credit cards until balance is paid off',
                    'Consider debt avalanche method (highest interest first)',
                    'Look into balance transfer offers (0% APR for 12-18 months)'
                ]
            })
        
        # Savings Rate Optimization
        if total_monthly_income > 0:
            current_savings_rate = (savings_balance / total_monthly_income) if savings_balance >= 0 else 0
            
            if current_savings_rate < 0.10:  # Less than 10% saved
                target_monthly_savings = total_monthly_income * 0.10
                recommendations.append({
                    'priority': 'medium',
                    'icon': '💰',
                    'category': 'Savings Rate',
                    'action': f'Increase savings to {formatCurrency(target_monthly_savings)}/month (10% of income)',
                    'reason': 'Financial experts recommend saving at least 10-15% of income',
                    'impact': f'{formatCurrency(target_monthly_savings * 12)}/year toward financial goals',
                    'estimated_impact': target_monthly_savings * 12,
                    'actionable_steps': [
                        'Set up automatic transfer on payday',
                        'Start small (5%) and increase monthly',
                        'Use the "pay yourself first" method',
                        'Save raises and bonuses instead of spending them'
                    ]
                })
        
        # Category-Specific Spending Insights
        top_categories = sorted(spending_by_category.items(), key=lambda x: x[1], reverse=True)[:3]
        if len(top_categories) > 0 and avg_monthly_spending > 0:
            for category, amount in top_categories:
                percent_of_spending = (amount / mtd_spent * 100) if mtd_spent > 0 else 0
                projected_category = amount / current_day * days_in_month if current_day > 0 else amount
                
                # High spending in dining/entertainment
                if category in ['Dining Out', 'Entertainment', 'Shopping'] and percent_of_spending > 25:
                    recommendations.append({
                        'priority': 'medium',
                        'icon': '🍽️' if category == 'Dining Out' else '🎮' if category == 'Entertainment' else '🛍️',
                        'category': 'Category Spending',
                        'action': f'Reduce {category} spending',
                        'reason': f'{category} is {percent_of_spending:.0f}% of your spending ({formatCurrency(amount)} this month)',
                        'impact': f'Save {formatCurrency(projected_category * 0.30)}/month by cutting 30%',
                        'estimated_impact': projected_category * 0.30,
                        'actionable_steps': [
                            f'Set a {category} budget of {formatCurrency(projected_category * 0.70)}/month',
                            'Find free or low-cost alternatives',
                            'Use coupons and discount apps',
                            'Track every purchase in this category'
                        ]
                    })
        
        # Bill Payment Optimization
        if manual_pay_total > 0 and autopay_total < total_monthly_expenses:
            recommendations.append({
                'priority': 'low',
                'icon': '🔄',
                'category': 'Automation',
                'action': 'Set up autopay for recurring bills',
                'reason': f'{formatCurrency(manual_pay_total)} in bills still require manual payment',
                'impact': 'Never miss a payment, improve credit score, reduce mental overhead',
                'estimated_impact': 0,
                'actionable_steps': [
                    'Enable autopay for utilities, subscriptions, and fixed bills',
                    'Keep at least 1 month of bills in checking as buffer',
                    'Set calendar reminders 2 days before autopay dates',
                    'Review statements monthly to catch errors'
                ]
            })
        
        # Account Diversification
        if account_count < 3:
            recommendations.append({
                'priority': 'low',
                'icon': '🏦',
                'category': 'Account Setup',
                'action': 'Open separate savings account if needed',
                'reason': 'Separate accounts help organize money and prevent overspending',
                'impact': 'Better financial organization and automatic "out of sight, out of mind" savings',
                'estimated_impact': 0,
                'actionable_steps': [
                    'Open high-yield savings account (5%+ APY)',
                    'Keep 3-6 months expenses in emergency fund',
                    'Consider separate savings for goals (vacation, car, home)',
                    'Look for accounts with no fees and no minimums'
                ]
            })
        
        # ================================================================
        # PHASE 5: POSITIVE INSIGHTS & WINS
        # ================================================================
        
        # Celebrate emergency fund milestones
        if savings_balance >= emergency_fund_ideal:
            insights.append({
                'type': 'celebration',
                'icon': '🎉',
                'category': 'Emergency Fund',
                'message': 'Excellent! You have 6+ months of expenses saved',
                'detail': f'Your {formatCurrency(savings_balance)} savings provides strong financial security'
            })
        elif savings_balance >= emergency_fund_target:
            insights.append({
                'type': 'positive',
                'icon': '✅',
                'category': 'Emergency Fund',
                'message': 'Great job! You have 3+ months of expenses saved',
                'detail': f'Your {formatCurrency(savings_balance)} emergency fund provides good protection'
            })
        
        # Good spending pace
        if current_day >= 7 and daily_spending_rate > 0 and daily_spending_rate <= safe_daily_rate:
            insights.append({
                'type': 'positive',
                'icon': '🎯',
                'category': 'Spending Control',
                'message': 'Perfect spending pace!',
                'detail': f'You\'re spending {formatCurrency(daily_spending_rate)}/day, which is right on track'
            })
        
        # Decreasing spending trend
        if spending_trend == 'decreasing':
            insights.append({
                'type': 'positive',
                'icon': '📉',
                'category': 'Spending Trend',
                'message': 'Your spending is decreasing over time',
                'detail': 'You\'re developing better spending habits. Keep it up!'
            })
        
        # High autopay percentage
        if total_monthly_expenses > 0:
            autopay_percent = (autopay_total / total_monthly_expenses) * 100
            if autopay_percent >= 80:
                insights.append({
                    'type': 'positive',
                    'icon': '🔄',
                    'category': 'Automation',
                    'message': f'{autopay_percent:.0f}% of bills are on autopay',
                    'detail': 'Great automation! This prevents late payments and saves time'
                })
        
        # Surplus money opportunity
        if remaining_budget > 200 and days_remaining < 5:
            insights.append({
                'type': 'opportunity',
                'icon': '💵',
                'category': 'Surplus',
                'message': f'You have {formatCurrency(remaining_budget)} surplus this month!',
                'detail': 'Consider moving it to savings or toward financial goals'
            })
        
        # Upcoming paycheck
        if len(next_paychecks) > 0:
            next_check = next_paychecks[0]
            if next_check['days'] <= 3:
                insights.append({
                    'type': 'info',
                    'icon': '💰',
                    'category': 'Income',
                    'message': f'Paycheck coming soon: {next_check["earner"]}',
                    'detail': f'{formatCurrency(next_check["amount"])} in {next_check["days"]} day{"s" if next_check["days"] != 1 else ""}'
                })
        
        # ================================================================
        # PHASE 6: FINANCIAL WISDOM & TIPS
        # ================================================================
        
        # Time-of-month specific tips
        if current_day <= 7:
            tips.append({
                'icon': '📅',
                'category': 'Month Start',
                'title': 'Start of Month Strategy',
                'message': 'Front-load your savings by transferring to savings immediately after payday. This ensures you save before spending.'
            })
        elif current_day >= 20:
            tips.append({
                'icon': '🎯',
                'category': 'Month End',
                'title': 'Finish Strong',
                'message': 'You\'re in the home stretch! Review your spending for the month and plan for next month\'s budget.'
            })
        
        # General wisdom based on income level
        if total_monthly_income > 0 and total_monthly_income < 7000:  # ~$84k/year or less
            tips.append({
                'icon': '💡',
                'category': 'Budget Strategy',
                'title': '50/30/20 Budget Rule',
                'message': f'For your income ({formatCurrency(total_monthly_income)}/mo), aim for: 50% needs ({formatCurrency(total_monthly_income * 0.50)}), 30% wants ({formatCurrency(total_monthly_income * 0.30)}), 20% savings ({formatCurrency(total_monthly_income * 0.20)})'
            })
        
        # Spending analysis tip
        if len(largest_transactions) > 0:
            tips.append({
                'icon': '🔍',
                'category': 'Awareness',
                'title': 'Review Large Purchases',
                'message': f'Your largest purchase this month was {formatCurrency(largest_transactions[0]["amount"])} in {largest_transactions[0]["category"]}. Always ask: "Was this necessary? Could I have spent less?"'
            })
        
        # ================================================================
        # PHASE 7: SETUP & COMPLETENESS CHECKS
        # ================================================================
        
        if income_sources_count == 0:
            recommendations.append({
                'priority': 'medium',
                'icon': '📝',
                'category': 'Setup',
                'action': 'Add your income sources',
                'reason': 'We need to know your income to give accurate recommendations',
                'impact': 'Unlock personalized budgeting and projections',
                'estimated_impact': 0,
                'actionable_steps': [
                    'Go to Income tab',
                    'Add all income sources (salary, side hustles, etc.)',
                    'Include payment frequency and amounts'
                ]
            })
        
        if len(budget_data['fixed_expenses']) == 0:
            recommendations.append({
                'priority': 'medium',
                'icon': '💸',
                'category': 'Setup',
                'action': 'Add your monthly bills and fixed expenses',
                'reason': 'Tracking fixed expenses helps prevent missed payments',
                'impact': 'Better budget planning and bill reminders',
                'estimated_impact': 0,
                'actionable_steps': [
                    'Go to Expenses tab',
                    'Add recurring bills (rent, utilities, subscriptions)',
                    'Include due dates and amounts'
                ]
            })
        
        if account_count == 0:
            recommendations.append({
                'priority': 'medium',
                'icon': '🏦',
                'category': 'Setup',
                'action': 'Add your bank accounts',
                'reason': 'We need account balances to monitor overdraft risk',
                'impact': 'Get real-time financial health insights',
                'estimated_impact': 0,
                'actionable_steps': [
                    'Add checking account(s)',
                    'Add savings account(s)',
                    'Add credit cards (if applicable)',
                    'Update balances regularly'
                ]
            })
        
        # ================================================================
        # PHASE 8: SORT AND PRIORITIZE
        # ================================================================
        
        priority_order = {'critical': 0, 'urgent': 1, 'high': 2, 'medium': 3, 'low': 4}
        priority_actions.sort(key=lambda x: priority_order.get(x.get('priority', 'low'), 5))
        recommendations.sort(key=lambda x: priority_order.get(x.get('priority', 'low'), 5))
        
        # Limit to reasonable amounts
        priority_actions = priority_actions[:5]  # Top 5 critical/urgent
        recommendations = recommendations[:8]     # Top 8 recommendations
        insights = insights[:6]                   # Top 6 insights
        tips = tips[:4]                          # Top 4 tips
        
        # ================================================================
        # PHASE 9: BUILD COMPREHENSIVE RESPONSE
        # ================================================================
        
        return jsonify({
            'success': True,
            'priority_actions': priority_actions,
            'recommendations': recommendations,
            'insights': insights,
            'tips': tips,
            'summary': {
                'checking_balance': round(checking_balance, 2),
                'savings_balance': round(savings_balance, 2),
                'total_liquid': round(total_liquid, 2),
                'credit_balance': round(credit_balance, 2),
                'total_monthly_income': round(total_monthly_income, 2),
                'total_monthly_expenses': round(total_monthly_expenses, 2),
                'available_for_month': round(available_for_month, 2),
                'mtd_spent': round(mtd_spent, 2),
                'remaining_budget': round(remaining_budget, 2),
                'daily_spending_rate': round(daily_spending_rate, 2),
                'safe_daily_rate': round(safe_daily_rate, 2),
                'upcoming_bills_7days': round(upcoming_bills_7days, 2),
                'unpaid_bill_count': len(unpaid_bills),
                'days_remaining': days_remaining,
                'spending_trend': spending_trend,
                'emergency_fund_status': 'ideal' if savings_balance >= emergency_fund_ideal else 'good' if savings_balance >= emergency_fund_target else 'building',
                'data_completeness': {
                    'has_accounts': account_count > 0,
                    'has_income': income_sources_count > 0,
                    'has_expenses': len(budget_data['fixed_expenses']) > 0,
                    'has_transactions': len(budget_data['transactions']) > 0
                }
            },
            'meta': {
                'generated_at': now.isoformat(),
                'analysis_depth': 'comprehensive',
                'months_analyzed': len([v for v in historical_spending.values() if v > 0]),
                'ai_version': '2.0'
            }
        })
        
    except Exception as e:
        print(f"Error in smart recommendations: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'priority_actions': [],
            'recommendations': [],
            'insights': [],
            'tips': []
        }), 500

# Helper function to format currency in recommendations
def formatCurrency(amount):
    """Format currency for display in recommendations"""
    return f"${amount:,.2f}"

# Tax bracket calculator endpoint
@app.route('/api/income/tax-estimate', methods=['GET'])
def calculate_tax_estimate():
    """
    Calculate federal tax bracket and estimated tax liability based on household income.
    Returns detailed tax information including:
    - Federal tax brackets and rates
    - Effective tax rate
    - Marginal tax rate
    - Total estimated federal tax
    - Tax by bracket breakdown
    - After-tax income
    """
    try:
        # 2025 Federal Tax Brackets (Tax year 2025, filing in 2026)
        # Updated for inflation adjustments
        TAX_BRACKETS = {
            'single': [
                (11925, 0.10),    # 10% on income up to $11,925
                (48475, 0.12),    # 12% on income $11,926 to $48,475
                (103350, 0.22),   # 22% on income $48,476 to $103,350
                (197300, 0.24),   # 24% on income $103,351 to $197,300
                (250525, 0.32),   # 32% on income $197,301 to $250,525
                (626350, 0.35),   # 35% on income $250,526 to $626,350
                (float('inf'), 0.37)  # 37% on income over $626,350
            ],
            'married-joint': [
                (23850, 0.10),    # 10% on income up to $23,850
                (96950, 0.12),    # 12% on income $23,851 to $96,950
                (206700, 0.22),   # 22% on income $96,951 to $206,700
                (394600, 0.24),   # 24% on income $206,701 to $394,600
                (501050, 0.32),   # 32% on income $394,601 to $501,050
                (751600, 0.35),   # 35% on income $501,051 to $751,600
                (float('inf'), 0.37)  # 37% on income over $751,600
            ],
            'married-separate': [
                (11925, 0.10),    # 10% on income up to $11,925
                (48475, 0.12),    # 12% on income $11,926 to $48,475
                (103350, 0.22),   # 22% on income $48,476 to $103,350
                (197300, 0.24),   # 24% on income $103,351 to $197,300
                (250525, 0.32),   # 32% on income $197,301 to $250,525
                (375800, 0.35),   # 35% on income $250,526 to $375,800
                (float('inf'), 0.37)  # 37% on income over $375,800
            ],
            'head-of-household': [
                (17000, 0.10),    # 10% on income up to $17,000
                (64850, 0.12),    # 12% on income $17,001 to $64,850
                (103350, 0.22),   # 22% on income $64,851 to $103,350
                (197300, 0.24),   # 24% on income $103,351 to $197,300
                (250500, 0.32),   # 32% on income $197,301 to $250,500
                (626350, 0.35),   # 35% on income $250,501 to $626,350
                (float('inf'), 0.37)  # 37% on income over $626,350
            ]
        }
        
        # Standard deductions for 2025
        STANDARD_DEDUCTIONS = {
            'single': 15000,
            'married-joint': 30000,
            'married-separate': 15000,
            'head-of-household': 22500
        }
        
        # Get query parameters
        filing_status = request.args.get('filing_status', 'married-joint')
        use_actual_income = request.args.get('use_actual', 'false').lower() == 'true'
        
        # Validate filing status
        if filing_status not in TAX_BRACKETS:
            return jsonify({
                'success': False,
                'error': f'Invalid filing status. Must be one of: {", ".join(TAX_BRACKETS.keys())}'
            }), 400
        
        # Calculate total annual gross income from all sources
        total_annual_income = 0
        income_breakdown = []
        
        for income in budget_data['income_sources']:
            # Determine which income to use
            if use_actual_income and income.get('actual_payments'):
                # Use actual payments from the last 12 months
                from datetime import datetime, timedelta
                twelve_months_ago = datetime.now() - timedelta(days=365)
                
                recent_payments = [
                    p for p in income['actual_payments']
                    if datetime.fromisoformat(p['date']) >= twelve_months_ago
                ]
                
                if recent_payments:
                    annual_amount = sum(p['amount'] for p in recent_payments)
                else:
                    # Fall back to expected if no actual payments
                    annual_amount = _calculate_annual_income(income['amount'], income['frequency'])
            else:
                # Use expected income
                annual_amount = _calculate_annual_income(income['amount'], income['frequency'])
            
            total_annual_income += annual_amount
            income_breakdown.append({
                'name': income['name'],
                'type': income['type'],
                'earner': income.get('earner_name', 'Unassigned'),
                'annual_amount': round(annual_amount, 2)
            })
        
        # Calculate taxable income (subtract standard deduction)
        standard_deduction = STANDARD_DEDUCTIONS[filing_status]
        taxable_income = max(0, total_annual_income - standard_deduction)
        
        # Calculate tax liability using progressive brackets
        brackets = TAX_BRACKETS[filing_status]
        total_tax = 0
        tax_by_bracket = []
        previous_limit = 0
        marginal_rate = 0
        
        for bracket_limit, rate in brackets:
            if taxable_income <= previous_limit:
                break
            
            # Calculate income in this bracket
            income_in_bracket = min(taxable_income, bracket_limit) - previous_limit
            
            if income_in_bracket > 0:
                tax_in_bracket = income_in_bracket * rate
                total_tax += tax_in_bracket
                marginal_rate = rate  # Last applied rate is marginal rate
                
                tax_by_bracket.append({
                    'rate': rate,
                    'rate_percent': round(rate * 100, 1),
                    'income_in_bracket': round(income_in_bracket, 2),
                    'tax_amount': round(tax_in_bracket, 2),
                    'bracket_min': round(previous_limit, 2),
                    'bracket_max': round(bracket_limit, 2) if bracket_limit != float('inf') else None
                })
            
            previous_limit = bracket_limit
        
        # Calculate effective tax rate
        effective_rate = (total_tax / total_annual_income) if total_annual_income > 0 else 0
        
        # Calculate after-tax income
        after_tax_income = total_annual_income - total_tax
        
        # Calculate monthly values
        monthly_gross = total_annual_income / 12
        monthly_tax = total_tax / 12
        monthly_net = after_tax_income / 12
        
        # Prepare response
        return jsonify({
            'success': True,
            'filing_status': filing_status,
            'filing_status_label': filing_status.replace('-', ' ').title(),
            'use_actual_income': use_actual_income,
            'income': {
                'annual_gross': round(total_annual_income, 2),
                'monthly_gross': round(monthly_gross, 2),
                'breakdown': income_breakdown,
                'total_sources': len(income_breakdown)
            },
            'deductions': {
                'standard_deduction': round(standard_deduction, 2),
                'taxable_income': round(taxable_income, 2)
            },
            'tax': {
                'total_annual': round(total_tax, 2),
                'total_monthly': round(monthly_tax, 2),
                'effective_rate': round(effective_rate, 4),
                'effective_rate_percent': round(effective_rate * 100, 2),
                'marginal_rate': round(marginal_rate, 4),
                'marginal_rate_percent': round(marginal_rate * 100, 1),
                'by_bracket': tax_by_bracket
            },
            'after_tax': {
                'annual': round(after_tax_income, 2),
                'monthly': round(monthly_net, 2)
            },
            'paycheck_withholding': {
                'weekly': round(total_tax / 52, 2),
                'bi_weekly': round(total_tax / 26, 2),
                'semi_monthly': round(total_tax / 24, 2),
                'monthly': round(monthly_tax, 2)
            },
            'note': 'This is an estimate for federal income tax only. State and local taxes, FICA taxes, and other deductions are not included.'
        })
        
    except Exception as e:
        print(f"Error calculating tax estimate: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def _calculate_annual_income(amount, frequency):
    """Helper function to convert any income frequency to annual amount"""
    multipliers = {
        'weekly': 52,
        'bi-weekly': 26,
        'monthly': 12,
        'annual': 1
    }
    return amount * multipliers.get(frequency, 12)

# ============================================================================
# RETIREMENT ACCOUNTS ENDPOINTS
# ============================================================================

@app.route('/api/retirement-accounts', methods=['GET'])
def get_retirement_accounts():
    """Get all retirement accounts"""
    try:
        accounts = budget_data.get('retirement_accounts', [])
        print(f"DEBUG: Found {len(accounts)} retirement accounts")
        print(f"DEBUG: Accounts data: {accounts}")
        
        # Calculate year-to-date totals for each account
        current_year = datetime.now().year
        for account in accounts:
            ytd_total = 0
            ytd_employee = 0
            ytd_employer = 0
            
            contributions = account.get('contributions', [])
            for contrib in contributions:
                contrib_date = datetime.fromisoformat(contrib['date'])
                if contrib_date.year == current_year:
                    ytd_total += contrib['amount']
                    if contrib.get('contribution_type') == 'employer_match':
                        ytd_employer += contrib['amount']
                    else:
                        ytd_employee += contrib['amount']
            
            account['ytd_total'] = round(ytd_total, 2)
            account['ytd_employee'] = round(ytd_employee, 2)
            account['ytd_employer'] = round(ytd_employer, 2)
            
            # Calculate remaining limit
            limit = account.get('annual_limit', 0)
            account['remaining_limit'] = round(limit - ytd_employee, 2)
            account['limit_percentage'] = round((ytd_employee / limit * 100) if limit > 0 else 0, 2)
        
        return jsonify({
            'success': True,
            'accounts': accounts
        })
    except Exception as e:
        print(f"Error getting retirement accounts: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/retirement-accounts', methods=['POST'])
def add_retirement_account():
    """Add a new retirement account"""
    try:
        account_data = request.json
        
        # Ensure retirement_accounts exists
        if 'retirement_accounts' not in budget_data:
            budget_data['retirement_accounts'] = []
        
        # Generate new ID
        existing_ids = [acc['id'] for acc in budget_data['retirement_accounts']]
        new_id = max(existing_ids) + 1 if existing_ids else 1
        
        # Validate required fields
        required_fields = ['account_name', 'account_type', 'contribution_type']
        for field in required_fields:
            if field not in account_data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Set default values based on account type for 2025
        account_type = account_data['account_type']
        default_limits = {
            '401k': 23500,
            '403b': 23500,
            'traditional_ira': 7000,
            'roth_ira': 7000,
            'sep_ira': 69000,
            'simple_ira': 16000
        }
        
        # Create new account
        new_account = {
            'id': new_id,
            'account_name': account_data['account_name'],
            'account_type': account_type,
            'contribution_type': account_data['contribution_type'],
            'annual_limit': account_data.get('annual_limit', default_limits.get(account_type, 0)),
            'current_balance': account_data.get('current_balance', 0),
            'employer_match_percent': account_data.get('employer_match_percent', 0),
            'employer_match_limit': account_data.get('employer_match_limit', 0),
            'linked_income_id': account_data.get('linked_income_id'),
            'contribution_per_paycheck': account_data.get('contribution_per_paycheck', 0),
            'notes': account_data.get('notes', ''),
            'contributions': [],
            'created_at': datetime.now().isoformat()
        }
        
        budget_data['retirement_accounts'].append(new_account)
        save_data()
        
        return jsonify({
            'success': True,
            'account': new_account
        })
    except Exception as e:
        print(f"Error adding retirement account: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/retirement-accounts/<int:account_id>', methods=['PUT'])
def update_retirement_account(account_id):
    """Update a retirement account"""
    try:
        account_data = request.json
        
        accounts = budget_data.get('retirement_accounts', [])
        account_index = next((i for i, acc in enumerate(accounts) if acc['id'] == account_id), None)
        
        if account_index is None:
            return jsonify({
                'success': False,
                'error': 'Account not found'
            }), 404
        
        # Update account fields
        account = accounts[account_index]
        updatable_fields = [
            'account_name', 'account_type', 'contribution_type', 'annual_limit',
            'current_balance', 'employer_match_percent', 'employer_match_limit',
            'linked_income_id', 'contribution_per_paycheck', 'notes'
        ]
        
        for field in updatable_fields:
            if field in account_data:
                account[field] = account_data[field]
        
        account['updated_at'] = datetime.now().isoformat()
        save_data()
        
        return jsonify({
            'success': True,
            'account': account
        })
    except Exception as e:
        print(f"Error updating retirement account: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/retirement-accounts/<int:account_id>', methods=['DELETE'])
def delete_retirement_account(account_id):
    """Delete a retirement account"""
    try:
        accounts = budget_data.get('retirement_accounts', [])
        
        account_index = next((i for i, acc in enumerate(accounts) if acc['id'] == account_id), None)
        
        if account_index is None:
            return jsonify({
                'success': False,
                'error': 'Account not found'
            }), 404
        
        deleted_account = accounts.pop(account_index)
        save_data()
        
        return jsonify({
            'success': True,
            'deleted_account': deleted_account
        })
    except Exception as e:
        print(f"Error deleting retirement account: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/retirement-accounts/<int:account_id>/contributions', methods=['POST'])
def add_contribution(account_id):
    """Add a contribution to a retirement account"""
    try:
        contribution_data = request.json
        
        accounts = budget_data.get('retirement_accounts', [])
        account_index = next((i for i, acc in enumerate(accounts) if acc['id'] == account_id), None)
        
        if account_index is None:
            return jsonify({
                'success': False,
                'error': 'Account not found'
            }), 404
        
        account = accounts[account_index]
        
        # Validate required fields
        if 'amount' not in contribution_data or 'date' not in contribution_data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: amount and date'
            }), 400
        
        # Generate contribution ID
        existing_contrib_ids = [c.get('id', 0) for c in account.get('contributions', [])]
        new_contrib_id = max(existing_contrib_ids) + 1 if existing_contrib_ids else 1
        
        # Create contribution
        new_contribution = {
            'id': new_contrib_id,
            'date': contribution_data['date'],
            'amount': contribution_data['amount'],
            'contribution_type': contribution_data.get('contribution_type', 'employee'),
            'note': contribution_data.get('note', ''),
            'created_at': datetime.now().isoformat()
        }
        
        # Initialize contributions list if it doesn't exist
        if 'contributions' not in account:
            account['contributions'] = []
        
        account['contributions'].append(new_contribution)
        
        # Update current balance
        account['current_balance'] = account.get('current_balance', 0) + contribution_data['amount']
        
        save_data()
        
        return jsonify({
            'success': True,
            'contribution': new_contribution,
            'account': account
        })
    except Exception as e:
        print(f"Error adding contribution: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/retirement-accounts/<int:account_id>/contributions/<int:contribution_id>', methods=['DELETE'])
def delete_contribution(account_id, contribution_id):
    """Delete a contribution from a retirement account"""
    try:
        accounts = budget_data.get('retirement_accounts', [])
        
        account_index = next((i for i, acc in enumerate(accounts) if acc['id'] == account_id), None)
        
        if account_index is None:
            return jsonify({
                'success': False,
                'error': 'Account not found'
            }), 404
        
        account = accounts[account_index]
        contributions = account.get('contributions', [])
        
        contrib_index = next((i for i, c in enumerate(contributions) if c['id'] == contribution_id), None)
        
        if contrib_index is None:
            return jsonify({
                'success': False,
                'error': 'Contribution not found'
            }), 404
        
        deleted_contribution = contributions.pop(contrib_index)
        
        # Update current balance
        account['current_balance'] = account.get('current_balance', 0) - deleted_contribution['amount']
        
        save_data()
        
        return jsonify({
            'success': True,
            'deleted_contribution': deleted_contribution
        })
    except Exception as e:
        print(f"Error deleting contribution: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/retirement-accounts/summary', methods=['GET'])
def get_retirement_summary():
    """Get summary of all retirement accounts and contributions"""
    try:
        accounts = budget_data.get('retirement_accounts', [])
        current_year = datetime.now().year
        
        total_balance = 0
        total_ytd_contributions = 0
        total_ytd_employee = 0
        total_ytd_employer = 0
        
        for account in accounts:
            total_balance += account.get('current_balance', 0)
            
            contributions = account.get('contributions', [])
            for contrib in contributions:
                contrib_date = datetime.fromisoformat(contrib['date'])
                if contrib_date.year == current_year:
                    total_ytd_contributions += contrib['amount']
                    if contrib.get('contribution_type') == 'employer_match':
                        total_ytd_employer += contrib['amount']
                    else:
                        total_ytd_employee += contrib['amount']
        
        return jsonify({
            'success': True,
            'summary': {
                'total_accounts': len(accounts),
                'total_balance': round(total_balance, 2),
                'ytd_contributions': round(total_ytd_contributions, 2),
                'ytd_employee_contributions': round(total_ytd_employee, 2),
                'ytd_employer_contributions': round(total_ytd_employer, 2),
                'current_year': current_year
            }
        })
    except Exception as e:
        print(f"Error getting retirement summary: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/dashboard/projected-balance', methods=['GET'])
def get_projected_balance():
    """
    Calculate projected end-of-month balance based on:
    - Current account balances (checking + savings)
    - Expected income for rest of month
    - Remaining fixed expenses to be paid
    - Projected variable spending based on current velocity
    
    Returns comprehensive projection with health indicators
    """
    from datetime import datetime, timedelta
    from calendar import monthrange
    
    try:
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        current_day = now.day
        days_in_month = monthrange(current_year, current_month)[1]
        days_elapsed = current_day
        days_remaining = days_in_month - current_day
        
        # ==== 1. Calculate Current Liquid Balance ====
        checking_balance = 0
        savings_balance = 0
        liquid_balance = 0
        
        for account in budget_data['accounts']:
            account_type = account.get('type', '').lower()
            balance = float(account.get('balance', 0))
            
            if account_type == 'checking':
                checking_balance += balance
                liquid_balance += balance
            elif account_type == 'savings':
                savings_balance += balance
                liquid_balance += balance
        
        starting_balance = liquid_balance
        
        # ==== 2. Calculate Expected Income (Rest of Month) ====
        expected_income = 0
        upcoming_paychecks = []
        
        for income in budget_data['income_sources']:
            next_pay_date_str = income.get('next_pay_date')
            if not next_pay_date_str:
                continue
            
            try:
                next_pay_date = datetime.fromisoformat(next_pay_date_str.replace('Z', '+00:00')).replace(tzinfo=None)
                
                # Check if paycheck is later this month
                if next_pay_date.year == current_year and next_pay_date.month == current_month and next_pay_date.day > current_day:
                    amount = float(income.get('amount', 0))
                    expected_income += amount
                    upcoming_paychecks.append({
                        'name': income.get('earner_name', 'Income'),
                        'amount': amount,
                        'date': next_pay_date.strftime('%b %d'),
                        'days_away': (next_pay_date - now).days
                    })
            except (ValueError, TypeError) as e:
                print(f"Error parsing pay date for {income.get('name', 'Unknown')}: {e}")
                continue
        
        # ==== 3. Calculate Remaining Fixed Expenses ====
        remaining_expenses = 0
        unpaid_bills = []
        
        for expense in budget_data['fixed_expenses']:
            due_day = expense.get('due_day')
            is_paid = expense.get('is_paid', False)
            
            if due_day and not is_paid:
                try:
                    due_day = int(due_day)
                    amount = float(expense.get('amount', 0))
                    
                    # Check if bill is due later this month
                    if due_day > current_day:
                        remaining_expenses += amount
                        unpaid_bills.append({
                            'name': expense.get('name', 'Bill'),
                            'amount': amount,
                            'due_day': due_day,
                            'days_away': due_day - current_day
                        })
                except (ValueError, TypeError):
                    continue
        
        # ==== 4. Calculate Current Spending Velocity ====
        mtd_spending = 0
        spending_by_day = {}
        
        for transaction in budget_data['transactions']:
            try:
                trans_date = datetime.fromisoformat(transaction['date'])
                if trans_date.year == current_year and trans_date.month == current_month:
                    amount = float(transaction.get('amount', 0))
                    if amount > 0:  # Only count expenses
                        mtd_spending += amount
                        day_key = trans_date.day
                        spending_by_day[day_key] = spending_by_day.get(day_key, 0) + amount
            except (ValueError, KeyError):
                continue
        
        # Calculate daily average and project remaining spending
        daily_average = mtd_spending / days_elapsed if days_elapsed > 0 else 0
        projected_remaining_spending = daily_average * days_remaining
        
        # ==== 5. Calculate Projection ====
        projected_balance = starting_balance + expected_income - remaining_expenses - projected_remaining_spending
        
        # Calculate change from current
        balance_change = projected_balance - starting_balance
        
        # ==== 6. Determine Health Status ====
        # Calculate some thresholds for health assessment
        monthly_income = sum(float(i.get('amount', 0)) for i in budget_data['income_sources'])
        monthly_expenses = sum(float(e.get('amount', 0)) for e in budget_data['fixed_expenses'])
        buffer_threshold = monthly_expenses * 0.25  # 25% of monthly expenses
        
        if projected_balance < 0:
            status = 'critical'
            status_text = 'Overdraft Risk'
            status_icon = '🚨'
            status_color = '#ef4444'
        elif projected_balance < buffer_threshold:
            status = 'warning'
            status_text = 'Low Balance'
            status_icon = '⚠️'
            status_color = '#f59e0b'
        elif projected_balance < buffer_threshold * 2:
            status = 'caution'
            status_text = 'Tight Budget'
            status_icon = '⚡'
            status_color = '#eab308'
        else:
            status = 'healthy'
            status_text = 'On Track'
            status_icon = '✅'
            status_color = '#22c55e'
        
        # ==== 7. Generate Insights & Recommendations ====
        insights = []
        recommendations = []
        
        # Insight: Spending velocity
        if days_elapsed > 0:
            percent_of_month = (days_elapsed / days_in_month) * 100
            percent_of_budget_spent = (mtd_spending / (monthly_income - monthly_expenses)) * 100 if (monthly_income - monthly_expenses) > 0 else 0
            
            if percent_of_budget_spent > percent_of_month + 10:
                insights.append(f"You're spending faster than the month is progressing ({percent_of_budget_spent:.0f}% spent vs {percent_of_month:.0f}% of month elapsed)")
                recommendations.append("Consider reducing discretionary spending to stay on track")
            elif percent_of_budget_spent < percent_of_month - 10:
                insights.append(f"Great job! You're spending slower than expected ({percent_of_budget_spent:.0f}% spent vs {percent_of_month:.0f}% of month elapsed)")
        
        # Insight: Upcoming bills
        if len(unpaid_bills) > 0:
            total_unpaid = sum(b['amount'] for b in unpaid_bills)
            insights.append(f"You have {len(unpaid_bills)} unpaid bill{' ' if len(unpaid_bills) == 1 else 's'} remaining (${total_unpaid:.2f})")
        
        # Insight: Expected income
        if expected_income > 0:
            insights.append(f"Expecting ${expected_income:.2f} in income before month end")
        else:
            insights.append("No more expected income this month")
            if projected_balance < 0:
                recommendations.append("Consider a spending freeze until next paycheck")
        
        # Recommendation: Low balance warning
        if status in ['critical', 'warning']:
            if remaining_expenses > 0:
                recommendations.append(f"You have ${remaining_expenses:.2f} in upcoming bills - ensure funds are available")
            recommendations.append("Review non-essential spending and consider cutting back")
            
            if savings_balance > 0 and projected_balance < 0:
                transfer_needed = abs(projected_balance) + buffer_threshold
                if transfer_needed <= savings_balance:
                    recommendations.append(f"Consider transferring ${transfer_needed:.2f} from savings to checking as a buffer")
        
        # Recommendation: Positive projection
        if status == 'healthy' and balance_change > buffer_threshold:
            surplus = balance_change - buffer_threshold
            recommendations.append(f"You're on track to have ${surplus:.2f} extra - consider saving or allocating to goals")
        
        # ==== 8. Build Breakdown Details ====
        breakdown = {
            'starting_balance': round(starting_balance, 2),
            'checking_balance': round(checking_balance, 2),
            'savings_balance': round(savings_balance, 2),
            'expected_income': round(expected_income, 2),
            'upcoming_paychecks': upcoming_paychecks,
            'remaining_expenses': round(remaining_expenses, 2),
            'unpaid_bills': unpaid_bills,
            'mtd_spending': round(mtd_spending, 2),
            'daily_average': round(daily_average, 2),
            'projected_remaining_spending': round(projected_remaining_spending, 2),
            'days_remaining': days_remaining,
            'days_elapsed': days_elapsed
        }
        
        # ==== 9. Return Complete Response ====
        return jsonify({
            'success': True,
            'projected_balance': round(projected_balance, 2),
            'starting_balance': round(starting_balance, 2),
            'balance_change': round(balance_change, 2),
            'status': status,
            'status_text': status_text,
            'status_icon': status_icon,
            'status_color': status_color,
            'insights': insights,
            'recommendations': recommendations,
            'breakdown': breakdown,
            'month_name': now.strftime('%B'),
            'current_day': current_day,
            'days_in_month': days_in_month,
            'days_remaining': days_remaining,
            'has_data': True
        })
        
    except Exception as e:
        print(f"Error calculating projected balance: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'has_data': False
        }), 500

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
