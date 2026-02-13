import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Key, Mail, Users, Search, RefreshCw, Plus, Edit, Trash2, UserPlus, CheckSquare } from 'lucide-react';
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

interface UserWithRole extends Profile {
  user_roles?: {
    role: string;
  } | null;
}

export function UserManagement() {
  const { role: currentUserRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [deleteUserDialog, setDeleteUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkResetDialog, setBulkResetDialog] = useState(false);
  const [bulkPassword, setBulkPassword] = useState('');
  const queryClient = useQueryClient();

  // Check if current user is super admin
  const isSuperAdmin = currentUserRole === 'super_admin';

  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['users', searchTerm, selectedRole],
    queryFn: async () => {
      try {
        // Get users first
        let profilesQuery = supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (searchTerm) {
          profilesQuery = profilesQuery.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
        }

        const { data: profilesData, error: profilesError } = await profilesQuery;
        
        if (profilesError) throw profilesError;

        // Get user roles separately
        const userIds = profilesData.map(p => p.id);
        let rolesQuery = supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        const { data: rolesData, error: rolesError } = await rolesQuery;
        
        if (rolesError) throw rolesError;

        // Combine the data
        const usersWithRoles = profilesData.map(profile => {
          const userRole = rolesData.find(r => r.user_id === profile.id);
          return {
            ...profile,
            user_roles: userRole ? { role: userRole.role } : null,
          } as UserWithRole;
        });

        return usersWithRoles;
      } catch (error) {
        console.error('Network error:', error);
        throw error;
      }
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async ({ email, fullName, role }: { email: string; fullName: string; role: string }) => {
      try {
        // First create the user in auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');

        // Then create the profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email,
            full_name: fullName,
          });

        if (profileError) throw profileError;

        // Then assign the role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: role as any,
          });

        if (roleError) throw roleError;

        return { success: true, userId: authData.user.id };
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('User created successfully');
      setCreateUserDialog(false);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserRole('');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to create user: ${error.message}`);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, fullName, role }: { userId: string; fullName: string; role: string }) => {
      try {
        // Update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (profileError) throw profileError;

        // Update or insert role
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (existingRole) {
          // Update existing role
          const { error: roleError } = await supabase
            .from('user_roles')
            .update({ role: role as any })
            .eq('user_id', userId);

          if (roleError) throw roleError;
        } else {
          // Insert new role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role: role as any,
            });

          if (roleError) throw roleError;
        }

        return { success: true };
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('User updated successfully');
      setEditUserDialog(false);
      setSelectedUser(null);
      setEditUserName('');
      setEditUserRole('');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update user: ${error.message}`);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      try {
        // Delete user role first
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        // Delete profile
        await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);

        // Delete user from auth
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) throw authError;

        return { success: true };
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      setDeleteUserDialog(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ userId, newPassword: password }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to reset password');
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Password reset successfully');
      setResetPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to reset password: ${error.message}`);
    },
  });

  const bulkResetPasswordMutation = useMutation({
    mutationFn: async ({ userIds, password }: { userIds: string[]; password: string }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const results = await Promise.allSettled(
        userIds.map(userId =>
          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
              body: JSON.stringify({ userId, newPassword: password }),
            }
          ).then(r => r.json())
        )
      );

      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) throw new Error(`${failed} of ${userIds.length} password resets failed`);
      return { count: userIds.length };
    },
    onSuccess: (data) => {
      toast.success(`${data.count} passwords reset successfully`);
      setBulkResetDialog(false);
      setBulkPassword('');
      setSelectedIds(new Set());
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      for (const userId of userIds) {
        await supabase.from('user_roles').delete().eq('user_id', userId);
        await supabase.from('profiles').delete().eq('id', userId);
      }
      return { count: userIds.length };
    },
    onSuccess: (data) => {
      toast.success(`${data.count} users deleted`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(`Failed: ${error.message}`);
    },
  });

  const handleCreateUser = () => {
    if (!newUserEmail || !newUserName || !newUserRole) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!newUserEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    createUserMutation.mutate({
      email: newUserEmail,
      fullName: newUserName,
      role: newUserRole,
    });
  };

  const handleUpdateUser = () => {
    if (!selectedUser || !editUserName || !editUserRole) {
      toast.error('Please fill in all fields');
      return;
    }

    updateUserMutation.mutate({
      userId: selectedUser.id,
      fullName: editUserName,
      role: editUserRole,
    });
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;

    // Prevent self-deletion
    supabase.auth.getUser().then(({ data }) => {
      if (selectedUser.id === data.user?.id) {
        toast.error('You cannot delete your own account');
        return;
      }
    });

    deleteUserMutation.mutate({
      userId: selectedUser.id,
    });
  };

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

  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = selectedRole === 'all' || user.user_roles?.role === selectedRole;
    return matchesSearch && matchesRole;
  }) || [];

  // Add role information from user_roles
  const usersWithRoles = filteredUsers.map(user => ({
    ...user,
    role: user.user_roles?.role || 'unknown',
  }));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === usersWithRoles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(usersWithRoles.map(u => u.id)));
    }
  };

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts, roles, and reset passwords
              </CardDescription>
            </div>
            <Dialog open={createUserDialog} onOpenChange={setCreateUserDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account with email, name, and role
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-email">Email</Label>
                    <Input
                      id="new-email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="Enter email address"
                      disabled={createUserMutation.isPending}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-name">Full Name</Label>
                    <Input
                      id="new-name"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Enter full name"
                      disabled={createUserMutation.isPending}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-role">Role</Label>
                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCreateUserDialog(false);
                        setNewUserEmail('');
                        setNewUserName('');
                        setNewUserRole('');
                      }}
                      disabled={createUserMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateUser}
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create User'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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

          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-4">
              <CheckSquare className="h-4 w-4" />
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <Button variant="outline" size="sm" onClick={() => setBulkResetDialog(true)}>
                <Key className="h-3 w-3 mr-1" />
                Reset Passwords
              </Button>
              <Button variant="destructive" size="sm" onClick={() => {
                if (confirm(`Delete ${selectedIds.size} users? This cannot be undone.`)) {
                  bulkDeleteMutation.mutate(Array.from(selectedIds));
                }
              }}>
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
            </div>
          )}

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
                      <th className="h-12 px-4 align-middle w-10">
                        <Checkbox
                          checked={selectedIds.size === usersWithRoles.length && usersWithRoles.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
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
                        <td className="p-4 align-middle w-10">
                          <Checkbox
                            checked={selectedIds.has(user.id)}
                            onCheckedChange={() => toggleSelect(user.id)}
                          />
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {(user.full_name || 'U')[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.full_name || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </div>
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
                          <div className="flex items-center justify-end gap-2">
                            <Dialog
                              open={editUserDialog && selectedUser?.id === user.id}
                              onOpenChange={(open) => {
                                setEditUserDialog(open);
                                if (!open) {
                                  setSelectedUser(null);
                                  setEditUserName('');
                                  setEditUserRole('');
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setEditUserName(user.full_name || '');
                                    setEditUserRole(user.role || '');
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit User</DialogTitle>
                                  <DialogDescription>
                                    Update user information for {selectedUser?.email}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="edit-name">Full Name</Label>
                                    <Input
                                      id="edit-name"
                                      value={editUserName}
                                      onChange={(e) => setEditUserName(e.target.value)}
                                      placeholder="Enter full name"
                                      disabled={updateUserMutation.isPending}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-role">Role</Label>
                                    <Select value={editUserRole} onValueChange={setEditUserRole}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="student">Student</SelectItem>
                                        <SelectItem value="teacher">Teacher</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="super_admin">Super Admin</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setEditUserDialog(false);
                                        setSelectedUser(null);
                                        setEditUserName('');
                                        setEditUserRole('');
                                      }}
                                      disabled={updateUserMutation.isPending}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleUpdateUser}
                                      disabled={updateUserMutation.isPending}
                                    >
                                      {updateUserMutation.isPending ? (
                                        <>
                                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                          Updating...
                                        </>
                                      ) : (
                                        'Update User'
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

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
                                  <Key className="h-4 w-4" />
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

                            <Dialog
                              open={deleteUserDialog && selectedUser?.id === user.id}
                              onOpenChange={(open) => {
                                setDeleteUserDialog(open);
                                if (!open) {
                                  setSelectedUser(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedUser(user)}
                                  disabled={deleteUserMutation.isPending}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Delete User</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete {selectedUser?.full_name || selectedUser?.email}? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setDeleteUserDialog(false);
                                        setSelectedUser(null);
                                      }}
                                      disabled={deleteUserMutation.isPending}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={handleDeleteUser}
                                      disabled={deleteUserMutation.isPending}
                                    >
                                      {deleteUserMutation.isPending ? (
                                        <>
                                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                          Deleting...
                                        </>
                                      ) : (
                                        'Delete User'
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
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

      {/* Bulk Reset Password Dialog */}
      <Dialog open={bulkResetDialog} onOpenChange={setBulkResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Reset Passwords</DialogTitle>
            <DialogDescription>
              Reset passwords for {selectedIds.size} selected users. All selected users will get the same password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Password (for all selected users)</Label>
              <Input
                type="password"
                value={bulkPassword}
                onChange={(e) => setBulkPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBulkResetDialog(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  if (bulkPassword.length < 6) {
                    toast.error('Password must be at least 6 characters');
                    return;
                  }
                  bulkResetPasswordMutation.mutate({
                    userIds: Array.from(selectedIds),
                    password: bulkPassword,
                  });
                }}
                disabled={bulkResetPasswordMutation.isPending}
              >
                {bulkResetPasswordMutation.isPending ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Resetting...</>
                ) : (
                  `Reset ${selectedIds.size} Passwords`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
