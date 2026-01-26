import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calendar, 
  Clock, 
  Video, 
  CheckCircle, 
  XCircle,
  Plus,
  FileText
} from 'lucide-react';

interface PitchSession {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_link?: string;
  notes?: string;
  investor: {
    full_name: string;
    email: string;
  };
}

export default function PitchSessions() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<PitchSession[]>([]);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<PitchSession | null>(null);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  
  const [scheduleData, setScheduleData] = useState({
    investor_email: '',
    scheduled_at: '',
    duration_minutes: '30',
    meeting_link: '',
  });
  
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('pitch_sessions')
        .select(`
          *,
          investor:investor_id(full_name, email)
        `)
        .eq('founder_id', session.user.id)
        .order('scheduled_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      if (data) {
        setSessions(data as any);
      }

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Find investor by email
      const { data: investorData } = await supabase
        .from('users')
        .select('id')
        .eq('email', scheduleData.investor_email)
        .single();

      if (!investorData) {
        alert('Investor not found');
        return;
      }

      const { error } = await supabase
        .from('pitch_sessions')
        .insert({
          founder_id: session.user.id,
          investor_id: investorData.id,
          scheduled_at: scheduleData.scheduled_at,
          duration_minutes: parseInt(scheduleData.duration_minutes),
          meeting_link: scheduleData.meeting_link || null,
          status: 'scheduled',
        });

      if (error) {
        console.error('Error scheduling session:', error);
        return;
      }

      setShowScheduleDialog(false);
      setScheduleData({
        investor_email: '',
        scheduled_at: '',
        duration_minutes: '30',
        meeting_link: '',
      });
      fetchSessions();

    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedSession) return;

    try {
      const { error } = await supabase
        .from('pitch_sessions')
        .update({ notes })
        .eq('id', selectedSession.id);

      if (error) {
        console.error('Error saving notes:', error);
        return;
      }

      setShowNotesDialog(false);
      setSelectedSession(null);
      setNotes('');
      fetchSessions();

    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Calendar className="h-3 w-3 mr-1" />
            Scheduled
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Clock className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');
  const pastSessions = sessions.filter(s => s.status === 'completed' || s.status === 'cancelled');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Pitch Sessions</h1>
            <p className="text-muted-foreground">
              Manage your pitch meetings with investors
            </p>
          </div>
          
          <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule New Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Pitch Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="investor_email">Investor Email</Label>
                  <Input
                    id="investor_email"
                    type="email"
                    value={scheduleData.investor_email}
                    onChange={(e) => setScheduleData({ ...scheduleData, investor_email: e.target.value })}
                    placeholder="investor@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_at">Date and Time</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={scheduleData.scheduled_at}
                    onChange={(e) => setScheduleData({ ...scheduleData, scheduled_at: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={scheduleData.duration_minutes}
                    onChange={(e) => setScheduleData({ ...scheduleData, duration_minutes: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting_link">Meeting Link (Optional)</Label>
                  <Input
                    id="meeting_link"
                    type="url"
                    value={scheduleData.meeting_link}
                    onChange={(e) => setScheduleData({ ...scheduleData, meeting_link: e.target.value })}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
                <Button onClick={handleScheduleSession} className="w-full">
                  Schedule Session
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
            {upcomingSessions.map((session) => (
              <Card key={session.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        {session.investor.full_name || session.investor.email}
                      </h3>
                      {getStatusBadge(session.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDateTime(session.scheduled_at)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {session.duration_minutes} minutes
                      </div>
                    </div>

                    {session.meeting_link && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(session.meeting_link, '_blank')}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join Meeting
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Past Sessions */}
        {pastSessions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Past Sessions</h2>
            {pastSessions.map((session) => (
              <Card key={session.id} className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">
                          {session.investor.full_name || session.investor.email}
                        </h3>
                        {getStatusBadge(session.status)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDateTime(session.scheduled_at)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {session.duration_minutes} minutes
                        </div>
                      </div>
                    </div>

                    {session.status === 'completed' && (
                      <Dialog open={showNotesDialog && selectedSession?.id === session.id} onOpenChange={(open) => {
                        setShowNotesDialog(open);
                        if (!open) setSelectedSession(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSession(session);
                              setNotes(session.notes || '');
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {session.notes ? 'Edit Notes' : 'Add Notes'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Session Notes</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <Textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Add notes about the session..."
                              rows={6}
                            />
                            <Button onClick={handleSaveNotes} className="w-full">
                              Save Notes
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  {session.notes && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                      <p className="text-sm">{session.notes}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {sessions.length === 0 && (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground mb-4">No pitch sessions scheduled yet</p>
            <Button onClick={() => setShowScheduleDialog(true)}>
              Schedule Your First Session
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
