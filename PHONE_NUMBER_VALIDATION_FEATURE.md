# Phone Number Validation for Project Submission

## Overview
This feature ensures that buyers must provide a phone number before they can submit a project. If a buyer attempts to submit a project without a phone number in their profile, they are prompted to add one through a modal dialog.

## Implementation Details

### 1. PhoneNumberModal Component
**File**: `src/features/postProject/components/PhoneNumberModal.tsx`

A reusable modal component that:
- Prompts users to enter their phone number
- Validates phone number format (7-15 digits, supports international format)
- Saves the phone number to Firestore
- Provides user-friendly feedback
- Cannot be dismissed without entering a valid number or explicitly canceling

**Features**:
- ✅ Real-time validation
- ✅ Supports international formats (+1 555-123-4567, +94 77 123 4567, etc.)
- ✅ Prevents submission with invalid numbers
- ✅ Shows loading state during save
- ✅ Auto-focus on phone number input
- ✅ Integrates with toast notifications

**Props**:
```typescript
interface PhoneNumberModalProps {
  open: boolean;                          // Controls modal visibility
  onOpenChange: (open: boolean) => void;  // Handle modal open/close
  onPhoneNumberAdded: () => void;         // Callback after successful save
}
```

### 2. PostProject Component Updates
**File**: `src/features/postProject/PostProject.tsx`

**Changes Made**:

1. **Added Imports**:
   ```typescript
   import { PhoneNumberModal } from "./components/PhoneNumberModal";
   import { userProfileService } from "@/Services/userProfileService";
   import { User } from "firebase/auth";
   ```

2. **Added State**:
   ```typescript
   const [showPhoneNumberModal, setShowPhoneNumberModal] = useState(false);
   ```

3. **Modified `handleSubmit` Function**:
   - Before submitting the project, checks if user has a phone number
   - If no phone number exists, shows the PhoneNumberModal
   - Stops submission process until phone number is added

4. **Added `handlePhoneNumberAdded` Function**:
   - Called after user successfully adds phone number in modal
   - Re-checks that phone number was actually saved
   - Retries project submission automatically

5. **Created `submitProject` Function**:
   - Extracted project submission logic into separate function
   - Can be called from both initial submit and after phone number is added
   - Properly typed with `User` type from Firebase

6. **Added PhoneNumberModal to JSX**:
   ```tsx
   <PhoneNumberModal
     open={showPhoneNumberModal}
     onOpenChange={setShowPhoneNumberModal}
     onPhoneNumberAdded={handlePhoneNumberAdded}
   />
   ```

## User Flow

### Scenario 1: User Has Phone Number
1. User fills out project form
2. User clicks "Post Project"
3. Form validation passes
4. Phone number check passes ✅
5. Project is submitted successfully
6. Success modal appears

### Scenario 2: User Does NOT Have Phone Number
1. User fills out project form
2. User clicks "Post Project"
3. Form validation passes
4. Phone number check **fails** ❌
5. **Phone Number Modal appears**
6. User must enter phone number
7. User has two options:
   - **Enter valid phone number** → Click "Save & Continue" → Phone saved → Modal closes → Submission retries automatically
   - **Cancel** → Modal closes → User must add phone number and resubmit

### Detailed Flow Diagram

```
User Clicks Submit
       ↓
Form Validation
       ↓
   [Valid?] ─── No ──→ Show Error Toast
       ↓
      Yes
       ↓
Check Phone Number
       ↓
  [Has Phone?] ─── Yes ──→ Submit Project ──→ Success!
       ↓
      No
       ↓
Show Phone Modal
       ↓
User Enters Phone
       ↓
  [Valid Format?] ─── No ──→ Show Error Message
       ↓
      Yes
       ↓
Save to Firestore
       ↓
  [Saved?] ─── No ──→ Show Error Toast
       ↓
      Yes
       ↓
Close Modal
       ↓
Auto-Retry Submission
       ↓
Verify Phone Exists
       ↓
Submit Project
       ↓
Success!
```

## Code Examples

