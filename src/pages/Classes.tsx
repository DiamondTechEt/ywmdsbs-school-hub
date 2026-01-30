import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, School, Loader2 } from 'lucide-react';
import { logClassAction } from '@/lib/audit-logger';

export default function Classes() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    grade_level: 9,
    academic_year_id: '',
    homeroom_teacher_id: '',
  });

  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('classes')
        .select(`
          *,
          academic_year:academic_years(name),
          homeroom_teacher:teachers(first_name, last_name)
        `)
        .order('grade_level')
        .order('name');

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
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

  const { data: teachers } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('teachers')
        .select('id, first_name, last_name')
        .eq('is_active', true)
        .order('last_name');
      return data || [];
    },
  });

  const createClass = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase.from('classes').insert({
        name: data.name,
        grade_level: data.grade_level,
        academic_year_id: data.academic_year_id,
        homeroom_teacher_id: data.homeroom_teacher_id || null,
      }).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      toast.success('Class created successfully');
      // Log class creation
      if (data?.id) {
        logClassAction('CREATE', data.id, data.name, {
          grade_level: data.grade_level,
          academic_year_id: data.academic_year_id,
          homeroom_teacher_id: data.homeroom_teacher_id
        });
      }
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create class');
    },
  });

  const updateClass = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from('classes')
        .update({
          name: data.updates.name,
          grade_level: data.updates.grade_level,
          academic_year_id: data.updates.academic_year_id,
          homeroom_teacher_id: data.updates.homeroom_teacher_id || null,
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success('Class updated successfully');
      // Log class update
      logClassAction('UPDATE', variables.id, variables.updates.name, {
        updates: variables.updates
      });
      setIsDialogOpen(false);
      setEditingClass(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update class');
    },
  });

  const deleteClass = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success('Class deleted');
      // Log class deletion
      logClassAction('DELETE', variables, undefined, {
        action: 'deleted',
        timestamp: new Date().toISOString()
      });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete class');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      grade_level: 9,
      academic_year_id: '',
      homeroom_teacher_id: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.academic_year_id) {
      toast.error('Please fill in required fields');
      return;
    }

    if (editingClass) {
      updateClass.mutate({ id: editingClass.id, updates: formData });
    } else {
      createClass.mutate(formData);
    }
  };

  const openEditDialog = (cls: any) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      grade_level: cls.grade_level,
      academic_year_id: cls.academic_year_id,
      homeroom_teacher_id: cls.homeroom_teacher_id || '',
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Classes</h1>
          <p className="text-muted-foreground">Manage class sections and homeroom assignments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingClass(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingClass ? 'Edit Class' : 'Add New Class'}
                </DialogTitle>
                <DialogDescription>
                  {editingClass ? 'Update class information' : 'Create a new class section'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Class Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., 10A"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Grade Level</Label>
                    <Select
                      value={formData.grade_level.toString()}
                      onValueChange={(value) => setFormData({ ...formData, grade_level: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[9, 10, 11, 12].map((grade) => (
                          <SelectItem key={grade} value={grade.toString()}>
                            Grade {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Select
                    value={formData.academic_year_id}
                    onValueChange={(value) => setFormData({ ...formData, academic_year_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears?.map((year: any) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Homeroom Teacher (Optional)</Label>
                  <Select
                    value={formData.homeroom_teacher_id}
                    onValueChange={(value) => setFormData({ ...formData, homeroom_teacher_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select homeroom teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers?.map((teacher: any) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.first_name} {teacher.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={createClass.isPending || updateClass.isPending}>
                  {(createClass.isPending || updateClass.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingClass ? 'Update Class' : 'Create Class'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            Class Records
          </CardTitle>
          <CardDescription>
            {classes?.length || 0} classes found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : classes && classes.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Grade Level</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Homeroom Teacher</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((cls: any) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Grade {cls.grade_level}</Badge>
                      </TableCell>
                      <TableCell>{cls.academic_year?.name || '-'}</TableCell>
                      <TableCell>
                        {cls.homeroom_teacher ? (
                          `${cls.homeroom_teacher.first_name} ${cls.homeroom_teacher.last_name}`
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(cls)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this class?')) {
                                deleteClass.mutate(cls.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <School className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">No classes found</h3>
              <p className="text-muted-foreground">
                Get started by adding your first class
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
