import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Download, FileText, School, GraduationCap, Calendar, Eye, X } from 'lucide-react';
import { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';
import { useStudentGradesWithSubjects } from '@/components/teacher/useStudentGradesWithSubjects';

// Helper function to calculate student rank
const calculateStudentRank = (studentId: string, grades: any[]): number => {
  // This is a placeholder - in a real implementation, you would:
  // 1. Get all students' grades for the same academic period
  // 2. Calculate average percentages for all students
  // 3. Rank students by their average percentages
  // For now, we'll return a mock rank based on average
  const averagePercentage = grades.length > 0 
    ? grades.reduce((sum: number, g: any) => sum + (g.percentage || 0), 0) / grades.length 
    : 0;
  
  // Mock rank calculation (higher percentage = better rank)
  if (averagePercentage >= 95) return 1;
  if (averagePercentage >= 90) return 2;
  if (averagePercentage >= 85) return 3;
  if (averagePercentage >= 80) return 4;
  if (averagePercentage >= 75) return 5;
  if (averagePercentage >= 70) return 6;
  if (averagePercentage >= 65) return 7;
  if (averagePercentage >= 60) return 8;
  if (averagePercentage >= 55) return 9;
  return 10;
};

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
    backgroundColor: '#E2E8CE',
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
    borderBottom: '1 solid #ACBFA4',
    padding: 8,
    backgroundColor: '#E2E8CE',
  },
  col1: { width: '25%' },
  col2: { width: '45%' },
  col3: { width: '15%' },
  col4: { width: '15%', textAlign: 'center' },
  summary: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#ACBFA4',
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
    totalScore: number;
    average: number;
    totalCredits: number;
    rank: number;
  };
}

