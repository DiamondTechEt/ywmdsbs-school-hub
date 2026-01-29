import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Calendar, Plus } from 'lucide-react';

interface TeacherClass {
  id: string;
  class_id: string;
  class_name: string;
  subject_id?: string;
  subject_name?: string;
  role: string;
}

interface AssessmentType {
  id: string;
  code: string;
  name: string;
  weight_default: number;
}

interface CreateAssessmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedClass?: TeacherClass;
}

export function CreateAssessmentDialog({ 
  isOpen, 
  onClose, 
  onSuccess, 
  selectedClass 
}: CreateAssessmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    assessment_type_id: '',
    max_score: 100,
    weight: 10,
    assessment_date: new Date().toISOString().split('T')[0],
    class_id: selectedClass?.class_id || ''
  });

  React.useEffect(() => {
    if (isOpen) {
      loadAssessmentTypes();
      loadTeacherClasses();
      if (selectedClass) {
        setFormData(prev => ({ ...prev, class_id: selectedClass.class_id }));
      }
    }
  }, [isOpen, selectedClass]);

  const loadAssessmentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAssessmentTypes(data || []);
    } catch (error) {
      console.error('Error loading assessment types:', error);
      toast({
        title: "Error",
        description: "Failed to load assessment types",
        variant: "destructive"
      });
    }
  };

  const loadTeacherClasses = async () => {
    try {
      // Get current teacher ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherError) throw teacherError;

      // Load teacher's classes
      const { data: classesData, error: classesError } = await supabase
        .from('class_teachers')
        .select(`
          *,
          classes(id, name),
          subjects(id, name)
        `)
        .eq('teacher_id', teacherData.id)
        .eq('is_active', true);

      if (classesError) throw classesError;

      const classes = (classesData || [])
        .filter(item => item.role === 'subject_teacher') // Only subject teachers can create assessments
        .map(item => ({
          id: item.id,
          class_id: item.class_id,
          class_name: item.classes?.name || 'Unknown Class',
          subject_id: item.subject_id,
          subject_name: item.subjects?.name,
          role: item.role
        }));

      setTeacherClasses(classes);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast({
        title: "Error",
        description: "Failed to load classes",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.assessment_type_id || !formData.class_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Get current teacher ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherError) throw teacherError;

      // Find class subject assignment
      const selectedClassData = teacherClasses.find(c => c.class_id === formData.class_id);
      if (!selectedClassData) throw new Error('Class not found');

      // Create or find class_subject_assignment
      let csaId;
      
      // Try to find existing assignment (with or without subject)
      const { data: existingCSA, error: existingCSAError } = await supabase
        .from('class_subject_assignments')
        .select('id')
        .eq('class_id', selectedClassData.class_id)
        .eq('teacher_id', teacherData.id)
        .single();

      if (existingCSAError && existingCSAError.code === 'PGRST116') {
        // Create new assignment (subject_id can be null)
        const { data: newCSA, error: newCSAError } = await supabase
          .from('class_subject_assignments')
          .insert({
            class_id: selectedClassData.class_id,
            teacher_id: teacherData.id,
            subject_id: selectedClassData.subject_id || null,
            is_active: true
          })
          .select('id')
          .single();

        if (newCSAError) throw newCSAError;
        csaId = newCSA.id;
      } else if (existingCSAError) {
        throw existingCSAError;
      } else {
        csaId = existingCSA.id;
      }

      // Create assessment
      const { error: createError } = await supabase
        .from('assessments')
        .insert({
          title: formData.title,
          assessment_type_id: formData.assessment_type_id,
          class_subject_assignment_id: csaId,
          max_score: formData.max_score,
          weight: formData.weight,
          assessment_date: formData.assessment_date,
          semester_id: (await supabase.from('semesters').select('id').order('start_date', { ascending: false }).limit(1).single()).data?.id,
          created_by_teacher_id: teacherData.id,
          is_published: false
        });

      if (createError) throw createError;

      toast({
        title: "Success",
        description: "Assessment created successfully! You can now add grades for this assessment."
      });

      // Reset form
      setFormData({
        title: '',
        assessment_type_id: '',
        max_score: 100,
        weight: 10,
        assessment_date: new Date().toISOString().split('T')[0],
        class_id: ''
      });

      onClose();
      onSuccess();

    } catch (error) {
      console.error('Error creating assessment:', error);
      console.error('Form data:', formData);
      console.error('Teacher classes:', teacherClasses);
      console.error('Selected class data:', teacherClasses.find(c => c.class_id === formData.class_id));
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create assessment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentTypeChange = (value: string) => {
    const selectedType = assessmentTypes.find(t => t.id === value);
    setFormData(prev => ({ 
      ...prev, 
      assessment_type_id: value,
      weight: selectedType?.weight_default || 10
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Assessment
          </DialogTitle>
          <DialogDescription>
            Create a new assessment for your class. You can add grades after creating the assessment.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Assessment Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Midterm Exam, Quiz 1, Project"
              required
            />
          </div>

          <div>
            <Label htmlFor="class">Class *</Label>
            <Select
              value={formData.class_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, class_id: value }))}
              disabled={!!selectedClass}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {teacherClasses.map(cls => (
                  <SelectItem key={cls.id} value={cls.class_id}>
                    {cls.class_name} {cls.subject_name && `(${cls.subject_name})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type">Assessment Type *</Label>
            <Select
              value={formData.assessment_type_id}
              onValueChange={handleAssessmentTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assessment type" />
              </SelectTrigger>
              <SelectContent>
                {assessmentTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} (Default weight: {type.weight_default}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_score">Max Score *</Label>
              <Input
                id="max_score"
                type="number"
                value={formData.max_score}
                onChange={(e) => setFormData(prev => ({ ...prev, max_score: Number(e.target.value) }))}
                min="1"
                required
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight (%) *</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                min="0"
                max="100"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="date">Assessment Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.assessment_date}
              onChange={(e) => setFormData(prev => ({ ...prev, assessment_date: e.target.value }))}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Assessment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
