import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { BanChecker } from "@/components/BanChecker";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Auth from "./pages/Auth";
import { LandingPage } from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Classes from "./pages/Classes";
import Subjects from "./pages/Subjects";
import AcademicYears from "./pages/AcademicYears";
import Semesters from "./pages/Semesters";
import Assessments from "./pages/Assessments";
import Grades from "./pages/Grades";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Enrollments from "./pages/Enrollments";
import ClassSubjectAssignments from "./pages/ClassSubjectAssignments";
import ClassTeacherAdmin from "./pages/admin/ClassTeacherAdmin";
import AuditLogs from "./pages/AuditLogs";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import MyClasses from "./pages/MyClasses";
import TeacherStudents from "./pages/TeacherStudents";
import { TeacherAssessments } from "./pages/teacher/TeacherAssessments";
import { TeacherGrades } from "./pages/teacher/TeacherGrades";
import { TeacherAnalytics } from "./pages/teacher/TeacherAnalytics";
import TeacherStudentGrades from "./pages/teacher/TeacherStudentGrades";
import HomeroomResults from "./pages/teacher/HomeroomResults";
import UploadGrades from "./pages/UploadGrades";
import MyGrades from "./pages/MyGrades";
import MyTranscript from "./pages/MyTranscript";
import MyPerformance from "./pages/MyPerformance";
import ProfileSettings from "./pages/ProfileSettings";
import ParentPortal from "./pages/ParentPortal";
import { BanManagement } from "./components/admin/BanManagement";
import UserManagementPage from "./pages/admin/UserManagementPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <BanChecker>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<LandingPage />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route element={<AppLayout />}>
                {/* Shared */}
                <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Super Admin Routes */}
              <Route 
                path="/students" 
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <Students />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teachers" 
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <Teachers />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/classes" 
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <Classes />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/subjects" 
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <Subjects />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/academic-years" 
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AcademicYears />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/semesters" 
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <Semesters />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/audit-logs" 
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AuditLogs />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/ban-management" 
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'teacher']}>
                    <BanManagement userRole="super_admin" />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <UserManagementPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/class-teacher" 
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <ClassTeacherAdmin />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/assessments" 
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <Assessments />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/grades" 
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <Grades />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <Analytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/enrollments" 
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <Enrollments />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/assignments" 
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <ClassSubjectAssignments />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/class-teacher-assignments" 
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <ClassTeacherAdmin />
                  </ProtectedRoute>
                } 
              />
              
              {/* Teacher Routes */}
              <Route 
                path="/my-classes" 
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'super_admin']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teacher-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'super_admin']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teacher-students" 
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'super_admin']}>
                    <TeacherStudents />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teacher-assessments" 
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'super_admin']}>
                    <TeacherAssessments />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teacher-grades" 
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'super_admin']}>
                    <TeacherGrades />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teacher-student-grades" 
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'super_admin']}>
                    <TeacherStudentGrades />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teacher-analytics" 
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'super_admin']}>
                    <TeacherAnalytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/homeroom-results" 
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'super_admin']}>
                    <HomeroomResults />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/upload-grades" 
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'super_admin']}>
                    <UploadGrades />
                  </ProtectedRoute>
                } 
              />
              
              {/* Student Routes */}
              <Route 
                path="/my-grades" 
                element={
                  <ProtectedRoute allowedRoles={['student', 'teacher', 'super_admin']}>
                    <MyGrades />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile-settings" 
                element={
                  <ProtectedRoute allowedRoles={['student', 'teacher', 'super_admin', 'parent']}>
                    <ProfileSettings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/parent-portal" 
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentPortal />
                  </ProtectedRoute>
                } 
              />
              
             
              <Route 
                path="/my-transcript" 
                element={
                  <ProtectedRoute allowedRoles={['student', 'teacher', 'super_admin']}>
                    <MyTranscript />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/my-performance" 
                element={
                  <ProtectedRoute allowedRoles={['student', 'teacher', 'super_admin']}>
                    <MyPerformance />
                  </ProtectedRoute>
                } 
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BanChecker>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
