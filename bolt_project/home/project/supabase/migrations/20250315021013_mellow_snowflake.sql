/*
  # Fix projects table RLS policy

  1. Changes
    - Update policy to use authenticated role instead of public
    - Ensure proper RLS policy for project creation
*/

-- Check if table exists before creating
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'projects') THEN
    CREATE TABLE projects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users NOT NULL,
      name text NOT NULL,
      property_details jsonb NOT NULL,
      renovation_costs jsonb NOT NULL,
      economic_analysis jsonb NOT NULL DEFAULT '{}',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can manage their own projects" ON projects;
END $$;

-- Create single comprehensive policy for all operations
CREATE POLICY "Users can manage their own projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);