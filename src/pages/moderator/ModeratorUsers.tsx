import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, AlertTriangle, Ban, Users, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';

interface ModeratorUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  flagCount: number;
  createdAt: string;
}

export default function ModeratorUsers() {
  const [search, setSearch] = useState('');
  const [warnTarget, setWarnTarget] = useState<ModeratorUser | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<ModeratorUser | null>(null);
  const [reason, setReason] = useState('');

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, error, refetch } = useQuery<{
    success: boolean;
    users: ModeratorUser[];
    total: number;
  }>({
    queryKey: ['moderator-users', debouncedSearch],
    queryFn: () =>
      apiClient.get(
        `/api/moderator/users${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ''}`
      ),
  });

  const warnMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      apiClient.post(`/api/moderator/users/${userId}/warn`, { reason }),
    onSuccess: () => {
      toast.success('Warning issued to user');
      setWarnTarget(null);
      setReason('');
      refetch();
    },
    onError: () => toast.error('Failed to issue warning'),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      apiClient.post(`/api/moderator/users/${userId}/suspend`, { reason }),
    onSuccess: () => {
      toast.success('User suspended');
      setSuspendTarget(null);
      setReason('');
      refetch();
    },
    onError: () => toast.error('Failed to suspend user'),
  });

  const handleWarnSubmit = useCallback(() => {
    if (!warnTarget || !reason.trim()) return;
    warnMutation.mutate({ userId: warnTarget.id, reason: reason.trim() });
  }, [warnTarget, reason, warnMutation]);

  const handleSuspendSubmit = useCallback(() => {
    if (!suspendTarget || !reason.trim()) return;
    suspendMutation.mutate({ userId: suspendTarget.id, reason: reason.trim() });
  }, [suspendTarget, reason, suspendMutation]);

  const users = data?.users ?? [];

  return (
    <div className="container mx-auto py-8 px-4" data-testid="moderator-users-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and moderate user accounts
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="moderator-users-refresh">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="moderator-users-search"
        />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Error loading users. Please try again later.</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground" data-testid="moderator-users-loading">
          Loading users…
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4" data-testid="moderator-users-count">
            {data?.total ?? 0} users found
          </p>
          <div className="space-y-3">
            {users.map((user) => (
              <Card key={user.id} data-testid={`moderator-user-card-${user.id}`}>
                <CardContent className="flex items-center justify-between pt-4 pb-4">
                  <div className="space-y-1">
                    <p className="font-medium">{user.fullName || '(no name)'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map((r) => (
                        <Badge key={r} variant="secondary" className="text-xs">
                          {r}
                        </Badge>
                      ))}
                      {user.flagCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {user.flagCount} flag{user.flagCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setWarnTarget(user); setReason(''); }}
                      data-testid={`moderator-warn-btn-${user.id}`}
                      aria-label={`Warn ${user.email}`}
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Warn
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => { setSuspendTarget(user); setReason(''); }}
                      data-testid={`moderator-suspend-btn-${user.id}`}
                      aria-label={`Suspend ${user.email}`}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Suspend
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {users.length === 0 && !isLoading && (
              <div className="text-center py-12 text-muted-foreground" data-testid="moderator-users-empty">
                No users found.
              </div>
            )}
          </div>
        </>
      )}

      {/* Warn Dialog */}
      <Dialog open={!!warnTarget} onOpenChange={(open) => { if (!open) { setWarnTarget(null); setReason(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Warning</DialogTitle>
            <DialogDescription>
              Issue a formal warning to <strong>{warnTarget?.email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for warning..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            data-testid="moderator-warn-reason"
            aria-label="Warning reason"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarnTarget(null)}>Cancel</Button>
            <Button
              onClick={handleWarnSubmit}
              disabled={!reason.trim() || warnMutation.isPending}
              data-testid="moderator-warn-submit"
            >
              Issue Warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={!!suspendTarget} onOpenChange={(open) => { if (!open) { setSuspendTarget(null); setReason(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Suspend account for <strong>{suspendTarget?.email}</strong>. This action will be logged.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for suspension..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            data-testid="moderator-suspend-reason"
            aria-label="Suspension reason"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleSuspendSubmit}
              disabled={!reason.trim() || suspendMutation.isPending}
              data-testid="moderator-suspend-submit"
            >
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
