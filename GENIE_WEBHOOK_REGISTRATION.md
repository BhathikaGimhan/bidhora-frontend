# Genie Webhook Registration Guide

## Overview
Genie Business supports **two webhook approaches** for payment notifications:

### 1. Per-Transaction Webhook (Current - Unreliable)
- Pass `webhook` field with each payment request
- Webhook URL sent every time you create a payment
- **Problem:** Not guaranteed to receive notifications
- **Status:** What we were doing before

### 2. Registered Webhook (Recommended - Reliable)
- Register webhook URL **once** with Genie using `/public/webhooks` API
- Genie automatically sends ALL payment notifications to registered webhook
- **Benefit:** Much more reliable, one-time setup
- **Status:** Now implemented

## Why Registration is Better

❌ **Without Registration (Old Way):**
```javascript
// Each payment includes webhook URL
{
  webhook: "https://geniewebhook-e7fpchtlna-uc.a.run.app",
  // other payment data...
}
// Genie might not call this webhook reliably
```

✅ **With Registration (New Way):**
```javascript
// Register once
POST https://api.geniebiz.lk/public/webhooks
{
  "hookUrl": "https://geniewebhook-e7fpchtlna-uc.a.run.app"
}

// Then all payments automatically send notifications to registered webhook
// No need to include webhook URL in each payment request
```

## New Cloud Functions

### 1. registerGenieWebhook
**Purpose:** Register our webhook URL with Genie (one-time setup)
**URL:** `https://registergeniewebhook-e7fpchtlna-uc.a.run.app`
**Method:** POST/GET (no body required)

**What it does:**
1. Calls Genie API: `POST /public/webhooks`
2. Registers: `https://geniewebhook-e7fpchtlna-uc.a.run.app`
3. Returns webhook ID and confirmation

**Usage:**
```bash
# Call this once after deployment
curl https://registergeniewebhook-e7fpchtlna-uc.a.run.app
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook registered successfully with Genie",
  "webhookId": "60d2c9544b33930009a6caf7",
  "hookUrl": "https://geniewebhook-e7fpchtlna-uc.a.run.app",
  "created": "2025-11-26T10:30:00.000Z"
}
```

### 2. listGenieWebhooks
**Purpose:** View all registered webhooks on Genie account
**URL:** `https://listgeniewebhooks-e7fpchtlna-uc.a.run.app`
**Method:** GET

**What it does:**
1. Calls Genie API: `GET /public/webhooks`
2. Returns list of all registered webhooks

**Usage:**
```bash
# Check registered webhooks
curl https://listgeniewebhooks-e7fpchtlna-uc.a.run.app
```

**Response:**
```json
{
  "success": true,
  "webhooks": [
    {
      "id": "60d2c9544b33930009a6caf7",
      "hookUrl": "https://geniewebhook-e7fpchtlna-uc.a.run.app",
      "companyId": "5df00bbd8f0931da1d096769",
      "created": "2025-11-26T10:30:00.000Z",
      "updated": "2025-11-26T10:30:00.000Z"
    }
  ]
}
```

## Implementation Details

### Cloud Function Code
**File:** `functions/index.js`

```javascript
exports.registerGenieWebhook = onRequest(
  { cors: true, maxInstances: 1 },
  async (req, res) => {
    const GENIE_API_KEY = process.env.GENIE_API_KEY;
    const WEBHOOK_URL = "https://geniewebhook-e7fpchtlna-uc.a.run.app";

    const response = await fetch("https://api.geniebiz.lk/public/webhooks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": GENIE_API_KEY,
        "Accept": "application/json",
      },
      body: JSON.stringify({
        hookUrl: WEBHOOK_URL,
      }),
    });

    const responseData = await response.json();
    // Return registration confirmation
  }
);
```

### Authentication
Uses same API key from `.env`:
```env
GENIE_API_KEY=<your-production-api-key>
```

## Setup Process

### Step 1: Deploy Cloud Functions
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

This deploys:
- ✅ `genieWebhook` (receives payment notifications)
- ✅ `verifyPayment` (frontend verification endpoint)
- ✅ `registerGenieWebhook` (new - webhook registration)
- ✅ `listGenieWebhooks` (new - list webhooks)

### Step 2: Register Webhook (One-Time)
After deployment, call the registration function:

```bash
curl -X POST https://registergeniewebhook-e7fpchtlna-uc.a.run.app
```

**Or** visit the URL in browser (function handles both GET and POST)

**Expected Output:**
```json
{
  "success": true,
  "message": "Webhook registered successfully with Genie",
  "webhookId": "abc123...",
  "hookUrl": "https://geniewebhook-e7fpchtlna-uc.a.run.app"
}
```

### Step 3: Verify Registration
Check that webhook is registered:

```bash
curl https://listgeniewebhooks-e7fpchtlna-uc.a.run.app
```

Should show your webhook in the list.

### Step 4: Optional - Remove Per-Transaction Webhook
Since we now have registered webhook, we can optionally remove the `webhook` field from payment requests. However, it doesn't hurt to keep it as a fallback.

