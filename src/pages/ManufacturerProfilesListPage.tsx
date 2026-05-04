import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Building2,
  Factory,
  Mail,
  MapPin,
  Phone,
  Globe,
  User,
  Award,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { getManufacturerProfiles } from "@/lib/api-v1-mutations";
import { mapApiRowToProfile } from "@/lib/manufacturer-profile-map";
import type { ManufacturerProfile } from "@/types/app-data";

function ProfileCard({ profile }: { profile: ManufacturerProfile }) {
  const p = profile;
  const addrParts = [
    p.address.street,
    p.address.city,
    p.address.region,
    p.address.postalCode,
    p.address.country,
  ].filter(Boolean);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Factory className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="font-display text-lg leading-tight">
                {p.companyName || "—"}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Manufacturer user ID:{" "}
                <span className="font-mono text-[11px]">{p.manufacturerId || "—"}</span>
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Primary contact
            </p>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{p.primaryContact.name || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{p.primaryContact.email || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{p.primaryContact.phone || "—"}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Company
            </p>
            <div className="flex items-start gap-2 text-sm">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>Tax / VAT: {p.taxId || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
              {p.website ? (
                <a
                  href={p.website.startsWith("http") ? p.website : `https://${p.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-primary underline-offset-4 hover:underline"
                >
                  {p.website}
                </a>
              ) : (
                <span>—</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Capacity: ~{p.productionCapacity.monthlyCases.toLocaleString()} cases / mo
            </p>
          </div>
        </div>

        {addrParts.length > 0 && (
          <div className="flex gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{addrParts.join(" · ")}</span>
          </div>
        )}

        {p.certifications.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <Award className="h-3.5 w-3.5" />
              Certifications
            </p>
            <div className="flex flex-wrap gap-1.5">
              {p.certifications.map((c) => (
                <Badge key={c.id} variant="secondary" className="font-normal">
                  {c.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {p.description?.trim() && (
          <>
            <Separator />
            <div>
              <p className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                Notes & details
              </p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{p.description}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function ManufacturerProfilesListPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ManufacturerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await getManufacturerProfiles()) as { data?: Record<string, unknown>[] };
      const rows = Array.isArray(res.data) ? res.data : [];
      setProfiles(rows.map((r) => mapApiRowToProfile(r)));
    } catch (e) {
      console.error("[ManufacturerProfilesList]", e);
      setError(e instanceof Error ? e.message : "Could not load profiles");
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (user?.role === "manufacturer") {
    return <Navigate to="/manufacturer/profile" replace />;
  }

  if (!user || (user.role !== "brand_operator" && user.role !== "founder_admin")) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manufacturer profiles"
        description="Company and contact details submitted by manufacturer partners in their portal. Updates appear here after they save."
      />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : profiles.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No manufacturer profiles yet. When a manufacturer completes their profile in{" "}
            <span className="font-medium text-foreground">Manufacturer → Profile</span>, it will show
            here.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-1">
          {profiles.map((p) => (
            <ProfileCard key={p.id || p.manufacturerId} profile={p} />
          ))}
        </div>
      )}
    </div>
  );
}
