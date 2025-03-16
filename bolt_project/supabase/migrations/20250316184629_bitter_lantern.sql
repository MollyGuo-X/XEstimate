/*
  # Add Long-term Hold specific fields

  1. Changes
    - Add Long-term Hold specific fields to economic analysis
    - Initialize with default values for existing Long-term Hold projects
*/

DO $$ 
BEGIN
  -- Update existing projects to include Long-term Hold specific fields in economic analysis
  UPDATE projects 
  SET economic_analysis = economic_analysis || 
    jsonb_build_object(
      'sales_price', COALESCE((economic_analysis->>'asking_price')::numeric, 0),
      'loan_amount', jsonb_build_object(
        'value', 80,
        'is_percentage', true
      ),
      'interest_rate', 7.5,
      'monthly_mortgage', 0,
      'monthly_rent', 0,
      'vacancy_months', 0,
      'annual_property_tax', 0,
      'annual_hoa', 0,
      'annual_insurance', 0,
      'annual_maintenance', 0,
      'appreciation', 3,
      'cash_flow', 0,
      'cash_roi', 0,
      'total_roi', 0
    )
  WHERE purpose = 'Long-term Hold';
END $$;