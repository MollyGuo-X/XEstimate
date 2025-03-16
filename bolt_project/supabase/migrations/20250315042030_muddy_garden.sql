/*
  # Update existing projects purpose

  1. Changes
    - Set purpose to 'Fix-Flip' for all existing projects that don't have a purpose set
*/

DO $$ 
BEGIN
  -- Update existing projects to have 'Fix-Flip' as their purpose if not already set
  UPDATE projects 
  SET purpose = 'Fix-Flip' 
  WHERE purpose IS NULL OR purpose = '';
END $$;