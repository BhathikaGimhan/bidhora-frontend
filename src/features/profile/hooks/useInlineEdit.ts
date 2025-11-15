import { useState } from 'react';
import { userProfileService } from '../../../Services/userProfileService';
import { UserProfile } from '../types/profile';
import { useToast } from '@/hooks/use-toast';

// Type for field values that can be edited
type EditableFieldValue = string | number | boolean | string[] | null | undefined;

/**
 * Hook for managing inline editing of profile fields
 * Provides state management, save/cancel logic, and optimistic updates
 */
export const useInlineEdit = (
  profile: UserProfile,
  onProfileUpdate: (updatedProfile: Partial<UserProfile>) => void
) => {
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [fieldValues, setFieldValues] = useState<Record<string, EditableFieldValue>>({});
  const [savingFields, setSavingFields] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  /**
   * Start editing a specific field
   */
  const startEditing = (fieldName: keyof UserProfile, initialValue?: EditableFieldValue) => {
    setEditingFields(prev => ({ ...prev, [fieldName]: true }));
    setFieldValues(prev => ({ 
      ...prev, 
      [fieldName]: initialValue !== undefined ? initialValue : profile[fieldName] 
    }));
  };

  /**
   * Cancel editing a field and revert to original value
   */
  const cancelEditing = (fieldName: keyof UserProfile) => {
    setEditingFields(prev => ({ ...prev, [fieldName]: false }));
    setFieldValues(prev => {
      const { [fieldName]: _, ...rest } = prev;
      return rest;
    });
  };

  /**
   * Save a field value to the backend
   */
  const saveField = async (fieldName: keyof UserProfile) => {
    const newValue = fieldValues[fieldName];
    
    if (newValue === profile[fieldName]) {
      // No changes, just close editing
      cancelEditing(fieldName);
      return;
    }

    try {
      setSavingFields(prev => ({ ...prev, [fieldName]: true }));
      
      // Optimistic update
      onProfileUpdate({ [fieldName]: newValue as UserProfile[keyof UserProfile] });
      
      // Save to backend
      await userProfileService.updateProfileField(fieldName, newValue);
      
      // Close editing
      setEditingFields(prev => ({ ...prev, [fieldName]: false }));
      setFieldValues(prev => {
        const { [fieldName]: _, ...rest } = prev;
        return rest;
      });

      toast({
        title: "Success",
        description: `${String(fieldName)} updated successfully`,
      });
    } catch (error) {
      // Revert optimistic update on error
      onProfileUpdate({ [fieldName]: profile[fieldName] });
      
      console.error(`Error saving ${String(fieldName)}:`, error);
      toast({
        title: "Error",
        description: `Failed to update ${String(fieldName)}`,
        variant: "destructive",
      });
    } finally {
      setSavingFields(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  /**
   * Update a field value in local state
   */
  const updateFieldValue = (fieldName: keyof UserProfile, value: EditableFieldValue) => {
    setFieldValues(prev => ({ ...prev, [fieldName]: value }));
  };

  /**
   * Check if a field is currently being edited
   */
  const isEditing = (fieldName: keyof UserProfile): boolean => {
    return editingFields[fieldName] || false;
  };

  /**
   * Check if a field is currently being saved
   */
  const isSaving = (fieldName: keyof UserProfile): boolean => {
    return savingFields[fieldName] || false;
  };

  /**
   * Get the current value for a field (either from editing state or original profile)
   */
  const getFieldValue = (fieldName: keyof UserProfile): EditableFieldValue => {
    return fieldValues[fieldName] !== undefined ? fieldValues[fieldName] : profile[fieldName];
  };

  /**
   * Save multiple fields at once
   */
  const saveMultipleFields = async (fields: Partial<UserProfile>) => {
    try {
      // Set all fields as saving
      const fieldNames = Object.keys(fields) as (keyof UserProfile)[];
      setSavingFields(prev => {
        const newSaving = { ...prev };
        fieldNames.forEach(field => {
          newSaving[field] = true;
        });
        return newSaving;
      });

      // Optimistic update
      onProfileUpdate(fields);
      
      // Save to backend
      await userProfileService.updateMultipleFields(fields);
      
      // Close editing for all fields
      setEditingFields(prev => {
        const newEditing = { ...prev };
        fieldNames.forEach(field => {
          newEditing[field] = false;
        });
        return newEditing;
      });
      
      // Clear field values
      setFieldValues(prev => {
        const newValues = { ...prev };
        fieldNames.forEach(field => {
          delete newValues[field];
        });
        return newValues;
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      // Revert optimistic updates on error
      const revertFields: Partial<UserProfile> = {};
      Object.keys(fields).forEach(field => {
        revertFields[field as keyof UserProfile] = profile[field as keyof UserProfile];
      });
      onProfileUpdate(revertFields);
      
      console.error('Error saving multiple fields:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      // Clear saving states
      setSavingFields(prev => {
        const newSaving = { ...prev };
        Object.keys(fields).forEach(field => {
          delete newSaving[field];
        });
        return newSaving;
      });
    }
  };

  return {
    startEditing,
    cancelEditing,
    saveField,
    updateFieldValue,
    isEditing,
    isSaving,
    getFieldValue,
    saveMultipleFields,
  };
};

/**
 * Utility functions for profile editing
 */
export const profileEditUtils = {
  /**
   * Validate field values
   */
  validateField: (fieldName: keyof UserProfile, value: EditableFieldValue): string | null => {
    switch (fieldName) {
      case 'displayName':
        if (!value || (typeof value === 'string' && value.trim().length < 2)) {
          return 'Display name must be at least 2 characters long';
        }
        if (typeof value === 'string' && value.trim().length > 50) {
          return 'Display name must be less than 50 characters';
        }
        break;
      
      case 'headline':
        if (typeof value === 'string' && value.length > 100) {
          return 'Headline must be less than 100 characters';
        }
        break;
      
      case 'bio':
        if (typeof value === 'string' && value.length > 1000) {
          return 'Bio must be less than 1000 characters';
        }
        break;
      
      case 'phoneNumber':
        if (value && typeof value === 'string') {
          // Remove spaces, dashes, parentheses for validation
          const cleanedPhone = value.replace(/[\s\-()]/g, '');
          // Check if it contains only digits and optional + at the start
          const phoneRegex = /^\+?[0-9]{7,15}$/;
          if (!phoneRegex.test(cleanedPhone)) {
            return 'Please enter a valid phone number (7-15 digits)';
          }
        }
        break;
      
      case 'skills':
        if (Array.isArray(value)) {
          if (value.length > 20) {
            return 'Maximum 20 skills allowed';
          }
          if (value.some(skill => typeof skill !== 'string' || skill.trim().length === 0)) {
            return 'All skills must be valid strings';
          }
        }
        break;
      
      case 'languages':
        if (Array.isArray(value)) {
          if (value.length > 10) {
            return 'Maximum 10 languages allowed';
          }
          if (value.some(lang => typeof lang !== 'string' || lang.trim().length === 0)) {
            return 'All languages must be valid strings';
          }
        }
        break;
    }
    
    return null;
  },

  /**
   * Format field value for display
   */
  formatFieldForDisplay: (fieldName: keyof UserProfile, value: EditableFieldValue): string => {
    if (value === null || value === undefined) return '';
    
    switch (fieldName) {
      case 'skills':
      case 'languages':
        return Array.isArray(value) ? value.join(', ') : '';
      
      case 'availability':
        return String(value).charAt(0).toUpperCase() + String(value).slice(1);
      
      default:
        return String(value);
    }
  },

  /**
   * Get placeholder text for field
   */
  getPlaceholder: (fieldName: keyof UserProfile): string => {
    const placeholders: Record<string, string> = {
      displayName: 'Enter your display name',
      headline: 'Your professional headline',
      bio: 'Tell clients about your experience and expertise...',
      location: 'Your location',
      phoneNumber: 'Your phone number',
      skills: 'Add skills separated by commas',
      languages: 'Add languages separated by commas',
    };
    
    return placeholders[fieldName] || `Enter ${String(fieldName)}`;
  }
};