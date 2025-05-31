/*
  # Fix Profiles RLS Policies for Registration

  1. Changes
    - Drop existing RLS policies for profiles table
    - Create new policies that properly handle registration flow
    - Allow public access for profile creation during registration
    - Fix issues with profile updates and reads
  
  2. Security
    - Enable RLS on profiles table
    - Add comprehensive policies for all operations
    - Ensure proper authentication checks
*/

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  -- Drop all existing policies on profiles table
  DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Service role has full access" ON profiles;
  DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
  DROP POLICY IF EXISTS "Enable insert for registration" ON profiles;
  DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
  DROP POLICY IF EXISTS "Enable delete for users based on id" ON profiles;
  DROP POLICY IF EXISTS "Full access for service role" ON profiles;
  DROP POLICY IF EXISTS "Public can insert profiles" ON profiles;
END $$;

-- Create new policies with clear names

-- Allow everyone to view profiles
CREATE POLICY "Enable read access for all users"
ON profiles FOR SELECT
USING (true);

-- Allow anyone to insert profiles during registration
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

-- Allow users to delete their own profile
CREATE POLICY "Enable delete for users based on id"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Allow service role full access for system operations
CREATE POLICY "Full access for service role"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create or replace function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    new.phone
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();