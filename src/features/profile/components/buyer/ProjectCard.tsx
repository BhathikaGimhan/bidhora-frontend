import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, DollarSign, Eye, Activity } from 'lucide-react';
import { Project } from '@/Services/projectService';

interface ProjectCardProps {
  project: Project & { 
    proposalsCount?: number; 
    status?: string; // Allow any string status
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
      case 'ongoing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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
    if (max === null) {
      return `$${min.toLocaleString()}+`;
    }
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
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
            className={`text-xs font-medium ${getStatusColor(project.status || 'pending')}`}
          >
            {(project.status || 'pending').charAt(0).toUpperCase() + (project.status || 'pending').slice(1)}
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
            <Users className="w-4 h-4" />
            <span>{project.proposalsCount || 0} proposals</span>
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

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          {onViewProject && (project.status === 'approved' || project.status === 'assigned' || project.status === 'completed') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewProject(project.id)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View My Project
            </Button>
          )}
          
          {onDeleteProject && canDelete && (project.status === 'pending') && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDeleteProject(project.id)}
              className="flex items-center gap-2"
            >
              🗑️ Delete Project
            </Button>
          )}
          
          {onViewDetails && (project.status === 'approved' || project.status === 'assigned') && (
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
        </div>
      </CardContent>
    </Card>
  );
};