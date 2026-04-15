import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const WARNING_DURATION = 30 * 1000; // 30 seconds to respond

type InactivityState = "active" | "warning" | "logged_out";

export function useInactivityTimer() {
  const { user, signOut } = useAuth();
  const [state, setState] = useState<InactivityState>("active");
  const [timeRemaining, setTimeRemaining] = useState(WARNING_DURATION);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Reset state
    setState("active");
    setTimeRemaining(WARNING_DURATION);
    lastActivityRef.current = Date.now();

    // Set new inactivity timer
    inactivityTimerRef.current = setTimeout(() => {
      setState("warning");
      
      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1000) {
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      // Set logout timer
      warningTimerRef.current = setTimeout(() => {
        setState("logged_out");
        signOut();
      }, WARNING_DURATION);
    }, INACTIVITY_TIMEOUT);
  }, [signOut]);

  const stayActive = useCallback(() => {
    if (state === "warning") {
      resetTimer();
    }
  }, [state, resetTimer]);

  // Track user activity
  useEffect(() => {
    if (!user) {
      // Clear timers if logged out
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }

    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll", "mousemove"];
    
    // Throttled activity handler (max once per second)
    let throttleTimeout: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      const now = Date.now();
      // Only reset if more than 1 second since last reset
      if (now - lastActivityRef.current > 1000) {
        if (throttleTimeout) clearTimeout(throttleTimeout);
        throttleTimeout = setTimeout(() => {
          resetTimer();
        }, 100);
      }
    };

    // Add listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [user, resetTimer]);

  // Format time remaining for display (MM:SS)
  const formattedTimeRemaining = `${Math.floor(timeRemaining / 60000)}:${String(
    Math.floor((timeRemaining % 60000) / 1000)
  ).padStart(2, "0")}`;

  return {
    state,
    timeRemaining,
    formattedTimeRemaining,
    stayActive,
  };
}
