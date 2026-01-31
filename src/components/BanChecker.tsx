import React from 'react';
import { useBanStatus } from '@/hooks/useBanStatus';
import { BannedScreen } from '@/components/BannedScreen';
import { useAuth } from '@/hooks/useAuth';

interface BanCheckerProps {
  children: React.ReactNode;
}

export function BanChecker({ children }: BanCheckerProps) {
  const { banStatus, loading } = useBanStatus();
  const { role } = useAuth();

  // Show loading spinner while checking ban status
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is banned and is a student or teacher, show the banned screen
  if (banStatus.isBanned && role && (role === 'student' || role === 'teacher')) {
    return <BannedScreen banStatus={banStatus} userRole={role} />;
  }

  // Otherwise, show the normal app
  return <>{children}</>;
}
