-- Prime Deal Auto — Database Schema
-- Aurora PostgreSQL Serverless v2

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trigger function for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Users (synced from Cognito)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cognito_sub VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(20) NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'dealer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_cognito_sub ON users(cognito_sub);
CREATE INDEX idx_users_email ON users(email);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Car Makes
-- ============================================
CREATE TABLE car_makes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_car_makes_updated_at
  BEFORE UPDATE ON car_makes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Car Models
-- ============================================
CREATE TABLE car_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make_id UUID NOT NULL REFERENCES car_makes(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(make_id, name)
);

CREATE INDEX idx_car_models_make_id ON car_models(make_id);

CREATE TRIGGER trg_car_models_updated_at
  BEFORE UPDATE ON car_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Car Variants
-- ============================================
CREATE TABLE car_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID NOT NULL REFERENCES car_models(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(model_id, name)
);

CREATE INDEX idx_car_variants_model_id ON car_variants(model_id);

CREATE TRIGGER trg_car_variants_updated_at
  BEFORE UPDATE ON car_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Cars
-- ============================================
CREATE TABLE cars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  variant VARCHAR(100),
  year INTEGER NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  mileage INTEGER NOT NULL DEFAULT 0,
  condition VARCHAR(20) NOT NULL DEFAULT 'good'
    CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  body_type VARCHAR(50),
  transmission VARCHAR(20) NOT NULL DEFAULT 'automatic'
    CHECK (transmission IN ('automatic', 'manual', 'cvt')),
  fuel_type VARCHAR(20) NOT NULL DEFAULT 'petrol'
    CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid')),
  color VARCHAR(50),
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'sold', 'pending', 'deleted')),
  views_count INTEGER NOT NULL DEFAULT 0,
  make_id UUID REFERENCES car_makes(id) ON DELETE SET NULL,
  model_id UUID REFERENCES car_models(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES car_variants(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cars_status ON cars(status);
CREATE INDEX idx_cars_make ON cars(make);
CREATE INDEX idx_cars_model ON cars(model);
CREATE INDEX idx_cars_year ON cars(year);
CREATE INDEX idx_cars_price ON cars(price);
CREATE INDEX idx_cars_make_model ON cars(make, model);
CREATE INDEX idx_cars_status_created ON cars(status, created_at DESC);
CREATE INDEX idx_cars_make_id ON cars(make_id);
CREATE INDEX idx_cars_model_id ON cars(model_id);

-- Full-text search GIN index
CREATE INDEX idx_cars_fts ON cars USING GIN (
  to_tsvector('english', coalesce(make, '') || ' ' || coalesce(model, '') || ' ' || coalesce(description, ''))
);

CREATE TRIGGER trg_cars_updated_at
  BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Car Images
-- ============================================
CREATE TABLE car_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  s3_key VARCHAR(500) NOT NULL,
  cloudfront_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_car_images_car_id ON car_images(car_id);

-- ============================================
-- Favorites
-- ============================================
CREATE TABLE favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, car_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_car_id ON favorites(car_id);

-- ============================================
-- Leads
-- ============================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  whatsapp_number VARCHAR(50),
  country VARCHAR(100),
  subject VARCHAR(255),
  enquiry TEXT,
  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  source VARCHAR(100) NOT NULL DEFAULT 'website',
  enquiry_type VARCHAR(20) NOT NULL DEFAULT 'general'
    CHECK (enquiry_type IN ('general', 'test_drive', 'car_enquiry')),
  status VARCHAR(20) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'closed')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_car_id ON leads(car_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_enquiry_type ON leads(enquiry_type);

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Lead Notes
-- ============================================
CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_notes_lead_id ON lead_notes(lead_id);

-- ============================================
-- Lead Status History
-- ============================================
CREATE TABLE lead_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_status_history_lead_id ON lead_status_history(lead_id);
CREATE INDEX idx_lead_status_history_changed_at ON lead_status_history(changed_at DESC);

-- ============================================
-- Chat Sessions
-- ============================================
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_token ON chat_sessions(session_token);

CREATE TRIGGER trg_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Chat Messages
-- ============================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL
    CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- ============================================
-- Analytics Events
-- ============================================
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL
    CHECK (event_type IN ('page_view', 'car_view', 'pwa_install')),
  page_url VARCHAR(500),
  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_car_id ON analytics_events(car_id);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_session_id ON analytics_events(session_id);
