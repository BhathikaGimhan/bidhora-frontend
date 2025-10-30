import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import {
  getUserProfile,
  updateUserRole,
  isAdmin,
} from "@/Services/authService";

interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: "buyer" | "service_provider" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const UserProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [canUpdateRole, setCanUpdateRole] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    checkAdminStatus();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await getUserProfile();
      setUser(response.user);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const adminStatus = await isAdmin();
      setCanUpdateRole(adminStatus);
    } catch (error) {
      setCanUpdateRole(false);
    }
  };

  const handleRoleUpdate = async (
    newRole: "buyer" | "service_provider" | "admin"
  ) => {
    if (!user) return;

    setUpdating(true);
    try {
      await updateUserRole({ role: newRole });
      setUser({ ...user, role: newRole });
      toast({
        title: "Success",
        description: "Role updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "service_provider":
        return "default";
      case "buyer":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Failed to load user profile
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Avatar className="w-20 h-20">
            <AvatarImage
              src={user.photoURL || undefined}
              alt={user.displayName}
            />
            <AvatarFallback className="text-lg">
              {user.displayName?.charAt(0).toUpperCase() ||
                user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-xl">{user.displayName || "User"}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Role:</span>
          <Badge variant={getRoleBadgeVariant(user.role)}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Member since:</span>
          <span className="text-sm text-muted-foreground">
            {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>

        {(canUpdateRole || user.role === "buyer") && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Update Role:</label>
            <Select
              value={user.role}
              onValueChange={handleRoleUpdate}
              disabled={updating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Buyer</SelectItem>
                <SelectItem value="service_provider">
                  Service Provider
                </SelectItem>
                {canUpdateRole && <SelectItem value="admin">Admin</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Seller upgrade section removed */}
      </CardContent>
    </Card>
  );
};

export default UserProfile;
