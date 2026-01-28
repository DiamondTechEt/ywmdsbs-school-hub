-- Fix the audit_logs insert policy to be more secure
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Only authenticated users can create audit logs
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs 
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());