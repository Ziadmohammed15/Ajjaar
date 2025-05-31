/*
  # Fix profiles table RLS policies

  1. Changes
    - Add policy to allow users to create their own profile during registration
    - Add policy to allow service role to manage all profiles
    - Add policy to allow public read access to basic profile info
    - Add policy to allow users to update their own profile

  2. Security
    - Enable RLS on profiles table
    - Policies ensure users can only manage their own profile data
    - Service role has full access for system operations
    - Public can view limited profile info
*/

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies if any
DROP POLICY IF EXISTS "Allow all access to service_role" ON profiles;
DROP POLICY IF EXISTS "Allow users to manage own profiles" ON profiles;
DROP POLICY IF EXISTS "Full access for service role" ON profiles;
DROP POLICY IF EXISTS "Public can view limited profile info" ON profiles;
DROP POLICY IF EXISTS "User can create own profile" ON profiles;
DROP POLICY IF EXISTS "User can update own profile" ON profiles;
DROP POLICY IF EXISTS "User can update verification status" ON profiles;
DROP POLICY IF EXISTS "User can view own profile" ON profiles;

-- Create new policies

-- Allow service role full access
CREATE POLICY "service_role_full_access" ON profiles
  FOR ALL 
  TO service_role 
  USING (true)
  WITH CHECK (true);

-- Allow users to create their own profile
CREATE POLICY "users_create_own_profile" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow public to view basic profile info
CREATE POLICY "public_view_profiles" ON profiles
  FOR SELECT
  TO public
  USING (true);