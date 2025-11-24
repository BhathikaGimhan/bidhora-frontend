# Genie Payment Gateway Integration

## Overview
Bidhora platform now supports Genie Payment Gateway with both **Production** and **UAT (Testing)** environments.

## Architecture
```
Frontend (React) 
    ↓ HTTPS Request
Cloud Function (Firebase Gen 2) - CORS Proxy
    ↓ HTTPS Request with Auth
Genie Payment API (Production or UAT)
```

## Environments

### Production Environment
- **API Base URL**: `https://api.geniebiz.lk`
- **Transaction URL**: `https://transaction.geniebiz.lk`
- **Application ID**: `e6092ac4-3dba-466c-b0a7-137566fd81af`
- **API Key**: `eyJhbGci...` (stored in Cloud Function)
- **Test Page**: https://bidhora.web.app/test-genie-payment

### UAT/Testing Environment
- **API Base URL**: `https://api.uat.geniebiz.lk`
- **Transaction URL**: `https://transaction.uat.geniebiz.lk`
- **Application ID**: `36bafce7-a201-429b-a9e2-c5b78546677c`
- **API Key**: `eyJhbGci...` (stored in Cloud Function)
- **Test Page**: https://bidhora.web.app/test-genie-payment-uat

## Cloud Function
**URL**: https://geniepayment-e7fpchtlna-uc.a.run.app

### Request Format
```json
{
  "action": "initiate" | "verify",
  "environment": "production" | "uat",
  "paymentData": {
    "amount": "1000",
    "currency": "LKR",
    "orderId": "ORDER_123",
    "description": "Payment description",
    "customerEmail": "customer@example.com",
    "customerName": "John Doe",
    "customerPhone": "0771234567",
    "returnUrl": "https://example.com/success",
    "cancelUrl": "https://example.com/cancel",
    "notifyUrl": "https://example.com/webhook"
  }
}
```

### Response Format
```json
{
  "success": true,
  "paymentId": "6923e155fef786cab0acad40",
  "transactionId": "6923e155fef786cab0acad40",
  "orderId": "ORDER_123",
  "amount": "1000.00",
  "currency": "LKR",
  "state": "INITIATED",
  "redirectUrl": "https://transaction.geniebiz.lk/...",
  "shortUrl": "https://paylink.geniebiz.lk/...",
  "expires": "2025-12-01T04:38:45.757Z"
}
```

## Test Credentials

### Test Card
- **Number**: 4111 1111 1111 1111
- **CVV**: 123
- **Expiry**: 12/25
- **Name**: Test User

### Test Mobile Wallet
- **Number**: 0771234567
- **PIN**: 1234

## Usage in Code

### Initiate Payment
```typescript
import { geniePaymentService } from '@/Services/geniePaymentService';

const config = {
  merchantId: '', // Not used
  apiKey: '', // Not used
  amount: '1000',
  currency: 'LKR',
  orderId: 'ORDER_123',
  description: 'Project Deposit',
  customerEmail: 'buyer@example.com',
  customerName: 'John Doe',
  customerPhone: '0771234567',
  returnUrl: `${window.location.origin}/payment-success`,
  cancelUrl: `${window.location.origin}/payment-cancel`,
  notifyUrl: `${window.location.origin}/api/payment-notify`,
};

// Production payment
const response = await geniePaymentService.initiatePayment(config, 'production');

// UAT/Test payment
const response = await geniePaymentService.initiatePayment(config, 'uat');

// Redirect user to payment page
window.location.href = response.redirectUrl;
```

### Verify Payment
```typescript
// Production verification
const result = await geniePaymentService.verifyPayment(paymentId, 'production');

// UAT verification
const result = await geniePaymentService.verifyPayment(paymentId, 'uat');
```

## Files Modified

### Cloud Function
- **File**: `functions/index.js` (lines 950-1135)
- **Features**:
  - Environment switching (production/uat)
  - Separate credentials for each environment
  - CORS proxy to bypass browser restrictions
  - Request/response transformation
  - Error handling and logging

### Service Layer
- **File**: `src/Services/geniePaymentService.ts`
- **Features**:
  - `initiatePayment(config, environment)` - Start payment transaction
  - `verifyPayment(paymentId, environment)` - Check payment status
  - `getTestCredentials()` - Get sandbox test data
  - `isConfigured()` - Check if credentials are set

