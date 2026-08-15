import React, { useState, useMemo, useEffect } from 'react';
import JSZip from 'jszip';
import { Link } from 'react-router-dom';
import FileUploadDropzone from '../components/FileUploadDropzone';
import ToolsGrid from '../components/ToolsGrid';
import FAQ from '../components/FAQ';
import ArticlesAndGuides from '../components/ArticlesAndGuides';
import { FileText, X, Loader2, ArrowLeft, Settings, CheckCircle2, ShieldCheck, Zap, ChevronLeft, ChevronRight, Upload, ArrowRight, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getExtraContentForTool } from '../data/toolExtraContent';
import { getPDFFirstPageThumbnail, generatePagePreviews } from '../lib/pdf-tools';
import PageGrid from '../components/PageGrid';
import SuccessView from '../components/SuccessView';
import WebcamWorkspace from '../components/WebcamWorkspace';
import CompareWorkspace from '../components/CompareWorkspace';

const interactiveTools = ['rotate-pdf', 'split-pdf', 'extract-pages', 'remove-pages', 'organize-pdf', 'edit-pdf', 'redact-pdf', 'sign-pdf'];

const GenericToolPage = ({ tool }) => {
  const { currentUser, token } = useAuth();
  const { addToast } = useToast();
  
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('idle');
  const [successResult, setSuccessResult] = useState(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [error, setError] = useState(null);
  const [toolConfig, setToolConfig] = useState({});
  const [thumbnails, setThumbnails] = useState({});
  const [pagePreviews, setPagePreviews] = useState([]);

  const extraContent = useMemo(() => getExtraContentForTool(tool.id, tool.name, tool.desc), [tool]);
  const formatSize = (bytes) => (bytes / (1024 * 1024)).toFixed(2) + ' MB';

  // Generate thumbnails or page previews
  useEffect(() => {
    const isInteractive = interactiveTools.includes(tool.id);
    
    if (isInteractive && files.length > 0 && pagePreviews.length === 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        file.arrayBuffer().then(buffer => {
          generatePagePreviews(buffer).then(previews => {
            setPagePreviews(previews);
          });
        });
      }
    } else if (!isInteractive) {
      files.forEach((file, index) => {
        const fileId = `${file.name}-${file.lastModified}-${file.size}-${index}`;
        if (!thumbnails[fileId] && file.type === 'application/pdf') {
          getPDFFirstPageThumbnail(file).then(dataUrl => {
            if (dataUrl) {
              setThumbnails(prev => ({ ...prev, [fileId]: dataUrl }));
            }
          });
        }
      });
    }
  }, [files, thumbnails, tool.id, pagePreviews.length]);

  // Handle move left/right
  const moveFile = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === files.length - 1) return;
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index + direction];
    newFiles[index + direction] = temp;
    setFiles(newFiles);
  };

  useEffect(() => {
    // Dynamically update Canonical URL for SEO extensions during SPA navigation
    const canonicalUrl = `https://pdfbundles.com/${tool.id}`;
    let canonicalLink = document.querySelector("link[rel='canonical']");
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Update title and meta description dynamically if we have seoSchema
    if (extraContent && extraContent.seoSchema) {
      try {
        const schemaObj = JSON.parse(extraContent.seoSchema);
        const webPageNode = schemaObj['@graph']?.find(n => n['@type'] === 'WebPage');
        if (webPageNode) {
          document.title = webPageNode.name;
          let metaDesc = document.querySelector("meta[name='description']");
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
          }
          metaDesc.setAttribute('content', webPageNode.description);
        }
      } catch (e) {
        console.warn("Could not parse seoSchema for dynamic meta tags", e);
      }
    }
  }, [tool.id, extraContent]);

  // Reset state when tool changes
  React.useEffect(() => {
    setFiles([]);
    setError(null);
    setThumbnails({});
    setPagePreviews([]);
    setToolConfig({});
    setStatus('idle');
    setSuccessResult(null);
    setIsWebcamActive(false);
  }, [tool.id]);

  const handleFilesSelected = (selectedFiles) => {
    setError(null);
    
    // Limits check logic from legacy main.js
    const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    const maxFreeSize = 10 * 1024 * 1024; // 10MB limit
    
    if (!token || !currentUser || !currentUser.is_premium) {
      if (totalSize > maxFreeSize) {
        addToast('File size exceeds the 10MB limit. Please upgrade to Premium.', 'error');
        return;
      }
    }
    
    const userPlan = currentUser ? (currentUser.subscription_plan || 'free') : 'free';
    const batchLimit = currentUser?.is_premium ? 50 : 2; // Derived from legacy logic
    const newTotalCount = (tool.multiple ? files.length : 0) + selectedFiles.length;
    
    if (newTotalCount > batchLimit) {
      addToast(`Your current plan limits batch processing to maximum ${batchLimit} files for this tool. Please upgrade.`, 'error');
      return;
    }
    
    setFiles(prev => tool.multiple ? [...prev, ...selectedFiles] : [selectedFiles[0]]);
  };

  const handleProcess = async () => {
    if (!tool.noUpload && files.length === 0) return setError("Please select a file.");
    
    setStatus('processing');
    setError(null);
    
    try {
      const result = await tool.apiAction(files, toolConfig);

      // 1. Result has downloadUrl -> It's from the bucket
      if (result && result.downloadUrl) {
        setSuccessResult({ downloadUrl: result.downloadUrl, filename: result.filename || `${tool.id}_${Date.now()}${tool.ext || '.pdf'}` });
        setStatus('success');
        addToast(`${tool.name} completed successfully!`, 'success');
      }
      // 1.5. Result is a raw binary buffer (e.g. storage bucket disabled or local fallback)
      else if (result instanceof Uint8Array || result instanceof Blob || result instanceof ArrayBuffer || (result && typeof result.byteLength === 'number')) {
        let blob = result instanceof Blob ? result : new Blob([result], { type: result.type || 'application/pdf' });
        let filename = `${tool.id}_output_${Date.now()}${tool.ext || '.pdf'}`;
        if (files.length === 1 && tool.ext === '.pdf') filename = `processed_${files[0].name.replace(/\.[^/.]+$/, "")}.pdf`;
        
        setSuccessResult({ blob, filename });
        setStatus('success');
        addToast(`${tool.name} completed successfully!`, 'success');
      }
      // 2. Result is an Array (e.g. client-side images, or local fallback split pages)
      else if (Array.isArray(result)) {
        if (tool.id === 'pdf-to-png') {
          for (const item of result) {
            if (item.dataUrl) {
              const ext = item.dataUrl.split(';')[0].split('/')[1] || 'png';
              let filename = `${files[0].name.replace(/\.[^/.]+$/, "")}-page-${item.pageNum}.${ext}`;
              const blob = await fetch(item.dataUrl).then(r => r.blob());
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              await new Promise(res => setTimeout(res, 100));
            }
          }
          setSuccessResult({ blob: null, filename: "extracted-images" });
          setStatus('success');
          addToast(`${tool.name} completed successfully!`, 'success');
        } else {
          const zip = new JSZip();
          result.forEach((item, index) => {
            let filename = `page_${item.pageNum || index + 1}`;
            if (item.dataUrl) {
              const ext = item.dataUrl.split(';')[0].split('/')[1] || 'png';
              filename += `.${ext}`;
              const blobPromise = fetch(item.dataUrl).then(r => r.blob());
              zip.file(filename, blobPromise);
            } else if (item.bytes) {
              filename += `.pdf`;
              zip.file(filename, item.bytes);
            } else {
              filename += tool.ext || '.dat';
              zip.file(filename, JSON.stringify(item));
            }
          });
          const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
          setSuccessResult({ blob: zipBlob, filename: `${tool.id}_${Date.now()}.zip` });
          setStatus('success');
          addToast(`${tool.name} completed successfully!`, 'success');
        }
      } 
      // 3. Result is JSON or Object without downloadUrl (e.g. comparePDFs, AI Assistant, local fallback)
      else if (typeof result === 'object') {
        if (result.success && result.filename && !result.jsonResult && !result.differences && !result.summary && !result.result && !result.translation) {
           // Local fallback where it sends back JSON but maybe no downloadUrl? Shouldn't happen unless fallback returns JSON.
           // Let's just treat standard JSON as successResult.jsonResult
        }
        setSuccessResult({ jsonResult: result });
        setStatus('success');
        addToast(`${tool.name} processed successfully!`, 'success');
      }
      
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred during processing.");
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {extraContent.seoSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: extraContent.seoSchema }} />
      )}
      {/* Breadcrumb */}
      <div className="w-full bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm transition-all hover:shadow-md">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>
      </div>

      {status === 'success' && successResult ? (
        <div className="flex-1 bg-slate-50 py-12 px-6">
          <div className="max-w-[800px] mx-auto">
            <SuccessView 
              filename={successResult.filename} 
              blob={successResult.blob} 
              downloadUrl={successResult.downloadUrl}
              jsonResult={successResult.jsonResult}
              onReset={() => {
                setStatus('idle');
                setSuccessResult(null);
                setFiles([]);
              }}
            />
          </div>
        </div>
      ) : isWebcamActive ? (
        <div className="flex-1 bg-slate-50 py-12 px-6">
          <div className="max-w-[1000px] mx-auto">
            <WebcamWorkspace 
              onCapture={(file) => {
                setFiles(prev => [...prev, file]);
                addToast('Snapshot captured!', 'success');
              }}
              onClose={() => setIsWebcamActive(false)}
            />
            {files.length > 0 && (
              <div className="mt-6 text-center text-slate-500 font-medium">
                {files.length} snapshot(s) captured. <button onClick={() => setIsWebcamActive(false)} className="text-indigo-600 font-bold hover:underline">Close scanner</button> to proceed.
              </div>
            )}
          </div>
        </div>
      ) : (!tool.noUpload && !files.length) ? (
        <div className="pt-10 pb-24 bg-white flex-1">
          <FileUploadDropzone 
            onFilesSelected={handleFilesSelected}
            multiple={tool.multiple}
            accept={tool.accept}
            title={`Upload ${tool.accept === 'image/*' ? 'images' : 'PDFs'} to ${tool.name.toLowerCase()}`}
          />
          
          {tool.id === 'scan-to-pdf' && (
            <div className="max-w-[1200px] mx-auto px-6 mt-6 flex justify-center">
              <button 
                onClick={() => setIsWebcamActive(true)}
                className="bg-indigo-900 hover:bg-indigo-800 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-lg hover:shadow-xl transition-all"
              >
                <Camera size={24} />
                Use Web Camera Instead
              </button>
            </div>
          )}
          
          {/* Footer Data */}
          <div className="max-w-[1200px] mx-auto px-6 mt-16">
            {extraContent.seoH1 && (
              <div className="bg-white border border-slate-100 rounded-3xl p-10 shadow-sm mb-12 space-y-10">
                <div>
                  <h1 className="text-[32px] font-black text-slate-900 mb-4 tracking-tight">{extraContent.seoH1}</h1>
                  <p className="text-slate-500 leading-relaxed text-lg">{extraContent.about}</p>
                </div>
                {extraContent.seoH2_1 && (
                  <div>
                    <h2 className="text-[24px] font-bold text-slate-900 mb-3 tracking-tight">{extraContent.seoH2_1}</h2>
                    <p className="text-slate-500 leading-relaxed text-md">{extraContent.seoH2_1Desc}</p>
                  </div>
                )}
                {extraContent.seoH2_2 && (
                  <div>
                    <h2 className="text-[24px] font-bold text-slate-900 mb-3 tracking-tight">{extraContent.seoH2_2}</h2>
                    <p className="text-slate-500 leading-relaxed text-md">{extraContent.seoH2_2Desc}</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-white border border-slate-100 rounded-3xl p-10 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-12">
                {!extraContent.seoH1 && (
                  <div>
                    <h3 className="text-[22px] font-bold text-slate-900 mb-4">About {tool.name}</h3>
                    <p className="text-slate-500 leading-relaxed">{extraContent.about}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-[18px] font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Settings size={20} className="text-indigo-600"/> 
                    Who Uses This Tool?
                  </h3>
                  <ul className="space-y-4 text-slate-600">
                    {extraContent.whoUses.map((user, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-indigo-500 mt-1">•</span>
                        <span>{user}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="space-y-12">
                <div>
                  <h3 className="text-[18px] font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-emerald-600"/> 
                    Key Features
                  </h3>
                  <ul className="space-y-4 text-slate-600">
                    {extraContent.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <ShieldCheck size={18} className="text-emerald-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                   <h3 className="text-[16px] font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Zap size={18} className="text-amber-500"/> 
                    How it Works
                  </h3>
                  <ol className="space-y-4">
                    {extraContent.steps.map((step, idx) => (
                      <li key={idx} className="text-sm">
                        <strong className="text-slate-800">{idx + 1}. {step.title}:</strong> <span className="text-slate-600">{step.desc}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-slate-50">
          {/* Top Banner Dropzone */}
          <div className="bg-white border-b border-slate-200">
            <div className="max-w-[1200px] mx-auto px-6 py-10">
               <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/50 rounded-3xl p-8 text-center border-dashed group hover:border-indigo-300 transition-colors cursor-pointer">
                  <input 
                    type="file" 
                    multiple={tool.multiple} 
                    accept={tool.accept}
                    onChange={(e) => {
                      if(e.target.files.length) handleFilesSelected(Array.from(e.target.files));
                      e.target.value = '';
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-indigo-500 group-hover:scale-110 transition-transform">
                    <Upload size={28} strokeWidth={2} />
                  </div>
                  <h3 className="text-[22px] font-bold text-slate-900 mb-2">Upload multiple PDFs to {tool.name.toLowerCase()}</h3>
                  <p className="text-slate-500 font-medium">or drag and drop them here</p>
               </div>
            </div>
          </div>

          {/* Workspace Body */}
          <div className="max-w-[1200px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: File Cards */}
            {!tool.noUpload && (
              <div className="lg:col-span-2 bg-white rounded-[24px] shadow-sm border border-slate-200 p-8 min-h-[400px]">
                {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center justify-between"><span>{error}</span><button onClick={()=>setError(null)}><X size={16}/></button></div>}
                
                {tool.id === 'compare-pdf' ? (
                  <CompareWorkspace files={files} />
                ) : interactiveTools.includes(tool.id) && pagePreviews.length > 0 ? (
                  <PageGrid 
                    toolId={tool.id}
                    pagePreviews={pagePreviews}
                    toolConfig={toolConfig}
                    setToolConfig={setToolConfig}
                  />
                ) : (
                  <div className="flex flex-wrap gap-6">
                    {files.map((file, i) => {
                      const fileId = `${file.name}-${file.lastModified}-${file.size}-${i}`;
                      return (
                        <div key={fileId} className="w-[180px] group flex flex-col">
                          <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all overflow-hidden flex flex-col h-[240px] relative">
                            <div className="absolute top-2 left-0 w-full px-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <div className="flex bg-white/90 backdrop-blur-sm rounded-lg shadow-sm overflow-hidden border border-slate-200">
                                <button onClick={() => moveFile(i, -1)} className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 disabled:opacity-30"><ChevronLeft size={16}/></button>
                                <button onClick={() => moveFile(i, 1)} className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-l border-slate-200 disabled:opacity-30"><ChevronRight size={16}/></button>
                              </div>
                              <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="p-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                                <X size={14}/>
                              </button>
                            </div>
                            <div className="flex-1 bg-slate-50 flex items-center justify-center p-4">
                              {thumbnails[fileId] ? (
                                <img src={thumbnails[fileId]} alt="preview" className="max-h-full max-w-full object-contain drop-shadow-md border border-slate-200/50" />
                              ) : (
                                <FileText size={48} className="text-indigo-200" strokeWidth={1} />
                              )}
                            </div>
                          </div>
                          <div className="mt-3 text-center px-1">
                            <p className="text-[12px] font-bold text-slate-700 truncate" title={file.name}>{file.name}</p>
                            <p className="text-[11px] font-semibold text-slate-400">{formatSize(file.size)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Right Column: Sidebar */}
            <div className={tool.noUpload ? "lg:col-span-3 max-w-[800px] mx-auto w-full" : "lg:col-span-1"}>
              <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 p-8 sticky top-28">
                
                <h4 className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-4">TOOL CONFIGURATION</h4>
                <div className="mb-8">
                  {tool.settingsComponent ? (
                    <tool.settingsComponent config={toolConfig} setConfig={setToolConfig} />
                  ) : (
                    <p className="text-sm text-slate-500 font-medium">Check your uploaded files on the left. Click the button below to process.</p>
                  )}
                </div>

                <h4 className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-4">ACTIONS</h4>
                <div className="space-y-3">
                  <button 
                    onClick={handleProcess} 
                    disabled={status === 'processing' || (tool.minFiles && files.length < tool.minFiles)} 
                    className="w-full flex items-center justify-center gap-2 bg-[#1E1B4B] hover:bg-indigo-900 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-bold text-[15px] shadow-lg hover:shadow-xl transition-all"
                  >
                    {status === 'processing' ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        {tool.actionTitle}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setFiles([])} 
                    className="w-full px-6 py-4 rounded-xl font-bold text-[15px] text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    Clear Workspace
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {(!tool.noUpload && !files.length) && status !== 'success' && !isWebcamActive && (
        <div className="bg-slate-50 py-24 border-t border-slate-100">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="mb-24"><h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2"><span className="text-indigo-600">→</span> Related Tools</h3><ToolsGrid showHeader={false} /></div>
            <FAQ faqs={extraContent.seoFaqs || extraContent.faqs} title={extraContent.seoFaqTitle} /><ArticlesAndGuides tool={tool} />
          </div>
        </div>
      )}
    </div>
  );
};

export default GenericToolPage;
