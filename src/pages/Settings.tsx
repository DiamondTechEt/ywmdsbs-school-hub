import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Users, Shield, Plus, Edit, Trash2, Loader2, Scale, Percent } from 'lucide-react';

export default function Settings() {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();

  // Assessment Types
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [typeFormData, setTypeFormData] = useState({
    code: '',
    name: '',
    description: '',
    weight_default: 10,
  });

  // Grading Scales
  const [isScaleDialogOpen, setIsScaleDialogOpen] = useState(false);
  const [editingScale, setEditingScale] = useState<any>(null);
  const [scaleFormData, setScaleFormData] = useState({
    name: '',
    academic_year_id: '',
  });

  // Scale Items
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [selectedScaleId, setSelectedScaleId] = useState<string>('');
  const [itemFormData, setItemFormData] = useState({
    min_percentage: 0,
    max_percentage: 100,
    letter_grade: '',
    grade_point: 4.0,
    description: '',
  });

  // User Roles Management
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'teacher' | 'student'>('all');
  const [roleFormData, setRoleFormData] = useState({
    email: '',
    role: 'student' as 'super_admin' | 'teacher' | 'student',
  });

  const { data: assessmentTypes } = useQuery({
    queryKey: ['assessment-types'],
    queryFn: async () => {
      const { data } = await supabase
        .from('assessment_types')
        .select('*')
        .order('code');
      return data || [];
    },
  });

  const { data: gradingScales } = useQuery({
    queryKey: ['grading-scales'],
    queryFn: async () => {
      const { data } = await supabase
        .from('grading_scales')
        .select('*, academic_year:academic_years(name)')
        .order('name');
      return data || [];
    },
  });

  const { data: scaleItems } = useQuery({
    queryKey: ['grading-scale-items', selectedScaleId],
    queryFn: async () => {
      if (!selectedScaleId) return [];
      const { data } = await supabase
        .from('grading_scale_items')
        .select('*')
        .eq('grading_scale_id', selectedScaleId)
        .order('min_percentage', { ascending: false });
      return data || [];
    },
    enabled: !!selectedScaleId,
  });

  const { data: userRoles, error: userRolesError, isLoading: userRolesLoading } = useQuery({
    queryKey: ['user-roles-list', roleSearchQuery, roleFilter],
    queryFn: async () => {
      console.log('Fetching user roles...');
      
      // First try a simple query without joins
      let query = supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply role filter
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }
      
      const { data: rolesData, error: rolesError } = await query;
      
      if (rolesError) {
        console.log('User roles error:', rolesError);
        throw rolesError;
      }
      
      console.log('User roles data (no join):', rolesData);
      
      // If we have roles, try to get profile info separately
      if (rolesData && rolesData.length > 0) {
        const userIds = rolesData.map(role => role.user_id).filter(Boolean);
        
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', userIds);
          
          if (profilesError) {
            console.log('Profiles error:', profilesError);
          } else {
            console.log('Profiles data:', profilesData);
            
            // Merge the data
            let mergedData = rolesData.map(role => ({
              ...role,
              profiles: profilesData?.find(profile => profile.id === role.user_id)
            }));
            
            // Apply search filter
            if (roleSearchQuery) {
              mergedData = mergedData.filter(role => 
                role.profiles?.full_name?.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
                role.profiles?.email?.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
                role.role?.toLowerCase().includes(roleSearchQuery.toLowerCase())
              );
            }
            
            console.log('Filtered merged data:', mergedData);
            return mergedData;
          }
        }
      }
      
      return rolesData || [];
    },
  });

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false });
      return data || [];
    },
  });

  // Assessment Types Mutations
  const createType = useMutation({
    mutationFn: async (data: typeof typeFormData) => {
      const { error } = await supabase.from('assessment_types').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Assessment type created');
      setIsTypeDialogOpen(false);
      setTypeFormData({ code: '', name: '', description: '', weight_default: 10 });
      queryClient.invalidateQueries({ queryKey: ['assessment-types'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create assessment type');
    },
  });

  const updateType = useMutation({
    mutationFn: async (data: { id: string; updates: typeof typeFormData }) => {
      const { error } = await supabase
        .from('assessment_types')
        .update(data.updates)
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Assessment type updated');
      setIsTypeDialogOpen(false);
      setEditingType(null);
      queryClient.invalidateQueries({ queryKey: ['assessment-types'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update assessment type');
    },
  });

  const deleteType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assessment_types')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Assessment type deactivated');
      queryClient.invalidateQueries({ queryKey: ['assessment-types'] });
    },
  });

  // Grading Scale Mutations
  const createScale = useMutation({
    mutationFn: async (data: typeof scaleFormData) => {
      const { error } = await supabase.from('grading_scales').insert({
        name: data.name,
        academic_year_id: data.academic_year_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Grading scale created');
      setIsScaleDialogOpen(false);
      setScaleFormData({ name: '', academic_year_id: '' });
      queryClient.invalidateQueries({ queryKey: ['grading-scales'] });
    },
  });

  // Scale Item Mutations
  const createScaleItem = useMutation({
    mutationFn: async (data: typeof itemFormData & { grading_scale_id: string }) => {
      const { error } = await supabase.from('grading_scale_items').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Grade scale item added');
      setIsItemDialogOpen(false);
      setItemFormData({ min_percentage: 0, max_percentage: 100, letter_grade: '', grade_point: 4.0, description: '' });
      queryClient.invalidateQueries({ queryKey: ['grading-scale-items'] });
    },
  });

  // User Role Mutations
  const assignRole = useMutation({
    mutationFn: async (data: typeof roleFormData) => {
      // Find user by email
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', data.email)
        .single();

      if (!profiles) throw new Error('User not found');

      // Check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', profiles.id)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: data.role })
          .eq('user_id', profiles.id);
        if (error) throw error;
      } else {
        // Create new role
        const { error } = await supabase.from('user_roles').insert({
          user_id: profiles.id,
          role: data.role,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Role assigned successfully');
      setIsRoleDialogOpen(false);
      setRoleFormData({ email: '', role: 'student' });
      queryClient.invalidateQueries({ queryKey: ['user-roles-list'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign role');
    },
  });

  const deleteUserRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Role removed');
      queryClient.invalidateQueries({ queryKey: ['user-roles-list'] });
    },
  });

  if (role !== 'super_admin') {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Access denied. Super Admin only.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">System configuration and management</p>
      </div>

      <Tabs defaultValue="assessment-types" className="space-y-6">
        <TabsList>
          <TabsTrigger value="assessment-types">Assessment Types</TabsTrigger>
          <TabsTrigger value="grading-scales">Grading Scales</TabsTrigger>
          <TabsTrigger value="user-roles">User Roles</TabsTrigger>
        </TabsList>

        {/* Assessment Types Tab */}
        <TabsContent value="assessment-types">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Assessment Types
                </CardTitle>
                <CardDescription>Configure assessment types and default weights</CardDescription>
              </div>
              <Dialog open={isTypeDialogOpen} onOpenChange={(open) => {
                setIsTypeDialogOpen(open);
                if (!open) {
                  setEditingType(null);
                  setTypeFormData({ code: '', name: '', description: '', weight_default: 10 });
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Type
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (editingType) {
                      updateType.mutate({ id: editingType.id, updates: typeFormData });
                    } else {
                      createType.mutate(typeFormData);
                    }
                  }}>
                    <DialogHeader>
                      <DialogTitle>{editingType ? 'Edit' : 'Add'} Assessment Type</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Code</Label>
                          <Input
                            value={typeFormData.code}
                            onChange={(e) => setTypeFormData({ ...typeFormData, code: e.target.value })}
                            placeholder="e.g., QUIZ"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={typeFormData.name}
                            onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
                            placeholder="e.g., Quiz"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={typeFormData.description}
                          onChange={(e) => setTypeFormData({ ...typeFormData, description: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Default Weight (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={typeFormData.weight_default}
                          onChange={(e) => setTypeFormData({ ...typeFormData, weight_default: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createType.isPending || updateType.isPending}>
                        {(createType.isPending || updateType.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Default Weight</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessmentTypes?.map((type: any) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-mono">{type.code}</TableCell>
                      <TableCell>{type.name}</TableCell>
                      <TableCell>{type.weight_default}%</TableCell>
                      <TableCell>
                        <Badge variant={type.is_active ? 'default' : 'secondary'}>
                          {type.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingType(type);
                            setTypeFormData(type);
                            setIsTypeDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteType.mutate(type.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grading Scales Tab */}
        <TabsContent value="grading-scales">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Grading Scales
                  </CardTitle>
                  <CardDescription>Configure grading scales for different contexts</CardDescription>
                </div>
                <Dialog open={isScaleDialogOpen} onOpenChange={setIsScaleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Scale
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      createScale.mutate(scaleFormData);
                    }}>
                      <DialogHeader>
                        <DialogTitle>Add Grading Scale</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={scaleFormData.name}
                            onChange={(e) => setScaleFormData({ ...scaleFormData, name: e.target.value })}
                            placeholder="e.g., Default Scale"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Academic Year (Optional)</Label>
                          <Select
                            value={scaleFormData.academic_year_id}
                            onValueChange={(value) => setScaleFormData({ ...scaleFormData, academic_year_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Global (all years)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="global">Global</SelectItem>
                              {academicYears?.map((year: any) => (
                                <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={createScale.isPending}>
                          {createScale.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {gradingScales?.map((scale: any) => (
                    <div
                      key={scale.id}
                      className={`flex cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-muted/50 ${selectedScaleId === scale.id ? 'border-primary bg-muted/50' : ''}`}
                      onClick={() => setSelectedScaleId(scale.id)}
                    >
                      <div>
                        <p className="font-medium">{scale.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {scale.academic_year?.name || 'Global'}
                        </p>
                      </div>
                      <Badge variant={scale.is_active ? 'default' : 'secondary'}>
                        {scale.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Scale Items
                  </CardTitle>
                  <CardDescription>
                    {selectedScaleId ? 'Letter grades and thresholds' : 'Select a scale to view items'}
                  </CardDescription>
                </div>
                {selectedScaleId && (
                  <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        createScaleItem.mutate({ ...itemFormData, grading_scale_id: selectedScaleId });
                      }}>
                        <DialogHeader>
                          <DialogTitle>Add Scale Item</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Min %</Label>
                              <Input
                                type="number"
                                value={itemFormData.min_percentage}
                                onChange={(e) => setItemFormData({ ...itemFormData, min_percentage: parseFloat(e.target.value) })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Max %</Label>
                              <Input
                                type="number"
                                value={itemFormData.max_percentage}
                                onChange={(e) => setItemFormData({ ...itemFormData, max_percentage: parseFloat(e.target.value) })}
                              />
                            </div>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Letter Grade</Label>
                              <Input
                                value={itemFormData.letter_grade}
                                onChange={(e) => setItemFormData({ ...itemFormData, letter_grade: e.target.value })}
                                placeholder="e.g., A+"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Grade Point</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={itemFormData.grade_point}
                                onChange={(e) => setItemFormData({ ...itemFormData, grade_point: parseFloat(e.target.value) })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                              value={itemFormData.description}
                              onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                              placeholder="e.g., Excellent"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={createScaleItem.isPending}>
                            {createScaleItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {selectedScaleId ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Range</TableHead>
                        <TableHead>Letter</TableHead>
                        <TableHead>GPA</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scaleItems?.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.min_percentage}% - {item.max_percentage}%</TableCell>
                          <TableCell className="font-bold">{item.letter_grade}</TableCell>
                          <TableCell>{item.grade_point}</TableCell>
                          <TableCell>{item.description || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex h-48 items-center justify-center text-muted-foreground">
                    Select a grading scale to view its items
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Roles Tab */}
        <TabsContent value="user-roles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  User Roles
                </CardTitle>
                <CardDescription>Manage user role assignments</CardDescription>
              </div>
              <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Assign Role
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    assignRole.mutate(roleFormData);
                  }}>
                    <DialogHeader>
                      <DialogTitle>Assign User Role</DialogTitle>
                      <DialogDescription>
                        Assign a role to a user by their email address
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="user@example.com"
                          value={roleFormData.email}
                          onChange={(e) => setRoleFormData({ ...roleFormData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select
                          value={roleFormData.role}
                          onValueChange={(value: 'super_admin' | 'teacher' | 'student') => setRoleFormData({ ...roleFormData, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={assignRole.isPending}>
                        {assignRole.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Assign Role
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Controls */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search by name, email, or role..."
                    value={roleSearchQuery}
                    onChange={(e) => setRoleSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="w-48">
                  <Select value={roleFilter} onValueChange={(value: 'all' | 'super_admin' | 'teacher' | 'student') => setRoleFilter(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results count */}
              <div className="text-sm text-muted-foreground mb-4">
                {userRoles && `Showing ${userRoles.length} role${userRoles.length !== 1 ? 's' : ''}`}
              </div>

              {/* Roles Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRolesLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        Loading roles...
                      </TableCell>
                    </TableRow>
                  ) : userRolesError ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-red-500">
                        Error loading roles: {userRolesError.message}
                      </TableCell>
                    </TableRow>
                  ) : !userRoles || userRoles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No roles found
                      </TableCell>
                    </TableRow>
                  ) : (
                    userRoles.map((roleEntry: any) => (
                      <TableRow key={roleEntry.id}>
                        <TableCell className="font-medium">
                          {roleEntry.profiles?.full_name || 'Unknown'}
                        </TableCell>
                        <TableCell>{roleEntry.profiles?.email || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={
                            roleEntry.role === 'super_admin' ? 'default' :
                            roleEntry.role === 'teacher' ? 'secondary' : 'outline'
                          }>
                            {roleEntry.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(roleEntry.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Remove this role assignment?')) {
                                deleteUserRole.mutate(roleEntry.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
