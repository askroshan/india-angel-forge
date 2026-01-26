import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { FileText, AlertCircle, Check, X, MessageSquare, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

// Types
interface Application {
  id: string;
  company_name: string;
  founder_name: string;
  founder_email: string;
  website?: string;
  stage: string;
  sector: string;
  problem: string;
  solution: string;
  market_size: string;
  traction: string;
  fundraising_amount: number;
  use_of_funds: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'DECLINED' | 'MORE_INFO_REQUESTED';
  submitted_at: string;
  completeness_score: number;
}

interface ScreeningNote {
  id: string;
  application_id: string;
  moderator_id: string;
  notes: string;
  created_at: string;
}

// Helper functions
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatIndianCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  } else {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
};

const getCompletenessColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const ApplicationScreening = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [screeningNotes, setScreeningNotes] = useState('');
  const [declineFeedback, setDeclineFeedback] = useState('');
  const [moreInfoMessage, setMoreInfoMessage] = useState('');
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [showMoreInfoDialog, setShowMoreInfoDialog] = useState(false);

  // Fetch applications
  const { data: applications = [], isLoading, error } = useQuery<Application[]>({
    queryKey: ['moderator-applications'],
    queryFn: async () => {
      const response = await apiClient.get('/api/moderator/applications');
      return response.data;
    },
  });

  // Fetch screening notes for selected application
  const { data: notes = [] } = useQuery<ScreeningNote[]>({
    queryKey: ['screening-notes', selectedApplication?.id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/moderator/applications/${selectedApplication?.id}/screening-notes`);
      return response.data;
    },
    enabled: !!selectedApplication,
  });

  // Approve application mutation
  const approveApplicationMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const response = await apiClient.patch(`/api/moderator/applications/${applicationId}`, {
        status: 'APPROVED',
        notify_founder: true,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Application approved successfully');
      queryClient.invalidateQueries({ queryKey: ['moderator-applications'] });
      setSelectedApplication(null);
    },
    onError: () => {
      toast.error('Failed to approve application');
    },
  });

  // Decline application mutation
  const declineApplicationMutation = useMutation({
    mutationFn: async (data: { applicationId: string; feedback: string }) => {
      const response = await apiClient.patch(`/api/moderator/applications/${data.applicationId}`, {
        status: 'DECLINED',
        feedback: data.feedback,
        notify_founder: true,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Application declined');
      queryClient.invalidateQueries({ queryKey: ['moderator-applications'] });
      setShowDeclineDialog(false);
      setDeclineFeedback('');
      setSelectedApplication(null);
    },
    onError: () => {
      toast.error('Failed to decline application');
    },
  });

  // Request more info mutation
  const requestMoreInfoMutation = useMutation({
    mutationFn: async (data: { applicationId: string; message: string }) => {
      const response = await apiClient.post(`/api/moderator/applications/${data.applicationId}/request-info`, {
        message: data.message,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Information request sent to founder');
      queryClient.invalidateQueries({ queryKey: ['moderator-applications'] });
      setShowMoreInfoDialog(false);
      setMoreInfoMessage('');
    },
    onError: () => {
      toast.error('Failed to send request');
    },
  });

  // Add screening notes mutation
  const addScreeningNotesMutation = useMutation({
    mutationFn: async (data: { applicationId: string; notes: string }) => {
      const response = await apiClient.post(`/api/moderator/applications/${data.applicationId}/screening-notes`, {
        notes: data.notes,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Notes saved');
      setScreeningNotes('');
      queryClient.invalidateQueries({ queryKey: ['screening-notes', selectedApplication?.id] });
    },
    onError: () => {
      toast.error('Failed to save notes');
    },
  });

  const handleApprove = (applicationId: string) => {
    approveApplicationMutation.mutate(applicationId);
  };

  const handleDecline = () => {
    if (!selectedApplication || !declineFeedback.trim()) {
      toast.error('Please provide feedback');
      return;
    }
    declineApplicationMutation.mutate({
      applicationId: selectedApplication.id,
      feedback: declineFeedback,
    });
  };

  const handleRequestMoreInfo = () => {
    if (!selectedApplication || !moreInfoMessage.trim()) {
      toast.error('Please provide a message');
      return;
    }
    requestMoreInfoMutation.mutate({
      applicationId: selectedApplication.id,
      message: moreInfoMessage,
    });
  };

  const handleSaveNotes = () => {
    if (!selectedApplication || !screeningNotes.trim()) return;
    addScreeningNotesMutation.mutate({
      applicationId: selectedApplication.id,
      notes: screeningNotes,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading applications...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading applications. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Application Screening</h1>
        <p className="text-muted-foreground">
          Review and screen founder applications for quality and completeness
        </p>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No applications to review</h3>
            <p className="text-muted-foreground">
              New founder applications will appear here for screening
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applications List */}
          <div className="space-y-4">
            {applications.map((application) => (
              <Card
                key={application.id}
                className={`cursor-pointer transition-all ${
                  selectedApplication?.id === application.id ? 'ring-2 ring-primary' : ''
                } ${application.completeness_score < 60 ? 'border-yellow-300' : ''}`}
                onClick={() => setSelectedApplication(application)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{application.company_name}</CardTitle>
                      <CardDescription>{application.founder_name}</CardDescription>
                    </div>
                    <Badge variant={
                      application.status === 'SUBMITTED' ? 'secondary' :
                      application.status === 'UNDER_REVIEW' ? 'default' :
                      application.status === 'APPROVED' ? 'default' :
                      'destructive'
                    }>
                      {application.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completeness</span>
                      <span className={`font-semibold ${getCompletenessColor(application.completeness_score)}`}>
                        {application.completeness_score}%
                      </span>
                    </div>
                    <Progress value={application.completeness_score} className="h-2" />
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{application.sector}</Badge>
                      <Badge variant="outline">{application.stage}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatIndianCurrency(application.fundraising_amount)}
                      </span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Submitted {formatDate(application.submitted_at)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Application Details */}
          {selectedApplication && (
            <div className="lg:sticky lg:top-4 h-fit">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedApplication.company_name}</CardTitle>
                      <CardDescription>
                        {selectedApplication.founder_name} • {selectedApplication.founder_email}
                      </CardDescription>
                    </div>
                    {selectedApplication.website && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={selectedApplication.website} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Problem & Solution */}
                  <div>
                    <h4 className="font-semibold mb-2">Problem</h4>
                    <p className="text-sm text-muted-foreground">{selectedApplication.problem}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Solution</h4>
                    <p className="text-sm text-muted-foreground">{selectedApplication.solution}</p>
                  </div>

                  {/* Market & Traction */}
                  {selectedApplication.market_size && (
                    <div>
                      <h4 className="font-semibold mb-2">Market Size</h4>
                      <p className="text-sm text-muted-foreground">{selectedApplication.market_size}</p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold mb-2">Traction</h4>
                    <p className="text-sm text-muted-foreground">{selectedApplication.traction}</p>
                  </div>

                  {/* Fundraising */}
                  <div>
                    <h4 className="font-semibold mb-2">Fundraising</h4>
                    <p className="text-sm font-semibold mb-1">
                      {formatIndianCurrency(selectedApplication.fundraising_amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedApplication.use_of_funds}</p>
                  </div>

                  {/* Screening Notes */}
                  <div>
                    <h4 className="font-semibold mb-2">Screening Notes</h4>
                    {notes.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {notes.map((note) => (
                          <div key={note.id} className="p-3 bg-muted rounded-lg text-sm">
                            {note.notes}
                          </div>
                        ))}
                      </div>
                    )}
                    <Textarea
                      placeholder="Add screening notes..."
                      value={screeningNotes}
                      onChange={(e) => setScreeningNotes(e.target.value)}
                      className="mb-2"
                      aria-label="Screening notes"
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={!screeningNotes.trim() || addScreeningNotesMutation.isPending}
                      aria-label="Save notes"
                    >
                      Save Notes
                    </Button>
                  </div>

                  {/* Actions */}
                  {selectedApplication.status !== 'APPROVED' && selectedApplication.status !== 'DECLINED' && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => handleApprove(selectedApplication.id)}
                        disabled={approveApplicationMutation.isPending}
                        className="flex-1"
                        aria-label="Approve application"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      
                      <Dialog open={showMoreInfoDialog} onOpenChange={setShowMoreInfoDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1" aria-label="Request more information">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            More Info
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Request More Information</DialogTitle>
                            <DialogDescription>
                              Send a message to the founder requesting additional details
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <Textarea
                              placeholder="What additional information do you need?"
                              value={moreInfoMessage}
                              onChange={(e) => setMoreInfoMessage(e.target.value)}
                              className="min-h-[100px]"
                              aria-label="More information message"
                            />
                            <Button
                              onClick={handleRequestMoreInfo}
                              disabled={requestMoreInfoMutation.isPending}
                              className="w-full"
                              aria-label="Send request"
                            >
                              Send Request
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
                        <DialogTrigger asChild>
                          <Button variant="destructive" className="flex-1" aria-label="Decline application">
                            <X className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Decline Application</DialogTitle>
                            <DialogDescription>
                              Provide feedback to help the founder improve their application
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <Textarea
                              placeholder="Why is this application being declined?"
                              value={declineFeedback}
                              onChange={(e) => setDeclineFeedback(e.target.value)}
                              className="min-h-[100px]"
                              aria-label="Decline feedback"
                            />
                            <Button
                              onClick={handleDecline}
                              disabled={declineApplicationMutation.isPending}
                              variant="destructive"
                              className="w-full"
                              aria-label="Confirm decline"
                            >
                              Confirm Decline
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApplicationScreening;
