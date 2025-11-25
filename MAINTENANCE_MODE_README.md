# Maintenance Mode System

## Overview
The Maintenance Mode system allows administrators to temporarily restrict user access to the platform during system updates, maintenance, or critical fixes. When activated, all users except administrators will see a maintenance page.

## Features

### 1. **Admin Settings Panel** (`/admin/settings`)
- Toggle maintenance mode on/off
- Customize maintenance banner title (max 100 characters)
- Customize maintenance message (max 500 characters)
- Live preview of how the banner will appear to users
- Real-time status indicators (Active/Inactive)
- Character count for title and message
- Cancel button to revert unsaved changes

### 2. **Maintenance Banner**
- Displays at the top of all pages when maintenance mode is active
- Animated gradient background (amber to orange)
- Pulsing wrench icon for visual attention
- Responsive design (mobile-friendly)
- Real-time updates via Firestore listeners

### 3. **Maintenance Guard**
- Protects all routes when maintenance mode is enabled
- Automatically detects admin users and grants access
- Shows full-page maintenance screen to non-admin users
- Refresh button to check if maintenance has ended
- Beautiful gradient design with professional messaging

## Architecture

### Services
**`maintenanceService.ts`**
- `getMaintenanceMode()` - Fetch current maintenance status
- `updateMaintenanceMode()` - Update maintenance settings (admin only)
- `subscribeToMaintenanceMode()` - Real-time listener for maintenance changes

### Components

**`MaintenanceBanner.tsx`**
- Fixed position banner at top of screen
- Auto-subscribes to maintenance mode changes
- Only renders when maintenance is enabled
- Gradient styling with animations

**`MaintenanceGuard.tsx`**
- Wraps main application routes
- Checks maintenance mode and user role
- Shows maintenance page to non-admins
- Allows admins to bypass maintenance

**`SettingsView.tsx`**
- Full admin settings interface
- Form controls for maintenance mode
- Live preview
- Save/Cancel functionality

## Usage

### For Administrators

1. **Activate Maintenance Mode:**
   - Navigate to `/admin/settings`
   - Toggle "Activate Maintenance Mode" switch
   - Customize the title and message (optional)
   - Click "Save Changes"

2. **Customize Messages:**
   - Title: Brief heading (e.g., "Scheduled Maintenance")
   - Message: Detailed explanation (e.g., "We're upgrading our servers. Expected completion: 2 hours")

3. **Deactivate Maintenance Mode:**
   - Navigate to `/admin/settings`
   - Toggle off "Activate Maintenance Mode"
   - Click "Save Changes"

### For Users

When maintenance mode is active:
- **Banner**: See an orange warning banner at the top of every page
- **Full Block**: Non-admins see a dedicated maintenance page and cannot access the site
- **Admins**: Can still access all features normally

## Database Structure

**Firestore Document:** `settings/maintenance`
```typescript
{
  enabled: boolean;
  title: string;
  message: string;
  enabledAt?: Timestamp;
  enabledBy?: string; // Admin UID
  disabledAt?: Timestamp;
  updatedAt: Timestamp;
}
```

## Security Considerations

### Required Firestore Rules
Add these rules to protect maintenance settings:

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Maintenance settings
    match /settings/maintenance {
      // Anyone can read maintenance status
      allow read: if true;
      
      // Only admins can write
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Integration Points

### App.tsx
- MaintenanceBanner component added at root level
- Shows on all pages when enabled

### Routes.tsx
- MaintenanceGuard wraps MainLayout
- Intercepts navigation for non-admin users

### Admin Panel
- Settings link already in sidebar navigation
- Route configured in AdminDashboard.tsx

## Mobile Responsive
All components are fully responsive:
- Banner: Stacks content on mobile, adjusts spacing
- Settings Page: Form fields stack vertically, responsive padding
- Maintenance Page: Centered card layout, scales for mobile

## Character Limits
- **Title**: 100 characters
- **Message**: 500 characters

These limits ensure the banner remains readable and doesn't overwhelm the UI.

## Real-time Updates
The system uses Firestore's `onSnapshot` for real-time updates:
- Changes in admin panel instantly reflect for all users
- No page refresh needed
- Automatic subscription cleanup on unmount

## Testing Checklist

- [ ] Admin can toggle maintenance mode on/off
- [ ] Banner appears when enabled
- [ ] Non-admin users see maintenance page when active
- [ ] Admin users can bypass maintenance mode
- [ ] Custom title and message display correctly
- [ ] Character counters work
- [ ] Preview shows accurate representation
- [ ] Save/Cancel buttons function properly
- [ ] Real-time updates work across tabs
- [ ] Mobile responsive on all screen sizes
- [ ] Toast notifications appear on save
- [ ] Loading states display correctly

## Future Enhancements

Potential additions:
- Scheduled maintenance (set start/end times)
- Email notifications before maintenance
- Maintenance history log
- Multiple maintenance messages for different user roles
- Estimated completion time display
- Progress bar for ongoing maintenance

## Troubleshooting

**Issue**: Maintenance banner not appearing
- Check Firestore `settings/maintenance` document exists
- Verify `enabled: true` in document
- Check browser console for errors

**Issue**: Non-admins can still access site
- Verify MaintenanceGuard is wrapping routes
- Check user role claims in Firebase Auth
- Ensure Firestore rules allow reading maintenance status

**Issue**: Changes not saving
- Verify admin is authenticated
- Check Firestore security rules allow admin writes
- Review browser console for errors
- Ensure Firebase connection is active

## Files Created/Modified

### New Files
- `src/Services/maintenanceService.ts`
- `src/components/MaintenanceBanner.tsx`
- `src/components/MaintenanceGuard.tsx`

### Modified Files
- `src/features/admin/views/SettingsView.tsx` (complete rewrite)
- `src/App.tsx` (added MaintenanceBanner)
- `src/Routes.tsx` (added MaintenanceGuard)
- `src/components/index.ts` (added exports)

## API Reference

### maintenanceService

```typescript
// Get current maintenance mode
const maintenance = await getMaintenanceMode();

// Update maintenance mode
await updateMaintenanceMode(
  enabled: boolean,
  title: string,
  message: string,
  adminUid: string
);

// Subscribe to real-time updates
const unsubscribe = subscribeToMaintenanceMode((data) => {
  console.log('Maintenance status:', data);
});
// Don't forget to call unsubscribe() on cleanup
```

## Support

For issues or questions about the maintenance mode system, contact the development team or review the source code comments for detailed implementation notes.
