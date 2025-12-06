# Testing: Available Spending Money Calculator & Month-to-Date Summary

## Feature Overview
This document describes how to test the newly implemented features:
1. **Available Spending Money Calculator** (Dashboard Phase 1, Item 4)
2. **Month-to-Date Spending Summary** (Dashboard Phase 1, Item 5)

## Test Prerequisites
1. Start the application (either via `npm start` or directly via Electron)
2. The Flask backend should be running on http://localhost:5000

## Test Plan

### Test 1: Available Spending - No Data (Empty State)
**Expected Result:** Available shows $0.00

1. Open the app with no income or expenses configured
2. Check the dashboard
3. **Verify:** "Available to Spend" card shows $0.00
4. **Verify:** Label shows "After expenses & savings"

---

### Test 2: Available Spending - Only Income
**Expected Result:** Available equals total income (Success/Green)

1. Add an income source:
   - Name: "Primary Salary"
   - Amount: $5,000
   - Frequency: Monthly
2. Return to Dashboard
3. **Verify:** "Total Monthly Income" shows $5,000.00
4. **Verify:** "Fixed Expenses" shows $0.00
5. **Verify:** "Available to Spend" shows $5,000.00
6. **Verify:** Card has green color (success status)
7. **Verify:** Label shows "Healthy budget"

---

### Test 3: Available Spending - Income with Expenses (Healthy Budget)
**Expected Result:** Available = Income - Expenses (Success/Green)

1. Keep the $5,000 income from Test 2
2. Add fixed expenses:
   - Rent: $1,500
   - Car Payment: $400
   - Insurance: $200
   - Utilities: $150
   - Internet: $80
   - Total: $2,330
3. Return to Dashboard
4. **Verify:** "Fixed Expenses" shows $2,330.00
5. **Verify:** "Available to Spend" shows $2,670.00 ($5,000 - $2,330)
6. **Verify:** Card has green color (success status)
7. **Verify:** Label shows "Healthy budget"

---

### Test 4: Available Spending - Low Available Funds (Warning)
**Expected Result:** Available between $0-$500 shows yellow warning

1. Modify expenses to increase them:
   - Add "Student Loan": $500
   - Add "Phone Bill": $100
   - Add "Subscriptions": $1,600
   - New Total Expenses: $4,530
2. Return to Dashboard
3. **Verify:** "Available to Spend" shows $470.00 ($5,000 - $4,530)
4. **Verify:** Card has yellow/orange color (warning status)
5. **Verify:** Label shows "Caution: Low available funds"

---

### Test 5: Available Spending - Expenses Exceed Income (Danger)
**Expected Result:** Negative available shows red danger status with pulsing animation

1. Add more expenses:
   - Add "Credit Card Payment": $1,000
   - New Total Expenses: $5,530
2. Return to Dashboard
3. **Verify:** "Available to Spend" shows -$530.00 (negative amount)
4. **Verify:** Card has red color (danger status)
5. **Verify:** Card has pulsing animation
6. **Verify:** Label shows "Warning: Expenses exceed income!"

---

### Test 6: Month-to-Date Spending - No Transactions
**Expected Result:** All MTD fields show zero

1. With no transactions added
2. Check Dashboard → "Month-to-Date Spending" section
3. **Verify:** "Total Spent" shows $0.00
4. **Verify:** "Transactions" shows 0
5. **Verify:** "Average/Day" shows $0.00
6. **Verify:** Date range shows current month (e.g., "December 1 - 6, 2025")

---

### Test 7: Month-to-Date Spending - With Transactions
**Expected Result:** MTD metrics calculated correctly

**Note:** Currently requires backend transaction support. Manual test would be:

1. Add sample transactions for the current month:
   - Dec 1: Groceries $150
   - Dec 3: Gas $45
   - Dec 5: Restaurant $30
   - Total: $225
