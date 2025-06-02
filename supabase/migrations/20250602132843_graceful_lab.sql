/*
  # Fix Profile Management and Storage Issues

  1. Changes
    - Update RLS policies for profiles table to allow proper profile management
    - Add storage bucket creation for avatars
    - Add trigger for automatic profile creation on user signup
    
  2. Security
    - Enable RLS on profiles table
    - Add policies for profile management
    - Set up secure storage policies
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow insert for owner" ON profiles;
DROP POLICY IF EXISTS "Allow update for owner" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profiles" ON profiles;

-- Create new policies for profiles table
CREATE POLICY "Enable read access for authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable delete for users based on id"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Create storage bucket for avatars if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Set up storage bucket policies
CREATE POLICY "Avatar public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Avatar upload access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create or replace the function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    new.created_at,
    new.updated_at
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;