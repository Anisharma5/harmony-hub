import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useHolidays } from '@/hooks/useHolidays';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2, Trash2, Calendar } from 'lucide-react';

export default function Holidays() {
  const { isOwner } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    name: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    is_recurring: false,
  });

  const { holidays, isLoading, addHoliday, deleteHoliday } = useHolidays();

  const handleAddHoliday = () => {
    if (!newHoliday.name || !newHoliday.date) return;

    addHoliday.mutate(newHoliday, {
      onSuccess: () => {
        setIsAddOpen(false);
        setNewHoliday({
          name: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          description: '',
          is_recurring: false,
        });
      },
    });
  };

  const upcomingHolidays = holidays.filter(h => new Date(h.date) >= new Date());
  const pastHolidays = holidays.filter(h => new Date(h.date) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Holidays</h1>
          <p className="text-muted-foreground">Manage school holidays and calendar</p>
        </div>
        {isOwner() && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Holiday
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Holiday</DialogTitle>
                <DialogDescription>Add a new holiday to the calendar</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input
                    value={newHoliday.name}
                    onChange={e => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Christmas Day"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newHoliday.date}
                    onChange={e => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Description (Optional)</Label>
                  <Input
                    value={newHoliday.description}
                    onChange={e => setNewHoliday(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional details"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recurring"
                    checked={newHoliday.is_recurring}
                    onCheckedChange={checked => 
                      setNewHoliday(prev => ({ ...prev, is_recurring: !!checked }))
                    }
                  />
                  <label
                    htmlFor="recurring"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Recurring annually
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddHoliday} disabled={addHoliday.isPending}>
                  {addHoliday.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Holiday
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Holidays</CardTitle>
              <CardDescription>Holidays scheduled for this year</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingHolidays.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Recurring</TableHead>
                      {isOwner() && <TableHead className="w-12"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingHolidays.map(holiday => (
                      <TableRow key={holiday.id}>
                        <TableCell className="font-medium">
                          {format(new Date(holiday.date), 'EEE, MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{holiday.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {holiday.description || '-'}
                        </TableCell>
                        <TableCell>
                          {holiday.is_recurring ? 'Yes' : 'No'}
                        </TableCell>
                        {isOwner() && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteHoliday.mutate(holiday.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No upcoming holidays scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>

          {pastHolidays.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Past Holidays</CardTitle>
                <CardDescription>Holidays that have already passed</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Recurring</TableHead>
                      {isOwner() && <TableHead className="w-12"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastHolidays.map(holiday => (
                      <TableRow key={holiday.id} className="opacity-60">
                        <TableCell className="font-medium">
                          {format(new Date(holiday.date), 'EEE, MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{holiday.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {holiday.description || '-'}
                        </TableCell>
                        <TableCell>
                          {holiday.is_recurring ? 'Yes' : 'No'}
                        </TableCell>
                        {isOwner() && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteHoliday.mutate(holiday.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
