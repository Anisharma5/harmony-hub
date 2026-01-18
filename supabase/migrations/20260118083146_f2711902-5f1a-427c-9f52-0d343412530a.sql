-- Create role enum for the school management system
CREATE TYPE public.app_role AS ENUM ('owner', 'accounts', 'teaching_staff', 'non_teaching_staff', 'student_parent');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create classes table
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Create sections table
CREATE TABLE public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    capacity INTEGER DEFAULT 40,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

-- Create staff table
CREATE TABLE public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    staff_code TEXT UNIQUE NOT NULL,
    department TEXT,
    designation TEXT,
    subjects TEXT[],
    employment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    salary DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Create section_teachers junction table
CREATE TABLE public.section_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
    subject TEXT,
    is_class_teacher BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(section_id, staff_id, subject)
);

ALTER TABLE public.section_teachers ENABLE ROW LEVEL SECURITY;

-- Create students table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    student_code TEXT UNIQUE NOT NULL,
    section_id UUID REFERENCES public.sections(id),
    parent_name TEXT,
    parent_email TEXT,
    parent_phone TEXT,
    date_of_birth DATE,
    gender TEXT,
    blood_group TEXT,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create attendance table
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    remarks TEXT,
    marked_by UUID REFERENCES public.staff(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(student_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create subjects table
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Create grades table
CREATE TABLE public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
    exam_type TEXT NOT NULL,
    max_marks DECIMAL(5,2) NOT NULL,
    obtained_marks DECIMAL(5,2) NOT NULL,
    grade TEXT,
    remarks TEXT,
    graded_by UUID REFERENCES public.staff(id),
    exam_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Create fee_types table
CREATE TABLE public.fee_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly', 'one-time')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fee_types ENABLE ROW LEVEL SECURITY;

-- Create fees table
CREATE TABLE public.fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    fee_type_id UUID REFERENCES public.fee_types(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

-- Create payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_id UUID REFERENCES public.fees(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'online')),
    transaction_id TEXT,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    receipt_number TEXT UNIQUE,
    notes TEXT,
    processed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create notices table
CREATE TABLE public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    target_roles app_role[],
    target_classes UUID[],
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Create holidays table
CREATE TABLE public.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Create timetable_slots table
CREATE TABLE public.timetable_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;

-- Create notification_preferences table
CREATE TABLE public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email_fee_reminders BOOLEAN DEFAULT true,
    email_attendance_alerts BOOLEAN DEFAULT true,
    email_announcements BOOLEAN DEFAULT true,
    sms_fee_reminders BOOLEAN DEFAULT false,
    sms_attendance_alerts BOOLEAN DEFAULT false,
    sms_urgent_announcements BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check if user is owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'owner')
$$;

-- Check if user is owner or accounts
CREATE OR REPLACE FUNCTION public.is_finance_role()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'accounts')
$$;

-- Check if user is teaching staff
CREATE OR REPLACE FUNCTION public.is_teaching_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'teaching_staff')
$$;

-- Check if user is any staff member
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'owner') 
    OR public.has_role(auth.uid(), 'accounts')
    OR public.has_role(auth.uid(), 'teaching_staff')
    OR public.has_role(auth.uid(), 'non_teaching_staff')
$$;

-- Get user's student ID if they are a student
CREATE OR REPLACE FUNCTION public.get_user_student_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = auth.uid()
$$;

-- Get user's staff ID if they are staff
CREATE OR REPLACE FUNCTION public.get_user_staff_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.staff WHERE user_id = auth.uid()
$$;

-- Check if teaching staff teaches a specific section
CREATE OR REPLACE FUNCTION public.teaches_section(_section_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.section_teachers st
    JOIN public.staff s ON st.staff_id = s.id
    WHERE st.section_id = _section_id
      AND s.user_id = auth.uid()
  )
$$;

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- RLS POLICIES
-- ============================================

-- User Roles policies
CREATE POLICY "Owners can manage all roles"
ON public.user_roles FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Profiles policies
CREATE POLICY "Owners can manage all profiles"
ON public.profiles FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_staff());

-- Classes policies
CREATE POLICY "Owners can manage classes"
ON public.classes FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

CREATE POLICY "Authenticated users can view classes"
ON public.classes FOR SELECT
TO authenticated
USING (true);

-- Sections policies
CREATE POLICY "Owners can manage sections"
ON public.sections FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

CREATE POLICY "Authenticated users can view sections"
ON public.sections FOR SELECT
TO authenticated
USING (true);

-- Staff policies
CREATE POLICY "Owners can manage staff"
ON public.staff FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

