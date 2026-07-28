import React, { useEffect } from 'react';

const EditSettings = ({ config, setConfig }) => {
  useEffect(() => {
    if (!config.text) {
      setConfig({ ...config, text: 'Draft', fontSize: 16, editTextBoxes: [] });
    }
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[13px] font-bold text-slate-700 mb-2">Text to Overlay:</label>
        <input
          type="text"
          className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors text-sm"
          value={config.text || 'Draft'}
          onChange={(e) => setConfig({ ...config, text: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-[13px] font-bold text-slate-700 mb-2">Font Size:</label>
        <select 
          className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors text-sm"
          value={config.fontSize || 16}
          onChange={(e) => setConfig({ ...config, fontSize: Number(e.target.value) })}
        >
          <option value={12}>12 pt</option>
          <option value={16}>16 pt</option>
          <option value={24}>24 pt</option>
          <option value={36}>36 pt</option>
          <option value={48}>48 pt</option>
          <option value={72}>72 pt</option>
        </select>
      </div>

      <p className="text-[13px] text-slate-600 leading-relaxed mt-4">
        Click anywhere on a page preview on the left to stamp your custom text overlay. Click a stamped text box to remove it.
      </p>
      <p className="text-[13px] text-slate-600 leading-relaxed">
        Check your uploaded files on the left. Click the button below to process.
      </p>
    </div>
  );
};

export default EditSettings;
