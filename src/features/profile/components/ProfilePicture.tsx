import { useRef, useState } from 'react';
import { Camera, CheckCircle } from 'lucide-react';
import { UserProfile } from '../types/profile';
import { useToast } from '@/hooks/use-toast';
import { userProfileService } from '../../../Services/userProfileService';
import { storageService, imageUtils } from '../../../Services/storageService';

interface ProfilePictureProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  onProfileUpdate: (updatedProfile: Partial<UserProfile>) => void;
  onPhotoURLChange?: (photoURL: string) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
}

export const ProfilePicture = ({ 
  profile, 
  isOwnProfile, 
  onProfileUpdate,
  onPhotoURLChange,
  onUploadStateChange 
}: ProfilePictureProps) => {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleProfilePictureClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = storageService.validateImage(file);
    if (!validation.valid) {
      toast({
        title: "Invalid Image",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploadingImage(true);
      onUploadStateChange?.(true);
      
      const resizedFile = await imageUtils.resizeImage(file, 400, 400, 0.8);
      const downloadURL = await storageService.uploadProfilePicture(resizedFile);
      
      // Update edit form if callback provided
      if (onPhotoURLChange) {
        onPhotoURLChange(downloadURL);
      }
      
      // Immediately update the profile picture in Firestore and UI
      await userProfileService.updatePhotoURL(downloadURL);
      onProfileUpdate({ 
        photoURL: downloadURL 
      });
      
      toast({
        title: "Success",
        description: "Profile picture uploaded and saved successfully"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive"
      });
    } finally {
      setIsUploadingImage(false);
      onUploadStateChange?.(false);
    }
  };

  return (
    <div className="relative flex-shrink-0 mx-auto md:mx-0">
      <div 
        className={`relative ${isOwnProfile ? 'cursor-pointer group' : ''}`}
        onClick={handleProfilePictureClick}
      >
        <img
          src={profile.photoURL || '/user.png'}
          alt={profile.displayName || profile.name || 'User'}
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background object-cover"
        />
        {isOwnProfile && (
          <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {isUploadingImage ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </div>
        )}
        {profile.isVerified && (
          <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-1">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        disabled={isUploadingImage}
      />
    </div>
  );
};