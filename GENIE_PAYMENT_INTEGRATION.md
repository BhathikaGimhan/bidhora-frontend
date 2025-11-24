# Genie Payment Gateway Integration Guide

## Overview
This document provides comprehensive instructions for integrating and testing the Genie Business payment gateway in the Bidhora platform.

## Table of Contents
1. [Setup & Configuration](#setup--configuration)
2. [Test Environment](#test-environment)
3. [API Integration](#api-integration)
4. [Testing Guide](#testing-guide)
5. [Production Deployment](#production-deployment)

---

## Setup & Configuration

### 1. Environment Variables

The `.env` file has been automatically configured with your Genie credentials:

```bash
# Genie Payment Gateway Configuration
VITE_GENIE_APPLICATION_ID=3a374c7d-f339-4a98-8491-44458c116be2
VITE_GENIE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GENIE_PUBLIC_KEY=pk_production_ZXlKaGJHY2lP...
```

✅ **Credentials are already configured!** You can skip this step.

To regenerate the `.env` file:
```bash
./setup-genie-env.sh
```

### 2. Genie Credentials Information

Your Dialog Genie Business application credentials:

- **Application Name**: Dialog genie business (Mobile charge App)
- **Application ID**: `3a374c7d-f339-4a98-8491-44458c116be2`
- **Currency**: LKR
- **Dashboard**: https://dashboard.geniebiz.lk
- **API Documentation**: https://geniebusiness.stoplight.io/

**Support**: genie.integration@dialog.lk

---

## Test Environment

### Accessing the Test Page

1. Start the development server:
```bash
npm run dev
```

2. Navigate to the test page:
```
http://localhost:8080/test-genie-payment
```

### Test Page Features

The test page (`/test-genie-payment`) provides:
- ✅ Payment initiation testing
- ✅ Payment verification testing
- ✅ Sandbox credentials display
- ✅ Real-time response visualization
- ✅ Configuration validation

---

## API Integration

### Payment Flow

```
┌─────────────┐
│   Customer  │
└──────┬──────┘
       │ 1. Initiates Payment
       ▼
┌─────────────────────┐
│  Bidhora Frontend   │
│ (GeniePaymentTest)  │
└──────┬──────────────┘
       │ 2. API Call
       ▼
┌─────────────────────┐
│ geniePaymentService │
└──────┬──────────────┘
       │ 3. HTTP Request
       ▼
┌─────────────────────┐
│  Genie Payment API  │
└──────┬──────────────┘
       │ 4. Payment Page URL
       ▼
┌─────────────────────┐
│  Customer Payment   │
│   (Genie Hosted)    │
└──────┬──────────────┘
       │ 5. Payment Complete
       ▼
┌─────────────────────┐
│  Webhook/Callback   │
│   (Return URL)      │
└─────────────────────┘
```

### Key API Endpoints

#### 1. Initiate Payment
```typescript
POST /api/payment/initiate

Headers:
- Content-Type: application/json
- Authorization: Bearer {API_KEY}

Body:
{
  "merchant_id": "YOUR_MERCHANT_ID",
  "api_key": "YOUR_API_KEY",
  "order_id": "UNIQUE_ORDER_ID",
  "amount": "1000.00",
  "currency": "LKR",
  "description": "Payment description",
  "customer_email": "customer@example.com",
  "customer_name": "Customer Name",
  "customer_phone": "0771234567",
  "return_url": "https://yourdomain.com/payment-success",
  "cancel_url": "https://yourdomain.com/payment-cancel",
  "notify_url": "https://yourdomain.com/api/payment-notify"
}

Response:
{
  "status": "pending",
  "payment_id": "PAY_123456789",
  "order_id": "UNIQUE_ORDER_ID",
  "amount": "1000.00",
  "currency": "LKR",
  "redirect_url": "https://payment.geniebiz.lk/pay/PAY_123456789"
}
```

#### 2. Verify Payment
```typescript
GET /api/payment/verify/{payment_id}

Headers:
- Content-Type: application/json
- Authorization: Bearer {API_KEY}

Response:
{
  "status": "success",  // or "pending", "failed"
  "order_id": "UNIQUE_ORDER_ID",
  "payment_id": "PAY_123456789",
  "amount": "1000.00",
  "currency": "LKR"
}
```

---

## Testing Guide

### Step-by-Step Testing

#### Step 1: Access Test Page
Navigate to `http://localhost:8080/test-genie-payment`

#### Step 2: Verify Configuration
Check the "Configuration" card at the bottom right to ensure:
- Merchant ID is set
- API Key is set (shown as ••••••••)
- Environment is "Sandbox"

#### Step 3: Initiate Test Payment

Fill in the test payment form:
```
Amount: 1000 (LKR)
Order ID: TEST_1234567890 (auto-generated)
Customer Name: Test Customer
Customer Email: test@example.com
Customer Phone: 0771234567
Description: Test Payment - Bidhora Platform
```

Click **"Initiate Payment"**

#### Step 4: Review Response

Successful response will show:
- ✅ Payment ID
- ✅ Order ID
- ✅ Amount & Currency
- ✅ Status (should be "pending")
- ✅ Redirect URL (if available)

#### Step 5: Complete Payment (if redirect available)

1. Click "Open Payment Page" button
2. Use sandbox test credentials:
   - **Test Card**: 4111111111111111
   - **CVV**: 123
   - **Expiry**: 12/25
   - **Name**: Test User

   OR

   - **Mobile Wallet**: 0771234567
   - **PIN**: 1234

#### Step 6: Verify Payment

1. Copy the Payment ID from the response
2. Paste it in the "Verify Payment" section
3. Click **"Verify Payment"**
4. Check the payment status

### Expected Results

#### Sandbox Mode (Development)
- No real money is charged
- Test credentials always work
- Instant payment confirmation
- All features available for testing

#### Production Mode (Live)
- Real money is charged
- Actual customer payment methods
- Real-time payment processing
- Compliance with payment regulations

---

## Integration Points

### 1. Project Deposit Payment (10%)
**File**: `src/pages/ProjectDepositPaymentPage.tsx`

When customer approves a priced project:
```typescript
// Calculate 10% deposit
const depositAmount = project.adminPrice * 0.1;

// Initiate payment
const config: GeniePaymentConfig = {
  amount: depositAmount.toString(),
  orderId: `DEP_${projectId}_${Date.now()}`,
  description: `Deposit for ${project.title}`,
  customerEmail: buyer.email,
  customerName: buyer.name,
  returnUrl: `${window.location.origin}/payment/project/${projectId}/success`,
  cancelUrl: `${window.location.origin}/payment/project/${projectId}/cancel`,
  notifyUrl: `${API_BASE_URL}/payment-webhook`
};

const response = await geniePaymentService.initiatePayment(config);
```

### 2. Final Payment (90%)
**File**: `src/pages/FinalPaymentPage.tsx`

After admin approves completed work:
```typescript
// Calculate 90% final payment
const finalAmount = project.adminPrice * 0.9;

// Initiate final payment
const config: GeniePaymentConfig = {
  amount: finalAmount.toString(),
  orderId: `FINAL_${projectId}_${Date.now()}`,
  description: `Final payment for ${project.title}`,
  customerEmail: buyer.email,
  customerName: buyer.name,
  returnUrl: `${window.location.origin}/payment/final/${projectId}/success`,
  cancelUrl: `${window.location.origin}/payment/final/${projectId}/cancel`,
  notifyUrl: `${API_BASE_URL}/payment-webhook`
};

const response = await geniePaymentService.initiatePayment(config);
```

---

## Production Deployment

### Pre-deployment Checklist

- [ ] Obtain production Genie credentials
- [ ] Update environment variables
- [ ] Set `VITE_GENIE_SANDBOX=false`
- [ ] Update return URLs to production domain
- [ ] Configure webhook endpoint
- [ ] Test with small amount first
- [ ] Implement error logging
- [ ] Set up payment monitoring
- [ ] Configure SSL/HTTPS
- [ ] Test all payment flows

### Environment Configuration

```bash
# Production .env
VITE_GENIE_MERCHANT_ID=prod_merchant_id
VITE_GENIE_API_KEY=prod_api_key
VITE_GENIE_SANDBOX=false
```

### Security Best Practices

1. **Never expose API keys** in client-side code
2. **Use HTTPS** for all payment pages
3. **Implement rate limiting** on payment endpoints
4. **Log all transactions** for audit trail
5. **Validate webhook signatures** (if supported)
6. **Store payment records** in Firestore
7. **Implement retry logic** for failed payments

---

## Troubleshooting

### Common Issues

#### 1. "Merchant ID not set"
**Solution**: Check `.env` file has `VITE_GENIE_MERCHANT_ID`

#### 2. "Payment initiation failed"
**Possible causes**:
- Invalid API credentials
- Network connectivity issues
- Incorrect API endpoint
- Invalid payment amount

**Solution**: Check browser console for detailed error messages

#### 3. "Payment verification failed"
**Solution**: Ensure payment ID is correct and payment was actually initiated

#### 4. "Redirect URL not working"
**Solution**: 
- Check if Genie returned a redirect URL
- Verify return URLs are whitelisted in Genie dashboard
- Ensure URLs use HTTPS in production

### Debug Mode

Enable detailed logging:
```typescript
// In geniePaymentService.ts
console.log('🚀 Payment request:', paymentData);
console.log('✅ Payment response:', result);
console.log('❌ Payment error:', error);
```

---

## Support

### Genie Business Support
- **Email**: genie.integration@dialog.lk
- **Documentation**: https://geniebusiness.stoplight.io/

### Bidhora Development Team
- Check the test page at `/test-genie-payment`
- Review console logs for detailed error messages
- Verify environment configuration

---

## Files Modified/Created

1. ✅ `src/Services/geniePaymentService.ts` - Payment service implementation
2. ✅ `src/pages/GeniePaymentTest.tsx` - Test page (NEW)
3. ✅ `src/Routes.tsx` - Added test route
4. ✅ `.env.example` - Environment configuration template
5. ✅ `GENIE_PAYMENT_INTEGRATION.md` - This documentation (NEW)

---

## Next Steps

1. **Configure credentials** - Add Genie credentials to `.env`
2. **Test sandbox** - Use `/test-genie-payment` to verify integration
3. **Integrate flows** - Connect to deposit and final payment pages
4. **Add webhooks** - Implement payment notification handling
5. **Production testing** - Test with production credentials
6. **Go live** - Deploy to production

---

**Last Updated**: November 21, 2025
**Version**: 1.0.0
