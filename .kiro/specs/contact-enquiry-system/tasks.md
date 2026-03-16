# Implementation Plan: Contact & Enquiry System

## Overview

This plan implements a comprehensive contact and enquiry system for Prime Deal Auto, including VDP contact forms, test drive scheduling, WhatsApp integration, mobile VDP navigation, email notifications via SMTP, and an admin dashboard for lead management. The implementation follows the existing project patterns: Next.js 15 App Router, Lambda with node-postgres, and Aurora PostgreSQL.

## Tasks

- [x] 1. Database schema extensions
  - [x] 1.1 Create migration 009_leads_extension.sql
    - Add enquiry_type, subject, whatsapp_number columns to leads table
    - Create lead_notes table with cascade delete
    - Create lead_status_history table
    - Add indexes for enquiry_type and status_history
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.1.1, 8.1.2, 8.1.3, 8.2.1, 8.2.2, 8.2.3_

  - [x] 1.2 Update backend/db/schema.sql with new tables
    - Add lead_notes and lead_status_history table definitions
    - Update leads table definition with new columns
    - _Requirements: 8.1, 8.1.1, 8.2.1_

- [x] 2. Backend: Email service implementation
  - [x] 2.1 Create email service (backend/src/services/email.service.ts)
    - Implement nodemailer transporter with SSL to mail.primedealauto.co.za:465
    - Fetch SMTP credentials from AWS Secrets Manager
    - Implement sendEmail and sendLeadNotification methods
    - Generate email body with customer details and car info when present
    - Generate subject line based on enquiry type (car enquiry, test drive, general)
    - Handle SMTP errors gracefully (log and continue)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [ ]* 2.2 Write property test for email body generation
    - **Property 2: Email Body Contains Customer Details**
    - **Validates: Requirements 1.5, 10.5, 10.6**

  - [ ]* 2.3 Write property test for email subject format
    - **Property 21: Email Subject Format By Enquiry Type**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

  - [ ]* 2.4 Write unit tests for email service
    - Test email body generation with various lead data
    - Test subject line formatting for each enquiry type
    - Test error handling when SMTP fails
    - _Requirements: 11.2_

- [x] 3. Backend: Lead repository extensions
  - [x] 3.1 Extend lead.repository.ts with new fields and methods
    - Update CreateLeadInput interface with enquiryType, subject, whatsappNumber
    - Add findByIdWithCar method to join with cars table
    - Add findAllWithFilters method with search, status, enquiryType, dateRange filters
    - Add updateStatus method that creates status history record
    - Add getStatusHistory method
    - Add getStats method for dashboard summary
    - _Requirements: 8.5, 8.6, 8.8, 7.1.3, 7.1.6, 7.2.1-7.2.6, 7.4.3, 7.4.4_

  - [ ]* 3.2 Write property test for lead filter queries
    - **Property 17: Filter Returns Matching Leads Only**
    - **Validates: Requirements 7.2.6**

  - [ ]* 3.3 Write property test for default status
    - **Property 22: Default Status For New Leads**
    - **Validates: Requirements 8.5**

- [x] 4. Backend: Lead notes repository
  - [x] 4.1 Create lead-notes.repository.ts
    - Implement create, findByLeadId, delete methods
    - Include created_by_name via join with users table
    - _Requirements: 7.5.1, 7.5.2, 7.5.3, 7.5.4, 7.5.5, 8.1.1, 8.1.2_

  - [ ]* 4.2 Write property test for note creation metadata
    - **Property 15: Note Creation Records Metadata**
    - **Validates: Requirements 7.5.4**

- [x] 5. Backend: Update leads handler with email trigger
  - [x] 5.1 Extend handleCreateLead in leads.handler.ts
    - Accept enquiryType, subject, whatsappNumber in request body
    - Trigger email notification after lead creation
    - Continue with lead creation even if email fails (log error)
    - Return lead ID on success
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ]* 5.2 Write property test for email trigger on lead creation
    - **Property 7: Lead Creation Triggers Email**
    - **Validates: Requirements 2.7, 5.4, 9.1**

  - [ ]* 5.3 Write property test for email failure handling
    - **Property 8: Email Failure Does Not Block Lead Creation**
    - **Validates: Requirements 1.7, 9.6**

  - [ ]* 5.4 Write unit tests for leads handler
    - Test POST /leads with valid data returns lead ID
    - Test validation error responses
    - Test email trigger on lead creation (mocked)
    - Test backward compatibility with existing API schema
    - _Requirements: 11.1, 11.3, 11.4, 11.5_

