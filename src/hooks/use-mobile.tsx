import * as React from "react";

/**
 * Viewports below this use overlay navigation (sheet) and compact chrome.
 * Matches Tailwind `lg` (1024px) so phones and tablets share one touch-first pattern;
 * desktop keeps the persistent sidebar.
 */
export const MOBILE_NAV_BREAKPOINT_PX = 1024;

function getIsMobileViewport() {
  return typeof window !== "undefined" && window.innerWidth < MOBILE_NAV_BREAKPOINT_PX;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(getIsMobileViewport);

  React.useEffect(() => {
    const query = `(max-width: ${MOBILE_NAV_BREAKPOINT_PX - 1}px)`;
    const mql = window.matchMedia(query);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_NAV_BREAKPOINT_PX);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_NAV_BREAKPOINT_PX);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
