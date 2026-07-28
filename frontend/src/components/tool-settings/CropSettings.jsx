import React, { useEffect } from 'react';

const CropSettings = ({ config, setConfig }) => {
  useEffect(() => {
    if (config.top === undefined) {
      setConfig({ top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 });
    }
  }, []);

  const handleChange = (e, field) => {
    let val = Number(e.target.value);
    if (val > 4) val = 4; // Cap at 4 inches maximum to prevent breaking the CropBox bounds
    setConfig({ ...config, [field]: val });
  };

  return (
    <div className="space-y-4">
      <label className="block text-[13px] font-bold text-slate-700 mb-2">Crop Margins (inches)</label>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Top</label>
          <input
            type="number"
            min="0"
            max="4"
            step="0.1"
            className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
            value={config.top ?? 0.5}
            onChange={(e) => handleChange(e, 'top')}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Right</label>
          <input
            type="number"
            min="0"
            max="4"
            step="0.1"
            className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
            value={config.right ?? 0.5}
            onChange={(e) => handleChange(e, 'right')}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Bottom</label>
          <input
            type="number"
            min="0"
            max="4"
            step="0.1"
            className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
            value={config.bottom ?? 0.5}
            onChange={(e) => handleChange(e, 'bottom')}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Left</label>
          <input
            type="number"
            min="0"
            max="4"
            step="0.1"
            className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
            value={config.left ?? 0.5}
            onChange={(e) => handleChange(e, 'left')}
          />
        </div>
      </div>
    </div>
  );
};

export default CropSettings;
