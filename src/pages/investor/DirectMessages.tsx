import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, Search, Plus, AlertCircle, FileText, Download, User } from 'lucide-react';
import { toast } from 'sonner';

// Types
interface MessageThread {
  id: string;
  participant_ids: string[];
  last_message: {
    id: string;
    content: string;
    sent_at: string;
    sender_id: string;
  };
  other_participant: {
    id: string;
    full_name: string;
    role: string;
    company: string | null;
    profile_picture?: string;
  };
  unread_count: number;
  updated_at: string;
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  attachments: Array<{
    id: string;
    filename: string;
    file_url: string;
    file_size: number;
  }>;
  sender: {
    id: string;
    full_name: string;
    role: string;
  };
}

interface UserOption {
  id: string;
  full_name: string;
  email: string;
  role: string;
  company: string | null;
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

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const DirectMessages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch message threads
  const { data: threads = [], isLoading: threadsLoading, error: threadsError } = useQuery<MessageThread[]>({
    queryKey: ['message-threads'],
    queryFn: async () => {
      const response = await apiClient.get<MessageThread[]>('/api/messages/threads');
      return response;
    },
  });

  // Fetch messages for selected thread
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['messages', selectedThreadId],
    queryFn: async () => {
      const response = await apiClient.get<Message[]>(`/api/messages/threads/${selectedThreadId}/messages`);
      return response;
    },
    enabled: !!selectedThreadId,
  });

  // Fetch users for new conversation
  const { data: users = [] } = useQuery<UserOption[]>({
    queryKey: ['users-list'],
    queryFn: async () => {
      const response = await apiClient.get<UserOption[]>('/api/users');
      return response;
    },
    enabled: newConversationOpen,
  });

  // Search messages
  const { data: searchResults = [] } = useQuery<Message[]>({
    queryKey: ['search-messages', searchQuery],
    queryFn: async () => {
      const response = await apiClient.get<Message[]>(`/api/messages/search?q=${encodeURIComponent(searchQuery)}`);
      return response;
    },
    enabled: searchQuery.length > 2,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { thread_id: string; content: string }) => {
      const response = await apiClient.post<Message>('/api/messages', data);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['message-threads'] });
      queryClient.invalidateQueries({ queryKey: ['messages', selectedThreadId] });
      scrollToBottom();
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });

  // Start new conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: async (data: { recipient_id: string; initial_message: string }) => {
      const response = await apiClient.post<MessageThread>('/api/messages/threads', data);
      if (response.error) throw new Error(response.error.message);
      return response.data as MessageThread;
    },
    onSuccess: (data) => {
      toast.success('Conversation started');
      setNewConversationOpen(false);
      setSelectedUserId('');
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['message-threads'] });
      setSelectedThreadId(data?.id ?? null);
    },
    onError: () => {
      toast.error('Failed to start conversation');
    },
  });

  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedThreadId) return;
    sendMessageMutation.mutate({
      thread_id: selectedThreadId,
      content: messageText,
    });
  };

  const handleStartConversation = () => {
    if (!selectedUserId || !messageText.trim()) {
      toast.error('Please select a recipient and enter a message');
      return;
    }
    startConversationMutation.mutate({
      recipient_id: selectedUserId,
      initial_message: messageText,
    });
  };

  const selectedThread = threads.find(t => t.id === selectedThreadId);

  if (threadsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading messages...</div>
      </div>
    );
  }

  if (threadsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading messages. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
        {/* Threads Sidebar */}
        <div className="w-full lg:w-1/3">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle>Direct Messages</CardTitle>
                <Dialog open={newConversationOpen} onOpenChange={setNewConversationOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Message
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start New Conversation</DialogTitle>
                      <DialogDescription>
                        Send a message to another member
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Recipient</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select recipient" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.full_name} ({user.role})
                                {user.company && ` - ${user.company}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Message</Label>
                        <Textarea
                          placeholder="Type your message..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                      <Button
                        onClick={handleStartConversation}
                        disabled={startConversationMutation.isPending}
                        className="w-full"
                      >
                        Send Message
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {threads.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start a conversation with founders or other investors
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {threads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b ${
                        selectedThreadId === thread.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {thread.other_participant.profile_picture ? (
                            <img
                              src={thread.other_participant.profile_picture}
                              alt={thread.other_participant.full_name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold truncate">
                              {thread.other_participant.full_name}
                            </span>
                            {thread.unread_count > 0 && (
                              <Badge variant="default" className="ml-2">
                                {thread.unread_count}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {thread.other_participant.role}
                            </Badge>
                            {thread.other_participant.company && (
                              <span className="text-xs text-muted-foreground truncate">
                                {thread.other_participant.company}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {thread.last_message.content}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(thread.last_message.sent_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Messages Panel */}
        <div className="flex-1">
          <Card className="h-full flex flex-col">
            {selectedThreadId ? (
              <>
                {/* Conversation Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    {selectedThread?.other_participant.profile_picture ? (
                      <img
                        src={selectedThread.other_participant.profile_picture}
                        alt={selectedThread.other_participant.full_name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{selectedThread?.other_participant.full_name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {selectedThread?.other_participant.role}
                        </Badge>
                        {selectedThread?.other_participant.company && (
                          <span className="text-xs text-muted-foreground">
                            {selectedThread.other_participant.company}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isOwnMessage = message.sender_id === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`rounded-lg p-3 ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            
                            {/* Attachments */}
                            {message.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {message.attachments.map((attachment) => (
                                  <a
                                    key={attachment.id}
                                    href={attachment.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 p-2 rounded border ${
                                      isOwnMessage
                                        ? 'border-primary-foreground/20 hover:bg-primary-foreground/10'
                                        : 'border-border hover:bg-background'
                                    }`}
                                  >
                                    <FileText className="h-4 w-4" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium truncate">
                                        {attachment.filename}
                                      </div>
                                      <div className="text-xs opacity-70">
                                        {formatFileSize(attachment.file_size)}
                                      </div>
                                    </div>
                                    <Download className="h-4 w-4" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className={`text-xs text-muted-foreground mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                            {formatDate(message.sent_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="min-h-[60px] resize-none"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      size="icon"
                      className="h-[60px] w-[60px]"
                      aria-label="Send message"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to view messages
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DirectMessages;
