"""
Generate test data for the Budget App
This script creates sample income data spanning multiple years to test the year-over-year comparison feature
"""

import json
import os
from datetime import datetime, timedelta
import random

# Path to the data file
DATA_FILE = os.path.join(os.path.dirname(__file__), 'server', 'budget_data.json')

def generate_test_data():
    """Generate comprehensive test data with income from multiple years"""
    
    # Initialize base data structure
    # Realistic accounts for a family making ~$60k/year
    budget_data = {
        'categories': [],
        'transactions': [],
        'total_budget': 0,
        'accounts': [
            {
                'id': int(datetime.now().timestamp() * 1000),
                'type': 'checking',
                'name': 'Family Checking',
                'balance': 185.50,  # Low balance to trigger WARNING
                'institution': 'Wells Fargo',
                'notes': 'Main household checking account',
                'created_at': (datetime.now() - timedelta(days=730)).isoformat(),
                'updated_at': datetime.now().isoformat()
            },
            {
                'id': int(datetime.now().timestamp() * 1000) + 1,
                'type': 'savings',
                'name': 'Emergency Fund',
                'balance': 3200.00,
                'institution': 'Ally Bank',
                'notes': 'Working towards 6 months expenses',
                'created_at': (datetime.now() - timedelta(days=365)).isoformat(),
                'updated_at': datetime.now().isoformat()
            },
            {
                'id': int(datetime.now().timestamp() * 1000) + 2,
                'type': 'savings',
                'name': 'Vacation Fund',
                'balance': 875.50,
                'institution': 'Ally Bank',
                'notes': 'Saving for summer vacation',
                'created_at': (datetime.now() - timedelta(days=180)).isoformat(),
                'updated_at': datetime.now().isoformat()
            },
            {
                'id': int(datetime.now().timestamp() * 1000) + 3,
                'type': 'credit',
                'name': 'Chase Freedom Card',
                'balance': 892.35,
                'institution': 'Chase',
                'notes': 'Everyday expenses, pay off monthly',
                'created_at': (datetime.now() - timedelta(days=900)).isoformat(),
                'updated_at': datetime.now().isoformat()
            },
            {
                'id': int(datetime.now().timestamp() * 1000) + 4,
                'type': 'checking',
                'name': 'Spouse Checking',
                'balance': 95.75,  # Very low balance to increase urgency
                'institution': 'Chase',
                'notes': 'Side income account',
                'created_at': (datetime.now() - timedelta(days=500)).isoformat(),
                'updated_at': datetime.now().isoformat()
            }
        ],
        'income_sources': [],
        'fixed_expenses': [
            {
                'id': 1,
                'name': 'Rent',
                'amount': 950,
                'frequency': 'monthly',
                'due_date': 1,
                'category': 'Housing',
                'auto_pay': True
            },
            {
                'id': 2,
                'name': 'Car Payment',
                'amount': 285,
                'frequency': 'monthly',
                'due_date': 8,  # Due in 2 days - UPCOMING
                'category': 'Transportation',
                'auto_pay': True
            },
            {
                'id': 3,
                'name': 'Car Insurance',
                'amount': 125,
                'frequency': 'monthly',
                'due_date': 10,  # Due in 4 days - UPCOMING
                'category': 'Insurance',
                'auto_pay': True
            },
            {
                'id': 4,
                'name': 'Electric Bill',
                'amount': 85,
                'frequency': 'monthly',
                'due_date': 9,  # Due in 3 days - UPCOMING
                'category': 'Utilities',
                'auto_pay': False
            },
            {
                'id': 5,
                'name': 'Internet',
                'amount': 60,
                'frequency': 'monthly',
                'due_date': 20,
                'category': 'Utilities',
                'auto_pay': True
            },
            {
                'id': 6,
                'name': 'Phone Plan',
                'amount': 75,
                'frequency': 'monthly',
                'due_date': 7,  # Due TOMORROW - URGENT!
                'category': 'Utilities',
                'auto_pay': True
            },
            {
                'id': 7,
                'name': 'Netflix',
                'amount': 15.99,
                'frequency': 'monthly',
                'due_date': 12,
                'category': 'Subscriptions',
                'auto_pay': True
            },
            {
                'id': 8,
                'name': 'Gym Membership',
                'amount': 30,
                'frequency': 'monthly',
                'due_date': 11,  # Due in 5 days - UPCOMING
                'category': 'Health',
                'auto_pay': True
            }
        ]
    }
    
    # Generate income sources with payments spanning 2023, 2024, and 2025
    income_sources = []
    
    # Primary Salary - steady growth (~$36k/year currently)
    # Family making ~$60k combined, so primary earner makes ~$36k
    primary_salary = {
        'id': 1,
        'name': 'Manufacturing Supervisor',
        'source_name': 'Primary Job',
        'type': 'salary',
        'amount': 3000,  # $36k/year
        'frequency': 'monthly',
        'earner_name': 'John Kuntz',
        'next_pay_date': '2025-12-15',
        'is_variable': False,
        'actual_payments': [],
        'federal_tax_percent': 12.0,
        'state_tax_percent': 5.0,
        'social_security_percent': 6.2,
        'medicare_percent': 1.45,
        'other_deductions': 150  # Health insurance, etc.
    }
    
    # Generate payments for 2023 (lower salary)
    for month in range(1, 13):
        date = f"2023-{month:02d}-15"
        amount = 2700 + random.randint(-30, 30)  # Base $2,700 in 2023 ($32.4k/year)
        primary_salary['actual_payments'].append({
            'date': date,
            'amount': amount,
            'note': f'Salary payment {month}/2023'
        })
    
    # Generate payments for 2024 (mid salary after raise)
    for month in range(1, 13):
        date = f"2024-{month:02d}-15"
        amount = 2850 + random.randint(-30, 30)  # Base $2,850 in 2024 ($34.2k/year)
        primary_salary['actual_payments'].append({
            'date': date,
            'amount': amount,
            'note': f'Salary payment {month}/2024'
        })
    
    # Generate payments for 2025 (current salary)
    for month in range(1, 13):
        date = f"2025-{month:02d}-15"
        amount = 3000 + random.randint(-30, 30)  # Base $3,000 in 2025 ($36k/year)
        primary_salary['actual_payments'].append({
            'date': date,
            'amount': amount,
            'note': f'Salary payment {month}/2025'
        })
    
    income_sources.append(primary_salary)
    
    # Secondary Salary (spouse) - part-time retail (~$24k/year)
    secondary_salary = {
        'id': 2,
        'name': 'Retail Cashier',
        'source_name': 'Part-time Job',
        'type': 'secondary-salary',
        'amount': 2000,  # ~$24k/year
        'frequency': 'bi-weekly',
        'earner_name': 'Sarah Kuntz',
        'next_pay_date': '2025-12-13',
        'is_variable': False,
        'actual_payments': [],
        'federal_tax_percent': 10.0,
        'state_tax_percent': 4.0,
        'social_security_percent': 6.2,
        'medicare_percent': 1.45,
        'other_deductions': 50  # Lower deductions for part-time
    }
    
    # Generate bi-weekly payments starting June 2023
    current_date = datetime(2023, 6, 1)
    end_date = datetime(2025, 12, 31)
    base_amount_2023 = 850   # ~$22k/year
    base_amount_2024 = 925   # ~$24k/year  
    base_amount_2025 = 1000  # ~$26k/year
    
    while current_date <= end_date:
        if current_date.year == 2023:
            amount = base_amount_2023 + random.randint(-30, 30)
        elif current_date.year == 2024:
            amount = base_amount_2024 + random.randint(-30, 30)
        else:
            amount = base_amount_2025 + random.randint(-30, 30)
        
        secondary_salary['actual_payments'].append({
            'date': current_date.strftime('%Y-%m-%d'),
            'amount': amount,
            'note': f'Bi-weekly paycheck'
        })
        current_date += timedelta(days=14)
    
    income_sources.append(secondary_salary)
    
    # Freelance income - variable, growing over time
    freelance = {
        'id': 3,
        'name': 'Freelance Web Development',
        'source_name': 'Side Projects',
        'type': 'freelance',
        'amount': 1200,
        'frequency': 'monthly',
        'earner_name': 'John Kuntz',
        'is_variable': True,
        'actual_payments': [],
        'federal_tax_percent': 0,
        'state_tax_percent': 0,
        'social_security_percent': 0,
        'medicare_percent': 0,
        'other_deductions': 0
    }
    
    # 2023 - sporadic freelance
    freelance_2023_months = [2, 4, 5, 7, 9, 11]
    for month in freelance_2023_months:
        amount = random.randint(500, 1000)
        day = random.randint(1, 28)
        freelance['actual_payments'].append({
            'date': f"2023-{month:02d}-{day:02d}",
            'amount': amount,
            'note': 'Freelance project payment'
        })
    
    # 2024 - more consistent freelance
    freelance_2024_months = [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12]
    for month in freelance_2024_months:
        amount = random.randint(800, 1500)
        day = random.randint(1, 28)
        freelance['actual_payments'].append({
            'date': f"2024-{month:02d}-{day:02d}",
            'amount': amount,
            'note': 'Freelance project payment'
        })
    
    # 2025 - even more consistent, higher rates
    for month in range(1, 13):
        amount = random.randint(1000, 2000)
        day = random.randint(1, 28)
        freelance['actual_payments'].append({
            'date': f"2025-{month:02d}-{day:02d}",
            'amount': amount,
            'note': 'Freelance project payment'
        })
    
    income_sources.append(freelance)
    
    # Investment income - started in 2024
    investment = {
        'id': 4,
        'name': 'Dividend Income',
        'source_name': 'Investment Portfolio',
        'type': 'investment',
        'amount': 150,
        'frequency': 'monthly',
        'earner_name': 'Joint',
        'is_variable': True,
        'actual_payments': [],
        'federal_tax_percent': 0,
        'state_tax_percent': 0,
        'social_security_percent': 0,
        'medicare_percent': 0,
        'other_deductions': 0
    }
    
    # Quarterly payments in 2024
    quarters_2024 = [(3, 15), (6, 15), (9, 15), (12, 15)]
    for month, day in quarters_2024:
        amount = random.randint(120, 180)
        investment['actual_payments'].append({
            'date': f"2024-{month:02d}-{day:02d}",
            'amount': amount,
            'note': 'Quarterly dividend'
        })
    
    # Quarterly payments in 2025
    quarters_2025 = [(3, 15), (6, 15), (9, 15), (12, 15)]
    for month, day in quarters_2025:
        amount = random.randint(140, 200)
        investment['actual_payments'].append({
            'date': f"2025-{month:02d}-{day:02d}",
            'amount': amount,
            'note': 'Quarterly dividend'
        })
    
    income_sources.append(investment)
    
    budget_data['income_sources'] = income_sources
    
    # Generate realistic transactions for November and December 2025
    # This will help test the month comparison feature
    transactions = []
    transaction_id = 1
    
    # Realistic spending categories for a family making ~$60k/year
    # Available spending after fixed expenses: ~$4,000-$4,500/month
    # Groceries: $600-800/month, Gas: $200-250/month, Dining: $150-250/month, etc.
    
    # November 2025 transactions (for comparison)
    november_transactions = [
        # Week 1 (Nov 1-7)
        {'date': '2025-11-01T09:00:00', 'merchant': 'Walmart', 'description': 'Grocery shopping', 'amount': 135.20, 'category': 'Groceries', 'payment_method': 'debit'},
        {'date': '2025-11-01T15:30:00', 'merchant': 'Shell', 'description': 'Gas fill-up', 'amount': 45.00, 'category': 'Gas/Transportation', 'payment_method': 'credit'},
        {'date': '2025-11-02T12:00:00', 'merchant': 'Subway', 'description': 'Lunch', 'amount': 18.50, 'category': 'Dining Out', 'payment_method': 'debit'},
        {'date': '2025-11-03T10:30:00', 'merchant': 'Target', 'description': 'Household items', 'amount': 52.75, 'category': 'Household', 'payment_method': 'credit'},
        {'date': '2025-11-03T18:00:00', 'merchant': 'Pizza Hut', 'description': 'Family dinner', 'amount': 38.90, 'category': 'Dining Out', 'payment_method': 'credit'},
        {'date': '2025-11-04T11:15:00', 'merchant': 'CVS', 'description': 'Medicine', 'amount': 22.00, 'category': 'Healthcare', 'payment_method': 'debit'},
        {'date': '2025-11-05T14:45:00', 'merchant': 'Aldi', 'description': 'Weekly groceries', 'amount': 88.40, 'category': 'Groceries', 'payment_method': 'debit'},
        {'date': '2025-11-06T16:20:00', 'merchant': 'Kwik Trip', 'description': 'Gas', 'amount': 40.25, 'category': 'Gas/Transportation', 'payment_method': 'credit'},
        {'date': '2025-11-07T19:30:00', 'merchant': 'Chipotle', 'description': 'Dinner', 'amount': 32.60, 'category': 'Dining Out', 'payment_method': 'debit'},
        
        # Week 2 (Nov 8-14)
        {'date': '2025-11-08T09:30:00', 'merchant': 'Walmart', 'description': 'Groceries', 'amount': 118.65, 'category': 'Groceries', 'payment_method': 'debit'},
        {'date': '2025-11-09T13:00:00', 'merchant': 'Amazon', 'description': 'Online shopping', 'amount': 54.99, 'category': 'Shopping', 'payment_method': 'credit'},
        {'date': '2025-11-10T10:00:00', 'merchant': 'Shell', 'description': 'Gas', 'amount': 43.50, 'category': 'Gas/Transportation', 'payment_method': 'credit'},
        {'date': '2025-11-11T12:30:00', 'merchant': 'Olive Garden', 'description': 'Lunch date', 'amount': 48.75, 'category': 'Dining Out', 'payment_method': 'credit'},
        {'date': '2025-11-12T11:00:00', 'merchant': 'Target', 'description': 'Clothing', 'amount': 72.30, 'category': 'Clothing', 'payment_method': 'credit'},
        {'date': '2025-11-13T15:30:00', 'merchant': 'PetSmart', 'description': 'Pet supplies', 'amount': 38.50, 'category': 'Pet Care', 'payment_method': 'debit'},
        {'date': '2025-11-14T09:45:00', 'merchant': 'Aldi', 'description': 'Groceries', 'amount': 92.15, 'category': 'Groceries', 'payment_method': 'debit'},
        
        # Week 3 (Nov 15-21)
        {'date': '2025-11-15T10:30:00', 'merchant': 'Walmart', 'description': 'Weekly shopping', 'amount': 145.80, 'category': 'Groceries', 'payment_method': 'debit'},
        {'date': '2025-11-16T14:00:00', 'merchant': 'Shell', 'description': 'Gas', 'amount': 41.75, 'category': 'Gas/Transportation', 'payment_method': 'credit'},
        {'date': '2025-11-17T18:30:00', 'merchant': 'Applebees', 'description': 'Dinner out', 'amount': 58.90, 'category': 'Dining Out', 'payment_method': 'credit'},
        {'date': '2025-11-18T11:15:00', 'merchant': 'Walgreens', 'description': 'Pharmacy', 'amount': 16.25, 'category': 'Healthcare', 'payment_method': 'debit'},
        {'date': '2025-11-19T13:45:00', 'merchant': 'Target', 'description': 'Home goods', 'amount': 67.40, 'category': 'Household', 'payment_method': 'credit'},
        {'date': '2025-11-20T09:00:00', 'merchant': 'Aldi', 'description': 'Groceries', 'amount': 85.60, 'category': 'Groceries', 'payment_method': 'debit'},
        {'date': '2025-11-21T16:00:00', 'merchant': 'Kwik Trip', 'description': 'Gas', 'amount': 38.90, 'category': 'Gas/Transportation', 'payment_method': 'credit'},
        
        # Week 4 (Nov 22-30)
        {'date': '2025-11-22T10:00:00', 'merchant': 'Walmart', 'description': 'Groceries', 'amount': 128.50, 'category': 'Groceries', 'payment_method': 'debit'},
        {'date': '2025-11-23T12:30:00', 'merchant': 'Starbucks', 'description': 'Coffee', 'amount': 8.75, 'category': 'Dining Out', 'payment_method': 'debit'},
        {'date': '2025-11-24T15:00:00', 'merchant': 'CVS', 'description': 'Personal care', 'amount': 24.90, 'category': 'Personal Care', 'payment_method': 'debit'},
        {'date': '2025-11-25T11:30:00', 'merchant': 'McDonalds', 'description': 'Quick lunch', 'amount': 15.40, 'category': 'Dining Out', 'payment_method': 'debit'},
        {'date': '2025-11-26T14:15:00', 'merchant': 'Shell', 'description': 'Gas', 'amount': 44.25, 'category': 'Gas/Transportation', 'payment_method': 'credit'},
        {'date': '2025-11-27T09:45:00', 'merchant': 'Aldi', 'description': 'Thanksgiving groceries', 'amount': 156.80, 'category': 'Groceries', 'payment_method': 'debit'},
        {'date': '2025-11-28T16:30:00', 'merchant': 'Amazon', 'description': 'Black Friday deal', 'amount': 89.99, 'category': 'Shopping', 'payment_method': 'credit'},
        {'date': '2025-11-29T10:30:00', 'merchant': 'Target', 'description': 'Black Friday shopping', 'amount': 112.50, 'category': 'Shopping', 'payment_method': 'credit'},
        {'date': '2025-11-30T13:00:00', 'merchant': 'Panera', 'description': 'Lunch', 'amount': 22.75, 'category': 'Dining Out', 'payment_method': 'debit'},
    ]
    
    # December 2025 transactions (current month)
    december_transactions = [
        # Week 1 (Dec 1-7)
        {'date': '2025-12-01T08:30:00', 'merchant': 'Walmart', 'description': 'Grocery shopping', 'amount': 127.45, 'category': 'Groceries', 'payment_method': 'debit'},
        {'date': '2025-12-01T14:20:00', 'merchant': 'Shell', 'description': 'Gas fill-up', 'amount': 42.00, 'category': 'Gas/Transportation', 'payment_method': 'credit'},
        {'date': '2025-12-02T12:15:00', 'merchant': 'Elementary School', 'description': 'School lunch account', 'amount': 35.00, 'category': 'Childcare/Education', 'payment_method': 'debit'},
        {'date': '2025-12-02T18:45:00', 'merchant': 'Olive Garden', 'description': 'Family dinner', 'amount': 58.75, 'category': 'Dining Out', 'payment_method': 'credit'},
        {'date': '2025-12-03T09:00:00', 'merchant': 'Starbucks', 'description': 'Coffee', 'amount': 6.25, 'category': 'Dining Out', 'payment_method': 'debit'},
        {'date': '2025-12-03T16:30:00', 'merchant': 'Target', 'description': 'Household items', 'amount': 45.80, 'category': 'Household', 'payment_method': 'debit'},
        {'date': '2025-12-04T10:45:00', 'merchant': 'Dollar General', 'description': 'Cleaning supplies', 'amount': 28.30, 'category': 'Household', 'payment_method': 'debit'},
        {'date': '2025-12-04T19:00:00', 'merchant': 'Pizza Hut', 'description': 'Pizza night', 'amount': 32.50, 'category': 'Dining Out', 'payment_method': 'credit'},
        {'date': '2025-12-05T11:20:00', 'merchant': 'CVS', 'description': 'Prescriptions', 'amount': 15.00, 'category': 'Healthcare', 'payment_method': 'debit'},
        {'date': '2025-12-05T16:00:00', 'merchant': 'Shell', 'description': 'Gas', 'amount': 38.50, 'category': 'Gas/Transportation', 'payment_method': 'credit'},
        {'date': '2025-12-06T13:30:00', 'merchant': 'Aldi', 'description': 'Weekly groceries', 'amount': 95.20, 'category': 'Groceries', 'payment_method': 'debit'},
        
        # Week 2 (Dec 8-14) - A bit more spending
        {'date': '2025-12-08T09:30:00', 'merchant': 'Walmart', 'description': 'Groceries', 'amount': 142.35, 'category': 'Groceries', 'payment_method': 'debit'},
        {'date': '2025-12-08T14:00:00', 'merchant': 'Amazon', 'description': 'Kids toys', 'amount': 67.99, 'category': 'Shopping', 'payment_method': 'credit'},
        {'date': '2025-12-09T10:15:00', 'merchant': 'Shell', 'description': 'Gas', 'amount': 41.00, 'category': 'Gas/Transportation', 'payment_method': 'credit'},
        {'date': '2025-12-09T19:30:00', 'merchant': 'Chipotle', 'description': 'Quick dinner', 'amount': 28.45, 'category': 'Dining Out', 'payment_method': 'debit'},
        {'date': '2025-12-10T11:00:00', 'merchant': 'Walgreens', 'description': 'Household items', 'amount': 22.75, 'category': 'Household', 'payment_method': 'debit'},
        {'date': '2025-12-10T17:45:00', 'merchant': 'McDonalds', 'description': 'Kids dinner', 'amount': 18.60, 'category': 'Dining Out', 'payment_method': 'credit'},
        {'date': '2025-12-11T12:30:00', 'merchant': 'Target', 'description': 'Clothing', 'amount': 85.40, 'category': 'Clothing', 'payment_method': 'credit'},
        {'date': '2025-12-11T15:00:00', 'merchant': 'PetSmart', 'description': 'Dog food', 'amount': 42.00, 'category': 'Pet Care', 'payment_method': 'debit'},
        {'date': '2025-12-12T10:00:00', 'merchant': 'Kwik Trip', 'description': 'Gas and snacks', 'amount': 52.30, 'category': 'Gas/Transportation', 'payment_method': 'credit'},
        {'date': '2025-12-12T18:00:00', 'merchant': 'Buffalo Wild Wings', 'description': 'Date night', 'amount': 72.50, 'category': 'Dining Out', 'payment_method': 'credit'},
        {'date': '2025-12-13T09:45:00', 'merchant': 'Aldi', 'description': 'Groceries', 'amount': 78.90, 'category': 'Groceries', 'payment_method': 'debit'},
        {'date': '2025-12-14T11:30:00', 'merchant': 'Starbucks', 'description': 'Coffee', 'amount': 7.50, 'category': 'Dining Out', 'payment_method': 'debit'},
        {'date': '2025-12-14T16:20:00', 'merchant': 'Auto Zone', 'description': 'Car maintenance', 'amount': 38.75, 'category': 'Gas/Transportation', 'payment_method': 'credit'},
        
        # Week 3 (Dec 15-21) - Holiday shopping starting
        {'date': '2025-12-15T10:00:00', 'merchant': 'Walmart', 'description': 'Weekly shopping', 'amount': 156.80, 'category': 'Groceries', 'payment_method': 'debit'},
        {'date': '2025-12-15T14:30:00', 'merchant': 'Amazon', 'description': 'Holiday gifts', 'amount': 125.99, 'category': 'Gifts', 'payment_method': 'credit'},
        {'date': '2025-12-16T09:00:00', 'merchant': 'Shell', 'description': 'Gas', 'amount': 44.00, 'category': 'Gas/Transportation', 'payment_method': 'credit'},
        {'date': '2025-12-16T19:00:00', 'merchant': 'Papa Johns', 'description': 'Pizza', 'amount': 29.99, 'category': 'Dining Out', 'payment_method': 'debit'},
        {'date': '2025-12-17T11:15:00', 'merchant': 'Target', 'description': 'Holiday decor', 'amount': 92.30, 'category': 'Shopping', 'payment_method': 'credit'},
        {'date': '2025-12-17T15:45:00', 'merchant': 'CVS', 'description': 'Pharmacy', 'amount': 18.50, 'category': 'Healthcare', 'payment_method': 'debit'},
        {'date': '2025-12-18T10:30:00', 'merchant': 'Kohls', 'description': 'Gifts', 'amount': 145.75, 'category': 'Gifts', 'payment_method': 'credit'},
        {'date': '2025-12-18T18:00:00', 'merchant': 'Applebees', 'description': 'Dinner out', 'amount': 64.25, 'category': 'Dining Out', 'payment_method': 'credit'},
        {'date': '2025-12-19T09:15:00', 'merchant': 'Kwik Trip', 'description': 'Gas', 'amount': 39.75, 'category': 'Gas/Transportation', 'payment_method': 'credit'},
        {'date': '2025-12-19T14:00:00', 'merchant': 'Walgreens', 'description': 'Wrapping paper', 'amount': 24.50, 'category': 'Shopping', 'payment_method': 'debit'},
        {'date': '2025-12-20T10:00:00', 'merchant': 'Aldi', 'description': 'Groceries', 'amount': 88.40, 'category': 'Groceries', 'payment_method': 'debit'},
        {'date': '2025-12-20T16:30:00', 'merchant': 'Best Buy', 'description': 'Electronics gift', 'amount': 189.99, 'category': 'Gifts', 'payment_method': 'credit'},
        {'date': '2025-12-21T12:00:00', 'merchant': 'Panera', 'description': 'Lunch', 'amount': 26.80, 'category': 'Dining Out', 'payment_method': 'debit'},
    ]
    
    # Combine November and December transactions
    all_transactions = november_transactions + december_transactions
    
    for tx_data in all_transactions:
        transactions.append({
            'id': transaction_id,
            'date': tx_data['date'],
            'description': tx_data['description'],
            'merchant': tx_data['merchant'],
            'amount': tx_data['amount'],
            'category': tx_data['category'],
            'payment_method': tx_data['payment_method']
        })
        transaction_id += 1
    
    budget_data['transactions'] = transactions
    
    # Generate retirement accounts with contributions
    retirement_accounts = []
    
    # 401(k) Account
    retirement_401k = {
        'id': 1,
        'account_name': 'Tech Company 401(k)',
        'account_type': '401k',
        'contribution_type': 'pre_tax',
        'annual_limit': 23500,
        'current_balance': 45000.00,
        'employer_match_percent': 100,
        'employer_match_limit': 6,
        'linked_income_id': 1,
        'contribution_per_paycheck': 500,
        'notes': 'Company matches 100% up to 6% of salary',
        'contributions': [],
        'created_at': '2023-01-01T00:00:00'
    }
    
    # Generate contributions for 401(k) for 2024 and 2025
    for year in [2024, 2025]:
        for month in range(1, 13 if year == 2024 else 12):  # 2025 only up to November
            # Employee contribution
            date = f"{year}-{month:02d}-15"
            amount = 500.00
            retirement_401k['contributions'].append({
                'id': len(retirement_401k['contributions']) + 1,
                'date': date,
                'amount': amount,
                'contribution_type': 'employee',
                'note': f'Paycheck contribution {month}/{year}',
                'created_at': f'{year}-{month:02d}-15T12:00:00'
            })
            
            # Employer match (assuming 6% of $5000 salary = $300)
            employer_match = 300.00
            retirement_401k['contributions'].append({
                'id': len(retirement_401k['contributions']) + 1,
                'date': date,
                'amount': employer_match,
                'contribution_type': 'employer_match',
                'note': f'Employer match {month}/{year}',
                'created_at': f'{year}-{month:02d}-15T12:00:00'
            })
    
    retirement_accounts.append(retirement_401k)
    
    # Roth IRA Account
    retirement_roth = {
        'id': 2,
        'account_name': 'Vanguard Roth IRA',
        'account_type': 'roth_ira',
        'contribution_type': 'post_tax',
        'annual_limit': 7000,
        'current_balance': 12500.00,
        'employer_match_percent': 0,
        'employer_match_limit': 0,
        'linked_income_id': None,
        'contribution_per_paycheck': 0,
        'notes': 'Personal retirement savings',
        'contributions': [],
        'created_at': '2023-06-01T00:00:00'
    }
    
    # Generate quarterly contributions for Roth IRA
    for year in [2024, 2025]:
        for quarter in [3, 6, 9, 12]:
            if year == 2025 and quarter == 12:
                continue  # Skip December 2025
            date = f"{year}-{quarter:02d}-01"
            amount = 500.00 + random.randint(-50, 50)
            retirement_roth['contributions'].append({
                'id': len(retirement_roth['contributions']) + 1,
                'date': date,
                'amount': amount,
                'contribution_type': 'employee',
                'note': f'Quarterly contribution Q{quarter//3}/{year}',
                'created_at': f'{year}-{quarter:02d}-01T12:00:00'
            })
    
    retirement_accounts.append(retirement_roth)
    
    budget_data['retirement_accounts'] = retirement_accounts
    
    # Save to file
    with open(DATA_FILE, 'w') as f:
        json.dump(budget_data, f, indent=2)
    
    print(f"✅ Test data generated successfully!")
    print(f"📁 Saved to: {DATA_FILE}")
    print(f"\n📊 Summary:")
    print(f"   - Income sources: {len(income_sources)}")
    print(f"   - Retirement accounts: {len(retirement_accounts)}")
    print(f"   - Fixed expenses: {len(budget_data['fixed_expenses'])}")
    print(f"   - Transactions (December 2025): {len(budget_data['transactions'])}")
    print(f"   - Years covered: 2023, 2024, 2025")
    
    # Calculate totals by year
    totals = {2023: 0, 2024: 0, 2025: 0}
    for source in income_sources:
        for payment in source['actual_payments']:
            year = int(payment['date'][:4])
            totals[year] += payment['amount']
    
    print(f"\n💰 Income by Year:")
    print(f"   - 2023: ${totals[2023]:,.2f}")
    print(f"   - 2024: ${totals[2024]:,.2f}")
    print(f"   - 2025: ${totals[2025]:,.2f}")
    print(f"   - Growth 2023→2024: {((totals[2024] - totals[2023]) / totals[2023] * 100):.1f}%")
    print(f"   - Growth 2024→2025: {((totals[2025] - totals[2024]) / totals[2024] * 100):.1f}%")
    
    # Calculate retirement contributions
    retirement_total = 0
    for account in retirement_accounts:
        for contrib in account['contributions']:
            retirement_total += contrib['amount']
    
    print(f"\n🏦 Retirement Contributions:")
    print(f"   - Total contributed: ${retirement_total:,.2f}")
    print(f"   - Total balance: ${sum(acc['current_balance'] for acc in retirement_accounts):,.2f}")
    
    # Calculate spending by month
    november_spending = sum(tx['amount'] for tx in budget_data['transactions'] if '2025-11-' in tx['date'])
    december_spending = sum(tx['amount'] for tx in budget_data['transactions'] if '2025-12-' in tx['date'])
    
    print(f"\n💳 November 2025 Spending:")
    print(f"   - Total spent: ${november_spending:,.2f}")
    print(f"   - Number of transactions: {sum(1 for tx in budget_data['transactions'] if '2025-11-' in tx['date'])}")
    
    print(f"\n💳 December 2025 Spending (so far):")
    print(f"   - Total spent: ${december_spending:,.2f}")
    print(f"   - Number of transactions: {sum(1 for tx in budget_data['transactions'] if '2025-12-' in tx['date'])}")
    print(f"   - Average per transaction: ${december_spending / sum(1 for tx in budget_data['transactions'] if '2025-12-' in tx['date']) if december_spending > 0 else 0:.2f}")
    
    # Calculate month-over-month change
    if november_spending > 0:
        spending_change = december_spending - november_spending
        spending_percent = (spending_change / november_spending) * 100
        print(f"\n📊 Month-over-Month Comparison:")
        print(f"   - Spending change: ${spending_change:,.2f} ({spending_percent:+.1f}%)")
        if spending_change < 0:
            print(f"   - ✅ Great! Spending decreased from last month")
        elif spending_change > 0:
            print(f"   - ⚠️  Spending increased from last month")
    
    # Calculate spending by category (December only)
    category_totals = {}
    for tx in budget_data['transactions']:
        if '2025-12-' in tx['date']:
            cat = tx['category']
            category_totals[cat] = category_totals.get(cat, 0) + tx['amount']
    
    print(f"\n📊 December Spending by Category:")
    for cat, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
        print(f"   - {cat}: ${amount:,.2f}")

if __name__ == '__main__':
    print("🔧 Generating test data for Budget App...\n")
    generate_test_data()
