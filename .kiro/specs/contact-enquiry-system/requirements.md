# Requirements Document

## Introduction

This feature implements a comprehensive contact and enquiry system for Prime Deal Auto, enabling customers to contact the dealership via email, WhatsApp, and phone. The system includes contact forms on the Vehicle Detail Page (VDP), a general contact page, a mobile-optimized VDP bottom navigation bar, and an admin dashboard for managing all enquiries. Email delivery uses SMTP with the dealership's existing mail server.

## Glossary

- **VDP**: Vehicle Detail Page - the page displaying full details for a single car listing at `/cars/[carId]`
- **Enquiry**: A customer message or request submitted through any contact form
- **Lead**: A database record representing a customer enquiry with contact details and message
- **Contact_Form**: A form component for capturing customer enquiries with name, email, phone, and message fields
- **VDP_Contact_Form**: A contact form prefilled with car details (Year Make Model Variant, Price)
- **Test_Drive_Form**: A contact form prefilled with car details and "Test Drive Request" subject
- **WhatsApp_Link**: A URL that opens WhatsApp with a prefilled message containing car details
- **Mobile_VDP_Navigation**: A custom bottom navigation bar displayed only on mobile when viewing a car detail page
- **SMTP**: Simple Mail Transfer Protocol - the protocol used to send emails
- **Admin_Messages_Page**: The dashboard page at `/dashboard/messages` displaying all customer enquiries

## Requirements

### Requirement 1: Email Contact System Configuration

**User Story:** As a dealership owner, I want all customer enquiries to be sent to our sales email, so that our team can respond promptly.

#### Acceptance Criteria

1. THE Email_Service SHALL send all customer enquiries to sales@primedealauto.co.za
2. THE Email_Service SHALL connect to SMTP host mail.primedealauto.co.za on port 465
3. THE Email_Service SHALL use SSL encryption for all SMTP connections
4. THE Email_Service SHALL authenticate using the configured SMTP credentials
5. THE Email_Service SHALL include the customer's name, email, phone, and message in the email body
6. WHEN an enquiry is for a specific car, THE Email_Service SHALL include the car details (Year, Make, Model, Variant, Price) in the email body
7. IF the SMTP connection fails, THEN THE Email_Service SHALL log the error and return a failure response to the API
8. THE Email_Service SHALL store SMTP credentials in AWS Secrets Manager, not in environment variables or code

### Requirement 2: VDP Message Dealer Button

**User Story:** As a customer viewing a car, I want to quickly message the dealer about that specific car, so that I can enquire without manually entering car details.

#### Acceptance Criteria

1. THE VDP SHALL display a "Message Dealer" button in the seller sidebar
2. WHEN the user clicks "Message Dealer", THE VDP SHALL open a contact form modal
3. THE VDP_Contact_Form SHALL be prefilled with the car's Year, Make, Model, and Variant in the subject field
4. THE VDP_Contact_Form SHALL be prefilled with the car's formatted price (R prefix, ZAR) in the message field
5. THE VDP_Contact_Form SHALL capture: First Name, Surname, Email, Phone Number, and Message
6. WHEN the form is submitted, THE VDP_Contact_Form SHALL create a lead record with the car_id linked
7. WHEN the form is submitted successfully, THE VDP_Contact_Form SHALL send an email notification to sales@primedealauto.co.za
8. WHEN the form is submitted successfully, THE VDP_Contact_Form SHALL display a success confirmation message
9. IF form validation fails, THEN THE VDP_Contact_Form SHALL display field-specific error messages

### Requirement 3: VDP Schedule Test Drive Button

**User Story:** As a customer, I want to schedule a test drive for a specific car, so that I can experience the vehicle before making a decision.

#### Acceptance Criteria

