-- ============================================
-- V28: User Profiles & Role-Based Access Control
-- ============================================

-- Create user_profiles table linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Owner/Admin can read all profiles
CREATE POLICY "Admin can read all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    )
  );

-- Policy: Owner/Admin can update profiles
CREATE POLICY "Admin can update profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    )
  );

-- Policy: Allow insert for new users (triggered by auth)
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Service role can do anything (for API routes)
CREATE POLICY "Service role full access"
  ON user_profiles FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INT;
  assigned_role TEXT;
BEGIN
  -- Count existing profiles
  SELECT COUNT(*) INTO user_count FROM user_profiles;
  
  -- First user becomes owner, rest are viewers
  IF user_count = 0 THEN
    assigned_role := 'owner';
  ELSE
    assigned_role := 'viewer';
  END IF;

  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    assigned_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
