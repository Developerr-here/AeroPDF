import React, { useEffect } from 'react';

const ExtractSettings = ({ config, setConfig }) => {
  useEffect(() => {
    if (!config.mode) {
      setConfig({ mode: 'selected', pages: '' });
    }
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-[13px] font-bold text-slate-700 mb-3">Extraction Mode</label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="radio"
              value="selected"
              checked={config.mode === 'selected'}
              onChange={(e) => setConfig({ ...config, mode: e.target.value })}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-slate-700">Extract specific pages</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="radio"
              value="all"
              checked={config.mode === 'all'}
              onChange={(e) => setConfig({ ...config, mode: e.target.value })}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-slate-700">Split into individual pages</span>
          </label>
        </div>
      </div>

      {config.mode === 'selected' && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="block text-[13px] font-bold text-slate-700 mb-2">Pages to Extract</label>
          <input
            type="text"
            placeholder="e.g. 1, 3, 5-8"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
            value={config.pages || ''}
            onChange={(e) => setConfig({ ...config, pages: e.target.value })}
          />
          <p className="text-xs text-slate-500 mt-2">Comma separated page numbers or ranges.</p>
        </div>
      )}
    </div>
  );
};

export default ExtractSettings;
