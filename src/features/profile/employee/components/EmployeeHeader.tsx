import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  LogOut,
  Mail,
  Calendar,
  Settings,
  User,
} from "lucide-react";
import { UserProfile } from "../../types/profile";
import { signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getFirestore, onSnapshot } from 'firebase/firestore';

interface EmployeeHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
}

export const EmployeeHeader = ({ profile, isOwnProfile }: EmployeeHeaderProps) => {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [workStats, setWorkStats] = useState({
    completed: 0,
  });

  useEffect(() => {
    if (!profile.uid) return;

    const db = getFirestore();
    const projectsRef = collection(db, 'projects');
    
    // Query projects assigned to this employee
    const q = query(
      projectsRef,
      where('assignedEmployeeId', '==', profile.uid)
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let completed = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const status = data.status || 'assigned';
        
        // Count completed projects
        if (status === 'completed' || status === 'completed_by_employee') {
          completed++;
        }
      });
      
      // Update work statistics
      setWorkStats({
        completed,
      });
    });

    return () => unsubscribe();
  }, [profile.uid]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);
      navigate("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const formatDate = (date: string | Date | { toDate(): Date } | undefined) => {
    if (!date) return "N/A";
    let dateObj: Date;
    if (date instanceof Date) {
      dateObj = date;
    } else if (
      typeof date === "object" &&
      "toDate" in date &&
      typeof date.toDate === "function"
    ) {
      dateObj = date.toDate();
    } else if (typeof date === "string" || typeof date === "number") {
      dateObj = new Date(date);
    } else {
      return "N/A";
    }
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return "E";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative w-full">
      {/* Profile Content */}
      <div className="container mx-auto px-4 pt-24">
        <div className="relative -mt-20 bg-card rounded-lg border border-border shadow-sm p-6 flex flex-col md:flex-row items-start md:items-end gap-6">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-40 h-40 border-4 border-background shadow-lg">
              <AvatarImage src={profile.photoURL || undefined} />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                {getInitials(profile.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-2.5 shadow-lg border-2 border-background">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                {profile.displayName || "Employee"}
              </h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-2 text-lg">
                <Mail className="w-4 h-4" />
                {profile.email}
              </p>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-4 text-sm">
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-3 py-1"
              >
                <Briefcase className="w-4 h-4 mr-1" />
                Employee
              </Badge>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatDate(profile.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span>
                  {workStats.completed} Projects Completed
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {isOwnProfile && (
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => navigate("/employee/settings")}
                className="w-full md:w-auto"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="destructive"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 rounded-lg"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {loggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
