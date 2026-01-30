-- Add missing columns to audit_logs table
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS entity_name TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Update existing indexes if needed
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_name ON audit_logs(entity_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_agent ON audit_logs(user_agent);
