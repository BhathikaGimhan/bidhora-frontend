# Employee Notification System - Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ADMIN PANEL (Admin User)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Notifications Section                         │   │
│  │                                                                   │   │
│  │  [Send Notification Form]                                        │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │ Recipient:  [Dropdown: All Employees / Specific Employee]│  │   │
│  │  │ Type:       [Info / Success / Warning / Error]           │  │   │
│  │  │ Priority:   [Low / Medium / High]                        │  │   │
│  │  │ Message:    [Text Area]                                  │  │   │
│  │  │                                                           │  │   │
│  │  │              [Send Notification Button]                  │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │                                                                   │   │
│  │  [Notifications Table]                                           │   │
│  │  ┌────────────┬────────────┬─────────┬─────────┬──────────┐    │   │
│  │  │ Message    │ Recipient  │ Type    │ Priority│ Actions  │    │   │
│  │  ├────────────┼────────────┼─────────┼─────────┼──────────┤    │   │
│  │  │ Server...  │ All Emp... │ Info    │ High    │ 🗑️       │    │   │
│  │  │ Please...  │ John Doe   │ Warning │ Medium  │ 🗑️       │    │   │
│  │  └────────────┴────────────┴─────────┴─────────┴──────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Saves to Firestore
                                    ▼
                    ┌──────────────────────────────┐
                    │    FIRESTORE DATABASE        │
                    │  Collection: "notifications" │
                    │                              │
                    │  ┌────────────────────────┐ │
                    │  │ { id, message,         │ │
                    │  │   recipientId: 'all',  │ │
                    │  │   type: 'info',        │ │
                    │  │   priority: 'high',    │ │
                    │  │   read: false,         │ │
                    │  │   createdAt: ...  }    │ │
                    │  └────────────────────────┘ │
                    │                              │
                    │  ┌────────────────────────┐ │
                    │  │ { id, message,         │ │
                    │  │   recipientId: 'uid1', │ │
                    │  │   type: 'warning',     │ │
                    │  │   priority: 'medium',  │ │
                    │  │   read: false,         │ │
                    │  │   createdAt: ...  }    │ │
                    │  └────────────────────────┘ │
                    └──────────────────────────────┘
                                    │
                                    │ Real-time subscription
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    EMPLOYEE PANEL (Employee User)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         Top Bar                                  │   │
│  │  [☰] Employee Dashboard                        [🔔 3] [👤]      │   │
│  │                                                   └─ Badge        │   │
│  │                                             (Shows unread count)  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  Click bell icon navigates to:                                           │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   Notifications View                             │   │
│  │                                                                   │   │
│  │  [Header with "Mark All as Read" button]                        │   │
│  │                                                                   │   │
│  │  [Stats Cards]                                                   │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐               │   │
│  │  │   Total    │  │  Unread    │  │   Read     │               │   │
│  │  │     5      │  │     3      │  │     2      │               │   │
│  │  └────────────┘  └────────────┘  └────────────┘               │   │
│  │                                                                   │   │
│  │  [Notification Cards]                                            │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ 🔴 [Info] [High Priority] [New] [Broadcast]            │   │   │
│  │  │                                                          │   │   │
│  │  │ Server maintenance scheduled for tonight at 10 PM       │   │   │
│  │  │                                                          │   │   │
│  │  │ 2 hours ago                              [✓ Read] [🗑️] │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ 🟡 [Warning] [Medium Priority] [New]                   │   │   │
│  │  │                                                          │   │   │
│  │  │ Please review the updated project requirements          │   │   │
│  │  │                                                          │   │   │
│  │  │ 5 hours ago                              [✓ Read] [🗑️] │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ 🟢 [Success] [Low Priority]                            │   │   │
│  │  │                                                          │   │   │
│  │  │ Your project submission has been approved               │   │   │
│  │  │                                                          │   │   │
│  │  │ 1 day ago                                    [🗑️]       │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Admin Sends Notification

```
1. Admin fills form in Admin Panel
   └─> Selects recipient (All / Specific Employee)
   └─> Chooses type (Info/Success/Warning/Error)
   └─> Sets priority (Low/Medium/High)
   └─> Writes message

2. Admin clicks "Send Notification"
   └─> notificationService.createNotification()
   └─> Firestore document created in "notifications" collection
   └─> adminActivityService logs activity
   └─> Success toast shown to admin

3. Real-time subscription triggers
   └─> All listening employees receive update
   └─> Employee's notification count updates automatically
   └─> Badge shows new unread count
```