### Test Pages
1. **Production**: `src/pages/GeniePaymentTest.tsx`
   - Route: `/test-genie-payment`
   - Uses production API

2. **UAT**: `src/pages/GeniePaymentUATTest.tsx`
   - Route: `/test-genie-payment-uat`
   - Uses UAT API
   - Yellow warning banner for distinction

### Security Configuration
- **firebase.json**: CSP headers for Cloud Function URL
- **index.html**: Meta CSP tag for Cloud Function URL
- **vite.config.ts**: Dev server CSP for Cloud Function URL

## Deployment

### Deploy Cloud Function
```bash
firebase deploy --only functions:geniePayment
```

### Deploy Frontend
```bash
npm run build
firebase deploy --only hosting
```

## Testing

### 1. Test UAT Environment
Visit: https://bidhora.web.app/test-genie-payment-uat

1. Fill in payment details (amount: 1000 LKR)
2. Click "Initiate Payment"
3. Copy the payment ID from response
4. Click "Open Payment Page" to complete payment with test credentials
5. Paste payment ID in "Verify Payment" section
6. Click "Verify Payment" to check status

### 2. Test Production Environment
Visit: https://bidhora.web.app/test-genie-payment

Follow same steps as UAT testing.

### 3. Command Line Testing
```bash
# Test UAT
curl -X POST https://geniepayment-e7fpchtlna-uc.a.run.app \
  -H "Content-Type: application/json" \
  -d '{
    "action": "initiate",
    "environment": "uat",
    "paymentData": {
      "amount": "1000",
      "currency": "LKR",
      "orderId": "TEST_123",
      "description": "Test",
      "customerEmail": "test@example.com",
      "customerName": "Test User",
      "returnUrl": "https://bidhora.web.app/success",
      "cancelUrl": "https://bidhora.web.app/cancel",
      "notifyUrl": "https://bidhora.web.app/notify"
    }
  }'

# Test Production
curl -X POST https://geniepayment-e7fpchtlna-uc.a.run.app \
  -H "Content-Type: application/json" \
  -d '{
    "action": "initiate",
    "environment": "production",
    "paymentData": { ... }
  }'
```

## Integration with Real Flows

### Project Deposit Payment
File: `src/pages/ProjectDepositPaymentPage.tsx`

```typescript
const response = await geniePaymentService.initiatePayment({
  merchantId: '',
  apiKey: '',
  amount: depositAmount.toString(),
  currency: 'LKR',
  orderId: `DEPOSIT_${projectId}_${Date.now()}`,
  description: `Deposit for ${projectTitle}`,
  customerEmail: buyerEmail,
  customerName: buyerName,
  customerPhone: buyerPhone,
  returnUrl: `${window.location.origin}/payment-success?projectId=${projectId}`,
  cancelUrl: `${window.location.origin}/payment-cancel`,
  notifyUrl: `${window.location.origin}/api/payment-notify`,
}, 'production'); // Use 'production' for real payments

window.location.href = response.redirectUrl;
```

### Final Payment
File: `src/pages/FinalPaymentPage.tsx`

Similar integration pattern as deposit payment.

## Troubleshooting

### "Unauthorized" Error in UAT
- **Cause**: Wrong credentials for UAT environment
- **Solution**: Cloud Function now has correct UAT credentials hardcoded
- **Credentials**: App ID `36bafce7...`, API Key `eyJhbGci...`

### CSP Violations
- **Cause**: Cloud Function URL not in Content Security Policy
- **Solution**: Already configured in firebase.json, index.html, vite.config.ts

### CORS Errors
- **Cause**: Direct API calls from browser to Genie API
- **Solution**: All requests go through Cloud Function proxy

## API Documentation
Genie API Documentation: https://geniebusiness.stoplight.io/docs/genie-business-connect

## Next Steps
- [ ] Integrate with real deposit payment flow
- [ ] Integrate with real final payment flow
- [ ] Set up webhook handler for payment notifications
- [ ] Add payment history tracking
- [ ] Implement refund functionality
- [ ] Add comprehensive error handling
