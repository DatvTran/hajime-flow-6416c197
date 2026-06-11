export type PartnerRingStat = { value: string; label: string; pct: number; stroke: string; valueClass?: string };

export function PartnerProgressRing({ stat, size = 80 }: { stat: PartnerRingStat; size?: number }) {
  const r = size * 0.4125;
  const c = 2 * Math.PI * r;
  const dash = (stat.pct / 100) * c;
  return (
    <div className="ring-wrap relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(35 12% 18%)" strokeWidth={5} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={stat.stroke}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            fill="none"
          />
        </g>
      </svg>
      <div className="ring-lbl absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="rv font-mono font-semibold leading-none text-[hsl(40_80%_66%)]"
          style={stat.valueClass ? { color: stat.valueClass, fontSize: "14px" } : { fontSize: "14px" }}
        >
          {stat.value}
        </span>
        <span className="rk mt-0.5 text-[8px] font-medium uppercase tracking-[0.08em] text-[hsl(35_12%_42%)]">
          {stat.label}
        </span>
      </div>
    </div>
  );
}

export function PartnerRingCluster({ rings, size = 80 }: { rings: PartnerRingStat[]; size?: number }) {
  return (
    <div className="ring-cluster flex items-center gap-3">
      {rings.map((ring, i) => (
        <span key={ring.label} className="flex items-center gap-3">
          {i > 0 ? (
            <span className="flex flex-col justify-center gap-1 px-0.5" aria-hidden>
              {[0, 1, 2].map((d) => (
                <span key={d} className="size-[3px] rounded-full bg-[hsl(35_12%_28%)]" />
              ))}
            </span>
          ) : null}
          <PartnerProgressRing stat={ring} size={size} />
        </span>
      ))}
    </div>
  );
}
