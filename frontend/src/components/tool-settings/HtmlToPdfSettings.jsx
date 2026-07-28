import React, { useEffect } from 'react';

const HtmlToPdfSettings = ({ config, setConfig }) => {
  useEffect(() => {
    if (!config.inputType) {
      setConfig({ inputType: 'url', url: '', htmlCode: '' });
    }
  }, []);

  return (
    <div className="space-y-4">
      <label className="block text-[13px] font-bold text-slate-700 mb-2">Input Source</label>
      <select 
        className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
        value={config.inputType || 'url'}
        onChange={(e) => setConfig({ ...config, inputType: e.target.value })}
      >
        <option value="url">Website URL</option>
        <option value="code">Raw HTML Code</option>
      </select>

      {config.inputType === 'url' ? (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="block text-[13px] font-bold text-slate-700 mb-2">Website URL</label>
          <input
            type="url"
            placeholder="https://example.com"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
            value={config.url || ''}
            onChange={(e) => setConfig({ ...config, url: e.target.value })}
          />
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="block text-[13px] font-bold text-slate-700 mb-2">HTML Code</label>
          <textarea
            placeholder="<h1>Hello World</h1>"
            rows="6"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors resize-none font-mono text-sm"
            value={config.htmlCode || ''}
            onChange={(e) => setConfig({ ...config, htmlCode: e.target.value })}
          />
        </div>
      )}
    </div>
  );
};

export default HtmlToPdfSettings;
