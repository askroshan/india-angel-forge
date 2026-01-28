import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Mail, MessageSquare, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Types
interface NotificationChannels {
  email: boolean;
  in_app: boolean;
}

interface PreferenceItem extends NotificationChannels {
  frequency?: 'daily' | 'weekly' | 'monthly' | 'never';
  reminder_hours?: number;
}

interface Preferences {
  new_deal_notifications: NotificationChannels;
  portfolio_updates: PreferenceItem;
  message_notifications: NotificationChannels;
  event_reminders: PreferenceItem;
  digest_emails: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'never';
  };
}

const CommunicationPreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Local state for preferences
  const [preferences, setPreferences] = useState<Preferences>({
    new_deal_notifications: { email: true, in_app: true },
    portfolio_updates: { email: true, in_app: true, frequency: 'weekly' },
    message_notifications: { email: true, in_app: true },
    event_reminders: { email: true, in_app: true, reminder_hours: 24 },
    digest_emails: { enabled: true, frequency: 'weekly' },
  });

  // Fetch preferences
  const { data, isLoading, error } = useQuery<Preferences>({
    queryKey: ['communication-preferences'],
    queryFn: async () => {
      const prefs = await apiClient.get<Preferences>('/api/preferences');
      return prefs;
    },
  });

  // Update local state when data is loaded
  useEffect(() => {
    if (data) {
      setPreferences(data);
    }
  }, [data]);

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (updatedPreferences: Preferences) => {
      const result = await apiClient.put('/api/preferences', updatedPreferences);
      return result;
    },
    onSuccess: () => {
      toast.success('Preferences saved successfully');
      queryClient.invalidateQueries({ queryKey: ['communication-preferences'] });
    },
    onError: () => {
      toast.error('Failed to save preferences');
    },
  });

  const handleSave = () => {
    savePreferencesMutation.mutate(preferences);
  };

  const updatePreference = <K extends keyof Preferences>(
    key: K,
    value: Partial<Preferences[K]>
  ): void => {
    setPreferences(prev => ({
      ...prev,
      [key]: { ...prev[key], ...value },
    }));
  };

  // Type-safe frequency update helpers
  type PortfolioFrequency = 'daily' | 'weekly' | 'monthly' | 'never';
  type DigestFrequency = 'daily' | 'weekly' | 'never';

  const updatePortfolioFrequency = (value: PortfolioFrequency) => {
    updatePreference('portfolio_updates', { frequency: value });
  };

  const updateDigestFrequency = (value: DigestFrequency) => {
    updatePreference('digest_emails', { frequency: value });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading preferences...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading preferences. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Communication Preferences</h1>
        <p className="text-muted-foreground">
          Manage how and when you receive notifications and updates
        </p>
      </div>

      <div className="space-y-6">
        {/* New Deal Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>New Deal Notifications</CardTitle>
            </div>
            <CardDescription>
              Get notified when new investment opportunities are available
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-deal-email" className="flex-1">
                Email notifications for new deals
              </Label>
              <Switch
                id="new-deal-email"
                checked={preferences.new_deal_notifications.email}
                onCheckedChange={(checked) =>
                  updatePreference('new_deal_notifications', { email: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="new-deal-inapp" className="flex-1">
                In-app notifications for new deals
              </Label>
              <Switch
                id="new-deal-inapp"
                checked={preferences.new_deal_notifications.in_app}
                onCheckedChange={(checked) =>
                  updatePreference('new_deal_notifications', { in_app: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Updates */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Portfolio Updates</CardTitle>
            </div>
            <CardDescription>
              Receive updates from your portfolio companies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="portfolio-email" className="flex-1">
                Email notifications
              </Label>
              <Switch
                id="portfolio-email"
                checked={preferences.portfolio_updates.email}
                onCheckedChange={(checked) =>
                  updatePreference('portfolio_updates', { email: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="portfolio-inapp" className="flex-1">
                In-app notifications
              </Label>
              <Switch
                id="portfolio-inapp"
                checked={preferences.portfolio_updates.in_app}
                onCheckedChange={(checked) =>
                  updatePreference('portfolio_updates', { in_app: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio-frequency">Update frequency</Label>
              <Select
                value={preferences.portfolio_updates.frequency}
                onValueChange={(value) => updatePortfolioFrequency(value as PortfolioFrequency)}
              >
                <SelectTrigger id="portfolio-frequency" aria-label="Portfolio update frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Message Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <CardTitle>Message Notifications</CardTitle>
            </div>
            <CardDescription>
              Get notified about new direct messages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="message-email" className="flex-1">
                Email notifications
              </Label>
              <Switch
                id="message-email"
                checked={preferences.message_notifications.email}
                onCheckedChange={(checked) =>
                  updatePreference('message_notifications', { email: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="message-inapp" className="flex-1">
                In-app notifications
              </Label>
              <Switch
                id="message-inapp"
                checked={preferences.message_notifications.in_app}
                onCheckedChange={(checked) =>
                  updatePreference('message_notifications', { in_app: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Event Reminders */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <CardTitle>Event Reminders</CardTitle>
            </div>
            <CardDescription>
              Configure reminders for upcoming events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="event-email" className="flex-1">
                Email reminders
              </Label>
              <Switch
                id="event-email"
                checked={preferences.event_reminders.email}
                onCheckedChange={(checked) =>
                  updatePreference('event_reminders', { email: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="event-inapp" className="flex-1">
                In-app reminders
              </Label>
              <Switch
                id="event-inapp"
                checked={preferences.event_reminders.in_app}
                onCheckedChange={(checked) =>
                  updatePreference('event_reminders', { in_app: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-hours">Reminder hours before event</Label>
              <Input
                id="reminder-hours"
                type="number"
                min="1"
                max="168"
                value={preferences.event_reminders.reminder_hours}
                onChange={(e) =>
                  updatePreference('event_reminders', {
                    reminder_hours: parseInt(e.target.value) || 24,
                  })
                }
                aria-label="Reminder hours"
              />
            </div>
          </CardContent>
        </Card>

        {/* Digest Emails */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Digest Emails</CardTitle>
            </div>
            <CardDescription>
              Receive consolidated email summaries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="digest-enabled" className="flex-1">
                Enable digest emails
              </Label>
              <Switch
                id="digest-enabled"
                name="digest-enabled"
                checked={preferences.digest_emails.enabled}
                onCheckedChange={(checked) =>
                  updatePreference('digest_emails', { enabled: checked })
                }
              />
            </div>
            {preferences.digest_emails.enabled && (
              <div className="space-y-2">
                <Label htmlFor="digest-frequency">Digest frequency</Label>
                <Select
                  value={preferences.digest_emails.frequency}
                  onValueChange={(value) => updateDigestFrequency(value as DigestFrequency)}
                >
                  <SelectTrigger id="digest-frequency" name="digest-frequency" aria-label="Digest frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => {
              if (data) setPreferences(data);
            }}
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={savePreferencesMutation.isPending}
          >
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommunicationPreferences;
