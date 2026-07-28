import React, { useEffect } from 'react';

const PageNumbersSettings = ({ config, setConfig }) => {
  useEffect(() => {
    if (!config.position) {
      setConfig({ position: 'bottom-right', format: '1' });
    }
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[13px] font-bold text-slate-700 mb-2">Page Number Position</label>
        <select 
          className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
          value={config.position || 'bottom-right'}
          onChange={(e) => setConfig({ ...config, position: e.target.value })}
        >
          <option value="bottom-right">Bottom Right</option>
          <option value="bottom-center">Bottom Center</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="top-right">Top Right</option>
          <option value="top-center">Top Center</option>
          <option value="top-left">Top Left</option>
        </select>
      </div>

      <div>
        <label className="block text-[13px] font-bold text-slate-700 mb-2">Format</label>
        <select 
          className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
          value={config.format || '1'}
          onChange={(e) => setConfig({ ...config, format: e.target.value })}
        >
          <option value="1">1, 2, 3...</option>
          <option value="page-x">Page 1, Page 2...</option>
          <option value="page-x-of-y">Page 1 of 5...</option>
        </select>
      </div>
    </div>
  );
};

export default PageNumbersSettings;
