import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resetUserPassword } from '../../lib/supabaseAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Key, Mail, Users, Search, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  role?: string | null;
  last_sign_in_at?: string | null;
}

export function UserManagement() {
  const { role: currentUserRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const queryClient = useQueryClient();

  // Check if current user is super admin
  const isSuperAdmin = currentUserRole === 'super_admin';

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users', searchTerm, selectedRole],
    queryFn: async () => {
      try {
        // Simple query without join first
        let query = supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (searchTerm) {
          query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching users:', error);
          throw error;
        }
        
        // Return data without role information for now
        return data as Profile[];
      } catch (error) {
        console.error('Network error:', error);
        throw error;
      }
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      try {
        // First, get the user's email from profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        // Use the admin function to reset password
        const { error: resetError, success } = await resetUserPassword(userId, password);

        if (resetError || !success) {
          throw new Error(resetError?.message || 'Password reset failed');
        }

        return { email: profile.email, success: true };
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (result) => {
      toast.success(`Password reset successfully for ${result.email}`);
      setResetPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to reset password: ${error.message}`);
    },
  });

  const handleResetPassword = () => {
    if (!selectedUser) return;

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    resetPasswordMutation.mutate({
      userId: selectedUser.id,
      password: newPassword,
    });
  };

  const getRoleBadgeVariant = (role: string | null | undefined) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'default';
      case 'teacher':
        return 'secondary';
      case 'student':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const filteredUsers = users?.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  // Add role information from a separate query if needed
  const usersWithRoles = filteredUsers.map(user => ({
    ...user,
    role: 'unknown' // Default role since we can't join with user_roles
  }));

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Access restricted to super administrators only
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>You don't have permission to manage users</p>
            <p className="text-sm">This feature is available to super administrators only</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage user accounts and reset passwords
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedRole('all');
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading users...</p>
            </div>
          ) : usersWithRoles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No users found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        User
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Role
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Created
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersWithRoles.map((user) => (
                      <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle">
                          <div>
                            <div className="font-medium">{user.full_name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant={getRoleBadgeVariant(user.role || 'unknown')}>
                            {(user.role || 'unknown').replace('_', ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="text-sm">
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4 align-middle text-right">
                          <Dialog
                            open={resetPasswordDialog && selectedUser?.id === user.id}
                            onOpenChange={(open) => {
                              setResetPasswordDialog(open);
                              if (!open) {
                                setSelectedUser(null);
                                setNewPassword('');
                                setConfirmPassword('');
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                                disabled={resetPasswordMutation.isPending}
                              >
                                <Key className="h-4 w-4 mr-2" />
                                Reset Password
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reset Password</DialogTitle>
                                <DialogDescription>
                                  Reset password for {selectedUser?.email}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="new-password">New Password</Label>
                                  <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    disabled={resetPasswordMutation.isPending}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="confirm-password">Confirm Password</Label>
                                  <Input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    disabled={resetPasswordMutation.isPending}
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setResetPasswordDialog(false);
                                      setSelectedUser(null);
                                      setNewPassword('');
                                      setConfirmPassword('');
                                    }}
                                    disabled={resetPasswordMutation.isPending}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleResetPassword}
                                    disabled={resetPasswordMutation.isPending}
                                  >
                                    {resetPasswordMutation.isPending ? (
                                      <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Resetting...
                                      </>
                                    ) : (
                                      'Reset Password'
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
