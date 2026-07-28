import React, { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignSettings = ({ config, setConfig }) => {
  const sigPad = useRef({});

  useEffect(() => {
    if (!config.signatureBase64) {
      setConfig({ signatureBase64: null, pageIndex: 1, x: 100, y: 100, width: 150, height: 50 });
    }
  }, []);

  const clear = () => {
    sigPad.current.clear();
    setConfig({ ...config, signatureBase64: null });
  };

  const saveSignature = () => {
    if (!sigPad.current.isEmpty()) {
      setConfig({ ...config, signatureBase64: sigPad.current.getTrimmedCanvas().toDataURL('image/png') });
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-[13px] font-bold text-slate-700 mb-2">Draw Your Signature</label>
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
        <SignatureCanvas
          penColor="black"
          canvasProps={{ width: 300, height: 150, className: 'sigCanvas w-full cursor-crosshair bg-white' }}
          ref={sigPad}
          onEnd={saveSignature}
        />
        <div className="flex justify-between p-2 border-t border-slate-200 bg-slate-50">
          <button type="button" onClick={clear} className="text-xs font-semibold text-slate-500 hover:text-red-500 px-3 py-1">
            Clear
          </button>
          <span className="text-xs font-medium text-slate-400 px-3 py-1">Draw inside the box</span>
        </div>
      </div>
      
      {config.signatureBase64 && (
        <>
          <div className="mt-2 p-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold text-center border border-emerald-100">
            Signature Captured Successfully
          </div>
          <p className="mt-4 text-xs text-slate-500 leading-relaxed font-medium px-1">
            Once you draw your signature, click anywhere on a page thumbnail on the left to stamp it.
          </p>
        </>
      )}
    </div>
  );
};

export default SignSettings;
