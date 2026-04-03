import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type RetailCartLine = { sku: string; cases: number };

type RetailCartContextValue = {
  casesBySku: Record<string, number>;
  lines: RetailCartLine[];
  totalCases: number;
  setCasesForSku: (sku: string, cases: number, minOrderCases: number) => void;
  bumpCases: (sku: string, delta: number, minOrderCases: number) => void;
  removeSku: (sku: string) => void;
  clear: () => void;
};

const RetailCartContext = createContext<RetailCartContextValue | null>(null);

export function RetailCartProvider({ children }: { children: ReactNode }) {
  const [casesBySku, setCasesBySku] = useState<Record<string, number>>({});

  const lines = useMemo(
    () => Object.entries(casesBySku).map(([sku, cases]) => ({ sku, cases })),
    [casesBySku],
  );

  const totalCases = useMemo(() => lines.reduce((a, l) => a + l.cases, 0), [lines]);

  const setCasesForSku = useCallback((sku: string, cases: number, minOrderCases: number) => {
    setCasesBySku((prev) => {
      const next = { ...prev };
      if (cases < minOrderCases) {
        delete next[sku];
        return next;
      }
      next[sku] = cases;
      return next;
    });
  }, []);

  const bumpCases = useCallback((sku: string, delta: number, minOrderCases: number) => {
    setCasesBySku((prev) => {
      const cur = prev[sku] ?? 0;
      const raw = cur + delta;
      const next = { ...prev };
      if (raw < minOrderCases) {
        delete next[sku];
        return next;
      }
      next[sku] = raw;
      return next;
    });
  }, []);

  const removeSku = useCallback((sku: string) => {
    setCasesBySku((prev) => {
      const next = { ...prev };
      delete next[sku];
      return next;
    });
  }, []);

  const clear = useCallback(() => setCasesBySku({}), []);

  const value = useMemo(
    () => ({
      casesBySku,
      lines,
      totalCases,
      setCasesForSku,
      bumpCases,
      removeSku,
      clear,
    }),
    [casesBySku, lines, totalCases, setCasesForSku, bumpCases, removeSku, clear],
  );

  return <RetailCartContext.Provider value={value}>{children}</RetailCartContext.Provider>;
}

export function useRetailCart(): RetailCartContextValue {
  const ctx = useContext(RetailCartContext);
  if (!ctx) throw new Error("useRetailCart must be used within RetailCartProvider");
  return ctx;
}