1. THE VDP SHALL display a "Schedule Test Drive" button in the description section
2. WHEN the user clicks "Schedule Test Drive", THE VDP SHALL open a contact form modal
3. THE Test_Drive_Form SHALL be prefilled with "Test Drive Request: [Year] [Make] [Model] [Variant]" in the subject field
4. THE Test_Drive_Form SHALL be prefilled with the car's formatted price in the message field
5. THE Test_Drive_Form SHALL capture: First Name, Surname, Email, Phone Number, Preferred Date (optional), and Message
6. WHEN the form is submitted, THE Test_Drive_Form SHALL create a lead record with enquiry_type set to "test_drive"
7. WHEN the form is submitted successfully, THE Test_Drive_Form SHALL send an email notification with "Test Drive Request" in the subject line
8. WHEN the form is submitted successfully, THE Test_Drive_Form SHALL display a success confirmation message

### Requirement 4: VDP WhatsApp Integration

**User Story:** As a customer, I want to contact the dealer via WhatsApp with car details prefilled, so that I can have a quick conversation about the vehicle.

#### Acceptance Criteria

1. THE VDP SHALL display a "Chat Via WhatsApp" button in the seller sidebar
2. WHEN the user clicks "Chat Via WhatsApp", THE VDP SHALL open WhatsApp with a prefilled message
3. THE WhatsApp_Link SHALL use the dealership WhatsApp number +27 73 214 4072
4. THE WhatsApp_Link prefilled message SHALL include: "Hi, I'm interested in the [Year] [Make] [Model] [Variant] listed at [Price]. Is it still available?"
5. THE WhatsApp_Link SHALL open in a new browser tab on desktop
6. THE WhatsApp_Link SHALL open the WhatsApp app on mobile devices if installed

### Requirement 5: Contact Page Form

**User Story:** As a customer, I want to send a general enquiry to the dealership, so that I can ask questions not related to a specific car.

#### Acceptance Criteria

1. THE Contact_Page at /contact SHALL display a contact form
2. THE Contact_Form SHALL capture: First Name, Surname, Email, Cell Number, WhatsApp Number (optional), Subject, and Message
3. WHEN the form is submitted, THE Contact_Form SHALL create a lead record with source set to "contact_page"
4. WHEN the form is submitted successfully, THE Contact_Form SHALL send an email notification to sales@primedealauto.co.za
5. WHEN the form is submitted successfully, THE Contact_Form SHALL display a success confirmation message
6. THE Contact_Form SHALL validate email format before submission
7. THE Contact_Form SHALL require First Name, Surname, Email, Subject, and Message fields
8. IF form validation fails, THEN THE Contact_Form SHALL display field-specific error messages

### Requirement 6: Mobile VDP Bottom Navigation

**User Story:** As a mobile user viewing a car, I want quick access to contact options, so that I can easily reach the dealer while browsing.

#### Acceptance Criteria

1. THE Mobile_VDP_Navigation SHALL be visible only on mobile viewport widths (< 640px)
2. THE Mobile_VDP_Navigation SHALL be visible only when viewing a car detail page (/cars/[carId])
3. THE Mobile_VDP_Navigation SHALL replace the standard mobile navigation when on VDP
4. THE Mobile_VDP_Navigation SHALL display four action buttons: Phone, WhatsApp, Email, Home
5. WHEN the user taps the Phone button, THE Mobile_VDP_Navigation SHALL initiate a phone call to +27 73 214 4072
6. WHEN the user taps the WhatsApp button, THE Mobile_VDP_Navigation SHALL open WhatsApp with the car details prefilled
7. WHEN the user taps the Email button, THE Mobile_VDP_Navigation SHALL open the VDP contact form modal
8. WHEN the user taps the Home button, THE Mobile_VDP_Navigation SHALL navigate to the home page
9. THE Mobile_VDP_Navigation SHALL use glassmorphism styling consistent with the existing mobile navigation
10. THE Mobile_VDP_Navigation SHALL include safe area padding for device notches (iPhone X+)
11. THE Mobile_VDP_Navigation SHALL remain fixed at the bottom of the viewport

### Requirement 7: Admin Dashboard Messages Page - Overview

**User Story:** As an admin, I want to see all customer enquiries in one place, so that I can manage and respond to leads efficiently.

#### Acceptance Criteria

