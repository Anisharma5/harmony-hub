import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GradeRecord {
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
  students?: {
    id: string;
    student_code: string;
  };
  subjects?: {
    id: string;
    name: string;
    code: string;
  };
}

export function useGrades(sectionId?: string, subjectId?: string) {
  const queryClient = useQueryClient();

  const gradesQuery = useQuery({
    queryKey: ['grades', sectionId, subjectId],
    queryFn: async () => {
      let query = supabase
        .from('grades')
        .select(`
          *,
          students (
            id,
            student_code,
            user_id
          ),
          subjects (
            id,
            name,
            code
          )
        `)
        .order('exam_date', { ascending: false });

      if (sectionId) {
        query = query.eq('section_id', sectionId);
      }
      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GradeRecord[];
    },
  });

  const addGrade = useMutation({
    mutationFn: async (grade: {
      student_id: string;
      subject_id: string;
      section_id: string;
      exam_type: string;
      max_marks: number;
      obtained_marks: number;
      grade?: string;
      remarks?: string;
      exam_date: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('grades').insert({
        ...grade,
        graded_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Grade added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateGrade = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GradeRecord> & { id: string }) => {
      const { error } = await supabase
        .from('grades')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Grade updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    grades: gradesQuery.data ?? [],
    isLoading: gradesQuery.isLoading,
    error: gradesQuery.error,
    addGrade,
    updateGrade,
  };
}
