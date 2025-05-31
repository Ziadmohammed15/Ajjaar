/*
  # Fix profiles table RLS policies

  1. Changes
    - Update RLS policies for profiles table to allow authenticated users to create their own profiles
    - Add policy for service role to manage all profiles
    - Ensure phone verification status is properly handled

  2. Security
    - Enable RLS on profiles table
    - Add policies for:
      - Public read access to profiles
      - Authenticated users can create their own profile
      - Users can update their own profile
      - Service role has full access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "public_view_profiles" ON "public"."profiles";
DROP POLICY IF EXISTS "service_role_full_access" ON "public"."profiles";
DROP POLICY IF EXISTS "users_create_own_profile" ON "public"."profiles";
DROP POLICY IF EXISTS "users_read_own_profile" ON "public"."profiles";
DROP POLICY IF EXISTS "users_update_own_profile" ON "public"."profiles";

-- Enable RLS
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Public profiles are viewable by everyone"
ON "public"."profiles"
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create their own profile"
ON "public"."profiles"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON "public"."profiles"
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role has full access"
ON "public"."profiles"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);