import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getExpoLeads } from "@/lib/api-v1";
import { formatExpoLeadHeadline, type ExpoLead } from "@/lib/expo-leads";
import { HqOperatorAlertBar, HqBtnLink } from "@/components/hq/HqOperatorUi";

export function HqExpoPriorityStrip() {
  const [leads, setLeads] = useState<ExpoLead[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getExpoLeads({ score: "A", limit: 8 })
      .then((res) => {
        if (!cancelled) setLeads(res.data.filter((l) => l.status !== "closed" && l.status !== "converted"));
      })
      .catch(() => {
        if (!cancelled) setLeads([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (leads.length === 0) return null;

  return (
    <HqOperatorAlertBar
      variant="warn"
      actions={
        <HqBtnLink to="/expo-leads" variant="accent" size="sm">
          Open lead tracker
        </HqBtnLink>
      }
    >
      <div className="space-y-1.5">
        {leads.slice(0, 3).map((lead) => (
          <Link key={lead.id} to={`/expo-leads/${lead.displayId}`} className="block text-[13px] text-foreground hover:underline">
            {formatExpoLeadHeadline(lead)}
          </Link>
        ))}
        {leads.length > 3 ? (
          <p className="text-[12px] text-muted-foreground">{leads.length - 3} more A — Priority leads</p>
        ) : null}
      </div>
    </HqOperatorAlertBar>
  );
}
