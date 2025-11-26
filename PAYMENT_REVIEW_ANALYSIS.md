# Genie Payment Implementation Review - Critical Issues Found

## Executive Summary

✅ **GOOD:** Backend webhook handler implemented correctly
✅ **GOOD:** Payment verification endpoint working
✅ **GOOD:** Order ID format fixed (DEPOSIT_/FINAL_ with underscores)
✅ **GOOD:** Webhook registration functions added

⚠️ **ISSUES FOUND:**
1. **Webhook URL hardcoded** - needs to be environment-aware
2. **Per-transaction webhook still included** - redundant after registration
3. **Missing webhook signature verification** - security risk
4. **No idempotency handling** - duplicate webhook processing possible

## Detailed Analysis

### 1. Backend Payment Gateway (`functions/index.js`)

#### ✅ Correct Implementation:
```javascript
// Production API correctly configured
const GENIE_API_BASE = 'https://api.geniebiz.lk';

// Credentials properly loaded from environment
const GENIE_APPLICATION_ID = process.env.GENIE_APPLICATION_ID;
const GENIE_API_KEY = process.env.GENIE_API_KEY;

// Payment request includes webhook URL
const genieRequestBody = {
  amount: parseFloat(paymentData.amount) * 100,
  currency: paymentData.currency,
  localId: paymentData.orderId,
  customerReference: paymentData.orderId,
  redirectUrl: paymentData.returnUrl,
  webhook: paymentData.notifyUrl, // ✅ Webhook passed to Genie
  customer: { ... }
};
```

#### ✅ Webhook Handler Working:
```javascript
exports.genieWebhook = onRequest(async (req, res) => {
  const { id, localId, customerReference, status, state } = req.body;
  const orderId = localId || customerReference;
  
  // ✅ Correctly identifies payment type
  const isDepositPayment = orderId.startsWith('DEPOSIT_');
  const isFinalPayment = orderId.startsWith('FINAL_');
  
  // ✅ Extracts project ID correctly
  const projectId = orderId.split('_')[1];
  
  // ✅ Checks payment success
  const isSuccess = status === 'COMPLETED' || state === 'COMPLETED';
  
  // ✅ Updates Firestore using Admin SDK
  if (isSuccess && isDepositPayment) {
    await projectRef.update({
      initialPaymentStatus: 'paid',
      initialPaymentId: transactionId,
      status: 'ready_to_assign',
    });
  }
});
```

**Status:** ✅ Working correctly

#### ⚠️ Issue: Webhook Registration Hardcoded URL
```javascript
exports.registerGenieWebhook = onRequest(async (req, res) => {
  const WEBHOOK_URL = "https://geniewebhook-e7fpchtlna-uc.a.run.app"; // ⚠️ HARDCODED
  
  await fetch("https://api.geniebiz.lk/public/webhooks", {
    method: "POST",
    body: JSON.stringify({ hookUrl: WEBHOOK_URL }),
  });
});
```

**Problem:** 
- Hardcoded URL won't work in different environments (staging, dev)
- Should be constructed dynamically or from environment variable

**Fix Required:**
```javascript
// Get the Cloud Function URL dynamically
const region = process.env.FUNCTION_REGION || 'us-central1';
const projectId = process.env.GCLOUD_PROJECT;
const WEBHOOK_URL = `https://${region}-${projectId}.cloudfunctions.net/genieWebhook`;

// Or from environment variable
const WEBHOOK_URL = process.env.GENIE_WEBHOOK_URL || 
  "https://geniewebhook-e7fpchtlna-uc.a.run.app";
