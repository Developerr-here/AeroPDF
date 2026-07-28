import React, { useEffect } from 'react';

const ProtectSettings = ({ config, setConfig }) => {
  useEffect(() => {
    if (!config.password) {
      setConfig(prev => ({ ...prev, password: '' }));
    }
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[13px] font-bold text-slate-700 mb-2">Document Password</label>
        <input
          type="password"
          placeholder="Enter password to encrypt"
          className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
          value={config.password || ''}
          onChange={(e) => setConfig({ ...config, password: e.target.value })}
        />
      </div>
    </div>
  );
};

export default ProtectSettings;
