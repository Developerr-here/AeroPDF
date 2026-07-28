import React from 'react';
import { Info } from 'lucide-react';

const GenericSettings = () => {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex gap-3">
      <Info className="text-indigo-500 flex-shrink-0" size={18} />
      <p className="text-sm text-slate-600 leading-relaxed font-medium">
        Check your uploaded files on the left. Click the button below to process.
      </p>
    </div>
  );
};

export default GenericSettings;
