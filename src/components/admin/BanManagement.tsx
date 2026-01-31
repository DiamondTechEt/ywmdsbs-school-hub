import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Search, Ban, Unlock, AlertTriangle, User, Shield } from 'lucide-react';

interface User {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  student_id_code?: string;
  teacher_code?: string;
  is_banned: boolean;
  banned_at?: string;
  banned_by?: string;
  ban_reason?: string;
  ban_notes?: string;
  role: 'student' | 'teacher';
  banned_by_teacher?: {
    first_name: string;
    last_name: string;
  };
}

interface BanManagementProps {
  userRole: 'super_admin' | 'teacher';
}

export function BanManagement({ userRole }: BanManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'teacher'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'banned' | 'active'>('all');
  
  // Dialog states
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [isUnbanDialogOpen, setIsUnbanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [banReason, setBanReason] = useState('');
  const [banNotes, setBanNotes] = useState('');

  useEffect(() => {
    loadUsers();
  }, [filterRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      let query;
      if (filterRole === 'student' || filterRole === 'all') {
        query = supabase
          .from('students')
          .select(`
            id,
            user_id,
            first_name,
            last_name,
            student_id_code,
            is_active,
            created_at
          `);
      } else if (filterRole === 'teacher') {
        query = supabase
          .from('teachers')
          .select(`
            id,
            user_id,
            first_name,
            last_name,
            teacher_code,
            is_active,
            created_at
          `);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get emails for all users
      const userIds = (data || []).map(user => user.user_id).filter(Boolean);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const emailMap = new Map(
        (profilesData || []).map(profile => [profile.id, profile.email])
      );

      const transformedUsers = (data || []).map((user: any) => ({
        id: user.id,
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: emailMap.get(user.user_id) || 'No email',
        student_id_code: user.student_id_code,
        teacher_code: user.teacher_code,
        is_banned: false, // Default to false since ban fields may not exist
        banned_at: null,
        banned_by: null,
        ban_reason: null,
        ban_notes: null,
        role: filterRole === 'teacher' || (filterRole === 'all' && user.teacher_code) ? 'teacher' : 'student',
        banned_by_teacher: null
      }));

      if (filterRole === 'all') {
        // Load both students and teachers
        const { data: teachersData, error: teachersError } = await supabase
          .from('teachers')
          .select(`
            id,
            user_id,
            first_name,
            last_name,
            teacher_code,
            is_active,
            created_at
          `);

        if (!teachersError) {
          // Get emails for teachers
          const teacherUserIds = (teachersData || []).map(teacher => teacher.user_id).filter(Boolean);
          const { data: teacherProfilesData } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', teacherUserIds);

          const teacherEmailMap = new Map(
            (teacherProfilesData || []).map(profile => [profile.id, profile.email])
          );

          const transformedTeachers = (teachersData || []).map((teacher: any) => ({
            id: teacher.id,
            user_id: teacher.user_id,
            first_name: teacher.first_name,
            last_name: teacher.last_name,
            email: teacherEmailMap.get(teacher.user_id) || 'No email',
            teacher_code: teacher.teacher_code,
            is_banned: false, // Teachers can't be banned in current schema
            banned_at: null,
            banned_by: null,
            ban_reason: null,
            ban_notes: null,
            role: 'teacher',
            banned_by_teacher: null
          }));
          setUsers([...transformedUsers, ...transformedTeachers]);
        } else {
          setUsers(transformedUsers);
        }
      } else {
        setUsers(transformedUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const openBanDialog = (user: User) => {
    setSelectedUser(user);
    setBanReason('');
    setBanNotes('');
    setIsBanDialogOpen(true);
  };

  const openUnbanDialog = (user: User) => {
    setSelectedUser(user);
    setIsUnbanDialogOpen(true);
  };

  const closeDialogs = () => {
    setIsBanDialogOpen(false);
    setIsUnbanDialogOpen(false);
    setSelectedUser(null);
    setBanReason('');
    setBanNotes('');
  };

  const banUser = async () => {
    try {
      if (!selectedUser) return;

      // Only students can be banned
      if (selectedUser.role === 'teacher') {
        toast.error('Teachers cannot be banned through this system');
        return;
      }

      if (!banReason.trim()) {
        toast.error('Please provide a ban reason');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get current teacher/admin ID
      const { data: adminData } = await supabase
        .from(userRole === 'teacher' ? 'teachers' : 'teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const tableName = selectedUser.student_id_code ? 'students' : 'teachers';
      
      const { error } = await supabase
        .from(tableName)
        .update({
          is_banned: true,
          banned_at: new Date().toISOString(),
          banned_by: adminData?.id,
          ban_reason: banReason.trim(),
          ban_notes: banNotes.trim() || null
        } as any)
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      toast.success(`${selectedUser.role === 'student' ? 'Student' : 'Teacher'} has been banned successfully`);
      closeDialogs();
      loadUsers();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    }
  };

  const unbanUser = async () => {
    try {
      if (!selectedUser) return;

      // Only students can be unbanned
      if (selectedUser.role === 'teacher') {
        toast.error('Teachers cannot be unbanned through this system');
        return;
      }

      const tableName = selectedUser.student_id_code ? 'students' : 'teachers';
      
      const { error } = await supabase
        .from(tableName)
        .update({
          is_banned: false,
          banned_at: null,
          banned_by: null,
          ban_reason: null,
          ban_notes: null
        } as any)
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      toast.success(`${selectedUser.role === 'student' ? 'Student' : 'Teacher'} has been unbanned successfully`);
      closeDialogs();
      loadUsers();
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error('Failed to unban user');
    }
  };

  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.student_id_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.teacher_code?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'banned' && user.is_banned) ||
        (filterStatus === 'active' && !user.is_banned);

      return matchesSearch && matchesStatus;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Shield className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Ban Management
        </h1>
        <p className="text-muted-foreground">
          Manage user bans and suspensions for students and teachers
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterRole} onValueChange={(value: any) => setFilterRole(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({getFilteredUsers().length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ban Details</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredUsers().map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">
                          {user.first_name} {user.last_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'student' ? 'secondary' : 'default'}>
                        {user.role === 'student' ? 'Student' : 'Teacher'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {user.student_id_code || user.teacher_code}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_banned ? 'destructive' : 'default'}>
                        {user.is_banned ? 'Banned' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.is_banned && (
                        <div className="space-y-1">
                          {user.ban_reason && (
                            <div className="text-red-600">{user.ban_reason}</div>
                          )}
                          {user.banned_at && (
                            <div className="text-gray-500">
                              {new Date(user.banned_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {user.is_banned ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openUnbanDialog(user)}
                          >
                            <Unlock className="h-4 w-4 mr-2" />
                            Unban
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openBanDialog(user)}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Ban
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Ban Dialog */}
      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="h-5 w-5" />
              Ban User
            </DialogTitle>
            <DialogDescription>
              Ban {selectedUser?.first_name} {selectedUser?.last_name} from accessing the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ban Reason *</Label>
              <Select value={banReason} onValueChange={setBanReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Academic misconduct">Academic misconduct</SelectItem>
                  <SelectItem value="Code of conduct violation">Code of conduct violation</SelectItem>
                  <SelectItem value="Security breach">Security breach</SelectItem>
                  <SelectItem value="Inappropriate behavior">Inappropriate behavior</SelectItem>
                  <SelectItem value="Policy violation">Policy violation</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={banNotes}
                onChange={(e) => setBanNotes(e.target.value)}
                placeholder="Provide any additional details about this ban..."
                rows={3}
              />
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  This action will prevent the user from accessing the system. They will see a full-screen warning explaining the ban.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDialogs}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={banUser}>
                Confirm Ban
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unban Dialog */}
      <Dialog open={isUnbanDialogOpen} onOpenChange={setIsUnbanDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Unlock className="h-5 w-5" />
              Unban User
            </DialogTitle>
            <DialogDescription>
              Restore access for {selectedUser?.first_name} {selectedUser?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">
                This action will immediately restore the user's access to the system.
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDialogs}>
                Cancel
              </Button>
              <Button onClick={unbanUser}>
                Confirm Unban
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
