import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Briefcase, 
  Clock, 
  DollarSign, 
  Calendar, 
  Star, 
  CheckCircle2, 
  XCircle,
  Users,
  Award 
} from 'lucide-react';
import { toast } from 'sonner';

interface AdvisoryProfile {
  id: string;
  user_id: string;
  expertise_areas: string[];
  hourly_rate: number;
  engagement_terms: string;
  availability: string;
  bio: string;
  is_active: boolean;
  total_sessions: number;
  average_rating: number;
  created_at: string;
}

interface AdvisoryRequest {
  id: string;
  advisory_profile_id: string;
  founder_id: string;
  founder_name: string;
  founder_company: string;
  topic: string;
  description: string;
  preferred_dates: string[];
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
  scheduled_date?: string;
  created_at: string;
}

export default function AdvisoryProfile() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED'>('PENDING');

  // Fetch advisory profile
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery<AdvisoryProfile | null>({
    queryKey: ['advisory-profile'],
    queryFn: async () => {
      return await apiClient.get<AdvisoryProfile | null>('/api/operator/advisory-profile');
    },
  });

  // Fetch advisory requests
  const { data: allRequests = [], isLoading: requestsLoading } = useQuery<AdvisoryRequest[]>({
    queryKey: ['advisory-requests'],
    queryFn: async () => {
      return await apiClient.get<AdvisoryRequest[]>('/api/operator/advisory-requests');
    },
    enabled: !!profile,
  });

  const requests = filter === 'ALL' 
    ? allRequests 
    : allRequests.filter(req => req.status === filter);

  // Accept request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiClient.patch<AdvisoryRequest>(`/api/operator/advisory-requests/${requestId}`, {
        status: 'ACCEPTED',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisory-requests'] });
      toast.success('Request accepted successfully');
    },
    onError: () => {
      toast.error('Failed to accept request');
    },
  });

  // Decline request mutation
  const declineRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiClient.patch<AdvisoryRequest>(`/api/operator/advisory-requests/${requestId}`, {
        status: 'DECLINED',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisory-requests'] });
      toast.success('Request declined');
    },
    onError: () => {
      toast.error('Failed to decline request');
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline">PENDING</Badge>;
      case 'ACCEPTED':
        return <Badge className="bg-green-500">ACCEPTED</Badge>;
      case 'DECLINED':
        return <Badge variant="destructive">DECLINED</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-blue-500">COMPLETED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (profileError) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>Error loading profile. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (profileLoading || requestsLoading) {
    return (
      <div className="container mx-auto py-8">
        <div>Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Advisory Services</CardTitle>
            <CardDescription>Set up your advisory profile to start offering services</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You haven't created your advisory profile yet. Create a profile to offer your expertise to portfolio companies.
            </p>
            <Button>Create Profile</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Advisory Services</h1>
        <p className="text-muted-foreground">Manage your advisory profile and session requests</p>
      </div>

      {/* Advisory Profile Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Your Advisory Profile</CardTitle>
              <CardDescription className="mt-2">
                {profile.is_active ? (
                  <Badge className="bg-green-500">Active</Badge>
                ) : (
                  <Badge variant="outline">Inactive</Badge>
                )}
              </CardDescription>
            </div>
            <Button variant="outline">Edit Profile</Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Bio */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">{profile.bio}</p>
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Hourly Rate */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Hourly Rate
              </div>
              <div className="text-2xl font-bold">{formatCurrency(profile.hourly_rate)}/hr</div>
            </div>

            {/* Total Sessions */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Total Sessions
              </div>
              <div className="text-2xl font-bold">{profile.total_sessions}</div>
            </div>

            {/* Average Rating */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                Average Rating
              </div>
              <div className="text-2xl font-bold">{profile.average_rating} / 5.0</div>
            </div>

            {/* Availability */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Availability
              </div>
              <div className="text-sm">{profile.availability}</div>
            </div>
          </div>

          {/* Expertise Areas */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              Areas of Expertise
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.expertise_areas.map((area, index) => (
                <Badge key={index} variant="secondary">{area}</Badge>
              ))}
            </div>
          </div>

          {/* Engagement Terms */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4" />
              Engagement Terms
            </div>
            <p className="text-sm">{profile.engagement_terms}</p>
          </div>
        </CardContent>
      </Card>

      {/* Advisory Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Advisory Requests</CardTitle>
              <CardDescription>Session requests from founders</CardDescription>
            </div>
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={filter === 'ALL' ? 'default' : 'outline'}
                onClick={() => setFilter('ALL')}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={filter === 'PENDING' ? 'default' : 'outline'}
                onClick={() => setFilter('PENDING')}
              >
                Pending
              </Button>
              <Button
                size="sm"
                variant={filter === 'ACCEPTED' ? 'default' : 'outline'}
                onClick={() => setFilter('ACCEPTED')}
              >
                Accepted
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No {filter.toLowerCase()} requests
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{request.founder_name}</h3>
                      <p className="text-sm text-muted-foreground">{request.founder_company}</p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="mb-3">
                    <div className="font-medium text-sm mb-1">{request.topic}</div>
                    <p className="text-sm text-muted-foreground">{request.description}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Preferred dates: {request.preferred_dates.map(d => 
                        new Date(d).toLocaleDateString('en-IN')
                      ).join(', ')}
                    </span>
                  </div>

                  {request.scheduled_date && (
                    <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        Scheduled: {new Date(request.scheduled_date).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {request.status === 'PENDING' && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => acceptRequestMutation.mutate(request.id)}
                        disabled={acceptRequestMutation.isPending}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => declineRequestMutation.mutate(request.id)}
                        disabled={declineRequestMutation.isPending}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground mt-3">
                    Requested: {new Date(request.created_at).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
