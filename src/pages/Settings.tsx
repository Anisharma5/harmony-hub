import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { User, Bell, Shield, Save, Loader2 } from 'lucide-react';

interface NotificationPreferences {
  email_fee_reminders: boolean;
  email_attendance_alerts: boolean;
  email_announcements: boolean;
  sms_fee_reminders: boolean;
  sms_attendance_alerts: boolean;
  sms_urgent_announcements: boolean;
}

const Settings = () => {
  const { profile, user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  // Profile form state
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
  });

  // Notification preferences state
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    email_fee_reminders: true,
    email_attendance_alerts: true,
    email_announcements: true,
    sms_fee_reminders: false,
    sms_attendance_alerts: false,
    sms_urgent_announcements: true,
  });

  // Load profile data
  useEffect(() => {
    if (profile) {
      setProfileData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  // Load notification preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading preferences:', error);
        }

        if (data) {
          setNotifications({
            email_fee_reminders: data.email_fee_reminders ?? true,
            email_attendance_alerts: data.email_attendance_alerts ?? true,
            email_announcements: data.email_announcements ?? true,
            sms_fee_reminders: data.sms_fee_reminders ?? false,
            sms_attendance_alerts: data.sms_attendance_alerts ?? false,
            sms_urgent_announcements: data.sms_urgent_announcements ?? true,
          });
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoadingPrefs(false);
      }
    };

    loadPreferences();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          address: profileData.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...notifications,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success('Notification preferences saved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const initials = profile
    ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`
    : 'U';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">
                    {profile?.first_name} {profile?.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={profileData.first_name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, first_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={profileData.last_name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, last_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile?.email || ''} disabled />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) =>
                      setProfileData({ ...profileData, address: e.target.value })
                    }
                    placeholder="Enter your address"
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingPrefs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <h4 className="font-medium">Email Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Fee Reminders</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive emails for upcoming fee deadlines
                          </p>
                        </div>
                        <Switch
                          checked={notifications.email_fee_reminders}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              email_fee_reminders: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Attendance Alerts</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified about attendance updates
                          </p>
                        </div>
                        <Switch
                          checked={notifications.email_attendance_alerts}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              email_attendance_alerts: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Announcements</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive school announcements via email
                          </p>
                        </div>
                        <Switch
                          checked={notifications.email_announcements}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              email_announcements: checked,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">SMS Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Fee Reminders</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive SMS for fee payment reminders
                          </p>
                        </div>
                        <Switch
                          checked={notifications.sms_fee_reminders}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              sms_fee_reminders: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Attendance Alerts</Label>
                          <p className="text-sm text-muted-foreground">
                            Get SMS alerts for attendance issues
                          </p>
                        </div>
                        <Switch
                          checked={notifications.sms_attendance_alerts}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              sms_attendance_alerts: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Urgent Announcements</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive SMS for urgent school updates
                          </p>
                        </div>
                        <Switch
                          checked={notifications.sms_urgent_announcements}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              sms_urgent_announcements: checked,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSaveNotifications} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Change Password</h4>
                <p className="text-sm text-muted-foreground">
                  To change your password, you'll receive an email with a reset link.
                </p>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!profile?.email) return;
                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(
                        profile.email,
                        {
                          redirectTo: `${window.location.origin}/auth`,
                        }
                      );
                      if (error) throw error;
                      toast.success('Password reset email sent');
                    } catch (error: any) {
                      toast.error(error.message || 'Failed to send reset email');
                    }
                  }}
                >
                  Send Password Reset Email
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Account Information</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">User ID</span>
                    <span className="font-mono text-xs">{user?.id}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Email Verified</span>
                    <span>{user?.email_confirmed_at ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Last Sign In</span>
                    <span>
                      {user?.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
