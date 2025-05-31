/*
  # Fix profiles table RLS policies

  1. Changes
    - Add new RLS policy to allow service role to manage profiles
    - Add policy to allow authenticated users to insert their own profile
    - Add policy to allow public read access to profiles
    - Add policy to allow users to update their own profile

  2. Security
    - Maintains data security by ensuring users can only manage their own profiles
    - Service role has full access for system operations
    - Public can only read profile data
*/

-- Enable RLS on profiles table (in case it's not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Service role has full access" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create comprehensive set of policies

-- Allow service role full access (needed for internal operations)
CREATE POLICY "Service role has full access"
ON profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow users to create their own profile
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow public read access to profiles
CREATE POLICY "Profiles are viewable by everyone"
ON profiles
FOR SELECT
TO public
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);