- [x] 6. Checkpoint - Backend core complete
  - Ensure all backend unit tests pass
  - Verify database migration runs successfully
  - Ask the user if questions arise

- [x] 7. Backend: Admin leads handler
  - [x] 7.1 Create admin-leads.handler.ts
    - Implement handleGetLeads with filters, search, pagination
    - Implement handleGetLeadStats for dashboard summary cards
    - Implement handleGetLeadById with car details
    - Implement handleUpdateLead for status changes
    - Implement handleDeleteLead
    - Implement handleGetLeadNotes and handleAddLeadNote
    - Implement handleGetLeadHistory for status history
    - Require admin authentication on all endpoints
    - _Requirements: 7.1.1-7.1.8, 7.2.1-7.2.7, 7.3.1-7.3.8, 7.4.1-7.4.5, 7.5.1-7.5.6_

  - [ ]* 7.2 Write property test for status change history
    - **Property 14: Status Change Creates History Record**
    - **Validates: Requirements 7.4.3, 7.4.4, 8.2.2**

  - [ ]* 7.3 Write property test for leads sorted by date
    - **Property 16: Leads Sorted By Date Descending**
    - **Validates: Requirements 7.1.6**

  - [ ]* 7.4 Write unit tests for admin leads handler
    - Test GET /admin/leads with various filters
    - Test PATCH /admin/leads/:id status update
    - Test POST /admin/leads/:id/notes
    - Test admin auth requirement (401/403 responses)
    - _Requirements: 11.6, 11.7, 11.8_

- [x] 8. Backend: Register routes in lambda.ts
  - Add admin leads routes to main Lambda router
    - GET /admin/leads → handleGetLeads
    - GET /admin/leads/stats → handleGetLeadStats
    - GET /admin/leads/:id → handleGetLeadById
    - PATCH /admin/leads/:id → handleUpdateLead
    - DELETE /admin/leads/:id → handleDeleteLead
    - GET /admin/leads/:id/notes → handleGetLeadNotes
    - POST /admin/leads/:id/notes → handleAddLeadNote
    - GET /admin/leads/:id/history → handleGetLeadHistory
  - _Requirements: 7.1, 7.2_

- [x] 9. Backend: Update types
  - [x] 9.1 Extend Lead interface in backend/src/types/index.ts
    - Add enquiry_type, subject, whatsapp_number fields
    - Add LeadNote, LeadStatusHistory, LeadStats interfaces
    - Add LeadWithCar interface for admin queries
    - _Requirements: 8.1, 8.2, 8.1.1, 8.2.1_

- [x] 10. Checkpoint - Backend complete
  - Ensure all backend tests pass
  - Run database migration on dev environment
  - Ask the user if questions arise

- [x] 11. Frontend: Contact form modal component
  - [x] 11.1 Create ContactFormModal component (frontend/components/contact/ContactFormModal.tsx)
    - Accept car prop for prefilling subject and message
    - Accept formType prop ('enquiry' | 'test_drive')
    - Implement form fields: firstName, surname, email, phone, preferredDate (test_drive only), message
    - Prefill subject with "[Year] [Make] [Model] [Variant]" for car enquiries
    - Prefill subject with "Test Drive Request: [Year] [Make] [Model] [Variant]" for test drives
    - Prefill message with car price formatted as "R{price}"
    - Implement form validation with field-specific error messages
    - Submit to POST /leads with enquiryType and carId
    - Display success confirmation on successful submission
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 11.2 Write property test for form prefill
    - **Property 4: Form Prefill Contains Car Details**
    - **Validates: Requirements 2.3, 2.4, 3.4**

  - [ ]* 11.3 Write property test for test drive subject format
    - **Property 5: Test Drive Form Subject Format**
    - **Validates: Requirements 3.3, 3.7, 10.3**

  - [ ]* 11.4 Write unit tests for ContactFormModal
    - Test form renders with correct fields
    - Test prefill values for car enquiry
    - Test prefill values for test drive
    - Test validation error display
    - Test success state after submission
    - _Requirements: 11.1.1, 11.1.2, 11.1.3, 11.1.4_

