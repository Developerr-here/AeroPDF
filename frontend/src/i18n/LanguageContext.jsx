import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { LANGUAGES, DEFAULT_LANGUAGE } from './languages';
import { translations } from './locales';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'pdfbundles_lang';

const getInitialLanguage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) {
      return saved;
    }
    
    // Auto-detect browser language
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang) {
      const code = browserLang.split('-')[0].toLowerCase();
      if (translations[code]) {
        return code;
      }
    }
  } catch (e) {
    console.warn('Could not read saved language from localStorage', e);
  }
  return DEFAULT_LANGUAGE;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(getInitialLanguage);

  const currentLanguageMeta = useMemo(() => {
    return LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  }, [language]);

  const changeLanguage = useCallback((code) => {
    if (!translations[code]) return;
    setLanguage(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {
      console.warn('Could not save language to localStorage', e);
    }
  }, []);

  // Update HTML tag attributes on language change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = currentLanguageMeta.dir || 'ltr';
    }
  }, [language, currentLanguageMeta]);

  // Translation lookup helper (supports nested dot notation e.g. 'nav.all_tools')
  const t = useCallback((key, fallback) => {
    if (!key) return fallback || '';

    const getNestedValue = (obj, path) => {
      if (!obj) return undefined;
      const parts = path.split('.');
      let curr = obj;
      for (const part of parts) {
        if (curr === undefined || curr === null) return undefined;
        curr = curr[part];
      }
      return curr;
    };

    // 1. Try active language
    let val = getNestedValue(translations[language], key);
    if (val !== undefined && val !== null) return val;

    // 2. Fallback to English
    if (language !== 'en') {
      val = getNestedValue(translations.en, key);
      if (val !== undefined && val !== null) return val;
    }

    // 3. Fallback parameter or raw key
    return fallback !== undefined ? fallback : key;
  }, [language]);

  const value = useMemo(() => ({
    language,
    currentLanguage: currentLanguageMeta,
    languages: LANGUAGES,
    changeLanguage,
    t,
    isRtl: currentLanguageMeta.dir === 'rtl'
  }), [language, currentLanguageMeta, changeLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
