/**
 * Admin Membership Management Page
 *
 * Tabbed interface: Plans, Discount Codes, Subscribers, Change Log, Config
 *
 * User Stories: US-MEMB-002 (Admin CRUD plans), US-DISC-001 (Discount CRUD),
 *               US-MEMB-004 (Changelog), US-MEMB-005 (Config)
 *
 * data-testid attributes:
 *   admin-membership-page, membership-plans-tab, membership-discount-tab,
 *   membership-subscribers-tab, membership-changelog-tab, membership-config-tab,
 *   plan-create-btn, plan-row, plan-edit-btn, plan-delete-btn,
 *   discount-create-btn, discount-row, discount-edit-btn, discount-delete-btn,
 *   config-save-btn, config-row
 */

import { useState, useEffect, useCallback } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { apiClient } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  CreditCard,
  Tag,
  Users,
  History,
  Settings,
  Loader2,
} from "lucide-react";

// ==================== TYPES ====================

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  billingCycle: string;
  features: string[];
  isActive: boolean;
  displayOrder: number;
  _count?: { memberships: number };
}

interface DiscountCodeT {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  currentUses: number;
  validFrom: string;
  validUntil: string | null;
  applicablePlanIds: string[];
  isActive: boolean;
}

interface MembershipRow {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  user: { id: string; fullName: string; email: string };
  plan: { id: string; name: string };
}

interface ChangelogEntry {
  id: string;
  changeType: string;
  oldPrice: number | null;
  newPrice: number | null;
  proratedAmount: number | null;
  reason: string | null;
  createdAt: string;
  user: { fullName: string; email: string };
  oldPlanName?: string;
  newPlanName?: string;
}

