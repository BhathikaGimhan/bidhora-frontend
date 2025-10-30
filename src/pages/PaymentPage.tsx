import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "@/firebaseConfig";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Lock,
  CreditCard,
  Shield,
  ArrowLeft,
} from "lucide-react";
import paymentService from "@/Services/geniePaymentService";
import {
  PaymentInfo,
  getPaymentInfo,
  updatePaymentStatus,
} from "@/Services/workSubmissionService";

// TODO: Migrate PayHere payment hash generation to Firebase Cloud Functions
const API_BASE_URL = "https://api-e7fpchtlna-uc.a.run.app";

export default function PaymentPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const fetchPaymentInfo = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setError("Authentication required");
        return;
      }

      if (!submissionId) {
        setError("Submission ID is required");
        return;
      }

      const data = await getPaymentInfo(submissionId);
      console.log("📊 Payment info received:", {
        amount: data.amount,
        projectTitle: data.projectTitle,
        files: data.files?.length || 0,
      });
      setPaymentInfo(data);
    } catch (err) {
      console.error("Error fetching payment info:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load payment information"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthChecked(true);
      if (user) {
        fetchPaymentInfo();
      } else {
        setError("Please sign in to access this page");
        setLoading(false);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  const handlePaymentSuccess = async (orderId: string) => {
    try {
      if (!submissionId) return;

      await updatePaymentStatus(submissionId, orderId, "payhere");

      // Refresh payment info to show paid status
      await fetchPaymentInfo();
    } catch (err) {
      console.error("Error updating payment status:", err);
    }
  };

  const handlePayment = async () => {
    if (!paymentInfo) return;

    setProcessingPayment(true);
    setError(null);

    try {
      // Load PayHere script
      await payHereService.loadPayHereScript();

      const user = auth.currentUser;
      if (!user) {
        throw new Error("Please sign in to continue");
      }

      const orderId = `SUB_${submissionId}_${Date.now()}`;

      // Get payment hash from backend
      const token = await user.getIdToken();
      const hashResponse = await fetch(
        `${API_BASE_URL}/payment/generate-hash`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            merchantId: "1232439",
            orderId,
            amount: paymentInfo.amount.toFixed(2),
            currency: "LKR",
          }),
        }
      );

      if (!hashResponse.ok) {
        const errorText = await hashResponse.text();
        console.error("Hash generation failed:", errorText);
        throw new Error("Failed to generate payment hash");
      }

      const hashData = await hashResponse.json();
      console.log("🔐 Hash received from backend:", {
        hash: hashData.hash?.substring(0, 10) + "...",
        sandbox: hashData.sandbox,
      });

      // Show PayHere modal
      const paymentResult = await payHereService.showPaymentModal({
        merchant_id: "1232439",
        return_url: undefined, // JS SDK popup mode
        cancel_url: undefined, // JS SDK popup mode
        notify_url: `${API_BASE_URL}/payment/notify`,
        order_id: orderId,
        items: paymentInfo.projectTitle,
        currency: "LKR",
        amount: paymentInfo.amount.toFixed(2),
        first_name: user.displayName?.split(" ")[0] || "Buyer",
        last_name: user.displayName?.split(" ").slice(1).join(" ") || "",
        email: user.email || "",
        phone: "",
        address: "",
        city: "Colombo",
        country: "Sri Lanka",
        hash: hashData.hash,
      });

      console.log("Payment completed:", paymentResult);
      setProcessingPayment(false);
      await handlePaymentSuccess(paymentResult.order_id);
    } catch (err) {
      console.error("Payment error:", err);
      setProcessingPayment(false);
      if (err instanceof Error && err.message !== "Payment window closed") {
        setError(err.message || "Payment failed. Please try again.");
      }
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      // For Firebase Storage URLs, we can directly download
      // If the URL is a Google Storage URL, open in new tab to trigger download
      if (
        fileUrl.includes("firebasestorage.googleapis.com") ||
        fileUrl.includes("storage.googleapis.com")
      ) {
        // Create a link and trigger download
        const a = document.createElement("a");
        a.href = fileUrl;
        a.download = fileName;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // For other URLs, try fetch with CORS
        const response = await fetch(fileUrl, {
          mode: "cors",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch file");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Download error:", err);
      // If fetch fails, try opening in new tab as fallback
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (loading || !authChecked) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground font-medium">
              Loading payment information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!paymentInfo) {
    return null;
  }

  const isPaid = paymentInfo.paymentStatus === "paid";

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb / Back Navigation */}
      <div className="mb-6">
        <Button
          variant="ghost"
          className="hover:bg-accent"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {isPaid ? (
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          ) : (
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
              <Shield className="w-6 h-6 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">
              {isPaid ? "Payment Complete" : "Secure Payment"}
            </h1>
            <p className="text-muted-foreground">
              {isPaid
                ? "Download your completed project documents"
                : "Complete payment to access your project deliverables"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Project Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Info Card */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl">
                    {paymentInfo.projectTitle}
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Completed by{" "}
                    <span className="font-semibold text-primary">
                      {paymentInfo.service_providerName}
                    </span>
                  </CardDescription>
                </div>
                {isPaid && (
                  <Badge className="bg-green-500 hover:bg-green-600 text-white">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Paid
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Service Provider Info */}
              <div className="flex items-center gap-4 p-4 bg-accent/50 rounded-lg">
                <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                  <AvatarImage src={paymentInfo.service_providerPhotoURL} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {paymentInfo.service_providerName
                      .substring(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">
                    {paymentInfo.service_providerName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Service Provider
                  </p>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Work Description
                </h3>
                <p className="text-muted-foreground leading-relaxed bg-accent/30 p-4 rounded-lg">
                  {paymentInfo.description}
                </p>
              </div>

              <Separator />

              {/* Files Section */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Completed Documents ({paymentInfo.files.length})
                </h3>

                {isPaid ? (
                  <div className="space-y-3">
                    {paymentInfo.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border-2 rounded-lg hover:border-primary hover:bg-accent/50 transition-all group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.type || "Document"}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="ml-3"
                          onClick={() => handleDownload(file.url, file.name)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <Lock className="w-4 h-4" />
                    <AlertDescription>
                      Complete the payment to unlock and download all{" "}
                      {paymentInfo.files.length} file(s)
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Payment Summary */}
        <div className="space-y-6">
          {/* Amount Card */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 p-6 rounded-xl border-2 border-primary/20">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total Amount
                </p>
                <p className="text-3xl font-bold text-primary">
                  LKR{" "}
                  {paymentInfo.amount > 0
                    ? paymentInfo.amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "0.00"}
                </p>
                {paymentInfo.amount === 0 && (
                  <p className="text-xs text-destructive mt-2">
                    ⚠️ Amount not set - Contact support
                  </p>
                )}
                {isPaid && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Paid on{" "}
                      {new Date(paymentInfo.paidAt!).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                )}
              </div>

              {!isPaid && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Button
                      size="lg"
                      className="w-full h-12"
                      onClick={handlePayment}
                      disabled={processingPayment || paymentInfo.amount === 0}
                    >
                      {processingPayment ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing Payment...
                        </>
                      ) : paymentInfo.amount === 0 ? (
                        <>
                          <Lock className="w-5 h-5 mr-2" />
                          Amount Not Set
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5 mr-2" />
                          Proceed to Payment
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                      <Shield className="w-3 h-3" />
                      Secured by PayHere
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Security Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p>
                    Your payment is secured with industry-standard encryption
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CreditCard className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p>
                    All transactions are processed through PayHere's secure
                    gateway
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p>Download access is immediately granted after payment</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
