-- Add role field to profiles and shelters tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'super_admin'));
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS role text DEFAULT 'shelter' CHECK (role IN ('shelter', 'super_admin'));

-- Create a function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id AND role = 'super_admin'
    UNION
    SELECT 1 FROM shelters WHERE id = user_id AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for shelters to allow super admins to update status
DROP POLICY IF EXISTS shelters_update_status_super_admin ON shelters;
CREATE POLICY shelters_update_status_super_admin ON shelters
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'super_admin'
      UNION
      SELECT id FROM shelters WHERE role = 'super_admin'
    )
  );

-- Note: To create the first super admin, run this SQL manually in Supabase:
-- UPDATE profiles SET role = 'super_admin' WHERE email = 'tu_email@ejemplo.com';
-- or
-- UPDATE shelters SET role = 'super_admin' WHERE email = 'tu_email@ejemplo.com';
