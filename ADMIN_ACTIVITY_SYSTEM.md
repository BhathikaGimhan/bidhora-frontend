# Admin Activity Tracking System

## Overview
The Admin Activity Tracking System automatically logs all administrative actions performed in the platform, providing a comprehensive audit trail and activity history for administrators.

## Implementation

### 1. Admin Activity Service (`src/Services/adminActivityService.ts`)
A centralized service that handles all activity logging operations.

#### Features:
- **Automatic Logging**: Logs admin activities with timestamps
- **Categorized Actions**: Different action types (user, project, FAQ, review, notification, transaction, system)
- **Detailed Tracking**: Captures action description, target information, and metadata
- **Query Methods**: Retrieve activities by admin or get all recent activities

#### Activity Types:
- `user` - User management actions (create, update, delete, role changes)
- `project` - Project management actions (approve, reject, modify)
- `faq` - FAQ management (create, update, delete FAQs)
- `review` - Review management (moderate, respond, delete)
- `notification` - Notification actions (send, broadcast, delete)
- `transaction` - Transaction handling (process, refund, adjust)
- `system` - System-level actions (settings, configuration changes)

### 2. Admin Profile Section (`src/features/profile/admin/components/AdminProfileSection.tsx`)
Displays recent admin activities in the admin's profile.

#### Features:
- **Real-time Display**: Shows the 10 most recent activities
- **Visual Indicators**: Color-coded icons for different activity types
- **Time Tracking**: Displays relative time (e.g., "2h ago", "3d ago")
- **Activity Details**: Shows action, description, and target information
- **Loading States**: Smooth loading experience with spinners
- **Empty States**: Informative message when no activities exist

### 3. FAQ Management Integration
Activity logging has been integrated into FAQ Management as the first implementation.

#### Logged Actions:
- ✅ **Create FAQ**: Logs when a new FAQ is created
- ✅ **Update FAQ**: Logs when an FAQ is modified
- ✅ **Delete FAQ**: Logs when an FAQ is removed

## Data Structure

### AdminActivity Interface
```typescript
{
  id: string;                    // Unique activity ID
  adminId: string;               // Admin user ID who performed the action
  adminEmail: string;            // Admin email for reference
  action: string;                // Action title (e.g., "Created FAQ")
  actionType: string;            // Category (user, project, faq, etc.)
  description: string;           // Detailed description
  targetId?: string;             // ID of the affected resource
  targetName?: string;           // Name/title of the affected resource
  timestamp: Date;               // When the action occurred
  metadata?: Record<string, string | number | boolean>; // Additional data
}
```

### Firestore Collection Structure
```
adminActivities/
  └── {activityId}
      ├── adminId: string
      ├── adminEmail: string
      ├── action: string
      ├── actionType: string
      ├── description: string
      ├── targetId?: string
      ├── targetName?: string
      ├── timestamp: Timestamp
      └── metadata?: object
```

## Usage Examples

### Logging an Activity

```typescript
import { adminActivityService } from '@/Services/adminActivityService';

// Log a FAQ action
await adminActivityService.logFAQAction(
  'Created FAQ',
  faqId,
  'How do I reset my password?',
  'Created new FAQ in account category'
);

// Log a user action
await adminActivityService.logUserAction(
  'Updated User Role',
  userId,
  'John Doe',
  'Changed user role from buyer to admin'
);

// Log a project action
await adminActivityService.logProjectAction(
  'Approved Project',
  projectId,
  'Website Redesign',
  'Approved project for development'
);

// Log a system action
await adminActivityService.logSystemAction(
  'Updated Settings',
  'Changed payment gateway configuration',
  { gateway: 'stripe', enabled: true }
);
```

### Retrieving Activities

```typescript
// Get activities for a specific admin
const activities = await adminActivityService.getAdminActivities(adminId, 10);

// Get all recent activities (for dashboard)
const allActivities = await adminActivityService.getAllRecentActivities(20);
```

## UI Components

### Activity Display Features

1. **Color-Coded Icons**: Each activity type has a unique color
   - User: Blue
   - Project: Green
   - FAQ: Purple
   - Review: Yellow
   - Notification: Orange
   - Transaction: Pink
   - System: Gray

