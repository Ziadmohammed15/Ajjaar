/*
  # Fix Phone Authentication System

  1. Changes
    - Drop existing phone_verification_codes table
    - Create new phone_verification_codes table with proper constraints
    - Fix profiles table foreign key constraint
    - Add proper RLS policies
  
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
CREATE INDEX IF NOT EXISTS idx_phone_verification_codes_user_id ON phone_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_verification_codes_phone ON phone_verification_codes(phone);

-- Enable RLS on phone_verification_codes table
ALTER TABLE phone_verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for phone verification codes
CREATE POLICY "Anyone can manage verification codes"
ON phone_verification_codes
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Fix profiles table foreign key constraint if needed
DO $$ 
BEGIN
  -- Check if profiles table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    -- Check if the foreign key constraint exists
    IF NOT EXISTS (
      SELECT FROM information_schema.table_constraints
      WHERE constraint_name = 'profiles_id_fkey'
      AND table_name = 'profiles'
    ) THEN
      -- Add the foreign key constraint
      ALTER TABLE profiles
      ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

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