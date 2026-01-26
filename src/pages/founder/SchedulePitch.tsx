import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Users, IndianRupee, Clock, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';

/**
 * Interested investor data structure from the API
 */
interface InterestedInvestor {
  id: string;
  full_name: string;
  email: string;
  deal_interest: {
    id: string;
    investment_amount: number;
    status: string;
    created_at: string;
  };
}

/**
 * Pitch session response from API
 */
interface PitchSession {
  id: string;
  investor_id: string;
  founder_id: string;
  meeting_date: string;
  status: string;
  reminder_scheduled?: boolean;
}

/**
 * Format a number as Indian currency (INR)
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date for display
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * SchedulePitch component - allows founders to schedule pitch sessions with interested investors
 */
export default function SchedulePitch() {
  const queryClient = useQueryClient();
  const [selectedInvestor, setSelectedInvestor] = useState<InterestedInvestor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [pitchDeckLink, setPitchDeckLink] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch interested investors
  const { data: investors = [], isLoading, error } = useQuery<InterestedInvestor[]>({
    queryKey: ['interested-investors'],
    queryFn: async () => {
      const response = await apiClient.get('/api/interested-investors');
      return response.data;
    },
  });

  // Schedule meeting mutation
  const scheduleMeetingMutation = useMutation({
    mutationFn: async (data: {
      investor_id: string;
      meeting_date: string;
      pitch_deck_link?: string;
      notes?: string;
    }) => {
      const response = await apiClient.post('/api/pitch-sessions', data);
      return response.data;
    },
    onSuccess: (data: PitchSession) => {
      toast.success('Meeting invitation sent successfully');
      toast.success('Investor will receive invitation to accept or decline');
      
      if (data.reminder_scheduled) {
        toast.success('Automated reminders will be sent');
      }
      
      // Reset form and close dialog
      setIsDialogOpen(false);
      setMeetingDate('');
      setPitchDeckLink('');
      setNotes('');
      setFormError('');
      setSelectedInvestor(null);
      
      // Refetch investors list
      queryClient.invalidateQueries({ queryKey: ['interested-investors'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to schedule meeting';
      setFormError(message);
      toast.error(message);
    },
  });

  const handleScheduleClick = (investor: InterestedInvestor) => {
    setSelectedInvestor(investor);
    setIsDialogOpen(true);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validate meeting date
    if (!meetingDate) {
      setFormError('Meeting date is required');
      return;
    }

    // Submit meeting invitation
    if (selectedInvestor) {
      scheduleMeetingMutation.mutate({
        investor_id: selectedInvestor.id,
        meeting_date: meetingDate,
        pitch_deck_link: pitchDeckLink || undefined,
        notes: notes || undefined,
      });
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-red-500">Error loading interested investors</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Schedule Pitch Sessions</h1>
        <p className="text-muted-foreground">
          Schedule meetings with investors who have expressed interest in your deal
        </p>
      </div>

      {/* Interested Investors Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p>Loading interested investors...</p>
        </div>
      ) : investors.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No investors have expressed interest yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {investors.map(investor => (
            <Card key={investor.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {investor.full_name}
                    </CardTitle>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <IndianRupee className="h-4 w-4" />
                        <span>Investment Interest: {formatIndianCurrency(investor.deal_interest.investment_amount)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>Interested on {formatDate(investor.deal_interest.created_at)}</span>
                      </div>
                    </CardDescription>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleScheduleClick(investor)}
                  className="w-full"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Meeting Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Pitch Session</DialogTitle>
            <DialogDescription>
              Propose a meeting time with {selectedInvestor?.full_name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-date">
                Meeting Date & Time
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="meeting-date"
                type="datetime-local"
                value={meetingDate}
                onChange={(e) => {
                  setMeetingDate(e.target.value);
                  setFormError('');
                }}
                aria-label="Meeting Date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pitch-deck-link">
                Pitch Deck Link
              </Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pitch-deck-link"
                  type="url"
                  placeholder="https://example.com/pitch-deck.pdf"
                  value={pitchDeckLink}
                  onChange={(e) => setPitchDeckLink(e.target.value)}
                  className="pl-9"
                  aria-label="Pitch Deck Link"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Optional: Share your pitch deck or presentation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                Additional Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Any additional information for the investor..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{formError}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">
                What happens next:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Investor will receive meeting invitation</li>
                <li>• They can accept or decline the invitation</li>
                <li>• Accepted meetings will appear in your calendar</li>
                <li>• Automated reminders will be sent to both parties</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={scheduleMeetingMutation.isPending}
              >
                {scheduleMeetingMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
