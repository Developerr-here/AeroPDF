import React, { useRef, useState, useEffect } from 'react';
import { Camera, X } from 'lucide-react';

export default function WebcamWorkspace({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsInitializing(false);
      } catch (err) {
        if (active) {
          setError('Failed to access camera. Check browser permissions.');
          setIsInitializing(false);
        }
      }
    }
    
    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !streamRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `scan-${Date.now()}.png`, { type: 'image/png' });
        onCapture(file);
      }
    }, 'image/png');
  };

  return (
    <div className="bg-black rounded-2xl overflow-hidden flex flex-col relative min-h-[400px]">
      {isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm font-medium z-10">
          Initializing Camera...
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-400 bg-slate-900 z-10 px-6 text-center">
          <p className="font-semibold mb-4">{error}</p>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Close Scanner
          </button>
        </div>
      )}

      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        className="w-full h-full object-contain bg-black z-0 flex-1"
      />
      
      {!error && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 z-20">
          <button
            onClick={handleCapture}
            className="bg-indigo-900 hover:bg-indigo-800 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-xl shadow-black/50 transition-all border border-indigo-700/50"
            disabled={isInitializing}
          >
            <Camera size={18} />
            Capture Snapshot
          </button>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-xl shadow-black/50"
          >
            <X size={18} />
            Turn Off
          </button>
        </div>
      )}
    </div>
  );
}
