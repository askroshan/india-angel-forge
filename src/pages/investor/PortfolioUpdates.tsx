import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Calendar, MessageSquare, TrendingUp, AlertCircle, CheckCircle, Clock, Users, Target, HelpCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

// Types
interface Update {
  id: string;
  company_id: string;
  title: string;
  content: string;
  posted_at: string;
  update_type: 'MILESTONE' | 'FINANCIAL' | 'FUNDING' | 'GENERAL';
  is_read: boolean;
  company: {
    company_name: string;
    sector: string;
    company_logo?: string;
  };
  metrics?: {
    revenue?: number;
    users?: number;
    growth_rate?: number;
    mrr?: number;
    arr?: number;
    burn_rate?: number;
    cash_runway_months?: number;
    valuation?: number;
    runway_months?: number;
  };
  milestones?: string[];
  challenges?: string | null;
  asks?: string | null;
  comments_count: number;
}

interface Comment {
  id: string;
  update_id: string;
  user_id: string;
  comment_text: string;
  posted_at: string;
  user: {
    full_name: string;
    role: string;
  };
}

// Helper functions
const formatIndianCurrency = (amount: number): string => {
  const absAmount = Math.abs(amount);
  if (absAmount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)} Cr`;
  } else if (absAmount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} Lac`;
  } else if (absAmount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toFixed(0)}`;
};

const formatNumber = (num: number): string => {
  return num.toLocaleString('en-IN');
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getUpdateTypeIcon = (type: string) => {
  switch (type) {
    case 'MILESTONE':
      return <Target className="h-4 w-4" />;
    case 'FINANCIAL':
      return <TrendingUp className="h-4 w-4" />;
    case 'FUNDING':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const getUpdateTypeBadge = (type: string) => {
  switch (type) {
    case 'MILESTONE':
      return <Badge variant="default">Milestone</Badge>;
    case 'FINANCIAL':
      return <Badge variant="secondary">Financial</Badge>;
    case 'FUNDING':
      return <Badge className="bg-green-500">Funding</Badge>;
    default:
      return <Badge variant="outline">Update</Badge>;
  }
};

const PortfolioUpdates = () => {
  const queryClient = useQueryClient();
  const [expandedUpdate, setExpandedUpdate] = useState<string | null>(null);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  // Fetch portfolio updates
  const { data: updates = [], isLoading, error } = useQuery<Update[]>({
    queryKey: ['portfolio-updates'],
    queryFn: async () => {
      const response = await apiClient.get<Update[]>('/api/portfolio/updates');
      return response;
    },
  });

  // Fetch comments for expanded update
  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ['update-comments', expandedUpdate],
    queryFn: async () => {
      const response = await apiClient.get<Comment[]>(`/api/portfolio/updates/${expandedUpdate}/comments`);
      return response;
    },
    enabled: !!expandedUpdate,
  });

  // Post comment mutation
  const postCommentMutation = useMutation({
    mutationFn: async ({ updateId, commentText }: { updateId: string; commentText: string }) => {
      const response = await apiClient.post<Comment>(`/api/portfolio/updates/${updateId}/comments`, {
        comment_text: commentText,
      });
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success('Comment posted successfully');
      queryClient.invalidateQueries({ queryKey: ['portfolio-updates'] });
      queryClient.invalidateQueries({ queryKey: ['update-comments', variables.updateId] });
      setCommentTexts(prev => ({ ...prev, [variables.updateId]: '' }));
    },
    onError: () => {
      toast.error('Failed to post comment');
    },
  });

  const handleToggleExpand = (updateId: string) => {
    setExpandedUpdate(expandedUpdate === updateId ? null : updateId);
  };

  const handlePostComment = (updateId: string) => {
    const commentText = commentTexts[updateId]?.trim();
    if (!commentText) {
      toast.error('Please enter a comment');
      return;
    }
    postCommentMutation.mutate({ updateId, commentText });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading updates...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading updates. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Portfolio Company Updates</h1>
          <p className="text-muted-foreground">
            Stay informed about your portfolio companies
          </p>
        </div>

        {/* Updates List */}
        {updates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No updates yet</h3>
              <p className="text-muted-foreground">
                Updates from your portfolio companies will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {updates.map((update) => (
              <Card key={update.id} className={`${!update.is_read ? 'border-l-4 border-l-blue-500' : ''}`}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {/* Company Logo */}
                    <div className="flex-shrink-0">
                      {update.company.company_logo ? (
                        <img
                          src={update.company.company_logo}
                          alt={update.company.company_name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Update Header */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{update.company.company_name}</h3>
                            <Badge variant="outline">{update.company.sector}</Badge>
                          </div>
                          <h4 className="text-base font-medium mb-1">{update.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(update.posted_at)}
                            {getUpdateTypeBadge(update.update_type)}
                          </div>
                        </div>
                      </div>

                      <p className="text-muted-foreground mb-3">{update.content}</p>

                      {/* Key Metrics */}
                      {update.metrics && Object.keys(update.metrics).length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 p-3 bg-muted/50 rounded-lg">
                          {update.metrics.revenue !== undefined && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Revenue</div>
                              <div className="font-semibold">{formatIndianCurrency(update.metrics.revenue)}</div>
                            </div>
                          )}
                          {update.metrics.users !== undefined && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Users</div>
                              <div className="font-semibold">{formatNumber(update.metrics.users)}</div>
                            </div>
                          )}
                          {update.metrics.growth_rate !== undefined && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Growth Rate</div>
                              <div className="font-semibold text-green-600">+{update.metrics.growth_rate}%</div>
                            </div>
                          )}
                          {update.metrics.mrr !== undefined && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">MRR</div>
                              <div className="font-semibold">{formatIndianCurrency(update.metrics.mrr)}</div>
                            </div>
                          )}
                          {update.metrics.arr !== undefined && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">ARR</div>
                              <div className="font-semibold">{formatIndianCurrency(update.metrics.arr)}</div>
                            </div>
                          )}
                          {update.metrics.burn_rate !== undefined && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Burn Rate</div>
                              <div className="font-semibold">{formatIndianCurrency(update.metrics.burn_rate)}/mo</div>
                            </div>
                          )}
                          {update.metrics.cash_runway_months !== undefined && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Runway</div>
                              <div className="font-semibold">{update.metrics.cash_runway_months} months</div>
                            </div>
                          )}
                          {update.metrics.valuation !== undefined && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Valuation</div>
                              <div className="font-semibold">{formatIndianCurrency(update.metrics.valuation)}</div>
                            </div>
                          )}
                          {update.metrics.runway_months !== undefined && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Runway</div>
                              <div className="font-semibold">{update.metrics.runway_months} months</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Milestones */}
                      {update.milestones && update.milestones.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-semibold">Milestones Achieved</span>
                          </div>
                          <ul className="space-y-1">
                            {update.milestones.map((milestone, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{milestone}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Challenges */}
                      {update.challenges && (
                        <div className="mb-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-semibold">Challenges</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{update.challenges}</p>
                        </div>
                      )}

                      {/* Asks */}
                      {update.asks && (
                        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <HelpCircle className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-semibold">How You Can Help</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{update.asks}</p>
                        </div>
                      )}

                      {/* Comments Section */}
                      <div className="border-t pt-3 mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleExpand(update.id)}
                          className="mb-3"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {update.comments_count === 0
                            ? 'No comments yet'
                            : `${update.comments_count} comment${update.comments_count > 1 ? 's' : ''}`}
                        </Button>

                        {expandedUpdate === update.id && (
                          <div className="space-y-3">
                            {/* Existing Comments */}
                            {comments.length > 0 && (
                              <div className="space-y-2">
                                {comments.map((comment) => (
                                  <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-semibold">{comment.user.full_name}</span>
                                      <Badge variant="outline" className="text-xs">{comment.user.role}</Badge>
                                      <span className="text-xs text-muted-foreground">{formatDate(comment.posted_at)}</span>
                                    </div>
                                    <p className="text-sm">{comment.comment_text}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Comment */}
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Add a comment..."
                                value={commentTexts[update.id] || ''}
                                onChange={(e) => setCommentTexts(prev => ({ ...prev, [update.id]: e.target.value }))}
                                className="min-h-[80px]"
                              />
                              <Button
                                onClick={() => handlePostComment(update.id)}
                                disabled={postCommentMutation.isPending}
                                size="sm"
                              >
                                Post Comment
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              About Company Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">Stay Connected</h4>
              <p className="text-sm text-muted-foreground">
                Portfolio companies post regular updates about their progress, challenges, and asks. Stay engaged by reading and commenting on these updates.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">How You Can Help</h4>
              <p className="text-sm text-muted-foreground">
                When founders share "Asks", they're looking for specific help from investors - introductions, advice, or resources. Use comments to offer support.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Update Types</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Milestone:</strong> Major achievements and product launches</li>
                <li>• <strong>Financial:</strong> Revenue, metrics, and financial performance</li>
                <li>• <strong>Funding:</strong> Fundraising announcements and rounds</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortfolioUpdates;
