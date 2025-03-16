/*
  # Initial Schema for XFlipEstimate

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `name` (text)
      - `property_details` (jsonb)
      - `renovation_costs` (jsonb)
      - `economic_analysis` (jsonb)

  2. Security
    - Enable RLS on `projects` table
    - Add policies for authenticated users to manage their own projects
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  property_details jsonb NOT NULL,
  renovation_costs jsonb NOT NULL,
  economic_analysis jsonb NOT NULL
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Create select policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' 
    AND policyname = 'Users can read own projects'
  ) THEN
    CREATE POLICY "Users can read own projects"
      ON projects
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Create insert policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' 
    AND policyname = 'Users can insert own projects'
  ) THEN
    CREATE POLICY "Users can insert own projects"
      ON projects
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Create update policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' 
    AND policyname = 'Users can update own projects'
  ) THEN
    CREATE POLICY "Users can update own projects"
      ON projects
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Create delete policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' 
    AND policyname = 'Users can delete own projects'
  ) THEN
    CREATE POLICY "Users can delete own projects"
      ON projects
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;