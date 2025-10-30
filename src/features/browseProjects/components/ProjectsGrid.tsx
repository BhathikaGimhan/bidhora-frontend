import React from "react";
import ProjectCard from "./ProjectCard";
import { Project } from "@/Services/projectService";

interface ProjectsGridProps {
  projects: Project[];
}

const ProjectsGrid: React.FC<ProjectsGridProps> = ({ projects }) => {
  return (
    <div className="grid gap-6 grid-cols-1">
      {projects.length > 0 ? (
        projects.map((project, index) => (
          <ProjectCard key={project.id || index} project={project} index={index} />
        ))
      ) : (
        <p className="text-center text-muted-foreground col-span-full">
          No projects found.
        </p>
      )}
    </div>
  );
};

export default ProjectsGrid;
