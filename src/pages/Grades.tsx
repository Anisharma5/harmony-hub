import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useGrades } from '@/hooks/useGrades';
import { useSections, useSubjects } from '@/hooks/useClasses';
import { useStudents } from '@/hooks/useStudents';
import { Plus, Loader2 } from 'lucide-react';

const EXAM_TYPES = ['Unit Test', 'Mid Term', 'Final Exam', 'Quiz', 'Assignment', 'Project'];

export default function Grades() {
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newGrade, setNewGrade] = useState({
    student_id: '',
    exam_type: '',
    max_marks: 100,
    obtained_marks: 0,
    grade: '',
    remarks: '',
    exam_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data: sections = [], isLoading: sectionsLoading } = useSections();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { grades, isLoading: gradesLoading, addGrade } = useGrades(selectedSection, selectedSubject);

  const sectionStudents = students.filter(s => s.section_id === selectedSection);

  const handleAddGrade = () => {
    if (!selectedSection || !selectedSubject || !newGrade.student_id || !newGrade.exam_type) return;

    addGrade.mutate({
      ...newGrade,
      section_id: selectedSection,
      subject_id: selectedSubject,
    }, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        setNewGrade({
          student_id: '',
          exam_type: '',
          max_marks: 100,
          obtained_marks: 0,
          grade: '',
          remarks: '',
          exam_date: format(new Date(), 'yyyy-MM-dd'),
        });
      },
    });
  };

  const calculateGrade = (obtained: number, max: number): string => {
    const percentage = (obtained / max) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const isLoading = sectionsLoading || subjectsLoading || studentsLoading || gradesLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grades</h1>
          <p className="text-muted-foreground">Manage student grades and assessments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedSection || !selectedSubject}>
              <Plus className="mr-2 h-4 w-4" />
              Add Grade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Grade</DialogTitle>
              <DialogDescription>Enter the grade details for a student</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Student</Label>
                <Select
                  value={newGrade.student_id}
                  onValueChange={value => setNewGrade(prev => ({ ...prev, student_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionStudents.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.student_code} - {student.profile?.first_name} {student.profile?.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Exam Type</Label>
                <Select
                  value={newGrade.exam_type}
                  onValueChange={value => setNewGrade(prev => ({ ...prev, exam_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Max Marks</Label>
                  <Input
                    type="number"
                    value={newGrade.max_marks}
                    onChange={e => setNewGrade(prev => ({ ...prev, max_marks: Number(e.target.value) }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Obtained Marks</Label>
                  <Input
                    type="number"
                    value={newGrade.obtained_marks}
                    onChange={e => {
                      const obtained = Number(e.target.value);
                      setNewGrade(prev => ({
                        ...prev,
                        obtained_marks: obtained,
                        grade: calculateGrade(obtained, prev.max_marks),
                      }));
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Exam Date</Label>
                <Input
                  type="date"
                  value={newGrade.exam_date}
                  onChange={e => setNewGrade(prev => ({ ...prev, exam_date: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Remarks (Optional)</Label>
                <Input
                  value={newGrade.remarks}
                  onChange={e => setNewGrade(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Any additional comments"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddGrade} disabled={addGrade.isPending}>
                {addGrade.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Grade
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grade Records</CardTitle>
          <CardDescription>Filter by section and subject</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <div className="w-64">
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(section => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-64">
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : grades.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Exam Type</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map(grade => (
                  <TableRow key={grade.id}>
                    <TableCell className="font-medium">
                      {grade.students?.student_code}
                    </TableCell>
                    <TableCell>{grade.exam_type}</TableCell>
                    <TableCell>
                      {grade.obtained_marks} / {grade.max_marks}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{grade.grade}</span>
                    </TableCell>
                    <TableCell>{format(new Date(grade.exam_date), 'PP')}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {grade.remarks || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {selectedSection && selectedSubject
                ? 'No grades found for this section and subject'
                : 'Select a section and subject to view grades'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
