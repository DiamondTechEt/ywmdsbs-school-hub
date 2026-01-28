import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  BarChart3, 
  Settings,
  Calendar,
  FileSpreadsheet,
  LogOut,
  School
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { role, signOut, user } = useAuth();

  const navItems = {
    super_admin: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/students', icon: GraduationCap, label: 'Students' },
      { to: '/teachers', icon: Users, label: 'Teachers' },
      { to: '/classes', icon: School, label: 'Classes' },
      { to: '/subjects', icon: BookOpen, label: 'Subjects' },
      { to: '/assessments', icon: ClipboardList, label: 'Assessments' },
      { to: '/grades', icon: FileSpreadsheet, label: 'Grades' },
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/academic-years', icon: Calendar, label: 'Academic Years' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
    teacher: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/my-classes', icon: School, label: 'My Classes' },
      { to: '/assessments', icon: ClipboardList, label: 'Assessments' },
      { to: '/grades', icon: FileSpreadsheet, label: 'Grades' },
      { to: '/upload-grades', icon: FileSpreadsheet, label: 'Upload Grades' },
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    ],
    student: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/my-grades', icon: FileSpreadsheet, label: 'My Grades' },
      { to: '/my-transcript', icon: ClipboardList, label: 'Transcript' },
      { to: '/my-performance', icon: BarChart3, label: 'Performance' },
    ],
  };

  const items = role ? navItems[role] : [];

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <School className="h-8 w-8 text-sidebar-primary" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground">YWMDSBS</span>
          <span className="text-xs text-sidebar-foreground/60">School Management</span>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 text-xs text-sidebar-foreground/60">
          <p className="truncate font-medium text-sidebar-foreground">{user?.email}</p>
          <p className="capitalize">{role?.replace('_', ' ')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