1. THE Admin_Messages_Page SHALL be accessible at /dashboard/messages
2. THE Admin_Messages_Page SHALL require admin authentication
3. THE Admin_Messages_Page SHALL display summary stat cards at the top showing: Total Leads, New (unread), Contacted, Converted
4. THE Admin_Messages_Page SHALL display a filterable table of all leads/enquiries below the stats
5. THE Admin_Messages_Page SHALL follow the existing dashboard design patterns and styling (rounded-2xl cards, border-[#E1E1E1], bg-white)

### Requirement 7.1: Lead Table Display

**User Story:** As an admin, I want to see lead details at a glance, so that I can quickly identify and prioritize enquiries.

#### Acceptance Criteria

1. THE Lead_Table SHALL display columns: Status Badge, Client Name, Contact (Email/Phone), Car Interested In, Enquiry Type, Date, Actions
2. THE Lead_Table SHALL show a colored status badge: New (blue), Contacted (yellow), Qualified (purple), Converted (green), Closed (gray)
3. WHEN a lead has a linked car_id, THE Lead_Table SHALL display the car's Year Make Model as "Car Interested In"
4. WHEN a lead has no linked car_id, THE Lead_Table SHALL display "General Enquiry" in the Car column
5. THE Lead_Table SHALL display enquiry types with icons: "General" (message icon), "Test Drive" (car icon), "Car Enquiry" (mail icon)
6. THE Lead_Table SHALL sort leads by date descending (newest first) by default
7. THE Lead_Table SHALL support pagination with 20 items per page
8. THE Lead_Table Actions column SHALL include: View Details, Mark as Contacted, Delete buttons

### Requirement 7.2: Lead Filtering and Search

**User Story:** As an admin, I want to filter and search leads, so that I can find specific enquiries quickly.

#### Acceptance Criteria

1. THE Admin_Messages_Page SHALL provide a search input to search by client name, email, or phone
2. THE Admin_Messages_Page SHALL provide filter dropdowns for: Status, Enquiry Type, Date Range
3. THE Status filter SHALL include options: All, New, Contacted, Qualified, Converted, Closed
4. THE Enquiry_Type filter SHALL include options: All, General, Test Drive, Car Enquiry
5. THE Date_Range filter SHALL include options: All Time, Today, Last 7 Days, Last 30 Days, Custom Range
6. WHEN filters are applied, THE Lead_Table SHALL update to show only matching leads
7. THE Admin_Messages_Page SHALL display the count of filtered results (e.g., "Showing 15 of 150 leads")

### Requirement 7.3: Lead Detail View

**User Story:** As an admin, I want to view full lead details, so that I can understand the customer's needs and respond appropriately.

#### Acceptance Criteria

1. WHEN the user clicks on a lead row or "View Details", THE Admin_Messages_Page SHALL open a slide-over panel from the right
2. THE Lead_Detail_Panel SHALL display: Full Name, Email (clickable mailto link), Phone (clickable tel link), WhatsApp Number (clickable WhatsApp link)
3. THE Lead_Detail_Panel SHALL display the full message content
4. WHEN the lead is for a specific car, THE Lead_Detail_Panel SHALL display a car summary card with image, Year Make Model, and Price
5. THE Lead_Detail_Panel SHALL display the enquiry source (VDP, Contact Page, etc.)
6. THE Lead_Detail_Panel SHALL display the submission date and time
7. THE Lead_Detail_Panel SHALL include a "Reply via Email" button that opens the user's email client with prefilled To address
8. THE Lead_Detail_Panel SHALL include a "Reply via WhatsApp" button that opens WhatsApp with the customer's number

### Requirement 7.4: Lead Status Management

**User Story:** As an admin, I want to update lead status, so that I can track the progress of each enquiry.

#### Acceptance Criteria

1. THE Lead_Detail_Panel SHALL include a status dropdown to change the lead status
2. THE Lead status options SHALL be: New, Contacted, Qualified, Converted, Closed
3. WHEN the status is changed, THE system SHALL update the lead record in the database
4. WHEN the status is changed, THE system SHALL record the status change timestamp
5. THE Lead_Detail_Panel SHALL display a status history showing previous status changes with timestamps

### Requirement 7.5: Lead Notes

**User Story:** As an admin, I want to add notes to leads, so that I can record follow-up actions and important information.

#### Acceptance Criteria

1. THE Lead_Detail_Panel SHALL include a notes section
2. THE Notes section SHALL display all existing notes for the lead in chronological order
3. THE Notes section SHALL include a text input to add new notes
4. WHEN a note is added, THE system SHALL record the note text, timestamp, and admin user who added it
5. THE Notes section SHALL display the admin name and timestamp for each note
6. THE Notes section SHALL support basic formatting (line breaks)

### Requirement 8: Lead Database Schema Extension

**User Story:** As a developer, I want the leads table to support enquiry types, status tracking, and notes, so that we can properly manage all enquiries.

#### Acceptance Criteria

1. THE Leads table SHALL include an enquiry_type column with values: "general", "test_drive", "car_enquiry"
2. THE Leads table SHALL include a subject column for storing the enquiry subject line
3. THE Leads table SHALL include a whatsapp_number column for storing the customer's WhatsApp number
4. THE Leads table SHALL include a status column with values: "new", "contacted", "qualified", "converted", "closed"
5. THE Leads table SHALL default status to "new" for new records
6. THE Leads table SHALL default enquiry_type to "general" for existing records
7. THE Leads table SHALL include a source column to track where the lead came from (vdp, contact_page, etc.)
8. THE Leads table SHALL maintain backward compatibility with existing lead creation endpoints

### Requirement 8.1: Lead Notes Table

**User Story:** As a developer, I want a separate table for lead notes, so that we can track all admin interactions with leads.

#### Acceptance Criteria

1. THE Lead_Notes table SHALL have columns: id (UUID), lead_id (FK), note_text, created_by (admin user ID), created_at
2. THE Lead_Notes table SHALL have a foreign key relationship to the leads table
3. THE Lead_Notes table SHALL cascade delete when the parent lead is deleted

### Requirement 8.2: Lead Status History Table

**User Story:** As a developer, I want to track status changes, so that admins can see the history of each lead.

#### Acceptance Criteria

1. THE Lead_Status_History table SHALL have columns: id (UUID), lead_id (FK), old_status, new_status, changed_by (admin user ID), changed_at
2. THE Lead_Status_History table SHALL record every status change for audit purposes
3. THE Lead_Status_History table SHALL have a foreign key relationship to the leads table

### Requirement 9: API Endpoint for Leads with Email Notification

**User Story:** As a developer, I want the leads API to trigger email notifications, so that the sales team is immediately notified of new enquiries.

#### Acceptance Criteria

1. WHEN a lead is created via POST /leads, THE API SHALL trigger an email notification
2. THE API SHALL accept an optional enquiry_type field in the request body
3. THE API SHALL accept an optional subject field in the request body
4. THE API SHALL accept an optional whatsapp_number field in the request body
5. THE API response SHALL return the created lead ID on success
6. IF email sending fails, THEN THE API SHALL still create the lead record and log the email error
7. THE API SHALL validate all required fields before creating the lead

### Requirement 10: Email Template Formatting

**User Story:** As a sales team member, I want enquiry emails to be well-formatted, so that I can quickly understand the customer's request.

#### Acceptance Criteria

1. THE Email_Template SHALL include a clear subject line indicating the enquiry type
2. THE Email_Template subject for car enquiries SHALL be: "New Enquiry: [Year] [Make] [Model]"
3. THE Email_Template subject for test drive requests SHALL be: "Test Drive Request: [Year] [Make] [Model]"
4. THE Email_Template subject for general enquiries SHALL be: "New Contact Form Enquiry: [Subject]"
5. THE Email_Template body SHALL include the customer's full name, email, and phone number
6. THE Email_Template body SHALL include the customer's message
7. WHEN the enquiry is for a specific car, THE Email_Template body SHALL include a link to the car's VDP page
8. THE Email_Template SHALL use plain text format for maximum email client compatibility


### Requirement 11: Testing - Backend API Tests

**User Story:** As a developer, I want comprehensive API tests, so that I can ensure the leads and email functionality works correctly.

#### Acceptance Criteria

1. THE Test_Suite SHALL include unit tests for the leads handler (create, read, update, delete)
2. THE Test_Suite SHALL include unit tests for the email service with mocked SMTP
3. THE Test_Suite SHALL verify lead creation returns correct response structure
4. THE Test_Suite SHALL verify email is triggered on lead creation (mocked)
5. THE Test_Suite SHALL verify validation errors are returned for invalid input
6. THE Test_Suite SHALL verify admin authentication is required for GET /leads and PATCH /leads/:id
7. THE Test_Suite SHALL verify lead status updates work correctly
8. THE Test_Suite SHALL verify lead notes can be added and retrieved
9. ALL tests SHALL pass before deployment

### Requirement 11.1: Testing - Frontend Component Tests

**User Story:** As a developer, I want frontend component tests, so that I can ensure the UI works correctly.

#### Acceptance Criteria

1. THE Test_Suite SHALL include tests for the ContactFormModal component
2. THE Test_Suite SHALL verify form validation displays error messages
3. THE Test_Suite SHALL verify form submission calls the API with correct data
4. THE Test_Suite SHALL verify success message is displayed after submission
5. THE Test_Suite SHALL include tests for the Mobile VDP Navigation component
6. THE Test_Suite SHALL verify WhatsApp links are generated with correct prefilled message
7. THE Test_Suite SHALL verify phone links use correct tel: format

### Requirement 11.2: Testing - Integration Tests

**User Story:** As a developer, I want integration tests, so that I can verify the full flow works end-to-end.

#### Acceptance Criteria

1. THE Integration_Tests SHALL verify a lead submitted from VDP creates a database record
2. THE Integration_Tests SHALL verify the lead appears in the admin messages page
3. THE Integration_Tests SHALL verify lead status can be updated from the admin panel
4. THE Integration_Tests SHALL verify lead notes can be added from the admin panel
5. THE Integration_Tests SHALL verify filters work correctly on the messages page
6. THE Integration_Tests SHALL verify pagination works correctly

### Requirement 11.3: Testing - Email Delivery Verification

**User Story:** As a developer, I want to verify email delivery works, so that the sales team receives enquiries.

#### Acceptance Criteria

1. THE Email_Test SHALL verify SMTP connection can be established to mail.primedealauto.co.za
2. THE Email_Test SHALL verify a test email can be sent and received at sales@primedealauto.co.za
3. THE Email_Test SHALL verify email subject and body are formatted correctly
4. THE Email_Test SHALL verify car details are included in emails for car-specific enquiries
5. IF SMTP credentials are invalid, THEN THE Email_Test SHALL fail with a clear error message

### Requirement 12: Manual Testing Checklist

**User Story:** As a QA tester, I want a manual testing checklist, so that I can verify all features work in production.

#### Acceptance Criteria

1. VERIFY "Message Dealer" button on VDP opens contact form with prefilled car details
2. VERIFY "Schedule Test Drive" button opens form with "Test Drive Request" in subject
3. VERIFY "Chat Via WhatsApp" button opens WhatsApp with prefilled message containing car details
4. VERIFY contact form at /contact submits successfully and shows confirmation
5. VERIFY mobile VDP bottom navigation appears only on mobile viewport
6. VERIFY Phone button initiates call, WhatsApp button opens WhatsApp, Email button opens form
7. VERIFY admin can access /dashboard/messages and see all leads
8. VERIFY admin can filter leads by status, type, and date range
9. VERIFY admin can search leads by name, email, or phone
10. VERIFY admin can view lead details in slide-over panel
11. VERIFY admin can update lead status
12. VERIFY admin can add notes to leads
13. VERIFY emails are received at sales@primedealauto.co.za for all enquiry types
14. VERIFY email subject and body contain correct information
