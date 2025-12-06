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
                'balance': 1450.75,
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
                'balance': 625.40,
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
                'due_date': 10,
                'category': 'Transportation',
                'auto_pay': True
            },
            {
                'id': 3,
                'name': 'Car Insurance',
                'amount': 125,
                'frequency': 'monthly',
                'due_date': 5,
                'category': 'Insurance',
                'auto_pay': True
            },
            {
                'id': 4,
                'name': 'Electric Bill',
                'amount': 85,
                'frequency': 'monthly',
                'due_date': 15,
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
                'due_date': 8,
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
                'due_date': 3,
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

if __name__ == '__main__':
    print("🔧 Generating test data for Budget App...\n")
    generate_test_data()
