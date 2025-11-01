import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FolderOpen, AlertCircle, Plus, Activity, Archive, Trash2 } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import { ProposalsList } from "./ProposalsList";
import { OngoingProjectDetails } from "./OngoingProjectDetails";
import { ReviewPrompt } from "../ReviewPrompt";
import { Project, Proposal, User as UserType, ProjectDocument } from "@/Services/projectService";
import {
  getBuyerProjects,
  getProjectProposals,
  approveProposal,
  rejectProposal,
  BuyerProject,
  BuyerProposal,
} from "@/Services/projectService";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface BuyerProjectsProps {
  buyerId: string;
  isOwnProfile?: boolean;
  defaultTab?: "open" | "ongoing" | "completed";
  onCreateProject?: () => void;
  projects?: BuyerProject[]; // Add optional projects prop
  onProjectDeleted?: () => void; // Callback when project is deleted
  currentUserId?: string;
  currentUserName?: string;
  currentUserPhotoURL?: string;
}

// Helper function to convert BuyerProject to Project for components
const buyerProjectToProject = (buyerProject: BuyerProject): Omit<Project, 'status'> & { 
  proposalsCount?: number; 
  status: 
    | "pending" 
    | "admin_review" 
    | "priced" 
    | "customer_approved" 
    | "ready_to_assign" 
    | "assigned" 
    | "completed_by_employee" 
    | "completed" 
    | "cancelled"
    | "ongoing" // Legacy status
    | "closed"; // Legacy status
  assignedTo?: string;
  documents?: ProjectDocument[];
  adminPrice?: number;
  adminDuration?: number;
  adminDurationUnit?: string;
  assignedAt?: Date;
  adminNotes?: string;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  assignedEmployeeEmail?: string;
} => {
  return {
    id: buyerProject.id,
    title: buyerProject.title,
    description: buyerProject.description,
    budgetMin: buyerProject.budgetMin,
    budgetMax: buyerProject.budgetMax || null,
    deadline: buyerProject.deadline,
    location: buyerProject.location,
    skills: buyerProject.skills,
    isUrgent: buyerProject.isUrgent,
    category: buyerProject.category,
    imageUrl: buyerProject.imageUrl || null,
    documents: buyerProject.documents || [], // Use actual documents from buyerProject
    createdBy: buyerProject.createdBy,
    createdAt: buyerProject.createdAt,
    bids: buyerProject.bids,
    buyerEmail: "",
    assignedTo: buyerProject.assignedTo,
    assignedEmployeeId: buyerProject.assignedEmployeeId || buyerProject.assignedTo,
    assignedEmployeeName: buyerProject.assignedEmployeeName || "",
    assignedEmployeeEmail: buyerProject.assignedEmployeeEmail || "",
    proposalsCount: buyerProject.proposalsCount,
    status: buyerProject.status,
    // Add additional fields for OngoingProjectDetails
    adminPrice: buyerProject.adminPrice,
    adminDuration: buyerProject.adminDuration,
    adminDurationUnit: buyerProject.adminDurationUnit as "days" | "weeks" | undefined,
    assignedAt: buyerProject.assignedAt,
    adminNotes: buyerProject.adminNotes,
  };
};

