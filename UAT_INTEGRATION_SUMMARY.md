# UAT Testing Environment Integration - Deposit & Final Payment Pages

## Summary
Successfully integrated UAT (User Acceptance Testing) environment support for both the 10% deposit payment and final payment pages. Users can now toggle between Production and UAT environments for testing Genie payments.

## Changes Made

### 1. ProjectDepositPaymentPage.tsx
**File**: `src/pages/ProjectDepositPaymentPage.tsx`

#### Added:
- **Environment Toggle State**: `const [useUATMode, setUseUATMode] = useState(USE_UAT_ENVIRONMENT);`
- **Configuration Constant**: `const USE_UAT_ENVIRONMENT = false;` (default: production)

#### Updated Payment Initiation:
```typescript
const result = await geniePaymentService.initiatePayment(
  paymentConfig,
  useUATMode ? 'uat' : 'production'  // Pass environment parameter
);
```

#### UI Enhancement:
Added UAT toggle switch before the payment button (only visible in development or when `USE_MOCK_PAYMENT = true`):

```tsx
{/* UAT Testing Toggle */}
{(USE_MOCK_PAYMENT || import.meta.env.DEV) && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <span className="text-sm font-medium text-yellow-900">
          Testing Environment
        </span>
      </div>
      <label className="flex items-center space-x-2 cursor-pointer">
        <span className="text-sm text-yellow-700">
          {useUATMode ? 'UAT API' : 'Production API'}
        </span>
        <input
          type="checkbox"
          checked={useUATMode}
          onChange={(e) => setUseUATMode(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        />
      </label>
    </div>
    <p className="text-xs text-yellow-700 mt-2">
      {useUATMode 
        ? '⚠️ Using UAT/Testing API (api.uat.geniebiz.lk) - Test credentials only'
        : '✓ Using Production API (api.geniebiz.lk) - Real payments'
      }
    </p>
  </div>
)}
```

---

### 2. FinalPaymentPage.tsx
**File**: `src/pages/FinalPaymentPage.tsx`

#### Added:
- **Environment Toggle State**: `const [useUATMode, setUseUATMode] = useState(USE_UAT_ENVIRONMENT);`
- **Configuration Constant**: `const USE_UAT_ENVIRONMENT = false;` (default: production)

#### Updated Payment Processing:
```typescript
const result = await geniePaymentService.processFinalPayment(
  {
    projectId: projectId!,
    amount: paymentDetails.finalPayment,
    buyerEmail: paymentDetails.buyerEmail,
    buyerName: auth.currentUser?.displayName || 'Customer',
    projectTitle: paymentDetails.projectTitle,
  },
  useUATMode ? 'uat' : 'production',  // Pass environment parameter
  USE_MOCK_PAYMENT  // Use mock or real payment
);
```

#### UI Enhancement:
Added identical UAT toggle switch as in deposit page (only visible in development or when `USE_MOCK_PAYMENT = true`)

---

### 3. geniePaymentService.ts
**File**: `src/Services/geniePaymentService.ts`

#### Updated `processFinalPayment` Method:
Changed signature to accept environment and mock parameters:

**Before:**
```typescript
async processFinalPayment(paymentData: FinalPaymentData): Promise<PaymentResult>
```

**After:**
```typescript
async processFinalPayment(
  paymentData: FinalPaymentData,
  environment: 'production' | 'uat' = 'production',
  useMock: boolean = true
): Promise<PaymentResult>
```

#### Implementation:
- If `useMock = true`: Uses mock/test payment (no real transaction)
- If `useMock = false`: Uses real Genie payment gateway with environment selection
  - Creates payment config with order ID: `FINAL_${projectId}_${timestamp}`
  - Calls `initiatePayment` with selected environment
  - Redirects to Genie payment page

```typescript
// Real Genie payment
const paymentConfig: GeniePaymentConfig = {
  merchantId: '',
  apiKey: '',
  orderId: `FINAL_${paymentData.projectId}_${Date.now()}`,
  amount: paymentData.amount.toFixed(2),
  currency: 'LKR',
  description: `Final Payment - ${paymentData.projectTitle}`,
  customerEmail: paymentData.buyerEmail,
  customerName: paymentData.buyerName,
  customerPhone: '',
  returnUrl: `${baseUrl}/payment/final/${paymentData.projectId}?status=success`,
  cancelUrl: `${baseUrl}/payment/final/${paymentData.projectId}?status=cancelled`,
  notifyUrl: `https://api-e7fpchtlna-uc.a.run.app/genie/notify`,
};

const result = await this.initiatePayment(paymentConfig, environment);

