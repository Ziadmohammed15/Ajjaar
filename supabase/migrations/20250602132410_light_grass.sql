/*
  # Fix RLS and Schema Issues

  1. Changes
    - Add email column to profiles table
    - Fix RLS policies for conversation_participants
    - Add storage policies for avatars bucket
    - Add trigger for auto-creating profile on user creation

  2. Security
    - Simplify RLS policies to prevent recursion
    - Add proper storage bucket policies
    - Ensure proper user access control
*/

-- Add email column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text;
  END IF;
END $$;

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Conversation participants view access" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;

-- Simplified RLS policies for conversation_participants
CREATE POLICY "Allow users to view their conversations"
ON conversation_participants
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Allow users to manage their conversations"
ON conversation_participants
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Storage bucket policies for avatars
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid())
WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());

CREATE POLICY "Allow public to view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Create trigger to automatically create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, created_at, updated_at, is_profile_complete)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now(),
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();