export const BuyerProjects = ({
  buyerId,
  isOwnProfile,
  defaultTab = "open",
  onCreateProject,
  projects: propProjects, // Rename to avoid conflict
  onProjectDeleted,
  currentUserId,
  currentUserName,
  currentUserPhotoURL,
}: BuyerProjectsProps) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<BuyerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<
    "projects" | "proposals" | "details"
  >("projects");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<
    "open" | "ongoing" | "completed"
  >(defaultTab);
  const [selectedProjectData, setSelectedProjectData] =
    useState<BuyerProject | null>(null);
  const [proposalsData, setProposalsData] = useState<{
    proposals: BuyerProposal[];
    loading: boolean;
    error: string | null;
  }>({
    proposals: [],
    loading: false,
    error: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [reviewPromptProject, setReviewPromptProject] = useState<BuyerProject | null>(null);
  const [previousProjects, setPreviousProjects] = useState<BuyerProject[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false); // Added missing state definition
  const [projectToDelete, setProjectToDelete] = useState<BuyerProject | null>(null); // Added missing state definition

  const fetchBuyerProjects = useCallback(async () => {
    // If projects are passed as props, use them instead of fetching
    if (propProjects) {
      const newProjects = propProjects;
      
      // Check for newly completed projects to show review prompt
      if (isOwnProfile && currentUserId && previousProjects.length > 0) {
        const newlyCompletedProjects = newProjects.filter(newProj => {
          const oldProj = previousProjects.find(p => p.id === newProj.id);
          return oldProj && oldProj.status !== 'completed' && newProj.status === 'completed';
        });
        
        if (newlyCompletedProjects.length > 0) {
          // Show review prompt for the first newly completed project
          setReviewPromptProject(newlyCompletedProjects[0]);
        }
      }
      
      setPreviousProjects(newProjects);
      setProjects(newProjects);
      console.log("Using prop projects:", newProjects);
      console.log(
        "Project statuses:",
        newProjects.map((p) => ({
          id: p.id,
          title: p.title,
          status: p.status,
        }))
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { projects: fetchedProjects } = await getBuyerProjects(buyerId);
      
      // Check for newly completed projects to show review prompt
      if (isOwnProfile && currentUserId && previousProjects.length > 0) {
        const newlyCompletedProjects = fetchedProjects.filter(newProj => {
          const oldProj = previousProjects.find(p => p.id === newProj.id);
          return oldProj && oldProj.status !== 'completed' && newProj.status === 'completed';
        });
        
        if (newlyCompletedProjects.length > 0) {
          // Show review prompt for the first newly completed project
          setReviewPromptProject(newlyCompletedProjects[0]);
        }
      }
      
      setPreviousProjects(fetchedProjects);
      setProjects(fetchedProjects);
      console.log("Fetched buyer projects:", fetchedProjects);
      console.log(
        "Project statuses:",
        fetchedProjects.map((p) => ({
          id: p.id,
          title: p.title,
          status: p.status,
        }))
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load projects"
      );
      console.error("Error fetching buyer projects:", error);
    } finally {
      setLoading(false);
    }
  }, [buyerId, propProjects, isOwnProfile, currentUserId, previousProjects]);

  useEffect(() => {
    fetchBuyerProjects();
  }, [fetchBuyerProjects]);

  // Refresh projects when returning to this tab/page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBuyerProjects();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchBuyerProjects]);

  const fetchProposalsForProject = async (projectId: string) => {
    try {
      setProposalsData((prev) => ({ ...prev, loading: true, error: null }));

      const { proposals } = await getProjectProposals(
        buyerId,
        projectId,
        "all"
      );

      setProposalsData({
        proposals,
        loading: false,
        error: null,
      });
    } catch (error) {
      setProposalsData({
        proposals: [],
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to load ProjectX",
      });
      console.error("Error fetching proposals:", error);
    }
  };

  const handleViewProposals = (projectId: string) => {
    setSelectedProject(projectId);
    const project = projects.find((p) => p.id === projectId);
    setSelectedProjectData(project);
    // Track which tab the project belongs to
    if (
      project?.status === "pending" ||
      (project?.status as string) === "open"
    ) {
      setCurrentTab("open");
    } else if (project?.status === "ongoing") {
      setCurrentTab("ongoing");
    } else if (project?.status === "completed") {
      setCurrentTab("completed");
    }
    fetchProposalsForProject(projectId);
    setCurrentView("proposals");
  };

  const handleViewDetails = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    setSelectedProject(projectId);
    setSelectedProjectData(project);
    // Track which tab the project belongs to
    if (
      project?.status === "pending" ||
      (project?.status as string) === "open"
    ) {
      setCurrentTab("open");
    } else if (project?.status === "ongoing") {
      setCurrentTab("ongoing");
    } else if (project?.status === "completed") {
      setCurrentTab("completed");
    }
    setCurrentView("details");
  };

  const handleViewProject = (projectId: string) => {
    // Navigate to the project detail page or open in a modal
    // For now, we'll use the existing detail view
    handleViewDetails(projectId);
  };

  const handleDeleteProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setProjectToDelete(project);
      setDeleteModalOpen(true);
    }
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    setDeleteLoading(true);
    try {
      const projectId = projectToDelete.id;

      // Delete from projects collection
      const { deleteDoc, doc } = await import("firebase/firestore");
      const { db } = await import("@/firebaseConfig");
      await deleteDoc(doc(db, "projects", projectId));

      // Update user profile to remove the project
      const { updateUserProfileForProject } = await import("@/Services/projectService");
      await updateUserProfileForProject(buyerId, projectId, { status: "cancelled" });

      // Immediately update local state to remove the project
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));

      // Notify parent component to refresh
      if (onProjectDeleted) {
        onProjectDeleted();
      }

      // Close modal and reset state
      setDeleteModalOpen(false);
      setProjectToDelete(null);

      // Show success message (you might want to use a toast here)
      console.log("Project deleted successfully!");

    } catch (error) {
      console.error("Error deleting project:", error);
      // Show error message (you might want to use a toast here)
      console.error("Failed to delete project. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleApproveProposal = async (
    proposalId: string,
    sellerId: string
  ) => {
    try {
      await approveProposal(buyerId, proposalId);

      // Update the project status to ongoing and assign seller
      setProjects((prev) =>
        prev.map((project) =>
          project.id === selectedProject
            ? { ...project, status: "ongoing" as const, assignedTo: sellerId }
            : project
        )
      );

      // Update the proposals data to reflect the change
      setProposalsData((prev) => ({
        ...prev,
        proposals: prev.proposals.map((proposal) =>
          proposal.id === proposalId
            ? { ...proposal, status: "accepted" as const } // Use 'accepted' for frontend
            : proposal
        ),
      }));

      alert(
        "ProjectX approved successfully! The ProjectX seller has been assigned to your project."
      );
    } catch (error) {
      console.error("Error approving proposal:", error);
      alert("Failed to approve ProjectX. Please try again.");
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    try {
      await rejectProposal(
        buyerId,
        proposalId,
        "Not suitable for this project"
      );

      setProposalsData((prev) => ({
        ...prev,
        proposals: prev.proposals.map((proposal) =>
          proposal.id === proposalId
            ? { ...proposal, status: "rejected" as const }
            : proposal
        ),
      }));

      alert("ProjectX rejected successfully.");
    } catch (error) {
      console.error("Error rejecting proposal:", error);
      alert("Failed to reject ProjectX. Please try again.");
    }
  };

  const handleBack = () => {
    setCurrentView("projects");
    setSelectedProject(null);
    setSelectedProjectData(null);
    setProposalsData({ proposals: [], loading: false, error: null });
  };

  const handleViewSellerProfile = (sellerId: string) => {
    console.log("🎯 handleViewSellerProfile called with sellerId:", sellerId);
    console.log("🚀 Navigating to seller profile:", `/profile/${sellerId}`);
    navigate(`/profile/${sellerId}`);
  };

  const filterProjectsByStatus = (status: string) => {
    return projects.filter((project) => {
      const projectStatus = project.status as string;
      
      if (status === "pending") {
        // "Open" tab: pending, admin_review, priced (awaiting customer decision)
        return (
          projectStatus === "pending" ||
          projectStatus === "admin_review" ||
          projectStatus === "priced" ||
          projectStatus === "open"
        );
      } else if (status === "ongoing") {
        // "Ongoing" tab: customer_approved, ready_to_assign, assigned, completed_by_employee
        return (
          projectStatus === "customer_approved" ||
          projectStatus === "ready_to_assign" ||
          projectStatus === "assigned" ||
          projectStatus === "completed_by_employee"
        );
      } else if (status === "completed") {
        // "Completed" tab: completed only
        return projectStatus === "completed";
      }
      return projectStatus === status;
    });
  };

  const openProjects = filterProjectsByStatus("pending");
  console.log("Open projects:", openProjects);
  console.log(
    "All projects:",
    projects.map((p) => ({ id: p.id, title: p.title, status: p.status }))
  );
  const ongoingProjects = filterProjectsByStatus("ongoing");
  const completedProjects = filterProjectsByStatus("completed");

  if (currentView === "proposals" && selectedProject && selectedProjectData) {
    return (
      <>
        <ProposalsList
          projectId={selectedProject}
          projectTitle={selectedProjectData.title}
          proposals={proposalsData.proposals}
          loading={proposalsData.loading}
          error={proposalsData.error}
          onBack={handleBack}
          onApproveProposal={handleApproveProposal}
          onRejectProposal={handleRejectProposal}
          isOwner={true}
        />
      </>
    );
  }

  if (currentView === "details" && selectedProject && selectedProjectData) {
    return (
      <>
        <OngoingProjectDetails
          project={buyerProjectToProject(selectedProjectData) as Project & { status: string; assignedTo?: string; assignedSeller?: UserType; progress?: number; }}
          onBack={handleBack}
          onViewSellerProfile={handleViewSellerProfile}
        />

        {/* Chat Modal removed - chat feature disabled */}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                {isOwnProfile ? "My Projects" : "Posted Projects"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isOwnProfile
                  ? "Manage your posted projects and track their progress"
                  : "View projects posted by this buyer"}
              </p>
            </div>
            {isOwnProfile && (
              <Button
                onClick={() => navigate("/post-project")}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Post New Project
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Tabs
          value={currentTab}
          onValueChange={(value) =>
            setCurrentTab(value as "open" | "ongoing" | "completed")
          }
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="open" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Open ({openProjects.length})
            </TabsTrigger>
            <TabsTrigger value="ongoing" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Ongoing ({ongoingProjects.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Completed ({completedProjects.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="space-y-4">
            {openProjects.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg mb-2">No open projects</h3>
                  <p className="text-muted-foreground mb-4">
                    {isOwnProfile
                      ? "You haven't posted any projects yet. Create your first project to get started."
                      : "This buyer hasn't posted any open projects yet."}
                  </p>
                  {isOwnProfile && (
                    <Button
                      onClick={() => navigate("/post-project")}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Post Your First Project
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {openProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={buyerProjectToProject(project) as Project & { proposalsCount?: number; status?: "ongoing" | "completed" | "pending" | "closed"; assignedTo?: string; }}
                    onViewProject={isOwnProfile ? handleViewProject : undefined}
                    onDeleteProject={isOwnProfile ? handleDeleteProject : undefined}
                    canDelete={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ongoing" className="space-y-4">
            {ongoingProjects.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg mb-2">
                    No ongoing projects
                  </h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile
                      ? "Projects that you've assigned to ProjectX sellers will appear here."
                      : "This buyer has no ongoing projects at the moment."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {ongoingProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={buyerProjectToProject(project) as Project & { proposalsCount?: number; status?: "ongoing" | "completed" | "pending" | "closed"; assignedTo?: string; }}
                    onViewProject={isOwnProfile ? handleViewProject : undefined}
                    onViewDetails={isOwnProfile ? handleViewDetails : undefined}
                    canDelete={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedProjects.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Archive className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg mb-2">
                    No completed projects
                  </h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile
                      ? "Completed projects will appear here."
                      : "This buyer has no completed projects yet."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {completedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={buyerProjectToProject(project) as Project & { proposalsCount?: number; status?: "ongoing" | "completed" | "pending" | "closed"; assignedTo?: string; }}
                    onViewProject={isOwnProfile ? handleViewProject : undefined}
                    canDelete={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Delete Project
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete this project?</p>
              {projectToDelete && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-medium">{projectToDelete.title}</p>
                  <p className="text-sm text-muted-foreground">
                    This action cannot be undone. The project will be permanently removed from your profile.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProject}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review Prompt Modal */}
      {reviewPromptProject && currentUserId && currentUserName && (
        <ReviewPrompt
          project={{
            id: reviewPromptProject.id,
            title: reviewPromptProject.title,
            description: reviewPromptProject.description,
            budget: reviewPromptProject.budgetMin,
            deadline: reviewPromptProject.deadline,
            status: 'completed',
            buyerId: reviewPromptProject.createdBy,
            buyerName: '', // Will be filled by the component if needed
            serviceProviderId: reviewPromptProject.assignedTo || undefined,
            serviceProviderName: '', // Will be filled by the component if needed
            category: reviewPromptProject.category,
            skills: reviewPromptProject.skills,
            createdAt: reviewPromptProject.createdAt,
          }}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserPhotoURL={currentUserPhotoURL}
          onClose={() => setReviewPromptProject(null)}
        />
      )}

      {/* Chat Modal removed - chat feature disabled */}
    </div>
  );
};
