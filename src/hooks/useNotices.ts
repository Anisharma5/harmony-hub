import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AppRole } from '@/types/database';

export interface Notice {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  target_roles?: AppRole[];
  target_classes?: string[];
  created_by: string;
  expires_at?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export function useNotices() {
  const queryClient = useQueryClient();

  const noticesQuery = useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Notice[];
    },
  });

  const addNotice = useMutation({
    mutationFn: async (notice: {
      title: string;
      content: string;
      priority?: string;
      target_roles?: string[];
      target_classes?: string[];
      expires_at?: string;
      is_published?: boolean;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('notices').insert([{
        title: notice.title,
        content: notice.content,
        priority: notice.priority || 'normal',
        target_roles: notice.target_roles as ("accounts" | "non_teaching_staff" | "owner" | "student_parent" | "teaching_staff")[] | undefined,
        target_classes: notice.target_classes,
        expires_at: notice.expires_at,
        is_published: notice.is_published ?? true,
        created_by: user.user!.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      toast.success('Notice created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateNotice = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Notice> & { id: string }) => {
      const { error } = await supabase
        .from('notices')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      toast.success('Notice updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteNotice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      toast.success('Notice deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    notices: noticesQuery.data ?? [],
    isLoading: noticesQuery.isLoading,
    addNotice,
    updateNotice,
    deleteNotice,
  };
}
