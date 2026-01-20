import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AppRole } from '@/types/database';

export interface Staff {
  id: string;
  user_id: string;
  staff_code: string;
  department: string | null;
  designation: string | null;
  subjects: string[] | null;
  employment_date: string;
  salary: number | null;
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
  roles?: AppRole[];
}

export const useStaff = () => {
  return useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles and roles for each staff
      const userIds = data.map(s => s.user_id);
      
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').in('user_id', userIds),
        supabase.from('user_roles').select('*').in('user_id', userIds),
      ]);

      const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]));
      const rolesMap = new Map<string, AppRole[]>();
      rolesRes.data?.forEach(r => {
        const existing = rolesMap.get(r.user_id) || [];
        rolesMap.set(r.user_id, [...existing, r.role as AppRole]);
      });

      return data.map(staff => ({
        ...staff,
        profile: profileMap.get(staff.user_id),
        roles: rolesMap.get(staff.user_id) || [],
      })) as Staff[];
    },
  });
};

export const useCreateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      address?: string;
      staffCode: string;
      department?: string;
      designation?: string;
      subjects?: string[];
      salary?: number;
      role: 'teaching_staff' | 'non_teaching_staff' | 'accounts';
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
            role: data.role,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      // Create staff record
      const { error: staffError } = await supabase.from('staff').insert({
        user_id: result.userId,
        staff_code: data.staffCode,
        department: data.department || null,
        designation: data.designation || null,
        subjects: data.subjects || null,
        salary: data.salary || null,
      });

      if (staffError) throw staffError;

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
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        department: string | null;
        designation: string | null;
        subjects: string[] | null;
        salary: number | null;
        is_active: boolean;
      }>;
    }) => {
      const { error } = await supabase.from('staff').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('staff').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
