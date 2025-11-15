import { Star, Clock, Phone, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "../types/profile";
import { BuyerProject } from "@/Services/projectService";
import { InlineEditField } from './InlineEditField';
import { useInlineEdit } from '../hooks/useInlineEdit';

interface ProfileStatsProps {
  profile: UserProfile;
  buyerProjects?: BuyerProject[];
  isOwnProfile?: boolean;
  onProfileUpdate?: (updatedProfile: Partial<UserProfile>) => void;
  isEditMode?: boolean;
}

const formatDate = (date: any, opts?: Intl.DateTimeFormatOptions) => {
  try {
    let dateObj: Date;

    if (!date) return "N/A";

    if (date instanceof Date) {
      dateObj = date;
    } else if (date?.toDate) {
      // Firestore Timestamp object
      dateObj = date.toDate();
    } else if (typeof date._seconds === "number") {
      // Serialized Firestore Timestamp
      dateObj = new Date(
        date._seconds * 1000 + Math.floor((date._nanoseconds || 0) / 1e6)
      );
    } else if (typeof date === "string" || typeof date === "number") {
      dateObj = new Date(date);
    } else {
      return "WTF";
    }

    return dateObj.toLocaleDateString(
      "en-US",
      opts || {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
};

export const ProfileStats = ({ 
  profile, 
  buyerProjects = [], 
  isOwnProfile = false, 
  onProfileUpdate, 
  isEditMode = false 
}: ProfileStatsProps) => {
  const inlineEdit = useInlineEdit(profile, onProfileUpdate || (() => {}));
  
  return (
    <div className="flex flex-wrap justify-center md:justify-start gap-4 sm:gap-6 text-xs sm:text-sm">
      {profile.role === "employee" && (
        <>
          {/* ⭐ Rating + reviews for employees */}
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-foreground">
              {profile.averageRating ? profile.averageRating.toFixed(1) : "N/A"}
            </span>
            <span className="text-muted-foreground">
              ({profile.totalReviews || 0} reviews)
            </span>
          </div>

          {/* ✅ Completed projects */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 text-xs sm:text-sm"
            >
              {profile.completedProjects?.length || 0} projects completed
            </Badge>
          </div>
        </>
      )}

      {profile.role === "buyer" && (
        <>
          {/* 📦 Posted projects */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 text-xs sm:text-sm"
            >
              {buyerProjects?.length || 0} projects posted
            </Badge>
          </div>

          {/* 🕒 Member since */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              Member since{" "}
              {profile.createdAt
                ? formatDate(profile.createdAt, { year: "numeric" })
                : "No mcn"}
            </span>
          </div>

          {/* 📱 Phone Number - Inline Editable for buyers */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Phone className="w-4 h-4 flex-shrink-0" />
            {isOwnProfile && isEditMode ? (
              <InlineEditField
                fieldName="phoneNumber"
                value={inlineEdit.getFieldValue('phoneNumber') as string || ''}
                isEditing={inlineEdit.isEditing('phoneNumber')}
                isSaving={inlineEdit.isSaving('phoneNumber')}
                onStartEdit={() => inlineEdit.startEditing('phoneNumber')}
                onSave={() => inlineEdit.saveField('phoneNumber')}
                onCancel={() => inlineEdit.cancelEditing('phoneNumber')}
                onValueChange={(value) => inlineEdit.updateFieldValue('phoneNumber', value)}
                displayClassName="text-xs sm:text-sm"
                placeholder="Add phone number"
                showEditIcon={true}
              />
            ) : (
              <span className="text-xs sm:text-sm">
                {profile.phoneNumber || 'No phone number'}
              </span>
            )}
          </div>

          {/* 📍 Location */}
          {profile.location && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-xs sm:text-sm">{profile.location}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