- [x] 12. Frontend: WhatsApp link utility
  - [x] 12.1 Create WhatsApp link generator utility (frontend/lib/whatsapp.ts)
    - Generate wa.me link with phone number +27732144072
    - Generate prefilled message: "Hi, I'm interested in the [Year] [Make] [Model] [Variant] listed at R[Price]. Is it still available?"
    - URL encode the message properly
    - _Requirements: 4.3, 4.4_

  - [ ]* 12.2 Write property test for WhatsApp link format
    - **Property 10: WhatsApp Link Format**
    - **Validates: Requirements 4.3, 4.4, 6.6**

- [x] 13. Frontend: Mobile VDP navigation component
  - [x] 13.1 Create MobileVDPNavigation component (frontend/components/layout/MobileVDPNavigation.tsx)
    - Display only on mobile viewport (< 640px)
    - Display four action buttons: Phone, WhatsApp, Email, Home
    - Phone button: tel:+27732144072
    - WhatsApp button: use WhatsApp link utility with car details
    - Email button: trigger onEmailClick callback to open modal
    - Home button: navigate to /
    - Apply glassmorphism styling consistent with existing MobileNavigation
    - Include safe area padding for device notches
    - Fixed position at bottom of viewport
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11_

  - [ ]* 13.2 Write property test for phone link format
    - **Property 11: Phone Link Format**
    - **Validates: Requirements 6.5**

  - [ ]* 13.3 Write unit tests for MobileVDPNavigation
    - Test renders four action buttons
    - Test WhatsApp link format with car details
    - Test phone link format
    - Test email button triggers modal callback
    - _Requirements: 11.1.5, 11.1.6, 11.1.7_

- [x] 14. Frontend: Integrate contact features into VDP page
  - [x] 14.1 Update VDP page (frontend/app/cars/[carId]/page.tsx)
    - Add "Message Dealer" button in seller sidebar
    - Add "Schedule Test Drive" button in description section
    - Add "Chat Via WhatsApp" button in seller sidebar
    - Integrate ContactFormModal with car data
    - Integrate MobileVDPNavigation (conditionally rendered on mobile)
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 4.5, 6.2, 6.3_

- [x] 15. Frontend: Update contact page form
  - [x] 15.1 Update ContactForm component (frontend/components/contact/ContactForm.tsx)
    - Add WhatsApp Number field (optional)
    - Add Subject field (required)
    - Submit with source: "contact_page" and enquiryType: "general"
    - Display success confirmation on submission
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ]* 15.2 Write property test for contact page source attribution
    - **Property 12: Contact Page Source Attribution**
    - **Validates: Requirements 5.3**

- [x] 16. Checkpoint - Frontend contact features complete
  - Ensure all frontend component tests pass
  - Verify VDP contact buttons work correctly
  - Verify mobile navigation appears on mobile viewport
  - Ask the user if questions arise

