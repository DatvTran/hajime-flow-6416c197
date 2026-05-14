import { useState, useMemo, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSupplyChainIncentivesState,
  putSupplyChainIncentivesState,
  type SupplyChainIncentiveStatePayload,
} from "@/lib/api-v1-mutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  BarChart3,
  Store,
  Calendar,
  RefreshCw,
  MapPin,
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

/** Bottles per case for wholesale margin math (pricing inputs are per bottle). */
const BOTTLES_PER_CASE = 12;

const DEFAULT_SUPPLY_CHAIN_PRICING = {
  landed: 30,
  wholesale: 48,
  retail: 60,
  shelf: 93,
} as const;

type SupplyChainPricing = {
  landed: number;
  wholesale: number;
  retail: number;
  shelf: number;
};

const DEFAULT_SPIF_RATES = {
  new_on_premise: 150,
  new_off_premise: 100,
  reorder: 5,
  tasting: 25,
} as const;

type SpifRateKey = keyof typeof DEFAULT_SPIF_RATES;
type SpifRates = Record<SpifRateKey, number>;

const SPIF_RATE_FIELD_LABELS: Record<SpifRateKey, string> = {
  new_on_premise: "New on-premise (per account)",
  new_off_premise: "New off-premise (per account)",
  reorder: "Reorder (per case)",
  tasting: "Buyer tasting (per event)",
};

const DEFAULT_VOLUME_BONUSES_USD = {
  gold: 2500,
  silver: 1200,
} as const;

type VolumeBonusesUsd = { gold: number; silver: number };

const QUARTERLY_THRESHOLDS = {
  Gold: { cases: 500, accounts: 15, reorders: 100, tastings: 20 },
  Silver: { cases: 300, accounts: 10, reorders: 50, tastings: 10 },
  Bronze: { cases: 150, accounts: 5, reorders: 25, tastings: 5 },
};

// ===== LOCAL STORAGE KEYS =====

const STORAGE_KEY_PARTNERS = "hajime_incentive_partners";
const STORAGE_KEY_SPIFS = "hajime_incentive_spifs";
const STORAGE_KEY_SUPPLY_CHAIN = "hajime_supply_chain_pricing";
const STORAGE_KEY_SPIF_RATES = "hajime_spif_rates";
const STORAGE_KEY_VOLUME_BONUSES = "hajime_incentive_volume_bonuses_usd";

function clampUsdPrice(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, 1_000_000);
}

function loadSpifRates(): SpifRates {
  if (typeof window === "undefined") return { ...DEFAULT_SPIF_RATES };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SPIF_RATES);
    if (!raw) return { ...DEFAULT_SPIF_RATES };
    const p = JSON.parse(raw) as Partial<SpifRates>;
    return {
      new_on_premise: clampUsdPrice(Number(p.new_on_premise ?? DEFAULT_SPIF_RATES.new_on_premise)),
      new_off_premise: clampUsdPrice(Number(p.new_off_premise ?? DEFAULT_SPIF_RATES.new_off_premise)),
      reorder: clampUsdPrice(Number(p.reorder ?? DEFAULT_SPIF_RATES.reorder)),
      tasting: clampUsdPrice(Number(p.tasting ?? DEFAULT_SPIF_RATES.tasting)),
    };
  } catch {
    return { ...DEFAULT_SPIF_RATES };
  }
}

function loadVolumeBonusesUsd(): VolumeBonusesUsd {
  if (typeof window === "undefined") return { ...DEFAULT_VOLUME_BONUSES_USD };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VOLUME_BONUSES);
    if (!raw) return { ...DEFAULT_VOLUME_BONUSES_USD };
    const p = JSON.parse(raw) as Partial<VolumeBonusesUsd>;
    return {
      gold: clampUsdPrice(Number(p.gold ?? DEFAULT_VOLUME_BONUSES_USD.gold)),
      silver: clampUsdPrice(Number(p.silver ?? DEFAULT_VOLUME_BONUSES_USD.silver)),
    };
  } catch {
    return { ...DEFAULT_VOLUME_BONUSES_USD };
  }
}

