import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  totalFeeCollection: number;
  monthlyFeeCollection: number;
  todayAttendanceRate: number;
  pendingFees: number;
  recentPaymentsCount: number;
  activeNotices: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const startOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');

      // Fetch all stats in parallel
      const [
        studentsResult,
        staffResult,
        paymentsResult,
        monthlyPaymentsResult,
        attendanceResult,
        totalAttendanceResult,
        pendingFeesResult,
        noticesResult,
      ] = await Promise.all([
        // Total active students
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        
        // Total active staff
        supabase
          .from('staff')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        
        // Total fee collection (all time)
        supabase
          .from('payments')
          .select('amount'),
        
        // Monthly fee collection
        supabase
          .from('payments')
          .select('amount')
          .gte('payment_date', startOfMonth),
        
        // Today's present attendance
        supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('date', today)
          .eq('status', 'present'),
        
        // Today's total attendance records
        supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('date', today),
        
        // Pending fees
        supabase
          .from('fees')
          .select('amount')
          .in('status', ['pending', 'overdue']),
        
        // Active notices
        supabase
          .from('notices')
          .select('id', { count: 'exact', head: true })
          .eq('is_published', true),
      ]);

      // Calculate totals
      const totalStudents = studentsResult.count || 0;
      const totalStaff = staffResult.count || 0;
      
      const totalFeeCollection = paymentsResult.data?.reduce(
        (sum, p) => sum + Number(p.amount), 0
      ) || 0;
      
      const monthlyFeeCollection = monthlyPaymentsResult.data?.reduce(
        (sum, p) => sum + Number(p.amount), 0
      ) || 0;
      
      const presentCount = attendanceResult.count || 0;
      const totalAttendanceRecords = totalAttendanceResult.count || 0;
      const todayAttendanceRate = totalAttendanceRecords > 0 
        ? Math.round((presentCount / totalAttendanceRecords) * 100) 
        : 0;
      
      const pendingFees = pendingFeesResult.data?.reduce(
        (sum, f) => sum + Number(f.amount), 0
      ) || 0;
      
      const recentPaymentsCount = monthlyPaymentsResult.data?.length || 0;
      const activeNotices = noticesResult.count || 0;

      return {
        totalStudents,
        totalStaff,
        totalFeeCollection,
        monthlyFeeCollection,
        pendingFees,
        todayAttendanceRate,
        recentPaymentsCount,
        activeNotices,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
