import { useAuth } from '@/hooks/useAuth';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { TeacherDashboard } from '@/components/dashboards/TeacherDashboard';
import { StudentDashboard } from '@/components/dashboards/StudentDashboard';

export default function Dashboard() {
  const { role } = useAuth();

  if (role === 'super_admin') {
    return <AdminDashboard />;
  }

  if (role === 'teacher') {
    return <TeacherDashboard />;
  }

  if (role === 'student') {
    return <StudentDashboard />;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground">Welcome</h1>
      <p className="text-muted-foreground">Your role has not been assigned yet. Please contact an administrator.</p>
    </div>
  );
}
