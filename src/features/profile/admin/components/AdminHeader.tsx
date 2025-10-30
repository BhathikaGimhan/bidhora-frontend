import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  LogOut,
  Mail,
  Calendar,
  Settings,
  User,
  Crown,
} from "lucide-react";
import { UserProfile } from "../../types/profile";
import { signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useNavigate } from "react-router-dom";

interface AdminHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
}

export const AdminHeader = ({ profile, isOwnProfile }: AdminHeaderProps) => {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

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
    if (!name) return "AD";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative w-full">
      {/* Background Section */}
      

      {/* Profile Content */}
      <div className="container mx-auto px-4 pt-24">
        <div className="relative -mt-20 bg-card rounded-lg border border-border shadow-sm p-6 flex flex-col md:flex-row items-start md:items-end gap-6">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-40 h-40 border-4 border-background shadow-lg">
              <AvatarImage src={profile.photoURL || undefined} />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                {getInitials(profile.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-purple-600 rounded-full p-2.5 shadow-lg border-2 border-background">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                {profile.displayName || "Admin User"}
              </h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-2 text-lg">
                <Mail className="w-5 h-5" />
                {profile.email}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Badge
                variant="outline"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
              >
                <Calendar className="w-4 h-4" />
                Joined {formatDate(profile.createdAt)}
              </Badge>
              <Badge
                variant="outline"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
              >
                <User className="w-4 h-4" />
                User ID: {profile.uid?.slice(0, 8)}...
              </Badge>
            </div>
          </div>

          {/* Actions */}
          {isOwnProfile && (
            <div className="flex gap-2 self-end">
              
              <Button
                variant="destructive"
                size="default"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                {loggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
