import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import HeroSection from "./components/HeroSection";
import SearchFilterBar, {
  SortOption,
  BudgetRange,
} from "./components/SearchFilterBar";
import ProjectsGrid from "./components/ProjectsGrid";
import { Project, getProjectsWithUserDetails } from "@/Services/projectService";

const BrowseProjects: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [budgetRange, setBudgetRange] = useState<BudgetRange>("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch projects with user details
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const projectsWithUserDetails = await getProjectsWithUserDetails();
        // Initial sort by newest (default)
        const sortedProjects = [...projectsWithUserDetails].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setProjects(sortedProjects);
      } catch (error: unknown) {
        console.error("Error fetching projects:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load projects. Please try again later.";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [toast]);

  // Helper function to check if project matches budget range
  const matchesBudgetRange = (
    project: Project,
    range: BudgetRange
  ): boolean => {
    if (range === "all") return true;

    const budget = project.budgetMax || project.budgetMin;

    switch (range) {
      case "0-1000":
        return budget <= 1000;
      case "1000-5000":
        return budget > 1000 && budget <= 5000;
      case "5000-10000":
        return budget > 5000 && budget <= 10000;
      case "10000+":
        return budget > 10000;
      default:
        return true;
    }
  };

  // Filtering logic
  const filteredProjects = projects.filter((project) => {
    // Show urgent projects (don't hide them)
    // Hide projects with approved proposals (assignedTo field exists)
    if (project.assignedTo) {
      return false;
    }

    // Search filter
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filter
    const matchesCategory =
      category === "all" ||
      project.category.toLowerCase() === category.toLowerCase() ||
      project.skills.some((skill) =>
        skill.toLowerCase().includes(category.toLowerCase())
      );

    // Budget range filter
    const matchesBudget = matchesBudgetRange(project, budgetRange);

    return matchesSearch && matchesCategory && matchesBudget;
  });

  // Sorting logic - Urgent projects first, then by selected criteria
  const sortedAndFilteredProjects = [...filteredProjects].sort((a, b) => {
    // Urgent projects always come first
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;

    // If both are urgent or both are not urgent, apply secondary sorting
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

      case "budget-high": {
        const budgetA = a.budgetMax || a.budgetMin;
        const budgetB = b.budgetMax || b.budgetMin;
        return budgetB - budgetA;
      }

      case "budget-low": {
        const budgetA2 = a.budgetMax || a.budgetMin;
        const budgetB2 = b.budgetMax || b.budgetMin;
        return budgetA2 - budgetB2;
      }

      case "deadline-soon":
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();

      case "deadline-later":
        return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();

      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <div className="container mx-auto px-4 py-8">
        <SearchFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          category={category}
          setCategory={setCategory}
          sortBy={sortBy}
          setSortBy={setSortBy}
          budgetRange={budgetRange}
          setBudgetRange={setBudgetRange}
        />

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {loading ? (
              "Loading projects..."
            ) : (
              <>
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {sortedAndFilteredProjects.length}
                </span>{" "}
                project
                {sortedAndFilteredProjects.length !== 1 ? "s" : ""}
                {searchTerm && ` matching "${searchTerm}"`}
                {category !== "all" && ` in ${category}`}
                {budgetRange !== "all" && ` within budget range`}
              </>
            )}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : sortedAndFilteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground mb-2">
              No projects found
            </p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <ProjectsGrid projects={sortedAndFilteredProjects} />
        )}
      </div>
    </div>
  );
};

export default BrowseProjects;
