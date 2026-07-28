import React, { useCallback, useState, useRef } from 'react';
import { Upload } from 'lucide-react';

const FileUploadDropzone = ({ 
  onFilesSelected, 
  multiple = false, 
  accept = ".pdf",
  title = "Upload multiple PDFs to merge",
  subtitle = "or drag and drop them here" 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(multiple ? filesArray : [filesArray[0]]);
    }
  }, [onFilesSelected, multiple]);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(multiple ? filesArray : [filesArray[0]]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6">
      <div
        className={`relative group flex flex-col items-center justify-center w-full min-h-[360px] rounded-[32px] border-[2px] border-dashed transition-all duration-300 ease-in-out cursor-pointer overflow-hidden
          ${isDragging 
            ? 'border-indigo-400 bg-indigo-50 shadow-[0_0_40px_rgba(99,102,241,0.2)] scale-[1.01]' 
            : 'border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-pink-50/30 hover:border-indigo-400 hover:shadow-xl'
          }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />
        
        <div className="flex flex-col items-center justify-center space-y-5 z-10 p-8">
          <div className={`p-4 rounded-full transition-transform duration-300 bg-indigo-100/50 text-indigo-500 ${isDragging ? 'scale-110' : 'group-hover:scale-110'}`}>
            <Upload size={40} strokeWidth={2} />
          </div>
          <div className="text-center space-y-1.5">
            <h3 className="text-[26px] font-bold text-slate-900 tracking-tight">{title}</h3>
            <p className="text-[17px] text-slate-500 font-medium">{subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadDropzone;
