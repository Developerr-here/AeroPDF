import React, { useEffect } from 'react';

const WatermarkSettings = ({ config, setConfig }) => {
  useEffect(() => {
    if (!config.text) {
      setConfig({
        text: 'CONFIDENTIAL',
        size: 50,
        opacity: 0.5,
        rotation: 45
      });
    }
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-[13px] font-bold text-slate-700 mb-2">Watermark Text</label>
        <input
          type="text"
          placeholder="CONFIDENTIAL"
          className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
          value={config.text || ''}
          onChange={(e) => setConfig({ ...config, text: e.target.value })}
        />
      </div>

      <div>
        <label className="flex justify-between text-[13px] font-bold text-slate-700 mb-2">
          <span>Font Size</span>
          <span className="text-indigo-600">{config.size || 50}px</span>
        </label>
        <input
          type="range"
          min="12"
          max="120"
          className="w-full accent-indigo-600"
          value={config.size || 50}
          onChange={(e) => setConfig({ ...config, size: Number(e.target.value) })}
        />
      </div>

      <div>
        <label className="flex justify-between text-[13px] font-bold text-slate-700 mb-2">
          <span>Opacity</span>
          <span className="text-indigo-600">{Math.round((config.opacity || 0.5) * 100)}%</span>
        </label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          className="w-full accent-indigo-600"
          value={config.opacity || 0.5}
          onChange={(e) => setConfig({ ...config, opacity: Number(e.target.value) })}
        />
      </div>

      <div>
        <label className="flex justify-between text-[13px] font-bold text-slate-700 mb-2">
          <span>Rotation</span>
          <span className="text-indigo-600">{config.rotation || 45}°</span>
        </label>
        <input
          type="range"
          min="-90"
          max="90"
          className="w-full accent-indigo-600"
          value={config.rotation || 45}
          onChange={(e) => setConfig({ ...config, rotation: Number(e.target.value) })}
        />
      </div>
    </div>
  );
};

export default WatermarkSettings;
