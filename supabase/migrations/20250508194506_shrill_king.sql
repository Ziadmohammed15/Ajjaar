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
  DROP POLICY IF EXISTS "Allow insert during registration" ON profiles;
  DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
  DROP POLICY IF EXISTS "Allow public to view profiles" ON profiles;
  DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
  DROP POLICY IF EXISTS "Enable insert for registration" ON profiles;
  DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
  DROP POLICY IF EXISTS "Enable delete for users based on id" ON profiles;
  DROP POLICY IF EXISTS "Full access for service role" ON profiles;
  DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Service role has full access" ON profiles;
  DROP POLICY IF EXISTS "Public can insert profiles" ON profiles;
END $$;

-- Create new policies

-- Allow public read access to all profiles
CREATE POLICY "Allow public to view profiles"
ON profiles FOR SELECT
TO public
USING (true);

-- Allow anyone to insert profiles (critical for registration)
CREATE POLICY "Allow insert during registration"
ON profiles FOR INSERT
TO public
WITH CHECK (true);

-- Allow authenticated users to update their own profile
CREATE POLICY "Allow users to update own profile"
ON profiles FOR UPDATE
TO public
USING (auth.uid() = id OR auth.role() = 'service_role')
WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

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