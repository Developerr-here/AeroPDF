import React, { useEffect } from 'react';

const AiAssistantSettings = ({ config, setConfig }) => {
  useEffect(() => {
    if (!config.mode) {
      setConfig({ mode: 'chat', language: 'Chinese', question: '' });
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
            value={config.language || 'Chinese'}
            onChange={(e) => setConfig({ ...config, language: e.target.value })}
          >
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Chinese">Chinese (Simplified)</option>
            <option value="Japanese">Japanese</option>
            <option value="Arabic">Arabic</option>
            <option value="Russian">Russian</option>
            <option value="Portuguese">Portuguese</option>
            <option value="Italian">Italian</option>
            <option value="Korean">Korean</option>
            <option value="Hindi">Hindi</option>
            <option value="Dutch">Dutch</option>
            <option value="Turkish">Turkish</option>
            <option value="Polish">Polish</option>
            <option value="Indonesian">Indonesian</option>
            <option value="Vietnamese">Vietnamese</option>
            <option value="Thai">Thai</option>
            <option value="Swedish">Swedish</option>
            <option value="Greek">Greek</option>
            <option value="Hebrew">Hebrew</option>
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
