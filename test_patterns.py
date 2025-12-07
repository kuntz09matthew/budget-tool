"""Test the spending patterns API endpoint"""
import requests
import json

try:
    r = requests.get('http://localhost:5000/api/dashboard/spending-patterns')
    data = r.json()
    
    print("✅ API Response Received\n")
    print(f"Success: {data.get('success')}")
    print(f"Has sufficient data: {data.get('has_sufficient_data')}")
    print(f"Total categories: {data.get('total_categories')}")
    print(f"Months analyzed: {data.get('months_analyzed')}")
    print(f"Current week: {data.get('current_week')}")
    print(f"Current day: {data.get('current_day')}\n")
    
    alerts = data.get('alerts', [])
    insights = data.get('insights', [])
    patterns = data.get('patterns', [])
    
    print(f"📊 Spending Pattern Alerts: {len(alerts)}")
    for alert in alerts:
        print(f"\n  {alert['icon']} {alert['category']} - {alert['severity'].upper()}")
        print(f"     Message: {alert['message']}")
        print(f"     Detail: {alert['detail']}")
        print(f"     Current: ${alert['current_amount']:.2f} vs Typical: ${alert['typical_amount']:.2f}")
        print(f"     Variance: {alert['variance_percent']:.1f}%")
    
    print(f"\n✨ Positive Insights: {len([i for i in insights if i['type'] == 'positive'])}")
    for insight in insights:
        if insight['type'] == 'positive':
            print(f"  {insight['icon']} {insight['category']}: {insight['message']}")
    
    print(f"\n📈 Top 5 Categories by Variance:")
    for pattern in patterns[:5]:
        variance_sign = '+' if pattern['variance'] > 0 else ''
        status_icon = '📈' if pattern['status'] == 'high' else '📉' if pattern['status'] == 'low' else '➡️'
        print(f"  {status_icon} {pattern['category']}: {variance_sign}{pattern['variance']:.1f}% variance")
        print(f"     Current MTD: ${pattern['current_mtd']:.2f}, Projected: ${pattern['projected']:.2f}, Typical: ${pattern['historical_avg']:.2f}")
    
    print(f"\n💡 Recommendations:")
    for rec in data.get('recommendations', []):
        print(f"  - {rec}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
