import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useDashboardTrends } from '@/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, DollarSign, Users } from 'lucide-react';

const chartConfig = {
  rate: {
    label: 'Attendance Rate',
    color: 'hsl(var(--primary))',
  },
  amount: {
    label: 'Collection',
    color: 'hsl(var(--chart-2))',
  },
  count: {
    label: 'Students',
    color: 'hsl(var(--chart-3))',
  },
};

export const DashboardCharts = () => {
  const { data: trends, isLoading } = useDashboardTrends();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Attendance Trend Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Attendance Trend</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <AreaChart data={trends?.attendanceTrend || []}>
              <defs>
                <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                className="fill-muted-foreground"
              />
              <ChartTooltip 
                content={<ChartTooltipContent formatter={(value) => [`${value}%`, 'Rate']} />} 
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#attendanceGradient)"
              />
            </AreaChart>
          </ChartContainer>
          <p className="text-xs text-muted-foreground mt-2">Last 7 days attendance rate</p>
        </CardContent>
      </Card>

      {/* Fee Collection Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Fee Collection</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={trends?.feeCollectionTrend || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                className="fill-muted-foreground"
              />
              <ChartTooltip 
                content={<ChartTooltipContent formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Collected']} />} 
              />
              <Bar
                dataKey="amount"
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
          <p className="text-xs text-muted-foreground mt-2">Last 6 months collection</p>
        </CardContent>
      </Card>

      {/* Enrollment Trend Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Student Enrollment</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <LineChart data={trends?.enrollmentTrend || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <ChartTooltip 
                content={<ChartTooltipContent formatter={(value) => [value, 'Students']} />} 
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 2 }}
              />
            </LineChart>
          </ChartContainer>
          <p className="text-xs text-muted-foreground mt-2">Cumulative enrollment over 6 months</p>
        </CardContent>
      </Card>
    </div>
  );
};
