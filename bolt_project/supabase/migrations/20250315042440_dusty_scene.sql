/*
  # Add ROI calculations to economic analysis

  1. Changes
    - Add months_to_complete to economic_analysis
    - Add roi and annualized_roi to economic_analysis
*/

DO $$ 
BEGIN
  -- Update existing projects to include new economic analysis fields
  UPDATE projects 
  SET economic_analysis = economic_analysis || 
    jsonb_build_object(
      'months_to_complete', COALESCE((economic_analysis->>'months_to_complete')::numeric, 0),
      'roi', COALESCE((economic_analysis->>'roi')::numeric, 0),
      'annualized_roi', COALESCE((economic_analysis->>'annualized_roi')::numeric, 0)
    );
END $$;