/*
  # Add name column to projects table

  1. Changes
    - Add required 'name' column to projects table
    
  Note: Using DO block to safely add the column
*/

DO $$ 
BEGIN
  -- Add name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'name'
  ) THEN
    ALTER TABLE projects ADD COLUMN name text NOT NULL DEFAULT '';
  END IF;
END $$;