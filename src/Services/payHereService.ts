// PayHere Payment Gateway Service
// Handles PayHere sandbox integration for payments

import type { PayHereWindow, PayHere } from '../types/payhere';

export interface PayHereConfig {
  merchant_id: string;
  return_url: string | undefined; // undefined for JS SDK popup
  cancel_url: string | undefined; // undefined for JS SDK popup
  notify_url: string;
  order_id: string;
  items: string;
  currency: string;
  amount: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash?: string;
}

export interface PayHereResponse {
  status_code: number;
  status_message: string;
  payment_id: string;
  order_id: string;
  payhere_amount: string;
  payhere_currency: string;
  card_holder_name: string;
  card_no: string;
  method: string;
  md5sig?: string;
}

class PayHereService {
  private merchantId: string;
  private merchantSecret: string;
  private baseUrl: string;
  private isSandbox: boolean;

  constructor() {
    // PayHere Sandbox credentials - MUST match backend config
    this.merchantId = import.meta.env.VITE_PAYHERE_MERCHANT_ID; // Updated to match backend
    this.merchantSecret = import.meta.env.VITE_PAYHERE_MERCHANT_SECRET;
    this.isSandbox = import.meta.env.VITE_PAYHERE_SANDBOX === 'true' || true;
    this.baseUrl = this.isSandbox 
      ? 'https://sandbox.payhere.lk'
      : 'https://www.payhere.lk';
  }

  /**
   * Load PayHere.js script dynamically
   * NOTE: Same script URL for both sandbox and production mode
   * Sandbox/Production is controlled by the 'sandbox' flag in payment config
   */
  async loadPayHereScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if ((window as PayHereWindow).payhere) {
        console.log('✅ PayHere.js already loaded');
        resolve();
        return;
      }

      const script = document.createElement('script');
      // Same script for both sandbox and production (per PayHere documentation)
      script.src = 'https://www.payhere.lk/lib/payhere.js';
      script.async = true;
      script.onload = () => {
        console.log(`✅ PayHere.js loaded successfully (${this.isSandbox ? 'SANDBOX' : 'PRODUCTION'} mode)`);
        
        
        
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Failed to load PayHere.js');
        reject(new Error('Failed to load PayHere payment script'));
      };
      document.head.appendChild(script);
    });
  }

  
  
  /**
   * Show PayHere payment modal
   */
  async showPaymentModal(config: PayHereConfig): Promise<PayHereResponse> {
  return new Promise((resolve, reject) => {
    const payhere: PayHere | undefined = (window as PayHereWindow).payhere;

    if (!payhere) {
      console.error('❌ PayHere not loaded on window object');
      reject(new Error('PayHere not loaded'));
      return;
    }

    console.log('🚀 Starting PayHere payment with config:', {
      merchant_id: config.merchant_id,
      order_id: config.order_id,
      amount: config.amount,
      currency: config.currency,
      hash: config.hash?.substring(0, 10) + '...',
      sandbox: this.isSandbox,
      return_url: config.return_url,
      cancel_url: config.cancel_url
    });

    // 🧹 Helper to restore scroll and overlays
    const cleanupModalState = () => {
      observer.disconnect();
     
      console.log('🧹 PayHere modal state cleaned up');
    };

    // Helper to reposition PayHere modal to body (break out of nesting)
    const repositionPayHereModal = () => {
      const modalSelectors = ['#payhere-modal', '.payhere-modal-container', '[id*="payhere"]'];
      for (const selector of modalSelectors) {
        const modal = document.querySelector(selector) as HTMLElement | null;
        if (modal && modal.parentElement !== document.body) {
          console.log(`🔄 Repositioning PayHere modal (${selector}) to document.body to escape nesting`);
          document.body.appendChild(modal);
          modal.style.position = 'fixed';
          modal.style.top = '0';
          modal.style.left = '0';
          modal.style.width = '100vw';
          modal.style.height = '100vh';
          modal.style.zIndex = '2147483647';
          break;
        }
      }
    };

    // Use MutationObserver to detect when PayHere injects the modal
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          repositionPayHereModal();
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // ✅ Payment completed successfully
    payhere.onCompleted = (orderId: string) => {
      console.log('✅ Payment completed. OrderID:', orderId);
      cleanupModalState();

      resolve({
        order_id: orderId,
        status_code: 2,
        status_message: 'Payment completed',
        payment_id: '',
        payhere_amount: config.amount,
        payhere_currency: config.currency,
        card_holder_name: '',
        card_no: '',
        method: ''
      } as PayHereResponse);
    };

    // ⚠️ Payment dismissed
    payhere.onDismissed = () => {
      console.log('⚠️ Payment dismissed - user closed the window');
      cleanupModalState();
      reject(new Error('Payment window closed'));
    };

    // ❌ Payment error
    payhere.onError = (error: string) => {
      console.log('❌ Payment error:', error);
      cleanupModalState();
      reject(new Error('Payment failed: ' + error));
    };

    // 📤 Start payment
    const paymentData = {
      sandbox: this.isSandbox,
      ...config,
    };

    console.log('📤 Calling payhere.startPayment with sandbox:', this.isSandbox);

    
    // 🚀 Delay startPayment to ensure styles are applied
    setTimeout(() => {
      payhere.startPayment(paymentData);
      // Fallback poll in case observer misses
      const pollInterval = setInterval(repositionPayHereModal, 200);
      setTimeout(() => clearInterval(pollInterval), 5000); // Stop polling after 5s
    }, 100);
  });
}

  /**
   * Get sandbox test card numbers
   */
  getSandboxTestCards() {
    return {
      visa: {
        number: '4916217501611292',
        cvv: '123',
        expiry: '12/25',
        name: 'Test User',
      },
      mastercard: {
        number: '5307732125039318',
        cvv: '123',
        expiry: '12/25',
        name: 'Test User',
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
export const payHereService = new PayHereService();

// Export for testing
export default payHereService;