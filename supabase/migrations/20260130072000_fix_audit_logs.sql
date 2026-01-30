-- Drop existing policies and function to recreate them properly
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "No one can delete audit logs" ON audit_logs;
DROP FUNCTION IF EXISTS log_audit_event(TEXT, TEXT, UUID, TEXT, JSONB, BOOLEAN, TEXT, TEXT);

-- Recreate audit_logs table with correct schema (if needed)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Ensure RLS is enabled
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view all audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
    )
  );

-- All authenticated users can insert audit logs for their own actions
CREATE POLICY "Authenticated users can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- No one can delete audit logs (preserve history)
CREATE POLICY "No one can delete audit logs" ON audit_logs
  FOR DELETE USING (false);

-- Function to log audit events with readable information
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_user_email TEXT;
  v_user_name TEXT;
  v_user_role TEXT;
  v_client_ip INET;
BEGIN
  -- Get user information
  SELECT 
    u.email,
    p.full_name,
    ur.role
  INTO 
    v_user_email, 
    v_user_name, 
    v_user_role
  FROM auth.users u
  LEFT JOIN profiles p ON u.id = p.id
  LEFT JOIN user_roles ur ON u.id = ur.user_id
  WHERE u.id = auth.uid();
  
  -- Get client IP address (try multiple methods)
  v_client_ip := COALESCE(
    p_ip_address::INET,
    inet_client_addr(),
    '127.0.0.1'::INET
  );
  
  -- Insert audit log with readable information
  INSERT INTO audit_logs (
    user_id,
    user_email,
    user_name,
    role,
    action,
    entity_type,
    entity_id,
    entity_name,
    details,
    ip_address,
    user_agent,
    success
  ) VALUES (
    auth.uid(),
    v_user_email,
    v_user_name,
    v_user_role,
    p_action,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_details,
    v_client_ip,
    COALESCE(p_user_agent, current_setting('request.headers', true)::JSON->>'user-agent'),
    p_success
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT INSERT ON audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;
