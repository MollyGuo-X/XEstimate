/*
  # Add purpose column to projects table

  1. Changes
    - Add purpose column to projects table
    - Set default value to 'Fix-Flip'
    - Add check constraint to ensure valid values
*/

DO $$ 
BEGIN
  -- Add purpose column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'purpose'
  ) THEN
    ALTER TABLE projects 
    ADD COLUMN purpose text NOT NULL DEFAULT 'Fix-Flip'
    CHECK (purpose IN ('Fix-Flip', 'BRRR', 'Long-term Hold', 'New Construction'));
  END IF;
END $$;