# Genie Payment CORS Fix

## Problem
The Genie Payment API (`https://api.geniebiz.lk`) blocks direct browser requests due to CORS (Cross-Origin Resource Sharing) restrictions. This is a security feature to prevent:
- API key exposure in browser
- Client-side tampering
- Unauthorized access

## Solution
Created a **Firebase Cloud Function** to act as a secure proxy between the frontend and Genie API.

## Architecture

```
Browser (Frontend)
    ↓
Firebase Cloud Function (Proxy)
    ↓
Genie Payment API
```

## Changes Made

### 1. Cloud Function (`functions/index.js`)
Added `geniePayment` function that:
- Accepts payment initiation and verification requests
- Securely stores Genie credentials on server-side
- Proxies requests to Genie API
- Returns responses to frontend

### 2. Frontend Service (`src/Services/geniePaymentService.ts`)
Updated to:
- Call Cloud Function instead of Genie API directly
- Use `VITE_GENIE_CLOUD_FUNCTION_URL` environment variable
- Handle responses from Cloud Function

## Deployment Steps

### Step 1: Set Environment Variables in Firebase

The Cloud Function needs Genie credentials. Set them using Firebase CLI:

```bash
cd functions

# Set Genie credentials
firebase functions:config:set \
  genie.application_id="3a374c7d-f339-4a98-8491-44458c116be2" \
  genie.api_key="YOUR_ACTUAL_API_KEY_HERE"
```

**Note:** Replace `YOUR_ACTUAL_API_KEY_HERE` with the actual JWT API key from your Genie dashboard.

### Step 2: Deploy the Cloud Function

```bash
# From the project root
firebase deploy --only functions:geniePayment
```

### Step 3: Update Frontend Environment Variables

Add this to your `.env` file:

```env
# Genie Cloud Function URL (update after deployment if different)
VITE_GENIE_CLOUD_FUNCTION_URL=https://us-central1-bidhora.cloudfunctions.net/geniePayment
```

### Step 4: Restart Dev Server

```bash
npm run dev
```

## Testing

1. Go to `http://localhost:8082/test-genie-payment`
2. Fill in the payment details
3. Click "Initiate Payment"
4. The request should now go through the Cloud Function without CORS errors

## Cloud Function Endpoints

### Initiate Payment
```javascript
POST https://us-central1-bidhora.cloudfunctions.net/geniePayment

Body:
{
  "action": "initiate",
  "paymentData": {
    "amount": "1000",
    "currency": "LKR",
    "orderId": "TEST_123",
    "description": "Test Payment",
    "customerEmail": "test@example.com",
    "customerName": "Test Customer",
    "customerPhone": "0771234567",
    "returnUrl": "http://localhost:8082/payment-success",
    "cancelUrl": "http://localhost:8082/payment-cancel",
    "notifyUrl": "http://localhost:8082/api/payment-notify"
  }
}
```

### Verify Payment
```javascript
POST https://us-central1-bidhora.cloudfunctions.net/geniePayment

Body:
{
  "action": "verify",
  "paymentId": "PAYMENT_ID_HERE"
}
```

## Security Notes

✅ **Secure:**
- API keys stored server-side in Firebase Functions config
- Not exposed to browser/client
- CORS handled by Cloud Function

❌ **Do NOT:**
- Commit API keys to git
- Store credentials in frontend .env (only use for testing)
- Bypass the Cloud Function in production

## Production Checklist

- [ ] Deploy Cloud Function to Firebase
- [ ] Set Firebase Functions config with Genie credentials
- [ ] Update `VITE_GENIE_CLOUD_FUNCTION_URL` in production environment
- [ ] Remove Genie API keys from frontend `.env` (they're not needed anymore)
- [ ] Test payment flow end-to-end
- [ ] Monitor Cloud Function logs for errors

## Monitoring

View Cloud Function logs:
```bash
firebase functions:log --only geniePayment
```

Or in Firebase Console:
1. Go to Firebase Console > Functions
2. Click on `geniePayment` function
3. View logs and metrics

## Cost Considerations

Firebase Cloud Functions pricing:
- Free tier: 2M invocations/month
- Each payment initiation = 1 invocation
- Each payment verification = 1 invocation
- Estimate: ~2 invocations per successful payment

## Next Steps

1. Deploy the Cloud Function
2. Test with small amount (100 LKR)
3. Verify payment appears in Genie dashboard
4. Integrate with actual payment pages (deposit & final payment)
5. Set up webhook handling for payment notifications
