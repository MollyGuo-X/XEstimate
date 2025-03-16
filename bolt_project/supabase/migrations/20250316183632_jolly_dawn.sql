/*
  # Revert Long-term Hold specific fields

  1. Changes
    - Remove Long-term Hold specific fields from economic analysis
*/

DO $$ 
BEGIN
  -- Remove Long-term Hold specific fields from economic analysis
  UPDATE projects 
  SET economic_analysis = economic_analysis - '{monthly_rent,vacancy_months,annual_property_tax,annual_hoa,annual_maintenance}'::text[];
END $$;