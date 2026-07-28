import React, { useEffect } from 'react';

const UpscaleSettings = ({ config, setConfig }) => {
  useEffect(() => {
    if (!config.factor) {
      setConfig({ factor: '2x' });
    }
  }, []);

  return (
    <div className="space-y-4">
      <label className="block text-[13px] font-bold text-slate-700 mb-2">Scale Factor</label>
      <select 
        className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
        value={config.factor || '2x'}
        onChange={(e) => setConfig({ ...config, factor: e.target.value })}
      >
        <option value="2x">2x Upscale</option>
        <option value="4x">4x Upscale (Slower)</option>
        <option value="8x">8x Upscale (Premium)</option>
      </select>
    </div>
  );
};

export default UpscaleSettings;
