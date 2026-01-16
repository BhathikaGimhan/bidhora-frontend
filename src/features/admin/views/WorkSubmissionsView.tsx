import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/features/admin/components/DataTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { auth } from "@/firebaseConfig";
import {
  WorkSubmission,
  getAllWorkSubmissions,
  updateWorkSubmissionStatus,
} from "@/Services/workSubmissionService";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function WorkSubmissionsView() {
  const [submissions, setSubmissions] = useState<WorkSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<WorkSubmission | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [adminPrice, setAdminPrice] = useState<number>(0);
  const [reviewNotes, setReviewNotes] = useState(""); // Add notes state for dialog

  useEffect(() => {
    // Wait for auth state to be ready
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthChecked(true);
      if (user) {
        fetchWorkSubmissions();
      } else {
        setLoading(false);
        toast({
          title: "Authentication Required",
          description: "Please sign in to view work submissions",
          variant: "destructive",
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchWorkSubmissions = async () => {
    try {
      setLoading(true);

      const data = await getAllWorkSubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error("Error fetching work submissions:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to load work submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchWorkSubmissions();
    toast({
      title: "Refreshed",
      description: "Work submissions list updated successfully",
    });
  };

  const handleViewSubmission = (submission: WorkSubmission) => {
    setSelectedSubmission(submission);
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async (
    submissionId: string,
    newStatus: "approved" | "rejected",
  ) => {
    try {
      setActionLoading(true);

      // Pass adminPrice if it's a part submission and being approved
      await updateWorkSubmissionStatus(
        submissionId, 
        newStatus, 
        reviewNotes,
        (selectedSubmission?.submissionType === "part" && newStatus === "approved") ? adminPrice : undefined
      );

      toast({
        title: "Success",
        description: `Work submission ${
          newStatus === "approved" ? "approved" : "rejected"
        } successfully`,
      });

      // Refresh the list
      await fetchWorkSubmissions();
      setIsDialogOpen(false);
      setAdminPrice(0);
      setReviewNotes("");
    } catch (error) {
      console.error("Error updating submission status:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update submission status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_review":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300"
          >
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getSubmissionTypeBadge = (submissionId: string) => {
    if (submissionId.startsWith("employee_")) {
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300"
        >
          Employee
        </Badge>
      );
    }
    if (submissionId.startsWith("part_")) {
      return (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300"
        >
          Part
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300"
      >
        Service Provider
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter and sort submissions
  const pendingSubmissions = submissions
    .filter((s) => s.status === "pending_review")
    .sort((a, b) => {
      // Prioritize urgent submissions
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      // Then sort by submission date (newest first)
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

  const approvedSubmissions = submissions
    .filter((s) => s.status === "approved")
    .sort((a, b) => {
      // Sort by review date (newest first)
      const dateA = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0;
      const dateB = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0;
      return dateB - dateA;
    });

  const rejectedSubmissions = submissions
    .filter((s) => s.status === "rejected")
    .sort((a, b) => {
      // Sort by review date (newest first)
      const dateA = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0;
      const dateB = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0;
      return dateB - dateA;
    });

  const urgentPendingCount = pendingSubmissions.filter((s) => s.isUrgent).length;

  // Define columns for DataTable
  const columns = [
    {
      key: "projectId",
      title: "Project ID",
      sortable: true,
      render: (value: string) => (
        <span className="font-mono text-xs text-muted-foreground">{value || "N/A"}</span>
      ),
    },
    {
      key: "projectTitle",
      title: "Project",
      sortable: true,
      render: (value: string, submission: WorkSubmission) => (
        <div className="flex items-center gap-2">
          {submission.isUrgent && submission.status === 'pending_review' && (
            <div className="relative">
              <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
          )}
          <span className={submission.isUrgent && submission.status === 'pending_review' ? 'text-red-700 dark:text-red-400 font-semibold' : ''}>
            {value || "N/A"}
          </span>
          {submission.isUrgent && submission.status === 'pending_review' && (
            <Badge className="bg-red-600 hover:bg-red-700 text-white text-xs animate-pulse">
              🚨 URGENT
            </Badge>
          )}
          {submission.partTag && (
             <Badge variant="secondary" className="text-xs">
                {submission.partTag}
             </Badge>
          )}
          {submission.isFinal && (
             <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">
                FINAL
             </Badge>
          )}
        </div>
      ),
    },
    {
      key: "submitterName",
      title: "Submitted By",
      sortable: true,
      render: (value: string, submission: WorkSubmission) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={submission.submitterPhotoURL} />
            <AvatarFallback>
              {(value || "U").substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span>{value || "Unknown"}</span>
        </div>
      ),
    },
    {
      key: "id",
      title: "Type",
      sortable: false,
      render: (value: string) => getSubmissionTypeBadge(value),
    },
    {
      key: "buyerName",
      title: "Buyer",
      sortable: true,
      render: (value: string, submission: WorkSubmission) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={submission.buyerPhotoURL} />
            <AvatarFallback>
              {(value || "U").substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span>{value || "Unknown"}</span>
        </div>
      ),
    },
    {
      key: "submittedAt",
      title: "Submitted",
      sortable: true,
      render: (value: Date | string) => formatDate(value),
    },
    {
      key: "files",
      title: "Files",
      sortable: false,
      render: (value: Array<{ name: string; url: string; size: number }>) => (
        <div className="flex items-center gap-1">
          <FileText className="w-4 h-4" />
          <span>{value?.length || 0}</span>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      render: (value: string) => getStatusBadge(value),
    },
  ];

  // Define actions for DataTable
  const actions = (submission: WorkSubmission) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleViewSubmission(submission)}
    >
      <Eye className="w-4 h-4 mr-1" />
      View
    </Button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  // Render submission list component
  const renderSubmissionList = (submissionList: WorkSubmission[]) => {
    return (
      <>
        {/* Mobile View */}
        <div className="block lg:hidden">
          {submissionList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground px-4">
              No work submissions found
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {submissionList.map((submission) => (
                <Card 
                  key={submission.id} 
                  className={`overflow-hidden relative ${
                    submission.isUrgent && submission.status === 'pending_review'
                      ? 'border-2 border-red-500 shadow-lg shadow-red-200/50 dark:shadow-red-900/30 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background' 
                      : ''
                  }`}
                >
                  {/* Corner accent for urgent pending reviews */}
                  {submission.isUrgent && submission.status === 'pending_review' && (
                    <>
                      <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-t-red-500 border-l-[40px] border-l-transparent" />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-red-600 hover:bg-red-700 text-white text-[10px] px-1.5 py-0 h-5 animate-pulse">
                          🚨 URGENT
                        </Badge>
                      </div>
                    </>
                  )}
                  
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {submission.isUrgent && submission.status === 'pending_review' && (
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 animate-pulse" />
                          )}
                          <h3 className={`font-semibold text-sm truncate ${
                            submission.isUrgent && submission.status === 'pending_review' ? 'text-red-700 dark:text-red-400' : ''
                          }`}>
                            {submission.projectTitle || "N/A"}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={submission.submitterPhotoURL} />
                            <AvatarFallback className="text-[10px]">
                              {(submission.submitterName || "U")
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-xs text-muted-foreground">
                            by {submission.submitterName || "Unknown"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        {getStatusBadge(submission.status)}
                        {getSubmissionTypeBadge(submission.id)}
                        {submission.partTag && (
                           <Badge variant="secondary" className="text-[10px]">
                              {submission.partTag}
                           </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Buyer:</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={submission.buyerPhotoURL} />
                            <AvatarFallback className="text-[10px]">
                              {(submission.buyerName || "U")
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-medium truncate">
                            {submission.buyerName || "Unknown"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Files:</span>
                        <p className="font-medium flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {submission.files.length}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {formatDate(submission.submittedAt)}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleViewSubmission(submission)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block">
          <DataTable
            title=""
            data={submissionList}
            columns={columns}
            searchPlaceholder="Search submissions..."
            actions={actions}
          />
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Work Submissions</h2>
          <p className="text-muted-foreground">
            Review and approve completed work submitted by employees
          </p>
        </div>
      </div>

      {/* Urgent Submissions Alert Banner - Only show for pending reviews */}
      {urgentPendingCount > 0 && (
        <div className="relative overflow-hidden rounded-lg border-2 border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 via-red-100 to-red-50 dark:from-red-950/20 dark:via-red-900/30 dark:to-red-950/20 p-4">
          {/* Animated blur effects */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-red-300/30 dark:bg-red-600/20 rounded-full blur-2xl animate-pulse" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-red-400/30 dark:bg-red-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative flex items-start gap-3">
            {/* Pulsing icon */}
            <div className="flex-shrink-0 p-2 bg-red-500 dark:bg-red-600 text-white rounded-lg shadow-lg backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  ⚠️ Urgent Work Submissions Require Review
                </h3>
                <Badge className="bg-red-600 hover:bg-red-700 text-white animate-bounce">
                  {urgentPendingCount} URGENT
                </Badge>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                These submissions are from urgent projects and need immediate attention
              </p>
              
              {/* Show first 3 urgent pending submissions */}
              <div className="flex flex-wrap gap-2">
                {pendingSubmissions
                  .filter(s => s.isUrgent)
                  .slice(0, 3)
                  .map(submission => (
                    <Badge 
                      key={submission.id}
                      variant="outline" 
                      className="text-xs bg-white/50 dark:bg-red-950/50 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                    >
                      {submission.projectTitle}
                    </Badge>
                  ))}
                {urgentPendingCount > 3 && (
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-white/50 dark:bg-red-950/50 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                  >
                    +{urgentPendingCount - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pending" | "approved" | "rejected")} className="w-full">
        <div className="w-full overflow-x-auto">
          <TabsList className="inline-flex w-full sm:grid sm:grid-cols-3 min-w-max sm:min-w-0">
            <TabsTrigger value="pending" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Pending Review</span>
              <span className="xs:hidden">Pending</span>
              {pendingSubmissions.length > 0 && (
                <Badge 
                  variant={urgentPendingCount > 0 ? "destructive" : "secondary"} 
                  className={`ml-1 text-xs ${urgentPendingCount > 0 ? 'animate-pulse' : ''}`}
                >
                  {pendingSubmissions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              Approved
              {approvedSubmissions.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {approvedSubmissions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4">
              <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              Rejected
              {rejectedSubmissions.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {rejectedSubmissions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          {renderSubmissionList(pendingSubmissions)}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          {renderSubmissionList(approvedSubmissions)}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          {renderSubmissionList(rejectedSubmissions)}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
              {selectedSubmission?.isUrgent && selectedSubmission?.status === 'pending_review' && (
                <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
              )}
              Work Submission Details
              {selectedSubmission?.isUrgent && selectedSubmission?.status === 'pending_review' && (
                <Badge className="bg-red-600 hover:bg-red-700 text-white animate-pulse">
                  🚨 URGENT
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Review the completed work and approve or reject the submission
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4 sm:space-y-6">
              {/* Urgent Alert Banner - Only show for pending reviews */}
              {selectedSubmission.isUrgent && selectedSubmission.status === 'pending_review' && (
                <div className="relative overflow-hidden rounded-lg border-2 border-red-500 bg-gradient-to-r from-red-600 via-red-700 to-red-600 p-4 text-white shadow-xl">
                  {/* Animated blur effects */}
                  <div className="absolute top-0 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" />
                  <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                  
                  <div className="relative flex items-center gap-3">
                    <div className="flex-shrink-0 p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                      <AlertCircle className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">⚠️ URGENT PROJECT SUBMISSION</h3>
                      <p className="text-sm text-red-100">
                        This submission requires immediate review and approval
                      </p>
                    </div>
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold animate-bounce">
                      IMMEDIATE ACTION REQUIRED
                    </Badge>
                  </div>
                </div>
              )}

              {/* Summary Info */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 ${
                selectedSubmission.isUrgent && selectedSubmission.status === 'pending_review' ? 'p-4 rounded-lg border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20' : ''
              }`}>
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className={`font-medium text-sm sm:text-base truncate ${
                    selectedSubmission.isUrgent && selectedSubmission.status === 'pending_review' ? 'text-red-700 dark:text-red-400 font-semibold' : ''
                  }`}>
                    {selectedSubmission.projectTitle || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submission Type</p>
                  <div className="mt-1">
                    {getSubmissionTypeBadge(selectedSubmission.id)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedSubmission.status)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted By</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedSubmission.submitterPhotoURL} />
                      <AvatarFallback className="text-xs">
                        {(selectedSubmission.submitterName || "U")
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium text-sm sm:text-base truncate">
                      {selectedSubmission.submitterName || "Unknown"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Buyer</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedSubmission.buyerPhotoURL} />
                      <AvatarFallback className="text-xs">
                        {(selectedSubmission.buyerName || "U")
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium text-sm sm:text-base truncate">
                      {selectedSubmission.buyerName || "Unknown"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted At</p>
                  <p className="font-medium text-sm">
                    {formatDate(selectedSubmission.submittedAt)}
                  </p>
                </div>
                {selectedSubmission.reviewedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Reviewed At</p>
                    <p className="font-medium text-sm">
                      {formatDate(selectedSubmission.reviewedAt)}
                    </p>
                  </div>
                )}
              </div>

              <Tabs defaultValue="description" className="w-full">
                <div className="w-full overflow-x-auto">
                  <TabsList className="inline-flex w-full sm:grid sm:grid-cols-2 min-w-max sm:min-w-0">
                    <TabsTrigger value="description" className="text-xs sm:text-sm px-4 sm:px-6 whitespace-nowrap">
                      Description
                    </TabsTrigger>
                    <TabsTrigger value="files" className="text-xs sm:text-sm px-4 sm:px-6 whitespace-nowrap">
                      Files ({selectedSubmission.files.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="description" className="space-y-4">
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg">
                        Work Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <p className="whitespace-pre-wrap text-sm sm:text-base">
                        {selectedSubmission.description}
                      </p>
                    </CardContent>
                  </Card>

                  {selectedSubmission.reviewNotes && (
                    <Card>
                      <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base sm:text-lg">
                          Review Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-0">
                        <p className="whitespace-pre-wrap text-sm sm:text-base">
                          {selectedSubmission.reviewNotes}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="files" className="space-y-4">
                  {selectedSubmission.files.length === 0 ? (
                    <Card>
                      <CardContent className="py-8">
                        <p className="text-center text-muted-foreground text-sm">
                          No files attached
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-3 sm:gap-4">
                      {selectedSubmission.files.map((file, index) => (
                        <Card key={index}>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm truncate">
                                    {file.name}
                                  </p>
                                  <p className="text-xs sm:text-sm text-muted-foreground">
                                    {file.type} • {formatFileSize(file.size)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end sm:justify-start">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs sm:text-sm"
                                  onClick={() =>
                                    window.open(file.url, "_blank")
                                  }
                                >
                                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs sm:text-sm"
                                  onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = file.url;
                                    link.download = file.name;
                                    link.click();
                                  }}
                                >
                                  <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Review Inputs */}
              {selectedSubmission.status === "pending_review" && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Review Notes (Optional)</label>
                    <textarea
                      className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Add any improved notes or feedback..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                    />
                  </div>

                  {selectedSubmission.submissionType === 'part' && (
                    <div className="space-y-2">
                       <label className="text-sm font-medium">Approved Amount (LKR) *Required for Parts</label>
                       <input
                          type="number"
                          className="w-full p-2 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="e.g. 5000"
                          value={adminPrice === 0 ? '' : adminPrice}
                          onChange={(e) => setAdminPrice(Number(e.target.value))}
                       />
                       <p className="text-xs text-muted-foreground">
                          Enter the amount to be paid for this part.
                       </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {selectedSubmission.status === "pending_review" && (
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto order-2 sm:order-1"
                    onClick={() =>
                      handleUpdateStatus(selectedSubmission.id, "rejected")
                    }
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Reject
                  </Button>
                  <Button
                    className="w-full sm:w-auto order-1 sm:order-2"
                    onClick={() =>
                      handleUpdateStatus(selectedSubmission.id, "approved")
                    }
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
