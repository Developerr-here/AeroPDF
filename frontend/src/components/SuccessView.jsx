import React from 'react';
import { Check, Download, RotateCcw } from 'lucide-react';

export default function SuccessView({ filename, blob, downloadUrl, jsonResult, onReset }) {
  const handleDownload = () => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col items-center justify-center p-12 min-h-[500px]">
      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-50/50">
        <Check size={40} className="text-emerald-500" strokeWidth={3} />
      </div>
      
      <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Job Completed Successfully!</h2>
      
      {jsonResult && jsonResult.differences ? (
        <div className="w-full max-w-2xl mb-10">
          <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
                <th className="p-3 font-semibold">Type</th>
                <th className="p-3 font-semibold">Message</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {jsonResult.differences.length === 0 ? (
                <tr>
                  <td colSpan="2" className="p-4 text-center text-sm text-slate-500 font-medium">No differences found! The documents are identical.</td>
                </tr>
              ) : (
                jsonResult.differences.map((diff, idx) => (
                  <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="p-3 text-sm font-semibold text-slate-700 capitalize">{diff.type}</td>
                    <td className="p-3 text-sm text-slate-600">{diff.message}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : jsonResult && (jsonResult.summary || jsonResult.result || jsonResult.translation) ? (
        <div className="w-full max-w-3xl mb-10 text-left bg-slate-50 p-8 rounded-xl border border-slate-200 overflow-y-auto max-h-[500px] shadow-inner custom-scrollbar">
          <div className="prose prose-slate max-w-none whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
            {jsonResult.summary || jsonResult.result || jsonResult.translation}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 font-medium mb-10 text-center max-w-md">
          Your file <span className="text-slate-700 font-bold">"{filename}"</span> has been processed securely and is ready for download.
        </p>
      )}

      <div className="flex gap-4">
        {(blob || downloadUrl) && (
          <button 
            onClick={handleDownload}
            className="bg-indigo-900 hover:bg-indigo-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-900/10"
          >
            <Download size={18} />
            Download Result
          </button>
        )}
        <button 
          onClick={onReset}
          className="bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
        >
          <RotateCcw size={18} />
          {(blob || downloadUrl) ? 'Process Another File' : 'Start Over'}
        </button>
      </div>
    </div>
  );
}
