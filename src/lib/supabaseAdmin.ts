import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key for admin operations
// Note: In production, this should be handled server-side for security
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is not defined');
}

// Check if we have a proper service role key
const hasServiceRoleKey = supabaseServiceKey && 
  supabaseServiceKey !== 'your_service_role_key_here' && 
  supabaseServiceKey.length > 50;

// Create a singleton instance to avoid multiple clients
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(
      supabaseUrl,
      hasServiceRoleKey ? supabaseServiceKey : import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
  return supabaseAdminInstance;
})();

// Helper function to reset user password
export const resetUserPassword = async (userId: string, newPassword: string) => {
  try {
    console.log('Attempting password reset for user:', userId);
    
    // Check if we have proper admin credentials
    if (!hasServiceRoleKey) {
      return { 
        error: new Error('Password reset requires service role key. Please add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file. Get this key from Supabase Settings → API → service_role key.'), 
        success: false 
      };
    }
    
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    
    if (error) {
      console.error('Password reset error:', error);
      return { error, success: false };
    }
    
    console.log('Password reset successful');
    return { error: null, success: true };
  } catch (err) {
    console.error('Unexpected error during password reset:', err);
    return { error: err, success: false };
  }
};
