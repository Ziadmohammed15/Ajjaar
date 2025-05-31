/*
  # Fix Profiles RLS Policies for Registration

  1. Changes
    - Drop existing RLS policies for profiles table
    - Add new policies that properly handle:
      - Public registration
      - Profile updates by authenticated users
      - Public read access
      - Service role access
    
  2. Security
    - Enable RLS on profiles table
    - Add proper policies for all operations
    - Fix registration flow
*/

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
  DROP POLICY IF EXISTS "Enable insert for registration" ON profiles;
  DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
  DROP POLICY IF EXISTS "Enable delete for users based on id" ON profiles;
  DROP POLICY IF EXISTS "Full access for service role" ON profiles;
END $$;

-- Create new policies

-- Allow public read access to all profiles
CREATE POLICY "Enable read access for all users"
ON profiles FOR SELECT
TO public
USING (true);

-- Allow public registration (critical for new user signup)
CREATE POLICY "Enable insert for registration"
ON profiles FOR INSERT
TO public
WITH CHECK (true);

-- Allow authenticated users to update their own profile
CREATE POLICY "Enable update for users based on id"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow authenticated users to delete their own profile
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
  INSERT INTO public.profiles (
    id,
    name,
    phone,
    phone_verified,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.phone, new.raw_user_meta_data->>'phone', ''),
    false,
    now(),
    now()
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