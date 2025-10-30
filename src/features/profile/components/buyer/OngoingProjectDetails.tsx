import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  User, 
  Clock, 
  MessageCircle, 
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Project, User as UserType } from '@/Services/projectService';

interface OngoingProjectDetailsProps {
  project: Project & {
    status: string;
    assignedTo?: string;
    assignedSeller?: UserType;
    progress?: number; // 0-100
  };
  onBack: () => void;
  onContactSeller?: (sellerId: string, projectTitle?: string) => void;
  onViewSellerProfile?: (sellerId: string) => void;
}

export const OngoingProjectDetails = ({
  project,
  onBack,
  onContactSeller,
  onViewSellerProfile
}: OngoingProjectDetailsProps) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (deadline: Date) => {
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining(project.deadline);
  const progress = project.progress || 0;

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
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                    Ongoing
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

              {/* Project Metrics */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      ${project.budgetMin.toLocaleString()} 
                      {project.budgetMax && ` - $${project.budgetMax.toLocaleString()}`}
                    </p>
                    <p className="text-xs">Budget</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(project.deadline)}
                    </p>
                    <p className="text-xs">
                      {daysRemaining >= 0 ? `${daysRemaining} days left` : `${Math.abs(daysRemaining)} days overdue`}
                    </p>
                  </div>
                </div>
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

          {/* Progress Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Project Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className={`text-sm font-medium ${getProgressColor(progress)}`}>
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Progress Status */}
              <div className="flex items-center gap-2 text-sm">
                {progress === 0 && (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-yellow-600">Project not started</span>
                  </>
                )}
                {progress > 0 && progress < 100 && (
                  <>
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-600">Work in progress</span>
                  </>
                )}
                {progress === 100 && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Project completed</span>
                  </>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Progress is updated by the assigned seller
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Seller */}
        <div className="space-y-6">
          {project.assignedSeller ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assigned Seller</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={project.assignedSeller.photoURL || ''} 
                      alt={project.assignedSeller.displayName || 'User'} 
                    />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {project.assignedSeller.displayName || 'Anonymous'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {project.assignedSeller.email}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      const sellerId = project.assignedSeller?.uid || project.assignedTo || '';
                      console.log('🔍 OngoingProjectDetails - View Profile clicked');
                      console.log('  - assignedSeller?.uid:', project.assignedSeller?.uid);
                      console.log('  - assignedTo:', project.assignedTo);
                      console.log('  - Final sellerId:', sellerId);
                      onViewSellerProfile?.(sellerId);
                    }}
                    variant="outline"
                    className="w-full flex items-center gap-2"
                    disabled={!project.assignedSeller?.uid && !project.assignedTo}
                  >
                    <Eye className="w-4 h-4" />
                    View Profile
                  </Button>
                  
                  <Button
                    onClick={() => onContactSeller?.(project.assignedSeller?.uid || project.assignedTo || '', project.title)}
                    className="w-full flex items-center gap-2"
                    disabled={!project.assignedSeller?.uid && !project.assignedTo}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contact Seller
                  </Button>
                </div>

                <div className="pt-4 border-t text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>Assigned on {formatDate(project.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seller Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No seller assigned to this project yet
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Status</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Progress</span>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};