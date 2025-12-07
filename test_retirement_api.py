"""
Quick test script to check retirement accounts data
"""
import json
import os

# Load the budget data file
data_file = os.path.join(os.path.dirname(__file__), 'server', 'budget_data.json')

with open(data_file, 'r') as f:
    budget_data = json.load(f)

# Check if retirement_accounts exists
if 'retirement_accounts' in budget_data:
    accounts = budget_data['retirement_accounts']
    print(f"✅ Found {len(accounts)} retirement accounts in budget_data.json\n")
    
    for account in accounts:
        print(f"Account: {account.get('account_name')}")
        print(f"  Type: {account.get('account_type')}")
        print(f"  Balance: ${account.get('current_balance', 0):,.2f}")
        print(f"  Contributions: {len(account.get('contributions', []))}")
        print()
else:
    print("❌ No retirement_accounts key found in budget_data.json")
