// Debug script to check auth and role issues
// Run this in your browser console when logged in

import { supabase } from '@/integrations/supabase/client';

// Debug function to check current auth state and role
export async function debugAuthAndRole() {
  console.log('=== DEBUGGING AUTH AND ROLE ===');
  
  // 1. Check current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log('Current user:', user);
  console.log('User error:', userError);
  
  if (!user) {
    console.log('No user found - not logged in');
    return;
  }
  
  // 2. Check session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('Current session:', session);
  console.log('Session error:', sessionError);
  
  // 3. Try to fetch role with different methods
  console.log('--- Testing role fetch methods ---');
  
  // Method 1: Direct query (what we're using now)
  try {
    const { data: role1, error: error1 } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    console.log('Method 1 - Direct query:', { role1, error1 });
  } catch (e) {
    console.log('Method 1 - Exception:', e);
  }
  
  // Method 2: Without .single()
  try {
    const { data: role2, error: error2 } = await supabase
      .from('user_roles')
      .select('role, user_id')
      .eq('user_id', user.id);
    console.log('Method 2 - Without single():', { role2, error2 });
  } catch (e) {
    console.log('Method 2 - Exception:', e);
  }
  
  // Method 3: Using RPC (if we create one)
  try {
    const { data: role3, error: error3 } = await supabase
      .rpc('get_user_role', { user_id: user.id });
    console.log('Method 3 - RPC:', { role3, error3 });
  } catch (e) {
    console.log('Method 3 - Exception:', e);
  }
  
  // 4. Check if user_roles table has any data
  try {
    const { data: allRoles, error: allRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(10);
    console.log('All user_roles (first 10):', { allRoles, allRolesError });
  } catch (e) {
    console.log('All roles query exception:', e);
  }
  
  console.log('=== END DEBUG ===');
}

// Run this in browser console: debugAuthAndRole()
