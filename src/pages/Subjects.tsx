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
import { Plus, Search, Edit, Trash2, BookOpen, Loader2 } from 'lucide-react';

export default function Subjects() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    credit: 1,
    grade_level: null as number | null,
  });

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['subjects', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('subjects')
        .select('*')
        .order('code');

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,code.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const createSubject = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('subjects').insert({
        code: data.code,
        name: data.name,
        credit: data.credit,
        grade_level: data.grade_level,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Subject created successfully');
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create subject');
    },
  });

  const updateSubject = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from('subjects')
        .update({
          code: data.updates.code,
          name: data.updates.name,
          credit: data.updates.credit,
          grade_level: data.updates.grade_level,
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Subject updated successfully');
      setIsDialogOpen(false);
      setEditingSubject(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update subject');
    },
  });

  const deleteSubject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subjects')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Subject deactivated');
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete subject');
    },
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      credit: 1,
      grade_level: null,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name) {
      toast.error('Please fill in required fields');
      return;
    }

    if (editingSubject) {
      updateSubject.mutate({ id: editingSubject.id, updates: formData });
    } else {
      createSubject.mutate(formData);
    }
  };

  const openEditDialog = (subject: any) => {
    setEditingSubject(subject);
    setFormData({
      code: subject.code,
      name: subject.name,
      credit: subject.credit,
      grade_level: subject.grade_level,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subjects</h1>
          <p className="text-muted-foreground">Manage curriculum subjects and credits</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingSubject(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                </DialogTitle>
                <DialogDescription>
                  {editingSubject ? 'Update subject information' : 'Create a new curriculum subject'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="code">Subject Code</Label>
                    <Input
                      id="code"
                      placeholder="e.g., MATH10"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Subject Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Mathematics"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="credit">Credit Hours</Label>
                    <Input
                      id="credit"
                      type="number"
                      min="0.5"
                      max="10"
                      step="0.5"
                      value={formData.credit}
                      onChange={(e) => setFormData({ ...formData, credit: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Grade Level (Optional)</Label>
                    <Select
                      value={formData.grade_level?.toString() || ''}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        grade_level: value ? parseInt(value) : null 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All grades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Grades</SelectItem>
                        {[9, 10, 11, 12].map((grade) => (
                          <SelectItem key={grade} value={grade.toString()}>
                            Grade {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={createSubject.isPending || updateSubject.isPending}>
                  {(createSubject.isPending || updateSubject.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingSubject ? 'Update Subject' : 'Create Subject'}
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
              placeholder="Search subjects..."
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
            <BookOpen className="h-5 w-5" />
            Subject Records
          </CardTitle>
          <CardDescription>
            {subjects?.length || 0} subjects found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : subjects && subjects.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Credit</TableHead>
                    <TableHead>Grade Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject: any) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-mono">{subject.code}</TableCell>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell>{subject.credit}</TableCell>
                      <TableCell>
                        {subject.grade_level ? (
                          <Badge variant="outline">Grade {subject.grade_level}</Badge>
                        ) : (
                          <span className="text-muted-foreground">All</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={subject.is_active ? 'default' : 'secondary'}>
                          {subject.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(subject)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Are you sure you want to deactivate this subject?')) {
                                deleteSubject.mutate(subject.id);
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
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">No subjects found</h3>
              <p className="text-muted-foreground">
                Get started by adding your first subject
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
