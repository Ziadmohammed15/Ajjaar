/*
  # Fix Profiles RLS Policies for Registration

  1. Changes
    - Update RLS policies for profiles table to properly handle registration
    - Allow unauthenticated users to create profiles during signup
    - Maintain security while enabling necessary access
  
  2. Security
    - Enable RLS on profiles table
    - Add policies for registration flow
    - Ensure proper authentication checks for updates
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for registration" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- Allow profile creation during registration
CREATE POLICY "Enable insert for registration"
ON profiles FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users based on id"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure handle_new_user function has proper permissions
ALTER FUNCTION handle_new_user() SECURITY DEFINER;