2. **Time Formatting**: Human-readable relative time
   - "Just now" (< 1 minute)
   - "5m ago" (minutes)
   - "2h ago" (hours)
   - "3d ago" (days)
   - Full date (> 7 days)

3. **Activity Card Layout**:
   - Icon with colored background
   - Action title
   - Description
   - Target information (if available)
   - Timestamp
   - Action type badge

## Integration Roadmap

### Current Status:
✅ Admin Activity Service created  
✅ FAQ Management integration complete  
✅ Admin Profile display implemented  

### Planned Integrations:

#### Phase 1: User Management
- [ ] User creation
- [ ] User role changes
- [ ] User account suspension/activation
- [ ] User deletion

#### Phase 2: Project Management
- [ ] Project approval/rejection
- [ ] Project status changes
- [ ] Project assignment to employees
- [ ] Project completion

#### Phase 3: Review Management
- [ ] Review moderation
- [ ] Review responses
- [ ] Review deletion

#### Phase 4: Notification System
- [ ] Broadcast notifications
- [ ] Individual notifications
- [ ] Notification deletion

#### Phase 5: Transaction Management
- [ ] Payment processing
- [ ] Refund processing
- [ ] Transaction adjustments

#### Phase 6: System Configuration
- [ ] Settings changes
- [ ] Role permission updates
- [ ] System maintenance actions

## Firestore Security Rules

Add these rules to your `firestore.rules`:

```javascript
// Admin Activities - Write by admin only, Read by admins
match /adminActivities/{activityId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  allow create: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  allow update, delete: if false; // Activities should not be modified or deleted
}
```

## Benefits

### For Administrators:
✅ **Transparency**: See what actions you've performed  
✅ **Accountability**: Track your administrative activities  
✅ **Quick Reference**: Review recent actions at a glance  

### For Platform Management:
✅ **Audit Trail**: Complete history of administrative actions  
✅ **Security**: Detect unauthorized or suspicious activities  
✅ **Compliance**: Meet regulatory requirements for audit logs  
✅ **Analytics**: Understand admin workflow patterns  

### For Development:
✅ **Debugging**: Track when and how changes were made  
✅ **Troubleshooting**: Identify the source of issues  
✅ **Testing**: Verify actions are being logged correctly  

## Best Practices

1. **Log Immediately**: Call logging right after successful actions
2. **Be Descriptive**: Provide clear, detailed descriptions
3. **Include Context**: Add relevant metadata when available
4. **Don't Block**: Activity logging should never prevent main actions
5. **Handle Errors**: Log errors silently without breaking the workflow

## Testing

### Manual Testing Steps:

1. **Test FAQ Activity Logging**:
   ```
   - Login as admin
   - Create a new FAQ
   - Check admin profile → Recent Activity
   - Verify "Created FAQ" appears
   - Edit the FAQ
   - Verify "Updated FAQ" appears
   - Delete the FAQ
   - Verify "Deleted FAQ" appears
   ```

2. **Test Activity Display**:
   ```
   - Perform multiple actions
   - Check activities are ordered by time
   - Verify icons and colors are correct
   - Check time formatting is accurate
   - Verify activity details are complete
   ```

3. **Test Loading States**:
   ```
   - Clear browser cache
   - Load admin profile
   - Verify loading spinner appears
   - Wait for activities to load
   - Verify smooth transition
   ```

## Future Enhancements

- [ ] Activity filtering by type
- [ ] Activity search functionality
- [ ] Export activities to CSV
- [ ] Activity analytics dashboard
- [ ] Activity notifications/alerts
- [ ] Activity comparison (before/after states)
- [ ] Activity rollback capabilities
- [ ] Advanced filtering (date range, action type, target)

## Troubleshooting

### Activities Not Showing
1. Check if admin is authenticated
2. Verify Firestore rules allow reading
3. Check browser console for errors
4. Ensure activities collection exists

### Activities Not Being Logged
1. Check if admin has proper permissions
2. Verify Firebase is initialized
3. Check network connectivity
4. Review browser console for errors

### Performance Issues
1. Consider pagination for large activity lists
2. Implement activity archiving for old entries
3. Add indexes to Firestore for common queries

## Summary

The Admin Activity Tracking System provides comprehensive activity logging and display for administrative actions. Starting with FAQ management, it will be progressively integrated across all admin functions to create a complete audit trail and activity history.
