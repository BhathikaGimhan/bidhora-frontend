import { User, UserStats } from "@/features/admin/models/UserModel";
import { db } from "@/firebaseConfig";
import { collection, getDocs, query, orderBy, limit, Timestamp } from "firebase/firestore";

class UserController {
  private users: User[] = [];
  private lastFetch: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  async fetchUsers(): Promise<User[]> {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (this.users.length > 0 && now - this.lastFetch < this.CACHE_DURATION) {
      return this.users;
    }

    try {
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      
      this.users = usersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.displayName || data.name || "Unknown User",
          email: data.email || "N/A",
          role: data.role || "client",
          status: data.status || "active",
          avatar: data.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.displayName || "User")}&background=10b981&color=fff`,
          joinedDate: data.createdAt ? new Date(data.createdAt.toDate()).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          lastActive: data.lastLoginAt ? new Date(data.lastLoginAt.toDate()).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          totalProjects: data.totalProjects || 0,
          totalEarnings: data.totalEarnings || 0,
          rating: data.rating || 0,
          verified: data.emailVerified || false,
        };
      });

      this.lastFetch = now;
      return this.users;
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await this.fetchUsers();
  }

  async getUserById(id: string): Promise<User | undefined> {
    const users = await this.fetchUsers();
    return users.find((user) => user.id === id);
  }

  async getUserStats(): Promise<UserStats> {
    const users = await this.fetchUsers();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      newUsersThisMonth: users.filter((u) => {
        const joinedDate = new Date(u.joinedDate);
        return joinedDate.getMonth() === currentMonth && joinedDate.getFullYear() === currentYear;
      }).length,
      bannedUsers: users.filter((u) => u.status === "banned").length,
    };
  }

  async getRecentUsers(count: number = 5): Promise<User[]> {
    const users = await this.fetchUsers();
    return users
      .sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime())
      .slice(0, count);
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
