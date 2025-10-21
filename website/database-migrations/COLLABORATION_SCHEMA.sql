-- Collaboration System Database Schema
-- Run this SQL in your Supabase SQL Editor

-- =============================================
-- 1. PROJECT COLLABORATORS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(project_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_status ON project_collaborators(status);

-- =============================================
-- 2. COLLABORATION INVITES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS collaboration_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor', 'admin')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(project_id, email)
);

-- Index for quick token lookups
CREATE INDEX IF NOT EXISTS idx_collaboration_invites_token ON collaboration_invites(token);
CREATE INDEX IF NOT EXISTS idx_collaboration_invites_email ON collaboration_invites(email);

-- =============================================
-- 3. COLLABORATION ACTIVITY LOG
-- =============================================

CREATE TABLE IF NOT EXISTS collaboration_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('join', 'leave', 'edit', 'comment', 'invite', 'role_change')),
  activity_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collaboration_activity_project_id ON collaboration_activity(project_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_activity_created_at ON collaboration_activity(created_at);

-- =============================================
-- 4. ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_activity ENABLE ROW LEVEL SECURITY;

-- Project Collaborators Policies

-- Project owners and admins can view all collaborators
CREATE POLICY "Project owners can view collaborators"
ON project_collaborators FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_collaborators.project_id
    AND projects.user_id = auth.uid()
  )
  OR user_id = auth.uid()
);

-- Project owners and admins can add collaborators
CREATE POLICY "Project owners can add collaborators"
ON project_collaborators FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_collaborators.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Project owners and admins can update collaborator roles
CREATE POLICY "Project owners can update collaborators"
ON project_collaborators FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_collaborators.project_id
    AND projects.user_id = auth.uid()
  )
  OR user_id = auth.uid() -- Users can update their own acceptance status
);

-- Project owners can remove collaborators
CREATE POLICY "Project owners can remove collaborators"
ON project_collaborators FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_collaborators.project_id
    AND projects.user_id = auth.uid()
  )
  OR user_id = auth.uid() -- Users can remove themselves
);

-- Collaboration Invites Policies

-- Project owners can view their invites
CREATE POLICY "Project owners can view invites"
ON collaboration_invites FOR SELECT
TO authenticated
USING (
  invited_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = collaboration_invites.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Project owners can create invites
CREATE POLICY "Project owners can create invites"
ON collaboration_invites FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = collaboration_invites.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Project owners can update invites
CREATE POLICY "Project owners can update invites"
ON collaboration_invites FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = collaboration_invites.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Collaboration Activity Policies

-- Collaborators can view activity for their projects
CREATE POLICY "Collaborators can view activity"
ON collaboration_activity FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = collaboration_activity.project_id
    AND projects.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM project_collaborators
    WHERE project_collaborators.project_id = collaboration_activity.project_id
    AND project_collaborators.user_id = auth.uid()
    AND project_collaborators.status = 'accepted'
  )
);

-- All collaborators can create activity logs
CREATE POLICY "Collaborators can create activity"
ON collaboration_activity FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = collaboration_activity.project_id
      AND projects.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_collaborators.project_id = collaboration_activity.project_id
      AND project_collaborators.user_id = auth.uid()
      AND project_collaborators.status = 'accepted'
    )
  )
);

-- =============================================
-- 5. HELPER FUNCTIONS
-- =============================================

-- Function to check if user has permission for a project
CREATE OR REPLACE FUNCTION has_project_permission(
  p_project_id UUID,
  p_user_id UUID,
  p_required_role TEXT DEFAULT 'viewer'
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Owner has all permissions
  IF EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
    AND user_id = p_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check collaborator role
  IF p_required_role = 'viewer' THEN
    RETURN EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = p_project_id
      AND user_id = p_user_id
      AND status = 'accepted'
      AND role IN ('viewer', 'editor', 'admin')
    );
  ELSIF p_required_role = 'editor' THEN
    RETURN EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = p_project_id
      AND user_id = p_user_id
      AND status = 'accepted'
      AND role IN ('editor', 'admin')
    );
  ELSIF p_required_role = 'admin' THEN
    RETURN EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = p_project_id
      AND user_id = p_user_id
      AND status = 'accepted'
      AND role = 'admin'
    );
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate invite token
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. TRIGGERS
-- =============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_collaborators_updated_at
BEFORE UPDATE ON project_collaborators
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Log collaboration activity when status changes
CREATE OR REPLACE FUNCTION log_collaboration_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO collaboration_activity (project_id, user_id, activity_type, activity_data)
    VALUES (
      NEW.project_id,
      NEW.user_id,
      'join',
      jsonb_build_object('role', NEW.role, 'invited_by', NEW.invited_by)
    );
  ELSIF NEW.status = 'declined' AND OLD.status != 'declined' THEN
    INSERT INTO collaboration_activity (project_id, user_id, activity_type, activity_data)
    VALUES (
      NEW.project_id,
      NEW.user_id,
      'leave',
      jsonb_build_object('reason', 'declined')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_collaboration_status_change_trigger
AFTER UPDATE ON project_collaborators
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_collaboration_status_change();

-- =============================================
-- SETUP COMPLETE!
-- =============================================

-- Verify tables were created
SELECT 
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('project_collaborators', 'collaboration_invites', 'collaboration_activity')
ORDER BY table_name;
