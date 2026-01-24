import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { UserPlus, CreditCard, ClipboardList, Bell, Calendar, GraduationCap } from 'lucide-react';

const actions = [
  {
    title: 'Add Student',
    description: 'Enroll a new student',
    icon: UserPlus,
    path: '/students',
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Record Payment',
    description: 'Process fee payment',
    icon: CreditCard,
    path: '/payments',
    color: 'bg-chart-2/10 text-chart-2',
  },
  {
    title: 'Mark Attendance',
    description: 'Daily attendance',
    icon: ClipboardList,
    path: '/attendance',
    color: 'bg-chart-3/10 text-chart-3',
  },
  {
    title: 'Add Notice',
    description: 'Post announcement',
    icon: Bell,
    path: '/notices',
    color: 'bg-chart-4/10 text-chart-4',
  },
  {
    title: 'View Timetable',
    description: 'Class schedules',
    icon: Calendar,
    path: '/timetable',
    color: 'bg-chart-5/10 text-chart-5',
  },
  {
    title: 'Enter Grades',
    description: 'Record exam results',
    icon: GraduationCap,
    path: '/grades',
    color: 'bg-accent/50 text-accent-foreground',
  },
];

export const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Quick Actions</h2>
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {actions.map((action) => (
          <Card
            key={action.title}
            className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md group"
            onClick={() => navigate(action.path)}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className={`p-3 rounded-full ${action.color} transition-transform group-hover:scale-110`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
