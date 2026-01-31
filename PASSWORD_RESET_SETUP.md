# Password Reset Setup Instructions

## Current Status
The password reset functionality has been implemented but requires proper Supabase configuration to work.

## What's Needed

### 1. Service Role Key
To reset passwords, you need to add the Supabase Service Role Key to your environment variables.

**Add this line to your `.env` file:**
```
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. How to Get Service Role Key
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Find the "service_role" key in the "Project API keys" section
4. Copy the key and add it to your `.env` file

### 3. Security Note
⚠️ **Important**: The service role key has full admin access to your Supabase project. Never expose this key in client-side code in production. For production use:
- Move password reset logic to a server-side API endpoint
- Use environment-specific configurations
- Implement proper authentication and authorization

## Current Implementation

### Files Modified:
1. `src/lib/supabaseAdmin.ts` - Admin client for password operations
2. `src/components/admin/UserManagement.tsx` - Updated password reset mutation
3. `src/hooks/useAuth.tsx` - Enhanced error handling

### How It Works:
1. User clicks "Reset Password" in User Management
2. System fetches user email from profiles table
3. Uses admin client to reset password via Supabase Admin API
4. Shows success/error message to user

## Testing

### To Test Password Reset:
1. Add service role key to `.env`
2. Restart development server
3. Go to User Management page
4. Click "Reset Password" on any user
5. Enter new password (min 6 characters)
6. Confirm password reset

### Expected Results:
- ✅ Success: "Password reset successfully for user@email.com"
- ❌ Error: Clear error message explaining what went wrong

## Troubleshooting

### Common Issues:
1. **"insufficient_privilege" error**: Service role key not configured correctly
2. **"403 Forbidden"**: User doesn't have admin permissions
3. **"User not found"**: Invalid user ID

### Solutions:
1. Verify service role key is correct and added to `.env`
2. Check that current user has super_admin role
3. Ensure user exists in auth.users table

## Production Considerations

For production deployment:
1. Move password reset to server-side API
2. Add rate limiting
3. Implement audit logging
4. Add email notifications for password changes
5. Use proper authentication middleware
