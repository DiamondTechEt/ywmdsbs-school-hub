import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Lock, Unlock, Calendar, Loader2 } from 'lucide-react';

interface AcademicYear {
  id: string;
  name: string;
  is_active: boolean;
}

interface Semester {
  id: string;
  name: string;
  academic_year_id: string;
  academic_year_name: string;
  start_date: string;
  end_date: string;
  is_locked: boolean;
}

export default function Semesters() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    academic_year_id: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load academic years
      const { data: yearsData, error: yearsError } = await supabase
        .from('academic_years')
        .select('id, name, is_active')
        .order('created_at', { ascending: false });

      if (yearsError) throw yearsError;
      setAcademicYears(yearsData || []);

      // Load semesters with academic year info
      const { data: semestersData, error: semestersError } = await supabase
        .from('semesters')
        .select(`
          id,
          name,
          academic_year_id,
          start_date,
          end_date,
          is_locked,
          academic_years(name)
        `)
        .order('start_date', { ascending: false });

      if (semestersError) throw semestersError;

      const formattedSemesters = (semestersData || []).map(semester => ({
        id: semester.id,
        name: semester.name,
        academic_year_id: semester.academic_year_id,
        academic_year_name: semester.academic_years?.name || 'Unknown',
        start_date: semester.start_date,
        end_date: semester.end_date,
        is_locked: semester.is_locked
      }));

      setSemesters(formattedSemesters);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.academic_year_id || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingSemester) {
        const { error } = await supabase
          .from('semesters')
          .update({
            name: formData.name,
            academic_year_id: formData.academic_year_id,
            start_date: formData.start_date,
            end_date: formData.end_date
          })
          .eq('id', editingSemester.id);

        if (error) throw error;
        toast.success('Semester updated successfully');
      } else {
        const { error } = await supabase
          .from('semesters')
          .insert({
            name: formData.name,
            academic_year_id: formData.academic_year_id,
            start_date: formData.start_date,
            end_date: formData.end_date
          });

        if (error) throw error;
        toast.success('Semester created successfully');
      }

      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving semester:', error);
      toast.error(error.message || 'Failed to save semester');
    }
  };

  const handleEdit = (semester: Semester) => {
    setEditingSemester(semester);
    setFormData({
      name: semester.name,
      academic_year_id: semester.academic_year_id,
      start_date: semester.start_date,
      end_date: semester.end_date
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this semester?')) return;

    try {
      const { error } = await supabase
        .from('semesters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Semester deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error deleting semester:', error);
      toast.error(error.message || 'Failed to delete semester');
    }
  };

  const handleToggleLock = async (semester: Semester) => {
    try {
      const { error } = await supabase
        .from('semesters')
        .update({ is_locked: !semester.is_locked })
        .eq('id', semester.id);

      if (error) throw error;
      toast.success(semester.is_locked ? 'Semester unlocked' : 'Semester locked');
      loadData();
    } catch (error: any) {
      console.error('Error toggling lock:', error);
      toast.error(error.message || 'Failed to update semester');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', academic_year_id: '', start_date: '', end_date: '' });
    setEditingSemester(null);
    setIsDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Semesters
          </h1>
          <p className="text-muted-foreground">Manage academic semesters within each year</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Semester
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSemester ? 'Edit Semester' : 'Add Semester'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Semester Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Semester 1"
                />
              </div>
              <div>
                <Label htmlFor="academic_year">Academic Year</Label>
                <Select
                  value={formData.academic_year_id}
                  onValueChange={(value) => setFormData({ ...formData, academic_year_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name} {year.is_active && '(Active)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit}>
                  {editingSemester ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Semesters ({semesters.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {semesters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No semesters found. Create your first semester.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {semesters.map((semester) => (
                  <TableRow key={semester.id}>
                    <TableCell className="font-medium">{semester.name}</TableCell>
                    <TableCell>{semester.academic_year_name}</TableCell>
                    <TableCell>{new Date(semester.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(semester.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={semester.is_locked ? 'destructive' : 'default'}>
                        {semester.is_locked ? 'Locked' : 'Open'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleLock(semester)}
                          title={semester.is_locked ? 'Unlock semester' : 'Lock semester'}
                        >
                          {semester.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(semester)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(semester.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
