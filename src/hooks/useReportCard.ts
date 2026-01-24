import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReportCardData {
  student: {
    id: string;
    studentCode: string;
    name: string;
    className: string;
    sectionName: string;
    enrollmentDate: string;
    parentName: string | null;
  };
  grades: {
    subjectName: string;
    subjectCode: string;
    examType: string;
    maxMarks: number;
    obtainedMarks: number;
    percentage: number;
    grade: string;
  }[];
  attendance: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    attendancePercentage: number;
  };
  summary: {
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
    overallGrade: string;
  };
}

const calculateGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

export const useReportCard = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ['report-card', studentId],
    queryFn: async (): Promise<ReportCardData | null> => {
      if (!studentId) return null;

      // Fetch student details
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          student_code,
          enrollment_date,
          parent_name,
          section:sections(
            id,
            name,
            class:classes(id, name)
          )
        `)
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // Fetch student profile
      const { data: studentData } = await supabase
        .from('students')
        .select('user_id')
        .eq('id', studentId)
        .single();

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', studentData?.user_id)
        .single();

      // Fetch grades for this student
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select(`
          *,
          subjects(id, name, code)
        `)
        .eq('student_id', studentId)
        .order('exam_date', { ascending: false });

      if (gradesError) throw gradesError;

      // Fetch attendance records
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', studentId);

      if (attendanceError) throw attendanceError;

      // Process grades
      const processedGrades = (grades || []).map(g => ({
        subjectName: g.subjects?.name || 'Unknown',
        subjectCode: g.subjects?.code || '',
        examType: g.exam_type,
        maxMarks: Number(g.max_marks),
        obtainedMarks: Number(g.obtained_marks),
        percentage: Math.round((Number(g.obtained_marks) / Number(g.max_marks)) * 100),
        grade: g.grade || calculateGrade((Number(g.obtained_marks) / Number(g.max_marks)) * 100),
      }));

      // Calculate attendance
      const totalDays = attendance?.length || 0;
      const presentDays = attendance?.filter(a => a.status === 'present').length || 0;
      const absentDays = attendance?.filter(a => a.status === 'absent').length || 0;
      const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      // Calculate summary
      const totalMarks = processedGrades.reduce((sum, g) => sum + g.maxMarks, 0);
      const obtainedMarks = processedGrades.reduce((sum, g) => sum + g.obtainedMarks, 0);
      const overallPercentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;

      const section = student.section as { id: string; name: string; class: { id: string; name: string } } | null;

      return {
        student: {
          id: student.id,
          studentCode: student.student_code,
          name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
          className: section?.class?.name || 'N/A',
          sectionName: section?.name || 'N/A',
          enrollmentDate: student.enrollment_date,
          parentName: student.parent_name,
        },
        grades: processedGrades,
        attendance: {
          totalDays,
          presentDays,
          absentDays,
          attendancePercentage,
        },
        summary: {
          totalMarks,
          obtainedMarks,
          percentage: overallPercentage,
          overallGrade: calculateGrade(overallPercentage),
        },
      };
    },
    enabled: !!studentId,
  });
};