interface ConfigEntry {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

// ==================== COMPONENT ====================

export default function MembershipManagement() {
  const [activeTab, setActiveTab] = useState("plans");

  return (
    <div className="min-h-screen bg-background" data-testid="admin-membership-page">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Membership Management</h1>
        <p className="text-muted-foreground mb-8">
          Manage plans, discount codes, subscribers, and system configuration
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="plans" className="gap-2" data-testid="membership-plans-tab">
              <CreditCard className="h-4 w-4" /> Plans
            </TabsTrigger>
            <TabsTrigger value="discounts" className="gap-2" data-testid="membership-discount-tab">
              <Tag className="h-4 w-4" /> Discount Codes
            </TabsTrigger>
            <TabsTrigger value="subscribers" className="gap-2" data-testid="membership-subscribers-tab">
              <Users className="h-4 w-4" /> Subscribers
            </TabsTrigger>
            <TabsTrigger value="changelog" className="gap-2" data-testid="membership-changelog-tab">
              <History className="h-4 w-4" /> Change Log
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2" data-testid="membership-config-tab">
              <Settings className="h-4 w-4" /> Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans"><PlansManager /></TabsContent>
          <TabsContent value="discounts"><DiscountCodesManager /></TabsContent>
          <TabsContent value="subscribers"><SubscribersManager /></TabsContent>
          <TabsContent value="changelog"><ChangelogViewer /></TabsContent>
          <TabsContent value="config"><ConfigManager /></TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}

// ==================== Plans Manager ====================

function PlansManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [billingCycle, setBillingCycle] = useState("ANNUAL");
  const [features, setFeatures] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState("1");

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<Plan[]>("/api/admin/membership/plans");
      setPlans(data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const resetForm = () => {
    setName(""); setSlug(""); setPrice(""); setBillingCycle("ANNUAL");
    setFeatures(""); setIsActive(true); setDisplayOrder("1"); setEditing(null);
  };

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setName(plan.name);
    setSlug(plan.slug);
    setPrice(String(plan.price));
    setBillingCycle(plan.billingCycle);
    setFeatures((plan.features || []).join("\n"));
    setIsActive(plan.isActive);
    setDisplayOrder(String(plan.displayOrder));
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name, slug,
      price: Number(price),
      billingCycle,
      features: features.split("\n").map(f => f.trim()).filter(Boolean),
      isActive,
      displayOrder: Number(displayOrder),
    };

    try {
      if (editing) {
        await apiClient.put(`/api/admin/membership/plans/${editing.id}`, payload);
        toast.success("Plan updated");
      } else {
        await apiClient.post("/api/admin/membership/plans", payload);
        toast.success("Plan created");
      }
      setShowForm(false);
      resetForm();
      fetchPlans();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.message || "Failed to save plan");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/api/admin/membership/plans/${id}`);
      toast.success("Plan deactivated");
      fetchPlans();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete plan");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Membership Plans</CardTitle>
        <Button onClick={() => { resetForm(); setShowForm(true); }} data-testid="plan-create-btn">
          <Plus className="h-4 w-4 mr-2" /> Add Plan
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : (
          <div className="space-y-3">
            {plans.map(plan => (
              <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid="plan-row">
                <div>
                  <p className="font-semibold">{plan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ₹{Number(plan.price).toLocaleString("en-IN")} / {plan.billingCycle.toLowerCase()}
                    {!plan.isActive && <Badge variant="secondary" className="ml-2">Inactive</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {plan._count?.memberships ?? 0} subscribers · slug: {plan.slug}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(plan)} data-testid="plan-edit-btn">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(plan.id)} data-testid="plan-delete-btn">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {plans.length === 0 && <p className="text-center text-muted-foreground py-4">No plans yet</p>}
          </div>
        )}
      </CardContent>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Plan" : "Create Plan"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label>Slug</Label><Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g. standard-annual" /></div>
            <div><Label>Price (₹)</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} /></div>
            <div>
              <Label>Billing Cycle</Label>
              <Select value={billingCycle} onValueChange={setBillingCycle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                  <SelectItem value="LIFETIME">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Features (one per line)</Label><textarea className="w-full border rounded-md p-2 text-sm min-h-[80px]" value={features} onChange={e => setFeatures(e.target.value)} /></div>
            <div><Label>Display Order</Label><Input type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} /></div>
            <div className="flex items-center gap-2"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label>Active</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ==================== Discount Codes Manager ====================

function DiscountCodesManager() {
  const [codes, setCodes] = useState<DiscountCodeT[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DiscountCodeT | null>(null);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [dcIsActive, setDcIsActive] = useState(true);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<DiscountCodeT[]>("/api/admin/membership/discount-codes");
      setCodes(data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const resetForm = () => {
    setCode(""); setDiscountType("PERCENTAGE"); setDiscountValue(""); setMaxUses("");
    setValidFrom(""); setValidUntil(""); setDcIsActive(true); setEditing(null);
  };

  const handleSave = async () => {
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      maxUses: maxUses ? Number(maxUses) : null,
      validFrom: validFrom || new Date().toISOString(),
      validUntil: validUntil || null,
      applicablePlanIds: [],
      isActive: dcIsActive,
    };

    try {
      if (editing) {
        await apiClient.put(`/api/admin/membership/discount-codes/${editing.id}`, payload);
        toast.success("Discount code updated");
      } else {
        await apiClient.post("/api/admin/membership/discount-codes", payload);
        toast.success("Discount code created");
      }
      setShowForm(false);
      resetForm();
      fetchCodes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.message || "Failed to save discount code");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/api/admin/membership/discount-codes/${id}`);
      toast.success("Discount code deactivated");
      fetchCodes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Discount Codes</CardTitle>
        <Button onClick={() => { resetForm(); setShowForm(true); }} data-testid="discount-create-btn">
          <Plus className="h-4 w-4 mr-2" /> Add Code
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : (
          <div className="space-y-3">
            {codes.map(dc => (
              <div key={dc.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid="discount-row">
                <div>
                  <p className="font-mono font-semibold">{dc.code}</p>
                  <p className="text-sm text-muted-foreground">
                    {dc.discountType === "PERCENTAGE"
                      ? `${Number(dc.discountValue)}% off`
                      : `₹${Number(dc.discountValue).toLocaleString("en-IN")} off`}
                    {" · "}Used {dc.currentUses}/{dc.maxUses ?? "∞"}
                    {!dc.isActive && <Badge variant="secondary" className="ml-2">Inactive</Badge>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => {
                    setEditing(dc);
                    setCode(dc.code);
                    setDiscountType(dc.discountType);
                    setDiscountValue(String(dc.discountValue));
                    setMaxUses(dc.maxUses ? String(dc.maxUses) : "");
                    setValidFrom(dc.validFrom ? dc.validFrom.slice(0, 10) : "");
                    setValidUntil(dc.validUntil ? dc.validUntil.slice(0, 10) : "");
                    setDcIsActive(dc.isActive);
                    setShowForm(true);
                  }} data-testid="discount-edit-btn">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(dc.id)} data-testid="discount-delete-btn">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {codes.length === 0 && <p className="text-center text-muted-foreground py-4">No discount codes</p>}
          </div>
        )}
      </CardContent>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Discount Code" : "Create Discount Code"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Code</Label><Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="SUMMER2026" /></div>
            <div>
              <Label>Type</Label>
              <Select value={discountType} onValueChange={setDiscountType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>{discountType === "PERCENTAGE" ? "Percentage (%)" : "Amount (₹)"}</Label>
              <Input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} />
            </div>
            <div><Label>Max Uses (blank = unlimited)</Label><Input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} /></div>
            <div><Label>Valid From</Label><Input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} /></div>
            <div><Label>Valid Until (blank = no expiry)</Label><Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} /></div>
            <div className="flex items-center gap-2"><Switch checked={dcIsActive} onCheckedChange={setDcIsActive} /><Label>Active</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ==================== Subscribers Manager ====================