```

### 2. Frontend Deposit Payment (`src/pages/ProjectDepositPaymentPage.tsx`)

#### ✅ Order ID Format Fixed:
```typescript
const order_id = `DEPOSIT_${project.id}_${Date.now()}`; // ✅ Underscores
```

#### ✅ Webhook URL Included:
```typescript
const paymentConfig: GeniePaymentConfig = {
  orderId: order_id,
  amount: project.initialPaymentAmount.toFixed(2),
  returnUrl: `${baseUrl}/payment/project/${project.id}?status=success`,
  cancelUrl: `${baseUrl}/payment/project/${project.id}?status=cancelled`,
  notifyUrl: `https://geniewebhook-e7fpchtlna-uc.a.run.app`, // ✅ Webhook URL
};
```

#### ⚠️ Issue: Hardcoded Webhook URL in Frontend
```typescript
notifyUrl: `https://geniewebhook-e7fpchtlna-uc.a.run.app`, // ⚠️ HARDCODED
```

**Problem:**
- Not using environment variable
- Will break in staging/dev environments

**Fix Required:**
```typescript
notifyUrl: import.meta.env.VITE_GENIE_WEBHOOK_URL || 
  `https://geniewebhook-e7fpchtlna-uc.a.run.app`,
```

Add to `.env.production`:
```env
VITE_GENIE_WEBHOOK_URL=https://geniewebhook-e7fpchtlna-uc.a.run.app
```

#### ✅ Payment Verification Working:
```typescript
const response = await fetch('https://verifypayment-e7fpchtlna-uc.a.run.app', {
  method: 'POST',
  body: JSON.stringify({ projectId, paymentType: 'deposit' }),
});

const result = await response.json();

if (result.isPaid) {
  // ✅ Payment confirmed
} else {
  // ⏳ Still processing
}
```

**Status:** ✅ Working correctly

### 3. Frontend Final Payment (`src/Services/geniePaymentService.ts`)

#### ✅ Order ID Format:
```typescript
const order_id = `FINAL_${paymentData.projectId}_${Date.now()}`; // ✅ Underscores
```

#### ⚠️ Same Hardcoded Webhook Issue:
```typescript
notifyUrl: `https://geniewebhook-e7fpchtlna-uc.a.run.app`, // ⚠️ HARDCODED
```

**Same fix needed as deposit payment**

### 4. Webhook Registration vs Per-Transaction Webhook

#### Current Implementation:
```javascript
// Payment request includes webhook URL
{
  webhook: "https://geniewebhook-e7fpchtlna-uc.a.run.app",
  // ... other fields
}

