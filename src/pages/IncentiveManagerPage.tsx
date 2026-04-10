import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import {
  TrendingUp,
  Users,
  Package,
  Wine,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Calculator,
  Award,
  Target,
  BarChart3,
  Store,
  Calendar,
  WineGlass,
  RefreshCw,
  MapPin,
  AlertCircle,
} from "lucide-react";

// ===== TYPES =====

interface Partner {
  id: string;
  name: string;
  market: string;
  tier: "Foundation" | "Growth" | "Premier";
  quarterlyCasesSold: number;
  accountsOpened: number;
  reorders: number;
  tastingsCompleted: number;
  adfSpend: number;
  quarterlyPerformanceTier: "Bronze" | "Silver" | "Gold" | null;
}

interface SPIFEntry {
  id: string;
  partnerId: string;
  partnerName: string;
  repName: string;
  type: "new_on_premise" | "new_off_premise" | "reorder" | "tasting";
  date: string;
  quantity: number;
  payout: number;
  notes?: string;
}

interface MarginScenario {
  name: string;
  description: string;
  spifs: number;
  volumeBonus: number;
  adfSpend: number;
  quarterlyBonus: number;
  totalIncentiveCost: number;
  netMargin: number;
  costPercentage: number;
}

// ===== CONSTANTS =====

const GROSS_MARGIN_PER_CASE = 216; // $48 wholesale - $30 landed = $18/bottle × 12
const SPIF_RATES = {
  new_on_premise: 150,
  new_off_premise: 100,
  reorder: 5,
  tasting: 25,
};

const QUARTERLY_THRESHOLDS = {
  Gold: { cases: 500, accounts: 15, reorders: 100, tastings: 20 },
  Silver: { cases: 300, accounts: 10, reorders: 50, tastings: 10 },
  Bronze: { cases: 150, accounts: 5, reorders: 25, tastings: 5 },
};

// ===== LOCAL STORAGE KEYS =====

const STORAGE_KEY_PARTNERS = "hajime_incentive_partners";
const STORAGE_KEY_SPIFS = "hajime_incentive_spifs";

// ===== HELPER FUNCTIONS =====

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function calculateQuarterlyTier(partner: Omit<Partner, "quarterlyPerformanceTier">): "Bronze" | "Silver" | "Gold" | null {
  const { cases, accounts, reorders, tastings } = QUARTERLY_THRESHOLDS.Gold;
  if (
    partner.quarterlyCasesSold >= cases &&
    partner.accountsOpened >= accounts &&
    partner.reorders >= reorders &&
    partner.tastingsCompleted >= tastings
  ) {
    return "Gold";
  }
  
  const silver = QUARTERLY_THRESHOLDS.Silver;
  if (
    partner.quarterlyCasesSold >= silver.cases &&
    partner.accountsOpened >= silver.accounts &&
    partner.reorders >= silver.reorders &&
    partner.tastingsCompleted >= silver.tastings
  ) {
    return "Silver";
  }
  
  const bronze = QUARTERLY_THRESHOLDS.Bronze;
  if (
    partner.quarterlyCasesSold >= bronze.cases &&
    partner.accountsOpened >= bronze.accounts &&
    partner.reorders >= bronze.reorders &&
    partner.tastingsCompleted >= bronze.tastings
  ) {
    return "Bronze";
  }
  
  return null;
}

