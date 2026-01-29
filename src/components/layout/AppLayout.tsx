import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from './Sidebar';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export function AppLayout() {
  const { user, role, loading } = useAuth();
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default expanded width
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      setSidebarWidth(window.innerWidth < 1024 ? 0 : 256);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for sidebar collapse state changes
  useEffect(() => {
    const handleSidebarStateChange = (event: CustomEvent) => {
      if (!isMobile) {
        setSidebarWidth(event.detail.width);
      }
    };

    window.addEventListener('sidebarStateChange', handleSidebarStateChange as EventListener);
    return () => {
      window.removeEventListener('sidebarStateChange', handleSidebarStateChange as EventListener);
    };
  }, [isMobile]);

  if (loading) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-background">

        <Loader2 className="h-8 w-8 animate-spin text-primary" />

      </div>

    );

  }



  if (!user) {

    return <Navigate to="/auth" replace />;

  }



  // Redirect users without roles to a waiting page

  if (!role) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-background p-4">

        <div className="text-center">

          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />

          <h1 className="text-2xl font-bold mb-2">Role Not Assigned</h1>

          <p className="text-muted-foreground">Your account is created but your role hasn't been assigned yet. Please contact an administrator.</p>

        </div>

      </div>

    );

  }



  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main 
        className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );

}
