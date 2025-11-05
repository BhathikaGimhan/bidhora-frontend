# FAQ Management System - Implementation Guide

## Overview
This document describes the implementation of the FAQ management system that connects the admin panel to the buyer-facing Help Center through Firebase Firestore.

## Changes Made

### 1. Created FAQ Service (`src/Services/faqService.ts`)
A new service to handle all FAQ-related operations with Firestore:
- `getAllFAQs()` - Fetch all FAQs ordered by creation date
- `getFAQById(id)` - Get a single FAQ by ID
- `addFAQ(faq)` - Create a new FAQ
- `updateFAQ(id, faq)` - Update an existing FAQ
- `deleteFAQ(id)` - Delete an FAQ
- `getFAQsByCategory(category)` - Filter FAQs by category

### 2. Updated Admin FAQ Management (`src/features/admin/components/FAQManagement.tsx`)
- Replaced mock data with Firestore integration
- Added loading states for better UX
- Added success/error toast notifications
- Implemented real-time CRUD operations:
  - ✅ Create new FAQs
  - ✅ Update existing FAQs
  - ✅ Delete FAQs
  - ✅ Search and filter FAQs

### 3. Updated Help Center (`src/features/helpCenter/HelpCenter.tsx`)
- Connected to Firestore to fetch real-time FAQ data
- Added loading spinner while fetching FAQs
- Removed hardcoded mock data
- FAQs now automatically update when admin makes changes

### 4. Created Seed Script (`src/scripts/seedFAQs.ts`)
A utility script to populate initial FAQs in Firestore for new deployments.

## Firestore Collection Structure

### Collection: `faqs`
```javascript
{
  category: string,        // e.g., "account", "services", "payment", "technical"
  question: string,        // The FAQ question
  answer: string,          // Detailed answer
  tags: string[],          // Array of searchable tags
  createdAt: Timestamp,    // When the FAQ was created
  updatedAt: Timestamp     // Last update timestamp
}
```

## Setup Instructions

### For Initial Deployment:

1. **Set up Firestore Collection**
   - The collection `faqs` will be created automatically when the first FAQ is added
   - No manual collection setup needed

2. **Add Initial FAQs (Optional)**
   - Login as admin
   - Navigate to Admin Panel → FAQ Management
   - Click "Add FAQ" and create your first FAQ
   
   OR
   
   - Use the seed script from browser console:
     ```javascript
     import { seedFAQs } from './src/scripts/seedFAQs';
     seedFAQs();
     ```

3. **Firestore Security Rules**
   Add these rules to your `firestore.rules`:
   ```javascript
   // FAQs - Read by everyone, Write by admin only
   match /faqs/{faqId} {
     allow read: if true;  // Public read access
     allow create, update, delete: if request.auth != null && 
       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
   }
   ```

### For Admins:

1. **Adding a New FAQ**
   - Go to Admin Panel → FAQ Management
   - Click "+ Add FAQ"
   - Fill in:
     - Category (Account & Login, Services, Payment & Billing, or Technical Support)
     - Question
     - Detailed Answer
     - Tags (comma-separated, e.g., "login, password, reset")
   - Click "Add FAQ"

2. **Editing an FAQ**
   - Find the FAQ in the list
   - Click the Edit icon (pencil)
   - Make your changes
   - Click "Update FAQ"

3. **Deleting an FAQ**
   - Find the FAQ in the list
   - Click the Delete icon (trash)
   - Confirm deletion

### For Buyers:

1. **Viewing FAQs**
   - Navigate to Help Center from the footer or main menu
   - Browse all FAQs or filter by category
   - Use the search bar to find specific topics
   - Click "Read more" to expand long answers

## Features

### Admin Panel
- ✅ Full CRUD operations for FAQs
- ✅ Real-time search and filtering
- ✅ Category-based organization
- ✅ Tag management for better searchability
- ✅ Loading states and error handling
- ✅ Success/error notifications

### Help Center (Buyer View)
- ✅ Real-time FAQ display
- ✅ Category filtering
- ✅ Search functionality
- ✅ Expandable answers for long content
- ✅ Tag-based organization
- ✅ Responsive design
- ✅ Loading states

## Categories Available

1. **Account & Login** (`account`)
   - User registration
   - Password management
   - Account issues

2. **Services** (`services`)
   - Service offerings
   - Delivery timelines
   - Quality assurance

3. **Payment & Billing** (`payment`)
   - Payment methods
   - Refund policies
   - Billing questions

4. **Technical Support** (`technical`)
   - File uploads
   - Technical issues
   - Browser compatibility

## Testing

1. **Test FAQ Creation**
   - Login as admin
   - Create a new FAQ
   - Check if it appears in the Help Center immediately

2. **Test FAQ Update**
   - Edit an existing FAQ
   - Verify changes reflect in Help Center

3. **Test FAQ Deletion**
   - Delete an FAQ
   - Confirm it's removed from Help Center

4. **Test Search & Filter**
   - Try searching for keywords
   - Filter by different categories
   - Verify results are accurate

## Troubleshooting

### FAQs Not Showing in Help Center
- Check browser console for errors
- Verify Firestore connection is working
- Check if FAQs exist in the database
- Verify Firestore security rules allow read access

### Cannot Add/Edit/Delete FAQs
- Verify user has admin role
- Check Firestore security rules
- Look for errors in browser console
- Ensure Firebase is properly configured

### Loading Spinner Stuck
- Check internet connection
- Verify Firestore indexes are built
- Check browser console for errors

## Future Enhancements

- [ ] FAQ analytics (view counts, popular questions)
- [ ] FAQ voting (helpful/not helpful)
- [ ] Rich text editor for answers
- [ ] Image/video attachments in answers
- [ ] Multi-language support
- [ ] FAQ recommendations based on user activity
- [ ] Export FAQs to PDF/CSV

## Support

For issues or questions, please contact the development team or create an issue in the project repository.
