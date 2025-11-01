# Employee Dashboard Feature

## Overview
The Employee Dashboard is a comprehensive feature that allows employees to manage projects assigned to them by the admin. Employees can view their assigned projects, work on them, and submit completed work for admin review.

## Features

### 1. **Employee Dashboard**
- Overview of assigned projects statistics
- Quick access to active, completed, and revision-needed projects
- Recent activity feed
- Performance metrics

### 2. **My Projects**
- View all assigned projects
- Filter by status (Assigned, In Progress, Submitted, Completed, Needs Revision)
- Search functionality
- Project cards with key information

### 3. **Submit Work**
- Upload completed project files
- Add notes for admin review
- Support for multiple file uploads
- File management (add/remove files)
- Automatic status update to "completed_by_employee"

### 4. **Project Details**
- View complete project information
- Admin notes and instructions
- Project timeline and deadlines
- Budget and duration information

## User Flow

1. **Admin assigns project to employee**
   - Project status: `assigned`
   - Employee receives notification (future feature)

2. **Employee views project**
   - Navigates to Employee Dashboard
   - Views project details and admin notes
   - Starts working on the project

3. **Employee submits work**
   - Uploads completed files (PDF, DOC, DOCX, ZIP)
   - Adds optional notes
   - Project status changes to `completed_by_employee`
   - Admin can see submission in Work Submissions section

4. **Admin reviews submission**
   - Admin views submitted work in Work Submissions
   - Can approve or request revisions
   - If revisions needed: status changes to `needs_revision`
   - If approved: status changes to `completed`

5. **If revisions needed**
   - Employee sees project in "Needs Revision" filter
   - Can view admin feedback
   - Re-submit updated work

## Technical Details

### File Structure
```
src/features/employee/
├── EmployeeDashboard.tsx          # Main dashboard component
├── components/
│   ├── Sidebar.tsx                # Employee navigation sidebar
│   ├── Topbar.tsx                 # Top navigation bar
│   └── StatCard.tsx               # Statistics card component
├── views/
│   ├── DashboardView.tsx          # Dashboard overview
│   ├── ProjectsView.tsx           # All projects list
│   └── SubmitWorkView.tsx         # Submit work interface
└── models/
    └── AssignedProjectModel.ts    # TypeScript interfaces
```

### Routes
- `/employee` - Dashboard overview
- `/employee/projects` - All projects
- `/employee/projects/:projectId` - Submit work for specific project
- `/employee/submit` - Submit work (requires project selection)
- `/employee/completed` - Completed projects
- `/employee/notifications` - Notifications (coming soon)
- `/employee/settings` - Settings (coming soon)

### Project Statuses
- `assigned` - Newly assigned, not started
- `in_progress` - Employee is working on it
- `completed_by_employee` - Submitted for review
- `needs_revision` - Admin requested changes
- `completed` - Approved by admin

### Firestore Structure
Projects are stored in the `projects` collection with these employee-related fields:
```typescript
{
  assignedEmployeeId: string;         // Employee UID
  assignedEmployeeName: string;       // Employee display name
  assignedEmployeeEmail: string;      // Employee email
  assignedAt: Timestamp;              // When assigned
  submittedToAdminAt: Timestamp;      // When submitted
  adminReviewStatus: string;          // pending, approved, needs_revision
  adminReviewNotes: string;           // Admin feedback
  documents: Array<{                  // Uploaded files
    url: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
  }>;
  employeeNotes: string;              // Employee notes on submission
}
```

### Storage Structure
Uploaded files are stored at:
```
project-submissions/{projectId}/{timestamp}_{filename}
```

## Security
- Protected routes using `ProtectedEmployeeRoute` component
- Only employees with role `employee` or `admin` can access
- Employees can only view and submit work for projects assigned to them
- Firebase Storage rules should be configured to allow uploads only for assigned employees

## Theme Integration
The employee dashboard uses the Bidhora theme system:
- Primary color: Green (#22c55e)
- Dark mode support
- Consistent with admin panel design
- Responsive layout for mobile and desktop

## Future Enhancements
1. Real-time notifications
2. Chat with admin
3. File preview before upload
4. Progress tracking on projects
5. Earnings dashboard
6. Calendar view for deadlines
7. Document templates
8. Revision history
9. Performance analytics
10. Mobile app

## Dependencies
- React Router for navigation
- Firebase Firestore for data
- Firebase Storage for file uploads
- Firebase Auth for authentication
- shadcn/ui for UI components
- Lucide React for icons

## Usage Example

### Accessing Employee Dashboard
1. Login as a user with `employee` role
2. Navigate to `/employee`
3. View assigned projects and submit work

### Submitting Work
```typescript
// Navigate to submit work page
navigate(`/employee/projects/${projectId}`);

// Upload files
const files = Array.from(input.files);
await uploadToFirebase(files);

// Update project status
await updateDoc(projectRef, {
  status: 'completed_by_employee',
  submittedToAdminAt: serverTimestamp(),
  documents: uploadedDocuments
});
```

## Notes
- Ensure Firebase Storage is properly configured
- Set appropriate security rules in Firestore
- Test file upload limits (currently 10MB per file)
- Monitor storage usage for cost management
