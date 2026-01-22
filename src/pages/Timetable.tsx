import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTimetable, DAYS_OF_WEEK } from '@/hooks/useTimetable';
import { useSections, useSubjects } from '@/hooks/useClasses';
import { useStaff } from '@/hooks/useStaff';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Timetable() {
  const { isOwner } = useAuth();
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    subject_id: '',
    staff_id: '',
    day_of_week: 1,
    start_time: '09:00',
    end_time: '10:00',
  });

  const { data: sections = [], isLoading: sectionsLoading } = useSections();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: staff = [], isLoading: staffLoading } = useStaff();
  const { slots, isLoading: timetableLoading, addSlot, deleteSlot } = useTimetable(selectedSection);

  const handleAddSlot = () => {
    if (!selectedSection || !newSlot.subject_id) return;

    addSlot.mutate({
      ...newSlot,
      section_id: selectedSection,
      staff_id: newSlot.staff_id || undefined,
    }, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        setNewSlot({
          subject_id: '',
          staff_id: '',
          day_of_week: 1,
          start_time: '09:00',
          end_time: '10:00',
        });
      },
    });
  };

  const groupedSlots = slots.reduce((acc, slot) => {
    const day = slot.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {} as Record<number, typeof slots>);

  const isLoading = sectionsLoading || subjectsLoading || staffLoading || timetableLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timetable</h1>
          <p className="text-muted-foreground">View and manage class schedules</p>
        </div>
        {isOwner() && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!selectedSection}>
                <Plus className="mr-2 h-4 w-4" />
                Add Slot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Timetable Slot</DialogTitle>
                <DialogDescription>Add a new class slot to the timetable</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Day</Label>
                  <Select
                    value={String(newSlot.day_of_week)}
                    onValueChange={value => setNewSlot(prev => ({ ...prev, day_of_week: Number(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day, index) => (
                        <SelectItem key={index} value={String(index)}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Subject</Label>
                  <Select
                    value={newSlot.subject_id}
                    onValueChange={value => setNewSlot(prev => ({ ...prev, subject_id: value }))}
                  >
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
                <div className="grid gap-2">
                  <Label>Teacher (Optional)</Label>
                  <Select
                    value={newSlot.staff_id}
                    onValueChange={value => setNewSlot(prev => ({ ...prev, staff_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.staff_code} - {s.profile?.first_name} {s.profile?.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={newSlot.start_time}
                      onChange={e => setNewSlot(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={newSlot.end_time}
                      onChange={e => setNewSlot(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSlot} disabled={addSlot.isPending}>
                  {addSlot.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Slot
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>Select a section to view its timetable</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedSection ? (
            <div className="grid gap-4">
              {DAYS_OF_WEEK.map((day, index) => {
                const daySlots = groupedSlots[index] || [];
                if (daySlots.length === 0 && index === 0) return null; // Skip Sunday if empty
                
                return (
                  <div key={day} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">{day}</h3>
                    {daySlots.length > 0 ? (
                      <div className="grid gap-2">
                        {daySlots.map(slot => (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between bg-muted/50 rounded-md p-3"
                          >
                            <div>
                              <p className="font-medium">{slot.subjects?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                {slot.staff && ` • ${slot.staff.staff_code}`}
                              </p>
                            </div>
                            {isOwner() && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteSlot.mutate(slot.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No classes scheduled</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Select a section to view its timetable
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
