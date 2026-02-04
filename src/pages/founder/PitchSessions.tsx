import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  scheduledDate: string;
  duration: number;
  status: string;
  meetingLink?: string;
  notes?: string;
  investorId: string;
}

export default function PitchSessions() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<PitchSession[]>([]);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<PitchSession | null>(null);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  
  const [scheduleData, setScheduleData] = useState({
    investorId: '',
    scheduledDate: '',
    duration: '30',
    meetingLink: '',
  });
  
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSessions = async () => {
    try {
      if (!token) {
        navigate('/auth');
        return;
      }

      const response = await fetch('/api/pitch/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/auth');
        }
        return;
      }

      const data = await response.json();
      setSessions(data || []);

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSession = async () => {
    try {
      if (!token) return;

      const response = await fetch('/api/pitch/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          investorId: scheduleData.investorId,
          scheduledDate: scheduleData.scheduledDate,
          duration: parseInt(scheduleData.duration),
          meetingLink: scheduleData.meetingLink || null,
        }),
      });

      if (!response.ok) {
        alert('Failed to schedule session');
        return;
      }

      setShowScheduleDialog(false);
      setScheduleData({
        investorId: '',
        scheduledDate: '',
        duration: '30',
        meetingLink: '',
      });
      fetchSessions();

    } catch (err) {
      console.error('Error:', err);
      alert('Failed to schedule session');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedSession || !token) return;

    try {
      const response = await fetch(`/api/pitch/sessions/${selectedSession.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        alert('Failed to save notes');
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
                  <Label htmlFor="investor_id">Investor ID</Label>
                  <Input
                    id="investor_id"
                    value={scheduleData.investorId}
                    onChange={(e) => setScheduleData({ ...scheduleData, investorId: e.target.value })}
                    placeholder="Investor User ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_date">Date and Time</Label>
                  <Input
                    id="scheduled_date"
                    type="datetime-local"
                    value={scheduleData.scheduledDate}
                    onChange={(e) => setScheduleData({ ...scheduleData, scheduledDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={scheduleData.duration}
                    onChange={(e) => setScheduleData({ ...scheduleData, duration: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting_link">Meeting Link (Optional)</Label>
                  <Input
                    id="meeting_link"
                    type="url"
                    value={scheduleData.meetingLink}
                    onChange={(e) => setScheduleData({ ...scheduleData, meetingLink: e.target.value })}
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
                        Investor {session.investorId}
                      </h3>
                      {getStatusBadge(session.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDateTime(session.scheduledDate)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {session.duration} minutes
                      </div>
                    </div>

                    {session.meetingLink && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(session.meetingLink, '_blank')}
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
                          Investor {session.investorId}
                        </h3>
                        {getStatusBadge(session.status)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDateTime(session.scheduledDate)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {session.duration} minutes
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
