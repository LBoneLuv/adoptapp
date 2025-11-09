-- Drop and recreate the shelters_select_all policy to allow everyone to read shelters
DROP POLICY IF EXISTS shelters_select_all ON shelters;

CREATE POLICY shelters_select_all 
ON shelters 
FOR SELECT 
USING (true);

-- Verify RLS is enabled
ALTER TABLE shelters ENABLE ROW LEVEL SECURITY;
