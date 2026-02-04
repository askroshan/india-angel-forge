import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Trash2, 
  Shield, 
  Ban, 
  CheckCircle2,
  MessageSquare,
  FileText,
  User 
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentFlag {
  id: string;
  content_type: 'MESSAGE' | 'DISCUSSION' | 'REPLY';
  content_id: string;
  content_text: string;
  content_author: {
    id: string;
    name: string;
    email: string;
  };
  reported_by: {
    id: string;
    name: string;
    email: string;
  };
  reason: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'MISINFORMATION' | 'OTHER';
  description: string;
  status: 'PENDING' | 'REVIEWED';
  resolution?: 'REMOVED' | 'WARNING_ISSUED' | 'USER_SUSPENDED' | 'FALSE_POSITIVE';
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export default function ContentModeration() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'REVIEWED'>('PENDING');

  // Fetch content flags
  const { data: allFlags = [], isLoading, error } = useQuery<ContentFlag[]>({
    queryKey: ['content-flags'],
    queryFn: async () => {
      return await apiClient.get<ContentFlag[]>('/api/moderator/flags');
    },
  });

  const flags = filter === 'ALL' 
    ? allFlags 
    : allFlags.filter(flag => flag.status === filter);

  // Remove content mutation
  const removeContentMutation = useMutation({
    mutationFn: async ({ flagId, contentType, contentId }: { flagId: string; contentType: string; contentId: string }) => {
      await apiClient.delete('moderator-content', `${contentType.toLowerCase()}/${contentId}`);
      return apiClient.patch(`/api/moderator/flags/${flagId}`, {
        status: 'REVIEWED',
        resolution: 'REMOVED',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-flags'] });
      toast.success('Content removed successfully');
    },
    onError: () => {
      toast.error('Failed to remove content');
    },
  });

  // Warn user mutation
  const warnUserMutation = useMutation({
    mutationFn: async ({ userId, flagId }: { userId: string; flagId: string }) => {
      await apiClient.patch(`/api/moderator/users/${userId}/warn`, {
        flag_id: flagId,
      });
      return apiClient.patch(`/api/moderator/flags/${flagId}`, {
        status: 'REVIEWED',
        resolution: 'WARNING_ISSUED',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-flags'] });
      toast.success('User warned successfully');
    },
    onError: () => {
      toast.error('Failed to warn user');
    },
  });

  // Suspend user mutation
  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, flagId }: { userId: string; flagId: string }) => {
      await apiClient.patch(`/api/moderator/users/${userId}/suspend`, {
        flag_id: flagId,
        duration_days: 30,
      });
      return apiClient.patch(`/api/moderator/flags/${flagId}`, {
        status: 'REVIEWED',
        resolution: 'USER_SUSPENDED',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-flags'] });
      toast.success('User suspended successfully');
    },
    onError: () => {
      toast.error('Failed to suspend user');
    },
  });

  // Mark as false positive mutation
  const markFalsePositiveMutation = useMutation({
    mutationFn: async (flagId: string) => {
      return await apiClient.patch<ContentFlag>(`/api/moderator/flags/${flagId}`, {
        status: 'REVIEWED',
        resolution: 'FALSE_POSITIVE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-flags'] });
      toast.success('Marked as false positive');
    },
    onError: () => {
      toast.error('Failed to update flag');
    },
  });

  const handleRemoveContent = (flag: ContentFlag) => {
    if (confirm(`Are you sure you want to remove this ${flag.content_type.toLowerCase()}?`)) {
      removeContentMutation.mutate({
        flagId: flag.id,
        contentType: flag.content_type,
        contentId: flag.content_id,
      });
    }
  };

  const handleWarnUser = (flag: ContentFlag) => {
    if (confirm(`Issue a warning to ${flag.content_author.name}?`)) {
      warnUserMutation.mutate({
        userId: flag.content_author.id,
        flagId: flag.id,
      });
    }
  };

  const handleSuspendUser = (flag: ContentFlag) => {
    if (confirm(`Suspend ${flag.content_author.name} for 30 days?`)) {
      suspendUserMutation.mutate({
        userId: flag.content_author.id,
        flagId: flag.id,
      });
    }
  };

  const handleMarkFalsePositive = (flagId: string) => {
    markFalsePositiveMutation.mutate(flagId);
  };

  const getReasonBadge = (reason: string) => {
    const colors: Record<string, string> = {
      SPAM: 'bg-orange-500',
      HARASSMENT: 'bg-red-500',
      INAPPROPRIATE: 'bg-yellow-500',
      MISINFORMATION: 'bg-purple-500',
      OTHER: 'bg-gray-500',
    };
    return <Badge className={colors[reason] || 'bg-gray-500'}>{reason}</Badge>;
  };

  const getStatusBadge = (status: string, resolution?: string) => {
    if (status === 'REVIEWED' && resolution) {
      const colors: Record<string, string> = {
        REMOVED: 'bg-red-600',
        WARNING_ISSUED: 'bg-yellow-600',
        USER_SUSPENDED: 'bg-red-800',
        FALSE_POSITIVE: 'bg-green-600',
      };
      return <Badge className={colors[resolution] || ''}>{resolution}</Badge>;
    }
    return <Badge variant={status === 'PENDING' ? 'destructive' : 'outline'}>{status}</Badge>;
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE':
        return <MessageSquare className="h-5 w-5" />;
      case 'DISCUSSION':
        return <FileText className="h-5 w-5" />;
      case 'REPLY':
        return <MessageSquare className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>Error loading content flags. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Content Moderation</h1>
        <p className="text-muted-foreground">Review and manage flagged content</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'ALL' ? 'default' : 'outline'}
          onClick={() => setFilter('ALL')}
        >
          All ({allFlags.length})
        </Button>
        <Button
          variant={filter === 'PENDING' ? 'default' : 'outline'}
          onClick={() => setFilter('PENDING')}
        >
          Pending ({allFlags.filter(f => f.status === 'PENDING').length})
        </Button>
        <Button
          variant={filter === 'REVIEWED' ? 'default' : 'outline'}
          onClick={() => setFilter('REVIEWED')}
        >
          Reviewed ({allFlags.filter(f => f.status === 'REVIEWED').length})
        </Button>
      </div>

      {/* Flags List */}
      {flags.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No flags to review</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {flags.map((flag) => (
            <Card key={flag.id} className={flag.status === 'PENDING' ? 'border-orange-500' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">{getContentIcon(flag.content_type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-base">{flag.content_type}</CardTitle>
                        {getReasonBadge(flag.reason)}
                        {getStatusBadge(flag.status, flag.resolution)}
                      </div>
                      <CardDescription>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span>Author: <strong>{flag.content_author.name}</strong> ({flag.content_author.email})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Reported by: <strong>{flag.reported_by.name}</strong></span>
                          </div>
                          <div className="text-sm">
                            {new Date(flag.created_at).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Flagged Content */}
                <div className="bg-slate-50 p-4 rounded-lg mb-4 border-l-4 border-orange-500">
                  <p className="text-sm font-medium mb-1">Flagged Content:</p>
                  <p className="text-sm">{flag.content_text}</p>
                </div>

                {/* Flag Description */}
                <div className="mb-4">
                  <p className="text-sm font-medium mb-1">Report Details:</p>
                  <p className="text-sm text-muted-foreground">{flag.description}</p>
                </div>

                {/* Actions */}
                {flag.status === 'PENDING' && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveContent(flag)}
                      disabled={removeContentMutation.isPending}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Remove Content
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleWarnUser(flag)}
                      disabled={warnUserMutation.isPending}
                    >
                      <Shield className="mr-1 h-4 w-4" />
                      Warn User
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSuspendUser(flag)}
                      disabled={suspendUserMutation.isPending}
                    >
                      <Ban className="mr-1 h-4 w-4" />
                      Suspend User
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkFalsePositive(flag.id)}
                      disabled={markFalsePositiveMutation.isPending}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      False Positive
                    </Button>
                  </div>
                )}

                {/* Resolution Info */}
                {flag.status === 'REVIEWED' && flag.resolved_at && (
                  <div className="text-sm text-muted-foreground">
                    Resolved: {new Date(flag.resolved_at).toLocaleString('en-IN')}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
