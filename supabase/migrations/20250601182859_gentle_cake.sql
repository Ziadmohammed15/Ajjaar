/*
  # Add RLS policies for users table

  1. Changes
    - Enable RLS on users table
    - Add policies for:
      - Public registration (INSERT)
      - Authenticated users can view their own data (SELECT)
      - Users can update their own data (UPDATE)
      - Users can delete their own account (DELETE)

  2. Security
    - Enable RLS on users table
    - Add policies to control access based on user authentication and ownership
*/

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public registration
CREATE POLICY "Allow public registration" ON users
FOR INSERT
TO public
WITH CHECK (true);

-- Users can view their own data
CREATE POLICY "Users can view own data" ON users
FOR SELECT
TO public
USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
FOR UPDATE
TO public
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can delete their own account
CREATE POLICY "Users can delete own account" ON users
FOR DELETE
TO public
USING (auth.uid() = id);