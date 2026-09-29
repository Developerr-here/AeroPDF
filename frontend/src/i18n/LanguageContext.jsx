import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { LANGUAGES, DEFAULT_LANGUAGE, SUPPORTED_LANG_CODES, NON_EN_LANG_CODES } from './languages';
import { translations } from './locales';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'pdfbundles_lang';

/**
 * Extracts language code from URL path.
 * e.g. "/es" -> "es", "/es/merge-pdf" -> "es", "/merge-pdf" -> "en"
 */
export const getLanguageFromPath = (pathname) => {
  if (!pathname || typeof pathname !== 'string') return DEFAULT_LANGUAGE;
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0]?.toLowerCase();
  if (first && NON_EN_LANG_CODES.includes(first)) {
    return first;
  }
  return DEFAULT_LANGUAGE;
};

export const LanguageProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // URL pathname is the primary source of truth for SEO & multi-language routing
  const language = useMemo(() => {
    return getLanguageFromPath(location.pathname);
  }, [location.pathname]);

  const currentLanguageMeta = useMemo(() => {
    return LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  }, [language]);

  /**
   * Helper to convert any path to the active (or target) language URL.
   * e.g. localizePath('/merge-pdf', 'es') -> '/es/merge-pdf'
   * e.g. localizePath('/es/merge-pdf', 'en') -> '/merge-pdf'
   */
  const localizePath = useCallback((path, targetLang = language) => {
    if (!path || typeof path !== 'string') return path || '/';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('#') || path.startsWith('mailto:') || path.startsWith('tel:')) {
      return path;
    }

    const [pathAndSearch, hash] = path.split('#');
    const [cleanPath, search] = pathAndSearch.split('?');
    const parts = cleanPath.split('/').filter(Boolean);

    // Strip any existing language prefix from path
    if (parts.length > 0 && NON_EN_LANG_CODES.includes(parts[0].toLowerCase())) {
      parts.shift();
    }

    const base = '/' + parts.join('/');
    const searchPart = search ? `?${search}` : '';
    const hashPart = hash ? `#${hash}` : '';

    if (targetLang === 'en') {
      return (base || '/') + searchPart + hashPart;
    }
    return `/${targetLang}${base === '/' ? '' : base}${searchPart}${hashPart}`;
  }, [language]);

  /**
   * Switch language by navigating to the corresponding localized URL.
   */
  const changeLanguage = useCallback((targetCode) => {
    if (!SUPPORTED_LANG_CODES.includes(targetCode)) return;

    try {
      localStorage.setItem(STORAGE_KEY, targetCode);
    } catch (e) {
      console.warn('Could not save language to localStorage', e);
    }

    const newPath = localizePath(location.pathname, targetCode);
    navigate(newPath + location.search + location.hash);
  }, [location, localizePath, navigate]);

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
    localizePath,
    t,
    isRtl: currentLanguageMeta.dir === 'rtl'
  }), [language, currentLanguageMeta, changeLanguage, localizePath, t]);

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

/**
 * Drop-in replacement for <Link> that automatically preserves active language prefix.
 */
export const LocalizedLink = ({ to, children, ...props }) => {
  const { localizePath } = useTranslation();
  return <Link to={localizePath(to)} {...props}>{children}</Link>;
};

