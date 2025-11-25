import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Download,
  FileText,
  Tag,
  Star,
  MessageSquare,
} from 'lucide-react';
import { Project, ProjectDocument } from '@/Services/projectService';
import { ProjectReviewDialog } from './ProjectReviewDialog';
import { ReviewService } from '@/Services/reviewService';

interface OngoingProjectDetailsProps {
  project: Project & {
    status: string;
    assignedTo?: string;
    progress?: number; // 0-100
    adminPrice?: number;
    adminDuration?: number;
    adminDurationUnit?: string;
    assignedAt?: Date;
    adminNotes?: string;
    assignedEmployeeId?: string;
    assignedEmployeeName?: string;
    assignedEmployeeEmail?: string;
  };
  onBack: () => void;
  onContactSeller?: (sellerId: string, projectTitle?: string) => void;
  onViewSellerProfile?: (sellerId: string) => void;
}

export const OngoingProjectDetails = ({
  project,
  onBack,
}: OngoingProjectDetailsProps) => {
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [hasReviewInCollection, setHasReviewInCollection] = useState(false);
  const [checkingReview, setCheckingReview] = useState(true);

  // Check if review exists in reviews collection
  useEffect(() => {
    const checkForReview = async () => {
      if (project.status === 'completed') {
        try {
          setCheckingReview(true);
          const hasReview = await ReviewService.checkProjectHasReview(project.id);
          setHasReviewInCollection(hasReview);
        } catch (error) {
          console.error('Error checking for review:', error);
        } finally {
          setCheckingReview(false);
        }
      } else {
        setCheckingReview(false);
      }
    };

    checkForReview();
  }, [project.id, project.status]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate effective deadline using admin duration if available
  const getEffectiveDeadline = (): Date => {
    if (project.adminDuration && project.adminDurationUnit && project.assignedAt) {
      const assignedDate = new Date(project.assignedAt);
      const deadline = new Date(assignedDate);
      
      switch (project.adminDurationUnit.toLowerCase()) {
        case 'days':
        case 'day':
          deadline.setDate(deadline.getDate() + project.adminDuration);
          break;
        case 'weeks':
        case 'week':
          deadline.setDate(deadline.getDate() + (project.adminDuration * 7));
          break;
        case 'months':
        case 'month':
          deadline.setMonth(deadline.getMonth() + project.adminDuration);
          break;
        default:
          return project.deadline;
      }
      
      return deadline;
    }
    return project.deadline;
  };

  const getDaysRemaining = (deadline: Date) => {
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate progress based on time elapsed
  const calculateProgress = (): number => {
    if (project.progress !== undefined) return project.progress;
    
    if (!project.assignedAt) return 0;
    
    const now = new Date();
    const start = new Date(project.assignedAt);
    const end = getEffectiveDeadline();
    
    const totalTime = end.getTime() - start.getTime();
    const elapsedTime = now.getTime() - start.getTime();
    
    if (totalTime <= 0) return 100;
    
    const progress = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
    return Math.round(progress);
  };

  const effectiveDeadline = getEffectiveDeadline();
  const daysRemaining = getDaysRemaining(effectiveDeadline);
  const progress = calculateProgress();

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 50) return 'text-blue-600';
    if (progress >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDeadlineStatus = (days: number) => {
    if (days < 0) return { color: 'text-red-600', status: 'Overdue' };
    if (days <= 3) return { color: 'text-orange-600', status: 'Due Soon' };
    if (days <= 7) return { color: 'text-yellow-600', status: 'Due This Week' };
    return { color: 'text-green-600', status: 'On Track' };
  };

  const deadlineStatus = getDeadlineStatus(daysRemaining);
  
  // Get user-friendly status label
  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      'customer_approved': 'Approved - Awaiting Assignment',
      'ready_to_assign': 'Ready to Assign',
      'assigned': 'Assigned to Employee',
      'completed_by_employee': 'Completed - Awaiting Approval',
      'awaiting_final_payment': 'Awaiting Final Payment',
      'completed': 'Completed',
      'priced': 'Priced - Awaiting Approval',
      'admin_review': 'Under Admin Review',
      'pending': 'Pending Review',
    };
    return statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      'customer_approved': 'bg-green-100 text-green-800 border-green-200',
      'ready_to_assign': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'assigned': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed_by_employee': 'bg-teal-100 text-teal-800 border-teal-200',
      'awaiting_final_payment': 'bg-amber-100 text-amber-800 border-amber-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'priced': 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="self-start"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
              <div className="space-y-2">
                <CardTitle className="text-lg sm:text-xl break-words pr-2">{project.title}</CardTitle>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Badge variant="outline" className={`${getStatusColor(project.status)} self-start`}>
                    {getStatusLabel(project.status)}
                  </Badge>
                  <span className={`text-xs sm:text-sm font-medium ${deadlineStatus.color}`}>
                    {deadlineStatus.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Project Details */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="prose max-w-none">
                <p className="text-sm text-muted-foreground">
                  {project.description}
                </p>
              </div>

              {/* Skills */}
              {project.skills && project.skills.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Required Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {project.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Timeline & Progress - Show for assigned and ongoing projects */}
          {((project.status as string) === 'assigned' || 
            (project.status as string) === 'completed_by_employee' || 
            (project.status as string) === 'in_progress') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Timeline & Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Timeline Progress</span>
                    <span className={`font-medium ${daysRemaining < 0 ? 'text-destructive' : daysRemaining < 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : 
                       daysRemaining === 0 ? 'Due today' :
                       `${daysRemaining} days remaining`}
                    </span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Started: {project.assignedAt ? formatDate(project.assignedAt) : 'Not started'}</span>
                    <span>Deadline: {formatDate(effectiveDeadline)}</span>
                  </div>
                </div>

                <Separator />

                {/* Project Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.category && (
                    <div className="flex items-start gap-3">
                      <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Category</p>
                        <p className="text-sm text-muted-foreground">{project.category}</p>
                      </div>
                    </div>
                  )}
                  
                  {project.adminPrice && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Project Value</p>
                        <p className="text-sm text-muted-foreground">
                          LKR {project.adminPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {project.adminDuration && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Duration</p>
                        <p className="text-sm text-muted-foreground">
                          {project.adminDuration} {project.adminDurationUnit}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {project.assignedAt && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Assigned Date</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(project.assignedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Admin Instructions */}
                {project.adminNotes && (
                  <>
                    <Separator />
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Admin Instructions
                        </p>
                      </div>
                      <p className="text-sm text-blue-800 dark:text-blue-200 ml-7">
                        {project.adminNotes}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Awaiting Final Payment Section - Show when admin approved but payment not made */}
          {(project.status as string) === 'awaiting_final_payment' && (
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <AlertCircle className="w-5 h-5" />
                  Final Payment Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Great news! Your project has been completed and approved by our admin team.
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    To access and download your completed work files, please complete the final payment.
                  </p>
                </div>
                
                <div className="p-4 bg-white dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      Payment Details
                    </span>
                  </div>
                  {project.adminPrice && (
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Final Payment Amount: <span className="font-semibold">LKR {project.adminPrice.toLocaleString()}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    Your completed project files will be available for download immediately after payment confirmation.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Documents Section - Show when project is completed */}
          {(project.status as string) === 'completed' && project.documents && project.documents.length > 0 && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  Completed Work Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 sm:p-6">
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                  Download your completed work files below
                </p>
                {project.documents.map((doc: ProjectDocument, index: number) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = doc.url;
                        link.download = doc.name;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                ))}
                
                {/* Review Button - Show if not yet reviewed */}
                {!checkingReview && !project.customerRating && !hasReviewInCollection && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-1">
                          How was your experience?
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                          Share your feedback to help us improve our service.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setIsReviewDialogOpen(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Write a Review
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Existing Review Display */}
          {(project.status as string) === 'completed' && project.customerRating && (
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="bg-green-50 dark:bg-green-950">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  Your Review
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Star Rating Display */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= (project.customerRating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {project.customerRating} out of 5 stars
                  </span>
                </div>
                
                {/* Review Text */}
                {project.customerReview && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Your Feedback:</p>
                    <p className="text-sm leading-relaxed border-l-2 border-green-500 pl-3">
                      {project.customerReview}
                    </p>
                  </div>
                )}
                
                {/* Review Date */}
                {project.customerReviewedAt && (
                  <p className="text-xs text-muted-foreground">
                    Reviewed on {formatDate(new Date(project.customerReviewedAt))}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Assigned Employee Sidebar */}
        <div className="space-y-6">
          {/* Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${
                  project.status === 'completed' ? 'bg-green-100 dark:bg-green-950' :
                  project.status === 'assigned' ? 'bg-blue-100 dark:bg-blue-950' :
                  'bg-gray-100 dark:bg-gray-900'
                }`}>
                  <CheckCircle2 className={`w-6 h-6 ${
                    project.status === 'completed' ? 'text-green-600' :
                    project.status === 'assigned' ? 'text-blue-600' :
                    'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{getStatusLabel(project.status)}</p>
                  <p className="text-sm text-muted-foreground">Current Status</p>
                </div>
              </div>

              {project.assignedAt && (
                <div className="pt-3 border-t text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Work started on {formatDate(project.assignedAt)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Documents Section - Show buyer's original uploaded documents */}
          {project.documents && project.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Your Project Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Documents you uploaded with this project
                </p>
                <div className="space-y-2">
                  {project.documents.map((doc: ProjectDocument, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border border-border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {doc.size && (
                              <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.url, '_blank')}
                        className="flex-shrink-0 ml-2"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Status</span>
                <Badge variant="outline" className={getStatusColor(project.status)}>
                  {getStatusLabel(project.status)}
                </Badge>
              </div>
              
              {((project.status as string) === 'assigned' || 
                (project.status as string) === 'completed_by_employee' || 
                (project.status as string) === 'in_progress') && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Timeline Progress</span>
                    <span className={`text-sm font-medium ${getProgressColor(progress)}`}>
                      {progress}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Deadline</span>
                    <span className={`text-sm ${deadlineStatus.color}`}>
                      {Math.abs(daysRemaining)} days {daysRemaining >= 0 ? 'left' : 'overdue'}
                    </span>
                  </div>
                </>
              )}

              {project.budgetMin && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Budget Range</span>
                  <span className="text-sm font-medium">
                    LKR {project.budgetMin.toLocaleString()}
                    {project.budgetMax && ` - LKR ${project.budgetMax.toLocaleString()}`}
                  </span>
                </div>
              )}

              {project.adminPrice && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Project Value</span>
                  <span className="text-sm font-medium">
                    LKR {project.adminPrice.toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Review Dialog */}
      <ProjectReviewDialog
        projectId={project.id}
        projectTitle={project.title}
        isOpen={isReviewDialogOpen}
        onClose={() => setIsReviewDialogOpen(false)}
        onReviewSubmitted={() => {
          // Optionally refresh the project data or show a success state
          window.location.reload();
        }}
      />
    </div>
  );
};