import { Button } from "@/components/ui/button";
import { Edit3, Users, LogOut, Check } from "lucide-react";
import { UserProfile } from "../types/profile";
import { auth } from "@/firebaseConfig";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProfileActionsProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  onEditProfile: () => void;
  onProfileUpdate?: (updatedProfile: Partial<UserProfile>) => void;
  isEditMode?: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

export const ProfileActions = ({
  profile,
  isOwnProfile,
  onEditProfile,
  onProfileUpdate,
  isEditMode = false,
  onEditModeChange,
}: ProfileActionsProps) => {
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const handleHire = () => {
    console.log("Hire user clicked");
  };

  const handleBecomeService_ProviderClick = () => {
    // Service provider application functionality removed
  };

  const handleService_ProviderApplicationSuccess = () => {
    // Service provider application functionality removed
  };

  const getService_ProviderButtonText = () => {
    return "Service provider applications disabled";
  };

  const isService_ProviderButtonDisabled = () => {
    return true;
  };

  const handleEditToggle = () => {
    if (onEditModeChange) {
      onEditModeChange(!isEditMode);
    } else {
      onEditProfile();
    }
  };

  const handleSaveChanges = () => {
    // Exit edit mode - all individual field saves have already been handled
    if (onEditModeChange) {
      onEditModeChange(false);
    }
    toast({
      title: "Success",
      description: "Profile changes saved successfully",
    });
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-2 h-full w-full md:w-auto md:mt-36">
        {isOwnProfile ? (
          <>
            {/* Toggle Edit Mode Button - Hide when edit mode is active */}
            {!isEditMode && (
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleEditToggle}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}

            {/* Save Changes Button - Show when edit mode is active */}
            {isEditMode && (
              <Button
                variant="default"
                size="sm"
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                onClick={handleSaveChanges}
              >
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}

            {/* Become a Service_Provider button removed */}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to logout? You will need to sign in
                    again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <>
            {/* Message and Contact buttons removed - chat feature disabled */}
          </>
        )}
      </div>
    </>
  );
};
