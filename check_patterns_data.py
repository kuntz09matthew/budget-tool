"""Check if we have sufficient data for spending pattern alerts"""
import json
from collections import defaultdict

with open('server/budget_data.json', 'r') as f:
    data = json.load(f)

# Analyze transaction data
category_history = defaultdict(lambda: defaultdict(list))
december_spending = defaultdict(float)

for tx in data['transactions']:
    if tx['amount'] <= 0:
        continue
    
    date = tx['date'][:7]  # YYYY-MM
    category = tx['category']
    amount = tx['amount']
    
    if date == '2025-12':
        december_spending[category] += amount
    else:
        category_history[category][date].append(amount)

print("="*70)
print("SPENDING PATTERN DATA ANALYSIS")
print("="*70)
print(f"\nTotal categories: {len(category_history)}")
print(f"Categories with 2+ months of history: {len([c for c in category_history.values() if len(c) >= 2])}")

print("\n" + "="*70)
print("CATEGORIES WITH SUFFICIENT DATA (2+ months):")
print("="*70)

sufficient_data = []
for category, months in sorted(category_history.items()):
    if len(months) >= 2:
        monthly_totals = [sum(amounts) for amounts in months.values()]
        avg = sum(monthly_totals) / len(monthly_totals)
        december_total = december_spending.get(category, 0)
        
        print(f"\n📊 {category}:")
        print(f"   Months of data: {len(months)}")
        print(f"   Historical months: {', '.join(sorted(months.keys()))}")
        print(f"   Monthly totals: {[f'${t:.2f}' for t in monthly_totals]}")
        print(f"   Average/month: ${avg:.2f}")
        print(f"   December so far: ${december_total:.2f}")
        
        if december_total > 0:
            variance = ((december_total - avg) / avg * 100) if avg > 0 else 0
            print(f"   Variance: {variance:+.1f}%")
            if abs(variance) > 30:
                print(f"   ⚠️  Should trigger alert!")
        
        sufficient_data.append(category)

print(f"\n" + "="*70)
print(f"SUMMARY: {len(sufficient_data)} categories have sufficient data for pattern detection")
print("="*70)

if len(sufficient_data) >= 3:
    print("✅ SUFFICIENT DATA for spending pattern alerts!")
else:
    print("❌ INSUFFICIENT DATA - need at least 3 categories with 2+ months of history")
