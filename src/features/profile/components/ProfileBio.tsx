import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Edit3, Save, X, Plus, Trash2 } from "lucide-react";
import { UserProfile } from '../types/profile';
import { userProfileService } from '../../../Services/userProfileService';
import { useToast } from "@/hooks/use-toast";
import { InlineEditField } from './InlineEditField';
import { useInlineEdit } from '../hooks/useInlineEdit';

interface ProfileBioProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  onProfileUpdate: (updatedProfile: Partial<UserProfile>) => void;
  isEditMode?: boolean;
}

export const ProfileBio = ({ profile, isOwnProfile, onProfileUpdate, isEditMode = false }: ProfileBioProps) => {
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [skillsValue, setSkillsValue] = useState(profile.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const inlineEdit = useInlineEdit(profile, onProfileUpdate);

  // No auto-start editing - user clicks individual edit icons

  const handleSaveSkills = async () => {
    if (!isOwnProfile) return;
    
    try {
      setIsSaving(true);
      await userProfileService.updateSkills(skillsValue);
      onProfileUpdate({ skills: skillsValue });
      setIsEditingSkills(false);
      toast({
        title: "Success",
        description: "Skills updated successfully",
      });
    } catch (error) {
      console.error('Error saving skills:', error);
      toast({
        title: "Error",
        description: "Failed to update skills",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSkills = () => {
    setSkillsValue(profile.skills || []);
    setIsEditingSkills(false);
    setNewSkill('');
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skillsValue.includes(newSkill.trim())) {
      setSkillsValue([...skillsValue, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsValue(skillsValue.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  return (
    <div className="space-y-6">
      {/* About Section */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">About Me</CardTitle>
        </CardHeader>
        <CardContent>
          {isOwnProfile ? (
            <InlineEditField
              fieldName="bio"
              value={inlineEdit.getFieldValue('bio') as string || profile.bio || ''}
              isEditing={inlineEdit.isEditing('bio')}
              isSaving={inlineEdit.isSaving('bio')}
              onStartEdit={() => inlineEdit.startEditing('bio')}
              onSave={() => inlineEdit.saveField('bio')}
              onCancel={() => inlineEdit.cancelEditing('bio')}
              onValueChange={(value) => inlineEdit.updateFieldValue('bio', value)}
              type="textarea"
              displayClassName="text-muted-foreground leading-relaxed"
              placeholder="Tell potential clients about your experience, skills, and what makes you unique..."
              showEditIcon={isEditMode}
            />
          ) : (
            <p className="text-muted-foreground leading-relaxed">
              {profile.bio || 'No bio available.'}
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Skills Section - Only show for service_providers */}
      {profile.role === 'service_provider' && (
        <Card className="border-border/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-foreground">Skills & Expertise</CardTitle>
              {isOwnProfile && isEditMode && !isEditingSkills && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingSkills(true)}
                  className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditingSkills ? (
              <div className="space-y-4">
                {/* Current Skills */}
                <div className="flex flex-wrap gap-2">
                  {skillsValue.map((skill) => (
                    <div key={skill} className="flex items-center gap-1">
                      <Badge 
                        variant="secondary" 
                        className="bg-primary/10 text-primary border-primary/20"
                      >
                        {skill}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSkill(skill)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {/* Add New Skill */}
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a new skill..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddSkill}
                    size="sm"
                    disabled={!newSkill.trim() || skillsValue.includes(newSkill.trim())}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveSkills}
                    size="sm"
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelSkills}
                    size="sm"
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill) => (
                    <Badge 
                      key={skill} 
                      variant="secondary" 
                      className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    {isOwnProfile ? 'Click the edit button to add your skills...' : 'No skills listed.'}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};