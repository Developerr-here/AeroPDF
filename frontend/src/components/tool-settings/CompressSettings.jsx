import React, { useEffect } from 'react';

const CompressSettings = ({ config, setConfig }) => {
  useEffect(() => {
    if (!config.level) {
      setConfig(prev => ({ ...prev, level: 'medium' }));
    }
  }, []);

  const levels = [
    { value: 'low', label: 'Low Compression (High Quality)' },
    { value: 'medium', label: 'Medium Compression (Recommended)' },
    { value: 'high', label: 'High Compression (Lower Quality)' },
  ];

  return (
    <div className="space-y-4">
      <label className="block text-[13px] font-bold text-slate-700 mb-2">Compression Level</label>
      <div className="space-y-2">
        {levels.map(level => (
          <label key={level.value} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="radio"
              name="compressionLevel"
              value={level.value}
              checked={config.level === level.value}
              onChange={(e) => setConfig({ ...config, level: e.target.value })}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-slate-700">{level.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default CompressSettings;
