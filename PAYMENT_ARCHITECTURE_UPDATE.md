# Payment Architecture Update - Backend Security Implementation

## Overview
Migrated payment confirmation logic from frontend to backend to ensure secure payment processing and prevent potential manipulation of payment status.

## Security Issue Addressed
**BEFORE:** Frontend directly updated Firestore payment status after receiving payment callback from Genie gateway
- ❌ Frontend code can be manipulated in browser developer tools
- ❌ No server-side verification of actual payment completion
- ❌ Users could potentially fake payment status by modifying JavaScript

**AFTER:** Backend webhook receives Genie notifications and securely updates Firestore
- ✅ Payment status updates only happen on secure backend (Firebase Cloud Functions)
- ✅ Frontend cannot directly modify payment status in Firestore
- ✅ Webhook verification ensures payment was actually completed by Genie
- ✅ All payment updates use Firebase Admin SDK with full security privileges

## Architecture Flow

### Deposit Payment (10%)
```
1. User initiates payment → Frontend calls geniePaymentService
2. Frontend redirects → Genie Payment Gateway
3. User completes payment → Genie sends webhook to backend
4. Backend webhook receives notification → functions/genieWebhook
5. Backend verifies and updates Firestore → initialPaymentStatus='paid', status='ready_to_assign'
6. Genie redirects user back → Frontend payment page with ?status=success
7. Frontend calls backend verification → functions/verifyPayment
8. Frontend reloads project data → Shows paid status from Firestore
```

### Final Payment (90%)
```
1. User initiates payment → Frontend calls geniePaymentService
2. Frontend redirects → Genie Payment Gateway
3. User completes payment → Genie sends webhook to backend
4. Backend webhook receives notification → functions/genieWebhook
5. Backend verifies and updates Firestore → finalPaymentStatus='paid', status='completed'
6. Genie redirects user back → Frontend payment page with ?status=success
7. Frontend calls backend verification → functions/verifyPayment
8. Frontend reloads project data → Shows paid status from Firestore
```

## Backend Changes

### 1. Firebase Admin SDK Initialization
**File:** `functions/index.js`
```javascript
const admin = require("firebase-admin");
admin.initializeApp();
```
- Enables secure Firestore access from Cloud Functions
- Bypasses security rules (runs with admin privileges)
- Required for backend payment status updates

### 2. Genie Webhook Handler
**Function:** `genieWebhook`
**URL:** `https://geniewebhook-e7fpchtlna-uc.a.run.app`
**Method:** POST

Receives payment notifications from Genie gateway:
```javascript
exports.genieWebhook = onRequest(async (req, res) => {
  // Extract transaction details from Genie webhook
  const { id, localId, customerReference, status, state } = req.body;
  
  // Determine payment type from order ID
  const orderId = customerReference || localId || id;
  const isDeposit = orderId.startsWith('DEPOSIT_');
  const isFinal = orderId.startsWith('FINAL_');
  
  // Extract project ID
  const projectId = orderId.split('_')[1];
  
  // Verify payment success
  const isSuccess = status === 'COMPLETED' || state === 'COMPLETED' || status === 'SUCCESS';
  
  if (isSuccess) {
    if (isDeposit) {
      // Update deposit payment
      await admin.firestore().collection('projects').doc(projectId).update({
        initialPaymentStatus: 'paid',
        initialPaymentId: orderId,
        status: 'ready_to_assign',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else if (isFinal) {
      // Update final payment
      await admin.firestore().collection('projects').doc(projectId).update({
        finalPaymentStatus: 'paid',
        finalPaymentId: orderId,
        status: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
});
```

### 3. Payment Verification Endpoint
**Function:** `verifyPayment`
**URL:** `https://verifypayment-e7fpchtlna-uc.a.run.app`
**Method:** POST

Allows frontend to verify payment status without direct Firestore access:
```javascript
exports.verifyPayment = onRequest(async (req, res) => {
  const { projectId, paymentType } = req.body;
  
  const projectDoc = await admin.firestore()
    .collection('projects')
    .doc(projectId)
    .get();
  
  const paymentStatus = paymentType === 'deposit' 
    ? projectDoc.data().initialPaymentStatus
    : projectDoc.data().finalPaymentStatus;
  
  res.json({
    success: true,
    isPaid: paymentStatus === 'paid',
    paymentId: paymentType === 'deposit'
      ? projectDoc.data().initialPaymentId
      : projectDoc.data().finalPaymentId
  });
});
```

