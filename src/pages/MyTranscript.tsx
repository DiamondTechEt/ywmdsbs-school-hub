import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, FileText, School, GraduationCap, Calendar } from 'lucide-react';
import { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Helvetica',
  src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf',
});

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    borderBottom: '2 solid #333',
    paddingBottom: 15,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  schoolAddress: {
    fontSize: 9,
    color: '#666',
    marginBottom: 5,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
  },
  studentInfo: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    width: 120,
    fontWeight: 'bold',
  },
  infoValue: {
    flex: 1,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#333',
    color: '#fff',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd',
    padding: 8,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd',
    padding: 8,
    backgroundColor: '#f9f9f9',
  },
  col1: { width: '40%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '15%', textAlign: 'center' },
  col4: { width: '15%', textAlign: 'center' },
  col5: { width: '15%', textAlign: 'center' },
  summary: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: '1 solid #ddd',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
  },
  signature: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  signatureBox: {
    width: '40%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTop: '1 solid #333',
    marginTop: 40,
    paddingTop: 5,
  },
});

interface TranscriptData {
  student: any;
  grades: any[];
  academicYear?: any;
  summary: {
    gpa: number;
    average: number;
    totalCredits: number;
  };
}

function TranscriptPDF({ data }: { data: TranscriptData }) {
  const { student, grades, summary } = data;

  // Group grades by subject
  const subjectGrades = grades.reduce((acc: Record<string, any>, grade: any) => {
    const subjectName = grade.subject?.name || 'Unknown';
    if (!acc[subjectName]) {
      acc[subjectName] = {
        name: subjectName,
        code: grade.subject?.code || 'N/A',
        credit: grade.subject?.credit || 1,
        grades: [],
      };
    }
    acc[subjectName].grades.push(grade);
    return acc;
  }, {});

  const subjectList = Object.values(subjectGrades).map((subject: any) => {
    const avg = subject.grades.reduce((sum: number, g: any) => sum + (g.percentage || 0), 0) / subject.grades.length;
    return {
      ...subject,
      average: avg,
      letterGrade: getLetterGrade(avg),
      gradePoint: getGradePoint(avg),
    };
  });

  function getLetterGrade(percentage: number): string {
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
  }

  function getGradePoint(percentage: number): number {
    if (percentage >= 90) return 4.0;
    if (percentage >= 85) return 3.7;
    if (percentage >= 80) return 3.3;
    if (percentage >= 75) return 3.0;
    if (percentage >= 70) return 2.7;
    if (percentage >= 65) return 2.3;
    if (percentage >= 60) return 2.0;
    if (percentage >= 55) return 1.7;
    if (percentage >= 50) return 1.3;
    if (percentage >= 45) return 1.0;
    return 0.0;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.schoolName}>Yihune Woldu Memorial Dessie Special Boarding School</Text>
          <Text style={styles.schoolAddress}>Dessie, Ethiopia</Text>
          <Text style={styles.title}>OFFICIAL ACADEMIC TRANSCRIPT</Text>
        </View>

        {/* Student Information */}
        <View style={styles.studentInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Student Name:</Text>
            <Text style={styles.infoValue}>
              {student?.first_name} {student?.middle_name} {student?.last_name}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Student ID:</Text>
            <Text style={styles.infoValue}>{student?.student_id_code}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Enrollment Year:</Text>
            <Text style={styles.infoValue}>{student?.enrollment_year}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Issue Date:</Text>
            <Text style={styles.infoValue}>{new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Grades Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Subject</Text>
            <Text style={styles.col2}>Credit</Text>
            <Text style={styles.col3}>Average</Text>
            <Text style={styles.col4}>Grade</Text>
            <Text style={styles.col5}>Points</Text>
          </View>
          {subjectList.map((subject: any, index: number) => (
            <View key={subject.code} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={styles.col1}>{subject.name}</Text>
              <Text style={styles.col2}>{subject.credit}</Text>
              <Text style={styles.col3}>{subject.average.toFixed(1)}%</Text>
              <Text style={styles.col4}>{subject.letterGrade}</Text>
              <Text style={styles.col5}>{subject.gradePoint.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>Overall Average:</Text>
            <Text>{summary.average.toFixed(1)}%</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Cumulative GPA:</Text>
            <Text>{summary.gpa.toFixed(2)} / 4.0</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Total Credits:</Text>
            <Text>{summary.totalCredits}</Text>
          </View>
        </View>

        {/* Signature Section */}
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              <Text>School Registrar</Text>
            </View>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              <Text>School Principal</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is an official document. Any unauthorized alteration will be invalid.
          </Text>
          <Text style={styles.footerText}>
            Transcript ID: {student?.student_id_code}-{Date.now()}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default function MyTranscript() {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ['my-student-data', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: grades, isLoading: gradesLoading } = useQuery({
    queryKey: ['my-transcript-grades', studentData?.id, selectedYear],
    queryFn: async () => {
      let query = supabase
        .from('grades')
        .select(`
          *,
          subject:subjects(*),
          assessment:assessments(*),
          semester:semesters(*, academic_year:academic_years(*)),
          academic_year:academic_years(*)
        `)
        .eq('student_id', studentData!.id)
        .eq('is_published', true);

      if (selectedYear !== 'all') {
        query = query.eq('academic_year_id', selectedYear);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!studentData,
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

  // Calculate summary
  const calculateSummary = () => {
    if (!grades || grades.length === 0) {
      return { gpa: 0, average: 0, totalCredits: 0 };
    }

    let totalPoints = 0;
    let totalCredits = 0;
    let totalPercentage = 0;

    const subjectAverages: Record<string, { total: number; count: number; credit: number }> = {};

    grades.forEach((grade: any) => {
      const subjectId = grade.subject_id;
      const credit = grade.subject?.credit || 1;
      if (!subjectAverages[subjectId]) {
        subjectAverages[subjectId] = { total: 0, count: 0, credit };
      }
      subjectAverages[subjectId].total += grade.percentage || 0;
      subjectAverages[subjectId].count += 1;
      totalPercentage += grade.percentage || 0;
    });

    Object.values(subjectAverages).forEach((subject) => {
      const avg = subject.total / subject.count;
      const gradePoint = (avg / 100) * 4;
      totalPoints += gradePoint * subject.credit;
      totalCredits += subject.credit;
    });

    return {
      gpa: totalCredits > 0 ? totalPoints / totalCredits : 0,
      average: grades.length > 0 ? totalPercentage / grades.length : 0,
      totalCredits,
    };
  };

  const summary = calculateSummary();

  const transcriptData: TranscriptData = {
    student: studentData,
    grades: grades || [],
    summary,
  };

  const isLoading = studentLoading || gradesLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Transcript</h1>
          <p className="text-muted-foreground">Generate and download your academic transcript</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Academic Years</SelectItem>
              {academicYears?.map((year: any) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Student Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Student Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">
                {studentData?.first_name} {studentData?.middle_name} {studentData?.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Student ID</p>
              <p className="font-mono font-medium">{studentData?.student_id_code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Enrollment Year</p>
              <p className="font-medium">{studentData?.enrollment_year}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Academic Summary
          </CardTitle>
          <CardDescription>
            {selectedYear === 'all' ? 'All-time academic record' : 'Selected academic year'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">Overall Average</p>
              <p className="text-3xl font-bold">{summary.average.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">Cumulative GPA</p>
              <p className="text-3xl font-bold">{summary.gpa.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">out of 4.0</p>
            </div>
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Credits</p>
              <p className="text-3xl font-bold">{summary.totalCredits}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Transcript
          </CardTitle>
          <CardDescription>
            Generate an official PDF transcript with your academic records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {grades && grades.length > 0 ? (
            <PDFDownloadLink
              document={<TranscriptPDF data={transcriptData} />}
              fileName={`transcript_${studentData?.student_id_code}_${new Date().toISOString().split('T')[0]}.pdf`}
            >
              {({ loading }) => (
                <Button disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF Transcript
                    </>
                  )}
                </Button>
              )}
            </PDFDownloadLink>
          ) : (
            <div className="text-center text-muted-foreground">
              <FileText className="mx-auto mb-2 h-12 w-12" />
              <p>No grades available to generate transcript</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
