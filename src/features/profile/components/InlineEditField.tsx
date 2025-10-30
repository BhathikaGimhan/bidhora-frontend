import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserProfile } from '../types/profile';
import { profileEditUtils } from '../hooks/useInlineEdit';

interface InlineEditFieldProps {
  fieldName: keyof UserProfile;
  value: string | number;
  isEditing: boolean;
  isSaving: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onValueChange: (value: string | number) => void;
  type?: 'text' | 'textarea' | 'number';
  className?: string;
  displayClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  prefix?: string;
  suffix?: string;
  showEditIcon?: boolean; // New prop to control edit icon visibility
}

export const InlineEditField = ({
  fieldName,
  value,
  isEditing,
  isSaving,
  onStartEdit,
  onSave,
  onCancel,
  onValueChange,
  type = 'text',
  className,
  displayClassName,
  placeholder,
  disabled = false,
  prefix,
  suffix,
  showEditIcon = false
}: InlineEditFieldProps) => {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type !== 'textarea') {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  // Validate field on value change
  useEffect(() => {
    if (isEditing) {
      const error = profileEditUtils.validateField(fieldName, value);
      setValidationError(error);
    }
  }, [value, isEditing, fieldName]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      if (!validationError) {
        onSave();
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleSave = () => {
    if (!validationError) {
      onSave();
    }
  };

  const displayValue = () => {
    if (value === null || value === undefined || value === '') {
      return (
        <span className="text-muted-foreground italic">
          {placeholder || `Click to add ${String(fieldName)}`}
        </span>
      );
    }
    
    const formattedValue = profileEditUtils.formatFieldForDisplay(fieldName, value);
    return (
      <span>
        {prefix}{formattedValue}{suffix}
      </span>
    );
  };

  if (isEditing) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2">
          {type === 'textarea' ? (
            <Textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={String(value)}
              onChange={(e) => onValueChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || profileEditUtils.getPlaceholder(fieldName)}
              className={cn(
                "min-h-[80px] resize-none",
                validationError && "border-red-500 focus:border-red-500"
              )}
              disabled={isSaving}
            />
          ) : (
            <Input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={type}
              value={String(value)}
              onChange={(e) => {
                const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                onValueChange(newValue);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || profileEditUtils.getPlaceholder(fieldName)}
              className={cn(
                "flex-1",
                validationError && "border-red-500 focus:border-red-500"
              )}
              disabled={isSaving}
              step={type === 'number' ? "0.01" : undefined}
              min={type === 'number' ? "0" : undefined}
            />
          )}
          
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              disabled={isSaving || !!validationError}
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              disabled={isSaving}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {validationError && (
          <p className="text-sm text-red-600">{validationError}</p>
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group transition-colors",
        displayClassName,
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="flex items-center gap-1">
        <div className="flex-1">
          {displayValue()}
        </div>
        {!disabled && showEditIcon && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onStartEdit}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};