import type { Account } from "@/data/mockData";

export const ON_PREMISE_ACCOUNT_TYPES = new Set<Account["type"]>([
  "retail",
  "bar",
  "restaurant",
  "hotel",
]);
