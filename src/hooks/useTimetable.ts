import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TimetableSlot {
  id: string;
  section_id: string;
  subject_id: string;
  staff_id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
  subjects?: {
    id: string;
    name: string;
    code: string;
  };
  staff?: {
    id: string;
    staff_code: string;
  };
}

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function useTimetable(sectionId?: string) {
  const queryClient = useQueryClient();

  const timetableQuery = useQuery({
    queryKey: ['timetable', sectionId],
    queryFn: async () => {
      let query = supabase
        .from('timetable_slots')
        .select(`
          *,
          subjects (
            id,
            name,
            code
          ),
          staff (
            id,
            staff_code,
            user_id
          )
        `)
        .order('day_of_week')
        .order('start_time');

      if (sectionId) {
        query = query.eq('section_id', sectionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TimetableSlot[];
    },
    enabled: !!sectionId,
  });

  const addSlot = useMutation({
    mutationFn: async (slot: {
      section_id: string;
      subject_id: string;
      staff_id?: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
    }) => {
      const { error } = await supabase.from('timetable_slots').insert(slot);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      toast.success('Timetable slot added');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateSlot = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TimetableSlot> & { id: string }) => {
      const { error } = await supabase
        .from('timetable_slots')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      toast.success('Timetable slot updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteSlot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('timetable_slots')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      toast.success('Timetable slot deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    slots: timetableQuery.data ?? [],
    isLoading: timetableQuery.isLoading,
    error: timetableQuery.error,
    addSlot,
    updateSlot,
    deleteSlot,
  };
}
