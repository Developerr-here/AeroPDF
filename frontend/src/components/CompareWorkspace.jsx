import React, { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import * as pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function CompareWorkspace({ files }) {
  const [metadataA, setMetadataA] = useState(null);
  const [metadataB, setMetadataB] = useState(null);

  useEffect(() => {
    async function loadMetadata() {
      if (!files || files.length < 2) return;
      try {
        const getMeta = async (file) => {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ 
            data: arrayBuffer,
            standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
          }).promise;
          const numPages = pdf.numPages;
          const metaData = await pdf.getMetadata();
          return {
            name: file.name,
            size: (file.size / 1024).toFixed(2) + ' KB',
            pages: numPages,
            author: metaData?.info?.Author || '(anonymous)',
            title: metaData?.info?.Title || '(anonymous)'
          };
        };

        const [metaA, metaB] = await Promise.all([getMeta(files[0]), getMeta(files[1])]);
        setMetadataA(metaA);
        setMetadataB(metaB);
      } catch (err) {
        console.error("Failed to load PDF metadata", err);
      }
    }
    loadMetadata();
  }, [files]);

  if (!files || files.length < 2) {
    return (
      <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 text-amber-700 font-medium">
        Please upload exactly two PDF documents to compare.
      </div>
    );
  }

  const renderCard = (meta, fallbackFile) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1">
      <h3 className="font-bold text-slate-800 mb-4 truncate" title={fallbackFile.name}>{fallbackFile.name}</h3>
      <table className="w-full text-sm">
        <tbody>
          <tr className="border-b border-slate-100 last:border-0">
            <td className="py-3 text-slate-500 font-medium">Pages</td>
            <td className="py-3 text-slate-800 text-right">{meta ? meta.pages : 'Loading...'}</td>
          </tr>
          <tr className="border-b border-slate-100 last:border-0">
            <td className="py-3 text-slate-500 font-medium">File Size</td>
            <td className="py-3 text-slate-800 text-right">{meta ? meta.size : ((fallbackFile.size / 1024).toFixed(2) + ' KB')}</td>
          </tr>
          <tr className="border-b border-slate-100 last:border-0">
            <td className="py-3 text-slate-500 font-medium">Author</td>
            <td className="py-3 text-slate-800 text-right truncate max-w-[150px]">{meta ? meta.author : 'Loading...'}</td>
          </tr>
          <tr className="border-b border-slate-100 last:border-0">
            <td className="py-3 text-slate-500 font-medium">Title</td>
            <td className="py-3 text-slate-800 text-right truncate max-w-[150px]">{meta ? meta.title : 'Loading...'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-slate-800">Upload two PDF documents to compare</h2>
        <p className="text-sm text-slate-500">or drag and drop them here</p>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        {renderCard(metadataA, files[0])}
        {renderCard(metadataB, files[1])}
      </div>
    </div>
  );
}
