import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { getUnreadNotificationCount } from '@/lib/notifications';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const { data: unreadCount } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: getUnreadNotificationCount,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleBellClick = () => {
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBellClick}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount && unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <NotificationPanel isOpen={isPanelOpen} onClose={handleClosePanel} />
    </>
  );
}