function SubscribersManager() {
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchMemberships = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{
        success: boolean;
        memberships: MembershipRow[];
        total: number;
      }>(`/api/admin/membership/memberships?page=${page}&limit=20`);
      if (data?.success) {
        setMemberships(data.memberships);
        setTotal(data.total);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchMemberships(); }, [fetchMemberships]);

  const statusColor = (s: string) => {
    switch (s) {
      case "ACTIVE": return "bg-green-600";
      case "EXPIRED": return "bg-gray-500";
      case "CANCELLED": return "bg-red-500";
      case "SUSPENDED": return "bg-amber-500";
      default: return "";
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Subscribers ({total})</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : (
          <>
            <div className="space-y-3">
              {memberships.map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">{m.user.fullName}</p>
                    <p className="text-sm text-muted-foreground">{m.user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.plan.name} · {new Date(m.startDate).toLocaleDateString()} - {new Date(m.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={statusColor(m.status)}>{m.status}</Badge>
                </div>
              ))}
              {memberships.length === 0 && <p className="text-center text-muted-foreground py-4">No subscribers</p>}
            </div>
            {total > 20 && (
              <div className="flex gap-2 mt-4 justify-center">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <span className="text-sm self-center">Page {page}</span>
                <Button size="sm" variant="outline" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Changelog Viewer ====================

function ChangelogViewer() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchChangelog = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{
        success: boolean;
        changelog: ChangelogEntry[];
        total: number;
      }>(`/api/admin/membership/changelog?page=${page}&limit=20`);
      if (data?.success) {
        setEntries(data.changelog);
        setTotal(data.total);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchChangelog(); }, [fetchChangelog]);

  return (
    <Card>
      <CardHeader><CardTitle>Plan Change Log ({total})</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : (
          <>
            <div className="space-y-3">
              {entries.map(e => (
                <div key={e.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{e.user.fullName} <span className="text-muted-foreground font-normal">({e.user.email})</span></p>
                    <Badge variant="outline">{e.changeType}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {e.oldPlanName && `From: ${e.oldPlanName}`}
                    {e.oldPlanName && e.newPlanName && " → "}
                    {e.newPlanName && `To: ${e.newPlanName}`}
                    {e.oldPrice != null && e.newPrice != null && ` · ₹${Number(e.oldPrice).toLocaleString()} → ₹${Number(e.newPrice).toLocaleString()}`}
                    {e.proratedAmount != null && ` · Prorated: ₹${Number(e.proratedAmount).toLocaleString()}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</p>
                  {e.reason && <p className="text-xs mt-1">Reason: {e.reason}</p>}
                </div>
              ))}
              {entries.length === 0 && <p className="text-center text-muted-foreground py-4">No changes logged</p>}
            </div>
            {total > 20 && (
              <div className="flex gap-2 mt-4 justify-center">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <span className="text-sm self-center">Page {page}</span>
                <Button size="sm" variant="outline" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Config Manager ====================

function ConfigManager() {
  const [configs, setConfigs] = useState<ConfigEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ success: boolean; configs: ConfigEntry[] }>(
        "/api/admin/membership/system-config"
      );
      if (data?.success) {
        setConfigs(data.configs);
        const vals: Record<string, string> = {};
        data.configs.forEach((c: ConfigEntry) => { vals[c.key] = c.value; });
        setEditValues(vals);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      await apiClient.put(`/api/admin/membership/system-config/${encodeURIComponent(key)}`, {
        value: editValues[key] || "",
      });
      toast.success(`Config "${key}" saved`);
      fetchConfigs();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.message || "Failed to save config");
    } finally { setSaving(null); }
  };

  // Default config keys we always show
  const defaultKeys = [
    { key: "membership.introductory_price_override", description: "Override all plan prices to this amount (leave blank to disable)" },
    { key: "persona.monthly_quota", description: "Max Persona verifications per month (default 500)" },
    { key: "persona.monthly_used", description: "Verifications used this month (resets monthly)" },
  ];

  const allKeys = new Set([...defaultKeys.map(d => d.key), ...configs.map(c => c.key)]);

  return (
    <Card>
      <CardHeader><CardTitle>System Configuration</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : (
          <div className="space-y-4">
            {[...allKeys].filter(k => k.startsWith("membership.") || k.startsWith("persona.")).map(key => {
              const existing = configs.find(c => c.key === key);
              const defaultDef = defaultKeys.find(d => d.key === key);
              return (
                <div key={key} className="flex items-end gap-4 p-4 border rounded-lg" data-testid="config-row">
                  <div className="flex-1 space-y-1">
                    <Label className="font-mono text-xs">{key}</Label>
                    <p className="text-xs text-muted-foreground">{existing?.description || defaultDef?.description || ""}</p>
                    <Input
                      value={editValues[key] ?? existing?.value ?? ""}
                      onChange={e => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSave(key)}
                    disabled={saving === key}
                    data-testid="config-save-btn"
                  >
                    {saving === key ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
