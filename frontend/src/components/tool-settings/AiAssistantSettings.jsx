import React, { useEffect } from 'react';

const AiAssistantSettings = ({ config, setConfig }) => {
  useEffect(() => {
    if (!config.mode) {
      setConfig({ mode: 'chat', language: 'es', question: '' });
    }
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[13px] font-bold text-slate-700 mb-2">Select Feature</label>
        <select 
          className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
          value={config.mode || 'chat'}
          onChange={(e) => setConfig({ ...config, mode: e.target.value })}
        >
          <option value="chat">Chat with PDF</option>
          <option value="summarize">Summarize PDF</option>
          <option value="translate">Translate PDF</option>
          <option value="notes">Extract Study Notes</option>
        </select>
      </div>

      {config.mode === 'translate' && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="block text-[13px] font-bold text-slate-700 mb-2">Target Language</label>
          <select 
            className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
            value={config.language || 'es'}
            onChange={(e) => setConfig({ ...config, language: e.target.value })}
          >
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="ar">Arabic</option>
          </select>
        </div>
      )}

      {config.mode === 'chat' && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="block text-[13px] font-bold text-slate-700 mb-2">Ask a Question</label>
          <textarea
            placeholder="e.g. What is the main conclusion of this report?"
            rows="3"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors resize-none text-sm"
            value={config.question || ''}
            onChange={(e) => setConfig({ ...config, question: e.target.value })}
          />
        </div>
      )}
    </div>
  );
};

export default AiAssistantSettings;
