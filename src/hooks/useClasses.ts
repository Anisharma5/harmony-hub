import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Class {
  id: string;
  name: string;
  academic_year: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  sections?: Section[];
}

export interface Section {
  id: string;
  name: string;
  class_id: string;
  capacity: number | null;
  created_at: string;
  updated_at: string;
  student_count?: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
}

export const useClasses = () => {
  return useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          sections(*)
        `)
        .order('name');

      if (error) throw error;
      return data as Class[];
    },
  });
};

export const useSections = () => {
  return useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sections')
        .select(`
          *,
          class:classes(id, name)
        `)
        .order('name');

      if (error) throw error;
      return data;
    },
  });
};

export const useSubjects = () => {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Subject[];
    },
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; academic_year: string; description?: string }) => {
      const { error } = await supabase.from('classes').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ name: string; academic_year: string; description: string }> }) => {
      const { error } = await supabase.from('classes').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useCreateSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; class_id: string; capacity?: number }) => {
      const { error } = await supabase.from('sections').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      toast.success('Section created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      toast.success('Section deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; code: string; description?: string }) => {
      const { error } = await supabase.from('subjects').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Subject created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Subject deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
