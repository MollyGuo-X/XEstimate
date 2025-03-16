/*
  # Fix column names in projects table

  1. Changes
    - Rename columns to match application schema:
      - property -> property_details
      - renovation_costs -> renovation_costs
      - economic_analysis -> economic_analysis

  Note: Using DO block to safely handle column renames
*/

DO $$ 
BEGIN
  -- Rename property to property_details if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'property'
  ) THEN
    ALTER TABLE projects RENAME COLUMN property TO property_details;
  END IF;

  -- Add property_details if neither column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND (column_name = 'property' OR column_name = 'property_details')
  ) THEN
    ALTER TABLE projects ADD COLUMN property_details jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  -- Add renovation_costs if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'renovation_costs'
  ) THEN
    ALTER TABLE projects ADD COLUMN renovation_costs jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  -- Add economic_analysis if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'economic_analysis'
  ) THEN
    ALTER TABLE projects ADD COLUMN economic_analysis jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;