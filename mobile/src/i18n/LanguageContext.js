import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations } from "./translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");

  // Restore saved language preference
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("lang");
      if (saved === "en" || saved === "hi") setLang(saved);
    })();
  }, []);

  const changeLang = useCallback((next) => {
    setLang(next);
    AsyncStorage.setItem("lang", next).catch(() => {});
  }, []);

  const toggleLang = useCallback(() => {
    changeLang(lang === "en" ? "hi" : "en");
  }, [lang, changeLang]);

  // Translate helper — falls back to the key if missing
  const t = useCallback(
    (key) => translations[lang]?.[key] ?? translations.en[key] ?? key,
    [lang]
  );

  const value = useMemo(
    () => ({ lang, t, changeLang, toggleLang }),
    [lang, t, changeLang, toggleLang]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
