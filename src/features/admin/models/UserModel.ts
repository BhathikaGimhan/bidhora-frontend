export interface User {
  id: string;
  uid?: string;
  name: string;
  email: string;
  role: 'admin' | 'buyer' | 'employee';
  isMarketer?: boolean;
  promoCode?: string;
  commissionRate?: number;
  designation?: string; // Job designation for employees
  status: 'active' | 'inactive' | 'banned';
  avatar?: string;
  joinedDate: string;
  lastActive: string;
  totalProjects: number;
  totalEarnings: number;
  rating: number;
  verified: boolean;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  bannedUsers: number;
}