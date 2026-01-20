import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Student {
  id: string;
  user_id: string;
  student_code: string;
  section_id: string | null;
  enrollment_date: string;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    address: string | null;
  };
  section?: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
    };
  };
}

export const useStudents = () => {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          section:sections(id, name, class:classes(id, name))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each student
      const userIds = data.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      return data.map(student => ({
        ...student,
        profile: profileMap.get(student.user_id)
      })) as Student[];
    },
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      address?: string;
      studentCode: string;
      sectionId?: string;
      dateOfBirth?: string;
      gender?: string;
      bloodGroup?: string;
      parentName?: string;
      parentPhone?: string;
      parentEmail?: string;
    }) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            role: 'student_parent',
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      // Create student record
      const { error: studentError } = await supabase.from('students').insert({
        user_id: result.userId,
        student_code: data.studentCode,
        section_id: data.sectionId || null,
        date_of_birth: data.dateOfBirth || null,
        gender: data.gender || null,
        blood_group: data.bloodGroup || null,
        parent_name: data.parentName || null,
        parent_phone: data.parentPhone || null,
        parent_email: data.parentEmail || null,
      });

      if (studentError) throw studentError;

      // Update profile with additional info
      if (data.phone || data.address) {
        await supabase
          .from('profiles')
          .update({ phone: data.phone, address: data.address })
          .eq('user_id', result.userId);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        section_id: string | null;
        date_of_birth: string | null;
        gender: string | null;
        blood_group: string | null;
        parent_name: string | null;
        parent_phone: string | null;
        parent_email: string | null;
        is_active: boolean;
      }>;
    }) => {
      const { error } = await supabase
        .from('students')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
