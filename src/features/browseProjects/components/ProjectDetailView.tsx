import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, Clock, MapPin, User as UserIcon, Star, Send, Calendar, FileText, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  Project, 
  Proposal,
  type User,
  getProjectById, 
  getProposalsForProject,
  formatTimeAgo 
} from "@/Services/projectService";
import { auth } from "@/firebaseConfig";
import { getUserProfile } from "@/Services/authService";
import ProposalModal from "./ProposalModal";
import DocumentViewer from "@/components/DocumentViewer";
import SEO from "@/components/SEO";

const ProjectDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [isProjectOwner, setIsProjectOwner] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState(0);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
      fetchProposals();
      checkUserRole();
    }
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      if (!projectId) return;
      
      const projectData = await getProjectById(projectId);
      if (projectData) {
        setProject(projectData);
        
        // Check if current user is the project owner
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === projectData.createdBy) {
          setIsProjectOwner(true);
        }
      } else {
        toast({
          title: "Error",
          description: "Project not found",
          variant: "destructive",
        });
        navigate("/projects");
      }
    } catch (error: any) {
      console.error("Error fetching project:", error);
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProposals = async () => {
    try {
      if (!projectId) return;
      
      const proposalsData = await getProposalsForProject(projectId);
      setProposals(proposalsData);
    } catch (error: any) {
      console.error("Error fetching proposals:", error);
    }
  };

  const checkUserRole = async () => {
    try {
      const profile = await getUserProfile();
      setUserRole(profile.user.role);
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const handleProposalSuccess = () => {
    fetchProposals(); // Refresh proposals
    fetchProjectDetails(); // Refresh project to update bid count
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
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays < 7) return `Due in ${diffDays} days`;
    if (diffDays < 30) return `Due in ${Math.ceil(diffDays / 7)} weeks`;
    return `Due in ${Math.ceil(diffDays / 30)} months`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/projects")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {project && (
        <SEO 
          title={project.title}
          description={project.description.substring(0, 160)}
          keywords={`${project.category}, ${project.skills.join(", ")}, digital project, bidhora`}
        />
      )}
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/projects")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">
                      {project.title}
                      {project.isUrgent && (
                        <Badge variant="destructive" className="ml-2">
                          URGENT
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-base">
                      Posted {formatTimeAgo(project.createdAt)} • {project.bids} proposal{project.bids !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="font-semibold">{formatBudget(project.budgetMin, project.budgetMax)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Deadline</p>
                      <p className="font-semibold">{formatDeadline(project.deadline)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Proposals</p>
                      <p className="font-semibold">{project.bids}</p>
                    </div>
                  </div>
                  {project.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-semibold">{project.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Skills */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Project Description</h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                      {project.description}
                    </p>
                  </div>
                </div>

                {/* Project Documents */}
                {project.documents && project.documents.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Project Documents ({project.documents.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {project.documents.map((doc, index) => {
                        const fileExtension = doc.name.split('.').pop()?.toLowerCase();
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension || '');
                        
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              setSelectedDocumentIndex(index);
                              setDocumentViewerOpen(true);
                            }}
                            className="group relative flex items-center gap-3 p-4 border border-border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-all text-left"
                          >
                            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              {isImage ? (
                                <img 
                                  src={doc.url} 
                                  alt={doc.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <FileText className="w-6 h-6 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                {doc.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'View file'}
                              </p>
                            </div>
                            <Eye className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Proposals Section - Only visible to project owner */}
            {isProjectOwner && proposals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Proposals ({proposals.length})</CardTitle>
                  <CardDescription>
                    Review and manage proposals for your project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {proposals.map((proposal) => (
                      <div key={proposal.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          {proposal.sender && (
                            <Avatar className="w-10 h-10">
                              <AvatarImage 
                                src={proposal.sender.photoURL || undefined} 
                                alt={proposal.sender.displayName || 'User'} 
                              />
                              <AvatarFallback>
                                {proposal.sender.displayName?.charAt(0).toUpperCase() || 
                                 proposal.sender.email.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <p className="font-medium">
                                {proposal.sender?.displayName || 'Anonymous User'}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {proposal.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(proposal.createdAt)}
                              </span>
                            </div>
                            
                            {/* Enhanced proposal details */}
                            {proposal.biddingPrice && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Bid Amount</p>
                                    <p className="font-semibold">${proposal.biddingPrice.toLocaleString()}</p>
                                  </div>
                                </div>
                                {proposal.estimatedDuration && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Duration</p>
                                      <p className="font-semibold">
                                        {proposal.estimatedDuration} {proposal.durationUnit}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {proposal.deliveryDate && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-purple-600" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Delivery</p>
                                      <p className="font-semibold">
                                        {proposal.deliveryDate.toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Proposal notes */}
                            <div className="mb-3">
                              <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                                {proposal.additionalNotes || proposal.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Poster */}
            {project.poster && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About the Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage 
                        src={project.poster.photoURL || undefined} 
                        alt={project.poster.displayName || 'User'} 
                      />
                      <AvatarFallback>
                        {project.poster.displayName?.charAt(0).toUpperCase() || 
                         project.poster.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{project.poster.displayName || 'Anonymous User'}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">4.8 rating</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Member since:</span>
                      <span>{new Date(project.poster.createdAt).getFullYear()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role:</span>
                      <Badge variant="secondary" className="text-xs">
                        {project.poster.role}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Proposal - Removed as seller role no longer exists */}
            {/* Admin will assign employees directly to projects */}
            
           
            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <Badge variant="outline">{project.category}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Posted:</span>
                    <span>{formatTimeAgo(project.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deadline:</span>
                    <span>{project.deadline.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Proposals:</span>
                    <span>{project.bids}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Proposal Modal */}
        {projectId && project && (
          <ProposalModal
            isOpen={isProposalModalOpen}
            onClose={() => setIsProposalModalOpen(false)}
            projectId={projectId}
            projectTitle={project.title}
            onSuccess={handleProposalSuccess}
          />
        )}

        {/* Document Viewer */}
        {project && project.documents && project.documents.length > 0 && (
          <DocumentViewer
            files={project.documents}
            isOpen={documentViewerOpen}
            onClose={() => setDocumentViewerOpen(false)}
            initialFileIndex={selectedDocumentIndex}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectDetailView;