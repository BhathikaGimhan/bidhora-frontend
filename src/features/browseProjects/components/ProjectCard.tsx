import React from "react";
import { DollarSign, Clock, User, MapPin, Star, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Project, formatTimeAgo } from "@/Services/projectService";
import { useNavigate } from "react-router-dom";

interface ProjectCardProps {
  project: Project;
  index: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/project/${project.id}`);
  };

  const formatBudget = (min: number, max: number | null) => {
    if (max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    }
    return `$${min.toLocaleString()}`;
  };

  const formatDeadline = (deadline: Date) => {
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    if (diffDays < 7) return `Due in ${diffDays} days`;
    if (diffDays < 30) return `Due in ${Math.ceil(diffDays / 7)} weeks`;
    return `Due in ${Math.ceil(diffDays / 30)} months`;
  };

  return (
    <Card
      className={`p-4 sm:p-6 transition-all duration-300 border-border animate-fade-in animate-stagger w-full cursor-pointer ${
        project.isUrgent
          ? "hover:shadow-xl hover:shadow-red-500/20 border-red-500/30 bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5 hover:border-red-500/50 ring-1 ring-red-500/20"
          : "hover:shadow-lg hover:border-primary/50"
      }`}
      style={{ "--stagger": index } as React.CSSProperties}
      onClick={handleCardClick}
    >
      <CardHeader className="p-0 mb-4">
        {/* Title + Posted time */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-2 w-full">
          <CardTitle className="text-lg sm:text-xl text-foreground hover:text-primary transition-colors duration-300 break-words">
            {project.title}
            {project.isUrgent && (
              <Badge
                variant="destructive"
                className="ml-2 animate-pulse bg-gradient-to-r from-red-500 to-red-600 border-red-400 shadow-lg shadow-red-500/30"
              >
                <Zap className="w-3 h-3 mr-1" />
                URGENT
              </Badge>
            )}
          </CardTitle>
          <span className="text-xs sm:text-sm text-muted-foreground">
            {formatTimeAgo(project.createdAt)}
          </span>
        </div>

        <CardDescription className="text-foreground/80 text-sm sm:text-base leading-relaxed break-words line-clamp-3">
          {project.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {/* Skills */}
        <div className="mb-4 flex flex-wrap gap-2">
          {project.skills.slice(0, 5).map((skill: string, i: number) => (
            <Badge
              key={i}
              variant="secondary"
              className="bg-primary/10 text-primary text-xs sm:text-sm"
            >
              {skill}
            </Badge>
          ))}
          {project.skills.length > 5 && (
            <Badge variant="outline" className="text-xs sm:text-sm">
              +{project.skills.length - 5} more
            </Badge>
          )}
        </div>

        {/* Project Details */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-6 mb-4 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium text-foreground">
              {formatBudget(project.budgetMin, project.budgetMax)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>{formatDeadline(project.deadline)}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-4 h-4 flex-shrink-0" />
            <span>
              {project.bids} proposal{project.bids !== 1 ? "s" : ""}
            </span>
          </div>
          {project.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{project.location}</span>
            </div>
          )}
        </div>

        {/* Project Poster Info */}
        {project.poster && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="w-10 h-10">
              <AvatarImage
                src={project.poster.photoURL || undefined}
                alt={project.poster.displayName || "User"}
              />
              <AvatarFallback className="text-sm">
                {project.poster.displayName?.charAt(0).toUpperCase() ||
                  project.poster.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">
                  {project.poster.displayName || "Anonymous User"}
                </p>
                <Badge
                  variant={
                    project.poster.role === "admin"
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {project.poster.role}
                </Badge>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground">
                  4.8 • Member since{" "}
                  {new Date(project.poster.createdAt).getFullYear()}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