function loadSupplyChainPricing(): SupplyChainPricing {
  if (typeof window === "undefined") return { ...DEFAULT_SUPPLY_CHAIN_PRICING };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUPPLY_CHAIN);
    if (!raw) return { ...DEFAULT_SUPPLY_CHAIN_PRICING };
    const p = JSON.parse(raw) as Partial<SupplyChainPricing>;
    return {
      landed: clampUsdPrice(Number(p.landed ?? DEFAULT_SUPPLY_CHAIN_PRICING.landed)),
      wholesale: clampUsdPrice(Number(p.wholesale ?? DEFAULT_SUPPLY_CHAIN_PRICING.wholesale)),
      retail: clampUsdPrice(Number(p.retail ?? DEFAULT_SUPPLY_CHAIN_PRICING.retail)),
      shelf: clampUsdPrice(Number(p.shelf ?? DEFAULT_SUPPLY_CHAIN_PRICING.shelf)),
    };
  } catch {
    return { ...DEFAULT_SUPPLY_CHAIN_PRICING };
  }
}

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

// ===== SEED DATA (first-time tenant or empty server row) =====

const SEED_PARTNERS: Partner[] = [
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

const SEED_SPIFS: SPIFEntry[] = [
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

function mergeLegacyOrSeed(): SupplyChainIncentiveStatePayload {
  let partners: Partner[] = [...SEED_PARTNERS];
  let spifs: SPIFEntry[] = [...SEED_SPIFS];
  if (typeof window !== "undefined") {
    try {
      const rawP = localStorage.getItem(STORAGE_KEY_PARTNERS);
      if (rawP) {
        const p = JSON.parse(rawP) as unknown;
        if (Array.isArray(p) && p.length > 0) partners = p as Partner[];
      }
    } catch {
      /* ignore */
    }
    try {
      const rawS = localStorage.getItem(STORAGE_KEY_SPIFS);
      if (rawS) {
        const s = JSON.parse(rawS) as unknown;
        if (Array.isArray(s) && s.length > 0) spifs = s as SPIFEntry[];
      }
    } catch {
      /* ignore */
    }
  }
  return {
    partners,
    spifs,
    supplyChainPricing: loadSupplyChainPricing(),
    spifRates: loadSpifRates(),
    volumeBonusesUsd: loadVolumeBonusesUsd(),
  };
}

function clearLegacyIncentiveLocalKeys() {
  if (typeof window === "undefined") return;
  try {
    [
      STORAGE_KEY_PARTNERS,
      STORAGE_KEY_SPIFS,
      STORAGE_KEY_SUPPLY_CHAIN,
      STORAGE_KEY_SPIF_RATES,
      STORAGE_KEY_VOLUME_BONUSES,
    ].forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

function coerceServerPayload(data: SupplyChainIncentiveStatePayload): {
  partners: Partner[];
  spifs: SPIFEntry[];
  supplyChainPricing: SupplyChainPricing;
  spifRates: SpifRates;
  volumeBonusesUsd: VolumeBonusesUsd;
} {
  const rawPartners = (data.partners ?? []) as Partner[];
  const partners = rawPartners.map((p) => {
    const { quarterlyPerformanceTier: existing, ...rest } = p;
    const tier = existing ?? calculateQuarterlyTier(rest);
    return { ...p, quarterlyPerformanceTier: tier };
  });
  return {
    partners,
    spifs: (data.spifs ?? []) as SPIFEntry[],
    supplyChainPricing: data.supplyChainPricing as SupplyChainPricing,
    spifRates: data.spifRates as SpifRates,
    volumeBonusesUsd: data.volumeBonusesUsd as VolumeBonusesUsd,
  };
}

// ===== MAIN COMPONENT =====

export default function IncentiveManagerPage() {
  const { user, isLoading } = useAuth();
  const [bootstrapped, setBootstrapped] = useState(false);
  const skipNextRemoteSave = useRef(true);
  const [lastRemoteSaveAt, setLastRemoteSaveAt] = useState<string | null>(null);
  const [remoteSaveError, setRemoteSaveError] = useState<string | null>(null);

  const [partners, setPartners] = useState<Partner[]>([]);
  const [spifs, setSpifs] = useState<SPIFEntry[]>([]);
  const [supplyChainPricing, setSupplyChainPricing] = useState<SupplyChainPricing>(() => ({
    ...DEFAULT_SUPPLY_CHAIN_PRICING,
  }));
  const [spifRates, setSpifRates] = useState<SpifRates>(() => ({ ...DEFAULT_SPIF_RATES }));
  const [volumeBonusesUsd, setVolumeBonusesUsd] = useState<VolumeBonusesUsd>(() => ({
    ...DEFAULT_VOLUME_BONUSES_USD,
  }));

  // Load from server (tenant-scoped); migrate legacy localStorage once if server has no row
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      const local = mergeLegacyOrSeed();
      const c = coerceServerPayload(local);
      setPartners(c.partners);
      setSpifs(c.spifs);
      setSupplyChainPricing(c.supplyChainPricing);
      setSpifRates(c.spifRates);
      setVolumeBonusesUsd(c.volumeBonusesUsd);
      setBootstrapped(true);
      skipNextRemoteSave.current = true;
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await getSupplyChainIncentivesState();
        if (cancelled) return;

        if (res.data == null) {
          const merged = mergeLegacyOrSeed();
          const c = coerceServerPayload(merged);
          setPartners(c.partners);
          setSpifs(c.spifs);
          setSupplyChainPricing(c.supplyChainPricing);
          setSpifRates(c.spifRates);
          setVolumeBonusesUsd(c.volumeBonusesUsd);
          try {
            await putSupplyChainIncentivesState(merged);
            clearLegacyIncentiveLocalKeys();
            setLastRemoteSaveAt(new Date().toISOString());
            setRemoteSaveError(null);
          } catch (e) {
            console.error(e);
            setRemoteSaveError(e instanceof Error ? e.message : "Save failed");
            toast.error("Could not save incentives to server", {
              description: e instanceof Error ? e.message : undefined,
            });
          }
        } else {
          const c = coerceServerPayload(res.data);
          setPartners(c.partners);
          setSpifs(c.spifs);
          setSupplyChainPricing(c.supplyChainPricing);
          setSpifRates(c.spifRates);
          setVolumeBonusesUsd(c.volumeBonusesUsd);
          setRemoteSaveError(null);
          if (res.updatedAt != null) setLastRemoteSaveAt(String(res.updatedAt));
        }
      } catch (e) {
        if (!cancelled) {
          const merged = mergeLegacyOrSeed();
          const c = coerceServerPayload(merged);
          setPartners(c.partners);
          setSpifs(c.spifs);
          setSupplyChainPricing(c.supplyChainPricing);
          setSpifRates(c.spifRates);
          setVolumeBonusesUsd(c.volumeBonusesUsd);
          setRemoteSaveError(e instanceof Error ? e.message : "Load failed");
          toast.error("Could not load incentives from server", {
            description: "Using this browser’s cached copy until the API is available.",
          });
        }
      } finally {
        if (!cancelled) {
          setBootstrapped(true);
          skipNextRemoteSave.current = true;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, user?.tenantId]);

  // Debounced save to server when logged in
  useEffect(() => {
    if (!bootstrapped || !user || isLoading) return;
    if (skipNextRemoteSave.current) {
      skipNextRemoteSave.current = false;
      return;
    }

    const payload: SupplyChainIncentiveStatePayload = {
      partners,
      spifs,
      supplyChainPricing,
      spifRates,
      volumeBonusesUsd,
    };

    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const out = await putSupplyChainIncentivesState(payload);
          setRemoteSaveError(null);
          if (out.updatedAt != null) setLastRemoteSaveAt(String(out.updatedAt));
        } catch (e) {
          console.error(e);
          setRemoteSaveError(e instanceof Error ? e.message : "Save failed");
          toast.error("Could not save incentives to server", {
            description: e instanceof Error ? e.message : undefined,
          });
        }
      })();
    }, 900);

    return () => window.clearTimeout(handle);
  }, [
    bootstrapped,
    user,
    isLoading,
    partners,
    spifs,
    supplyChainPricing,
    spifRates,
    volumeBonusesUsd,
  ]);

  // Offline / no-account: keep legacy localStorage behaviour
  useEffect(() => {
    if (user) return;
    if (!bootstrapped) return;
    try {
      localStorage.setItem(STORAGE_KEY_PARTNERS, JSON.stringify(partners));
    } catch {
      /* ignore */
    }
  }, [partners, user, bootstrapped]);

  useEffect(() => {
    if (user) return;
    if (!bootstrapped) return;
    try {
      localStorage.setItem(STORAGE_KEY_SPIFS, JSON.stringify(spifs));
    } catch {
      /* ignore */
    }
  }, [spifs, user, bootstrapped]);

  useEffect(() => {
    if (user) return;
    if (!bootstrapped) return;
    try {
      localStorage.setItem(STORAGE_KEY_SUPPLY_CHAIN, JSON.stringify(supplyChainPricing));
    } catch {
      /* ignore */
    }
  }, [supplyChainPricing, user, bootstrapped]);

  useEffect(() => {
    if (user) return;
    if (!bootstrapped) return;
    try {
      localStorage.setItem(STORAGE_KEY_SPIF_RATES, JSON.stringify(spifRates));
    } catch {
      /* ignore */
    }
  }, [spifRates, user, bootstrapped]);

  useEffect(() => {
    if (user) return;
    if (!bootstrapped) return;
    try {
      localStorage.setItem(STORAGE_KEY_VOLUME_BONUSES, JSON.stringify(volumeBonusesUsd));
    } catch {
      /* ignore */
    }
  }, [volumeBonusesUsd, user, bootstrapped]);

  const grossMarginPerCase = useMemo(() => {
    const spread = supplyChainPricing.wholesale - supplyChainPricing.landed;
    return Math.max(0, spread * BOTTLES_PER_CASE);
  }, [supplyChainPricing.landed, supplyChainPricing.wholesale]);

  const wholesaleMarginPercent = useMemo(() => {
    const revenueCase = supplyChainPricing.wholesale * BOTTLES_PER_CASE;
    if (revenueCase <= 0) return 0;
    return (grossMarginPerCase / revenueCase) * 100;
  }, [grossMarginPerCase, supplyChainPricing.wholesale]);

  // ===== CALCULATED METRICS =====

  const dashboardMetrics = useMemo(() => {
    const totalCases = partners.reduce((sum, p) => sum + p.quarterlyCasesSold, 0);
    const totalAccounts = partners.reduce((sum, p) => sum + p.accountsOpened, 0);
    const totalReorders = partners.reduce((sum, p) => sum + p.reorders, 0);
    const totalTastings = partners.reduce((sum, p) => sum + p.tastingsCompleted, 0);
    const totalADFSpend = partners.reduce((sum, p) => sum + p.adfSpend, 0);
    const totalSPIFs = spifs.reduce((sum, s) => sum + s.payout, 0);
    const totalGrossMargin = totalCases * grossMarginPerCase;
    
    // Estimate volume bonuses (simplified)
    const volumeBonuses =
      partners.filter((p) => p.quarterlyPerformanceTier === "Gold").length * volumeBonusesUsd.gold +
      partners.filter((p) => p.quarterlyPerformanceTier === "Silver").length * volumeBonusesUsd.silver;

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
  }, [partners, spifs, grossMarginPerCase, volumeBonusesUsd.gold, volumeBonusesUsd.silver]);

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
    const rate = spifRates[type as SpifRateKey];
    if (rate === undefined) return 0;
    return rate * quantity;
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
    const goldPerCaseShare = volumeBonusesUsd.gold / 120;
    const base = {
      name: "New Account",
      description: "Standard new on-premise account opening",
      spifs: spifRates.new_on_premise,
      volumeBonus: 0,
      adfSpend: 25,
      quarterlyBonus: 0,
    };

    const reorder = {
      name: "Reorder",
      description: "Follow-up order from existing account",
      spifs: spifRates.reorder,
      volumeBonus: 0,
      adfSpend: 0,
      quarterlyBonus: 0,
    };

    const maxLoad = {
      name: "Max Incentive Load",
      description: "Gold-tier partner with full program engagement",
      spifs: spifRates.new_on_premise + spifRates.tasting * 4,
      volumeBonus: goldPerCaseShare,
      adfSpend: 35,
      quarterlyBonus: goldPerCaseShare,
    };

    return [base, reorder, maxLoad].map((s) => {
      const totalIncentiveCost = s.spifs + s.volumeBonus + s.adfSpend + s.quarterlyBonus;
      const netMargin = grossMarginPerCase - totalIncentiveCost;
      return {
        ...s,
        totalIncentiveCost,
        netMargin,
        costPercentage: grossMarginPerCase > 0 ? (totalIncentiveCost / grossMarginPerCase) * 100 : 0,
      };
    });
  }, [grossMarginPerCase, spifRates, volumeBonusesUsd.gold]);

  const marginBreakdown = useMemo(() => {
    const gross = Math.max(0, dashboardMetrics.totalGrossMargin);
    const safePct = (v: number) => (gross > 0 ? (Math.max(0, v) / gross) * 100 : 0);
    const retainedPct = safePct(dashboardMetrics.netMargin);
    const spifPct = safePct(dashboardMetrics.totalSPIFs);
    const volumePct = safePct(dashboardMetrics.volumeBonuses);
    const adfPct = safePct(dashboardMetrics.totalADFSpend);

    // Ensure tiny segments are still visible; keep total close to 100.
    const clampVisible = (p: number) => (p > 0 && p < 0.8 ? 0.8 : p);
    const visible = {
      retained: clampVisible(retainedPct),
      spifs: clampVisible(spifPct),
      volume: clampVisible(volumePct),
      adf: clampVisible(adfPct),
    };
    const visibleSum = visible.retained + visible.spifs + visible.volume + visible.adf;
    const scale = visibleSum > 0 ? 100 / visibleSum : 1;
    const widths = {
      retained: visible.retained * scale,
      spifs: visible.spifs * scale,
      volume: visible.volume * scale,
      adf: visible.adf * scale,
    };

    const rounded = {
      retained: Math.round(retainedPct),
      spifs: Math.round(spifPct),
      volume: Math.round(volumePct),
      adf: Math.round(adfPct),
    };

    return { widths, rounded };
  }, [dashboardMetrics]);

  const showRemoteLoading = isLoading || (!!user && !bootstrapped);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supply Chain Incentive Manager"
        description="Track partner performance, SPIF payouts, and margin optimization. When you are signed in, partners, SPIFs, supply chain prices, SPIF rates, and quarterly bonuses are saved to the server for your organization (with automatic sync a moment after you stop editing)."
        titleAddon={
          <span className="rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-xs font-normal tabular-nums text-muted-foreground">
            {user
              ? !bootstrapped || isLoading
                ? "Loading from server…"
                : remoteSaveError
                  ? "Save error — check connection"
                  : lastRemoteSaveAt
                    ? `Server: ${new Date(lastRemoteSaveAt).toLocaleString()}`
                    : "Synced to server"
              : "Browser only (not signed in)"}
          </span>
        }
      />

      {showRemoteLoading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-border/80 bg-muted/20">
          <p className="text-sm text-muted-foreground">Loading incentives from server…</p>
        </div>
      ) : (
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-lg bg-muted/50 p-1 text-sm sm:grid-cols-4">
          <TabsTrigger value="dashboard" className="touch-manipulation">
            <BarChart3 className="mr-1.5 h-3.5 w-3.5 shrink-0 sm:mr-2 sm:h-4 sm:w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="partners" className="touch-manipulation">
            <Users className="mr-1.5 h-3.5 w-3.5 shrink-0 sm:mr-2 sm:h-4 sm:w-4" />
            Partners
          </TabsTrigger>
          <TabsTrigger value="spifs" className="touch-manipulation">
            <DollarSign className="mr-1.5 h-3.5 w-3.5 shrink-0 sm:mr-2 sm:h-4 sm:w-4" />
            SPIF Tracker
          </TabsTrigger>
          <TabsTrigger value="margin" className="touch-manipulation">
            <Calculator className="mr-1.5 h-3.5 w-3.5 shrink-0 sm:mr-2 sm:h-4 sm:w-4" />
            Margin Calculator
          </TabsTrigger>
        </TabsList>

        {/* ===== DASHBOARD TAB ===== */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card-interactive border border-border/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Cases</p>
                  <p className="font-display text-xl font-semibold tabular-nums tracking-tight text-foreground">
                    {dashboardMetrics.totalCases.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/40 p-2 text-muted-foreground">
                  <Package className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="card-interactive border border-border/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Accounts Opened</p>
                  <p className="font-display text-xl font-semibold tabular-nums tracking-tight text-foreground">{dashboardMetrics.totalAccounts}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/40 p-2 text-muted-foreground">
                  <Store className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="card-interactive border border-border/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Reorders</p>
                  <p className="font-display text-xl font-semibold tabular-nums tracking-tight text-foreground">{dashboardMetrics.totalReorders}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/40 p-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="card-interactive border border-border/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Tastings</p>
                  <p className="font-display text-xl font-semibold tabular-nums tracking-tight text-foreground">{dashboardMetrics.totalTastings}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/40 p-2 text-muted-foreground">
                  <Wine className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Margin Breakdown */}
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2 text-lg font-semibold leading-snug tracking-tight">
                <TrendingUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                Gross Margin Breakdown (per case: ${grossMarginPerCase.toLocaleString()})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stacked bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Cost composition (as % of gross margin)</div>
                  <div className="text-xs text-muted-foreground">
                    {marginBreakdown.rounded.retained}% / {marginBreakdown.rounded.spifs}% / {marginBreakdown.rounded.volume}% / {marginBreakdown.rounded.adf}%
                  </div>
                </div>

                <div className="relative h-9 overflow-hidden rounded-lg border border-border/70 bg-muted/30">
                  <div className="flex h-full w-full">
                    <div
                      className="h-full bg-foreground/10"
                      style={{ width: `${marginBreakdown.widths.retained}%` }}
                      aria-label={`Retained margin ${marginBreakdown.rounded.retained}%`}
                    />
                    <div
                      className="h-full bg-destructive/25"
                      style={{ width: `${marginBreakdown.widths.spifs}%` }}
                      aria-label={`SPIFs ${marginBreakdown.rounded.spifs}%`}
                    />
                    <div
                      className="h-full bg-amber-500/25"
                      style={{ width: `${marginBreakdown.widths.volume}%` }}
                      aria-label={`Volume bonuses ${marginBreakdown.rounded.volume}%`}
                    />
                    <div
                      className="h-full bg-violet-500/20"
                      style={{ width: `${marginBreakdown.widths.adf}%` }}
                      aria-label={`ADF spend ${marginBreakdown.rounded.adf}%`}
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3 text-xs font-medium text-muted-foreground">
                    <span className="tabular-nums">{marginBreakdown.rounded.retained}%</span>
                    <span className="tabular-nums">{marginBreakdown.rounded.spifs}%</span>
                    <span className="tabular-nums">{marginBreakdown.rounded.volume}%</span>
                    <span className="tabular-nums">{marginBreakdown.rounded.adf}%</span>
                  </div>
                </div>

                <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center justify-between rounded-md border border-border/70 bg-card/60 px-3 py-2">
                    <span className="text-muted-foreground">Retained Margin</span>
                    <span className="tabular-nums">${dashboardMetrics.netMargin.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border/70 bg-card/60 px-3 py-2">
                    <span className="text-muted-foreground">SPIFs</span>
                    <span className="tabular-nums">${dashboardMetrics.totalSPIFs.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border/70 bg-card/60 px-3 py-2">
                    <span className="text-muted-foreground">Volume Bonuses</span>
                    <span className="tabular-nums">${dashboardMetrics.volumeBonuses.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border/70 bg-card/60 px-3 py-2">
                    <span className="text-muted-foreground">ADF Spend</span>
                    <span className="tabular-nums">${dashboardMetrics.totalADFSpend.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid gap-3 border-t pt-4 sm:grid-cols-3">
                <div className="card-interactive p-4 space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Gross Margin</p>
                  <p className="font-display text-xl font-semibold tabular-nums tracking-tight text-foreground">${dashboardMetrics.totalGrossMargin.toLocaleString()}</p>
                </div>
                <div className="card-interactive p-4 space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Incentive Cost</p>
                  <p className="font-display text-xl font-semibold tabular-nums tracking-tight text-destructive">${dashboardMetrics.totalIncentiveCost.toLocaleString()}</p>
                </div>
                <div className="card-interactive p-4 space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Net Margin</p>
                  <p className={`font-display text-xl font-semibold tabular-nums tracking-tight ${getHealthScoreColor(dashboardMetrics.costPercentage)}`}>
                    ${dashboardMetrics.netMargin.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partner Health Scores */}
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="font-display text-lg font-semibold leading-snug tracking-tight">Partner Health Scores</CardTitle>
              <p className="text-sm text-muted-foreground">
                Incentive cost as % of gross margin. Above 15% flags red.
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-border/80">
                <div className="grid grid-cols-12 gap-3 border-b bg-muted/30 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <div className="col-span-6">Partner</div>
                  <div className="col-span-2 text-right">Cost %</div>
                  <div className="col-span-4 text-right">Cost / Gross</div>
                </div>
                <div className="divide-y">
                  {partners.map((partner) => {
                    const partnerSPIFs = spifsByPartner[partner.id]?.reduce((sum, s) => sum + s.payout, 0) || 0;
                    const partnerVolumeBonus =
                      partner.quarterlyPerformanceTier === "Gold"
                        ? volumeBonusesUsd.gold
                        : partner.quarterlyPerformanceTier === "Silver"
                          ? volumeBonusesUsd.silver
                          : 0;
                    const partnerTotalCost = partnerSPIFs + partnerVolumeBonus + partner.adfSpend;
                    const partnerGrossMargin = partner.quarterlyCasesSold * grossMarginPerCase;
                    const healthPercentage = partnerGrossMargin > 0 ? (partnerTotalCost / partnerGrossMargin) * 100 : 0;

                    return (
                      <div key={partner.id} className="grid grid-cols-12 items-center gap-3 px-4 py-3">
                        <div className="col-span-6 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{partner.name}</span>
                            <Badge variant="outline" className="font-normal">
                              {partner.market}
                            </Badge>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-foreground/25"
                              style={{ width: `${Math.min(100, Math.max(0, (healthPercentage / 15) * 100))}%` }}
                              aria-label={`Health ${healthPercentage.toFixed(1)}%`}
                            />
                          </div>
                        </div>
                        <div className="col-span-2 text-right">
                          <Badge variant={getHealthBadgeVariant(healthPercentage)} className="tabular-nums">
                            {healthPercentage.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="col-span-4 text-right text-sm text-muted-foreground tabular-nums">
                          ${partnerTotalCost.toLocaleString()} / ${partnerGrossMargin.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== PARTNERS TAB ===== */}
        <TabsContent value="partners" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-display text-base font-semibold tracking-tight text-foreground">
              Distributors & Importers ({partners.length})
            </h3>
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
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-display text-base font-semibold tracking-tight text-foreground">{partner.name}</h4>
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
            <div className="card-elevated py-12">
              <div className="flex flex-col items-center gap-2 text-center">
                <Users className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
                <p className="text-sm font-medium text-muted-foreground">No partners yet</p>
                <p className="text-xs text-muted-foreground">Add your first distributor or importer to start tracking.</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ===== SPIF TRACKER TAB ===== */}
        <TabsContent value="spifs" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-display text-base font-semibold tracking-tight text-foreground">SPIF Payouts</h3>
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
                          <SelectItem value="new_on_premise">
                            New On-Premise (${spifRates.new_on_premise})
                          </SelectItem>
                          <SelectItem value="new_off_premise">
                            New Off-Premise (${spifRates.new_off_premise})
                          </SelectItem>
                          <SelectItem value="reorder">Reorder Case (${spifRates.reorder})</SelectItem>
                          <SelectItem value="tasting">Buyer Tasting (${spifRates.tasting})</SelectItem>
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
              <div className="card-elevated py-12">
                <div className="flex flex-col items-center gap-2 text-center">
                  <DollarSign className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
                  <p className="text-sm font-medium text-muted-foreground">No SPIF payouts yet</p>
                  <p className="text-xs text-muted-foreground">Log your first SPIF to start tracking distributor rep incentives.</p>
                </div>
              </div>
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
                        <p className="font-display text-lg font-semibold tabular-nums text-green-600">${spif.payout}</p>
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
                <CardTitle className="font-display text-lg font-semibold leading-snug tracking-tight">Running Totals by Partner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {partners.map(partner => {
                    const partnerSpifs = spifsByPartner[partner.id] || [];
                    const total = partnerSpifs.reduce((sum, s) => sum + s.payout, 0);
                    if (total === 0) return null;
                    return (
                      <div key={partner.id} className="flex justify-between items-center border-b py-2 text-sm last:border-0">
                        <span className="text-foreground">{partner.name}</span>
                        <span className="font-display font-semibold tabular-nums text-foreground">${total.toLocaleString()}</span>
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
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="font-display text-lg font-semibold leading-snug tracking-tight">
                  Supply Chain Pricing Breakdown
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Per-bottle CAD · Edit values to model margin;{" "}
                  {user ? "changes save to the server for your team." : "saved in this browser only."}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="touch-manipulation shrink-0"
                onClick={() => {
                  setSupplyChainPricing({ ...DEFAULT_SUPPLY_CHAIN_PRICING });
                  toast.success("Pricing reset to defaults");
                }}
              >
                Reset defaults
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {(
                  [
                    { key: "landed" as const, label: "Landed Cost", color: "bg-slate-500" },
                    { key: "wholesale" as const, label: "Wholesale", color: "bg-blue-500" },
                    { key: "retail" as const, label: "Retail", color: "bg-indigo-500" },
                    { key: "shelf" as const, label: "Shelf", color: "bg-purple-500" },
                  ] as const
                ).map((step) => (
                  <div key={step.key} className="flex flex-col items-center text-center">
                    <div className={`${step.color} w-full max-w-[11rem] rounded-lg px-3 py-4 text-white`}>
                      <p className="font-display text-lg font-semibold tabular-nums tracking-tight">
                        ${supplyChainPricing[step.key].toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Label htmlFor={`price-${step.key}`} className="mt-2 text-sm text-muted-foreground">
                      {step.label}
                    </Label>
                    <Input
                      id={`price-${step.key}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.01}
                      className="mt-2 h-9 w-full max-w-[11rem] touch-manipulation tabular-nums"
                      value={Number.isFinite(supplyChainPricing[step.key]) ? supplyChainPricing[step.key] : 0}
                      onChange={(e) => {
                        const v = clampUsdPrice(parseFloat(e.target.value));
                        setSupplyChainPricing((prev) => ({ ...prev, [step.key]: v }));
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-lg bg-muted p-4">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Gross Margin per Case</p>
                    <p className="font-display text-xl font-semibold tabular-nums tracking-tight text-foreground">
                      ${grossMarginPerCase.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${supplyChainPricing.wholesale.toFixed(2)} wholesale − ${supplyChainPricing.landed.toFixed(2)} landed = $
                      {(supplyChainPricing.wholesale - supplyChainPricing.landed).toFixed(2)}
                      /bottle × {BOTTLES_PER_CASE}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm text-muted-foreground">Margin %</p>
                    <p className="font-display text-xl font-semibold tabular-nums tracking-tight text-foreground">
                      {wholesaleMarginPercent.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Of wholesale case revenue</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scenario Analysis */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {marginScenarios.map(scenario => (
              <div key={scenario.name} className="card-elevated">
                <div className="border-b border-border/50 p-5 pb-3">
                  <h3 className="font-display text-base font-semibold tracking-tight text-foreground">{scenario.name}</h3>
                  <p className="text-xs text-muted-foreground">{scenario.description}</p>
                </div>
                <div className="space-y-4 p-5">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">SPIFs</span>
                      <span>${scenario.spifs}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Volume Bonus</span>
                      <span>${scenario.volumeBonus}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ADF Spend</span>
                      <span>${scenario.adfSpend}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Quarterly Bonus</span>
                      <span>${scenario.quarterlyBonus}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Total Incentive Cost</span>
                      <span className="font-semibold text-destructive">${scenario.totalIncentiveCost}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Net Margin</span>
                      <span className={`font-semibold ${getHealthScoreColor(scenario.costPercentage)}`}>
                        ${scenario.netMargin}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Cost %</span>
                      <Badge variant={scenario.costPercentage <= 15 ? "default" : "destructive"}>
                        {scenario.costPercentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SPIF rates & volume bonuses — editable, persisted */}
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="font-display text-lg font-semibold leading-snug tracking-tight">
                  SPIF rates & quarterly bonuses
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Adjust when list pricing or rep incentives change. Values apply to new SPIF entries, dashboard totals,
                  partner health, and margin scenarios.{" "}
                  {user ? "Saved automatically to the server." : "Saved automatically in this browser only."}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="touch-manipulation shrink-0"
                onClick={() => {
                  setSpifRates({ ...DEFAULT_SPIF_RATES });
                  setVolumeBonusesUsd({ ...DEFAULT_VOLUME_BONUSES_USD });
                  toast.success("SPIF rates and volume bonuses reset to defaults");
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset incentives to defaults
              </Button>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">SPIF payout (USD)</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(Object.keys(DEFAULT_SPIF_RATES) as SpifRateKey[]).map((key) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={`spif-rate-${key}`} className="text-muted-foreground">
                        {SPIF_RATE_FIELD_LABELS[key]}
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground" aria-hidden>
                          $
                        </span>
                        <Input
                          id={`spif-rate-${key}`}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step={1}
                          className="h-9 max-w-[10rem] touch-manipulation tabular-nums"
                          value={Number.isFinite(spifRates[key]) ? spifRates[key] : 0}
                          onChange={(e) => {
                            const v = clampUsdPrice(parseFloat(e.target.value));
                            setSpifRates((prev) => ({ ...prev, [key]: v }));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Quarterly performance volume bonus (USD)
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vol-bonus-gold" className="text-muted-foreground">
                      Gold tier (per qualifying partner / quarter)
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground" aria-hidden>
                        $
                      </span>
                      <Input
                        id="vol-bonus-gold"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={100}
                        className="h-9 max-w-[10rem] touch-manipulation tabular-nums"
                        value={Number.isFinite(volumeBonusesUsd.gold) ? volumeBonusesUsd.gold : 0}
                        onChange={(e) => {
                          const v = clampUsdPrice(parseFloat(e.target.value));
                          setVolumeBonusesUsd((prev) => ({ ...prev, gold: v }));
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vol-bonus-silver" className="text-muted-foreground">
                      Silver tier (per qualifying partner / quarter)
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground" aria-hidden>
                        $
                      </span>
                      <Input
                        id="vol-bonus-silver"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={100}
                        className="h-9 max-w-[10rem] touch-manipulation tabular-nums"
                        value={Number.isFinite(volumeBonusesUsd.silver) ? volumeBonusesUsd.silver : 0}
                        onChange={(e) => {
                          const v = clampUsdPrice(parseFloat(e.target.value));
                          setVolumeBonusesUsd((prev) => ({ ...prev, silver: v }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}
