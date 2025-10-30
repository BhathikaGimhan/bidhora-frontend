import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { auth } from "@/firebaseConfig";
import { isAdmin } from "@/Services/authService";
import { onAuthStateChanged, User } from "firebase/auth";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const adminStatus = await isAdmin();
          setIsAdminUser(adminStatus);
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdminUser(false);
        }
      } else {
        setIsAdminUser(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    // Show loading spinner while checking authentication and admin status
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // User not authenticated, redirect to auth page
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isAdminUser) {
    // User authenticated but not admin, redirect to home page
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has admin role, render the admin panel
  return <>{children}</>;
};

export default ProtectedAdminRoute;
