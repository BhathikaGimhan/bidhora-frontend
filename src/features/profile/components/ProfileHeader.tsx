import { useState } from 'react';
import DotGrid from "@/components/DotGrid";
import CreditBadge from "./CreditBadge";
import { UserProfile } from '../types/profile';
import { ProfilePicture } from './ProfilePicture';
import { ProfileInfo } from './ProfileInfo';
import { ProfileActions } from './ProfileActions';
import { BuyerProject } from '@/Services/projectService';

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  onProfileUpdate: (updatedProfile: Partial<UserProfile>) => void;
  buyerProjects?: BuyerProject[];
  isEditMode?: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

export const ProfileHeader = ({ 
  profile, 
  isOwnProfile, 
  onProfileUpdate, 
  buyerProjects = [], 
  isEditMode = false, 
  onEditModeChange 
}: ProfileHeaderProps) => {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [currentPhotoURL, setCurrentPhotoURL] = useState(profile.photoURL || '');

  const handleEditModeChange = (editMode: boolean) => {
    if (onEditModeChange) {
      onEditModeChange(editMode);
    }
  };

  const handleProfileUpdate = (updatedProfile: Partial<UserProfile>) => {
    onProfileUpdate(updatedProfile);
    // Update local state if photoURL changed
    if (updatedProfile.photoURL) {
      setCurrentPhotoURL(updatedProfile.photoURL);
    }
  };

  const handlePhotoURLChange = (photoURL: string) => {
    setCurrentPhotoURL(photoURL);
  };

  const handleImageUpload = () => {
    // This will be handled by ProfilePicture component
    // The upload state will be managed by the callback
  };

  const handleUploadStateChange = (isUploading: boolean) => {
    setIsUploadingImage(isUploading);
  };

  return (
    <div className="relative w-full">
      {/* Cover Image */}
      

      {/* Profile Content */}
      <div className="container mx-auto px-4 pt-24">
        <div className="relative -mt-16 bg-card rounded-lg border items-end shadow-sm p-4 sm:p-6 flex flex-col gap-6">
          {isOwnProfile && (
            <div className="sm:absolute top-4 right-4 flex">
              <CreditBadge credits={profile.credits || 0} />
            </div>
          )}
    
          <div className="flex flex-col md:flex-row items-center gap-6 w-full">
            {/* Profile Picture */}
            <ProfilePicture 
              profile={{ ...profile, photoURL: currentPhotoURL }}
              isOwnProfile={isOwnProfile}
              onProfileUpdate={handleProfileUpdate}
              onPhotoURLChange={handlePhotoURLChange}
              onUploadStateChange={handleUploadStateChange}
            />

            {/* Profile Info */}
            <ProfileInfo 
              profile={{ ...profile, photoURL: currentPhotoURL }} 
              buyerProjects={buyerProjects}
              isOwnProfile={isOwnProfile}
              isEditMode={isEditMode}
              onProfileUpdate={handleProfileUpdate}
            />
          
            {/* Action Buttons */}
            <ProfileActions 
              profile={profile}
              isOwnProfile={isOwnProfile}
              onEditProfile={() => {}} // No longer needed
              onProfileUpdate={onProfileUpdate}
              isEditMode={isEditMode}
              onEditModeChange={handleEditModeChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};