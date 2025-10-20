-- Add forked_from column to projects table
-- This allows tracking which projects are forks of other projects

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS forked_from UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for better query performance when finding forks
CREATE INDEX IF NOT EXISTS idx_projects_forked_from ON projects(forked_from);

-- Create index for better query performance on fork counts
CREATE INDEX IF NOT EXISTS idx_projects_forks_count ON projects(forks_count);

COMMENT ON COLUMN projects.forked_from IS 'The ID of the original project if this is a fork';
