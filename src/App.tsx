import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import StudentsPage from "./pages/Students";
import StaffPage from "./pages/Staff";
import ClassesPage from "./pages/Classes";
import AttendancePage from "./pages/Attendance";
import GradesPage from "./pages/Grades";
import TimetablePage from "./pages/Timetable";
import FeesPage from "./pages/Fees";
import PaymentsPage from "./pages/Payments";
import NoticesPage from "./pages/Notices";
import HolidaysPage from "./pages/Holidays";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/staff" element={<StaffPage />} />
              <Route path="/classes" element={<ClassesPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/grades" element={<GradesPage />} />
              <Route path="/timetable" element={<TimetablePage />} />
              <Route path="/fees" element={<FeesPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/notices" element={<NoticesPage />} />
              <Route path="/holidays" element={<HolidaysPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
