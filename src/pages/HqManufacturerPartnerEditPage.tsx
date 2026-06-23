import { Link, useParams } from "react-router-dom";
import { HqManufacturerPartnerEditView } from "@/components/hq/HqManufacturerPartnerEditView";
import { isHqManufacturerPartnerId } from "@/lib/hq-manufacturer-partners";

export default function HqManufacturerPartnerEditPage() {
  const { manufacturerId = "" } = useParams<{ manufacturerId: string }>();

  if (!isHqManufacturerPartnerId(manufacturerId)) {
    return (
      <div className="p-6 text-[13px] text-muted-foreground">
        Unknown manufacturer. Return to{" "}
        <Link to="/manufacturer/profiles" className="font-medium text-accent underline-offset-2 hover:underline">
          Manufacturers
        </Link>
        .
      </div>
    );
  }

  return <HqManufacturerPartnerEditView manufacturerId={manufacturerId} />;
}
