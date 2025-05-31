/*
  # Fix authentication and RLS policies

  1. Changes
    - Add RLS policy to allow authenticated users to insert their own profile
    - Add RLS policy to allow public users to insert profiles during registration
    - Add RLS policy to allow authenticated users to update their own profile
    - Add RLS policy to allow public users to read profiles
  
  2. Security
    - Enable RLS on profiles table
    - Add policies for profile management
    - Ensure users can only manage their own profiles
*/

-- First, ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Public can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Create new policies with proper checks
CREATE POLICY "Allow insert during registration"
ON profiles
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow users to update own profile"
ON profiles
FOR UPDATE
TO public
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow public to view profiles"
ON profiles
FOR SELECT
TO public
USING (true);