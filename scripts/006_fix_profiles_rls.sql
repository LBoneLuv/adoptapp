-- Fix RLS policies for profiles table to allow public viewing of display_name and avatar_url
-- This is necessary for showing post/comment authors in the community feed

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

-- Create new policy that allows everyone to view basic profile information
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (true);

-- Keep the update/delete policies restrictive (only own profile)
-- The insert and update policies remain unchanged
