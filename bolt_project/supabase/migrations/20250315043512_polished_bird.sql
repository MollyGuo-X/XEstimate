/*
  # Add project status and completion date

  1. Changes
    - Add status column to projects table to track project state (active, completed, no_go)
    - Add completion_date column for completed projects
    
  2. Security
    - No changes to security policies needed as existing policies cover the new columns
*/

DO $$ 
BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'status'
  ) THEN
    ALTER TABLE projects 
    ADD COLUMN status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'no_go'));
  END IF;

  -- Add completion_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'completion_date'
  ) THEN
    ALTER TABLE projects 
    ADD COLUMN completion_date date;
  END IF;
END $$;