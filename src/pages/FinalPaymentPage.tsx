import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard,
  Download,
  CheckCircle2,
  DollarSign,
  FileText,
  AlertCircle,
  Loader2,
  Shield,
  Lock,
  ArrowLeft,
  Calendar,
  Star,
  MessageSquare,
} from 'lucide-react';
import { geniePaymentService } from '@/Services/geniePaymentService';
import { auth } from '@/firebaseConfig';
import { submitProjectReview } from '@/Services/projectService';

// Testing mode flag
const USE_MOCK_PAYMENT = true; // Set to false for real payment

export default function FinalPaymentPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showMockPaymentModal, setShowMockPaymentModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const loadPaymentDetails = async () => {
      if (!projectId) {
        navigate('/');
        return;
      }

      try {
        console.log('🚀 FINAL PAYMENT PAGE - STARTING LOAD', {
          projectId,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        });

        const user = auth.currentUser;
        console.log('👤 AUTH CHECK - Current user:', {
          exists: !!user,
          uid: user?.uid,
          email: user?.email,
          displayName: user?.displayName,
        });

        if (!user) {
          console.log('❌ NO USER - Redirecting to auth');
          // Save the intended destination and redirect to login with return URL
          toast({
            title: 'Authentication Required',
            description: 'Please log in to access your payment page',
            variant: 'default',
          });
          // Redirect to auth with the current path as redirect parameter
          navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
          return;
        }

        console.log('📞 CALLING geniePaymentService.getProjectPaymentDetails()...');
        const details = await geniePaymentService.getProjectPaymentDetails(projectId);
        
        console.log('📦 RAW RESPONSE FROM SERVICE:', {
          detailsIsNull: details === null,
          detailsIsUndefined: details === undefined,
          detailsType: typeof details,
          detailsKeys: details ? Object.keys(details) : [],
          fullDetails: JSON.parse(JSON.stringify(details)), // Deep clone to see actual values
        });
        
        console.log('🔍 Payment details received:', {
          projectId,
          details: details ? {
            projectTitle: details.projectTitle,
            createdBy: details.createdBy,
            buyerId: (details as any).buyerId,
            buyerEmail: details.buyerEmail,
            status: details.status,
            adminReviewStatus: details.adminReviewStatus,
          } : null,
        });
        
        if (!details) {
          toast({
            title: 'Project Not Found',
            description: 'The requested project could not be found',
            variant: 'destructive',
          });
          navigate('/dashboard');
          return;
        }

        console.log('👤 Current user info:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        });

        // Check if user is the project owner (buyer) - support both createdBy and buyerId
        // Prioritize buyerId since that's what PostProject.tsx uses consistently
        console.log('🔧 EXTRACTING OWNER ID - Step by step:');
        console.log('  Step 1 - details.buyerId (cast as any):', (details as any).buyerId);
        console.log('  Step 2 - details.createdBy:', details.createdBy);
        
        const buyerIdFromDetails = (details as any).buyerId;
        const createdByFromDetails = details.createdBy;
        
        console.log('  Step 3 - Stored values:');
        console.log('    buyerIdFromDetails:', buyerIdFromDetails, 'type:', typeof buyerIdFromDetails);
        console.log('    createdByFromDetails:', createdByFromDetails, 'type:', typeof createdByFromDetails);
        
        const projectOwnerId = buyerIdFromDetails || createdByFromDetails;
        console.log('  Step 4 - projectOwnerId (buyerId || createdBy):', projectOwnerId, 'type:', typeof projectOwnerId);
        
        const isOwner = projectOwnerId === user.uid;
        console.log('  Step 5 - Comparison:', {
          projectOwnerId,
          userUid: user.uid,
          areEqual: projectOwnerId === user.uid,
          strictEqual: projectOwnerId === user.uid,
          looseEqual: projectOwnerId == user.uid,
          bothTrimmed: projectOwnerId?.trim() === user.uid?.trim(),
        });
        
        console.log('🔐 OWNERSHIP CHECK RESULT:', {
          isOwner,
          projectOwnerId,
          userUid: user.uid,
          hasCreatedBy: !!details.createdBy,
          hasBuyerId: !!buyerIdFromDetails,
          createdByMatch: details.createdBy === user.uid,
          buyerIdMatch: buyerIdFromDetails === user.uid,
          comparison: {
            'details.createdBy': details.createdBy,
            'details.buyerId': buyerIdFromDetails,
            'projectOwnerId (used)': projectOwnerId,
            'user.uid': user.uid,
          }
        });
        
        if (!isOwner) {
          console.error('❌❌❌ ACCESS DENIED ❌❌❌');
          console.error('🔒 DETAILED FAILURE INFO:', {
            reason: 'projectOwnerId !== user.uid',
            projectOwnerId: projectOwnerId,
            userUid: user.uid,
            userId: user.uid,
            userEmail: user.email,
            projectCreatedBy: details.createdBy,
            projectBuyerId: (details as any).buyerId,
            projectTitle: details.projectTitle,
            projectOwnerIdLength: projectOwnerId?.length,
            userUidLength: user.uid?.length,
            charByChar: {
              projectOwnerId: projectOwnerId?.split(''),
              userUid: user.uid?.split(''),
            }
          });
          
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this payment page. Please contact support if you believe this is an error.',
            variant: 'destructive',
          });
          navigate('/dashboard');
          return;
        }

        console.log('✅✅✅ ACCESS GRANTED ✅✅✅');
        console.log('✅ Access granted to payment page:', {
          userId: user.uid,
          projectId: details.projectId,
          projectTitle: details.projectTitle,
        });

        // Check if admin has approved the work
        if (details.adminReviewStatus !== 'approved') {
          toast({
            title: 'Payment Not Available',
            description: 'The project work has not been approved by admin yet',
            variant: 'default',
          });
          navigate('/dashboard');
          return;
        }

        setPaymentDetails(details);
        setPaymentCompleted(details.finalPaymentStatus === 'paid');
      } catch (error) {
        console.error('Error loading payment details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payment details. Please try again.',
          variant: 'destructive',
        });
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadPaymentDetails();
  }, [projectId, navigate, toast]);

  const handlePayment = async () => {
    if (!paymentDetails) return;

    // Use mock payment for testing
    if (USE_MOCK_PAYMENT) {
      setShowMockPaymentModal(true);
      return;
    }

    setProcessing(true);
    try {
      const result = await geniePaymentService.processFinalPayment({
        projectId: projectId!,
        amount: paymentDetails.finalPayment,
        buyerEmail: paymentDetails.buyerEmail,
        buyerName: auth.currentUser?.displayName || 'Customer',
        projectTitle: paymentDetails.projectTitle,
      });

      if (result.success) {
        setPaymentCompleted(true);
        toast({
          title: 'Payment Successful!',
          description: `Transaction ID: ${result.transactionId}`,
        });

        // Reload payment details to get updated status
        const updatedDetails = await geniePaymentService.getProjectPaymentDetails(projectId!);
        setPaymentDetails(updatedDetails);
      } else {
        toast({
          title: 'Payment Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Error',
        description: 'An error occurred while processing your payment',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleMockPaymentConfirm = async () => {
    try {
      if (!projectId) return;

      setProcessing(true);

      console.log('💳 Processing mock final payment:', {
        projectId,
        amount: paymentDetails.finalPayment,
        mode: 'DEVELOPMENT_ONLY'
      });

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = await geniePaymentService.processFinalPayment({
        projectId: projectId!,
        amount: paymentDetails.finalPayment,
        buyerEmail: paymentDetails.buyerEmail,
        buyerName: auth.currentUser?.displayName || 'Customer',
        projectTitle: paymentDetails.projectTitle,
      });

      if (result.success) {
        setPaymentCompleted(true);
        setShowMockPaymentModal(false);

        toast({
          title: 'Test Payment Successful!',
          description: `Transaction ID: ${result.transactionId}`,
        });

        // Reload payment details
        const updatedDetails = await geniePaymentService.getProjectPaymentDetails(projectId!);
        setPaymentDetails(updatedDetails);

        console.log('✅ Mock final payment successful');
      } else {
        toast({
          title: 'Payment Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Mock payment error:', error);
      toast({
        title: 'Payment Error',
        description: 'An error occurred while processing your payment',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = (documentUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Download Started',
      description: `Downloading ${fileName}`,
    });
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a star rating before submitting.',
        variant: 'destructive',
      });
      return;
    }

    if (!reviewFeedback.trim()) {
      toast({
        title: 'Feedback Required',
        description: 'Please provide your feedback before submitting.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmittingReview(true);
      await submitProjectReview(projectId!, reviewRating, reviewFeedback.trim());
      
      toast({
        title: 'Review Submitted',
        description: 'Thank you for your feedback! Your review has been submitted successfully.',
      });
      
      // Reload payment details to show the newly submitted review
      const updatedDetails = await geniePaymentService.getProjectPaymentDetails(projectId!);
      setPaymentDetails(updatedDetails);
      
      // Reset form
      setReviewRating(0);
      setReviewFeedback('');
      setHoveredRating(0);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (!paymentDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>Payment details not found</AlertDescription>
            </Alert>
            <div className="mt-6">
              <Button variant="outline" onClick={() => navigate("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment already completed
  if (paymentDetails.finalPaymentStatus === "paid" || paymentCompleted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center space-x-2 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
              <CardTitle className="text-2xl">Payment Completed!</CardTitle>
            </div>
            <CardDescription>
              Your final payment has been successfully processed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-emerald-50 border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">
                Thank you for your payment! You can now download all your project files.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Project</p>
                  <p className="text-sm text-muted-foreground">{paymentDetails.projectTitle}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start space-x-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Final Payment</p>
                  <p className="text-lg font-semibold text-emerald-600">
                    LKR {paymentDetails.finalPayment?.toFixed(2)}
                  </p>
                </div>
              </div>

              {paymentDetails.finalPaymentId && (
                <>
                  <Separator />
                  <div className="flex items-start space-x-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Transaction ID</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {paymentDetails.finalPaymentId}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Download Section */}
            {paymentDetails.documents && paymentDetails.documents.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-semibold">Download Your Files</h3>
                  </div>
                  <div className="grid gap-2">
                    {paymentDetails.documents.map((doc: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            {doc.size && (
                              <p className="text-xs text-muted-foreground">
                                {(doc.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(doc.url, doc.name)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Review Section - Inline Form */}
            {!paymentDetails.customerRating ? (
              <>
                <Separator />
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-lg p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-6 w-6 text-emerald-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-emerald-900">
                          How was your experience?
                        </h3>
                        <p className="text-sm text-emerald-700 mt-1">
                          Share your feedback to help us improve and assist other buyers
                        </p>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="space-y-2">
                      <Label className="text-emerald-900 font-medium">Your Rating *</Label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded"
                            disabled={isSubmittingReview}
                          >
                            <Star
                              className={`w-8 h-8 ${
                                star <= (hoveredRating || reviewRating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              } transition-colors`}
                            />
                          </button>
                        ))}
                        {reviewRating > 0 && (
                          <span className="ml-2 text-sm font-medium text-emerald-900">
                            {reviewRating} {reviewRating === 1 ? 'Star' : 'Stars'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Feedback */}
                    <div className="space-y-2">
                      <Label htmlFor="feedback" className="text-emerald-900 font-medium">
                        Your Feedback *
                      </Label>
                      <Textarea
                        id="feedback"
                        placeholder="Tell us about your experience with this project..."
                        value={reviewFeedback}
                        onChange={(e) => setReviewFeedback(e.target.value)}
                        rows={4}
                        disabled={isSubmittingReview}
                        className="resize-none bg-white text-gray-900 placeholder:text-gray-500 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
                      />
                      <p className="text-xs text-emerald-600">
                        Your feedback helps us improve our service and assists other users.
                      </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview || reviewRating === 0 || !reviewFeedback.trim()}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isSubmittingReview ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Star className="mr-2 h-4 w-4" />
                          Submit Review
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Separator />
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg text-green-900">
                          Your Review
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${
                                star <= paymentDetails.customerRating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="text-sm text-green-700 font-medium ml-1">
                            {paymentDetails.customerRating}.0 stars
                          </span>
                        </div>
                      </div>
                      {paymentDetails.customerReview && (
                        <div className="bg-white/50 rounded-lg p-3">
                          <p className="text-sm text-green-900">
                            "{paymentDetails.customerReview}"
                          </p>
                        </div>
                      )}
                      {paymentDetails.customerReviewedAt && (
                        <p className="text-xs text-green-600">
                          Reviewed on{" "}
                          {paymentDetails.customerReviewedAt.toDate().toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="pt-4">
              <Button onClick={() => navigate("/dashboard")} className="w-full">
                Go to Dashboard
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
          <CardTitle className="text-2xl">Final Project Payment</CardTitle>
          <CardDescription>
            Complete your final payment (90%) to download project files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Details */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Project</p>
                <p className="text-sm text-muted-foreground">{paymentDetails.projectTitle}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start space-x-3">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Total Project Price</p>
                <p className="text-lg font-semibold">
                  LKR {paymentDetails.totalAmount?.toFixed(2)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Initial Deposit Paid (10%)</p>
                <p className="text-sm text-emerald-600 font-semibold">
                  LKR {paymentDetails.initialPayment?.toFixed(2)} ✓
                </p>
              </div>
            </div>
          </div>

          {/* Final Payment Amount */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 rounded-lg p-6">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide">
                Final Payment (90%)
              </p>
              <p className="text-4xl font-bold text-emerald-900">
                LKR {paymentDetails.finalPayment?.toFixed(2)}
              </p>
              <p className="text-sm text-emerald-600">
                Complete this payment to download all project files
              </p>
            </div>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span className="text-sm">
              {USE_MOCK_PAYMENT ? "Test Mode - No Real Payment" : "Secured by Genie Payment Gateway"}
            </span>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={processing}
            className={`w-full ${USE_MOCK_PAYMENT 
              ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700" 
              : "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
            }`}
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-5 w-5" />
                {USE_MOCK_PAYMENT ? "Test Payment" : `Pay LKR ${paymentDetails.finalPayment?.toFixed(2)} Now`}
              </>
            )}
          </Button>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              After payment, you'll immediately be able to download all completed project
              files and documents. The files will be yours to keep forever!
            </AlertDescription>
          </Alert>

          {/* Back Button */}
          <div className="pt-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              disabled={processing}
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
              <CreditCard className="h-5 w-5 text-emerald-600" />
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
                <strong>⚠️ Development Testing Mode:</strong> This is a simulated payment. In production, all payments will be processed through Genie's secure payment gateway.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 bg-slate-50 rounded-lg p-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-600">Project:</span>
                <span className="text-sm font-semibold">{paymentDetails?.projectTitle}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-600">Amount:</span>
                <span className="text-lg font-bold text-emerald-600">
                  LKR {paymentDetails?.finalPayment?.toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">Type:</span>
                <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                  Final Payment (90%)
                </Badge>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-xs text-emerald-800">
                💳 Click "Confirm Test Payment" to simulate a successful payment. This will update the project status and allow file downloads.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowMockPaymentModal(false)}
              disabled={processing}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMockPaymentConfirm}
              disabled={processing}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
            >
              {processing ? (
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
