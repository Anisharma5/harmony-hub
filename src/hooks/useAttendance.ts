import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  section_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
  marked_by?: string;
  created_at: string;
  updated_at: string;
  students?: {
    id: string;
    student_code: string;
    profiles?: {
      first_name: string;
      last_name: string;
    };
  };
}

export function useAttendance(sectionId?: string, date?: string) {
  const queryClient = useQueryClient();

  const attendanceQuery = useQuery({
    queryKey: ['attendance', sectionId, date],
    queryFn: async () => {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          students (
            id,
            student_code,
            user_id
          )
        `)
        .order('date', { ascending: false });

      if (sectionId) {
        query = query.eq('section_id', sectionId);
      }
      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!sectionId,
  });

  const markAttendance = useMutation({
    mutationFn: async (records: {
      student_id: string;
      section_id: string;
      date: string;
      status: string;
      remarks?: string;
    }[]) => {
      const { data: user } = await supabase.auth.getUser();
      const recordsWithMarker = records.map(r => ({
        ...r,
        marked_by: user.user?.id,
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(recordsWithMarker, {
          onConflict: 'student_id,section_id,date',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance marked successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    attendance: attendanceQuery.data ?? [],
    isLoading: attendanceQuery.isLoading,
    error: attendanceQuery.error,
    markAttendance,
  };
}
