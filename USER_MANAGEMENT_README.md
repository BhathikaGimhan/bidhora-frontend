# User Management System - Bidhora

## Overview

This implementation adds comprehensive user management functionality to the Bidhora platform, including automatic user creation in Firebase Firestore when users sign up via Google authentication, role-based access control, and administrative features.

## Features Implemented

### 1. Automatic User Creation in Firestore

When a user signs up via Google authentication, their details are automatically stored in Firebase Firestore with the following structure:

```typescript
interface UserData {
  uid: string; // Firebase Auth UID
  email: string; // User's email address
  displayName?: string; // Display name from Google or derived from email
  photoURL?: string; // Profile picture URL from Google
  role: "buyer" | "service_provider" | "admin"; // User role (default: 'buyer')
  createdAt: Date; // Account creation timestamp
  updatedAt: Date; // Last update timestamp
}
```

### 2. User Roles System

#### Buyer (Default Role)

- Default role assigned to all new users
- Can browse and purchase services
- Can post project requirements
- Can upgrade to service provider role

#### Service Provider

- Can offer services and bid on projects
- All buyer permissions included
- - Users can self-upgrade from buyer to service provider

#### Admin

- Full platform access
- Can manage all users and their roles
- Can view user statistics and analytics
- Only admins can assign admin role to others

### 3. Backend API Endpoints

#### Authentication Routes (`/auth`)

- `POST /auth/google` - Google Sign-In with automatic user creation
- `POST /auth/login` - Regular login with user creation support

#### User Management Routes (`/user`)

- `GET /user/profile` - Get current user's profile with Firestore data
- `PUT /user/role` - Update user role (with permission checks)
- `GET /user/all` - Get all users (admin only)

### 4. Frontend Components

#### UserProfile Component

- Displays user information and current role
- Allows role upgrades (buyer to service_provider)
- Shows account creation date and profile picture

#### AdminPanel Component

- User statistics dashboard
- Complete user management interface
- Bulk role management capabilities
- User search and filtering

#### UserManagement Page

- Tabbed interface combining profile and admin features
- Role explanation and documentation
- Responsive design for all screen sizes

## File Changes Made

### Backend Files Modified/Created:

1. `Bidhora-Backend/functions/src/routes/auth.ts` - Added Firestore user creation
2. `Bidhora-Backend/functions/src/routes/user.ts` - Enhanced with role management
3. User data automatically stored in Firestore collection: `users`

### Frontend Files Modified/Created:

1. `bidhora-project/src/Services/authService.ts` - Added role management functions
2. `bidhora-project/src/components/UserProfile.tsx` - New user profile component
3. `bidhora-project/src/components/AdminPanel.tsx` - New admin panel component
4. `bidhora-project/src/pages/UserManagement.tsx` - New user management page
5. `bidhora-project/src/Routes.tsx` - Added user management route

## Usage Instructions

### For Users:

1. Sign up via Google authentication
2. User account is automatically created with 'buyer' role
3. Visit `/user-management` to view and manage your profile
4. Upgrade to 'service_provider' role to start offering services

### For Admins:

1. Access the Admin Panel tab in User Management
2. View user statistics and manage all user roles
3. Assign admin privileges to trusted users
4. Monitor user activity and account creation

## Security Features

### Permission System:

- Users can only update their own role from buyer to service_provider
- Only admins can assign admin roles
- Only admins can modify other users' roles
- JWT token validation for all protected routes

### Data Validation:

- Role validation ensures only valid roles are assigned
- User existence checks before role updates
- Proper error handling and user feedback

## Database Structure

### Firestore Collection: `users`

```
users/
  {uid}/
    uid: string
    email: string
    displayName: string
    photoURL: string
        role: 'buyer' | 'service_provider' | 'admin'
    createdAt: Timestamp
    updatedAt: Timestamp
```

## API Response Examples

### User Profile Response:

```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "uid": "firebase-uid-here",
    "email": "contact@bidhora.com",
    "displayName": "John Doe",
    "photoURL": "https://example.com/photo.jpg",
    "role": "buyer",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Role Update Response:

```json
{
  "message": "Role updated successfully",
  "role": "service_provider"
}
```

## Testing the Implementation

1. **Test User Creation:**

   - Sign up with Google authentication
   - Check Firestore console for new user document
   - Verify default 'buyer' role assignment

2. **Test Role Updates:**

   - Login as buyer and upgrade to service_provider
   - Login as admin and manage other users
   - Verify permission restrictions work correctly

3. **Test Admin Features:**
   - Access admin panel with admin account
   - View user statistics
   - Manage user roles

## Future Enhancements

- User profile editing capabilities
- Role-based UI component visibility
- User activity logging
- Email notifications for role changes
- Bulk user operations
- User search and filtering
- Export user data functionality

## Dependencies

### Backend:

- `firebase-admin`: Firebase Admin SDK for Firestore operations
- `jsonwebtoken`: JWT token handling
- `express`: Web framework

### Frontend:

- `axios`: HTTP client for API calls
- React UI components for user interface
- TypeScript for type safety

This implementation provides a solid foundation for user management in the Bidhora platform with room for future enhancements and scalability.