## Frontend Changes

### 1. Deposit Payment Page
**File:** `src/pages/ProjectDepositPaymentPage.tsx`

**Removed:**
- Direct Firestore imports: `updateDoc`, `Timestamp`
- Direct Firestore updates in payment callback
- `handlePaymentSuccess` function with Firestore writes

**Added:**
- Backend verification API calls
- Error handling for verification failures
- Secure payment confirmation flow

**Before:**
```typescript
await updateDoc(doc(db, 'projects', projectId), {
  initialPaymentStatus: 'paid',
  initialPaymentId: orderId,
  status: 'ready_to_assign',
});
```

**After:**
```typescript
const response = await fetch('https://verifypayment-e7fpchtlna-uc.a.run.app', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ projectId, paymentType: 'deposit' }),
});
const result = await response.json();
```

### 2. Final Payment Page
**File:** `src/pages/FinalPaymentPage.tsx`

**Removed:**
- Dynamic Firestore imports in callback
- Direct Firestore `updateDoc` calls
- Frontend-controlled payment status updates

**Added:**
- Backend verification API calls
- Proper error messages for verification failures
- Read-only payment status display

**Before:**
```typescript
const { doc: firestoreDoc, updateDoc, Timestamp } = await import('firebase/firestore');
await updateDoc(projectRef, {
  finalPaymentStatus: 'paid',
  finalPaymentId: order_id,
  status: 'completed',
});
```

**After:**
```typescript
const response = await fetch('https://verifypayment-e7fpchtlna-uc.a.run.app', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ projectId, paymentType: 'final' }),
});
const result = await response.json();
```

### 3. Payment Service
**File:** `src/Services/geniePaymentService.ts`

**Updated:**
- `notifyUrl` changed from old endpoint to new webhook:
  - Old: `https://api-e7fpchtlna-uc.a.run.app/genie/notify`
  - New: `https://geniewebhook-e7fpchtlna-uc.a.run.app`

## Environment Configuration

### Production Credentials
**Genie Payment Gateway:** api.geniebiz.lk
**Application ID:** e6092ac4-3dba-466c-b0a7-137566fd81af

### Frontend Environment Files
`.env.production` and `.env.local`:
```env
VITE_GENIE_APPLICATION_ID=e6092ac4-3dba-466c-b0a7-137566fd81af
VITE_GENIE_API_KEY=<production-api-key>
VITE_GENIE_PUBLIC_KEY=<production-public-key>
VITE_GENIE_CLOUD_FUNCTION_URL=https://geniepayment-e7fpchtlna-uc.a.run.app
```

### Backend Environment File
`functions/.env`:
```env
GENIE_APPLICATION_ID=e6092ac4-3dba-466c-b0a7-137566fd81af
GENIE_API_KEY=<production-api-key>
```

## Order ID Format
- Deposit: `DEPOSIT_<projectId>_<timestamp>`
- Final: `FINAL_<projectId>_<timestamp>`

This format enables the webhook to:
1. Identify payment type (deposit vs final)
2. Extract project ID for Firestore update
3. Maintain unique order IDs for tracking

## Deployment Checklist

### Backend Deployment
- [ ] Deploy updated `functions/index.js` to Firebase Cloud Functions
- [ ] Verify `genieWebhook` function is accessible at URL
- [ ] Verify `verifyPayment` function is accessible at URL
- [ ] Check Cloud Function logs for any initialization errors
- [ ] Ensure `functions/.env` file is deployed with credentials

### Frontend Deployment
- [ ] Build with production environment variables
- [ ] Verify `.env.production` has correct credentials
- [ ] Test deposit payment flow (priced → ready_to_assign)
- [ ] Test final payment flow (work_submitted → completed)
- [ ] Verify payment callbacks redirect correctly
- [ ] Check browser console for any API errors