### Checking for Phone Number

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate form first
  const error = validateForm();
  if (error) {
    toast({ title: "Validation Error", description: error });
    return;
  }

  // Check if user has phone number
  const userProfile = await userProfileService.getProfile();
  if (!userProfile.user.phoneNumber || userProfile.user.phoneNumber.trim() === "") {
    setShowPhoneNumberModal(true); // Show modal
    return; // Stop submission
  }

  // Continue with submission
  await submitProject(user);
};
```

### Handling Phone Number Addition

```typescript
const handlePhoneNumberAdded = async () => {
  // Verify phone number was saved
  const userProfile = await userProfileService.getProfile();
  if (!userProfile.user.phoneNumber) {
    toast({ title: "Error", description: "Phone number not saved" });
    return;
  }

  // Retry submission
  await submitProject(user);
};
```

### Phone Number Validation

```typescript
const validatePhoneNumber = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return "Phone number is required";
  }

  // Remove formatting characters
  const cleanedPhone = value.replace(/[\s\-()]/g, "");

  // Check format: 7-15 digits, optional + prefix
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  if (!phoneRegex.test(cleanedPhone)) {
    return "Please enter a valid phone number (7-15 digits)";
  }

  return null;
};
```

## Validation Rules

### Phone Number Format
- **Minimum**: 7 digits
- **Maximum**: 15 digits
- **Optional Prefix**: `+` for international numbers
- **Allowed Characters**: Digits, spaces, dashes, parentheses
- **Examples**:
  - ✅ `+1 (555) 123-4567`
  - ✅ `+94 77 123 4567`
  - ✅ `0771234567`
  - ✅ `555-123-4567`
  - ❌ `123` (too short)
  - ❌ `abcd1234567` (contains letters)

## Database

### Firestore Update
When user adds phone number:
```javascript
// Updates users/{uid} document
{
  phoneNumber: "+1 555-123-4567",
  updatedAt: serverTimestamp()
}
```

No additional fields or collections required - uses existing user document.

## Error Handling

### Common Scenarios

1. **User Cancels Modal**:
   - Modal closes
   - User remains on form
   - User must add phone number and resubmit

2. **Invalid Phone Number**:
   - Error message shown below input
   - Save button disabled
   - User must correct format

3. **Save Failed**:
   - Error toast shown
   - Modal remains open
   - User can retry

4. **Network Error During Check**:
   - Error toast shown
   - Submission stopped
   - User can retry submit

## UI/UX Details

### Phone Number Modal
- **Icon**: Blue phone icon in circle
- **Title**: "Phone Number Required"
- **Description**: Explains why phone number is needed
- **Input**: Tel input with placeholder
- **Buttons**:
  - Primary: "Save & Continue" (disabled if invalid)
  - Secondary: "Cancel"
- **Loading State**: "Saving..." with disabled buttons

### Form Validation Order
1. ✅ Required fields (title, description, etc.)
2. ✅ Field formats (budget, deadline, etc.)
3. ✅ File uploads (size, type)
4. ✅ **Phone number check** ← New
5. ✅ Project submission

## Benefits

### For Buyers
- ✅ One-time setup - phone number saved permanently
- ✅ Better communication with service providers
- ✅ Faster project resolution
- ✅ Professional profile

### For Service Providers
- ✅ Can contact buyers easily
- ✅ Better project clarification
- ✅ Reduced back-and-forth messaging

### For Platform
- ✅ Better user verification
- ✅ Improved communication
- ✅ Reduced spam/fake projects
- ✅ Higher quality listings

## Testing Checklist

- [ ] User without phone number sees modal when submitting project
- [ ] User with phone number does NOT see modal
- [ ] Invalid phone numbers show validation error
- [ ] Valid phone numbers are accepted
- [ ] Phone number is saved to Firestore
- [ ] After saving, project submission continues automatically
- [ ] Cancel button works correctly
- [ ] Modal cannot be closed by clicking outside
- [ ] Loading states display correctly
- [ ] Error toasts appear for failures
- [ ] Success toast appears after phone save
- [ ] Phone number persists in user profile
- [ ] Subsequent project submissions don't show modal

## Related Files

### Modified Files
1. `src/features/postProject/PostProject.tsx` - Main submission logic
2. `src/features/postProject/components/PhoneNumberModal.tsx` - New modal component

### Dependent Files (No Changes)
1. `src/Services/userProfileService.ts` - Already has `updateProfileField` method
2. `src/features/profile/types/profile.ts` - Already has `phoneNumber` field
3. `src/features/profile/components/ProfileStats.tsx` - Shows phone number in profile

## Future Enhancements

1. **Phone Verification**: Send SMS OTP for verification
2. **Auto-Format**: Format phone number as user types
3. **Country Selector**: Dropdown for country codes
4. **WhatsApp Integration**: Link to WhatsApp chat
5. **Multiple Numbers**: Support business and personal numbers
6. **Number Privacy**: Allow hiding number from certain users

## Security Considerations

1. **Validation**: Always validate on both frontend and backend
2. **Storage**: Phone numbers stored securely in Firestore
3. **Access Control**: Only user, admins, and assigned employees can see phone
4. **Rate Limiting**: Consider limiting profile updates to prevent abuse

## Troubleshooting

### Modal Doesn't Appear
- Check browser console for errors
- Verify `userProfileService.getProfile()` is working
- Check Firestore connection

### Phone Number Not Saving
- Check Firestore security rules
- Verify user is authenticated
- Check network tab for failed requests

### Project Still Won't Submit After Adding Phone
- Check browser console for errors
- Verify phone number in Firestore
- Clear browser cache and retry

## Support

For issues:
1. Check browser console for errors
2. Verify user is logged in
3. Check Firestore for user document
4. Review this documentation
5. Test with different phone formats
