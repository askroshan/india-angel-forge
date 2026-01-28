import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MessageSquare, Plus, AlertCircle, ThumbsUp, ThumbsDown, CheckCircle2, User } from 'lucide-react';
import { toast } from 'sonner';

// Types
interface Discussion {
  id: string;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
  tags: string[];
  author: {
    id: string;
    full_name: string;
    role: string;
    profile_picture?: string;
  };
  reply_count: number;
  upvotes: number;
  user_vote: number; // 1 for upvote, -1 for downvote, 0 for no vote
  has_best_answer: boolean;
}

interface Reply {
  id: string;
  discussion_id: string;
  content: string;
  created_by: string;
  created_at: string;
  author: {
    id: string;
    full_name: string;
    role: string;
    profile_picture?: string;
  };
  upvotes: number;
  user_vote: number;
  is_best_answer: boolean;
}

// Helper functions
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });
};

const Discussions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null);
  const [newDiscussionOpen, setNewDiscussionOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('');
  const [replyText, setReplyText] = useState('');

  // Fetch discussions
  const { data: discussions = [], isLoading: discussionsLoading, error: discussionsError } = useQuery<Discussion[]>({
    queryKey: ['discussions'],
    queryFn: async () => {
      const data = await apiClient.get<Discussion[]>('/api/discussions');
      return data ?? [];
    },
  });

  // Fetch replies for selected discussion
  const { data: replies = [] } = useQuery<Reply[]>({
    queryKey: ['discussion-replies', selectedDiscussionId],
    queryFn: async () => {
      const data = await apiClient.get<Reply[]>(`/api/discussions/${selectedDiscussionId}/replies`);
      return data ?? [];
    },
    enabled: !!selectedDiscussionId,
  });

  // Create discussion mutation
  const createDiscussionMutation = useMutation({
    mutationFn: async (formData: { title: string; description: string; tags: string[] }) => {
      const result = await apiClient.post('/api/discussions', formData);
      return result;
    },
    onSuccess: () => {
      toast.success('Discussion created successfully');
      setNewDiscussionOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewTags('');
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    },
    onError: () => {
      toast.error('Failed to create discussion');
    },
  });

  // Post reply mutation
  const postReplyMutation = useMutation({
    mutationFn: async (replyData: { discussion_id: string; content: string }) => {
      const result = await apiClient.post(`/api/discussions/${replyData.discussion_id}/replies`, {
        content: replyData.content,
      });
      return result;
    },
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['discussion-replies', selectedDiscussionId] });
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    },
    onError: () => {
      toast.error('Failed to post reply');
    },
  });

  // Vote on discussion mutation
  const voteDiscussionMutation = useMutation({
    mutationFn: async (voteData: { discussion_id: string; vote: number }) => {
      const result = await apiClient.post(`/api/discussions/${voteData.discussion_id}/vote`, {
        vote: voteData.vote,
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    },
  });

  // Vote on reply mutation
  const voteReplyMutation = useMutation({
    mutationFn: async (voteData: { discussion_id: string; reply_id: string; vote: number }) => {
      const result = await apiClient.post(`/api/discussions/${voteData.discussion_id}/replies/${voteData.reply_id}/vote`, {
        vote: voteData.vote,
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-replies', selectedDiscussionId] });
    },
  });

  // Mark best answer mutation
  const markBestAnswerMutation = useMutation({
    mutationFn: async (answerData: { discussion_id: string; reply_id: string }) => {
      const result = await apiClient.patch(`/api/discussions/${answerData.discussion_id}/replies/${answerData.reply_id}/best-answer`, {});
      return result;
    },
    onSuccess: () => {
      toast.success('Marked as best answer');
      queryClient.invalidateQueries({ queryKey: ['discussion-replies', selectedDiscussionId] });
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    },
    onError: () => {
      toast.error('Failed to mark best answer');
    },
  });

  const handleCreateDiscussion = () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const tags = newTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    createDiscussionMutation.mutate({
      title: newTitle,
      description: newDescription,
      tags,
    });
  };

  const handlePostReply = () => {
    if (!replyText.trim() || !selectedDiscussionId) return;
    
    postReplyMutation.mutate({
      discussion_id: selectedDiscussionId,
      content: replyText,
    });
  };

  const handleVoteDiscussion = (discussionId: string, vote: number) => {
    voteDiscussionMutation.mutate({ discussion_id: discussionId, vote });
  };

  const handleVoteReply = (replyId: string, vote: number) => {
    if (!selectedDiscussionId) return;
    voteReplyMutation.mutate({
      discussion_id: selectedDiscussionId,
      reply_id: replyId,
      vote,
    });
  };

  const handleMarkBestAnswer = (replyId: string) => {
    if (!selectedDiscussionId) return;
    markBestAnswerMutation.mutate({
      discussion_id: selectedDiscussionId,
      reply_id: replyId,
    });
  };

  const selectedDiscussion = discussions.find(d => d.id === selectedDiscussionId);
  const isDiscussionCreator = selectedDiscussion?.created_by === user?.id;

  if (discussionsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading discussions...</div>
      </div>
    );
  }

  if (discussionsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading discussions. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Discussions List */}
        <div className={selectedDiscussionId ? 'hidden lg:block lg:w-1/3' : 'w-full'}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle>Community Discussions</CardTitle>
                <Dialog open={newDiscussionOpen} onOpenChange={setNewDiscussionOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Discussion
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Discussion</DialogTitle>
                      <DialogDescription>
                        Start a conversation with the community
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          placeholder="Discussion title..."
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe the topic..."
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                          id="tags"
                          placeholder="fundraising, due-diligence, sector-insights"
                          value={newTags}
                          onChange={(e) => setNewTags(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleCreateDiscussion}
                        disabled={createDiscussionMutation.isPending}
                        className="w-full"
                      >
                        Post Discussion
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {discussions.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start a discussion to engage with the community
                  </p>
                  <Button onClick={() => setNewDiscussionOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Start a Discussion
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {discussions.map((discussion) => (
                    <div
                      key={discussion.id}
                      onClick={() => setSelectedDiscussionId(discussion.id)}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b ${
                        selectedDiscussionId === discussion.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {discussion.author.profile_picture ? (
                          <img
                            src={discussion.author.profile_picture}
                            alt={discussion.author.full_name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1">{discussion.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {discussion.description}
                          </p>
                          
                          {/* Tags */}
                          {discussion.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {discussion.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {/* Author and stats */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{discussion.author.full_name}</span>
                            <div className="flex items-center gap-3">
                              {discussion.has_best_answer && (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              )}
                              <span>{discussion.reply_count} replies</span>
                              <span>{discussion.upvotes} upvotes</span>
                              <span>{formatDate(discussion.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Discussion Details */}
        {selectedDiscussionId && selectedDiscussion && (
          <div className="flex-1">
            <Card>
              <CardHeader>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDiscussionId(null)}
                  className="lg:hidden mb-4"
                >
                  ← Back to Discussions
                </Button>
                
                <div className="flex items-start gap-3">
                  {selectedDiscussion.author.profile_picture ? (
                    <img
                      src={selectedDiscussion.author.profile_picture}
                      alt={selectedDiscussion.author.full_name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="mb-2">{selectedDiscussion.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mb-3">
                      {selectedDiscussion.description}
                    </p>
                    
                    {/* Tags */}
                    {selectedDiscussion.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {selectedDiscussion.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        by {selectedDiscussion.author.full_name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(selectedDiscussion.created_at)}
                      </span>
                      
                      {/* Vote buttons for discussion */}
                      <div className="flex items-center gap-2 ml-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVoteDiscussion(selectedDiscussion.id, 1)}
                          aria-label="Upvote discussion"
                          disabled={selectedDiscussion.user_vote === 1}
                        >
                          <ThumbsUp className={`h-4 w-4 ${selectedDiscussion.user_vote === 1 ? 'fill-current' : ''}`} />
                        </Button>
                        <span className="text-sm font-semibold">{selectedDiscussion.upvotes}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVoteDiscussion(selectedDiscussion.id, -1)}
                          aria-label="Downvote discussion"
                          disabled={selectedDiscussion.user_vote === -1}
                        >
                          <ThumbsDown className={`h-4 w-4 ${selectedDiscussion.user_vote === -1 ? 'fill-current' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Replies */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">
                    Replies ({replies.length})
                  </h3>
                  
                  {replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-4 rounded-lg border ${
                        reply.is_best_answer ? 'bg-green-50 border-green-200' : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {reply.author.profile_picture ? (
                          <img
                            src={reply.author.profile_picture}
                            alt={reply.author.full_name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{reply.author.full_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(reply.created_at)}
                            </span>
                            {reply.is_best_answer && (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Best Answer
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap mb-3">{reply.content}</p>
                          
                          {/* Vote and actions */}
                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVoteReply(reply.id, 1)}
                              aria-label="Upvote reply"
                              disabled={reply.user_vote === 1}
                            >
                              <ThumbsUp className={`h-3 w-3 ${reply.user_vote === 1 ? 'fill-current' : ''}`} />
                            </Button>
                            <span className="text-xs font-semibold">{reply.upvotes}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVoteReply(reply.id, -1)}
                              aria-label="Downvote reply"
                              disabled={reply.user_vote === -1}
                            >
                              <ThumbsDown className={`h-3 w-3 ${reply.user_vote === -1 ? 'fill-current' : ''}`} />
                            </Button>
                            
                            {isDiscussionCreator && !reply.is_best_answer && !selectedDiscussion.has_best_answer && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkBestAnswer(reply.id)}
                                className="ml-auto"
                                aria-label="Mark as best answer"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Mark as Best Answer
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Add Reply */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Add Your Reply</h4>
                  <Textarea
                    placeholder="Add your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[100px] mb-3"
                  />
                  <Button
                    onClick={handlePostReply}
                    disabled={!replyText.trim() || postReplyMutation.isPending}
                    aria-label="Post reply"
                  >
                    Post Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discussions;
