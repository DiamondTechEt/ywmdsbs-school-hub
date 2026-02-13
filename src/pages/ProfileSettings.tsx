import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Settings as SettingsIcon, User, Lock, Mail, Phone, Camera, Loader2, Save, Eye, EyeOff } from 'lucide-react';
import { AvatarUpload } from '@/components/shared/AvatarUpload';

export default function ProfileSettings() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    email: '',
    phone: '',
    avatar_url: '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Get user profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      console.log('Loading profile data for user:', user.id);

      // First check if user is super admin to avoid unnecessary queries
      try {
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'super_admin')
          .single();

        console.log('User role check result:', { userRole, roleError });

        if (userRole) {
          console.log('User is super admin, loading profile data');
          // User is super admin, check profiles table first
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            console.log('Profile table result:', { profileData, profileError });

            if (profileData) {
              const fullName = profileData.full_name || '';
              const nameParts = fullName.split(' ');
              
              return {
                ...profileData,
                email: user.email,
                // Map the profile data to the expected form fields
                first_name: nameParts[0] || '',
                last_name: nameParts.slice(1).join(' ') || '',
                middle_name: '', // Profiles table doesn't have middle name
                phone: '', // Profiles table doesn't have phone
                avatar_url: profileData.avatar_url || '',
                type: 'super_admin'
              };
            }
          } catch (error) {
            console.log('Profile not found, using user metadata');
            // Profile not found, use user metadata
          }

          // Get user metadata for super admin
          const { data: authData } = await supabase.auth.getUser();
          const metadata = authData?.user?.user_metadata || {};
          
          console.log('Using user metadata for super admin:', metadata);
          
          return {
            first_name: metadata.first_name || metadata.full_name?.split(' ')[0] || '',
            last_name: metadata.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || '',
            middle_name: metadata.middle_name || '',
            email: user.email,
            phone: metadata.phone || '',
            avatar_url: metadata.avatar_url || '',
            type: 'super_admin'
          };
        }
      } catch (error) {
        console.log('Not super admin, checking student/teacher tables');
        // Not super admin, continue with student/teacher checks
      }

      // Try to get student data
      try {
        const { data: studentData } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (studentData) {
          return {
            ...studentData,
            email: user.email,
            avatar_url: studentData.avatar_url || '',
            type: 'student'
          };
        }
      } catch (error) {
        // Student not found, continue to teacher check
      }

      // Try to get teacher data
      try {
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (teacherData) {
          return {
            ...teacherData,
            email: user.email,
            phone: teacherData.phone || '',
            avatar_url: teacherData.avatar_url || '',
            type: 'teacher'
          };
        }
      } catch (error) {
        // Teacher not found, use fallback
      }

      // Fallback to auth user data
      const { data: authData } = await supabase.auth.getUser();
      const metadata = authData?.user?.user_metadata || {};
      
      return {
        email: user.email,
        first_name: metadata.first_name || metadata.full_name?.split(' ')[0] || '',
        last_name: metadata.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || '',
        middle_name: metadata.middle_name || '',
        phone: metadata.phone || '',
        avatar_url: metadata.avatar_url || '',
        type: 'user'
      };
    },
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Update user email if changed
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        });
        if (emailError) throw emailError;
      }

      // Update profile data based on user type
      if (profileData?.type === 'student') {
        const studentUpdateData: any = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          middle_name: formData.middle_name,
          phone: formData.phone,
        };
        
        // Only include avatar_url if the column exists (students table has it)
        if (formData.avatar_url) {
          studentUpdateData.avatar_url = formData.avatar_url;
        }
        
        const { error: studentError } = await supabase
          .from('students')
          .update(studentUpdateData)
          .eq('user_id', user.id);
        if (studentError) throw studentError;
      } else if (profileData?.type === 'teacher') {
        const teacherUpdateData: any = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          middle_name: formData.middle_name,
          // Remove phone if column doesn't exist
          // phone: formData.phone,
        };
        
        // Don't include phone or avatar_url for teachers (columns don't exist)
        
        const { error: teacherError } = await supabase
          .from('teachers')
          .update(teacherUpdateData)
          .eq('user_id', user.id);
        if (teacherError) throw teacherError;
      } else if (profileData?.type === 'super_admin') {
        // Update super admin profile in multiple places
        try {
          console.log('Updating super admin profile with data:', formData);
          
          // First, try to update the profiles table if it exists
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              full_name: `${formData.first_name} ${formData.last_name}`.trim(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

          console.log('Profile table update result:', { error: profileError });

          if (profileError && !profileError.message.includes('does not exist')) {
            console.error('Profile table update error:', profileError);
          }

          // Then update user metadata
          const { error: authError } = await supabase.auth.updateUser({
            data: {
              user_metadata: {
                first_name: formData.first_name,
                last_name: formData.last_name,
                middle_name: formData.middle_name,
                phone: formData.phone,
                avatar_url: formData.avatar_url,
                full_name: `${formData.first_name} ${formData.last_name}`.trim(),
              }
            }
          });
          
          console.log('Auth metadata update result:', { error: authError });
          
          if (authError) {
            console.error('Auth update error:', authError);
            // If auth update fails but profile update succeeded, still consider it successful
            if (!profileError) {
              console.log('Profile updated successfully, but metadata update failed');
              return formData;
            }
            throw new Error('Failed to update profile metadata. Please contact an administrator.');
          }
          
          console.log('Super admin profile updated successfully');
        } catch (error) {
          console.error('Super admin update error:', error);
          throw new Error('Failed to update profile. Please contact an administrator.');
        }
      }

      return formData;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      
      // Invalidate multiple queries to ensure data refresh
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
      
      // Force a refetch of the profile data after a short delay
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['user-profile', user?.id] });
        queryClient.refetchQueries({ queryKey: ['user'] });
      }, 100);
      
      // Also refetch after a longer delay to ensure metadata is updated
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['user-profile', user?.id] });
      }, 500);
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate key')) {
        toast.error('Email already exists. Please use a different email address.');
      } else if (error.message?.includes('invalid email')) {
        toast.error('Invalid email address format.');
      } else {
        toast.error(error.message || 'Failed to update profile. Please try again.');
      }
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (!user?.email) throw new Error('User email not found');

      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.current_password,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.new_password,
      });

      if (updateError) throw updateError;

      return true;
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setShowPasswordDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to change password');
    },
  });

  // Initialize form with profile data
  useEffect(() => {
    if (profileData) {
      console.log('Initializing form with profile data:', profileData);
      setProfileForm({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        middle_name: profileData.middle_name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        avatar_url: profileData.avatar_url || '',
      });
    }
  }, [profileData]);

  // Also update form when mutation succeeds (for immediate feedback)
  useEffect(() => {
    if (updateProfileMutation.isSuccess && updateProfileMutation.data) {
      console.log('Updating form with mutation data:', updateProfileMutation.data);
      setProfileForm({
        first_name: updateProfileMutation.data.first_name || '',
        last_name: updateProfileMutation.data.last_name || '',
        middle_name: updateProfileMutation.data.middle_name || '',
        email: updateProfileMutation.data.email || '',
        phone: updateProfileMutation.data.phone || '',
        avatar_url: updateProfileMutation.data.avatar_url || '',
      });
    }
  }, [updateProfileMutation.isSuccess, updateProfileMutation.data]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileForm.first_name || !profileForm.last_name) {
      toast.error('First name and last name are required');
      return;
    }

    if (!profileForm.email) {
      toast.error('Email is required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate phone number if provided
    if (profileForm.phone && !/^[\d\s\-\+\(\)]+$/.test(profileForm.phone)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New password and confirm password do not match');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    changePasswordMutation.mutate(passwordForm);
  };

  const isLoading = profileLoading || updateProfileMutation.isPending || changePasswordMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex justify-center">
                  <AvatarUpload
                    currentAvatarUrl={profileForm.avatar_url}
                    onUploadComplete={(url) => setProfileForm({ ...profileForm, avatar_url: url })}
                    size="xl"
                    fallbackText={`${profileForm.first_name?.[0] || ''}${profileForm.last_name?.[0] || ''}`}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      placeholder="Enter your first name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middle_name">Middle Name (Optional)</Label>
                    <Input
                      id="middle_name"
                      value={profileForm.middle_name}
                      onChange={(e) => setProfileForm({ ...profileForm, middle_name: e.target.value })}
                      placeholder="Enter your middle name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Password</h3>
                  <p className="text-sm text-muted-foreground">Change your account password</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordDialog(true)}
                >
                  Change Password
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                </div>
                <Button variant="outline" disabled>
                  Enable 2FA (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
              <CardDescription>Manage your account settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Account Type</h3>
                  <p className="text-sm text-muted-foreground">
                    {profileData?.type === 'student' ? 'Student Account' : 
                     profileData?.type === 'teacher' ? 'Teacher Account' : 
                     profileData?.type === 'super_admin' ? 'Super Admin Account' : 'User Account'}
                  </p>
                </div>
                <Badge variant="outline">
                  {profileData?.type === 'student' ? 'Student' : 
                   profileData?.type === 'teacher' ? 'Teacher' : 
                   profileData?.type === 'super_admin' ? 'Super Admin' : 'User'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Account Status</h3>
                  <p className="text-sm text-muted-foreground">Your account is active and in good standing</p>
                </div>
                <Badge variant="default">Active</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Sign Out</h3>
                  <p className="text-sm text-muted-foreground">Sign out of your account</p>
                </div>
                <Button variant="outline" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password to update your account security.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  placeholder="Enter current password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  placeholder="Enter new password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  placeholder="Confirm new password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
