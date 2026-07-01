'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { t as translate } from '../../lib/i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    const saved = window.localStorage.getItem('lang');
    if (saved === 'en' || saved === 'bg') setLangState(saved);
  }, []);

  const setLang = useCallback((l) => {
    setLangState(l);
    window.localStorage.setItem('lang', l);
  }, []);

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
