/*
  # Fix profiles table RLS policies for registration

  1. Changes
    - Drop existing RLS policies for profiles table
    - Add new policies that properly handle profile creation and updates
    - Ensure public access for registration
    - Allow authenticated users to update their own profile
    - Maintain public read access

  2. Security
    - Enable RLS on profiles table
    - Add policy for profile creation during registration
    - Add policy for profile updates by authenticated users
    - Add policy for public viewing
*/

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Service role has full access" ON profiles;
  DROP POLICY IF EXISTS "Enable insert for registration" ON profiles;
  DROP POLICY IF EXISTS "Enable update for users" ON profiles;
  DROP POLICY IF EXISTS "Enable read access for all" ON profiles;
  DROP POLICY IF EXISTS "Public can insert profiles" ON profiles;
END $$;

-- Create new policies
CREATE POLICY "Enable read access for all users"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Enable insert for registration"
ON profiles FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Enable update for users based on id"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable delete for users based on id"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Grant service role full access
CREATE POLICY "Full access for service role"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);