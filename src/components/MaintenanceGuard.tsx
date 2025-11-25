import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { getMaintenanceMode } from "../Services/maintenanceService";
import { Loader2, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export const MaintenanceGuard: React.FC<MaintenanceGuardProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState({
    title: "System Maintenance",
    message: "We're currently performing scheduled maintenance. Please check back soon.",
  });

  useEffect(() => {
    const checkMaintenanceAndAuth = async () => {
      try {
        // Check maintenance mode
        const maintenance = await getMaintenanceMode();
        setIsMaintenanceMode(maintenance.enabled);
        setMaintenanceMessage({
          title: maintenance.title,
          message: maintenance.message,
        });

        // Check if user is admin
        const currentUser = auth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdTokenResult();
          setIsAdmin(token.claims.role === "admin");
        }
      } catch (error) {
        console.error("Error checking maintenance mode:", error);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenanceAndAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If maintenance mode is active and user is not admin, show maintenance page
  if (isMaintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Main Maintenance Card */}
          <Card className="border shadow-lg overflow-hidden">
            {/* Header with brand color background */}
            <div className="bg-brand-primary dark:bg-brand-primary/90 p-6 sm:p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/10 rounded-full blur-xl"></div>
                  <div className="relative bg-white dark:bg-white/95 rounded-full p-5 sm:p-6">
                    <Wrench className="h-12 w-12 sm:h-16 sm:w-16 text-brand-primary animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                    {maintenanceMessage.title}
                  </h1>
                  <p className="text-sm sm:text-base text-white/95 max-w-2xl">
                    {maintenanceMessage.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Info Box */}
              <div className="bg-muted border rounded-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center">
                      <Wrench className="h-6 w-6 text-brand-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base sm:text-lg mb-1 text-foreground">
                      We're Making Things Better
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Our team is working hard to improve your experience. We appreciate your patience and understanding.
                    </p>
                  </div>
                </div>
              </div>

              {/* What's Happening Section */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-sm mb-1 text-foreground">System Updates</h4>
                  <p className="text-xs text-muted-foreground">Installing improvements</p>
                </div>
                
                <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-sm mb-1 text-foreground">Security</h4>
                  <p className="text-xs text-muted-foreground">Enhancing protection</p>
                </div>
                
                <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-sm mb-1 text-foreground">Performance</h4>
                  <p className="text-xs text-muted-foreground">Optimizing speed</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-col items-center gap-4 pt-4 border-t">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-lg text-white bg-brand-primary hover:bg-brand-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh & Check Status
                </button>
                <p className="text-xs text-muted-foreground">
                  This page will automatically refresh when maintenance is complete
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer Logo */}
          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-semibold">Bidhora</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, render children normally
  return <>{children}</>;
};