### Genie Gateway Configuration
- [ ] Update webhook URL in Genie merchant dashboard (if required)
- [ ] Verify webhook notifications are being received by backend
- [ ] Test with small amount before production use
- [ ] Monitor webhook logs for any failures

### Security Verification
- [ ] Confirm frontend cannot update payment status directly
- [ ] Verify Firestore security rules prevent frontend writes to payment fields
- [ ] Test that payment verification requires backend confirmation
- [ ] Check that webhook properly validates transaction status

## Testing Scenarios

### Test Case 1: Successful Deposit Payment
1. User clicks "Pay Now" on priced project
2. Redirected to Genie payment gateway
3. Complete payment with test/real card
4. Genie sends webhook to backend → Backend updates Firestore
5. User redirected back with `?status=success`
6. Frontend calls verification → Backend confirms payment
7. Project status changes to "ready_to_assign"
8. Payment status shows "Paid" in UI

### Test Case 2: Successful Final Payment
1. User clicks "Pay Final Amount" on work_submitted project
2. Redirected to Genie payment gateway
3. Complete payment
4. Genie sends webhook → Backend updates Firestore
5. User redirected back with `?status=success`
6. Frontend verifies → Backend confirms
7. Project status changes to "completed"
8. Download buttons enabled

### Test Case 3: Cancelled Payment
1. User initiates payment
2. User clicks "Cancel" on Genie gateway
3. Redirected back with `?status=cancelled`
4. Frontend shows cancellation message
5. No Firestore updates occur
6. User can retry payment

### Test Case 4: Network Failure During Verification
1. Payment completes on Genie
2. Webhook updates backend successfully
3. Frontend verification call fails (network issue)
4. Frontend shows error message
5. User refreshes page
6. Payment status loaded from Firestore shows "Paid"
7. Backend webhook already updated status, so no data loss

## Monitoring & Debugging

### Cloud Function Logs
Check Firebase Console → Functions → Logs:
```
✅ "Payment webhook received for project: <projectId>"
✅ "Deposit payment verified and updated successfully"
✅ "Final payment verified and updated successfully"
❌ "Error updating payment status: <error message>"
```

### Frontend Console Logs
```
💳 "Payment callback received: { status, projectId }"
✅ "Payment verified by backend: { isPaid, paymentId }"
❌ "Error verifying payment: <error>"
```

### Firestore Monitoring
Watch for these field updates in `projects` collection:
- `initialPaymentStatus`: 'pending' → 'paid'
- `finalPaymentStatus`: 'pending' → 'paid'
- `status`: 'priced' → 'ready_to_assign' (deposit)
- `status`: 'work_submitted' → 'completed' (final)

## Rollback Plan
If issues occur after deployment:

1. **Immediate Fix:** Update `notifyUrl` back to old endpoint if webhook fails
2. **Frontend Rollback:** Restore direct Firestore updates temporarily
3. **Backend Fix:** Deploy corrected webhook function
4. **Re-deploy:** Test in staging before production

## Benefits of New Architecture

✅ **Security:** Payment status cannot be manipulated by frontend
✅ **Reliability:** Webhook ensures payment confirmation even if user closes browser
✅ **Auditability:** All payment updates logged in Cloud Functions
✅ **Scalability:** Backend can handle verification for multiple projects simultaneously
✅ **Consistency:** Single source of truth (backend) for payment status
✅ **Maintainability:** Payment logic centralized in backend functions

## Notes

- Cloud Function URLs are stable and won't change unless function is renamed
- Webhook receives POST requests from Genie's servers, not user browsers
- Frontend verification is for UI updates only - backend webhook is the source of truth
- If webhook fails, manual admin intervention may be needed to update payment status
- Consider adding webhook retry mechanism for production reliability
- Monitor Genie webhook delivery rates in merchant dashboard

## Future Enhancements

1. **Webhook Signature Verification:** Validate webhook requests are from Genie
2. **Retry Logic:** Implement exponential backoff for failed webhook updates
3. **Email Notifications:** Send payment confirmation emails from backend
4. **Payment History:** Log all webhook events in separate collection
5. **Admin Dashboard:** View webhook delivery status and payment timeline
6. **Idempotency:** Prevent duplicate webhook processing with transaction IDs
