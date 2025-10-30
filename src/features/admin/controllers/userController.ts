import { User, UserStats } from "@/features/admin/models/UserModel";

// Mock data
const mockUsers: User[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "contact@bidhora.com",
    role: "freelancer",
    status: "active",
    avatar: "https://i.pravatar.cc/150?img=1",
    joinedDate: "2024-01-15",
    lastActive: "2024-09-17",
    totalProjects: 23,
    totalEarnings: 12500,
    rating: 4.8,
    verified: true,
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "contact@bidhora.com",
    role: "client",
    status: "active",
    avatar: "https://i.pravatar.cc/150?img=2",
    joinedDate: "2024-02-20",
    lastActive: "2024-09-16",
    totalProjects: 8,
    totalEarnings: 0,
    rating: 4.5,
    verified: true,
  },
  {
    id: "3",
    name: "Alex Rivera",
    email: "contact@bidhora.com",
    role: "freelancer",
    status: "inactive",
    avatar: "https://i.pravatar.cc/150?img=3",
    joinedDate: "2024-03-10",
    lastActive: "2024-09-10",
    totalProjects: 15,
    totalEarnings: 8750,
    rating: 4.2,
    verified: false,
  },
  {
    id: "4",
    name: "Emma Wilson",
    email: "contact@bidhora.com",
    role: "admin",
    status: "active",
    avatar: "https://i.pravatar.cc/150?img=4",
    joinedDate: "2023-12-01",
    lastActive: "2024-09-17",
    totalProjects: 0,
    totalEarnings: 0,
    rating: 5.0,
    verified: true,
  },
];

class UserController {
  private users: User[] = mockUsers;

  getAllUsers(): User[] {
    return this.users;
  }

  getUserById(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  getUserStats(): UserStats {
    return {
      totalUsers: this.users.length,
      activeUsers: this.users.filter((u) => u.status === "active").length,
      newUsersThisMonth: this.users.filter(
        (u) => new Date(u.joinedDate).getMonth() === new Date().getMonth()
      ).length,
      bannedUsers: this.users.filter((u) => u.status === "banned").length,
    };
  }

  updateUserStatus(id: string, status: User["status"]): boolean {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex !== -1) {
      this.users[userIndex].status = status;
      return true;
    }
    return false;
  }

  deleteUser(id: string): boolean {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex !== -1) {
      this.users.splice(userIndex, 1);
      return true;
    }
    return false;
  }

  searchUsers(query: string): User[] {
    const lowercaseQuery = query.toLowerCase();
    return this.users.filter(
      (user) =>
        user.name.toLowerCase().includes(lowercaseQuery) ||
        user.email.toLowerCase().includes(lowercaseQuery) ||
        user.role.toLowerCase().includes(lowercaseQuery)
    );
  }
}

export const userController = new UserController();
