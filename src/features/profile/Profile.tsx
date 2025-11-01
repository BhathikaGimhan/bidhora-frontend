import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileBio } from "./components/ProfileBio";
import { ReviewsSection } from "./components/ReviewsSection";
import { BuyerProjects } from "./components/buyer/BuyerProjects";
import { BuyerNavbar } from "./components/buyer/BuyerNavbar";
import {
  AdminNavbar,
  AdminHeader,
  AdminProfileSection,
  AdminDashboardSection,
} from "./admin/components";
import {
  EmployeeNavbar,
  EmployeeHeader,
  EmployeeProfileSection,
  EmployeeDashboardSection,
} from "./employee/components";
import { userProfileService } from "../../Services/userProfileService";
import { getBuyerProjects, BuyerProject } from "../../Services/projectService";
import { UserProfile } from "./types/profile";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProfileProps {
  userId?: string; // Optional prop to view specific user's profile
}

export default function Profile({ userId: propUserId }: ProfileProps) {
  const { id: paramUserId } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [buyerActiveTab, setBuyerActiveTab] = useState<
    "profile" | "projects" | "ongoing"
  >("profile");
  const [adminActiveTab, setAdminActiveTab] = useState<"profile" | "dashboard">(
    "profile"
  );
  const [employeeActiveTab, setEmployeeActiveTab] = useState<
    "profile" | "dashboard"
  >("profile");
  const [buyerProjects, setBuyerProjects] = useState<BuyerProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const userId = propUserId || paramUserId;

  // Debug log to track URL parameter changes
  useEffect(() => {
    console.log(
      "URL parameters changed - propUserId:",
      propUserId,
      "paramUserId:",
      paramUserId,
      "final userId:",
      userId
    );
  }, [propUserId, paramUserId, userId]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        // Reset profile state immediately when userId changes
        setProfile(null);
        setBuyerProjects([]);
        setIsOwnProfile(false);

        console.log("🔄 Fetching profile for userId:", userId);

        let profileData;

        if (userId) {
          // Fetch specific user's profile
          console.log("👤 Calling getUserProfileById with:", userId);
          profileData = await userProfileService.getUserProfileById(userId);
        } else {
          // Fetch current user's profile
          console.log("🏠 Calling getCurrentUserProfile");
          profileData = await userProfileService.getCurrentUserProfile();
        }

        console.log("📦 Profile data received:");
        console.log("  - User ID:", profileData.user?.uid);
        console.log("  - Display Name:", profileData.user?.displayName);
        console.log("  - Email:", profileData.user?.email);
        console.log("  - Role:", profileData.user?.role);
        console.log("  - Is Own Profile:", profileData.isOwnProfile);
        console.log("  - Requested ID:", userId);
        console.log(
          "  - Match Check:",
          profileData.user?.uid === userId ? "✅ MATCH" : "❌ MISMATCH"
        );

        setProfile(profileData.user);
        setIsOwnProfile(profileData.isOwnProfile);

        // 🚨 BACKEND ISSUE DETECTION
        if (userId && profileData.user && profileData.user.uid !== userId) {
          console.error("🚨 BACKEND ISSUE DETECTED:");
          console.error("  - Requested userId:", userId);
          console.error("  - Received user.uid:", profileData.user.uid);
          console.error("  - The backend is returning the wrong user profile!");
          console.error(
            "  - API endpoint /user/profile/${userId} is probably ignoring the userId parameter"
          );

          // For now, show an error to the user
          setError(
            `Unable to load profile for user ${userId}. Backend returned different user data.`
          );
          return;
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load profile"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // Fetch buyer projects when profile is loaded and user is a buyer
  useEffect(() => {
    const fetchBuyerProjects = async () => {
      // Reset buyer projects first
      setBuyerProjects([]);
      setProjectsError(null);

      if (profile && profile.role === "buyer") {
        try {
          setProjectsLoading(true);
          console.log("Fetching buyer projects for:", profile.uid);

          // Use the getBuyerProjects service function to fetch from projects collection
          const { projects: fetchedProjects } = await getBuyerProjects(profile.uid);
          console.log("✅ Fetched buyer projects from service:", fetchedProjects);

          setBuyerProjects(fetchedProjects);

          // Log project statuses for debugging
          const projectStatuses = fetchedProjects.map(p => ({ 
            id: p.id, 
            title: p.title, 
            status: p.status 
          }));
          console.log("📊 Project statuses:", projectStatuses);

        } catch (error) {
          console.error("Error fetching buyer projects:", error);
          setProjectsError(
            error instanceof Error ? error.message : "Failed to load projects"
          );
          setBuyerProjects([]); // Ensure it's always an array
        } finally {
          setProjectsLoading(false);
        }
      } else {
        // Not a buyer, reset projects
        setBuyerProjects([]);
        setProjectsLoading(false);
      }
    };

    fetchBuyerProjects();
  }, [profile]); // Re-run when profile changes

  const refreshProjects = useCallback(async () => {
    if (profile && profile.role === "buyer") {
      try {
        setProjectsLoading(true);
        setProjectsError(null);
        console.log("Refreshing buyer projects for:", profile.uid);

        // Use the getBuyerProjects service function to fetch fresh data
        const { projects: fetchedProjects } = await getBuyerProjects(profile.uid);
        console.log("✅ Refreshed buyer projects:", fetchedProjects);

        setBuyerProjects(fetchedProjects);

      } catch (error) {
        console.error("Error refreshing buyer projects:", error);
        setProjectsError(
          error instanceof Error ? error.message : "Failed to refresh projects"
        );
      } finally {
        setProjectsLoading(false);
      }
    }
  }, [profile]);

  // Calculate project counts by status
    const projectCounts = buyerProjects.reduce(
      (acc, project) => {
        switch (project.status) {
          case "pending":
            acc.open += 1;
            break;
          case "ongoing":
            acc.ongoing += 1;
            break;
          case "completed":
            acc.completed += 1;
            break;
          case "closed":
            acc.completed += 1; // Treat closed as completed
            break;
          default:
            break;
        }
        return acc;
      },
      { open: 0, ongoing: 0, completed: 0 }
    );  // Refresh projects when component mounts or when returning to this page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && profile && profile.role === "buyer") {
        refreshProjects();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [profile, refreshProjects]);

  const handleProfileUpdate = (updatedProfile: Partial<UserProfile>) => {
    if (profile) {
      setProfile({ ...profile, ...updatedProfile });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6">
          <Alert variant="destructive">
            <AlertDescription>
              {error || "Profile not found"}
              {error?.includes("Backend returned different user data") && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <p className="text-yellow-800 font-medium">
                    🔧 Technical Issue Detected
                  </p>
                  <p className="text-yellow-700 mt-1">
                    The backend API endpoint is not correctly handling user
                    profile requests by ID. This needs to be fixed on the
                    backend server.
                  </p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Show ProfileHeader for buyers/sellers, AdminHeader for admins, EmployeeHeader for employees */}
      {profile.role === "admin" ? (
        <>
          <AdminHeader profile={profile} isOwnProfile={isOwnProfile} />
          <br />
        </>
      ) : profile.role === "employee" ? (
        <>
          <EmployeeHeader profile={profile} isOwnProfile={isOwnProfile} />
          <br />
        </>
      ) : (
        <>
          <ProfileHeader
            profile={profile}
            isOwnProfile={isOwnProfile}
            onProfileUpdate={handleProfileUpdate}
            buyerProjects={buyerProjects}
            isEditMode={isEditMode}
            onEditModeChange={setIsEditMode}
          />
          <br />
        </>
      )}

      {/* Buyer Navigation - Show under profile header */}
      {profile.role === "buyer" && (
        <div className="bg-background border-b">
          <div className="container mx-auto px-4">
            <BuyerNavbar
              activeTab={buyerActiveTab}
              onTabChange={setBuyerActiveTab}
            />
          </div>
        </div>
      )}

      {/* Admin Navigation - Show under profile header like buyers and sellers */}
      {profile.role === "admin" && (
        <div className="bg-background border-b">
          <div className="container mx-auto px-4">
            <AdminNavbar
              activeTab={adminActiveTab}
              onTabChange={setAdminActiveTab}
            />
          </div>
        </div>
      )}

      {/* Employee Navigation - Show under profile header */}
      {profile.role === "employee" && (
        <div className="bg-background border-b">
          <div className="container mx-auto px-4">
            <EmployeeNavbar
              activeTab={employeeActiveTab}
              onTabChange={setEmployeeActiveTab}
            />
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {profile.role === "admin" ? (
          // Admin Layout - Same structure as seller/buyer
          <div className="w-full">
            {adminActiveTab === "profile" && (
              <AdminProfileSection profile={profile} />
            )}

            {adminActiveTab === "dashboard" && <AdminDashboardSection />}
          </div>
        ) : profile.role === "employee" ? (
          // Employee Layout - Same structure as admin
          <div className="w-full">
            {employeeActiveTab === "profile" && (
              <EmployeeProfileSection profile={profile} />
            )}

            {employeeActiveTab === "dashboard" && (
              <EmployeeDashboardSection profile={profile} />
            )}
          </div>
        ) : profile.role === "buyer" ? (
          // Buyer Layout - Show content based on active tab
          <div className="w-full">
            {buyerActiveTab === "profile" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Bio */}
                <div className="lg:col-span-2 space-y-8">
                  <ProfileBio
                    profile={profile}
                    isOwnProfile={isOwnProfile}
                    onProfileUpdate={handleProfileUpdate}
                    isEditMode={isEditMode}
                  />
                  <ReviewsSection
                    userId={profile.uid}
                    currentUserId={isOwnProfile ? profile.uid : undefined}
                  />
                  <div className="bg-card rounded-lg border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        Posted Projects
                      </h3>
                      {buyerProjects.length > 5 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBuyerActiveTab("projects");
                          }}
                        >
                          View All Projects
                        </Button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {projectsLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <LoadingSpinner />
                        </div>
                      ) : projectsError ? (
                        <Alert variant="destructive">
                          <AlertDescription>{projectsError}</AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          {buyerProjects.slice(0, 5).map((project) => (
                            <div
                              key={project.id}
                              className="border rounded-xl p-5 hover:shadow-md hover:bg-muted/30 transition-all duration-200"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-semibold text-lg">
                                    {project.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {project.description}
                                  </p>
                                </div>

                                {/* Status Badge */}
                                <span
                                  className={`px-3 py-1 text-xs font-medium rounded-full
                ${
                  project.status === "pending"
                    ? "bg-green-100 text-green-700"
                    : project.status === "ongoing"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-200 text-gray-700"
                }`}
                                >
                                  {project.status}
                                </span>
                              </div>

                              {/* Meta Info */}
                              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                                <span className="px-2 py-1 bg-muted rounded-md">
                                  💰 Budget: $
                                  {project.budget || project.budgetMin}
                                </span>
                              </div>
                            </div>
                          ))}

                          {buyerProjects.length === 0 && (
                            <p className="text-muted-foreground">
                              No projects posted
                            </p>
                          )}

                          {buyerProjects.length > 5 && (
                            <div className="text-center pt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setBuyerActiveTab("projects");
                                }}
                                className="text-sm text-muted-foreground hover:text-foreground"
                              >
                                View {buyerProjects.length - 5} more projects →
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Buyer Stats */}
                <div className="space-y-6">
                  <div className="bg-card rounded-lg border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        Profile Stats
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshProjects}
                        disabled={projectsLoading}
                        className="text-xs"
                      >
                        {projectsLoading ? (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "Refresh"
                        )}
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Open Projects
                        </span>
                        <span className="font-medium">
                          {projectCounts.open}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Ongoing Projects
                        </span>
                        <span className="font-medium">
                          {projectCounts.ongoing}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Completed Projects
                        </span>
                        <span className="font-medium">
                          {projectCounts.completed}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-3">
                        <span className="text-muted-foreground font-medium">
                          Total Projects
                        </span>
                        <span className="font-medium">
                          {buyerProjects.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Member Since
                        </span>
                        <span className="font-medium">
                          {(() => {
                            if (!profile.createdAt) return "N/A";
                            let dateObj: Date;
                            if (profile.createdAt instanceof Date) {
                              dateObj = profile.createdAt;
                            } else if (
                              "toDate" in profile.createdAt &&
                              typeof profile.createdAt.toDate === "function"
                            ) {
                              dateObj = profile.createdAt.toDate();
                            } else if (
                              typeof profile.createdAt === "object" &&
                              profile.createdAt !== null &&
                              "_seconds" in profile.createdAt
                            ) {
                              const timestampData = profile.createdAt as {
                                _seconds: number;
                                _nanoseconds?: number;
                              };
                              dateObj = new Date(
                                timestampData._seconds * 1000 +
                                  Math.floor(
                                    (timestampData._nanoseconds || 0) / 1e6
                                  )
                              );
                            } else if (
                              typeof profile.createdAt === "string" ||
                              typeof profile.createdAt === "number"
                            ) {
                              dateObj = new Date(profile.createdAt);
                            } else {
                              return "N/A";
                            }
                            return dateObj.getFullYear();
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Profile Complete
                        </span>
                        <span className="font-medium">
                          {Math.round(
                            (Object.values(profile).filter(Boolean).length /
                              Object.keys(profile).length) *
                              100
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(buyerActiveTab === "projects" ||
              buyerActiveTab === "ongoing") && (
              <div className="w-full">
                <BuyerProjects
                  buyerId={profile.uid}
                  isOwnProfile={isOwnProfile}
                  defaultTab={buyerActiveTab === "ongoing" ? "ongoing" : "open"}
                  projects={buyerProjects}
                  onProjectDeleted={refreshProjects}
                  currentUserId={profile.uid}
                  currentUserName={profile.displayName || profile.email || "Anonymous"}
                  currentUserPhotoURL={profile.photoURL}
                />
              </div>
            )}
          </div>
        ) : (
          // No seller role handling - only buyer, admin, and employee roles supported
          <div className="w-full">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Invalid user role</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
