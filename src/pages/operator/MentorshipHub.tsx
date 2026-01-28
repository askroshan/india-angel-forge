import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Calendar, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Share2,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

interface Mentorship {
  id: string;
  mentor_id: string;
  mentee_id: string;
  mentee_name: string;
  company_name: string;
  status: 'PENDING' | 'ACTIVE' | 'ENDED' | 'DECLINED';
  start_date: string | null;
  goals: string[];
  sessions_count: number;
  next_session: string | null;
  created_at: string;
}

interface Session {
  id: string;
  mentorship_id: string;
  scheduled_date: string;
  duration_minutes: number;
  topics: string[];
  notes: string;
  action_items: string[];
  completed: boolean;
}

const MentorshipHub = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Fetch mentorships
  const {
    data: mentorships = [],
    isLoading: mentorshipsLoading,
    error: mentorshipsError,
  } = useQuery<Mentorship[]>({
    queryKey: ['mentorships', user?.id],
    queryFn: async () => {
      return await apiClient.get<Mentorship[]>('/api/operator/mentorships');
    },
  });

  // Fetch sessions for first mentorship (demo)
  const activeMentorship = mentorships.find((m) => m.status === 'ACTIVE');
  const {
    data: sessions = [],
  } = useQuery<Session[]>({
    queryKey: ['mentorship-sessions', activeMentorship?.id],
    queryFn: async () => {
      if (!activeMentorship) return [];
      return await apiClient.get<Session[]>(
        `/api/operator/mentorships/${activeMentorship.id}/sessions`
      );
    },
    enabled: !!activeMentorship,
  });

  // Accept mentorship mutation
  const acceptMutation = useMutation({
    mutationFn: async (mentorshipId: string) => {
      return await apiClient.patch<Mentorship>(`/api/operator/mentorships/${mentorshipId}`, {
        status: 'ACTIVE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorships'] });
      toast.success('Mentorship request accepted');
    },
    onError: () => {
      toast.error('Failed to accept mentorship');
    },
  });

  // Decline mentorship mutation
  const declineMutation = useMutation({
    mutationFn: async (mentorshipId: string) => {
      return await apiClient.patch<Mentorship>(`/api/operator/mentorships/${mentorshipId}`, {
        status: 'DECLINED',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorships'] });
      toast.success('Mentorship request declined');
    },
    onError: () => {
      toast.error('Failed to decline mentorship');
    },
  });

  // End mentorship mutation
  const endMutation = useMutation({
    mutationFn: async (mentorshipId: string) => {
      return await apiClient.patch<Mentorship>(`/api/operator/mentorships/${mentorshipId}`, {
        status: 'ENDED',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorships'] });
      toast.success('Mentorship ended');
    },
    onError: () => {
      toast.error('Failed to end mentorship');
    },
  });

  if (mentorshipsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error loading mentorships. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusBadge = (status: Mentorship['status']) => {
    const variants: Record<Mentorship['status'], 'default' | 'secondary' | 'destructive'> = {
      ACTIVE: 'default',
      PENDING: 'secondary',
      ENDED: 'secondary',
      DECLINED: 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mentorship Hub</h1>
          <p className="text-muted-foreground mt-2">
            Guide founders through their startup journey
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Check-in
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Session</DialogTitle>
                <DialogDescription>
                  Schedule a mentorship check-in session
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Session scheduling form would go here
              </p>
            </DialogContent>
          </Dialog>

          <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Share Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Document</DialogTitle>
                <DialogDescription>
                  Upload and share resources with mentees
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Document upload form would go here
              </p>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {mentorshipsLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : mentorships.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No active mentorships</p>
            <p className="text-sm text-muted-foreground mt-2">
              You'll see mentorship requests here
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mentorships Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {mentorships.map((mentorship) => (
              <Card key={mentorship.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{mentorship.mentee_name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {mentorship.company_name}
                      </p>
                    </div>
                    {getStatusBadge(mentorship.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Goals */}
                  {mentorship.goals.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                        <Target className="h-4 w-4 mr-1" />
                        Goals
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {mentorship.goals.map((goal, idx) => (
                          <Badge key={idx} variant="outline">
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Session Count */}
                  {mentorship.status === 'ACTIVE' && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {mentorship.sessions_count} sessions completed
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {mentorship.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => acceptMutation.mutate(mentorship.id)}
                          disabled={acceptMutation.isPending}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => declineMutation.mutate(mentorship.id)}
                          disabled={declineMutation.isPending}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Decline
                        </Button>
                      </>
                    )}
                    {mentorship.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => endMutation.mutate(mentorship.id)}
                        disabled={endMutation.isPending}
                      >
                        End Mentorship
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Session History */}
          {sessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Session History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">
                            {session.topics.join(', ')}
                          </h4>
                          {session.completed && (
                            <Badge variant="outline">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.scheduled_date).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {session.duration_minutes} min
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    {session.notes && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          Notes
                        </p>
                        <p className="text-sm">{session.notes}</p>
                      </div>
                    )}

                    {/* Action Items */}
                    {session.action_items.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Action Items
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          {session.action_items.map((item, idx) => (
                            <li key={idx} className="text-sm">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default MentorshipHub;
