import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
  School,
  UserCheck,
  Eye,
  Award,
  User,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

export function Sidebar() {
  const { role, signOut, user } = useAuth();
  const [userName, setUserName] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Emit sidebar width changes to parent
  useEffect(() => {
    const width = isCollapsed ? 80 : 256; // w-20 = 80px, w-64 = 256px
    window.dispatchEvent(new CustomEvent('sidebarStateChange', { detail: { width } }));
  }, [isCollapsed]);

  // Fetch user name from user_names table
  useEffect(() => {
    if (user) {
      fetchUserName();
    }
  }, [user]);

  const fetchUserName = async () => {
    try {
      const { data, error } = await supabase
        .from('user_names')
        .select('display_name, full_name')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching user name:', error);
        // Fallback to auth user metadata if available
        setUserName(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User');
      } else {
        setUserName(data?.display_name || data?.full_name || 'User');
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
      setUserName(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User');
    }
  };

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const navItems = {
    super_admin: [
      {
        category: 'Main',
        items: [
          { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/settings', icon: Settings, label: 'Settings' },
          { to: '/profile-settings', icon: User, label: 'Profile Settings' },
        ]
      },
      {
        category: 'Academic Management',
        items: [
          { to: '/students', icon: GraduationCap, label: 'Students' },
          { to: '/teachers', icon: Users, label: 'Teachers' },
          { to: '/classes', icon: School, label: 'Classes' },
          { to: '/subjects', icon: BookOpen, label: 'Subjects' },
          { to: '/academic-years', icon: Calendar, label: 'Academic Years' },
          { to: '/semesters', icon: Calendar, label: 'Semesters' },
        ]
      },
      {
        category: 'Assessment & Grading',
        items: [
          { to: '/enrollments', icon: Users, label: 'Enrollments' },
          { to: '/assignments', icon: BookOpen, label: 'Assignments' },
          { to: '/class-teacher-assignments', icon: UserCheck, label: 'Class Teachers' },
          { to: '/assessments', icon: ClipboardList, label: 'Assessments' },
          { to: '/grades', icon: FileSpreadsheet, label: 'Grades' },
        ]
      },
      {
        category: 'Analytics & Security',
        items: [
          { to: '/analytics', icon: BarChart3, label: 'Analytics' },
          { to: '/audit-logs', icon: ClipboardList, label: 'Audit Logs' },
        ]
      },
    ],
    teacher: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/teacher-dashboard', icon: School, label: 'My Classes' },
      { to: '/teacher-students', icon: Users, label: 'Student Management' },
      { to: '/student-assessments', icon: Eye, label: 'Student Assessments' },
      { to: '/teacher-assessments', icon: BookOpen, label: 'Assessments' },
      { to: '/teacher-grades', icon: Award, label: 'Grades' },
      { to: '/teacher-student-grades', icon: FileSpreadsheet, label: 'Student Grades Table' },
      { to: '/teacher-analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/upload-grades', icon: FileSpreadsheet, label: 'Upload Grades' },
      { to: '/profile-settings', icon: User, label: 'Profile Settings' },
    ],
    student: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/my-grades', icon: FileSpreadsheet, label: 'My Grades' }, 
      { to: '/my-transcript', icon: ClipboardList, label: 'Transcript' },
      { to: '/my-performance', icon: BarChart3, label: 'Performance' },
      { to: '/profile-settings', icon: User, label: 'Profile Settings' },
    ],
    parent: [
      { to: '/parent-portal', icon: LayoutDashboard, label: 'Parent Portal' },
      { to: '/profile-settings', icon: User, label: 'Profile Settings' },
    ],
  };

  const items = role ? navItems[role as keyof typeof navItems] : [];

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className={cn(
              "font-bold text-gray-900 transition-all duration-200",
              isCollapsed ? "text-lg" : "text-xl"
            )}>
              {isCollapsed ? "SH" : "School Hub"}
            </h1>
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <NotificationBell />
              {/* Desktop collapse button */}
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:flex"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              {/* Mobile close button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* User info */}
          <div className={cn(
            "mt-4 transition-all duration-200",
            isCollapsed ? "text-center" : ""
          )}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userName || 'Loading...'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {role || 'User'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {role === 'super_admin' ? (
            <div className="space-y-2">
              {items.map((category) => (
                <div key={category.category}>
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(category.category)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
                      "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    )}
                  >
                    {!isCollapsed && (
                      <>
                        {collapsedCategories.has(category.category) ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <span className="font-semibold">{category.category}</span>
                      </>
                    )}
                    {isCollapsed && (
                      <span className="text-xs font-semibold truncate">
                        {category.category.charAt(0)}
                      </span>
                    )}
                  </button>
                  
                  {/* Category items */}
                  {!isCollapsed && !collapsedCategories.has(category.category) && (
                    <ul className="mt-1 ml-4 space-y-1">
                      {category.items.map((item) => (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
                                isActive
                                  ? "bg-gray-900 text-white"
                                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                                "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                              )
                            }
                            onClick={() => {
                              if (window.innerWidth < 1024) {
                                setIsMobileOpen(false);
                              }
                            }}
                          >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
                        isActive
                          ? "bg-gray-900 text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                        "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      )
                    }
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        setIsMobileOpen(false);
                      }
                    }}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900",
              isCollapsed && "justify-center"
            )}
            onClick={() => {
              signOut();
              setIsMobileOpen(false);
            }}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