function TranscriptPDF({ data }: { data: TranscriptData }) {
  const { student, grades, summary } = data;

  // Group grades by subject
  const subjectGrades = grades.reduce((acc: Record<string, any>, grade: any) => {
    const subjectName = grade.subject?.name || 'Unknown Subject';
    if (!acc[subjectName]) {
      acc[subjectName] = {
        name: subjectName,
        code: grade.subject?.code || 'SUBJ001',
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
    };
  });

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
            <Text style={[styles.col1]}>Subject Code</Text>
            <Text style={[styles.col2]}>Subject Name</Text>
            <Text style={[styles.col3]}>Credit</Text>
            <Text style={[styles.col4]}>Score (%)</Text>
          </View>
          {subjectList.map((subject: any, index: number) => (
            <View key={subject.code} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.col1]}>{subject.code}</Text>
              <Text style={[styles.col2]}>{subject.name}</Text>
              <Text style={[styles.col3]}>{subject.credit}</Text>
              <Text style={[styles.col4]}>{subject.average.toFixed(1)}%</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>Total Score:</Text>
            <Text>{summary.totalScore.toFixed(1)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Average Score:</Text>
            <Text>{summary.average.toFixed(1)}%</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Total Credits:</Text>
            <Text>{summary.totalCredits}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Class Rank:</Text>
            <Text>#{summary.rank}</Text>
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
  const [showPreview, setShowPreview] = useState(true);

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

  // Use the new hook to get grades with subject information
  const { data: grades, isLoading: gradesLoading } = useStudentGradesWithSubjects(studentData?.id, selectedYear);

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
      return { totalScore: 0, average: 0, totalCredits: 0, rank: 0 };
    }

    let totalPercentage = 0;
    let totalCredits = 0;

    grades.forEach((grade: any) => {
      totalPercentage += grade.percentage || 0;
      totalCredits += grade.subject?.credit || 0;
    });

    const averageScore = grades.length > 0 ? totalPercentage / grades.length : 0;
    const studentRank = calculateStudentRank(studentData?.id || '', grades);

    return {
      totalScore: totalPercentage,
      average: averageScore,
      totalCredits,
      rank: studentRank,
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
    <div className="flex h-screen">
      {/* Main Content */}
      <div className={`flex-1 p-8 overflow-y-auto ${showPreview ? 'pr-0' : ''}`}>
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
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <><Eye className="mr-2 h-4 w-4" />Hide Preview</>
              ) : (
                <><Eye className="mr-2 h-4 w-4" />Show Preview</>
              )}
            </Button>
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
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Score</p>
                <p className="text-3xl font-bold">{summary.totalScore.toFixed(1)}</p>
              </div>
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-3xl font-bold">{summary.average.toFixed(1)}%</p>
              </div>
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="text-3xl font-bold">{summary.totalCredits}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="text-sm text-muted-foreground">Class Rank</p>
                <p className="text-3xl font-bold text-green-600">#{summary.rank}</p>
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

      {/* Preview Sidebar */}
      {showPreview && (
        <div className="w-96 bg-white border-l border-gray-200 shadow-lg overflow-hidden flex flex-col">
          {/* Preview Header */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Transcript Preview</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Header - Exact PDF Match */}
            <div className="text-center mb-6 pb-3 border-b-2 border-blue-800">
              <h2 className="text-lg font-bold text-blue-800 mb-1">Yihune Woldu Memorial Dessie Special Boarding School</h2>
              <h3 className="text-base font-bold text-gray-900 mt-1">OFFICIAL ACADEMIC TRANSCRIPT</h3>
            </div>

            {/* Student Information - Exact PDF Match */}
            <div className="mb-6 p-3 bg-gray-100 rounded text-sm">
              <div className="grid grid-cols-1 gap-2">
                <div className="flex">
                  <span className="font-bold text-gray-700 w-24 text-xs">Student Name:</span>
                  <span className="text-xs text-gray-900">
                    {studentData?.first_name} {studentData?.middle_name} {studentData?.last_name}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-bold text-gray-700 w-24 text-xs">Student ID:</span>
                  <span className="text-xs text-gray-900 font-mono">{studentData?.student_id_code}</span>
                </div>
                <div className="flex">
                  <span className="font-bold text-gray-700 w-24 text-xs">Enrollment Year:</span>
                  <span className="text-xs text-gray-900">{studentData?.enrollment_year}</span>
                </div>
                <div className="flex">
                  <span className="font-bold text-gray-700 w-24 text-xs">Issue Date:</span>
                  <span className="text-xs text-gray-900">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Grades Table - Exact PDF Match */}
            <div className="mb-6">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-200 border border-gray-300">
                    <th className="p-2 text-left font-bold text-gray-900 border-r border-gray-300">Subject</th>
                    <th className="p-2 text-center font-bold text-gray-900 border-r border-gray-300">Credit</th>
                    <th className="p-2 text-center font-bold text-gray-300">Score %</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(
                    grades.reduce((acc: Record<string, any[]>, grade: any) => {
                      const subjectName = grade.subject?.name || 'Unknown Subject';
                      if (!acc[subjectName]) {
                        acc[subjectName] = {
                          name: subjectName,
                          code: grade.subject?.code || 'SUBJ001',
                          credit: grade.subject?.credit || 1,
                          grades: [],
                        };
                      }
                      acc[subjectName].grades.push(grade);
                      return acc;
                    }, {})
                  ).map(([subjectName, subjectData]: [string, any], index: number) => {
                    const avg = subjectData.grades.reduce((sum: number, g: any) => sum + (g.percentage || 0), 0) / subjectData.grades.length;
                    
                    return (
                      <tr key={subjectName} className={`border border-gray-300 text-xs ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}>
                        <td className="p-2 text-gray-900 border-r border-gray-300">
                          <div className="truncate" title={subjectData.name}>
                            {subjectData.name.length > 15 ? subjectData.name.substring(0, 15) + '...' : subjectData.name}
                          </div>
                        </td>
                        <td className="p-2 text-gray-900 text-center border-r border-gray-300">
                          {subjectData.credit}
                        </td>
                        <td className="p-2 text-gray-900 text-center">
                          <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-semibold">
                            {avg.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary - Exact PDF Match */}
            <div className="p-3 bg-green-50 rounded mb-6 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700 text-xs">Total Score:</span>
                  <span className="text-xs text-gray-900">{summary.totalScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700 text-xs">Average Score:</span>
                  <span className="text-xs text-gray-900">{summary.average.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700 text-xs">Total Credits:</span>
                  <span className="text-xs text-gray-900">{summary.totalCredits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700 text-xs">Class Rank:</span>
                  <span className="text-xs text-green-600 font-bold">#{summary.rank}</span>
                </div>
              </div>
            </div>

            {/* Signature Section - Exact PDF Match */}
            <div className="flex justify-between mb-6">
              <div className="w-2/5 text-center">
                <div className="border-t border-gray-900 pt-1">
                  <p className="text-xs text-gray-700">School Registrar</p>
                </div>
              </div>
              <div className="w-2/5 text-center">
                <div className="border-t border-gray-900 pt-1">
                  <p className="text-xs text-gray-700">School Principal</p>
                </div>
              </div>
            </div>

            {/* Footer - Exact PDF Match */}
            <div className="pt-3 border-t border-gray-300 text-center">
              <p className="text-xs text-gray-600 mb-1">
                This is an official document. Any unauthorized alteration will be invalid.
              </p>
              <p className="text-xs text-gray-600">
                Transcript ID: {studentData?.student_id_code}-{Date.now()}
              </p>
            </div>
          </div>

          {/* Download Button at Bottom */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <PDFDownloadLink
              document={<TranscriptPDF data={transcriptData} />}
              fileName={`transcript_${studentData?.student_id_code}_${new Date().toISOString().split('T')[0]}.pdf`}
            >
              {({ loading }) => (
                <Button disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      )}
    </div>
  );
}
