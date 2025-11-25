export interface Review {
  id: string;
  projectId: string;
  projectTitle: string;
  projectCategory?: string;
  reviewerId: string;
  reviewerName: string;
  reviewerPhotoURL?: string;
  revieweeId: string;
  rating: number; // 1-5 stars
  comment: string;
  helpfulVotes: string[]; // Array of user IDs who marked as helpful
  reactions: {
    likes: string[]; // Array of user IDs who liked
    dislikes: string[]; // Array of user IDs who disliked
  };
  isVerified: boolean; // Whether the reviewer is verified
  createdAt: Date | { toDate(): Date };
  updatedAt?: Date | { toDate(): Date };
}

export interface ReviewVote {
  reviewId: string;
  userId: string;
  type: 'helpful' | 'like' | 'dislike';
  createdAt: Date | { toDate(): Date };
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  skills?: string[];
  rating?: number;
  reviewCount?: number;
  completedProjects?: number;
  ongoingProjects?: number;
  openProjects?: number;
  createdAt: Date | { toDate(): Date };
  updatedAt?: Date | { toDate(): Date };
  isVerified?: boolean;
  role?: 'buyer' | 'employee' | 'admin';
}

export interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: Date | { toDate(): Date };
  status: 'open' | 'ongoing' | 'completed' | 'cancelled';
  buyerId: string;
  buyerName: string;
  buyerPhotoURL?: string;
  serviceProviderId?: string;
  serviceProviderName?: string;
  serviceProviderPhotoURL?: string;
  category: string;
  skills: string[];
  attachments?: string[];
  createdAt: Date | { toDate(): Date };
  updatedAt?: Date | { toDate(): Date };
  completedAt?: Date | { toDate(): Date };
}

export interface Proposal {
  id: string;
  projectId: string;
  serviceProviderId: string;
  serviceProviderName: string;
  serviceProviderPhotoURL?: string;
  coverLetter: string;
  proposedBudget: number;
  estimatedDuration: number; // in days
  attachments?: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: Date | { toDate(): Date };
  updatedAt?: Date | { toDate(): Date };
}

export interface Notification {
  id: string;
  userId: string;
  type: 'project_update' | 'proposal_received' | 'proposal_accepted' | 'project_completed' | 'review_received' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string; // projectId, proposalId, etc.
  createdAt: Date | { toDate(): Date };
}