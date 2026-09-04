/** Public buyer form (custom domain). */
export const CANONICAL_CONNECT_ORIGIN = "https://supply.drinkhajime.jp";

export function expoConnectFormUrl(eventCode = "HK26"): string {
  const event = eventCode.replace(/[^A-Za-z0-9]/g, "").slice(0, 8) || "HK26";
  return `${CANONICAL_CONNECT_ORIGIN}/connect?event=${event}`;
}
