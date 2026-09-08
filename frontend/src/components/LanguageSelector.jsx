import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

const LanguageSelector = ({ variant = 'navbar', className = '' }) => {
  const { language, currentLanguage, languages, changeLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code) => {
    changeLanguage(code);
    setIsOpen(false);
  };

  if (variant === 'footer') {
    return (
      <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          aria-label={t('actions.select_language', 'Select Language')}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <Globe size={14} className="text-slate-500" />
          <span>{currentLanguage.flag}</span>
          <span>{currentLanguage.nativeName}</span>
          <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
              {t('actions.select_language', 'Select Language')}
            </div>
            <div className="max-h-72 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1 p-1">
              {languages.map((item) => (
                <button
                  key={item.code}
                  onClick={() => handleSelect(item.code)}
                  className={`flex items-center justify-between px-2.5 py-2 text-left rounded-xl transition-colors ${
                    language === item.code
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-base shrink-0">{item.flag}</span>
                    <span className="text-xs truncate">{item.nativeName}</span>
                  </div>
                  {language === item.code && <Check size={13} className="text-indigo-600 shrink-0 ml-1" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Navbar & Mobile variants
  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-label={t('actions.select_language', 'Select Language')}
        className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 rounded-full transition-all shadow-sm"
      >
        <Globe size={15} className="text-indigo-600" />
        <span className="text-xs">{currentLanguage.flag}</span>
        <span className="uppercase tracking-wide text-xs">{currentLanguage.code}</span>
        <ChevronDown size={13} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[320px] sm:w-[380px] bg-white border border-slate-100 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.12)] p-2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between mb-1">
            <span>{t('actions.select_language', 'Select Language')}</span>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">14 Languages</span>
          </div>
          <div className="grid grid-cols-2 gap-1 p-1 max-h-[360px] overflow-y-auto">
            {languages.map((item) => (
              <button
                key={item.code}
                onClick={() => handleSelect(item.code)}
                className={`flex items-center justify-between px-3 py-2.5 text-left rounded-xl transition-all ${
                  language === item.code
                    ? 'bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="text-lg leading-none shrink-0">{item.flag}</span>
                  <div className="flex flex-col overflow-hidden text-left">
                    <span className="text-[13px] leading-tight truncate">{item.nativeName}</span>
                    <span className="text-[10px] text-slate-400 font-normal leading-tight truncate">{item.name}</span>
                  </div>
                </div>
                {language === item.code && <Check size={14} className="text-indigo-600 shrink-0 ml-1" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
