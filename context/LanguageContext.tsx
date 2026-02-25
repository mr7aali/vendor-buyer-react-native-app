import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type LanguageCode = "en" | "he" | "hi";

type Dictionary = Record<string, string>;

const STORAGE_KEY = "app_language";

const dictionaries: Record<LanguageCode, Dictionary> = {
  en: {
    english: "English",
    language: "Language",
    select_language: "Select Language",
    hebrew: "Hebrew",
    hindi: "Hindi",
    settings: "Settings",
    change_password: "Change Password",
    about_us: "About Us",
    help: "Help",
    support_requests: "Support Requests",
    privacy_policy: "Privacy Policy",
    terms_of_service: "Terms of service",
    delete_account: "Delete Account",
    account_information: "Account Information",
    personal_info: "Personal info",
    business_info: "Business info",
    transaction_history: "Transaction History",
    make_coupon: "Make a coupon",
    payout_settings: "Payout Settings",
    stripe_connect: "Stripe Connect",
    connected: "Connected",
    connect: "Connect",
    stripe_connect_hint: "Connect your Stripe account to receive payouts.",
    setting: "Setting",
    switch_profile: "Switch profile",
    permission: "Permission",
    logout: "Log Out",
    cancel: "Cancel",
    confirm: "Confirm",
    switch_profile_q: "Switch Profile?",
    switch_profile_desc_business: "Are you sure you want to switch to Business profile?",
    switch_profile_desc_personal: "Are you sure you want to switch to Personal profile?",
    logout_q: "Log Out?",
    logout_desc: "Are you sure you want to log out?",
  },
  he: {
    english: "אנגלית",
    language: "שפה",
    select_language: "בחר שפה",
    hebrew: "עברית",
    hindi: "הינדית",
    settings: "הגדרות",
    change_password: "שינוי סיסמה",
    about_us: "עלינו",
    help: "עזרה",
    support_requests: "בקשות תמיכה",
    privacy_policy: "מדיניות פרטיות",
    terms_of_service: "תנאי שירות",
    delete_account: "מחיקת חשבון",
    account_information: "פרטי חשבון",
    personal_info: "פרטים אישיים",
    business_info: "פרטי עסק",
    transaction_history: "היסטוריית עסקאות",
    make_coupon: "יצירת קופון",
    payout_settings: "הגדרות תשלום",
    stripe_connect: "חיבור Stripe",
    connected: "מחובר",
    connect: "התחבר",
    stripe_connect_hint: "חבר את חשבון Stripe שלך כדי לקבל תשלומים.",
    setting: "הגדרות",
    switch_profile: "החלפת פרופיל",
    permission: "הרשאות",
    logout: "התנתק",
    cancel: "ביטול",
    confirm: "אישור",
    switch_profile_q: "להחליף פרופיל?",
    switch_profile_desc_business: "האם אתה בטוח שברצונך לעבור לפרופיל עסקי?",
    switch_profile_desc_personal: "האם אתה בטוח שברצונך לעבור לפרופיל אישי?",
    logout_q: "להתנתק?",
    logout_desc: "האם אתה בטוח שברצונך להתנתק?",
  },
  hi: {
    english: "अंग्रेज़ी",
    language: "भाषा",
    select_language: "भाषा चुनें",
    hebrew: "हिब्रू",
    hindi: "हिंदी",
    settings: "सेटिंग्स",
    change_password: "पासवर्ड बदलें",
    about_us: "हमारे बारे में",
    help: "मदद",
    support_requests: "सपोर्ट अनुरोध",
    privacy_policy: "गोपनीयता नीति",
    terms_of_service: "सेवा की शर्तें",
    delete_account: "अकाउंट हटाएं",
    account_information: "अकाउंट जानकारी",
    personal_info: "व्यक्तिगत जानकारी",
    business_info: "व्यवसाय जानकारी",
    transaction_history: "लेनदेन इतिहास",
    make_coupon: "कूपन बनाएं",
    payout_settings: "पेआउट सेटिंग्स",
    stripe_connect: "Stripe कनेक्ट",
    connected: "कनेक्टेड",
    connect: "कनेक्ट",
    stripe_connect_hint: "पेआउट पाने के लिए अपना Stripe अकाउंट कनेक्ट करें।",
    setting: "सेटिंग",
    switch_profile: "प्रोफाइल बदलें",
    permission: "अनुमति",
    logout: "लॉग आउट",
    cancel: "रद्द करें",
    confirm: "पुष्टि करें",
    switch_profile_q: "प्रोफाइल बदलें?",
    switch_profile_desc_business: "क्या आप बिज़नेस प्रोफाइल में बदलना चाहते हैं?",
    switch_profile_desc_personal: "क्या आप पर्सनल प्रोफाइल में बदलना चाहते हैं?",
    logout_q: "लॉग आउट?",
    logout_desc: "क्या आप वाकई लॉग आउट करना चाहते हैं?",
  },
};

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (next: LanguageCode) => Promise<void>;
  t: (key: string, fallback?: string) => string;
  ready: boolean;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: async () => {},
  t: (key, fallback) => fallback || key,
  ready: false,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "en" || saved === "he" || saved === "hi") {
          if (mounted) setLanguageState(saved);
        }
      } finally {
        if (mounted) setReady(true);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = async (next: LanguageCode) => {
    setLanguageState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, fallback) => dictionaries[language][key] || fallback || key,
      ready,
    }),
    [language, ready]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
export type { LanguageCode };
