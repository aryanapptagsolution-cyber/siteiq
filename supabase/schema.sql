-- SiteIQ Production Schema
-- Run this in Supabase SQL Editor

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer','analyst','planner','admin')),
  avatar_initials TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role, avatar_initials)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), 1) ||
          LEFT(COALESCE(SPLIT_PART(NEW.raw_user_meta_data->>'name', ' ', 2), ''), 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Sites
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  metro TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION NOT NULL DEFAULT 0,
  lng DOUBLE PRECISION NOT NULL DEFAULT 0,
  composite_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  factor_scores JSONB NOT NULL DEFAULT '{}',
  bucket TEXT NOT NULL DEFAULT 'long-term' CHECK (bucket IN ('immediate','near-term','long-term','gated')),
  data_quality_grade TEXT NOT NULL DEFAULT 'C' CHECK (data_quality_grade IN ('A','B','C')),
  missing_fields TEXT[] NOT NULL DEFAULT '{}',
  utility_flag BOOLEAN NOT NULL DEFAULT FALSE,
  utility_info JSONB DEFAULT NULL,
  owner_info JSONB DEFAULT NULL,
  data_sources JSONB NOT NULL DEFAULT '[]',
  photos TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT NOT NULL DEFAULT '',
  score_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  upload_id UUID DEFAULT NULL,
  rank INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sites_metro ON sites(metro);
CREATE INDEX IF NOT EXISTS idx_sites_composite_score ON sites(composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_sites_bucket ON sites(bucket);

-- 3. Presets
CREATE TABLE IF NOT EXISTS presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  weights JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT DEFAULT ''
);

-- Insert default preset
INSERT INTO presets (name, weights, is_system, description)
VALUES (
  'Default',
  '{"evScore":25,"population":15,"evOwnership":12,"evUsageDemand":10,"streetTraffic":8,"income":8,"proximityAmenities":7,"footTraffic":7,"mallOccupancy":5,"retailers":3}',
  TRUE,
  'EV-first balanced scoring model'
) ON CONFLICT DO NOTHING;

-- 4. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL DEFAULT '',
  user_role TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL CHECK (action IN (
    'weight_change','preset_loaded','preset_created','preset_deleted',
    'ingestion_run','csv_export','pdf_export','site_view',
    'login_success','login_failed','rollback','file_upload'
  )),
  details TEXT NOT NULL DEFAULT '',
  before_val TEXT DEFAULT NULL,
  after_val TEXT DEFAULT NULL,
  ip_address TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success','failed'))
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- 5. Uploads
CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'csv',
  records_count INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('processing','completed','failed'))
);

-- =====================
-- RLS Policies
-- =====================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Profiles: any authenticated user can read all profiles
CREATE POLICY "Authenticated users can read profiles"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Sites: all authenticated can read; admin/planner can write
CREATE POLICY "Authenticated users can read sites"
  ON sites FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/planner can insert sites"
  ON sites FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','planner'))
  );

CREATE POLICY "Admin/planner can update sites"
  ON sites FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','planner'))
  );

CREATE POLICY "Admin can delete sites"
  ON sites FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Presets: all authenticated can read; analyst+ can write
CREATE POLICY "Authenticated can read presets"
  ON presets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Analyst+ can insert presets"
  ON presets FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('analyst','planner','admin'))
  );

CREATE POLICY "Analyst+ can update presets"
  ON presets FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('analyst','planner','admin'))
  );

CREATE POLICY "Admin can delete presets"
  ON presets FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('planner','admin'))
  );

-- Audit logs: planner/admin can read; all authenticated can insert
CREATE POLICY "Planner/admin can read audit"
  ON audit_logs FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('planner','admin'))
  );

CREATE POLICY "Authenticated can insert audit"
  ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Uploads: all authenticated can read; admin/planner can insert
CREATE POLICY "Authenticated can read uploads"
  ON uploads FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/planner can insert uploads"
  ON uploads FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','planner'))
  );
