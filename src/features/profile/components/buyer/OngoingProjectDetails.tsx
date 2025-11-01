import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  User, 
  Clock, 
  MessageCircle, 
  Eye,
  CheckCircle2,
  AlertCircle,
  Download,
  FileText,
  Tag,
  Mail
} from 'lucide-react';
import { Project, User as UserType, ProjectDocument } from '@/Services/projectService';
import { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

interface OngoingProjectDetailsProps {
  project: Project & {
    status: string;
    assignedTo?: string;
    assignedSeller?: UserType;
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

interface EmployeeInfo {
  displayName: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
}

export const OngoingProjectDetails = ({
  project,
  onBack,
  onContactSeller,
  onViewSellerProfile
}: OngoingProjectDetailsProps) => {
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch employee information
  useEffect(() => {
    const fetchEmployeeInfo = async () => {
      const employeeId = project.assignedEmployeeId || project.assignedTo;
      if (!employeeId) return;

      try {
        setLoading(true);
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', employeeId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setEmployeeInfo({
            displayName: userData.displayName || userData.name || 'Anonymous',
            email: userData.email || '',
            photoURL: userData.photoURL || userData.profileUrl,
            phoneNumber: userData.phoneNumber,
          });
        }
      } catch (error) {
        console.error('Error fetching employee info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeInfo();
  }, [project.assignedEmployeeId, project.assignedTo]);

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
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'priced': 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
              <div>
                <CardTitle className="text-xl">{project.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                  <span className={`text-sm font-medium ${deadlineStatus.color}`}>
                    {deadlineStatus.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                          ${project.adminPrice.toLocaleString()}
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

          {/* Completed Documents Section - Show when project is completed */}
          {(project.status as string) === 'completed' && project.documents && project.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Completed Work Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Download your completed work files below
                </p>
                {project.documents.map((doc: ProjectDocument, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
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
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Assigned Employee Sidebar */}
        <div className="space-y-6">
          {/* Employee Information */}
          {(project.assignedEmployeeId || project.assignedTo) ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assigned Employee</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : employeeInfo ? (
                  <>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-16 w-16">
                        <AvatarImage 
                          src={employeeInfo.photoURL || ''} 
                          alt={employeeInfo.displayName || 'Employee'} 
                        />
                        <AvatarFallback className="text-lg">
                          {employeeInfo.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {employeeInfo.displayName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {employeeInfo.email}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          const employeeId = project.assignedEmployeeId || project.assignedTo || '';
                          onViewSellerProfile?.(employeeId);
                        }}
                        variant="outline"
                        className="w-full flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Profile
                      </Button>
                      
                      <Button
                        onClick={() => {
                          const employeeId = project.assignedEmployeeId || project.assignedTo || '';
                          onContactSeller?.(employeeId, project.title);
                        }}
                        className="w-full flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Contact Employee
                      </Button>
                    </div>

                    {project.assignedAt && (
                      <div className="pt-4 border-t text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>Assigned on {formatDate(project.assignedAt)}</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback>
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {project.assignedEmployeeName || 'Employee'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {project.assignedEmployeeEmail || 'Loading...'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Employee Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No employee assigned to this project yet
                  </p>
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
                    ${project.budgetMin.toLocaleString()}
                    {project.budgetMax && ` - $${project.budgetMax.toLocaleString()}`}
                  </span>
                </div>
              )}

              {project.adminPrice && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Project Value</span>
                  <span className="text-sm font-medium">
                    ${project.adminPrice.toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};