2. Return to Dashboard
3. **Verify:** "Total Spent" shows $225.00
4. **Verify:** "Transactions" shows 3
5. **Verify:** "Average/Day" shows approximately $37.50 (if testing on Dec 6)
6. **Verify:** Date range shows "December 1 - 6, 2025"

---

### Test 8: Real-Time Updates
**Expected Result:** Available spending updates automatically when data changes

1. Start with income and some expenses
2. Note the "Available to Spend" amount
3. Add a new expense
4. Return to Dashboard
5. **Verify:** "Available to Spend" recalculates immediately
6. **Verify:** Color status updates if threshold crossed
7. Edit an income source (change amount)
8. Return to Dashboard
9. **Verify:** "Available to Spend" reflects new income

---

### Test 9: Multiple Income Sources
**Expected Result:** All income frequencies properly converted to monthly

1. Add multiple income sources:
   - Primary Salary: $5,000/month
   - Freelance: $500/week
   - Side Job: $1,000/bi-weekly
   - Bonus: $12,000/annual
2. Expected monthly total: $5,000 + ($500 × 52/12) + ($1,000 × 26/12) + ($12,000/12)
   = $5,000 + $2,166.67 + $2,166.67 + $1,000 = $10,333.34
3. Add expenses: $3,000
4. **Verify:** "Available to Spend" shows $7,333.34
5. **Verify:** Status is success (green)

---

### Test 10: API Endpoint Testing
**Expected Result:** Backend endpoint returns correct JSON

1. Open browser or use curl/Postman
2. GET http://localhost:5000/api/dashboard/available-spending
3. **Verify:** Response contains:
   ```json
   {
     "total_income": 5000.00,
     "total_expenses": 2330.00,
     "available": 2670.00,
     "status": "success",
     "message": "Healthy budget"
   }
   ```
4. **Verify:** Status changes to "warning" when available < $500
5. **Verify:** Status changes to "danger" when available < $0

---

## Edge Cases to Test

### Edge Case 1: Very Large Numbers
- Income: $100,000/month
- Expenses: $80,000/month
- **Verify:** No overflow or display issues

### Edge Case 2: Decimal Precision
- Income: $1,234.56
- Expenses: $789.12
- **Verify:** Available shows $445.44 (correct rounding)

### Edge Case 3: Rapid Updates
- Add/delete multiple income/expense sources quickly
- **Verify:** No race conditions or incorrect calculations

### Edge Case 4: Theme Switching
- Test in both light and dark themes
- **Verify:** Colors remain visible and accessible in both themes

---

## Success Criteria

✅ All calculations are mathematically correct
✅ Color coding works for all status levels
✅ Animations are smooth and professional
✅ Updates happen in real-time
✅ No console errors
✅ Data persists across app restarts
✅ UI is responsive and looks good on all screen sizes
✅ Accessibility: Colors have sufficient contrast
✅ All text is readable and clear

---

## Manual Verification Checklist

- [ ] Test 1: Empty State
- [ ] Test 2: Only Income
- [ ] Test 3: Healthy Budget
- [ ] Test 4: Low Funds Warning
- [ ] Test 5: Negative Balance Danger
- [ ] Test 6: MTD with No Transactions
- [ ] Test 7: MTD with Transactions
- [ ] Test 8: Real-Time Updates
- [ ] Test 9: Multiple Income Sources
- [ ] Test 10: API Endpoint
- [ ] Edge Case 1: Large Numbers
- [ ] Edge Case 2: Decimal Precision
- [ ] Edge Case 3: Rapid Updates
- [ ] Edge Case 4: Theme Switching

---

## Known Limitations

1. Month-to-date spending currently requires transactions to be manually added
2. Transaction tracking is not yet fully implemented (this will come in a later phase)
3. Historical data comparison is not yet available

---

## Next Steps

After testing is complete and all checks pass:
1. Mark features as tested in roadmap
2. Update version number
3. Create release notes
4. Deploy to production

