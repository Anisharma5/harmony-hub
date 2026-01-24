import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

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

export interface TrendData {
  attendanceTrend: { date: string; rate: number }[];
  feeCollectionTrend: { month: string; amount: number }[];
  enrollmentTrend: { month: string; count: number }[];
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');

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
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('staff')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('payments')
          .select('amount'),
        supabase
          .from('payments')
          .select('amount')
          .gte('payment_date', monthStart),
        supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('date', today)
          .eq('status', 'present'),
        supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('date', today),
        supabase
          .from('fees')
          .select('amount')
          .in('status', ['pending', 'overdue']),
        supabase
          .from('notices')
          .select('id', { count: 'exact', head: true })
          .eq('is_published', true),
      ]);

      const totalStudents = studentsResult.count || 0;
      const totalStaff = staffResult.count || 0;
      const totalFeeCollection = paymentsResult.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const monthlyFeeCollection = monthlyPaymentsResult.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const presentCount = attendanceResult.count || 0;
      const totalAttendanceRecords = totalAttendanceResult.count || 0;
      const todayAttendanceRate = totalAttendanceRecords > 0 
        ? Math.round((presentCount / totalAttendanceRecords) * 100) 
        : 0;
      const pendingFees = pendingFeesResult.data?.reduce((sum, f) => sum + Number(f.amount), 0) || 0;
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
    refetchInterval: 30000,
  });
};

export const useDashboardTrends = () => {
  return useQuery({
    queryKey: ['dashboard-trends'],
    queryFn: async (): Promise<TrendData> => {
      const today = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(today, 6 - i), 'yyyy-MM-dd'));
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(today, 5 - i);
        return {
          start: format(startOfMonth(date), 'yyyy-MM-dd'),
          end: format(endOfMonth(date), 'yyyy-MM-dd'),
          label: format(date, 'MMM'),
        };
      });

      // Fetch attendance for last 7 days
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('date, status')
        .in('date', last7Days);

      // Fetch payments for last 6 months
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('payment_date, amount')
        .gte('payment_date', last6Months[0].start);

      // Fetch students for enrollment trend
      const { data: studentsData } = await supabase
        .from('students')
        .select('enrollment_date')
        .eq('is_active', true);

      // Process attendance trend
      const attendanceTrend = last7Days.map(date => {
        const dayRecords = attendanceData?.filter(a => a.date === date) || [];
        const present = dayRecords.filter(a => a.status === 'present').length;
        const total = dayRecords.length;
        return {
          date: format(new Date(date), 'EEE'),
          rate: total > 0 ? Math.round((present / total) * 100) : 0,
        };
      });

      // Process fee collection trend
      const feeCollectionTrend = last6Months.map(({ start, end, label }) => {
        const monthPayments = paymentsData?.filter(p => {
          const paymentDate = p.payment_date.split('T')[0];
          return paymentDate >= start && paymentDate <= end;
        }) || [];
        return {
          month: label,
          amount: monthPayments.reduce((sum, p) => sum + Number(p.amount), 0),
        };
      });

      // Process enrollment trend
      const enrollmentTrend = last6Months.map(({ start, end, label }) => {
        const enrolled = studentsData?.filter(s => {
          return s.enrollment_date && s.enrollment_date <= end;
        }).length || 0;
        return {
          month: label,
          count: enrolled,
        };
      });

      return {
        attendanceTrend,
        feeCollectionTrend,
        enrollmentTrend,
      };
    },
    refetchInterval: 60000,
  });
};