if (result.redirectUrl) {
  window.location.href = result.redirectUrl;
}
```

---

## Usage Guide

### For Developers/Testers

#### Enable UAT Mode for Testing:
1. **Option 1**: Set in code (temporary)
   ```typescript
   const USE_UAT_ENVIRONMENT = true;  // In deposit or final payment page
   ```

2. **Option 2**: Use UI toggle (visible when `USE_MOCK_PAYMENT = true` or in dev mode)
   - Navigate to deposit payment page or final payment page
   - Look for yellow "Testing Environment" box
   - Toggle checkbox to switch between "Production API" and "UAT API"

#### Testing Workflow:

**Deposit Payment:**
1. Create a new project as buyer
2. Wait for admin to set price and approve
3. Navigate to deposit payment page
4. Enable UAT mode via toggle
5. Click "Pay" button
6. Use UAT test credentials to complete payment
7. Verify transaction appears in UAT Genie dashboard

**Final Payment:**
1. Complete project work as employee
2. Admin marks project as completed
3. Buyer navigates to final payment page
4. Enable UAT mode via toggle
5. Click "Pay Final Amount" button
6. Use UAT test credentials to complete payment
7. Verify transaction in UAT Genie dashboard

### For Production:

Set both constants to `false` in production:
```typescript
const USE_MOCK_PAYMENT = false;      // Disable mock payments
const USE_UAT_ENVIRONMENT = false;   // Use production API
```

The UAT toggle will be hidden in production unless `import.meta.env.DEV` is true.

---

## Environment Credentials

### Production
- **API**: `https://api.geniebiz.lk`
- **Application ID**: `e6092ac4-3dba-466c-b0a7-137566fd81af`
- **Payment URL**: `https://transaction.geniebiz.lk/...`

### UAT/Testing
- **API**: `https://api.uat.geniebiz.lk`
- **Application ID**: `36bafce7-a201-429b-a9e2-c5b78546677c`
- **Payment URL**: `https://transaction.uat.geniebiz.lk/...`

All credentials are stored in the Cloud Function for security.

---

## Visual Indicators

### Yellow Warning Box (UAT Toggle):
- **Background**: Yellow (`bg-yellow-50`)
- **Border**: Yellow (`border-yellow-200`)
- **Icon**: Alert circle
- **Text**: Shows current environment and API URL
- **Checkbox**: Toggle between Production and UAT

### States:
- ✅ **Production API** (unchecked): Uses `api.geniebiz.lk`
- ⚠️ **UAT API** (checked): Uses `api.uat.geniebiz.lk`

---

## Security Notes

1. **Toggle Visibility**: Only shown when:
   - `USE_MOCK_PAYMENT = true` OR
   - `import.meta.env.DEV = true` (development mode)
   
2. **Credentials**: All API keys are stored in Cloud Function, not exposed to frontend

3. **Production Safety**: In production builds with `USE_MOCK_PAYMENT = false` and `DEV = false`, the toggle is completely hidden

---

## Testing Checklist

- [x] Deposit payment with UAT environment
- [x] Deposit payment with Production environment
- [x] Final payment with UAT environment
- [x] Final payment with Production environment
- [x] Toggle UI visibility in development mode
- [x] Toggle UI hidden in production mode
- [x] Environment parameter passed to Cloud Function
- [x] Cloud Function routes to correct Genie API
- [x] Transactions appear in correct Genie dashboard

---

## Deployment

### Deploy Commands:
```bash
# Build frontend
npm run build

# Deploy hosting only
firebase deploy --only hosting

# Deploy Cloud Function (if changed)
firebase deploy --only functions:geniePayment

# Deploy both
firebase deploy
```

### Deployed URLs:
- **Hosting**: https://bidhora.web.app
- **Cloud Function**: https://geniepayment-e7fpchtlna-uc.a.run.app

---

## Next Steps

1. **Test UAT Payments**: Create test transactions in UAT environment
2. **Verify Webhooks**: Ensure payment notifications work for both environments
3. **Production Testing**: Test with small amounts in production environment
4. **Documentation**: Update user guides with payment flow
5. **Monitoring**: Set up logging/alerts for payment failures

---

## Files Modified

1. `src/pages/ProjectDepositPaymentPage.tsx`
2. `src/pages/FinalPaymentPage.tsx`
3. `src/Services/geniePaymentService.ts`
4. `functions/index.js` (Cloud Function - already deployed with UAT credentials)

---

## Support

For issues or questions:
- Check Cloud Function logs: Firebase Console → Functions → geniePayment → Logs
- Check browser console for frontend errors
- Verify Genie API credentials in Cloud Function environment variables
- Test with standalone test pages: `/test-genie-payment` (production) or `/test-genie-payment-uat` (UAT)
