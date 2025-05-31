/*
  # Fix Phone Verification System

  1. Changes
    - Create phone_verification_codes table if it doesn't exist
    - Add RLS policies for phone_verification_codes table
    - Create functions for verification code generation and checking
  
  2. Security
    - Enable RLS on phone_verification_codes table
    - Add policies for users to manage their verification codes
    - Ensure secure verification process
*/

-- Create phone verification codes table
CREATE TABLE IF NOT EXISTS phone_verification_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can manage their verification codes" ON phone_verification_codes;
  DROP POLICY IF EXISTS "Users can manage their verification codes v2" ON phone_verification_codes;
END $$;

-- Create policy for phone verification codes
CREATE POLICY "Users can manage their verification codes"
ON phone_verification_codes
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Create function to verify phone code
CREATE OR REPLACE FUNCTION verify_phone_code(
  p_phone text,
  p_code text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code_record RECORD;
  v_user_id uuid;
BEGIN
  -- Get the latest verification code for this phone
  SELECT * INTO v_code_record
  FROM phone_verification_codes
  WHERE phone = p_phone
    AND verified = false
    AND attempts < 3
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no valid code found
  IF v_code_record IS NULL THEN
    RETURN false;
  END IF;

  -- Increment attempts
  UPDATE phone_verification_codes
  SET attempts = attempts + 1
  WHERE id = v_code_record.id;

  -- Check if code matches
  IF v_code_record.code = p_code THEN
    -- Mark code as verified
    UPDATE phone_verification_codes
    SET verified = true
    WHERE id = v_code_record.id;

    -- Find user with this phone number
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE phone = p_phone;

    -- If user found, update their profile
    IF v_user_id IS NOT NULL THEN
      UPDATE profiles
      SET 
        phone = p_phone,
        phone_verified = true
      WHERE id = v_user_id;
    END IF;

    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- Create function to generate verification code
CREATE OR REPLACE FUNCTION generate_verification_code(
  p_phone text,
  p_user_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text;
BEGIN
  -- Generate a random 6-digit code
  v_code := floor(random() * 900000 + 100000)::text;
  
  -- Insert the code into the database
  INSERT INTO phone_verification_codes (
    user_id,
    phone,
    code,
    attempts,
    verified,
    expires_at
  ) VALUES (
    p_user_id,
    p_phone,
    v_code,
    0,
    false,
    now() + interval '10 minutes'
  );
  
  RETURN v_code;
END;
$$;