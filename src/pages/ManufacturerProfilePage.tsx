import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export default function ManufacturerProfilePage() {
  const { user } = useAuth();
  return (
    <div>
      <PageHeader title="Account" description="Manufacturer portal identity (spec §4 nav)." />
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>
            <span className="text-muted-foreground">User:</span> {user.displayName}
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span> {user.email}
          </p>
          <p className="mt-3 text-muted-foreground">Production contacts and document uploads will attach to this identity in a full rollout.</p>
        </CardContent>
      </Card>
    </div>
  );
}
