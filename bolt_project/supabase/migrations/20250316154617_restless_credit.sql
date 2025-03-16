/*
  # Add Long-term Hold specific fields to economic analysis

  1. Changes
    - Add monthly_rent, vacancy_months, annual_property_tax, annual_hoa, and annual_maintenance
      fields to economic_analysis for Long-term Hold projects
*/

DO $$ 
BEGIN
  -- Update existing projects to include Long-term Hold specific fields in economic analysis
  UPDATE projects 
  SET economic_analysis = economic_analysis || 
    jsonb_build_object(
      'monthly_rent', COALESCE((economic_analysis->>'monthly_rent')::numeric, 0),
      'vacancy_months', COALESCE((economic_analysis->>'vacancy_months')::numeric, 0),
      'annual_property_tax', COALESCE((economic_analysis->>'annual_property_tax')::numeric, 0),
      'annual_hoa', COALESCE((economic_analysis->>'annual_hoa')::numeric, 0),
      'annual_maintenance', COALESCE((economic_analysis->>'annual_maintenance')::numeric, 0)
    )
  WHERE purpose = 'Long-term Hold';
END $$;