## Current Payment Flow (After Registration)

```
1. User initiates payment
   ↓
2. Frontend creates payment with Genie
   - Still includes webhook URL (optional fallback)
   ↓
3. User completes payment on Genie gateway
   ↓
4. Genie processes payment → Status: CONFIRMED
   ↓
5. Genie sends webhook to REGISTERED webhook URL
   - Uses the URL we registered via /public/webhooks
   - More reliable than per-transaction webhook
   ↓
6. Our genieWebhook function receives notification
   - Extracts transaction details
   - Updates Firestore with payment status
   ↓
7. User redirected back to our site
   ↓
8. Frontend calls verifyPayment
   - Confirms payment status from Firestore
   - Shows success/pending message
   ↓
9. UI updates with paid status
```

## Troubleshooting Failed Payment

### Current Failed Payment
**Transaction ID:** 6926a1d7c8f3521658b7b318
**Project ID:** znlrLvdDp8HP6gviZrCQ
**Issue:** Webhook didn't process (order ID format was wrong)

### Fix Steps:

#### 1. Register Webhook First
```bash
curl -X POST https://registergeniewebhook-e7fpchtlna-uc.a.run.app
```

#### 2. Manually Fix Failed Payment
Use Firebase Console or Admin SDK script:

**Firebase Console:**
1. Go to Firestore → `projects` collection
2. Find document: `znlrLvdDp8HP6gviZrCQ`
3. Update fields:
   ```
   initialPaymentStatus: "paid"
   initialPaymentId: "6926a1d7c8f3521658b7b318"
   status: "ready_to_assign"
   updatedAt: [current timestamp]
   ```

**Admin SDK Script:**
```javascript
// functions/fixPayment.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function fixPayment() {
  await admin.firestore()
    .collection('projects')
    .doc('znlrLvdDp8HP6gviZrCQ')
    .update({
      initialPaymentStatus: 'paid',
      initialPaymentId: '6926a1d7c8f3521658b7b318',
      status: 'ready_to_assign',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  
  console.log('✅ Payment fixed successfully');
  process.exit(0);
}

fixPayment().catch(console.error);
```

Run:
```bash
cd functions
node fixPayment.js
```

#### 3. Deploy Order ID Fix
The order ID format has been fixed in the code:
- Old: `DEPOSIT-projectId-timestamp` ❌
- New: `DEPOSIT_projectId_timestamp` ✅

Deploy the fix:
```bash
npm run build
firebase deploy
```

## Testing Webhook Registration

### Test 1: Verify Registration
```bash
# Register webhook
curl -X POST https://registergeniewebhook-e7fpchtlna-uc.a.run.app

# List webhooks (should show our webhook)
curl https://listgeniewebhooks-e7fpchtlna-uc.a.run.app
```

### Test 2: Make Test Payment
1. Create a priced project
2. Initiate deposit payment
3. Complete payment on Genie gateway
4. Check Cloud Function logs for webhook notification:
   ```bash
   firebase functions:log --only genieWebhook
   ```
5. Verify Firestore updated correctly
6. Verify frontend shows paid status

### Test 3: Monitor Webhook Deliveries
Check Genie merchant dashboard for webhook delivery status:
- Successful deliveries
- Failed deliveries
- Retry attempts

## Benefits of Registered Webhook

✅ **Reliability:** Genie guarantees webhook delivery to registered URL
✅ **Simplicity:** No need to include webhook URL in each payment request
✅ **Centralized:** One webhook receives all payment notifications
✅ **Management:** Can view/update registered webhooks via API
✅ **Debugging:** Clear audit trail of webhook deliveries in Genie dashboard

## Webhook Security (Future Enhancement)

Consider adding webhook signature verification:

```javascript
// Verify webhook is from Genie
function verifyWebhookSignature(req) {
  const signature = req.headers['x-genie-signature'];
  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', GENIE_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

exports.genieWebhook = onRequest(async (req, res) => {
  if (!verifyWebhookSignature(req)) {
    logger.error("Invalid webhook signature");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  // Process webhook...
});
```

## Summary

### Before (Unreliable):
- ❌ Webhook URL passed with each payment
- ❌ No guarantee Genie will call webhook
- ❌ Failed payment: Transaction 6926a1d7c8f3521658b7b318

### After (Reliable):
- ✅ Webhook registered once with Genie
- ✅ All payments automatically send notifications
- ✅ Better error handling and logging
- ✅ Order ID format fixed
- ✅ Manual fix available for failed payment

### Action Items:
1. Deploy Cloud Functions: `firebase deploy --only functions`
2. Register webhook: `curl -X POST https://registergeniewebhook-e7fpchtlna-uc.a.run.app`
3. Verify registration: `curl https://listgeniewebhooks-e7fpchtlna-uc.a.run.app`
4. Fix failed payment manually in Firestore
5. Deploy frontend fix: `npm run build && firebase deploy`
6. Test with new payment
7. Monitor webhook logs for success
