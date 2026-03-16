-- Migration: 009_leads_extension.sql
-- Description: Extend leads table for contact & enquiry system
-- Adds enquiry_type, subject, whatsapp_number columns
-- Creates lead_notes and lead_status_history tables

-- Add new columns to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS enquiry_type VARCHAR(20) DEFAULT 'general'
  CHECK (enquiry_type IN ('general', 'test_drive', 'car_enquiry')),
ADD COLUMN IF NOT EXISTS subject VARCHAR(255),
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50);

-- Add index for enquiry_type filtering
CREATE INDEX IF NOT EXISTS idx_leads_enquiry_type ON leads(enquiry_type);

-- Create lead_notes table
CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);

-- Create lead_status_history table
CREATE TABLE IF NOT EXISTS lead_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead_id ON lead_status_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_changed_at ON lead_status_history(changed_at DESC);
