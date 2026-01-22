import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FeeType {
  id: string;
  name: string;
  description?: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  is_active: boolean;
  created_at: string;
}

export interface Fee {
  id: string;
  student_id: string;
  fee_type_id: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  created_at: string;
  updated_at: string;
  fee_types?: FeeType;
  students?: {
    id: string;
    student_code: string;
  };
}

export interface Payment {
  id: string;
  fee_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'online';
  transaction_id?: string;
  payment_date: string;
  receipt_number?: string;
  notes?: string;
  processed_by?: string;
  created_at: string;
}

export function useFeeTypes() {
  const queryClient = useQueryClient();

  const feeTypesQuery = useQuery({
    queryKey: ['feeTypes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_types')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as FeeType[];
    },
  });

  const addFeeType = useMutation({
    mutationFn: async (feeType: {
      name: string;
      description?: string;
      amount: number;
      frequency: string;
    }) => {
      const { error } = await supabase.from('fee_types').insert(feeType);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeTypes'] });
      toast.success('Fee type added');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    feeTypes: feeTypesQuery.data ?? [],
    isLoading: feeTypesQuery.isLoading,
    addFeeType,
  };
}

export function useFees(studentId?: string) {
  const queryClient = useQueryClient();

  const feesQuery = useQuery({
    queryKey: ['fees', studentId],
    queryFn: async () => {
      let query = supabase
        .from('fees')
        .select(`
          *,
          fee_types (*),
          students (
            id,
            student_code,
            user_id
          )
        `)
        .order('due_date', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Fee[];
    },
  });

  const addFee = useMutation({
    mutationFn: async (fee: {
      student_id: string;
      fee_type_id: string;
      amount: number;
      due_date: string;
    }) => {
      const { error } = await supabase.from('fees').insert(fee);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      toast.success('Fee assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateFeeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('fees')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      toast.success('Fee status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    fees: feesQuery.data ?? [],
    isLoading: feesQuery.isLoading,
    addFee,
    updateFeeStatus,
  };
}

export function usePayments(feeId?: string) {
  const queryClient = useQueryClient();

  const paymentsQuery = useQuery({
    queryKey: ['payments', feeId],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });

      if (feeId) {
        query = query.eq('fee_id', feeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Payment[];
    },
  });

  const recordPayment = useMutation({
    mutationFn: async (payment: {
      fee_id: string;
      amount: number;
      payment_method: string;
      transaction_id?: string;
      notes?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('payments').insert({
        ...payment,
        processed_by: user.user?.id,
        receipt_number: `RCP-${Date.now()}`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    payments: paymentsQuery.data ?? [],
    isLoading: paymentsQuery.isLoading,
    recordPayment,
  };
}