- [x] 17. Frontend: Admin messages page
  - [x] 17.1 Create admin messages page (frontend/app/dashboard/messages/page.tsx)
    - Require admin authentication
    - Display summary stat cards: Total, New, Contacted, Converted
    - Display filterable lead table with pagination
    - Implement search by name, email, phone
    - Implement filter dropdowns: Status, Enquiry Type, Date Range
    - Display filtered results count
    - Follow existing dashboard design patterns (rounded-2xl, border-[#E1E1E1], bg-white)
    - _Requirements: 7.1, 7.2, 7.3, 7.1.1-7.1.8, 7.2.1-7.2.7_

  - [x] 17.2 Create LeadTable component (frontend/components/dashboard/LeadTable.tsx)
    - Display columns: Status Badge, Client Name, Contact, Car Interested In, Enquiry Type, Date, Actions
    - Show colored status badges (New=blue, Contacted=yellow, Qualified=purple, Converted=green, Closed=gray)
    - Display car Year Make Model or "General Enquiry"
    - Display enquiry type with icons
    - Actions: View Details, Mark as Contacted, Delete
    - _Requirements: 7.1.1-7.1.8_

- [x] 18. Frontend: Lead detail panel
  - [x] 18.1 Create LeadDetailPanel component (frontend/components/dashboard/LeadDetailPanel.tsx)
    - Slide-over panel from right side
    - Display contact info: name, email (mailto link), phone (tel link), WhatsApp (wa.me link)
    - Display full message content
    - Display car summary card with image when car_id exists
    - Display enquiry source and submission date/time
    - Include status dropdown with history display
    - Include notes section with add form
    - Include "Reply via Email" and "Reply via WhatsApp" action buttons
    - _Requirements: 7.3.1-7.3.8, 7.4.1-7.4.5, 7.5.1-7.5.6_

  - [ ]* 18.2 Write property test for lead detail shows car when present
    - **Property 18: Lead Detail Shows Car When Present**
    - **Validates: Requirements 7.1.3, 7.3.4**

  - [ ]* 18.3 Write unit tests for LeadDetailPanel
    - Test renders lead information
    - Test car card shown when car_id exists
    - Test status dropdown options
    - Test notes section rendering
    - _Requirements: 11.1.1_

- [x] 19. Frontend: API client for leads
  - [x] 19.1 Create leads API client (frontend/lib/api/leads.ts)
    - getLeads(filters) - GET /admin/leads
    - getLeadStats() - GET /admin/leads/stats
    - getLeadById(id) - GET /admin/leads/:id
    - updateLeadStatus(id, status) - PATCH /admin/leads/:id
    - deleteLead(id) - DELETE /admin/leads/:id
    - getLeadNotes(id) - GET /admin/leads/:id/notes
    - addLeadNote(id, text) - POST /admin/leads/:id/notes
    - getLeadHistory(id) - GET /admin/leads/:id/history
    - createLead(data) - POST /leads (public)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.1_

  - [x] 19.2 Create TanStack Query hooks for leads (frontend/hooks/use-leads.ts)
    - useLeads(filters) - query for lead list
    - useLeadStats() - query for stats
    - useLead(id) - query for single lead
    - useUpdateLeadStatus() - mutation
    - useDeleteLead() - mutation
    - useLeadNotes(id) - query for notes
    - useAddLeadNote() - mutation
    - useCreateLead() - mutation for public form submission
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 20. Checkpoint - Admin dashboard complete
  - Ensure all admin page tests pass
  - Verify lead filtering and search works
  - Verify lead detail panel opens and displays correctly
  - Verify status updates and notes work
  - Ask the user if questions arise

- [x] 21. Infrastructure: Add SMTP secrets to Secrets Manager
  - [x] 21.1 Update infrastructure to include SMTP credentials secret
    - Add SMTP credentials secret to DatabaseStack or create new SecretsStack
    - Grant Lambda read access to SMTP secret
    - Pass secret ARN to Lambda environment variables
    - _Requirements: 1.8_

- [ ] 22. Integration tests
  - [ ]* 22.1 Write backend integration tests
    - Test lead creation flow via POST /leads creates database record
    - Test email trigger on lead creation (mocked SMTP)
    - Test admin lead management flow (create, filter, update status, add notes)
    - _Requirements: 11.2.1, 11.2.2, 11.2.3, 11.2.4, 11.2.5, 11.2.6_

  - [ ]* 22.2 Write frontend E2E tests (Playwright)
    - Test VDP contact flow: click Message Dealer, verify modal, submit form
    - Test admin messages page: login, navigate, filter, open detail panel
    - _Requirements: 11.2.1, 11.2.2, 11.2.3, 11.2.4_

- [ ] 23. Final checkpoint - All tests pass
  - Ensure all unit tests pass
  - Ensure all property tests pass
  - Ensure all integration tests pass
  - Verify email delivery to sales@primedealauto.co.za
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Email delivery failures must not block lead creation (Property 8)
- The existing leads handler and repository are extended, not replaced, for backward compatibility (Property 23)
- SMTP credentials must be stored in AWS Secrets Manager, not environment variables (Requirement 1.8)
