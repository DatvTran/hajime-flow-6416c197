import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function RetailSupportPage() {
  return (
    <div>
      <PageHeader title="Support" description="Help and contacts for retail accounts (spec §2.D)." />

      <Card>
        <CardContent className="space-y-3 pt-5 text-sm text-muted-foreground">
          <p>For demo: contact your Hajime Brand Operator or distributor for delivery issues, invoice questions, or product availability.</p>
          <p>Future: in-app tickets tied to your orders and shipments on the same platform.</p>
        </CardContent>
      </Card>
    </div>
  );
}
