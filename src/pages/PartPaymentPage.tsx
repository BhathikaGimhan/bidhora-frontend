import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '@/firebaseConfig';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  Loader2,
  Lock,
  CreditCard,
  ArrowLeft,
  AlertCircle,
  DollarSign,
  FileText,
  Download,
  Package,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import geniePaymentService from '@/Services/geniePaymentService';
import type { GeniePaymentConfig } from '@/Services/geniePaymentService';
import {
  getPartPaymentDetails,
  processPartPayment,
} from '@/Services/partSubmissionService';
import type { PartPaymentDetails } from '@/types/partSubmission';

export default function PartPaymentPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [partDetails, setPartDetails] = useState<PartPaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Check for payment callback
  const paymentStatus = searchParams.get('status');
  const isPaymentSuccess = paymentStatus === 'success';
  const isPaymentCancelled = paymentStatus === 'cancelled';

  useEffect(() => {
    loadPartDetails();
  }, [submissionId]);

  const loadPartDetails = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;

      if (!user) {
        setError('Please sign in to continue');
        return;
      }

      if (!submissionId) {
        setError('Submission ID is required');
        return;
      }

      const details = await getPartPaymentDetails(submissionId);
      if (!details) {
        setError('Part submission not found');
        return;
      }

      setPartDetails(details);
    } catch (err) {
      console.error('Error loading part details:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load part payment information'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!partDetails || !auth.currentUser) return;

    try {
      setProcessingPayment(true);

      const order_id = `PART_${submissionId}_${Date.now()}`;
      const baseUrl = window.location.origin;

      const paymentConfig: GeniePaymentConfig = {
        merchantId: '',
        apiKey: '',
        orderId: order_id,
        amount: partDetails.adminPrice.toFixed(2),
        currency: 'LKR',
        description: `${partDetails.partTag} - ${partDetails.projectTitle}`,
        customerEmail: auth.currentUser.email || '',
        customerName: auth.currentUser.displayName || 'Customer',
        customerPhone: '',
        returnUrl: `${baseUrl}/payment/part/${submissionId}?status=success`,
        cancelUrl: `${baseUrl}/payment/part/${submissionId}?status=cancelled`,
        notifyUrl: import.meta.env.VITE_GENIE_WEBHOOK_URL || 'https://geniewebhook-e7fpchtlna-uc.a.run.app',
      };

      console.log('💳 Initiating part payment:', {
        order_id,
        amount: paymentConfig.amount,
        partTag: partDetails.partTag,
      });

      const result = await geniePaymentService.initiatePayment(paymentConfig);
      
      console.log('✅ Payment initiated:', result);

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        throw new Error('No redirect URL received from payment gateway');
      }
    } catch (error) {
      console.error('❌ Payment error:', error);
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Failed to initiate payment',
        variant: 'destructive',
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
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

  if (error) {
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
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-6">
              <Button onClick={() => navigate(-1)} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!partDetails) {
    return null;
  }

  // Payment already completed - show success page
  if (partDetails.paymentStatus === 'paid' || isPaymentSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center space-x-2 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
              <CardTitle>Payment Successful!</CardTitle>
            </div>
            <CardDescription>
              You can now download the files for this part
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="h-6 w-6 text-emerald-700" />
                <div>
                  <p className="font-semibold text-emerald-900">{partDetails.partTag}</p>
                  <p className="text-sm text-emerald-700">{partDetails.projectTitle}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-700">Amount Paid:</span>
                <span className="text-2xl font-bold text-emerald-900">
                  LKR {partDetails.adminPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {partDetails.adminNotes && (
              <>
                <Separator />
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-yellow-900 mb-2">Admin Notes:</p>
                  <p className="text-sm text-yellow-800 whitespace-pre-wrap">
                    {partDetails.adminNotes}
                  </p>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-3">
              <p className="font-medium">Download Files:</p>
              {partDetails.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{doc.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(doc.url, doc.name)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Button
                onClick={() => navigate(`/profile/${auth.currentUser?.uid}`)}
                className="w-full"
              >
                Go to Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment page
  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Part Payment</CardTitle>
          <CardDescription>
            Complete payment to download files for this part
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isPaymentCancelled && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Payment was cancelled. You can try again below.
              </AlertDescription>
            </Alert>
          )}

          {/* Part Details */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Project</p>
                <p className="text-sm text-muted-foreground">{partDetails.projectTitle}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start space-x-3">
              <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Part</p>
                <p className="text-sm text-muted-foreground">{partDetails.partTag}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="font-medium">Description</p>
              <p className="text-sm text-muted-foreground">{partDetails.description}</p>
            </div>

            {partDetails.adminNotes && (
              <>
                <Separator />
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-yellow-900 mb-1">Admin Notes:</p>
                  <p className="text-sm text-yellow-800 whitespace-pre-wrap">
                    {partDetails.adminNotes}
                  </p>
                </div>
              </>
            )}

            <Separator />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Files Included:</span>
              <Badge>{partDetails.documents.length} file(s)</Badge>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-blue-700 uppercase tracking-wide">
                Part Price
              </p>
              <p className="text-4xl font-bold text-blue-900">
                LKR {partDetails.adminPrice.toFixed(2)}
              </p>
              <p className="text-sm text-blue-600">
                Pay now to download all files for this part
              </p>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayNow}
            disabled={processingPayment}
            className="w-full h-12 text-lg"
          >
            {processingPayment ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-5 w-5" />
                Pay LKR {partDetails.adminPrice.toFixed(2)} Now
              </>
            )}
          </Button>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span>Secure payment powered by Genie</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
