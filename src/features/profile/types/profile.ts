export interface BaseUser {
  uid: string;
  name: string;
  email: string;
  displayName?: string;
  profileUrl?: string;
  photoURL?: string;
  coverImage?: string;
  role: 'buyer' | 'employee' | 'admin';
  isVerified: boolean;
  createdAt: Date | { toDate(): Date }; // Allow Firestore Timestamp
  updatedAt: Date | { toDate(): Date }; // Allow Firestore Timestamp
  status: 'active' | 'inactive' | 'banned';
}

export interface UserProfile extends BaseUser {
  username?: string;
  headline?: string;
  bio?: string;
  rating: number;
  totalReviews: number;
  responseTime?: string;
  languages: string[];
  credits?: number;
  availability?: 'available' | 'busy' | 'unavailable';
  location?: string;
  phoneNumber?: string;
  skills?: string[];
  averageRating?: number;
  completedProjects?: Project[];
  postedProjects?: Project[];
  // Employee/Freelancer work statistics
  activeProjects?: number;
  totalEarnings?: number;
  totalHours?: number;
  successRate?: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  createdAt: Date | { toDate(): Date };
  completedAt?: Date | { toDate(): Date };
  rating?: number;
  duration?: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerPhotoURL?: string;
  revieweeId: string;
  revieweeName: string;
  projectId: string;
  projectTitle: string;
  rating: number; // 1-5 stars
  comment: string;
  createdAt: Date | { toDate(): Date };
  updatedAt?: Date | { toDate(): Date };
  isVerified: boolean; // Whether reviewer has completed projects with reviewee
  helpfulVotes: string[]; // Array of user IDs who found this review helpful
  reactions: {
    likes: string[]; // User IDs who liked this review
    dislikes: string[]; // User IDs who disliked this review
  };
}

export interface ProjectReaction {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  reaction: 'like' | 'dislike' | 'helpful';
  createdAt: Date | { toDate(): Date };
}

// Employee profile - for users assigned to work on projects
export interface EmployeeProfile extends UserProfile {
  role: 'employee';
  skills: string[];
  completedProjectsCount: number;
  totalEarnings: number;
  averageDeliveryTime?: string;
  expertise?: string[];
  certifications?: string[];
}

export interface BuyerProfile extends UserProfile {
  role: 'buyer';
  totalProjectsPosted: number;
  totalSpent: number;
  activeProjects: number;
}

export interface ProjectDelivery {
  id: string;
  projectId: string;
  projectTitle: string;
  completedDate: string;
  deliveryTime: string;
  budget: string;
  clientRating: number;
  clientName?: string;
  clientId: string;
}

export interface Review {
  id: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
  projectTitle: string;
  projectId: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  skills: string[];
}

export type UserProfileData = EmployeeProfile | BuyerProfile;

export interface ProfileViewProps {
  profile: UserProfileData;
  isOwnProfile: boolean;
  currentUser: BaseUser | null;
  onProfileUpdate: (updates: Partial<UserProfileData>) => Promise<void>;
}

export interface EditableField {
  value: string;
  isEditing: boolean;
  originalValue: string;
}

// API response types
export interface ProfileAPIResponse {
  message: string;
  user: UserProfile;
  isOwnProfile: boolean;
}