/**
 * Module-level language store — lazy route chunks subscribe via useSyncExternalStore
 * instead of relying on a single React context instance across Vite chunks.
 */
import { portalTranslationsFor } from "@/lib/portal-translations";

export type SupportedLanguage = "en" | "fr" | "it" | "ja" | "zh" | "th" | "pt";

export const STORAGE_KEY = "hajime_language";

export const languageLabels: Record<SupportedLanguage, string> = {
  en: "English",
  fr: "Français",
  it: "Italiano",
  ja: "日本語",
  zh: "中文",
  th: "ไทย",
  pt: "Português",
};

const hqTranslations: Record<SupportedLanguage, Record<string, string>> = {
  en: {},
  fr: {
    "Team & settings": "Équipe et paramètres",
    Home: "Accueil",
    Inventory: "Inventaire",
    Orders: "Commandes",
    Accounts: "Comptes",
    Reports: "Rapports",
    Settings: "Paramètres",
    Shipments: "Expéditions",
    Markets: "Marchés",
    "Global markets": "Marchés mondiaux",
    Alerts: "Alertes",
    Analytics: "Analytique",
    Overview: "Aperçu",
    Support: "Support",
    Payments: "Paiements",
    Language: "Langue",
    "Choose language": "Choisir la langue",
    "Sign out": "Se déconnecter",
  },
  it: {
    "Team & settings": "Team e impostazioni",
    Home: "Home",
    Inventory: "Inventario",
    Orders: "Ordini",
    Accounts: "Account",
    Reports: "Report",
    Settings: "Impostazioni",
    Shipments: "Spedizioni",
    Markets: "Mercati",
    "Global markets": "Mercati globali",
    Alerts: "Avvisi",
    Analytics: "Analisi",
    Overview: "Panoramica",
    Support: "Supporto",
    Payments: "Pagamenti",
    Language: "Lingua",
    "Choose language": "Scegli lingua",
    "Sign out": "Esci",
  },
  ja: {
    "Team & settings": "チームと設定",
    Home: "ホーム",
    Inventory: "在庫",
    Orders: "注文",
    Accounts: "アカウント",
    Reports: "レポート",
    Settings: "設定",
    Shipments: "出荷",
    Markets: "市場",
    "Global markets": "グローバル市場",
    Alerts: "アラート",
    Analytics: "分析",
    Overview: "概要",
    Support: "サポート",
    Payments: "支払い",
    Language: "言語",
    "Choose language": "言語を選択",
    "Sign out": "サインアウト",
  },
  zh: {
    "Team & settings": "团队与设置",
    Home: "首页",
    Inventory: "库存",
    Orders: "订单",
    Accounts: "账户",
    Reports: "报告",
    Settings: "设置",
    Shipments: "发货",
    Markets: "市场",
    "Global markets": "全球市场",
    Alerts: "提醒",
    Analytics: "分析",
    Overview: "概览",
    Support: "支持",
    Payments: "付款",
    Language: "语言",
    "Choose language": "选择语言",
    "Sign out": "退出登录",
  },
  th: {
    "Team & settings": "ทีมและการตั้งค่า",
    Home: "หน้าหลัก",
    Inventory: "สินค้าคงคลัง",
    Orders: "คำสั่งซื้อ",
    Accounts: "บัญชี",
    Reports: "รายงาน",
    Settings: "การตั้งค่า",
    Shipments: "การจัดส่ง",
    Markets: "ตลาด",
    "Global markets": "ตลาดโลก",
    Alerts: "การแจ้งเตือน",
    Analytics: "การวิเคราะห์",
    Overview: "ภาพรวม",
    Support: "ฝ่ายช่วยเหลือ",
    Payments: "การชำระเงิน",
    Language: "ภาษา",
    "Choose language": "เลือกภาษา",
    "Sign out": "ออกจากระบบ",
  },
  pt: {
    "Team & settings": "Equipe e configurações",
    Home: "Início",
    Inventory: "Estoque",
    Orders: "Pedidos",
    Accounts: "Contas",
    Reports: "Relatórios",
    Settings: "Configurações",
    Shipments: "Remessas",
    Markets: "Mercados",
    "Global markets": "Mercados globais",
    Alerts: "Alertas",
    Analytics: "Análises",
    Overview: "Visão geral",
    Support: "Suporte",
    Payments: "Pagamentos",
    Language: "Idioma",
    "Choose language": "Escolher idioma",
    "Sign out": "Sair",
  },
};

export type TranslateVars = Record<string, string | number>;

function interpolate(text: string, vars?: TranslateVars): string {
  if (!vars) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ""));
}

export function readStoredLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
    if (saved && saved in languageLabels) return saved;
  } catch {
    // ignore private mode / blocked storage
  }
  return "en";
}

let currentLanguage: SupportedLanguage =
  typeof window !== "undefined" ? readStoredLanguage() : "en";

const listeners = new Set<() => void>();

export function getPortalLanguage(): SupportedLanguage {
  return currentLanguage;
}

export function getServerPortalLanguage(): SupportedLanguage {
  return "en";
}

export function subscribePortalLanguage(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function setPortalLanguage(next: SupportedLanguage): void {
  if (!(next in languageLabels)) return;
  currentLanguage = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore quota / private mode
  }
  if (typeof document !== "undefined") document.documentElement.lang = next;
  listeners.forEach((listener) => listener());
}

export function translatePortalText(
  lang: SupportedLanguage,
  text: string,
  vars?: TranslateVars,
): string {
  const portal = portalTranslationsFor(lang);
  const hq = hqTranslations[lang];
  const raw = portal[text] ?? hq[text] ?? text;
  return interpolate(raw, vars);
}

export const languageOptions = (Object.keys(languageLabels) as SupportedLanguage[]).map((value) => ({
  value,
  label: languageLabels[value],
}));

if (typeof document !== "undefined") {
  document.documentElement.lang = currentLanguage;
}
