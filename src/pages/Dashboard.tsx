import { useAuth } from '@/contexts/AuthContext';
import { OwnerDashboard } from '@/components/dashboard/OwnerDashboard';
import { AccountsDashboard } from '@/components/dashboard/AccountsDashboard';
import { TeachingStaffDashboard } from '@/components/dashboard/TeachingStaffDashboard';
import { NonTeachingStaffDashboard } from '@/components/dashboard/NonTeachingStaffDashboard';
import { StudentParentDashboard } from '@/components/dashboard/StudentParentDashboard';

const Dashboard = () => {
  const { roles, profile } = useAuth();

  // Render dashboard based on primary role
  const primaryRole = roles[0];

  const getDashboard = () => {
    switch (primaryRole) {
      case 'owner':
        return <OwnerDashboard />;
      case 'accounts':
        return <AccountsDashboard />;
      case 'teaching_staff':
        return <TeachingStaffDashboard />;
      case 'non_teaching_staff':
        return <NonTeachingStaffDashboard />;
      case 'student_parent':
        return <StudentParentDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold">Welcome, {profile?.first_name}!</h2>
            <p className="text-muted-foreground mt-2">
              Your role has not been configured yet. Please contact an administrator.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="animate-fade-in">
      {getDashboard()}
    </div>
  );
};

export default Dashboard;
