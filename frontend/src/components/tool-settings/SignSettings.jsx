import React, { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignSettings = ({ config, setConfig }) => {
  const sigPad = useRef({});

  useEffect(() => {
    if (!config.signatureBase64) {
      setConfig({ 
        signatureBase64: null, 
        pageIndex: 0, 
        x: 100, 
        y: 100, 
        width: 150, 
        height: 50,
        signaturePlacement: null 
      });
    }
  }, []);

  const clear = () => {
    sigPad.current.clear();
    setConfig({ 
      ...config, 
      signatureBase64: null, 
      signaturePlacement: null 
    });
  };

  const saveSignature = () => {
    if (sigPad.current && !sigPad.current.isEmpty()) {
      let dataUrl = null;
      try {
        const trimmed = sigPad.current.getTrimmedCanvas();
        if (trimmed && trimmed.width > 0 && trimmed.height > 0) {
          dataUrl = trimmed.toDataURL('image/png');
        }
      } catch (e) {}
      
      if (!dataUrl) {
        dataUrl = sigPad.current.getCanvas().toDataURL('image/png');
      }

      const targetPage = config.pageIndex !== undefined ? config.pageIndex : 0;
      const targetX = config.x !== undefined ? config.x : 100;
      const targetY = config.y !== undefined ? config.y : 100;
      const targetW = config.width || 150;
      const targetH = config.height || 50;

      setConfig({ 
        ...config, 
        signatureBase64: dataUrl,
        pageIndex: targetPage,
        x: targetX,
        y: targetY,
        width: targetW,
        height: targetH,
        signaturePlacement: config.signaturePlacement || { page: targetPage, x: targetX, y: targetY, w: targetW, h: targetH }
      });
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
