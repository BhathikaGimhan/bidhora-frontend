// Re-export types from projectService for consistency
export type { Proposal, Project, User } from '../../../Services/projectService';

export interface ProposalWithProject extends Proposal {
  project?: Project;
}

export interface ProposalsSectionProps {
  userId: string;
  isOwnProfile: boolean;
}