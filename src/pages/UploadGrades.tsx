import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, Download, AlertCircle, CheckCircle, Loader2, FileSpreadsheet } from 'lucide-react';

interface PreviewRow {
  studentIdCode: string;
  studentName: string;
  score: number;
  status: 'valid' | 'error';
  errorMessage?: string;
}

export default function UploadGrades() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<string>('');
  const [assessmentTitle, setAssessmentTitle] = useState<string>('');
  const [maxScore, setMaxScore] = useState<number>(100);
  const [weight, setWeight] = useState<number>(10);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch teacher's assignments
  const { data: assignments } = useQuery({
    queryKey: ['teacher-assignments', user?.id],
    queryFn: async () => {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!teacher) return { assignments: [], teacher: null };

      const { data } = await supabase
        .from('class_subject_assignments')
        .select(`
          *,
          class:classes(*),
          subject:subjects(*)
        `)
        .eq('teacher_id', teacher.id)
        .eq('is_active', true);

      return { assignments: data || [], teacher };
    },
    enabled: !!user,
  });

  // Fetch semesters
  const { data: semesters } = useQuery({
    queryKey: ['semesters'],
    queryFn: async () => {
      const { data } = await supabase
        .from('semesters')
        .select('*, academic_year:academic_years(*)')
        .eq('is_locked', false)
        .order('start_date', { ascending: false });
      return data || [];
    },
  });

  // Fetch assessment types
  const { data: assessmentTypes } = useQuery({
    queryKey: ['assessment-types'],
    queryFn: async () => {
      const { data } = await supabase
        .from('assessment_types')
        .select('*')
        .eq('is_active', true);
      return data || [];
    },
  });

  // Get students for the selected class
  const { data: classStudents } = useQuery({
    queryKey: ['class-students', selectedClass],
    queryFn: async () => {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student:students(*)')
        .eq('class_id', selectedClass)
        .eq('is_active', true);
      
      return enrollments?.map((e: any) => e.student).filter(Boolean) || [];
    },
    enabled: !!selectedClass,
  });

  // Get unique classes from assignments
  const uniqueClasses = assignments?.assignments?.reduce((acc: any[], assignment: any) => {
    if (!acc.find((c) => c.id === assignment.class?.id)) {
      acc.push(assignment.class);
    }
    return acc;
  }, []) || [];

  // Get subjects for selected class
  const subjectsForClass = assignments?.assignments?.filter(
    (a: any) => a.class_id === selectedClass
  ).map((a: any) => a.subject) || [];

  // Download template
  const handleDownloadTemplate = () => {
    const students = classStudents || [];
    const templateData = students.map((student: any) => ({
      'Student ID': student.student_id_code,
      'Student Name': `${student.first_name} ${student.last_name}`,
      'Score': '',
    }));

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Grades');
    
    // Add column widths
    ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 10 }];
    
    XLSX.writeFile(wb, `grades_template_${selectedClass}_${selectedSubject}.xlsx`);
    toast.success('Template downloaded successfully');
  };

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate and preview data
        const students = classStudents || [];
        const preview: PreviewRow[] = jsonData.map((row: any) => {
          const studentId = row['Student ID']?.toString().trim();
          const score = parseFloat(row['Score']);
          
          const student = students.find((s: any) => s.student_id_code === studentId);
          
          if (!student) {
            return {
              studentIdCode: studentId || 'Unknown',
              studentName: row['Student Name'] || 'Unknown',
              score: score || 0,
              status: 'error' as const,
              errorMessage: 'Student not found in this class',
            };
          }

          if (isNaN(score)) {
            return {
              studentIdCode: studentId,
              studentName: `${student.first_name} ${student.last_name}`,
              score: 0,
              status: 'error' as const,
              errorMessage: 'Invalid score value',
            };
          }

          if (score < 0 || score > maxScore) {
            return {
              studentIdCode: studentId,
              studentName: `${student.first_name} ${student.last_name}`,
              score,
              status: 'error' as const,
              errorMessage: `Score must be between 0 and ${maxScore}`,
            };
          }

          return {
            studentIdCode: studentId,
            studentName: `${student.first_name} ${student.last_name}`,
            score,
            status: 'valid' as const,
          };
        });

        setPreviewData(preview);
        setIsPreviewMode(true);
        toast.success('File parsed successfully. Review the data below.');
      } catch (error) {
        toast.error('Failed to parse Excel file');
      }
    };
    reader.readAsArrayBuffer(file);
  }, [classStudents, maxScore]);

  // Submit grades
  const submitGrades = useMutation({
    mutationFn: async () => {
      const validRows = previewData.filter((row) => row.status === 'valid');
      if (validRows.length === 0) {
        throw new Error('No valid rows to submit');
      }

      const assignment = assignments?.assignments?.find(
        (a: any) => a.class_id === selectedClass && a.subject_id === selectedSubject
      );

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      // Create assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          class_subject_assignment_id: assignment.id,
          assessment_type_id: selectedAssessmentType,
          semester_id: selectedSemester,
          title: assessmentTitle,
          max_score: maxScore,
          weight: weight,
          assessment_date: new Date().toISOString().split('T')[0],
          is_published: false,
          created_by_teacher_id: assignments?.teacher?.id,
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Get student IDs
      const students = classStudents || [];
      const semester = semesters?.find((s: any) => s.id === selectedSemester);

      // Insert grades
      const gradesData = validRows.map((row) => {
        const student = students.find((s: any) => s.student_id_code === row.studentIdCode);
        const percentage = (row.score / maxScore) * 100;
        const letterGrade = getLetterGrade(percentage);

        return {
          student_id: student!.id,
          assessment_id: assessment.id,
          score: row.score,
          percentage,
          letter_grade: letterGrade,
          teacher_id: assignments?.teacher?.id,
          class_id: selectedClass,
          subject_id: selectedSubject,
          academic_year_id: semester?.academic_year_id,
          semester_id: selectedSemester,
          is_published: false,
        };
      });

      const { error: gradesError } = await supabase
        .from('grades')
        .insert(gradesData);

      if (gradesError) throw gradesError;

      return { count: validRows.length };
    },
    onSuccess: (data) => {
      toast.success(`Successfully uploaded ${data.count} grades`);
      setPreviewData([]);
      setIsPreviewMode(false);
      setAssessmentTitle('');
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload grades');
    },
  });

  const getLetterGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C+';
    if (percentage >= 55) return 'C';
    if (percentage >= 50) return 'C-';
    if (percentage >= 45) return 'D';
    return 'F';
  };

  const validCount = previewData.filter((r) => r.status === 'valid').length;
  const errorCount = previewData.filter((r) => r.status === 'error').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Upload Grades</h1>
        <p className="text-muted-foreground">
          Bulk upload grades from an Excel file
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Configuration</CardTitle>
            <CardDescription>
              Select the class, subject, and assessment details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueClasses.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Select 
                  value={selectedSubject} 
                  onValueChange={setSelectedSubject}
                  disabled={!selectedClass}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectsForClass.map((subject: any) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Semester</Label>
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters?.map((semester: any) => (
                      <SelectItem key={semester.id} value={semester.id}>
                        {semester.academic_year?.name} - {semester.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assessment Type</Label>
                <Select value={selectedAssessmentType} onValueChange={setSelectedAssessmentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {assessmentTypes?.map((type: any) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assessment Title</Label>
              <input
                type="text"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="e.g., Quiz 1, Midterm Exam"
                value={assessmentTitle}
                onChange={(e) => setAssessmentTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Max Score</Label>
                <input
                  type="number"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Weight (%)</Label>
                <input
                  type="number"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  min={0}
                  max={100}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                disabled={!selectedClass || !classStudents?.length}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  disabled={!selectedClass || !selectedSubject || !selectedSemester || !selectedAssessmentType || !assessmentTitle}
                />
                <Button
                  disabled={!selectedClass || !selectedSubject || !selectedSemester || !selectedAssessmentType || !assessmentTitle}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Excel File
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>
              How to upload grades using Excel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  1
                </div>
                <div>
                  <p className="font-medium">Select Class & Subject</p>
                  <p className="text-sm text-muted-foreground">
                    Choose the class and subject you want to upload grades for.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  2
                </div>
                <div>
                  <p className="font-medium">Download Template</p>
                  <p className="text-sm text-muted-foreground">
                    Download the Excel template with student names pre-filled.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  3
                </div>
                <div>
                  <p className="font-medium">Enter Scores</p>
                  <p className="text-sm text-muted-foreground">
                    Fill in the scores for each student in the Score column.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  4
                </div>
                <div>
                  <p className="font-medium">Upload & Review</p>
                  <p className="text-sm text-muted-foreground">
                    Upload the file and review the preview before confirming.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Table */}
      {isPreviewMode && previewData.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Preview Upload
                </CardTitle>
                <CardDescription>
                  Review the data before submitting
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {validCount} Valid
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errorCount} Errors
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{row.studentIdCode}</TableCell>
                      <TableCell>{row.studentName}</TableCell>
                      <TableCell>{row.score}</TableCell>
                      <TableCell>
                        {row.status === 'valid' ? (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Valid
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Error
                            </Badge>
                            <span className="text-xs text-destructive">
                              {row.errorMessage}
                            </span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setPreviewData([]);
                  setIsPreviewMode(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => submitGrades.mutate()}
                disabled={validCount === 0 || submitGrades.isPending}
              >
                {submitGrades.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit {validCount} Grades
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
