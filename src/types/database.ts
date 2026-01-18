export type AppRole = 'owner' | 'accounts' | 'teaching_staff' | 'non_teaching_staff' | 'student_parent';

export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  student_code: string;
  section_id?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  enrollment_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  user_id: string;
  staff_code: string;
  department?: string;
  designation?: string;
  subjects?: string[];
  employment_date: string;
  salary?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  academic_year: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: string;
  class_id: string;
  name: string;
  capacity: number;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  section_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
  marked_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  section_id: string;
  exam_type: string;
  max_marks: number;
  obtained_marks: number;
  grade?: string;
  remarks?: string;
  graded_by?: string;
  exam_date: string;
  created_at: string;
  updated_at: string;
}

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

export interface Notice {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  target_roles?: AppRole[];
  target_classes?: string[];
  created_by: string;
  expires_at?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description?: string;
  is_recurring: boolean;
  created_at: string;
}

export interface TimetableSlot {
  id: string;
  section_id: string;
  subject_id: string;
  staff_id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  email_fee_reminders: boolean;
  email_attendance_alerts: boolean;
  email_announcements: boolean;
  sms_fee_reminders: boolean;
  sms_attendance_alerts: boolean;
  sms_urgent_announcements: boolean;
  created_at: string;
  updated_at: string;
}

// Role display helpers
export const roleLabels: Record<AppRole, string> = {
  owner: 'Owner / Chairman',
  accounts: 'Accounts Department',
  teaching_staff: 'Teaching Staff',
  non_teaching_staff: 'Non-Teaching Staff',
  student_parent: 'Student / Parent',
};

export const roleColors: Record<AppRole, string> = {
  owner: 'bg-owner text-owner-foreground',
  accounts: 'bg-accounts text-accounts-foreground',
  teaching_staff: 'bg-teaching text-teaching-foreground',
  non_teaching_staff: 'bg-non-teaching text-non-teaching-foreground',
  student_parent: 'bg-student text-student-foreground',
};
