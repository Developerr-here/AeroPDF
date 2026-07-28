import React, { useEffect } from 'react';

const ScanToPdfSettings = ({ config, setConfig }) => {
  useEffect(() => {
    if (!config.pageSize) {
      setConfig({ pageSize: 'a4', orientation: 'portrait' });
    }
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[13px] font-bold text-slate-700 mb-2">Page Size</label>
        <select 
          className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
          value={config.pageSize || 'a4'}
          onChange={(e) => setConfig({ ...config, pageSize: e.target.value })}
        >
          <option value="a4">A4 (Standard)</option>
          <option value="letter">Letter</option>
          <option value="fit">Fit Image Dimensions</option>
        </select>
      </div>

      <div>
        <label className="block text-[13px] font-bold text-slate-700 mb-2">Orientation</label>
        <select 
          className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
          value={config.orientation || 'portrait'}
          onChange={(e) => setConfig({ ...config, orientation: e.target.value })}
          disabled={config.pageSize === 'fit'}
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </div>
    </div>
  );
};

export default ScanToPdfSettings;
