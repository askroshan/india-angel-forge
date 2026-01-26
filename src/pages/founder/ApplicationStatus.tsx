import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Users, 
  XCircle,
  ArrowRight
} from 'lucide-react';

interface FounderApplication {
  id: string;
  status: string;
  stage: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  company_name: string;
  can_reapply_after?: string;
}

interface ApplicationStage {
  name: string;
  label: string;
  description: string;
  timeline: string;
  completed: boolean;
  current: boolean;
}

export default function ApplicationStatus() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<FounderApplication | null>(null);
  const [stages, setStages] = useState<ApplicationStage[]>([]);

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Fetch latest application
      const { data, error } = await supabase
        .from('founder_applications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching application:', error);
        return;
      }

      if (data && data.length > 0) {
        const app = data[0];
        setApplication(app);
        setStages(buildStages(app));
      }

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildStages = (app: FounderApplication): ApplicationStage[] => {
    const allStages = [
      {
        name: 'submitted',
        label: 'Application Submitted',
        description: 'Your application has been received',
        timeline: 'Completed',
        completed: true,
        current: false,
      },
      {
        name: 'initial_review',
        label: 'Initial Review',
        description: 'Our team is reviewing your application',
        timeline: '5-7 business days',
        completed: app.stage !== 'initial_review' && app.status !== 'pending',
        current: app.stage === 'initial_review',
      },
      {
        name: 'interview',
        label: 'Interview Stage',
        description: 'Schedule a meeting with our team',
        timeline: '1-2 weeks',
        completed: app.stage === 'committee_review' || app.stage === 'complete',
        current: app.stage === 'interview',
      },
      {
        name: 'committee_review',
        label: 'Committee Review',
        description: 'Final review by selection committee',
        timeline: '1-2 weeks',
        completed: app.stage === 'complete',
        current: app.stage === 'committee_review',
      },
      {
        name: 'complete',
        label: 'Decision',
        description: 'Application review complete',
        timeline: '',
        completed: app.status === 'approved' || app.status === 'rejected',
        current: app.stage === 'complete',
      },
    ];

    return allStages;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'under_review':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <FileText className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canReapply = (app: FounderApplication) => {
    if (!app.can_reapply_after) return true;
    return new Date(app.can_reapply_after) <= new Date();
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

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Application Found</h2>
          <p className="text-muted-foreground mb-6">
            You haven't submitted a founder application yet.
          </p>
          <Button onClick={() => navigate('/apply/founder')}>
            Apply Now
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Application Status</h1>
          <p className="text-muted-foreground">
            Track your founder membership application
          </p>
        </div>

        {/* Status Overview */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold mb-1">{application.company_name}</h2>
                <p className="text-sm text-muted-foreground">
                  Submitted on {formatDate(application.created_at)}
                </p>
              </div>
              {getStatusBadge(application.status)}
            </div>

            {/* Approved Status */}
            {application.status === 'approved' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-green-800">Congratulations!</p>
                      <p className="text-green-700">
                        Your application has been approved.
                        {application.approved_at && ` (${formatDate(application.approved_at)})`}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">Next Steps:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                        <li>Complete your membership payment</li>
                        <li>Set up your founder profile</li>
                        <li>Attend the onboarding session</li>
                        <li>Start accessing investor network</li>
                      </ul>
                    </div>
                    <Button 
                      onClick={() => navigate('/membership')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Proceed to Membership
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Rejected Status */}
            {application.status === 'rejected' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold">Application Not Approved</p>
                      {application.rejected_at && (
                        <p className="text-sm">Reviewed on {formatDate(application.rejected_at)}</p>
                      )}
                    </div>
                    {application.rejection_reason && (
                      <div className="bg-white p-3 rounded border">
                        <p className="font-semibold text-sm mb-1">Reason:</p>
                        <p className="text-sm">{application.rejection_reason}</p>
                      </div>
                    )}
                    {canReapply(application) ? (
                      <div>
                        <p className="text-sm mb-2">
                          You can submit a new application addressing the feedback provided.
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => navigate('/apply/founder')}
                        >
                          Reapply Now
                        </Button>
                      </div>
                    ) : application.can_reapply_after && (
                      <p className="text-sm">
                        You can reapply after {formatDate(application.can_reapply_after)}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Under Review */}
            {(application.status === 'pending' || application.status === 'under_review') && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold">Application Under Review</p>
                  <p className="text-sm mt-1">
                    We're carefully reviewing your application. You'll receive an email once a decision is made.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>

        {/* Progress Timeline */}
        {(application.status === 'pending' || application.status === 'under_review') && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Application Progress</h3>
            <div className="space-y-6">
              {stages.map((stage, index) => (
                <div key={stage.name} className="relative">
                  {index < stages.length - 1 && (
                    <div 
                      className={`absolute left-4 top-8 bottom-0 w-0.5 ${
                        stage.completed ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                  <div className="flex gap-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      stage.completed 
                        ? 'bg-green-500 text-white' 
                        : stage.current 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {stage.completed ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : stage.current ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <div className="w-2 h-2 bg-current rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className={`font-semibold ${
                            stage.current ? 'text-blue-900' : ''
                          }`}>
                            {stage.label}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {stage.description}
                          </p>
                        </div>
                        {stage.timeline && !stage.completed && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                            {stage.timeline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Support */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Need Help?</h4>
              <p className="text-sm text-blue-800 mb-3">
                If you have questions about your application, feel free to reach out to our team.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/contact')}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
