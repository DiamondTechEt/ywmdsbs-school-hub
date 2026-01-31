import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface BanStatus {
  isBanned: boolean;
  bannedAt?: string;
  bannedBy?: string;
  banReason?: string;
  banNotes?: string;
}

export function useBanStatus() {
  const { user, role } = useAuth();
  const [banStatus, setBanStatus] = useState<BanStatus>({ isBanned: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && role) {
      checkBanStatus();
    } else {
      setBanStatus({ isBanned: false });
      setLoading(false);
    }
  }, [user, role]);

  const checkBanStatus = async () => {
    try {
      setLoading(true);
      
      if (!user || !role) {
        setBanStatus({ isBanned: false });
        return;
      }

      let query;
      if (role === 'student') {
        query = supabase
          .from('students')
          .select('is_banned, banned_at, banned_by, ban_reason, ban_notes, teachers(first_name, last_name)')
          .eq('user_id', user.id)
          .single();
      } else if (role === 'teacher') {
        query = supabase
          .from('teachers')
          .select('is_banned, banned_at, banned_by, ban_reason, ban_notes, banned_by_teacher:teachers!banned_by(first_name, last_name)')
          .eq('user_id', user.id)
          .single();
      } else {
        setBanStatus({ isBanned: false });
        return;
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error checking ban status:', error);
        setBanStatus({ isBanned: false });
      } else if (data) {
        const bannedByName = role === 'teacher' 
          ? (data.banned_by_teacher 
              ? `${data.banned_by_teacher.first_name} ${data.banned_by_teacher.last_name}`
              : 'Unknown')
          : (data.teachers 
              ? `${data.teachers.first_name} ${data.teachers.last_name}`
              : 'Unknown');

        setBanStatus({
          isBanned: data.is_banned || false,
          bannedAt: data.banned_at,
          bannedBy: bannedByName,
          banReason: data.ban_reason,
          banNotes: data.ban_notes
        });
      }
    } catch (error) {
      console.error('Error checking ban status:', error);
      setBanStatus({ isBanned: false });
    } finally {
      setLoading(false);
    }
  };

  return { banStatus, loading, refetch: checkBanStatus };
}
