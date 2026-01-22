import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useNotices } from '@/hooks/useNotices';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2, Trash2, Bell, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { roleLabels, AppRole } from '@/types/database';

const PRIORITIES = [
  { value: 'low', label: 'Low', icon: Info, color: 'bg-muted text-muted-foreground' },
  { value: 'normal', label: 'Normal', icon: Bell, color: 'bg-secondary text-secondary-foreground' },
  { value: 'high', label: 'High', icon: AlertCircle, color: 'bg-primary text-primary-foreground' },
  { value: 'urgent', label: 'Urgent', icon: AlertTriangle, color: 'bg-destructive text-destructive-foreground' },
];

const ALL_ROLES: AppRole[] = ['owner', 'accounts', 'teaching_staff', 'non_teaching_staff', 'student_parent'];

export default function Notices() {
  const { isStaff, isOwner } = useAuth();
  const canManage = isStaff() || isOwner();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    priority: 'normal',
    target_roles: [] as string[],
    expires_at: '',
    is_published: true,
  });

  const { notices, isLoading, addNotice, deleteNotice } = useNotices();

  const handleAddNotice = () => {
    if (!newNotice.title || !newNotice.content) return;

    addNotice.mutate({
      ...newNotice,
      expires_at: newNotice.expires_at || undefined,
      target_roles: newNotice.target_roles.length > 0 ? newNotice.target_roles : undefined,
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        setNewNotice({
          title: '',
          content: '',
          priority: 'normal',
          target_roles: [],
          expires_at: '',
          is_published: true,
        });
      },
    });
  };

  const getPriorityConfig = (priority: string) => {
    return PRIORITIES.find(p => p.value === priority) || PRIORITIES[1];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notices & Announcements</h1>
          <p className="text-muted-foreground">Manage school notices and announcements</p>
        </div>
        {canManage && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Notice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Notice</DialogTitle>
                <DialogDescription>Create a new announcement for the school</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Input
                    value={newNotice.title}
                    onChange={e => setNewNotice(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Notice title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Content</Label>
                  <Textarea
                    value={newNotice.content}
                    onChange={e => setNewNotice(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your announcement here..."
                    rows={5}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Priority</Label>
                    <Select
                      value={newNotice.priority}
                      onValueChange={value => setNewNotice(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map(priority => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <div className="flex items-center gap-2">
                              <priority.icon className="h-4 w-4" />
                              {priority.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Expires At (Optional)</Label>
                    <Input
                      type="datetime-local"
                      value={newNotice.expires_at}
                      onChange={e => setNewNotice(prev => ({ ...prev, expires_at: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Target Audience (Leave empty for all)</Label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_ROLES.map(role => (
                      <Button
                        key={role}
                        type="button"
                        size="sm"
                        variant={newNotice.target_roles.includes(role) ? 'default' : 'outline'}
                        onClick={() => {
                          setNewNotice(prev => ({
                            ...prev,
                            target_roles: prev.target_roles.includes(role)
                              ? prev.target_roles.filter(r => r !== role)
                              : [...prev.target_roles, role],
                          }));
                        }}
                      >
                        {roleLabels[role]}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddNotice} disabled={addNotice.isPending}>
                  {addNotice.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Publish Notice
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
      ) : notices.length > 0 ? (
        <div className="grid gap-4">
          {notices.map(notice => {
            const priorityConfig = getPriorityConfig(notice.priority);
            const PriorityIcon = priorityConfig.icon;

            return (
              <Card key={notice.id} className="overflow-hidden">
                <div className={`h-1 ${priorityConfig.color.split(' ')[0]}`} />
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={priorityConfig.color}>
                        <PriorityIcon className="mr-1 h-3 w-3" />
                        {priorityConfig.label}
                      </Badge>
                      {!notice.is_published && (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{notice.title}</CardTitle>
                    <CardDescription>
                      Posted on {format(new Date(notice.created_at), 'PPP')}
                      {notice.expires_at && (
                        <> • Expires {format(new Date(notice.expires_at), 'PPP')}</>
                      )}
                    </CardDescription>
                  </div>
                  {isOwner() && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteNotice.mutate(notice.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{notice.content}</p>
                  {notice.target_roles && notice.target_roles.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1">
                      <span className="text-sm text-muted-foreground mr-2">For:</span>
                      {notice.target_roles.map(role => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {roleLabels[role as AppRole]}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No notices yet</h3>
            <p className="text-muted-foreground">
              {canManage ? 'Create your first notice to get started' : 'Check back later for announcements'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
