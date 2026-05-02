import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type SupportedLanguage = "en" | "fr" | "it" | "ja" | "zh" | "th" | "pt";

const STORAGE_KEY = "hajime_language";

const languageLabels: Record<SupportedLanguage, string> = {
  en: "English",
  fr: "Français",
  it: "Italiano",
  ja: "日本語",
  zh: "中文",
  th: "ไทย",
  pt: "Português",
};

const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {},
  fr: {
    "Team & settings": "Équipe et paramètres",
    "Home": "Accueil",
    "Inventory": "Inventaire",
    "Orders": "Commandes",
    "Accounts": "Comptes",
    "Reports": "Rapports",
    "Settings": "Paramètres",
    "Shipments": "Expéditions",
    "Markets": "Marchés",
    "Global markets": "Marchés mondiaux",
    "Alerts": "Alertes",
    "Analytics": "Analytique",
    "Overview": "Aperçu",
    "Support": "Support",
    "Payments": "Paiements",
    "Language": "Langue",
    "Choose language": "Choisir la langue",
    "Sign out": "Se déconnecter",
  },
  it: {
    "Team & settings": "Team e impostazioni",
    "Home": "Home",
    "Inventory": "Inventario",
    "Orders": "Ordini",
    "Accounts": "Account",
    "Reports": "Report",
    "Settings": "Impostazioni",
    "Shipments": "Spedizioni",
    "Markets": "Mercati",
    "Global markets": "Mercati globali",
    "Alerts": "Avvisi",
    "Analytics": "Analisi",
    "Overview": "Panoramica",
    "Support": "Supporto",
    "Payments": "Pagamenti",
    "Language": "Lingua",
    "Choose language": "Scegli lingua",
    "Sign out": "Esci",
  },
  ja: {
    "Team & settings": "チームと設定",
    "Home": "ホーム",
    "Inventory": "在庫",
    "Orders": "注文",
    "Accounts": "アカウント",
    "Reports": "レポート",
    "Settings": "設定",
    "Shipments": "出荷",
    "Markets": "市場",
    "Global markets": "グローバル市場",
    "Alerts": "アラート",
    "Analytics": "分析",
    "Overview": "概要",
    "Support": "サポート",
    "Payments": "支払い",
    "Language": "言語",
    "Choose language": "言語を選択",
    "Sign out": "サインアウト",
  },
  zh: {
    "Team & settings": "团队与设置",
    "Home": "首页",
    "Inventory": "库存",
    "Orders": "订单",
    "Accounts": "账户",
    "Reports": "报告",
    "Settings": "设置",
    "Shipments": "发货",
    "Markets": "市场",
    "Global markets": "全球市场",
    "Alerts": "提醒",
    "Analytics": "分析",
    "Overview": "概览",
    "Support": "支持",
    "Payments": "付款",
    "Language": "语言",
    "Choose language": "选择语言",
    "Sign out": "退出登录",
  },
  th: {
    "Team & settings": "ทีมและการตั้งค่า",
    "Home": "หน้าหลัก",
    "Inventory": "สินค้าคงคลัง",
    "Orders": "คำสั่งซื้อ",
    "Accounts": "บัญชี",
    "Reports": "รายงาน",
    "Settings": "การตั้งค่า",
    "Shipments": "การจัดส่ง",
    "Markets": "ตลาด",
    "Global markets": "ตลาดโลก",
    "Alerts": "การแจ้งเตือน",
    "Analytics": "การวิเคราะห์",
    "Overview": "ภาพรวม",
    "Support": "ฝ่ายช่วยเหลือ",
    "Payments": "การชำระเงิน",
    "Language": "ภาษา",
    "Choose language": "เลือกภาษา",
    "Sign out": "ออกจากระบบ",
  },
  pt: {
    "Team & settings": "Equipe e configurações",
    "Home": "Início",
    "Inventory": "Estoque",
    "Orders": "Pedidos",
    "Accounts": "Contas",
    "Reports": "Relatórios",
    "Settings": "Configurações",
    "Shipments": "Remessas",
    "Markets": "Mercados",
    "Global markets": "Mercados globais",
    "Alerts": "Alertas",
    "Analytics": "Análises",
    "Overview": "Visão geral",
    "Support": "Suporte",
    "Payments": "Pagamentos",
    "Language": "Idioma",
    "Choose language": "Escolher idioma",
    "Sign out": "Sair",
  },
};

type LanguageContextValue = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (text: string) => string;
  options: Array<{ value: SupportedLanguage; label: string }>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
    if (saved && saved in languageLabels) setLanguageState(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: (next) => setLanguageState(next),
    t: (text: string) => translations[language][text] ?? text,
    options: (Object.keys(languageLabels) as SupportedLanguage[]).map((value) => ({ value, label: languageLabels[value] })),
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
