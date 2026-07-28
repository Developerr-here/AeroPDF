import React, { useEffect } from 'react';

const RedactSettings = ({ config, setConfig }) => {
  useEffect(() => {
    if (!config.redactionBoxes) {
      setConfig({ ...config, redactionBoxes: [] });
    }
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-slate-600 leading-relaxed">
        Double-click or drag on page thumbnails on the left to draw blackout masks. Click Process to finalize redactions.
      </p>
      <p className="text-[13px] text-slate-600 leading-relaxed">
        Check your uploaded files on the left. Click the button below to process.
      </p>
    </div>
  );
};

export default RedactSettings;