### Employee Receives Notification

```
1. Employee is logged in
   └─> EmployeeTopbar subscribes to notifications
   └─> Real-time listener active

2. New notification arrives
   └─> Firestore onSnapshot triggers callback
   └─> Unread count calculated from notifications
   └─> Badge updates: 🔔 2 → 🔔 3
   └─> No page refresh needed

3. Employee clicks bell icon
   └─> Navigates to /employee/notifications
   └─> NotificationsView loads
   └─> Shows all notifications with colors and badges
```

### Employee Marks as Read

```
1. Employee clicks checkmark icon
   └─> notificationService.markAsRead(id)
   └─> Firestore updates: read: false → true
   └─> Success toast shown

2. Real-time update propagates
   └─> Subscription callback fires
   └─> Unread count recalculated
   └─> Badge updates: 🔔 3 → 🔔 2
   └─> "New" badge removed from notification card
   └─> Bold text becomes normal
```

## Color Coding

### Notification Types
- 🔵 **Info** (Blue): General information, updates
- 🟢 **Success** (Green): Positive actions, approvals
- 🟡 **Warning** (Yellow): Important notices, cautions
- 🔴 **Error** (Red): Critical issues, problems

### Priority Levels
- 🔴 **High** (Red badge): Urgent, requires immediate attention
- 🟡 **Medium** (Yellow badge): Important, should be addressed soon
- 🟢 **Low** (Green badge): Informational, no rush

### Status Indicators
- 🟣 **New** (Animated badge): Unread notification
- ✅ **Read**: Normal notification (no special styling)
- 📢 **Broadcast**: Sent to all employees

## Real-Time Features

```
Admin Action                     →  Firestore Update  →  Employee Impact
─────────────────────────────────────────────────────────────────────────
Send notification to all         →  Document created  →  All employees see badge update
Send to specific employee        →  Document created  →  Target employee sees badge update
Delete notification              →  Document deleted  →  Notification removed from view
Employee marks as read           →  Document updated  →  Badge count decreases
Employee deletes notification    →  Document deleted  →  Removed from employee's view
```

## Query Logic

### Admin Queries
```typescript
// Get all sent notifications
query(notificationsCollection, orderBy('createdAt', 'desc'))
```

### Employee Queries
```typescript
// Get notifications for current employee
// Filter: recipientId == 'all' OR recipientId == employeeUID
notifications.filter(n => 
  n.recipientId === 'all' || n.recipientId === currentUser.uid
)
```

## Permission Matrix

| Action                  | Admin | Employee | Firestore Rule |
|------------------------|-------|----------|----------------|
| Send notification      | ✅    | ❌       | role == 'admin' |
| View all notifications | ✅    | ❌       | role == 'admin' |
| View own notifications | N/A   | ✅       | recipientId match |
| Mark as read          | ✅    | ✅       | recipientId match |
| Delete notification   | ✅    | ✅       | role-based |

## Integration Points

### With Admin Activity System
```
Admin sends notification
  └─> Activity logged: "Sent info notification to all employees: 'Server...'"
  └─> Visible in Admin Profile > Recent Admin Activity
  └─> Color-coded icon (blue for notification actions)
  └─> Timestamp shown as "2h ago"
```

### With User Management
```
Admin opens notification form
  └─> Fetches all users from Firestore
  └─> Filters by role == 'employee'
  └─> Populates dropdown with employee names and emails
  └─> Shows "John Doe (john@example.com)"
```

## Technical Stack

- **Frontend**: React + TypeScript
- **Database**: Firebase Firestore
- **Real-time**: Firestore onSnapshot subscriptions
- **State**: React useState + useEffect
- **UI**: shadcn/ui components
- **Routing**: React Router
- **Notifications**: Sonner toast notifications

## Performance Optimizations

1. **Caching**: User controller caches employee list (5 min TTL)
2. **Real-time**: Subscription-based updates (no polling)
3. **Filtering**: Client-side filtering for instant search
4. **Lazy Loading**: Notification view only loads when accessed
5. **Efficient Queries**: Indexed Firestore queries for fast reads

## Security

- Firestore security rules enforce access control
- Admins can only send/view notifications
- Employees can only view their own notifications
- Read status updates validated server-side
- No direct manipulation of recipientId allowed
