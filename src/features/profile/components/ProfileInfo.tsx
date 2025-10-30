import { CheckCircle, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '../types/profile';
import { ProfileStats } from './ProfileStats';
import { BuyerProject } from '@/Services/projectService';
import { InlineEditField } from './InlineEditField';
import { useInlineEdit } from '../hooks/useInlineEdit';

interface ProfileInfoProps {
  profile: UserProfile;
  buyerProjects?: BuyerProject[];
  isOwnProfile?: boolean;
  onProfileUpdate?: (updatedProfile: Partial<UserProfile>) => void;
  isEditMode?: boolean;
}

export const ProfileInfo = ({ 
  profile, 
  buyerProjects, 
  isOwnProfile = false, 
  onProfileUpdate,
  isEditMode = false 
}: ProfileInfoProps) => {
  const inlineEdit = useInlineEdit(profile, onProfileUpdate || (() => {}));

  // No auto-start editing - user clicks individual edit icons

  return (
    <div className="flex-1 space-y-4 text-center md:text-left">
      <div>
        <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 mb-2">
          {/* Display Name - Inline Editable */}
          {isOwnProfile ? (
            <InlineEditField
              fieldName="displayName"
              value={inlineEdit.getFieldValue('displayName') as string || profile.displayName || profile.name || ''}
              isEditing={inlineEdit.isEditing('displayName')}
              isSaving={inlineEdit.isSaving('displayName')}
              onStartEdit={() => inlineEdit.startEditing('displayName')}
              onSave={() => inlineEdit.saveField('displayName')}
              onCancel={() => inlineEdit.cancelEditing('displayName')}
              onValueChange={(value) => inlineEdit.updateFieldValue('displayName', value)}
              displayClassName="text-xl sm:text-3xl font-bold text-foreground"
              placeholder="Enter your display name"
              showEditIcon={isEditMode}
            />
          ) : (
            <h1 className="text-xl sm:text-3xl font-bold text-foreground">
              {profile.displayName || profile.name || 'Unknown User'}
            </h1>
          )}
          
          {profile.isVerified && (
            <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
          <Badge
            variant="secondary"
            className={`text-xs capitalize ${
              profile.role === 'buyer'
                ? 'bg-green-100 text-green-800'
                : profile.role === 'employee'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-purple-100 text-purple-800'
            }`}
          >
            {profile.role}
          </Badge>
        </div>
        
        <p className="text-muted-foreground text-sm">@{profile.username || profile.email?.split('@')[0]}</p>
        
        {/* Profile Headline - Inline Editable */}
        {isOwnProfile ? (
          <div className="flex">
            <InlineEditField
              fieldName="headline"
              value={inlineEdit.getFieldValue('headline') as string || profile.headline || ''}
              isEditing={inlineEdit.isEditing('headline')}
              isSaving={inlineEdit.isSaving('headline')}
              onStartEdit={() => inlineEdit.startEditing('headline')}
              onSave={() => inlineEdit.saveField('headline')}
              onCancel={() => inlineEdit.cancelEditing('headline')}
              onValueChange={(value) => inlineEdit.updateFieldValue('headline', value)}
              type="textarea"
              displayClassName="text-base sm:text-lg font-medium text-foreground p-2"
              placeholder="Your professional headline"
              showEditIcon={isEditMode}
            />
          </div>
        ) : (
          <p className="text-base sm:text-lg font-medium text-foreground mt-2">
            {profile.headline || 'Project Buyer'}
          </p>
        )}
      </div>

      {/* Stats */}
      <ProfileStats 
        profile={profile} 
        buyerProjects={buyerProjects || []} 
        isOwnProfile={isOwnProfile}
        onProfileUpdate={onProfileUpdate}
        isEditMode={isEditMode}
      />

      {/* Languages */}
      {profile.languages && profile.languages.length > 0 && (
        <div className="flex flex-wrap justify-center md:justify-start gap-2">
          {profile.languages.map((language) => (
            <Badge key={language} variant="secondary" className="bg-muted/50 text-xs sm:text-sm">
              <Globe className="w-3 h-3 mr-1" />
              {language}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};