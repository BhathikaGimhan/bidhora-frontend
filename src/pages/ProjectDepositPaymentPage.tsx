import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { auth, db } from "@/firebaseConfig";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Loader2,
  Lock,
  CreditCard,
  Shield,
  ArrowLeft,
  AlertCircle,
  DollarSign,
  Calendar,
  FileText,
  Mail,
  Download,
} from "lucide-react";
import geniePaymentService from "@/Services/geniePaymentService";
import type { GeniePaymentConfig } from "@/Services/geniePaymentService";
import type { Project } from "@/Services/projectService";
import { InvoiceService } from "@/Services/invoiceService";
import { useToast } from "@/hooks/use-toast";

// Firebase Functions API base URL
const API_BASE_URL = "https://api-e7fpchtlna-uc.a.run.app";

export default function ProjectDepositPaymentPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const invoiceDownloaded = React.useRef(false);

  const fetchProjectInfo = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      console.log("🔍 Checking authentication:", {
        hasUser: !!user,
        userId: user?.uid,
        userEmail: user?.email
      });
      
      if (!user) {
        console.log("❌ No authenticated user found");
        setError("Authentication required");
        return;
      }

      if (!projectId) {
        setError("Project ID is required");
        return;
      }

      console.log("📂 Fetching project:", projectId);
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      if (!projectDoc.exists()) {
        setError("Project not found");
        return;
      }

      const projectData = projectDoc.data() as Project;
      
      // Support both createdBy and buyerId fields
      // Prioritize buyerId since that's what PostProject.tsx uses consistently
      const projectOwnerId = (projectData as any).buyerId || projectData.createdBy;
      
      console.log("✅ Project found:", {
        projectId,
        createdBy: projectData.createdBy,
        buyerId: (projectData as any).buyerId,
        projectOwnerId,
        currentUser: user.uid,
        isOwner: projectOwnerId === user.uid,
        status: projectData.status,
        initialPaymentStatus: projectData.initialPaymentStatus
      });

      // Verify user is the project owner
      if (projectOwnerId !== user.uid) {
        console.log("❌ Authorization failed: User is not project owner");
        setError("You are not authorized to make payment for this project");
        return;
      }
      console.log("✅ Authorization check passed");

      // Verify project is in priced status (or ready_to_assign for mock re-testing)
      if (projectData.status !== "priced" && projectData.status !== "ready_to_assign") {
        console.log("❌ Status check failed:", projectData.status);
        setError("This project is not ready for payment");
        return;
      }
      console.log("✅ Status check passed");

      // Check if payment is already completed - this is fine, just show success page
      if (projectData.initialPaymentStatus === "paid") {
        console.log("✅ Payment already completed - showing success page");
      } else {
        console.log("✅ Payment status check passed");
      }

      console.log("✅ All checks passed, loading project data");
      setProject({ ...projectData, id: projectId });
    } catch (err) {
      console.error("❌ Error fetching project info:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load project information"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🔄 Auth state change listener mounted");
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("🔐 Auth state changed:", {
        hasUser: !!user,
        userId: user?.uid,
        email: user?.email
      });
      setAuthChecked(true);
      if (user) {
        console.log("✅ User authenticated, fetching project info");
        fetchProjectInfo();
      } else {
        console.log("❌ No user authenticated");
        setError("Please sign in to access this payment page");
        setLoading(false);
      }
    });
    return () => {
      console.log("🧹 Cleaning up auth listener");
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Handle payment callback from Genie
  useEffect(() => {
    const handlePaymentCallback = async () => {
      const status = searchParams.get('status');
      
      if (!status || !projectId || !project) return;

      console.log('💳 Payment callback received:', { status, projectId });

      if (status === 'success') {
        try {
          console.log('✅ Payment successful, verifying with backend...');
          
          const verifyUrl = import.meta.env.VITE_GENIE_VERIFY_PAYMENT_URL || 
            'https://verifypayment-e7fpchtlna-uc.a.run.app';
          
          // Call backend to verify payment instead of directly updating Firestore
          const response = await fetch(verifyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId,
              paymentType: 'deposit',
            }),
          });

          console.log('📡 Verification response status:', response.status);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Verification failed:', errorData);
            throw new Error(errorData.error || 'Payment verification failed');
          }

          const result = await response.json();
          
          console.log('✅ Payment verified by backend:', result);
          
          if (result.isPaid) {
            // Payment confirmed
            console.log('✅ Payment confirmed as paid');
            setError(''); // Clear any errors
          } else {
            // Payment not yet confirmed - webhook might still be processing
            console.log('⏳ Payment not yet confirmed by webhook, will retry...');
            setError('Payment is being processed. Please wait a moment and refresh the page if status does not update.');
          }
          
          // Clear URL params and reload project info
          navigate(`/payment/project/${projectId}`, { replace: true });
          
          // Refresh project data to show updated status
          await fetchProjectInfo();
          
        } catch (error) {
          console.error('❌ Error verifying payment:', error);
          setError(`Payment was successful but verification is pending. ${error instanceof Error ? error.message : 'Please refresh the page in a few moments or contact support if the issue persists.'}`);
        }
      } else if (status === 'cancelled') {
        console.log('⚠️ Payment was cancelled by user');
        setError('Payment was cancelled. You can try again when ready.');
        
        // Clear URL params
        navigate(`/payment/project/${projectId}`, { replace: true });
      }
    };

    if (authChecked && projectId && project) {
      handlePaymentCallback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, projectId, authChecked, project]);

  // Automatically download invoice when payment is successful
  useEffect(() => {
    if (
      project?.initialPaymentStatus === 'paid' && 
      project.initialPaymentId && 
      auth.currentUser &&
      !invoiceDownloaded.current
    ) {
      invoiceDownloaded.current = true;
      
      // Download invoice asynchronously
      (async () => {
        try {
          // Use the invoice number from Firestore (same as email) or generate if missing
          const invoiceNumber = (project as any).depositInvoiceNumber || 
            InvoiceService.generateInvoiceNumber('deposit', projectId!);
          
          const invoiceData = {
            invoiceNumber,
            invoiceDate: new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            paymentType: 'deposit' as const,
            projectId: projectId!,
            projectTitle: project.title,
            projectDescription: project.description,
            buyerName: auth.currentUser.displayName || auth.currentUser.email || 'Customer',
            buyerEmail: auth.currentUser.email!,
            amount: project.initialPaymentAmount || (project.adminPrice! * 0.1),
            currency: 'LKR',
            transactionId: project.initialPaymentId,
            paymentMethod: 'Genie Payment Gateway',
            totalProjectAmount: project.adminPrice,
            depositPercentage: 10,
          };

          await InvoiceService.downloadInvoice(invoiceData);
          toast({
            title: 'Invoice Downloaded',
            description: 'Your payment invoice has been downloaded successfully.',
          });
        } catch (error) {
          console.error('Error downloading invoice:', error);
        }
      })();
    }
  }, [project, projectId, toast]);


  const handlePaymentSuccess = async (orderId: string) => {
    try {
      if (!projectId) return;

      console.log("💾 Verifying payment with backend:", {
        projectId,
        orderId,
        paymentType: "deposit"
      });

      const verifyUrl = import.meta.env.VITE_GENIE_VERIFY_PAYMENT_URL || 
        'https://verifypayment-e7fpchtlna-uc.a.run.app';

      // Call backend to verify and update payment status
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          paymentType: 'deposit',
        }),
      });

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      const result = await response.json();
      console.log("✅ Payment verified successfully:", result);

      // Refresh project info to show paid status
      await fetchProjectInfo();
      
      console.log("✅ Project info refreshed from Firestore");
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw error;
    }
  };

  const handlePayNow = async () => {
    try {
      if (!project || !project.initialPaymentAmount || !project.id) {
        console.error("❌ Missing project data:", {
          hasProject: !!project,
          hasAmount: !!project?.initialPaymentAmount,
          hasId: !!project?.id,
        });
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in to continue");
        return;
      }

      // Proceed with real Genie payment
      setProcessingPayment(true);

      // Fetch user details from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      const order_id = `DEPOSIT_${project.id}_${Date.now()}`;
      const baseUrl = window.location.origin;

      // Prepare Genie payment configuration
      const paymentConfig: GeniePaymentConfig = {
        merchantId: import.meta.env.VITE_GENIE_MERCHANT_ID || '',
        apiKey: import.meta.env.VITE_GENIE_API_KEY || '',
        orderId: order_id,
        amount: project.initialPaymentAmount.toFixed(2),
        currency: "LKR", // Genie uses LKR
        description: `Project Deposit - ${project.title}`,
        customerEmail: user.email || "",
        customerName: userData?.firstName && userData?.lastName 
          ? `${userData.firstName} ${userData.lastName}`
          : user.displayName || "Customer",
        customerPhone: userData?.phoneNumber || "",
        returnUrl: `${baseUrl}/payment/project/${project.id}?status=success`,
        cancelUrl: `${baseUrl}/payment/project/${project.id}?status=cancelled`,
        notifyUrl: import.meta.env.VITE_GENIE_WEBHOOK_URL || `https://geniewebhook-e7fpchtlna-uc.a.run.app`,
      };

      console.log("💳 Starting Genie payment process for project deposit:", {
        order_id,
        amount: paymentConfig.amount,
        projectTitle: project.title,
        environment: 'Production',
      });

      // Initiate payment with Genie (uses environment from service)
      const result = await geniePaymentService.initiatePayment(
        paymentConfig
      );
      
      console.log("✅ Payment initiated:", result);

      // Redirect to Genie payment page
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        throw new Error("No redirect URL received from payment gateway");
      }
    } catch (error) {
      console.error("❌ Payment error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Payment failed. Please try again.");
      }
    } finally {
      setProcessingPayment(false);
    }
  };

  if (!authChecked || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes("sign in") || error.includes("Authentication");
    
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>{isAuthError ? "Authentication Required" : "Error"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-6 flex gap-3">
              {isAuthError ? (
                <>
                  <Button 
                    onClick={() => {
                      const returnUrl = encodeURIComponent(window.location.pathname);
                      navigate(`/auth?redirect=${returnUrl}`);
                    }}
                    className="flex-1"
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/")}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Home
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                    className="flex-1"
                  >
                    Refresh Page
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/")}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go to Home
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  // Payment already completed
  if (project.initialPaymentStatus === "paid") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center space-x-2 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
              <CardTitle className="text-2xl">Payment Completed!</CardTitle>
            </div>
            <CardDescription>
              Your deposit payment has been successfully processed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-emerald-50 border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">
                Thank you for your payment! Our admin will now assign an employee to your project.
              </AlertDescription>
            </Alert>

            <Alert className="bg-blue-50 border-blue-200">
              <Mail className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="font-medium">Invoice emailed to your registered email address</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Download className="h-3.5 w-3.5" />
                    <span className="font-medium">Invoice automatically downloaded to your device</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Project</p>
                  <p className="text-sm text-muted-foreground">{project.title}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start space-x-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Deposit Paid</p>
                  <p className="text-lg font-semibold text-emerald-600">
                    LKR {project.initialPaymentAmount?.toFixed(2)}
                  </p>
                </div>
              </div>

              {project.initialPaymentId && (
                <>
                  <Separator />
                  <div className="flex items-start space-x-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Payment ID</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {project.initialPaymentId}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="pt-4 space-y-3">
              <Button onClick={() => navigate(`/profile/${auth.currentUser?.uid}`)} className="w-full">
                Go to Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Project Deposit Payment</CardTitle>
          <CardDescription>
            Complete your 10% deposit to proceed with the project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Details */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Project</p>
                <p className="text-sm text-muted-foreground">{project.title}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start space-x-3">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Total Project Price</p>
                <p className="text-lg font-semibold">
                  LKR {project.adminPrice?.toFixed(2)}
                </p>
              </div>
            </div>

            {project.adminDuration && project.adminDurationUnit && (
              <>
                <Separator />
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Estimated Duration</p>
                    <p className="text-sm text-muted-foreground">
                      {project.adminDuration} {project.adminDurationUnit}
                    </p>
                  </div>
                </div>
              </>
            )}

            {project.adminNotes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="font-medium">Admin Notes</p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-900 whitespace-pre-wrap">
                      {project.adminNotes}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Deposit Amount */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-blue-700 uppercase tracking-wide">
                Initial Deposit (10%)
              </p>
              <p className="text-4xl font-bold text-blue-900">
                LKR {project.initialPaymentAmount?.toFixed(2)}
              </p>
              <p className="text-sm text-blue-600">
                This secures your project slot and enables employee assignment
              </p>
            </div>
          </div>

          {/* UAT Testing Toggle - Removed for production */}

          {/* Security Badge */}
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span className="text-sm">
              Secured by Genie Payment Gateway
            </span>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayNow}
            disabled={processingPayment}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            size="lg"
          >
            {processingPayment ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-5 w-5" />
                Pay LKR {project.initialPaymentAmount?.toFixed(2)} Now
              </>
            )}
          </Button>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              After payment, our admin will assign an experienced employee to start
              working on your project. The remaining balance will be paid upon
              project completion.
            </AlertDescription>
          </Alert>

          {/* Back Button */}
          <div className="pt-4 rounded-lg">
            <Button
              variant="ghost"
              onClick={() => navigate(`/profile/${auth.currentUser?.uid}`)}
              disabled={processingPayment}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Removed Mock Payment Modal for production */}
    </div>
  );
}
