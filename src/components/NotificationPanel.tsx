import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  X, 
  Check, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  BookOpen, 
  User, 
  GraduationCap,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  Notification, 
  getUserNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} from '@/lib/notifications';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', showAll ? 100 : 10],
    queryFn: () => getUserNotifications(showAll ? 100 : 10),
    enabled: isOpen,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: getUnreadNotificationCount,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      toast.success(`Marked ${count} notifications as read`);
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      toast.success('Notification deleted');
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'GRADE':
        return <GraduationCap className="h-4 w-4 text-blue-500" />;
      case 'ASSESSMENT':
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      case 'STUDENT':
        return <User className="h-4 w-4 text-orange-500" />;
      case 'TEACHER':
        return <User className="h-4 w-4 text-teal-500" />;
      case 'SYSTEM':
        return <Settings className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return 'border-green-200 bg-green-50';
      case 'WARNING':
        return 'border-yellow-200 bg-yellow-50';
      case 'ERROR':
        return 'border-red-200 bg-red-50';
      case 'GRADE':
        return 'border-blue-200 bg-blue-50';
      case 'ASSESSMENT':
        return 'border-purple-200 bg-purple-50';
      case 'STUDENT':
        return 'border-orange-200 bg-orange-50';
      case 'TEACHER':
        return 'border-teal-200 bg-teal-50';
      case 'SYSTEM':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const toggleExpanded = (notificationId: string) => {
    const newExpanded = new Set(expandedNotifications);
    if (newExpanded.has(notificationId)) {
      newExpanded.delete(notificationId);
    } else {
      newExpanded.add(notificationId);
    }
    setExpandedNotifications(newExpanded);
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleDelete = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      
      {/* Notification Panel */}
      <div className="absolute left-0 right-0 top-0 h-full w-96 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-black to-black/30 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Notifications</h2>
                {unreadCount && unreadCount > 0 && (
                  <p className="text-blue-100 text-sm">
                    {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending || !unreadCount}
              className="text-sm"
            >
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-sm"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show all
              </>
            )}
          </Button>
        </div>

        {/* Notifications List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 ${
                    !notification.is_read ? 'font-semibold shadow-md' : 'shadow-sm'
                  } ${getNotificationColor(notification.type)}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${
                          !notification.is_read ? 'bg-white' : 'bg-gray-50'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold truncate">
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <Badge variant="default" className="h-2 w-2 rounded-full p-0 bg-blue-500 animate-pulse" />
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                              <span>{formatTimeAgo(notification.created_at)}</span>
                            </span>
                            {notification.entity_name && (
                              <>
                                <span>•</span>
                                <span className="font-medium">{notification.entity_name}</span>
                              </>
                            )}
                            <span className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${
                                notification.priority >= 4 ? 'bg-red-400' :
                                notification.priority >= 3 ? 'bg-orange-400' :
                                notification.priority >= 2 ? 'bg-yellow-400' :
                                'bg-green-400'
                              }`}></div>
                              <span>Priority {notification.priority}</span>
                            </span>
                          </div>
                          
                          {/* Expanded content */}
                          {expandedNotifications.has(notification.id) && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              {notification.metadata && (
                                <div className="text-xs text-gray-600 mb-3 p-2 bg-gray-50 rounded">
                                  <div className="font-semibold mb-1">Details:</div>
                                  <pre className="whitespace-pre-wrap text-xs">
                                    {JSON.stringify(notification.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {notification.action_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full mt-2"
                                  onClick={() => {
                                    window.location.href = notification.action_url;
                                  }}
                                >
                                  {notification.action_text || 'View Details'}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(notification.id)}
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          {expandedNotifications.has(notification.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="h-8 w-8 p-0 hover:bg-green-50 text-green-600"
                            disabled={markAsReadMutation.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          className="h-8 w-8 p-0 hover:bg-red-50 text-red-500"
                          disabled={deleteNotificationMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-gray-100 p-6 rounded-full">
                    <Bell className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">No notifications</h3>
                  <p className="text-gray-500 text-sm max-w-xs">
                    You're all caught up! Check back later for new notifications.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
