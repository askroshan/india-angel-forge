/**
 * US-COMM-004: Admin Communication Audit Log
 *
 * Admin page for reviewing all platform messages for compliance/audit purposes.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Mail, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface MessageThread {
  id: string;
  subject: string;
  senderName: string;
  recipientName: string;
  preview?: string;
  sentAt: string;
  messageCount?: number;
  threadId?: string;
}

interface ApiResponse {
  messages: MessageThread[];
  total: number;
}

export default function CommunicationAuditLog() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [messages, setMessages] = useState<MessageThread[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when search changes
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (debouncedSearch) params.set('q', debouncedSearch);
      const r = await fetch(`/api/admin/communications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error('Failed to load communications');
      const json: ApiResponse = await r.json();
      setMessages(json.messages ?? []);
      setTotal(json.total ?? 0);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token, page, debouncedSearch, toast]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const totalPages = Math.ceil(total / limit);

  const formatDate = (d: string) => {
    try { return format(new Date(d), 'dd MMM yyyy'); } catch { return d; }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 role="heading" className="text-3xl font-bold mb-2">Communication Audit Log</h1>
        <p className="text-muted-foreground">Review all platform messages for compliance and audit purposes</p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search messages by subject, sender, recipient…"
        />
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
        <span>{total} total message{total !== 1 ? 's' : ''}</span>
        {debouncedSearch && <Badge variant="secondary">Filtered by: "{debouncedSearch}"</Badge>}
      </div>

      {/* Loading */}
      {loading && <p className="text-muted-foreground">Loading communications…</p>}

      {/* Empty state */}
      {!loading && messages.length === 0 && (
        <div className="text-center py-20">
          <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground text-lg">
            {debouncedSearch ? 'No messages match your search' : 'No communications found'}
          </p>
        </div>
      )}

      {/* Messages list */}
      {!loading && messages.length > 0 && (
        <div className="space-y-3">
          {messages.map(msg => (
            <Card key={msg.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-base truncate">{msg.subject || '(No subject)'}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        <span className="font-medium text-foreground">From:</span> {msg.senderName}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        <span className="font-medium text-foreground">To:</span> {msg.recipientName}
                      </span>
                    </div>
                    {msg.preview && <p className="text-sm text-muted-foreground mt-1 truncate">{msg.preview}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(msg.sentAt)}</span>
                    </div>
                    {(msg.messageCount ?? 0) > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{msg.messageCount} message{msg.messageCount === 1 ? '' : 's'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
