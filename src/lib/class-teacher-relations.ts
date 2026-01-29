import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ClassTeacher = Database['public']['Tables']['class_teachers']['Row'];
type ClassTeacherInsert = Database['public']['Tables']['class_teachers']['Insert'];

export interface ClassWithTeachers {
  id: string;
  name: string;
  grade_level: number;
  teachers: Array<{
    teacher_id: string;
    teacher_code: string;
    teacher_name: string;
    subject_id?: string;
    subject_name?: string;
    subject_code?: string;
    role: string;
    is_active: boolean;
  }>;
}

export interface TeacherWithClasses {
  id: string;
  teacher_code: string;
  first_name: string;
  last_name: string;
  classes: Array<{
    class_id: string;
    class_name: string;
    grade_level: number;
    subject_id?: string;
    subject_name?: string;
    subject_code?: string;
    role: string;
    is_active: boolean;
  }>;
}

export class ClassTeacherRelations {
  // Assign a teacher to a class with a specific role and optional subject
  static async assignTeacherToClass(
    classId: string,
    teacherId: string,
    subjectId?: string,
    role: 'homeroom' | 'subject_teacher' | 'assistant' = 'subject_teacher'
  ): Promise<{ data: string | null; error: any }> {
    const { data, error } = await supabase.rpc('assign_teacher_to_class', {
      _class_id: classId,
      _teacher_id: teacherId,
      _subject_id: subjectId || null,
      _role: role
    });

    return { data, error };
  }

  // Remove a teacher from a class
  static async removeTeacherFromClass(
    classId: string,
    teacherId: string,
    subjectId?: string,
    role?: string
  ): Promise<{ data: boolean | null; error: any }> {
    const { data, error } = await supabase.rpc('remove_teacher_from_class', {
      _class_id: classId,
      _teacher_id: teacherId,
      _subject_id: subjectId || null,
      _role: role || null
    });

    return { data, error };
  }

  // Get all teachers for a specific class
  static async getClassTeachers(classId: string): Promise<{ data: ClassWithTeachers['teachers'] | null; error: any }> {
    const { data, error } = await supabase.rpc('get_class_teachers', {
      _class_id: classId
    });

    return { data: data as unknown as ClassWithTeachers['teachers'] | null, error };
  }

  // Get all classes for a specific teacher
  static async getTeacherClasses(teacherId: string): Promise<{ data: TeacherWithClasses['classes'] | null; error: any }> {
    const { data, error } = await supabase.rpc('get_teacher_classes', {
      _teacher_id: teacherId
    });

    return { data: data as unknown as TeacherWithClasses['classes'] | null, error };
  }

  // Get all class-teacher assignments
  static async getAllClassTeacherAssignments(): Promise<{ data: ClassTeacher[] | null; error: any }> {
    const { data, error } = await supabase
      .from('class_teachers')
      .select(`
        *,
        classes(id, name, grade_level),
        teachers(id, teacher_code, first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  // Get active assignments only
  static async getActiveAssignments(): Promise<{ data: ClassTeacher[] | null; error: any }> {
    const { data, error } = await supabase
      .from('class_teachers')
      .select(`
        *,
        classes(id, name, grade_level),
        teachers(id, teacher_code, first_name, last_name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  // Create a new class-teacher assignment manually
  static async createAssignment(assignment: ClassTeacherInsert): Promise<{ data: ClassTeacher | null; error: any }> {
    const { data, error } = await supabase
      .from('class_teachers')
      .insert(assignment)
      .select()
      .single();

    return { data, error };
  }

  // Update an assignment
  static async updateAssignment(
    id: string,
    updates: Partial<ClassTeacherInsert>
  ): Promise<{ data: ClassTeacher | null; error: any }> {
    const { data, error } = await supabase
      .from('class_teachers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  }

  // Delete/deactivate an assignment
  static async deactivateAssignment(id: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('class_teachers')
      .update({ is_active: false })
      .eq('id', id);

    return { error };
  }

  // Check if a teacher is assigned to a class
  static async isTeacherAssignedToClass(
    teacherId: string,
    classId: string,
    subjectId?: string,
    role?: string
  ): Promise<{ data: boolean; error: any }> {
    let query = supabase
      .from('class_teachers')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('class_id', classId)
      .eq('is_active', true);

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }
    
    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    return { data: (data && data.length > 0) || false, error };
  }

  // Get teachers by role for a class
  static async getTeachersByRole(
    classId: string,
    role: 'homeroom' | 'subject_teacher' | 'assistant'
  ): Promise<{ data: any[] | null; error: any }> {
    const { data, error } = await supabase
      .from('class_teachers')
      .select(`
        *,
        teachers(id, teacher_code, first_name, last_name),
        subjects(id, name, code)
      `)
      .eq('class_id', classId)
      .eq('role', role)
      .eq('is_active', true);

    return { data, error };
  }

  // Get teachers by subject for a class
  static async getTeachersBySubject(
    classId: string,
    subjectId: string
  ): Promise<{ data: any[] | null; error: any }> {
    const { data, error } = await supabase
      .from('class_teachers')
      .select(`
        *,
        teachers(id, teacher_code, first_name, last_name),
        subjects(id, name, code)
      `)
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .eq('is_active', true);

    return { data, error };
  }
}