CREATE POLICY "Staff can view all staff"
ON public.staff FOR SELECT
USING (public.is_staff());

CREATE POLICY "Staff can update own record"
ON public.staff FOR UPDATE
USING (auth.uid() = user_id);

-- Section Teachers policies
CREATE POLICY "Owners can manage section teachers"
ON public.section_teachers FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

CREATE POLICY "Staff can view section teachers"
ON public.section_teachers FOR SELECT
USING (public.is_staff());

-- Students policies
CREATE POLICY "Owners can manage students"
ON public.students FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

CREATE POLICY "Finance can manage students"
ON public.students FOR ALL
USING (public.is_finance_role())
WITH CHECK (public.is_finance_role());

CREATE POLICY "Staff can view students"
ON public.students FOR SELECT
USING (public.is_staff());

CREATE POLICY "Students can view own record"
ON public.students FOR SELECT
USING (auth.uid() = user_id);

-- Subjects policies
CREATE POLICY "Owners can manage subjects"
ON public.subjects FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

CREATE POLICY "Authenticated users can view subjects"
ON public.subjects FOR SELECT
TO authenticated
USING (true);

-- Attendance policies
CREATE POLICY "Owners can manage attendance"
ON public.attendance FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

CREATE POLICY "Teaching staff can manage attendance for their sections"
ON public.attendance FOR ALL
USING (public.teaches_section(section_id))
WITH CHECK (public.teaches_section(section_id));

CREATE POLICY "Students can view own attendance"
ON public.attendance FOR SELECT
USING (student_id = public.get_user_student_id());

CREATE POLICY "Staff can view all attendance"
ON public.attendance FOR SELECT
USING (public.is_staff());

-- Grades policies
CREATE POLICY "Owners can manage grades"
ON public.grades FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

CREATE POLICY "Teaching staff can manage grades for their sections"
ON public.grades FOR ALL
USING (public.teaches_section(section_id))
WITH CHECK (public.teaches_section(section_id));

CREATE POLICY "Students can view own grades"
ON public.grades FOR SELECT
USING (student_id = public.get_user_student_id());

CREATE POLICY "Staff can view all grades"
ON public.grades FOR SELECT
USING (public.is_staff());

-- Fee Types policies
CREATE POLICY "Owners can manage fee types"
ON public.fee_types FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

CREATE POLICY "Finance can manage fee types"
ON public.fee_types FOR ALL
USING (public.is_finance_role())
WITH CHECK (public.is_finance_role());

CREATE POLICY "Authenticated users can view fee types"
ON public.fee_types FOR SELECT
TO authenticated
USING (true);

-- Fees policies
CREATE POLICY "Owners can manage fees"
ON public.fees FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

CREATE POLICY "Finance can manage fees"
ON public.fees FOR ALL
USING (public.is_finance_role())
WITH CHECK (public.is_finance_role());

CREATE POLICY "Students can view own fees"
ON public.fees FOR SELECT
USING (student_id = public.get_user_student_id());

-- Payments policies
CREATE POLICY "Owners can manage payments"
ON public.payments FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

CREATE POLICY "Finance can manage payments"
ON public.payments FOR ALL
USING (public.is_finance_role())
WITH CHECK (public.is_finance_role());

CREATE POLICY "Students can view own payments"
ON public.payments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.fees f
  WHERE f.id = fee_id AND f.student_id = public.get_user_student_id()
));

-- Notices policies
CREATE POLICY "Owners can manage notices"
ON public.notices FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

CREATE POLICY "Staff can create notices"
ON public.notices FOR INSERT
WITH CHECK (public.is_staff());

CREATE POLICY "Authenticated users can view published notices"
ON public.notices FOR SELECT
TO authenticated
USING (is_published = true AND (expires_at IS NULL OR expires_at > now()));

-- Holidays policies
CREATE POLICY "Owners can manage holidays"
ON public.holidays FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

CREATE POLICY "Authenticated users can view holidays"
ON public.holidays FOR SELECT
TO authenticated
USING (true);

-- Timetable policies
CREATE POLICY "Owners can manage timetable"
ON public.timetable_slots FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

CREATE POLICY "Authenticated users can view timetable"
ON public.timetable_slots FOR SELECT
TO authenticated
USING (true);

-- Notification Preferences policies
CREATE POLICY "Users can manage own preferences"
ON public.notification_preferences FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can view all preferences"
ON public.notification_preferences FOR SELECT
USING (public.is_owner());

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sections_updated_at
BEFORE UPDATE ON public.sections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grades_updated_at
BEFORE UPDATE ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fees_updated_at
BEFORE UPDATE ON public.fees
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notices_updated_at
BEFORE UPDATE ON public.notices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();