function getTierColor(tier: string | null): string {
  switch (tier) {
    case "Gold": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Silver": return "bg-gray-100 text-gray-800 border-gray-200";
    case "Bronze": return "bg-amber-100 text-amber-800 border-amber-200";
    default: return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function getHealthScoreColor(percentage: number): string {
  if (percentage <= 10) return "text-green-600";
  if (percentage <= 15) return "text-amber-600";
  return "text-red-600";
}

function getHealthBadgeVariant(percentage: number): "default" | "secondary" | "destructive" | "outline" {
  if (percentage <= 10) return "default";
  if (percentage <= 15) return "secondary";
  return "destructive";
}

// ===== MAIN COMPONENT =====

export default function IncentiveManagerPage() {
  // Load from localStorage on mount
  const [partners, setPartners] = useState<Partner[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY_PARTNERS);
      if (saved) return JSON.parse(saved);
    }
    return [
      {
        id: "1",
        name: "Convoy Supply Ontario",
        market: "Ontario",
        tier: "Growth",
        quarterlyCasesSold: 420,
        accountsOpened: 12,
        reorders: 85,
        tastingsCompleted: 18,
        adfSpend: 2500,
        quarterlyPerformanceTier: "Silver",
      },
      {
        id: "2",
        name: "Liberty Wine Merchants",
        market: "British Columbia",
        tier: "Premier",
        quarterlyCasesSold: 680,
        accountsOpened: 22,
        reorders: 145,
        tastingsCompleted: 28,
        adfSpend: 4200,
        quarterlyPerformanceTier: "Gold",
      },
      {
        id: "3",
        name: "Saq Distributions",
        market: "Quebec",
        tier: "Foundation",
        quarterlyCasesSold: 180,
        accountsOpened: 6,
        reorders: 32,
        tastingsCompleted: 8,
        adfSpend: 1200,
        quarterlyPerformanceTier: "Bronze",
      },
    ];
  });

  const [spifs, setSpifs] = useState<SPIFEntry[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY_SPIFS);
      if (saved) return JSON.parse(saved);
    }
    return [
      {
        id: "s1",
        partnerId: "1",
        partnerName: "Convoy Supply Ontario",
        repName: "Sarah Mitchell",
        type: "new_on_premise",
        date: "2026-04-05",
        quantity: 2,
        payout: 300,
        notes: "The Drake Hotel - new cocktail menu",
      },
      {
        id: "s2",
        partnerId: "1",
        partnerName: "Convoy Supply Ontario",
        repName: "Mike Chen",
        type: "reorder",
        date: "2026-04-08",
        quantity: 10,
        payout: 50,
      },
      {
        id: "s3",
        partnerId: "2",
        partnerName: "Liberty Wine Merchants",
        repName: "Jessica Park",
        type: "tasting",
        date: "2026-04-10",
        quantity: 3,
        payout: 75,
        notes: "Private buyer event",
      },
    ];
  });

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PARTNERS, JSON.stringify(partners));
  }, [partners]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SPIFS, JSON.stringify(spifs));
  }, [spifs]);

  // ===== CALCULATED METRICS =====

  const dashboardMetrics = useMemo(() => {
    const totalCases = partners.reduce((sum, p) => sum + p.quarterlyCasesSold, 0);
    const totalAccounts = partners.reduce((sum, p) => sum + p.accountsOpened, 0);
    const totalReorders = partners.reduce((sum, p) => sum + p.reorders, 0);
    const totalTastings = partners.reduce((sum, p) => sum + p.tastingsCompleted, 0);
    const totalADFSpend = partners.reduce((sum, p) => sum + p.adfSpend, 0);
    const totalSPIFs = spifs.reduce((sum, s) => sum + s.payout, 0);
    const totalGrossMargin = totalCases * GROSS_MARGIN_PER_CASE;
    
    // Estimate volume bonuses (simplified)
    const volumeBonuses = partners
      .filter(p => p.quarterlyPerformanceTier === "Gold")
      .length * 2500 +
      partners.filter(p => p.quarterlyPerformanceTier === "Silver").length * 1200;
    
    const totalIncentiveCost = totalSPIFs + totalADFSpend + volumeBonuses;
    const netMargin = totalGrossMargin - totalIncentiveCost;
    const costPercentage = totalGrossMargin > 0 ? (totalIncentiveCost / totalGrossMargin) * 100 : 0;

    return {
      totalCases,
      totalAccounts,
      totalReorders,
      totalTastings,
      totalADFSpend,
      totalSPIFs,
      volumeBonuses,
      totalGrossMargin,
      totalIncentiveCost,
      netMargin,
      costPercentage,
    };
  }, [partners, spifs]);

  // ===== PARTNER MANAGEMENT =====

  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerForm, setPartnerForm] = useState({
    name: "",
    market: "",
    tier: "Foundation" as Partner["tier"],
    quarterlyCasesSold: 0,
    accountsOpened: 0,
    reorders: 0,
    tastingsCompleted: 0,
    adfSpend: 0,
  });

  const handleSavePartner = () => {
    if (!partnerForm.name || !partnerForm.market) {
      toast.error("Name and market are required");
      return;
    }

    const tier = calculateQuarterlyTier(partnerForm);

    if (editingPartner) {
      setPartners(prev =>
        prev.map(p =>
          p.id === editingPartner.id
            ? { ...p, ...partnerForm, quarterlyPerformanceTier: tier }
            : p
        )
      );
      toast.success("Partner updated");
    } else {
      const newPartner: Partner = {
        id: generateId(),
        ...partnerForm,
        quarterlyPerformanceTier: tier,
      };
      setPartners(prev => [...prev, newPartner]);
      toast.success("Partner added");
    }

    setIsPartnerDialogOpen(false);
    setEditingPartner(null);
    setPartnerForm({
      name: "",
      market: "",
      tier: "Foundation",
      quarterlyCasesSold: 0,
      accountsOpened: 0,
      reorders: 0,
      tastingsCompleted: 0,
      adfSpend: 0,
    });
  };

  const handleDeletePartner = (id: string) => {
    setPartners(prev => prev.filter(p => p.id !== id));
    setSpifs(prev => prev.filter(s => s.partnerId !== id));
    toast.success("Partner deleted");
  };

  // ===== SPIF MANAGEMENT =====

  const [isSPIFDialogOpen, setIsSPIFDialogOpen] = useState(false);
  const [spifForm, setSpifForm] = useState({
    partnerId: "",
    repName: "",
    type: "new_on_premise" as SPIFEntry["type"],
    date: new Date().toISOString().split("T")[0],
    quantity: 1,
    notes: "",
  });

  const calculateSPIFPayout = (type: string, quantity: number): number => {
    return SPIF_RATES[type as keyof typeof SPIF_RATES] * quantity;
  };

  const handleSaveSPIF = () => {
    if (!spifForm.partnerId || !spifForm.repName) {
      toast.error("Partner and rep name are required");
      return;
    }

    const partner = partners.find(p => p.id === spifForm.partnerId);
    const payout = calculateSPIFPayout(spifForm.type, spifForm.quantity);

    const newSPIF: SPIFEntry = {
      id: generateId(),
      partnerId: spifForm.partnerId,
      partnerName: partner?.name || "",
      repName: spifForm.repName,
      type: spifForm.type,
      date: spifForm.date,
      quantity: spifForm.quantity,
      payout,
      notes: spifForm.notes,
    };

    setSpifs(prev => [newSPIF, ...prev]);
    toast.success(`SPIF logged: $${payout} payout`);
    setIsSPIFDialogOpen(false);
    setSpifForm({
      partnerId: "",
      repName: "",
      type: "new_on_premise",
      date: new Date().toISOString().split("T")[0],
      quantity: 1,
      notes: "",
    });
  };

  const spifsByPartner = useMemo(() => {
    const grouped: Record<string, SPIFEntry[]> = {};
    for (const spif of spifs) {
      if (!grouped[spif.partnerId]) grouped[spif.partnerId] = [];
      grouped[spif.partnerId].push(spif);
    }
    return grouped;
  }, [spifs]);

  // ===== MARGIN CALCULATOR =====

  const marginScenarios: MarginScenario[] = useMemo(() => {
    const base = {
      name: "New Account",
      description: "Standard new on-premise account opening",
      spifs: 150,
      volumeBonus: 0,
      adfSpend: 25,
      quarterlyBonus: 0,
    };

    const reorder = {
      name: "Reorder",
      description: "Follow-up order from existing account",
      spifs: 5,
      volumeBonus: 0,
      adfSpend: 0,
      quarterlyBonus: 0,
    };

    const maxLoad = {
      name: "Max Incentive Load",
      description: "Gold-tier partner with full program engagement",
      spifs: 150 + 75 + 25, // new + off-premise + tasting
      volumeBonus: 21, // $2500 / 120 cases average
      adfSpend: 35,
      quarterlyBonus: 21, // $2500 / 120 cases
    };

    return [base, reorder, maxLoad].map(s => {
      const totalIncentiveCost = s.spifs + s.volumeBonus + s.adfSpend + s.quarterlyBonus;
      const netMargin = GROSS_MARGIN_PER_CASE - totalIncentiveCost;
      return {
        ...s,
        totalIncentiveCost,
        netMargin,
        costPercentage: (totalIncentiveCost / GROSS_MARGIN_PER_CASE) * 100,
      };
    });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supply Chain Incentive Manager"
        description="Track partner performance, SPIF payouts, and margin optimization across your distribution network."
      />

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="partners">
            <Users className="h-4 w-4 mr-2" />
            Partners
          </TabsTrigger>
          <TabsTrigger value="spifs">
            <DollarSign className="h-4 w-4 mr-2" />
            SPIF Tracker
          </TabsTrigger>
          <TabsTrigger value="margin">
            <Calculator className="h-4 w-4 mr-2" />
            Margin Calculator
          </TabsTrigger>
        </TabsList>

        {/* ===== DASHBOARD TAB ===== */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cases</p>
                    <p className="text-2xl font-bold">{dashboardMetrics.totalCases.toLocaleString()}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Accounts Opened</p>
                    <p className="text-2xl font-bold">{dashboardMetrics.totalAccounts}</p>
                  </div>
                  <Store className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Reorders</p>
                    <p className="text-2xl font-bold">{dashboardMetrics.totalReorders}</p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tastings</p>
                    <p className="text-2xl font-bold">{dashboardMetrics.totalTastings}</p>
                  </div>
                  <WineGlass className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Margin Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Gross Margin Breakdown (per case: ${GROSS_MARGIN_PER_CASE})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stacked Bar Visualization */}
              <div className="space-y-2">
                <div className="flex h-8 rounded-lg overflow-hidden">
                  <div 
                    className="bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${(dashboardMetrics.netMargin / dashboardMetrics.totalGrossMargin) * 100}%` }}
                  >
                    {Math.round((dashboardMetrics.netMargin / dashboardMetrics.totalGrossMargin) * 100)}%
                  </div>
                  <div 
                    className="bg-red-400 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${(dashboardMetrics.totalSPIFs / dashboardMetrics.totalGrossMargin) * 100}%` }}
                  >
                    {Math.round((dashboardMetrics.totalSPIFs / dashboardMetrics.totalGrossMargin) * 100)}%
                  </div>
                  <div 
                    className="bg-amber-400 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${(dashboardMetrics.volumeBonuses / dashboardMetrics.totalGrossMargin) * 100}%` }}
                  >
                    {Math.round((dashboardMetrics.volumeBonuses / dashboardMetrics.totalGrossMargin) * 100)}%
                  </div>
                  <div 
                    className="bg-purple-400 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${(dashboardMetrics.totalADFSpend / dashboardMetrics.totalGrossMargin) * 100}%` }}
                  >
                    {Math.round((dashboardMetrics.totalADFSpend / dashboardMetrics.totalGrossMargin) * 100)}%
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500" />
                    <span>Retained Margin: ${dashboardMetrics.netMargin.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-400" />
                    <span>SPIFs: ${dashboardMetrics.totalSPIFs.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-amber-400" />
                    <span>Volume Bonuses: ${dashboardMetrics.volumeBonuses.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-400" />
                    <span>ADF Spend: ${dashboardMetrics.totalADFSpend.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Total Gross Margin</p>
                  <p className="text-2xl font-bold">${dashboardMetrics.totalGrossMargin.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Incentive Cost</p>
                  <p className="text-2xl font-bold text-red-600">${dashboardMetrics.totalIncentiveCost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Margin</p>
                  <p className={`text-2xl font-bold ${getHealthScoreColor(dashboardMetrics.costPercentage)}`}>
                    ${dashboardMetrics.netMargin.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partner Health Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Partner Health Scores</CardTitle>
              <p className="text-sm text-muted-foreground">
                Incentive cost as % of gross margin. >15% flags red.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {partners.map(partner => {
                  const partnerSPIFs = spifsByPartner[partner.id]?.reduce((sum, s) => sum + s.payout, 0) || 0;
                  const partnerVolumeBonus = partner.quarterlyPerformanceTier === "Gold" ? 2500 : 
                    partner.quarterlyPerformanceTier === "Silver" ? 1200 : 0;
                  const partnerTotalCost = partnerSPIFs + partnerVolumeBonus + partner.adfSpend;
                  const partnerGrossMargin = partner.quarterlyCasesSold * GROSS_MARGIN_PER_CASE;
                  const healthPercentage = partnerGrossMargin > 0 ? (partnerTotalCost / partnerGrossMargin) * 100 : 0;

                  return (
                    <div key={partner.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{partner.name}</span>
                          <Badge variant={getHealthBadgeVariant(healthPercentage)}>
                            {healthPercentage.toFixed(1)}%
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ${partnerTotalCost.toLocaleString()} / ${partnerGrossMargin.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={Math.min(healthPercentage, 100)} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== PARTNERS TAB ===== */}
        <TabsContent value="partners" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Distributors & Importers ({partners.length})</h3>
            <Dialog open={isPartnerDialogOpen} onOpenChange={setIsPartnerDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingPartner(null);
                  setPartnerForm({
                    name: "",
                    market: "",
                    tier: "Foundation",
                    quarterlyCasesSold: 0,
                    accountsOpened: 0,
                    reorders: 0,
                    tastingsCompleted: 0,
                    adfSpend: 0,
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Partner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingPartner ? "Edit Partner" : "Add New Partner"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Partner Name *</Label>
                    <Input 
                      value={partnerForm.name} 
                      onChange={e => setPartnerForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Convoy Supply Ontario"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Market *</Label>
                      <Select 
                        value={partnerForm.market} 
                        onValueChange={v => setPartnerForm(prev => ({ ...prev, market: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select market" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Ontario", "British Columbia", "Quebec", "Alberta", "Manitoba", "Saskatchewan", "Nova Scotia", "International"].map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Tier</Label>
                      <Select 
                        value={partnerForm.tier} 
                        onValueChange={v => setPartnerForm(prev => ({ ...prev, tier: v as Partner["tier"] }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Foundation">Foundation</SelectItem>
                          <SelectItem value="Growth">Growth</SelectItem>
                          <SelectItem value="Premier">Premier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quarterly Cases</Label>
                      <Input 
                        type="number"
                        value={partnerForm.quarterlyCasesSold} 
                        onChange={e => setPartnerForm(prev => ({ ...prev, quarterlyCasesSold: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Accounts Opened</Label>
                      <Input 
                        type="number"
                        value={partnerForm.accountsOpened} 
                        onChange={e => setPartnerForm(prev => ({ ...prev, accountsOpened: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Reorders</Label>
                      <Input 
                        type="number"
                        value={partnerForm.reorders} 
                        onChange={e => setPartnerForm(prev => ({ ...prev, reorders: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Tastings</Label>
                      <Input 
                        type="number"
                        value={partnerForm.tastingsCompleted} 
                        onChange={e => setPartnerForm(prev => ({ ...prev, tastingsCompleted: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>ADF Spend ($)</Label>
                    <Input 
                      type="number"
                      value={partnerForm.adfSpend} 
                      onChange={e => setPartnerForm(prev => ({ ...prev, adfSpend: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSavePartner}>{editingPartner ? "Update" : "Add"} Partner</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {partners.map(partner => (
              <Card key={partner.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-semibold">{partner.name}</h4>
                        <Badge variant="outline">{partner.tier}</Badge>
                        {partner.quarterlyPerformanceTier && (
                          <Badge className={getTierColor(partner.quarterlyPerformanceTier)}>
                            <Award className="h-3 w-3 mr-1" />
                            {partner.quarterlyPerformanceTier}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {partner.market}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setEditingPartner(partner);
                          setPartnerForm({
                            name: partner.name,
                            market: partner.market,
                            tier: partner.tier,
                            quarterlyCasesSold: partner.quarterlyCasesSold,
                            accountsOpened: partner.accountsOpened,
                            reorders: partner.reorders,
                            tastingsCompleted: partner.tastingsCompleted,
                            adfSpend: partner.adfSpend,
                          });
                          setIsPartnerDialogOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeletePartner(partner.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Cases</p>
                      <p className="font-semibold">{partner.quarterlyCasesSold}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Accounts</p>
                      <p className="font-semibold">{partner.accountsOpened}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reorders</p>
                      <p className="font-semibold">{partner.reorders}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tastings</p>
                      <p className="font-semibold">{partner.tastingsCompleted}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm text-muted-foreground">
                    ADF Spend: ${partner.adfSpend.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {partners.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No partners yet</p>
                <p className="text-muted-foreground">Add your first distributor or importer to start tracking.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== SPIF TRACKER TAB ===== */}
        <TabsContent value="spifs" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">SPIF Payouts</h3>
              <p className="text-sm text-muted-foreground">Total logged: ${spifs.reduce((sum, s) => sum + s.payout, 0).toLocaleString()}</p>
            </div>
            <Dialog open={isSPIFDialogOpen} onOpenChange={setIsSPIFDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setSpifForm({
                  partnerId: "",
                  repName: "",
                  type: "new_on_premise",
                  date: new Date().toISOString().split("T")[0],
                  quantity: 1,
                  notes: "",
                })} >
                  <Plus className="h-4 w-4 mr-2" />
                  Log SPIF
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log SPIF Payout</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Partner *</Label>
                    <Select 
                      value={spifForm.partnerId} 
                      onValueChange={v => setSpifForm(prev => ({ ...prev, partnerId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select partner" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Rep Name *</Label>
                    <Input 
                      value={spifForm.repName} 
                      onChange={e => setSpifForm(prev => ({ ...prev, repName: e.target.value }))}
                      placeholder="e.g., Sarah Mitchell"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>SPIF Type</Label>
                      <Select 
                        value={spifForm.type} 
                        onValueChange={v => setSpifForm(prev => ({ ...prev, type: v as SPIFEntry["type"] }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new_on_premise">New On-Premise ($150)</SelectItem>
                          <SelectItem value="new_off_premise">New Off-Premise ($100)</SelectItem>
                          <SelectItem value="reorder">Reorder Case ($5)</SelectItem>
                          <SelectItem value="tasting">Buyer Tasting ($25)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input 
                        type="number"
                        min={1}
                        value={spifForm.quantity} 
                        onChange={e => setSpifForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input 
                        type="date"
                        value={spifForm.date} 
                        onChange={e => setSpifForm(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Calculated Payout</Label>
                      <div className="h-10 flex items-center px-3 bg-muted rounded-md font-semibold">
                        ${calculateSPIFPayout(spifForm.type, spifForm.quantity)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input 
                      value={spifForm.notes} 
                      onChange={e => setSpifForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="e.g., The Drake Hotel - new cocktail menu"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveSPIF}>Log SPIF</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* SPIF Entries */}
          <div className="space-y-4">
            {spifs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No SPIF payouts yet</p>
                  <p className="text-muted-foreground">Log your first SPIF to start tracking distributor rep incentives.</p>
                </CardContent>
              </Card>
            ) : (
              spifs.map(spif => (
                <Card key={spif.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{spif.repName}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{spif.partnerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">{spif.type.replace("_", " ")}</Badge>
                          <span className="text-muted-foreground">× {spif.quantity}</span>
                          <span className="text-muted-foreground">•</span>
                          <Calendar className="h-3 w-3" />
                          <span className="text-muted-foreground">{spif.date}</span>
                        </div>
                        {spif.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{spif.notes}</p>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">${spif.payout}</p>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSpifs(prev => prev.filter(s => s.id !== spif.id))}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Running Totals by Partner */}
          {spifs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Running Totals by Partner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {partners.map(partner => {
                    const partnerSpifs = spifsByPartner[partner.id] || [];
                    const total = partnerSpifs.reduce((sum, s) => sum + s.payout, 0);
                    if (total === 0) return null;
                    return (
                      <div key={partner.id} className="flex justify-between items-center py-2 border-b last:border-0">
                        <span>{partner.name}</span>
                        <span className="font-semibold">${total.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== MARGIN CALCULATOR TAB ===== */}
        <TabsContent value="margin" className="space-y-6">
          {/* Pricing Chain */}
          <Card>
            <CardHeader>
              <CardTitle>Supply Chain Pricing Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {[
                  { label: "Landed Cost", value: 30, color: "bg-slate-500" },
                  { label: "Wholesale", value: 48, color: "bg-blue-500" },
                  { label: "Retail", value: 60, color: "bg-indigo-500" },
                  { label: "Shelf", value: 93, color: "bg-purple-500" },
                ].map((step, i, arr) => (
                  <>
                    <div key={step.label} className="text-center">
                      <div className={`${step.color} text-white rounded-lg p-4 w-24`}>
                        <p className="text-2xl font-bold">${step.value}</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{step.label}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex-1 h-0.5 bg-border mx-4" />
                    )}
                  </>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Gross Margin per Case</p>
                    <p className="text-3xl font-bold">${GROSS_MARGIN_PER_CASE}</p>
                    <p className="text-sm text-muted-foreground">$48 wholesale − $30 landed = $18/bottle × 12</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Margin %</p>
                    <p className="text-3xl font-bold">{((GROSS_MARGIN_PER_CASE / (48 * 12)) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scenario Analysis */}
          <div className="grid gap-4 md:grid-cols-3">
            {marginScenarios.map(scenario => (
              <Card key={scenario.name}>
                <CardHeader>
                  <CardTitle className="text-base">{scenario.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{scenario.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>SPIFs</span>
                      <span>${scenario.spifs}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Volume Bonus</span>
                      <span>${scenario.volumeBonus}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>ADF Spend</span>
                      <span>${scenario.adfSpend}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Quarterly Bonus</span>
                      <span>${scenario.quarterlyBonus}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Total Incentive Cost</span>
                      <span className="font-semibold text-red-600">${scenario.totalIncentiveCost}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">Net Margin</span>
                      <span className={`font-semibold ${getHealthScoreColor(scenario.costPercentage)}`}>
                        ${scenario.netMargin}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">Cost %</span>
                      <Badge variant={scenario.costPercentage <= 15 ? "default" : "destructive"}>
                        {scenario.costPercentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* SPIF Rate Reference */}
          <Card>
            <CardHeader>
              <CardTitle>SPIF Rate Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(SPIF_RATES).map(([type, rate]) => (
                  <div key={type} className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">${rate}</p>
                    <p className="text-sm text-muted-foreground capitalize">{type.replace("_", " ")}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
