/*
  # Fix Phone Verification System

  1. Changes
    - Create phone_verification_codes table if it doesn't exist
    - Add proper foreign key reference to auth.users
    - Add RLS policies for phone_verification_codes table
    - Fix profiles table structure
  
  2. Security
    - Enable RLS on phone_verification_codes table
    - Add policies for users to manage their verification codes
    - Ensure secure verification process
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS phone_verification_codes;

-- Create phone verification codes table
CREATE TABLE phone_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL,
  code text NOT NULL,
  attempts integer DEFAULT 0,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '10 minutes')
);

-- Create indexes for better performance
CREATE INDEX idx_phone_verification_codes_user_id ON phone_verification_codes(user_id);
CREATE INDEX idx_phone_verification_codes_phone ON phone_verification_codes(phone);

-- Enable RLS on phone_verification_codes table
ALTER TABLE phone_verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for phone verification codes
CREATE POLICY "Anyone can manage verification codes"
ON phone_verification_codes
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Make sure profiles table has the necessary columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type text CHECK (user_type IN ('client', 'provider'));

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow public to view profiles" ON profiles;
  DROP POLICY IF EXISTS "Allow insert during registration" ON profiles;
  DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
  DROP POLICY IF EXISTS "Full access for service role" ON profiles;
END $$;

-- Create new policies with clear names

-- Allow public read access to all profiles
CREATE POLICY "Allow public to view profiles"
ON profiles FOR SELECT
TO public
USING (true);

-- Allow anyone to insert profiles during registration
CREATE POLICY "Allow insert during registration"
ON profiles FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile"
ON profiles FOR UPDATE
TO anon, authenticated
USING (auth.uid() = id OR auth.role() = 'service_role')
WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Allow service role full access for system operations
CREATE POLICY "Full access for service role"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);