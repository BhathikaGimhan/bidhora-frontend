import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, DollarSign, Eye, Activity, Star } from 'lucide-react';
import { Project } from '@/Services/projectService';

interface ProjectCardProps {
  project: Project & { 
    status?: string | Project['status']; // Allow any string status or typed status
    assignedTo?: string;
  };
  onViewProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onViewDetails?: (projectId: string) => void;
  canDelete?: boolean;
}

export const ProjectCard = ({ project, onViewProject, onDeleteProject, onViewDetails, canDelete = false }: ProjectCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin_review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'priced':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'customer_approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ready_to_assign':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed_by_employee':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'admin_review':
        return 'Under Review';
      case 'priced':
        return 'Price Set - Awaiting Approval';
      case 'customer_approved':
        return 'Approved - Processing Payment';
      case 'ready_to_assign':
        return 'Ready to Assign';
      case 'assigned':
        return 'In Progress';
      case 'completed_by_employee':
        return 'Submitted - Under Review';
      case 'ongoing':
        return 'Ongoing';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'closed':
        return 'Closed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatBudget = (min: number, max: number | null) => {
    if (!max) {
      return `LKR ${min.toLocaleString()}+`;
    }
    return `LKR ${min.toLocaleString()} - LKR ${max.toLocaleString()}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground line-clamp-1">
              {project.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {project.description}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={`text-xs font-medium whitespace-nowrap ${getStatusColor(project.status || 'pending')}`}
          >
            {getStatusLabel(project.status || 'pending')}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Project Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <span>{formatBudget(project.budgetMin, project.budgetMax)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(project.deadline)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Posted: {formatDate(project.createdAt)}</span>
          </div>
        </div>

        {/* Skills */}
        {project.skills && project.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.skills.slice(0, 4).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {project.skills.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{project.skills.length - 4} more
              </Badge>
            )}
          </div>
        )}

        {/* Customer Review - Show for completed projects */}
        {project.status === 'completed' && project.customerRating && (
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium">Your Review</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= (project.customerRating || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                {project.customerRating}.0 stars
              </span>
            </div>
            {project.customerReview && (
              <p className="text-xs text-muted-foreground line-clamp-2 italic">
                "{project.customerReview}"
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          {/* View Details for ongoing projects */}
          {onViewDetails && (
            (project.status as string) === 'assigned' || 
            (project.status as string) === 'completed_by_employee' ||
            (project.status as string) === 'customer_approved' ||
            (project.status as string) === 'ready_to_assign'
          ) && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onViewDetails(project.id)}
              className="flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              View Progress
            </Button>
          )}

          {/* View completed project */}
          {onViewProject && project.status === 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewProject(project.id)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Completed Project
            </Button>
          )}

          {/* View priced project (awaiting customer decision) */}
          {onViewProject && (project.status as string) === 'priced' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewProject(project.id)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Price & Details
            </Button>
          )}
          
          {/* Delete only pending projects */}
          {onDeleteProject && canDelete && (
            project.status === 'pending' || 
            (project.status as string) === 'admin_review'
          ) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDeleteProject(project.id)}
              className="flex items-center gap-2"
            >
              🗑️ Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};