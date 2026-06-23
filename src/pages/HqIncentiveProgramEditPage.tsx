import { Link, useParams } from "react-router-dom";
import { HqIncentiveProgramEditView } from "@/components/hq/HqIncentiveProgramEditView";
import { isHqIncentiveProgramId } from "@/lib/hq-incentive-programs";

export default function HqIncentiveProgramEditPage() {
  const { programId = "" } = useParams<{ programId: string }>();

  if (!isHqIncentiveProgramId(programId)) {
    return (
      <div className="p-6 text-[13px] text-muted-foreground">
        Unknown program. Return to{" "}
        <Link to="/incentives" className="font-medium text-accent underline-offset-2 hover:underline">
          Incentive programs
        </Link>
        .
      </div>
    );
  }

  return <HqIncentiveProgramEditView programId={programId} />;
}