// PLUS we have registration function
exports.registerGenieWebhook = onRequest(...)
```

#### Question: Do we need both?

**Genie Documentation Analysis:**

1. **Registered Webhook (Recommended):**
   - Register once via `/public/webhooks`
   - ALL transactions automatically send notifications
   - More reliable

2. **Per-Transaction Webhook (Optional):**
   - Include `webhook` field in each payment
   - Overrides registered webhook (if different)
   - Can be used as fallback

**Recommendation:** 
- ✅ Keep both for redundancy
- The per-transaction webhook acts as a fallback
- Registered webhook ensures we don't miss notifications
- If both are the same URL, Genie just sends one notification

**Status:** ✅ Current implementation is fine

### 5. Security Concerns

#### ⚠️ Missing: Webhook Signature Verification

**Current Code:**
```javascript
exports.genieWebhook = onRequest(async (req, res) => {
  const webhookData = req.body; // ⚠️ No verification!
  
  // Anyone can send POST request and fake payment
  await projectRef.update({
    initialPaymentStatus: 'paid', // ⚠️ DANGER!
  });
});
```

**Problem:**
- No verification that webhook is from Genie
- Malicious actor could send fake payment notifications
- Could mark projects as paid without actual payment

**Critical Fix Required:**
```javascript
function verifyGenieWebhook(req) {
  // Get signature from Genie webhook headers
  const signature = req.headers['x-genie-signature'] || 
                   req.headers['genie-signature'];
  
  if (!signature) {
    return false;
  }
  
  // Verify signature using HMAC
  const crypto = require('crypto');
  const payload = JSON.stringify(req.body);
  const secret = process.env.GENIE_WEBHOOK_SECRET; // Need to get from Genie
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

exports.genieWebhook = onRequest(async (req, res) => {
  // Verify webhook is from Genie
  if (!verifyGenieWebhook(req)) {
    logger.error("Invalid webhook signature - possible fraud attempt");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  
  // Process payment...
});
```

**Action Required:**
1. Contact Genie support to get webhook signature details
2. Ask what header they use for signature
3. Get the secret key for HMAC verification
4. Implement signature verification

### 6. Idempotency Handling

#### ⚠️ Missing: Duplicate Webhook Prevention

**Current Code:**
```javascript
if (isSuccess && isDepositPayment) {
  await projectRef.update({
    initialPaymentStatus: 'paid',
    // ... other fields
  }); // ⚠️ No check if already processed
}
```

**Problem:**
- Genie might send same webhook multiple times (retries)
- Could process same payment multiple times
- Possible race conditions

**Fix Required:**
```javascript
// Check if payment already processed
const projectDoc = await projectRef.get();
const projectData = projectDoc.data();

if (projectData.initialPaymentId === transactionId) {
  logger.info("Payment already processed - idempotent check", { transactionId });
  res.status(200).json({ 
    success: true, 
    message: "Payment already processed" 
  });
  return;
}

// Process payment for first time
await projectRef.update({
  initialPaymentStatus: 'paid',
  initialPaymentId: transactionId,
  // ...
});
```

## Summary of Issues

### Critical (Fix Immediately):
1. ❌ **No webhook signature verification** - Security vulnerability
2. ⚠️ **No idempotency handling** - Could process duplicates

### Medium (Fix Soon):
3. ⚠️ **Hardcoded webhook URLs** - Environment flexibility
4. ⚠️ **Hardcoded verification endpoint URLs** - Same issue

### Low (Nice to Have):
5. ℹ️ **Add webhook retry logic** - If Firestore update fails
6. ℹ️ **Add webhook event logging** - Separate collection for audit trail
7. ℹ️ **Add payment status transition validation** - Prevent invalid state changes

## Current Payment Flow (Correct)

```
✅ 1. User initiates payment
    ↓
✅ 2. Frontend sends to Cloud Function (geniepayment)
    ↓
✅ 3. Cloud Function calls Genie API with webhook URL
    ↓
✅ 4. Genie creates payment session
    ↓
✅ 5. User redirected to Genie payment gateway
    ↓
✅ 6. User completes payment → Genie marks COMPLETED
    ↓
✅ 7. Genie sends webhook to genieWebhook function
    ⚠️ (NO SIGNATURE VERIFICATION - SECURITY RISK)
    ↓
✅ 8. genieWebhook updates Firestore via Admin SDK
    ⚠️ (NO IDEMPOTENCY CHECK - DUPLICATE RISK)
    ↓
✅ 9. Genie redirects user back to return URL
    ↓
✅ 10. Frontend calls verifyPayment endpoint
    ↓
✅ 11. verifyPayment reads from Firestore
    ↓
✅ 12. Frontend shows payment status
```

## Recommended Fixes Priority

### Immediate (Today):
```bash
# 1. Fix hardcoded URLs - use environment variables
# 2. Add idempotency check to webhook
```

### This Week:
```bash
# 3. Contact Genie support for webhook signature details
# 4. Implement webhook signature verification
# 5. Deploy and test
```

### Next Week:
```bash
# 6. Add webhook event logging
# 7. Add retry mechanism
# 8. Add monitoring/alerting
```

## Conclusion

### ✅ What's Working:
- Payment initiation through Cloud Function
- Webhook receiving notifications
- Firestore updates via Admin SDK
- Frontend verification flow
- Order ID format correct
- Both deposit and final payments

### ❌ What Needs Fixing:
- **CRITICAL:** Add webhook signature verification
- **IMPORTANT:** Add idempotency handling
- **MEDIUM:** Remove hardcoded URLs
- **NICE:** Add event logging and retry logic

### Overall Assessment:
**7/10** - Core flow works but has security vulnerabilities
- Payments are processing correctly
- But webhook has no authentication
- Risk of fraud without signature verification
- Risk of duplicate processing without idempotency

### Next Actions:
1. Deploy current code with order ID fix
2. Register webhook with Genie
3. Test one payment end-to-end
4. Contact Genie support for signature verification
5. Implement security fixes
6. Re-deploy with security updates
