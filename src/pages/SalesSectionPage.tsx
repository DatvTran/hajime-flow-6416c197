import { Link, Navigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SECTIONS: Record<string, { title: string; description: string; body: string }> = {
  opportunities: {
    title: "Opportunities",
    description: "Accounts that need placement or reorder nudges (spec §2.E).",
    body:
      "Wire-up: rank prospects, dormant accounts, and velocity drops using shared Accounts + Orders. Create tasks and draft orders from here in a future iteration.",
  },
  visits: {
    title: "Visit notes",
    description: "Field visit log tied to accounts (spec §2.E).",
    body:
      "Wire-up: append notes to Account records with timestamps and rep attribution. Today: use Accounts detail and order drafts as a lightweight trail.",
  },
};

export default function SalesSectionPage() {
  const { section } = useParams<{ section: string }>();
  if (!section || !SECTIONS[section]) return <Navigate to="/" replace />;
  const s = SECTIONS[section];

  return (
    <div>
      <PageHeader title={s.title} description={s.description} />
      <Card>
        <CardContent className="space-y-4 pt-5 text-sm text-muted-foreground">
          <p>{s.body}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" asChild>
              <Link to="/accounts">Accounts</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/orders">Orders</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/reports">Analytics</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
