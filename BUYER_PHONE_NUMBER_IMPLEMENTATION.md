# Buyer Phone Number Implementation

## Overview
This document describes the implementation of the phone number field for buyer profiles in the Bidhora platform.

## Features Implemented

### 1. Profile Display & Editing
- **Location**: `src/features/profile/components/ProfileStats.tsx`
- Buyers can view and edit their phone number directly in their profile
- Uses inline editing with the `InlineEditField` component
- Phone icon (📱) displays next to the phone number
- Only visible and editable when the profile is in edit mode
- Shows "No phone number" placeholder when no phone number is set

### 2. Phone Number Validation
- **Location**: `src/features/profile/hooks/useInlineEdit.ts`
- Validates phone numbers to ensure they contain 7-15 digits
- Supports international format with optional '+' prefix
- Allows common formatting characters (spaces, dashes, parentheses) in input
- Displays user-friendly error messages for invalid phone numbers

### 3. Admin View
- **Location**: `src/features/admin/components/ProjectDetailsModal.tsx`
- Admins can see buyer's phone number in the Client Information section
- Displays with a Phone icon for easy identification
- Already implemented and working

### 4. Employee View
- **Location**: `src/features/employee/views/ProjectDetailsView.tsx`
- Employees can see the buyer's (client's) phone number when viewing project details
- Enhanced with Phone icon for consistency
- Helps employees contact clients for project-related communications

## Database Schema

### Firestore Collection: `users`

The `phoneNumber` field is stored in the user document:

```typescript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL?: string,
  role: 'buyer' | 'employee' | 'admin',
  phoneNumber?: string,  // <-- Phone number field
  // ... other fields
}
```

### Field Details
- **Field Name**: `phoneNumber`
- **Type**: `string` (optional)
- **Format**: Can include international prefix (+), digits, spaces, dashes, and parentheses
- **Validation**: 7-15 digits (after removing formatting characters)
- **Examples**: 
  - `+1 (555) 123-4567`
  - `+94 77 123 4567`
  - `0771234567`

## Security Considerations

1. **Privacy**: Phone numbers are only visible to:
   - The user themselves (in their own profile)
   - Admins (in project details)
   - Assigned employees (for projects the user posted)

2. **Validation**: Phone numbers are validated on both frontend and should be validated on backend

3. **Optional Field**: Phone number is optional - buyers can choose whether to provide it

## User Experience

### For Buyers
1. Navigate to your profile
2. Click "Edit Profile" button
3. Find the phone number field (with 📱 icon) below "Member since"
4. Click the edit icon next to the phone number
5. Enter your phone number (supports various formats)
6. Click the checkmark to save or X to cancel
7. Validation errors will show immediately if the format is invalid

### For Admins
- View buyer's phone number in the Project Details Modal under "Client Information"

### For Employees
- View client's phone number in the Project Details View under "Client Information"
- Useful for direct communication regarding project requirements

## Technical Implementation Details

### Components Modified
1. **ProfileStats.tsx** - Added phone number display and inline editing
2. **useInlineEdit.ts** - Added phone number validation logic
3. **ProjectDetailsView.tsx** - Added Phone icon to phone number display

### Components Already Supporting Phone Number
1. **ProjectDetailsModal.tsx** (Admin view)
2. **userProfileService.ts** (Backend service)
3. **profile.ts** (TypeScript types)

### Services Updated
- `userProfileService.ts` already handles `phoneNumber` field in:
  - `getProfile()`
  - `getProfileById()`
  - `updateProfile()`
  - `updateProfileField()`

## Future Enhancements

1. **Phone Number Verification**: Implement SMS verification for phone numbers
2. **Click-to-Call**: Add functionality to call the number directly from the UI
3. **WhatsApp Integration**: Add WhatsApp link if phone number is provided
4. **Country Code Selector**: Add a dropdown for country code selection
5. **Format Standardization**: Automatically format phone numbers based on country

## Testing Checklist

- [ ] Buyer can add phone number to their profile
- [ ] Buyer can edit existing phone number
- [ ] Buyer can remove phone number (set to empty)
- [ ] Validation works for invalid phone numbers
- [ ] Phone number displays correctly in profile view
- [ ] Phone number displays correctly in admin view
- [ ] Phone number displays correctly in employee view
- [ ] Phone icon displays properly
- [ ] Inline editing UI works smoothly
- [ ] Changes are saved to Firestore
- [ ] Changes persist after page reload

## Migration Notes

### For Existing Users
- No migration needed as `phoneNumber` is an optional field
- Existing users will have `phoneNumber` as `undefined` or empty string
- They can add it anytime by editing their profile

### Database Rules (Firestore Security Rules)
```javascript
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == userId;
  
  // Ensure phoneNumber is a string if provided
  allow update: if request.auth.uid == userId &&
    (!request.resource.data.keys().hasAny(['phoneNumber']) ||
     request.resource.data.phoneNumber is string);
}
```

## Support

For issues or questions regarding the phone number implementation:
1. Check this documentation first
2. Review the code in the files mentioned above
3. Check Firestore console to verify data storage
4. Review browser console for any validation errors
