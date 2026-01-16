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
  success?: boolean;
  status?: string;
  paymentId: string;
  transactionId?: string;
  orderId: string;
  amount: string;
  currency: string;
  state?: string;
  redirectUrl?: string;
  shortUrl?: string;
  expires?: string;
}

class GeniePaymentService {
  private applicationId: string;
  private apiKey: string;
  private publicKey: string;
  private cloudFunctionUrl: string;
  private defaultEnvironment: 'production' | 'uat';

  constructor() {
    // Genie Payment Gateway credentials
    this.applicationId = import.meta.env.VITE_GENIE_APPLICATION_ID || '';
    this.apiKey = import.meta.env.VITE_GENIE_API_KEY || '';
    this.publicKey = import.meta.env.VITE_GENIE_PUBLIC_KEY || '';
    // Cloud Function URL for proxying Genie API calls (bypasses CORS)
    this.cloudFunctionUrl = import.meta.env.VITE_GENIE_CLOUD_FUNCTION_URL || 
      'https://geniepayment-e7fpchtlna-uc.a.run.app';
    
    // Set default environment from .env
    this.defaultEnvironment = (import.meta.env.VITE_PAYMENT_ENVIRONMENT as 'production' | 'uat') || 'production';
  }

  /**
   * Initiate payment with Genie via Cloud Function
   * @param config Payment configuration
   * @param environment 'production' or 'uat' - defaults to setting in .env
   */
  async initiatePayment(
    config: GeniePaymentConfig, 
    environment: 'production' | 'uat' = this.defaultEnvironment
  ): Promise<GeniePaymentResponse> {
    try {
      console.log('🚀 Initiating Genie payment:', {
        orderId: config.orderId,
        amount: config.amount,
        currency: config.currency,
        applicationId: this.applicationId,
        environment,
      });

      // Call Cloud Function instead of Genie API directly (bypasses CORS)
      const response = await fetch(this.cloudFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'initiate',
          environment,
          paymentData: {
            amount: config.amount,
            currency: config.currency,
            orderId: config.orderId,
            description: config.description,
            customerEmail: config.customerEmail,
            customerName: config.customerName,
            customerPhone: config.customerPhone,
            returnUrl: config.returnUrl,
            cancelUrl: config.cancelUrl,
            notifyUrl: config.notifyUrl,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Cloud Function Error:', errorData);
        throw new Error(errorData.error || errorData.message || `Payment initiation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('✅ Genie payment initiated:', {
        paymentId: result.paymentId,
        orderId: result.orderId,
        redirectUrl: result.redirectUrl
      });

      return {
        status: result.status || 'pending',
        paymentId: result.paymentId,
        orderId: result.orderId,
        amount: result.amount,
        currency: result.currency,
        redirectUrl: result.redirectUrl,
      };
    } catch (error) {
      console.error('❌ Genie payment error:', error);
      throw error;
    }
  }

  /**
   * Verify payment status via Cloud Function
   * @param paymentId Transaction/Payment ID to verify
   * @param environment 'production' or 'uat' - defaults to setting in .env
   */
  async verifyPayment(
    paymentId: string, 
    environment: 'production' | 'uat' = this.defaultEnvironment
  ): Promise<{ status: string; orderId: string }> {
    try {
      console.log('🔍 Verifying payment:', { paymentId, environment });

      const response = await fetch(this.cloudFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify',
          environment,
          paymentId: paymentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Payment verification failed');
      }

      const result = await response.json();
      
      console.log('✅ Payment verified:', {
        paymentId: paymentId,
        status: result.status,
        orderId: result.orderId
      });

      return {
        status: result.status,
        orderId: result.orderId,
      };
    } catch (error) {
      console.error('❌ Payment verification error:', error);
      throw error;
    }
  }

  /**
   * Check if credentials are configured
   */
  isConfigured(): boolean {
    return !!(this.applicationId && this.apiKey);
  }

  // ============================================
  // FINAL PAYMENT METHODS (90% Remaining Balance)
  // ============================================

  /**
   * Initialize final payment for a project
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

      // New flow: use finalPartPrice if set (from final part approval), otherwise fallback to adminPrice
      const finalPaymentAmount = projectData.finalPartPrice || projectData.adminPrice || 0;

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
        amount: finalPaymentAmount,
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
   * Process final payment
   * @param paymentData Final payment data
   * @param environment 'production' or 'uat' - defaults to setting in .env
   */
  async processFinalPayment(
    paymentData: FinalPaymentData,
    environment: 'production' | 'uat' = this.defaultEnvironment
  ): Promise<PaymentResult> {
    try {
      console.log('💳 Processing final payment:', {
        projectId: paymentData.projectId,
        amount: paymentData.amount,
        buyer: paymentData.buyerEmail,
        environment,
      });

      // Real Genie payment
      const order_id = `FINAL_${paymentData.projectId}_${Date.now()}`;
      const baseUrl = window.location.origin;

      const paymentConfig: GeniePaymentConfig = {
        merchantId: '',
        apiKey: '',
        orderId: order_id,
        amount: paymentData.amount.toFixed(2),
        currency: 'LKR',
        description: `Final Payment - ${paymentData.projectTitle}`,
        customerEmail: paymentData.buyerEmail,
        customerName: paymentData.buyerName,
        customerPhone: '',
        returnUrl: `${baseUrl}/payment/final/${paymentData.projectId}?status=success`,
        cancelUrl: `${baseUrl}/payment/final/${paymentData.projectId}?status=cancelled`,
        notifyUrl: import.meta.env.VITE_GENIE_WEBHOOK_URL || `https://geniewebhook-e7fpchtlna-uc.a.run.app`,
      };

      console.log('💳 Initiating Genie payment for final payment:', {
        order_id,
        amount: paymentConfig.amount,
        environment,
      });

      const result = await this.initiatePayment(paymentConfig, environment);

      console.log('✅ Genie payment initiated:', result);

      // Redirect to payment page
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }

      return {
        success: true,
        message: 'Redirecting to payment gateway...',
        transactionId: result.paymentId,
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
      
      // New flow: finalPartPrice is set when admin approves final part submission
      // Fallback to adminPrice for legacy projects
      const finalPaymentAmount = data.finalPartPrice || data.adminPrice || 0;

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
        finalPartPrice: data.finalPartPrice,
        hasFinalPartDocuments: !!data.finalPartDocuments,
        finalPartDocumentsCount: data.finalPartDocuments?.length || 0,
        hasDocuments: !!data.documents,
        documentsCount: data.documents?.length || 0,
      });

      // For final part submissions, use finalPartDocuments; otherwise fall back to documents
      let documentsToReturn = data.finalPartDocuments || data.documents || [];
      
      // If no documents found on project, try to fetch from the final part submission
      // This handles cases where finalPartDocuments wasn't stored during approval (older approvals)
      if (documentsToReturn.length === 0) {
        console.log('📁 No documents on project, searching for final part submission...');
        try {
          // Query projectSubmissions for the final part of this project
          const { collection: firestoreCollection, query: firestoreQuery, where, getDocs, orderBy, limit } = await import('firebase/firestore');
          const submissionsQuery = firestoreQuery(
            firestoreCollection(db, 'projectSubmissions'),
            where('projectId', '==', projectId),
            where('isFinal', '==', true),
            where('status', '==', 'approved'),
            orderBy('submittedAt', 'desc'),
            limit(1)
          );
          const submissionsSnapshot = await getDocs(submissionsQuery);
          
          if (!submissionsSnapshot.empty) {
            const finalPartData = submissionsSnapshot.docs[0].data();
            if (finalPartData.documents && finalPartData.documents.length > 0) {
              documentsToReturn = finalPartData.documents;
              console.log('✅ Found documents from final part submission:', documentsToReturn.length);
              
              // Also update the project with these documents for future use
              await updateDoc(projectRef, {
                finalPartDocuments: finalPartData.documents
              });
              console.log('✅ Updated project with finalPartDocuments');
            }
          } else {
            console.log('⚠️ No approved final part submission found');
          }
        } catch (err) {
          console.error('Error fetching final part submission documents:', err);
        }
      }
      
      console.log('📁 Documents to return:', {
        hasFinalPartDocuments: !!data.finalPartDocuments,
        hasDocuments: !!data.documents,
        finalPartDocumentsCount: data.finalPartDocuments?.length,
        documentsCount: data.documents?.length,
        usingDocuments: documentsToReturn,
        documentsToReturnCount: documentsToReturn.length,
      });

      const returnObject = {
        projectId,
        projectTitle: data.title,
        description: data.description,
        totalAmount: finalPaymentAmount,
        finalPayment: finalPaymentAmount, // Final payment is the finalPartPrice (no percentage split)
        initialPaymentStatus: data.initialPaymentStatus,
        finalPaymentStatus: data.finalPaymentStatus,
        finalPaymentId: data.finalPaymentId,
        documents: documentsToReturn,
        downloadUrl: data.downloadUrl,
        buyerEmail: data.buyerEmail || data.createdBy,
        createdBy: projectOwnerId, // Use calculated owner ID (buyerId || createdBy)
        buyerId: projectOwnerId, // CRITICAL FIX: Return the same calculated owner ID, not raw data
        adminReviewStatus: data.adminReviewStatus,
        status: data.status,
        customerRating: data.customerRating,
        customerReview: data.customerReview,
        customerReviewedAt: data.customerReviewedAt,
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
