import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description?: string;
  is_recurring: boolean;
  created_at: string;
}

export function useHolidays() {
  const queryClient = useQueryClient();

  const holidaysQuery = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      return data as Holiday[];
    },
  });

  const addHoliday = useMutation({
    mutationFn: async (holiday: {
      name: string;
      date: string;
      description?: string;
      is_recurring?: boolean;
    }) => {
      const { error } = await supabase.from('holidays').insert(holiday);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Holiday added');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteHoliday = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('holidays').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Holiday deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    holidays: holidaysQuery.data ?? [],
    isLoading: holidaysQuery.isLoading,
    addHoliday,
    deleteHoliday,
  };
}
