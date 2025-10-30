// Genie Payment Gateway Service
// Handles Genie Business payment integration

export interface GeniePaymentConfig {
  merchantId: string;
  apiKey: string;
  amount: string;
  currency: string;
  orderId: string;
  description: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}

export interface GeniePaymentResponse {
  status: string;
  paymentId: string;
  orderId: string;
  amount: string;
  currency: string;
  redirectUrl?: string;
}

class GeniePaymentService {
  private merchantId: string;
  private apiKey: string;
  private baseUrl: string;
  private isSandbox: boolean;

  constructor() {
    // Genie Payment Gateway credentials
    this.merchantId = import.meta.env.VITE_GENIE_MERCHANT_ID || '';
    this.apiKey = import.meta.env.VITE_GENIE_API_KEY || '';
    this.isSandbox = import.meta.env.VITE_GENIE_SANDBOX === 'true' || true;
    this.baseUrl = this.isSandbox 
      ? 'https://test-payment.geniebiz.lk/api'
      : 'https://payment.geniebiz.lk/api';
  }

  /**
   * Initiate payment with Genie
   */
  async initiatePayment(config: GeniePaymentConfig): Promise<GeniePaymentResponse> {
    try {
      console.log('🚀 Initiating Genie payment:', {
        orderId: config.orderId,
        amount: config.amount,
        currency: config.currency,
        merchantId: this.merchantId,
        sandbox: this.isSandbox
      });

      const paymentData = {
        merchant_id: this.merchantId,
        api_key: this.apiKey,
        order_id: config.orderId,
        amount: config.amount,
        currency: config.currency,
        description: config.description,
        customer_email: config.customerEmail,
        customer_name: config.customerName,
        customer_phone: config.customerPhone || '',
        return_url: config.returnUrl,
        cancel_url: config.cancelUrl,
        notify_url: config.notifyUrl,
      };

      const response = await fetch(`${this.baseUrl}/payment/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment initiation failed');
      }

      const result = await response.json();
      
      console.log('✅ Genie payment initiated:', {
        paymentId: result.payment_id,
        orderId: result.order_id,
        redirectUrl: result.redirect_url
      });

      return {
        status: result.status,
        paymentId: result.payment_id,
        orderId: result.order_id,
        amount: result.amount,
        currency: result.currency,
        redirectUrl: result.redirect_url,
      };
    } catch (error) {
      console.error('❌ Genie payment error:', error);
      throw error;
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(paymentId: string): Promise<{ status: string; orderId: string }> {
    try {
      console.log('🔍 Verifying payment:', paymentId);

      const response = await fetch(`${this.baseUrl}/payment/verify/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      const result = await response.json();
      
      console.log('✅ Payment verified:', {
        paymentId: result.payment_id,
        status: result.status,
        orderId: result.order_id
      });

      return {
        status: result.status,
        orderId: result.order_id,
      };
    } catch (error) {
      console.error('❌ Payment verification error:', error);
      throw error;
    }
  }

  /**
   * Get sandbox test credentials
   */
  getSandboxTestCredentials() {
    return {
      testCard: {
        number: '4111111111111111',
        cvv: '123',
        expiry: '12/25',
        name: 'Test User',
      },
      testMobileWallet: {
        number: '0771234567',
        pin: '1234',
      },
    };
  }

  /**
   * Check if running in sandbox mode
   */
  isSandboxMode(): boolean {
    return this.isSandbox;
  }
}

// Singleton instance
export const geniePaymentService = new GeniePaymentService();

// Export for testing
export default geniePaymentService;
