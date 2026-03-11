/**
 * US-SEED-001: Admin Manage Industries
 * US-SEED-002: Admin Manage Funding Stages
 *
 * Admin page for managing Industry Sectors and Funding Stages seed data.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Tag, Layers } from 'lucide-react';

interface Industry {
  id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
}

interface FundingStage {
  id: string;
  name: string;
  code: string;
  description?: string;
  typicalMin?: number;
  typicalMax?: number;
  displayOrder: number;
  isActive: boolean;
}

const emptyIndustry = { name: '', code: '', description: '', displayOrder: 0 };
const emptyStage = { name: '', code: '', description: '', typicalMin: '', typicalMax: '', displayOrder: 0 };

function formatAmount(n?: number) {
  if (!n) return '—';
  const cr = n / 10000000;
  if (cr >= 1) return `₹${cr.toFixed(1)} Cr`;
  return `₹${(n / 100000).toFixed(1)} L`;
}

export default function SeedDataManagement() {
  const { token } = useAuth();
  const { toast } = useToast();

  // Industry state
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(true);
  const [industryDialog, setIndustryDialog] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);
  const [industryForm, setIndustryForm] = useState(emptyIndustry);
  const [disableIndustryConfirm, setDisableIndustryConfirm] = useState<Industry | null>(null);

  // Funding Stage state
  const [stages, setStages] = useState<FundingStage[]>([]);
  const [loadingStages, setLoadingStages] = useState(true);
  const [stageDialog, setStageDialog] = useState(false);
  const [editingStage, setEditingStage] = useState<FundingStage | null>(null);
  const [stageForm, setStageForm] = useState(emptyStage);
  const [disableStageConfirm, setDisableStageConfirm] = useState<FundingStage | null>(null);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const loadIndustries = useCallback(async () => {
    setLoadingIndustries(true);
    try {
      const r = await fetch('/api/admin/industries', { headers });
      if (!r.ok) throw new Error('Failed to load industries');
      setIndustries(await r.json());
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally { setLoadingIndustries(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadStages = useCallback(async () => {
    setLoadingStages(true);
    try {
      const r = await fetch('/api/admin/funding-stages', { headers });
      if (!r.ok) throw new Error('Failed to load funding stages');
      setStages(await r.json());
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally { setLoadingStages(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { loadIndustries(); }, [loadIndustries]);
  useEffect(() => { loadStages(); }, [loadStages]);

  const openCreateIndustry = () => { setEditingIndustry(null); setIndustryForm(emptyIndustry); setIndustryDialog(true); };
  const openEditIndustry = (ind: Industry) => {
    setEditingIndustry(ind);
    setIndustryForm({ name: ind.name, code: ind.code, description: ind.description || '', displayOrder: ind.displayOrder });
    setIndustryDialog(true);
  };
  const saveIndustry = async () => {
    try {
      const url = editingIndustry ? `/api/admin/industries/${editingIndustry.id}` : '/api/admin/industries';
      const method = editingIndustry ? 'PATCH' : 'POST';
      const r = await fetch(url, { method, headers, body: JSON.stringify(industryForm) });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || 'Failed to save industry'); }
      await loadIndustries();
      setIndustryDialog(false);
      toast({ title: editingIndustry ? 'Industry updated' : 'Industry created' });
    } catch (e) { toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' }); }
  };
  const disableIndustry = async (id: string) => {
    try {
      const r = await fetch(`/api/admin/industries/${id}`, { method: 'DELETE', headers });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || 'Failed to disable'); }
      await loadIndustries();
      setDisableIndustryConfirm(null);
      toast({ title: 'Industry disabled' });
    } catch (e) { toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' }); }
  };

  const openCreateStage = () => { setEditingStage(null); setStageForm(emptyStage); setStageDialog(true); };
  const openEditStage = (s: FundingStage) => {
    setEditingStage(s);
    setStageForm({ name: s.name, code: s.code, description: s.description || '', typicalMin: s.typicalMin?.toString() || '', typicalMax: s.typicalMax?.toString() || '', displayOrder: s.displayOrder });
    setStageDialog(true);
  };
  const saveStage = async () => {
    try {
      const data = { ...stageForm, typicalMin: stageForm.typicalMin ? Number(stageForm.typicalMin) : null, typicalMax: stageForm.typicalMax ? Number(stageForm.typicalMax) : null };
      const url = editingStage ? `/api/admin/funding-stages/${editingStage.id}` : '/api/admin/funding-stages';
      const method = editingStage ? 'PATCH' : 'POST';
      const r = await fetch(url, { method, headers, body: JSON.stringify(data) });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || 'Failed to save stage'); }
      await loadStages();
      setStageDialog(false);
      toast({ title: editingStage ? 'Funding stage updated' : 'Funding stage created' });
    } catch (e) { toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' }); }
  };
  const disableStage = async (id: string) => {
    try {
      const r = await fetch(`/api/admin/funding-stages/${id}`, { method: 'DELETE', headers });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || 'Failed to disable'); }
      await loadStages();
      setDisableStageConfirm(null);
      toast({ title: 'Funding stage disabled' });
    } catch (e) { toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' }); }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Seed Data Management</h1>
        <p className="text-muted-foreground">Manage platform dropdown options: industries and funding stages</p>
      </div>

      <Tabs defaultValue="industries">
        <TabsList className="mb-6">
          <TabsTrigger value="industries">
            <Tag className="h-4 w-4 mr-2" /> Industries
          </TabsTrigger>
          <TabsTrigger value="funding-stages">
            <Layers className="h-4 w-4 mr-2" /> Funding Stages
          </TabsTrigger>
        </TabsList>

        {/* ========== INDUSTRIES TAB ========== */}
        <TabsContent value="industries">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Industry Sectors ({industries.length})</h2>
            <Button onClick={openCreateIndustry}>
              <Plus className="h-4 w-4 mr-2" /> Add Industry
            </Button>
          </div>

          {loadingIndustries && <p className="text-muted-foreground">Loading industries…</p>}

          {!loadingIndustries && industries.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No industries found</div>
          )}

          <div className="space-y-3">
            {industries.map(ind => (
              <Card key={ind.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{ind.name}</span>
                      <Badge variant="outline" className="font-mono text-xs">{ind.code}</Badge>
                      {ind.isActive
                        ? <Badge variant="default">Active</Badge>
                        : <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    {ind.description && <p className="text-sm text-muted-foreground mt-1">{ind.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">Display order: {ind.displayOrder}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditIndustry(ind)}>Edit</Button>
                    {ind.isActive && (
                      <Button variant="destructive" size="sm" onClick={() => setDisableIndustryConfirm(ind)}>Disable</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ========== FUNDING STAGES TAB ========== */}
        <TabsContent value="funding-stages">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Funding Stages ({stages.length})</h2>
            <Button onClick={openCreateStage}>
              <Plus className="h-4 w-4 mr-2" /> Add Stage
            </Button>
          </div>

          {loadingStages && <p className="text-muted-foreground">Loading funding stages…</p>}

          {!loadingStages && stages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No funding stages found</div>
          )}

          <div className="space-y-3">
            {stages.map(stage => (
              <Card key={stage.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{stage.name}</span>
                        <Badge variant="outline" className="font-mono text-xs">{stage.code}</Badge>
                        {stage.isActive
                          ? <Badge variant="default">Active</Badge>
                          : <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      {stage.description && <p className="text-sm text-muted-foreground mt-1">{stage.description}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        Typical range: {formatAmount(stage.typicalMin)} – {formatAmount(stage.typicalMax)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditStage(stage)}>Edit</Button>
                      {stage.isActive && (
                        <Button variant="destructive" size="sm" onClick={() => setDisableStageConfirm(stage)}>Disable</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ========== INDUSTRY DIALOG ========== */}
      <Dialog open={industryDialog} onOpenChange={setIndustryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIndustry ? 'Edit Industry' : 'Add Industry'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="industry-name">Industry Name</Label>
              <Input id="industry-name" value={industryForm.name} onChange={e => setIndustryForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. FinTech" />
            </div>
            <div>
              <Label htmlFor="industry-code">Code</Label>
              <Input id="industry-code" value={industryForm.code} onChange={e => setIndustryForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. FINTECH" />
            </div>
            <div>
              <Label htmlFor="industry-desc">Description</Label>
              <Textarea id="industry-desc" value={industryForm.description} onChange={e => setIndustryForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" />
            </div>
            <div>
              <Label htmlFor="industry-order">Display Order</Label>
              <Input id="industry-order" type="number" value={industryForm.displayOrder} onChange={e => setIndustryForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIndustryDialog(false)}>Cancel</Button>
            <Button onClick={saveIndustry} disabled={!industryForm.name || !industryForm.code}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== FUNDING STAGE DIALOG ========== */}
      <Dialog open={stageDialog} onOpenChange={setStageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStage ? 'Edit Funding Stage' : 'Add Funding Stage'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="stage-name">Stage Name</Label>
              <Input id="stage-name" value={stageForm.name} onChange={e => setStageForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Series A" />
            </div>
            <div>
              <Label htmlFor="stage-code">Code</Label>
              <Input id="stage-code" value={stageForm.code} onChange={e => setStageForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SERIES_A" />
            </div>
            <div>
              <Label htmlFor="stage-desc">Description</Label>
              <Textarea id="stage-desc" value={stageForm.description} onChange={e => setStageForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="typical-min">Typical Min (₹)</Label>
                <Input id="typical-min" type="number" value={stageForm.typicalMin} onChange={e => setStageForm(f => ({ ...f, typicalMin: e.target.value }))} placeholder="5000000" />
              </div>
              <div>
                <Label htmlFor="typical-max">Typical Max (₹)</Label>
                <Input id="typical-max" type="number" value={stageForm.typicalMax} onChange={e => setStageForm(f => ({ ...f, typicalMax: e.target.value }))} placeholder="20000000" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Typical range: {formatAmount(stageForm.typicalMin ? Number(stageForm.typicalMin) : undefined)} – {formatAmount(stageForm.typicalMax ? Number(stageForm.typicalMax) : undefined)}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageDialog(false)}>Cancel</Button>
            <Button onClick={saveStage} disabled={!stageForm.name || !stageForm.code}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== DISABLE INDUSTRY CONFIRM ========== */}
      <AlertDialog open={!!disableIndustryConfirm} onOpenChange={open => { if (!open) setDisableIndustryConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Industry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable <strong>{disableIndustryConfirm?.name}</strong>? It will no longer appear in dropdowns but historical data is preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => disableIndustryConfirm && disableIndustry(disableIndustryConfirm.id)}>
              Disable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========== DISABLE STAGE CONFIRM ========== */}
      <AlertDialog open={!!disableStageConfirm} onOpenChange={open => { if (!open) setDisableStageConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Funding Stage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable <strong>{disableStageConfirm?.name}</strong>? It will no longer appear in dropdowns but historical data is preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => disableStageConfirm && disableStage(disableStageConfirm.id)}>
              Disable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
