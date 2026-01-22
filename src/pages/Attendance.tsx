import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAttendance } from '@/hooks/useAttendance';
import { useSections } from '@/hooks/useClasses';
import { useStudents } from '@/hooks/useStudents';
import { CalendarIcon, Check, X, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

const statusConfig: Record<AttendanceStatus, { label: string; icon: React.ReactNode; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
  present: { label: 'Present', icon: <Check className="h-4 w-4" />, variant: 'default' },
  absent: { label: 'Absent', icon: <X className="h-4 w-4" />, variant: 'destructive' },
  late: { label: 'Late', icon: <Clock className="h-4 w-4" />, variant: 'secondary' },
  excused: { label: 'Excused', icon: <AlertCircle className="h-4 w-4" />, variant: 'outline' },
};

export default function Attendance() {
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});

  const { data: sections = [], isLoading: sectionsLoading } = useSections();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { attendance, isLoading: attendanceLoading, markAttendance } = useAttendance(
    selectedSection,
    selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined
  );

  const sectionStudents = students.filter(s => s.section_id === selectedSection);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmitAttendance = () => {
    if (!selectedSection || !selectedDate) return;

    const records = Object.entries(attendanceRecords).map(([student_id, status]) => ({
      student_id,
      section_id: selectedSection,
      date: format(selectedDate, 'yyyy-MM-dd'),
      status,
    }));

    if (records.length > 0) {
      markAttendance.mutate(records);
    }
  };

  const getExistingStatus = (studentId: string): AttendanceStatus | undefined => {
    const record = attendance.find(a => a.student_id === studentId);
    return record?.status as AttendanceStatus | undefined;
  };

  const isLoading = sectionsLoading || studentsLoading || attendanceLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">Mark and manage student attendance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <CardDescription>Select a section and date to mark attendance</CardDescription>
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

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-64 justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedSection && sectionStudents.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionStudents.map(student => {
                    const currentStatus = attendanceRecords[student.id] || getExistingStatus(student.id);
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.student_code}</TableCell>
                        <TableCell>
                          {student.profile?.first_name} {student.profile?.last_name}
                        </TableCell>
                        <TableCell>
                          {currentStatus && (
                            <Badge variant={statusConfig[currentStatus].variant}>
                              {statusConfig[currentStatus].icon}
                              <span className="ml-1">{statusConfig[currentStatus].label}</span>
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {(Object.keys(statusConfig) as AttendanceStatus[]).map(status => (
                              <Button
                                key={status}
                                size="sm"
                                variant={currentStatus === status ? 'default' : 'outline'}
                                onClick={() => handleStatusChange(student.id, status)}
                              >
                                {statusConfig[status].icon}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitAttendance}
                  disabled={Object.keys(attendanceRecords).length === 0 || markAttendance.isPending}
                >
                  {markAttendance.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Attendance
                </Button>
              </div>
            </>
          ) : selectedSection ? (
            <p className="text-center text-muted-foreground py-8">
              No students found in this section
            </p>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Select a section to view students
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
