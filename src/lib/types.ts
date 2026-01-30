// Application types
export type AppRole = 'super_admin' | 'teacher' | 'student' | 'parent';
export type Gender = 'male' | 'female';
export type BoardingStatus = 'boarding' | 'day';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role?: AppRole;
}

export interface Student {
  id: string;
  user_id: string;
  student_id_code: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: Gender;
  date_of_birth: string;
  current_class_id?: string;
  enrollment_year: number;
  boarding_status: BoardingStatus;
  is_active: boolean;
}

export interface Teacher {
  id: string;
  user_id: string;
  teacher_code: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: Gender;
  hire_date: string;
  is_active: boolean;
}

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_locked: boolean;
  is_active: boolean;
}

export interface Semester {
  id: string;
  academic_year_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_locked: boolean;
}

export interface Class {
  id: string;
  name: string;
  grade_level: number;
  academic_year_id: string;
  homeroom_teacher_id?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  grade_level?: number;
  credit: number;
  is_active: boolean;
}

export interface ClassSubjectAssignment {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  is_active: boolean;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  academic_year_id: string;
  is_active: boolean;
}

export interface AssessmentType {
  id: string;
  code: string;
  name: string;
  description?: string;
  weight_default: number;
  is_active: boolean;
}

export interface Assessment {
  id: string;
  class_subject_assignment_id: string;
  assessment_type_id: string;
  semester_id: string;
  title: string;
  max_score: number;
  weight: number;
  assessment_date: string;
  is_published: boolean;
  created_by_teacher_id: string;
}

export interface Grade {
  id: string;
  student_id: string;
  assessment_id: string;
  score: number;
  percentage?: number;
  letter_grade?: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  academic_year_id: string;
  semester_id: string;
  is_published: boolean;
}

export interface GradingScale {
  id: string;
  name: string;
  academic_year_id?: string;
  is_active: boolean;
}

export interface GradingScaleItem {
  id: string;
  grading_scale_id: string;
  min_percentage: number;
  max_percentage: number;
  letter_grade: string;
  grade_point: number;
  description?: string;
}

// Extended types with relations
export interface StudentWithDetails extends Student {
  class?: Class;
  enrollments?: Enrollment[];
}

export interface TeacherWithDetails extends Teacher {
  assignments?: ClassSubjectAssignment[];
  homeroom_class?: Class;
}

export interface GradeWithDetails extends Grade {
  student?: Student;
  assessment?: Assessment;
  subject?: Subject;
}

export interface AssessmentWithDetails extends Assessment {
  assessment_type?: AssessmentType;
  class_subject_assignment?: ClassSubjectAssignment & {
    class?: Class;
    subject?: Subject;
    teacher?: Teacher;
  };
}

// Statistics types
export interface ClassStats {
  total_students: number;
  average_score: number;
  pass_rate: number;
  grade_distribution: Record<string, number>;
}

export interface StudentPerformance {
  student: Student;
  average: number;
  letter_grade: string;
  gpa: number;
  rank: number;
}
