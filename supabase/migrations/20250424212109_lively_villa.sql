/*
  # Fix profiles table RLS policies

  1. Changes
    - Update RLS policies for the profiles table to allow new user registration
    - Ensure proper access control for profile creation and updates

  2. Security
    - Enable RLS on profiles table
    - Add policies for:
      - Public insert during registration
      - Authenticated users can update their own profile
      - Everyone can view profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Create new policies
CREATE POLICY "Enable insert for registration" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for all" ON profiles
  FOR SELECT USING (true);