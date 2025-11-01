// Genie Payment Gateway Service
// Handles Genie Business payment integration and Final Payment processing

import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { emailService } from './emailService';

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

export interface FinalPaymentData {
  projectId: string;
  amount: number;
  buyerEmail: string;
  buyerName: string;
  projectTitle: string;
}

export interface PaymentResult {
  success: boolean;
  message: string;
  transactionId?: string;
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

  // ============================================
  // FINAL PAYMENT METHODS (90% Remaining Balance)
  // ============================================

  /**
   * Initialize final payment for a project (90% of total)
   * Sends email notification to buyer with payment link
   */
  async initiateFinalPayment(projectId: string): Promise<{ success: boolean; message: string; paymentLink?: string }> {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);

      if (!projectDoc.exists()) {
        return { success: false, message: 'Project not found' };
      }

      const projectData = projectDoc.data();

      // Check if project is approved by admin
      if (projectData.adminReviewStatus !== 'approved') {
        return { success: false, message: 'Project is not approved for final payment' };
      }

      // Check if final payment already made
      if (projectData.finalPaymentStatus === 'paid') {
        return { success: false, message: 'Final payment already completed' };
      }

      const finalPaymentAmount = (projectData.adminPrice || 0) * 0.9; // 90% of total

      // Update project with final payment pending status
      await updateDoc(projectRef, {
        finalPaymentStatus: 'pending',
        finalPaymentAmount: finalPaymentAmount,
      });

      // Generate payment link with production domain
      const paymentLink = `https://bidhora.com/payment/final/${projectId}`;

      // Get buyer details - support multiple field names for compatibility
      const buyerUid = projectData.createdBy || projectData.buyerId;
      let buyerEmail = projectData.buyerEmail;
      let buyerName = projectData.buyerName || 'Valued Customer';

      // If no buyerEmail, try to fetch from user document
      if (!buyerEmail && buyerUid) {
        try {
          const userRef = doc(db, 'users', buyerUid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            buyerEmail = userData.email;
            buyerName = userData.displayName || userData.firstName || buyerName;
          }
        } catch (error) {
          console.error('Error fetching buyer details:', error);
        }
      }

      // Fallback to UID if still no email (shouldn't happen, but safe)
      if (!buyerEmail) {
        console.warn('No buyer email found for project:', projectId);
        buyerEmail = buyerUid; // This might fail email validation, but at least we try
      }

      console.log('📧 Sending final payment notification:', {
        projectId,
        buyerEmail,
        buyerName,
        finalPaymentAmount,
      });

      // Send email notification to buyer
      await emailService.sendFinalPaymentNotification({
        to_email: buyerEmail,
        to_name: buyerName,
        project_title: projectData.title,
        project_id: projectId,
        total_price: projectData.adminPrice || 0,
        initial_payment: (projectData.adminPrice || 0) * 0.1,
        final_payment: finalPaymentAmount,
        payment_link: paymentLink,
      });

      return {
        success: true,
        message: 'Final payment notification sent to buyer',
        paymentLink,
      };
    } catch (error) {
      console.error('Error initiating final payment:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initiate final payment',
      };
    }
  }

  /**
   * Process final payment (Testing/Sandbox Mode)
   * This simulates payment processing for the remaining 90%
   */
  async processFinalPayment(paymentData: FinalPaymentData): Promise<PaymentResult> {
    try {
      console.log('💳 Processing final payment (Testing Mode):', {
        projectId: paymentData.projectId,
        amount: paymentData.amount,
        buyer: paymentData.buyerEmail,
      });

      // Simulate payment processing delay (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate a mock transaction ID for testing
      const transactionId = `TEST_FINAL_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;

      // Update project with payment completion
      const projectRef = doc(db, 'projects', paymentData.projectId);
      await updateDoc(projectRef, {
        finalPaymentStatus: 'paid',
        finalPaymentId: transactionId,
        finalPaymentAt: serverTimestamp(),
        status: 'completed',
      });

      console.log('✅ Final payment processed successfully:', {
        transactionId,
        projectId: paymentData.projectId,
      });

      return {
        success: true,
        message: 'Payment processed successfully (Testing Mode)',
        transactionId,
      };
    } catch (error) {
      console.error('❌ Error processing final payment:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  /**
   * Get project payment details for final payment
   */
  async getProjectPaymentDetails(projectId: string) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);

      if (!projectDoc.exists()) {
        console.log('❌ Project not found:', projectId);
        return null;
      }

      const data = projectDoc.data();
      const adminPrice = data.adminPrice || 0;

      // Support both createdBy and buyerId fields for backwards compatibility
      // Prioritize buyerId since that's what PostProject.tsx uses consistently
      const projectOwnerId = data.buyerId || data.createdBy;

      console.log('📊 Project payment details fetched:', {
        projectId,
        title: data.title,
        createdBy: data.createdBy,
        buyerId: data.buyerId,
        projectOwnerId,
        buyerEmail: data.buyerEmail,
        status: data.status,
        adminReviewStatus: data.adminReviewStatus,
        finalPaymentStatus: data.finalPaymentStatus,
        hasDocuments: !!(data.finalPaymentDocuments || data.documents),
      });

      const returnObject = {
        projectId,
        projectTitle: data.title,
        totalAmount: adminPrice,
        initialPayment: adminPrice * 0.1,
        finalPayment: adminPrice * 0.9,
        initialPaymentStatus: data.initialPaymentStatus,
        finalPaymentStatus: data.finalPaymentStatus,
        finalPaymentId: data.finalPaymentId,
        documents: data.documents || [],
        downloadUrl: data.downloadUrl,
        buyerEmail: data.buyerEmail || data.createdBy,
        createdBy: projectOwnerId, // Use calculated owner ID (buyerId || createdBy)
        buyerId: projectOwnerId, // CRITICAL FIX: Return the same calculated owner ID, not raw data
        adminReviewStatus: data.adminReviewStatus,
        status: data.status,
      };

      console.log('📤 RETURNING FROM SERVICE:', {
        returnObjectKeys: Object.keys(returnObject),
        createdBy: returnObject.createdBy,
        buyerId: returnObject.buyerId,
        projectOwnerId: projectOwnerId,
        allEqual: returnObject.createdBy === returnObject.buyerId && returnObject.buyerId === projectOwnerId,
        fullReturnObject: JSON.parse(JSON.stringify(returnObject)),
      });

      return returnObject;
    } catch (error) {
      console.error('Error fetching payment details:', error);
      return null;
    }
  }
}

// Singleton instance
export const geniePaymentService = new GeniePaymentService();

// Export for testing
export default geniePaymentService;
