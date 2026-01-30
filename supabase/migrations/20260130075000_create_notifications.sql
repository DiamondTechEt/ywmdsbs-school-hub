-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'GRADE', 'ASSESSMENT', 'STUDENT', 'TEACHER', 'SYSTEM')),
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  is_read BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  action_url TEXT,
  action_text TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (
    auth.uid() = user_id
  );

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (
    true -- Allow system to insert notifications for any user
  );

-- Grant permissions
GRANT SELECT ON notifications TO authenticated;
GRANT INSERT ON notifications TO authenticated;
GRANT UPDATE ON notifications TO authenticated;
GRANT DELETE ON notifications TO authenticated;

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'INFO',
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name TEXT DEFAULT NULL,
  p_priority INTEGER DEFAULT 1,
  p_action_url TEXT DEFAULT NULL,
  p_action_text TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_expires_hours INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate expiration time if provided
  IF p_expires_hours IS NOT NULL THEN
    v_expires_at := NOW() + (p_expires_hours || ' hours')::INTERVAL;
  END IF;
  
  -- Insert notification
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    entity_type,
    entity_id,
    entity_name,
    priority,
    action_url,
    action_text,
    metadata,
    expires_at
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_priority,
    p_action_url,
    p_action_text,
    p_metadata,
    v_expires_at
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
  p_notification_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications 
  SET is_read = true, read_at = NOW()
  WHERE id = p_notification_id 
    AND user_id = auth.uid()
    AND is_read = false;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete notification
CREATE OR REPLACE FUNCTION delete_notification(
  p_notification_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications 
  SET is_deleted = true
  WHERE id = p_notification_id 
    AND user_id = auth.uid()
    AND is_deleted = false;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications 
  SET is_read = true, read_at = NOW()
  WHERE user_id = auth.uid()
    AND is_read = false
    AND is_deleted = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
