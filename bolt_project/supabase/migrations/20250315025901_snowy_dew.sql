/*
  # Create renovation items table and policy

  1. New Tables
    - `renovation_items`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `description` (text)
      - `cost` (numeric)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `renovation_items` table
    - Add policy for users to manage renovation items for their projects
*/

CREATE TABLE IF NOT EXISTS renovation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE renovation_items ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'renovation_items' 
    AND policyname = 'Users can manage renovation items for their projects'
  ) THEN
    CREATE POLICY "Users can manage renovation items for their projects"
      ON renovation_items
      FOR ALL
      TO public
      USING (
        EXISTS (
          SELECT 1
          FROM projects
          WHERE projects.id = renovation_items.project_id
          AND projects.user_id = auth.uid()
        )
      );
  END IF;
END $$;