"""Direct test of spending patterns API"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'server'))

# Set up Flask app
os.environ['FLASK_ENV'] = 'development'
from app import app, budget_data

# Test the endpoint
with app.test_client() as client:
    response = client.get('/api/dashboard/spending-patterns')
    data = response.get_json()
    
    print("="*70)
    print("API RESPONSE TEST")
    print("="*70)
    print(f"Success: {data.get('success')}")
    print(f"Has sufficient data: {data.get('has_sufficient_data')}")
    print(f"Total categories: {data.get('total_categories')}")
    print(f"Months analyzed: {data.get('months_analyzed')}")
    print(f"Number of alerts: {len(data.get('alerts', []))}")
    print(f"Number of patterns: {len(data.get('patterns', []))}")
    print(f"Number of insights: {len(data.get('insights', []))}")
    
    print("\n" + "="*70)
    print("ALERTS:")
    print("="*70)
    for alert in data.get('alerts', []):
        print(f"\n{alert['icon']} {alert['category']} - {alert['severity'].upper()}")
        print(f"  {alert['message']}")
        print(f"  Variance: {alert.get('variance_percent', 0):.1f}%")
    
    if not data.get('alerts'):
        print("No alerts generated!")
    
    print("\n" + "="*70)
    print("PATTERNS (Top 5):")
    print("="*70)
    for pattern in data.get('patterns', [])[:5]:
        print(f"\n{pattern['icon']} {pattern['category']}")
        print(f"  Historical avg: ${pattern['historical_avg']:.2f}")
        print(f"  Current MTD: ${pattern['current_mtd']:.2f}")
        print(f"  Projected: ${pattern['projected']:.2f}")
        print(f"  Variance: {pattern['variance']:+.1f}%")
        print(f"  Status: {pattern['status']}")
