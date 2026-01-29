import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Classes from "./pages/Classes";
import Subjects from "./pages/Subjects";
import AcademicYears from "./pages/AcademicYears";
import Assessments from "./pages/Assessments";
import Grades from "./pages/Grades";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Enrollments from "./pages/Enrollments";
import ClassSubjectAssignments from "./pages/ClassSubjectAssignments";
import MyClasses from "./pages/MyClasses";
import UploadGrades from "./pages/UploadGrades";
import MyGrades from "./pages/MyGrades";
import MyTranscript from "./pages/MyTranscript";
import MyPerformance from "./pages/MyPerformance";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<AppLayout />}>
              {/* Shared */}
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Super Admin Routes */}
              <Route path="/students" element={<Students />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/academic-years" element={<AcademicYears />} />
              <Route path="/assessments" element={<Assessments />} />
              <Route path="/grades" element={<Grades />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/enrollments" element={<Enrollments />} />
              <Route path="/assignments" element={<ClassSubjectAssignments />} />
              
              {/* Teacher Routes */}
              <Route path="/my-classes" element={<MyClasses />} />
              <Route path="/upload-grades" element={<UploadGrades />} />
              
              {/* Student Routes */}
              <Route path="/my-grades" element={<MyGrades />} />
              <Route path="/my-transcript" element={<MyTranscript />} />
              <Route path="/my-performance" element={<MyPerformance />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
