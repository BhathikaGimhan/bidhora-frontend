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
} from "lucide-react";
import geniePaymentService from "@/Services/geniePaymentService";
import type { GeniePaymentConfig } from "@/Services/geniePaymentService";
import type { Project } from "@/Services/projectService";

// Firebase Functions API base URL
const API_BASE_URL = "https://api-e7fpchtlna-uc.a.run.app";

// Payment mode - using real Genie payment gateway
const USE_MOCK_PAYMENT = false; // Changed to false - using real payments

// UAT Testing mode - set to true for testing with UAT API
const USE_UAT_ENVIRONMENT = true; // Changed to true - using UAT for testing

export default function ProjectDepositPaymentPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showMockPaymentModal, setShowMockPaymentModal] = useState(false);
  const [useUATMode, setUseUATMode] = useState(USE_UAT_ENVIRONMENT);

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
          console.log('✅ Payment successful, updating project status...');
          
          // Generate the order ID that was used for payment
          const order_id = `DEPOSIT_${projectId}_`;
          
          const projectRef = doc(db, 'projects', projectId);
          await updateDoc(projectRef, {
            initialPaymentStatus: 'paid',
            initialPaymentId: order_id + Date.now(),
            initialPaymentDate: Timestamp.now(),
            customerDecision: 'approved',
            status: 'ready_to_assign',
            updatedAt: Timestamp.now(),
          });

          console.log('✅ Project payment status updated successfully');
          
          // Clear URL params and reload project info
          navigate(`/payment/project/${projectId}`, { replace: true });
          
          // Refresh project data
          await fetchProjectInfo();
          
        } catch (error) {
          console.error('❌ Error updating payment status:', error);
          setError('Payment was successful but failed to update project status. Please contact support.');
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


  const handlePaymentSuccess = async (orderId: string) => {
    try {
      if (!projectId) return;

      console.log("💾 Updating project with payment details:", {
        projectId,
        orderId,
        newStatus: "ready_to_assign",
        initialPaymentStatus: "paid"
      });

      // Update project with payment details and status
      await updateDoc(doc(db, "projects", projectId), {
        initialPaymentStatus: "paid",
        initialPaymentId: orderId,
        initialPaymentDate: Timestamp.now(),
        customerDecision: "approved",
        status: "ready_to_assign", // Changed from priced to ready_to_assign
        updatedAt: Timestamp.now(),
      });

      console.log("✅ Project updated successfully in Firestore");

      // Refresh project info to show paid status
      await fetchProjectInfo();
      
      console.log("✅ Project info refreshed from Firestore");
    } catch (error) {
      console.error("Error updating payment status:", error);
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

      const order_id = `DEPOSIT-${project.id}-${Date.now()}`;
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
        notifyUrl: `${API_BASE_URL}/genie/notify`,
      };

      console.log("💳 Starting Genie payment process for project deposit:", {
        order_id,
        amount: paymentConfig.amount,
        projectTitle: project.title,
        environment: useUATMode ? 'UAT' : 'Production',
      });

      // Initiate payment with Genie
      // Use UAT environment if enabled, otherwise use production
      const result = await geniePaymentService.initiatePayment(
        paymentConfig,
        useUATMode ? 'uat' : 'production'
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

  const handleMockPaymentConfirm = async () => {
    try {
      if (!project?.id) return;
      
      setProcessingPayment(true);
      
      // Generate mock order ID with timestamp for uniqueness
      const timestamp = Date.now();
      const mockOrderId = `MOCK-${project.id}-${timestamp}`;
      
      // Generate mock payment hash (for development only - not secure)
      const mockHash = btoa(`${mockOrderId}:${project.initialPaymentAmount}:${timestamp}`);
      
      console.log("💳 Processing mock payment:", {
        orderId: mockOrderId,
        amount: project.initialPaymentAmount,
        hash: mockHash.substring(0, 20) + '...',
        mode: 'DEVELOPMENT_ONLY'
      });
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await handlePaymentSuccess(mockOrderId);
      setShowMockPaymentModal(false);
      
      console.log("✅ Mock payment successful");
    } catch (error) {
      console.error("❌ Mock payment error:", error);
      setError("Payment processing failed");
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
                <Button variant="outline" onClick={() => navigate("/")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>
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

            <div className="pt-4">
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

          {/* UAT Testing Toggle - Always visible for testing */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">
                  Payment Environment
                </span>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <span className="text-sm text-yellow-700">
                  {useUATMode ? 'UAT/Testing' : 'Production'}
                </span>
                <input
                  type="checkbox"
                  checked={useUATMode}
                  onChange={(e) => setUseUATMode(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </label>
            </div>
            <p className="text-xs text-yellow-700 mt-2">
              {useUATMode 
                ? '⚠️ Using UAT/Testing API (api.uat.geniebiz.lk) - Safe for testing'
                : '✓ Using Production API (api.geniebiz.lk) - Real payments'
              }
            </p>
          </div>

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
          <div className="pt-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              disabled={processingPayment}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mock Payment Modal for Testing */}
      <Dialog open={showMockPaymentModal} onOpenChange={setShowMockPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Test Payment (Mock Mode)
            </DialogTitle>
            <DialogDescription>
              This is a test payment for development purposes only. No real payment will be processed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <strong>⚠️ Development Testing Mode:</strong> This is a simulated payment with NO security measures. In production, all payments will be processed through Genie's secure payment gateway with proper encryption and hashing.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 bg-slate-50 rounded-lg p-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-600">Project:</span>
                <span className="text-sm font-semibold">{project?.title}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-600">Amount:</span>
                <span className="text-lg font-bold text-blue-600">
                  LKR {project?.initialPaymentAmount?.toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">Status:</span>
                <Badge variant="outline" className="text-amber-700 border-amber-300">
                  Mock Payment
                </Badge>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                💳 Click "Confirm Test Payment" to simulate a successful payment. This will update the project status without processing any real transaction.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowMockPaymentModal(false)}
              disabled={processingPayment}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMockPaymentConfirm}
              disabled={processingPayment}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm Test Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
