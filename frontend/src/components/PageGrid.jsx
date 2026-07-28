import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, CheckSquare, Square, X, Move } from 'lucide-react';

const getContainedImageRect = (img) => {
  if (!img) return { width: 1, height: 1, left: 0, top: 0 };
  const containerWidth = img.clientWidth || 1;
  const containerHeight = img.clientHeight || 1;
  const naturalWidth = img.naturalWidth || containerWidth;
  const naturalHeight = img.naturalHeight || containerHeight;
  const containerRatio = containerWidth / containerHeight;
  const imageRatio = naturalWidth / naturalHeight;

  let renderedWidth = containerWidth;
  let renderedHeight = containerHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > containerRatio) {
    renderedHeight = containerWidth / imageRatio;
    offsetY = (containerHeight - renderedHeight) / 2;
  } else {
    renderedWidth = containerHeight * imageRatio;
    offsetX = (containerWidth - renderedWidth) / 2;
  }

  return { width: renderedWidth, height: renderedHeight, left: offsetX, top: offsetY };
};

const PageGrid = ({ toolId, pagePreviews, toolConfig, setToolConfig }) => {
  const [dragState, setDragState] = useState({ isDragging: false, pageIndex: null, startX: 0, startY: 0, currentX: 0, currentY: 0 });
  const [hoverBox, setHoverBox] = useState(null);
  const imageRefs = useRef({});

  // Force re-render on resize to update box positions
  const [, setWindowSize] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowSize(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRotate = (pageIndex) => {
    const currentRotations = toolConfig.pageRotations || {};
    const currentAngle = currentRotations[pageIndex] || 0;
    const newAngle = (currentAngle + 90) % 360;
    setToolConfig({ ...toolConfig, pageRotations: { ...currentRotations, [pageIndex]: newAngle } });
  };

  const togglePageSelection = (pageIndex) => {
    const selected = new Set(toolConfig.selectedPages || []);
    if (selected.has(pageIndex)) selected.delete(pageIndex);
    else selected.add(pageIndex);
    setToolConfig({ ...toolConfig, selectedPages: Array.from(selected) });
  };

  const selectAll = () => {
    const all = pagePreviews.map((_, i) => i);
    setToolConfig({ ...toolConfig, selectedPages: all });
  };
  const deselectAll = () => {
    setToolConfig({ ...toolConfig, selectedPages: [] });
  };

  const handleMouseDown = (e, pageIndex) => {
    if (toolId !== 'redact-pdf') return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDragState({
      isDragging: true,
      pageIndex,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      currentX: e.clientX - rect.left,
      currentY: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!dragState.isDragging || toolId !== 'redact-pdf' || dragState.pageIndex === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDragState(prev => ({
      ...prev,
      currentX: e.clientX - rect.left,
      currentY: e.clientY - rect.top
    }));
  };

  const handleMouseUp = (e, pageIndex) => {
    if (!dragState.isDragging) return;
    
    if (toolId === 'redact-pdf' && dragState.pageIndex === pageIndex) {
      const w = Math.abs(dragState.currentX - dragState.startX);
      const h = Math.abs(dragState.currentY - dragState.startY);
      const leftX = Math.min(dragState.currentX, dragState.startX);
      const topY = Math.min(dragState.currentY, dragState.startY);

      if (w > 5 && h > 5) {
        const imgElement = imageRefs.current[pageIndex];
        const imgRect = getContainedImageRect(imgElement);
        const preview = pagePreviews[pageIndex] || { width: 595.28, height: 841.89 };
        const pdfWidth = preview.width || 595.28;
        const pdfHeight = preview.height || 841.89;

        const leftXRel = leftX - imgRect.left;
        const topYRel = topY - imgRect.top;

        const ptX = (leftXRel / imgRect.width) * pdfWidth;
        const ptY = ((imgRect.height - (topYRel + h)) / imgRect.height) * pdfHeight;

        const newBox = {
          id: Date.now().toString(),
          page: pageIndex,
          x: ptX,
          y: ptY,
          w: (w / imgRect.width) * pdfWidth,
          h: (h / imgRect.height) * pdfHeight
        };
        const currentBoxes = toolConfig.redactionBoxes || [];
        setToolConfig({ ...toolConfig, redactionBoxes: [...currentBoxes, newBox] });
      }
    }
    setDragState({ isDragging: false, pageIndex: null, startX: 0, startY: 0, currentX: 0, currentY: 0 });
  };

  const handleImageClick = (e, pageIndex) => {
    if (toolId !== 'edit-pdf' && toolId !== 'sign-pdf') return;
    
    const imgElement = imageRefs.current[pageIndex];
    if (!imgElement) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const imgRect = getContainedImageRect(imgElement);
    const preview = pagePreviews[pageIndex] || { width: 595.28, height: 841.89 };
    const pdfWidth = preview.width || 595.28;
    const pdfHeight = preview.height || 841.89;

    if (toolId === 'edit-pdf') {
      const xRel = clickX - imgRect.left;
      const yRel = clickY - imgRect.top;

      const ptX = (xRel / imgRect.width) * pdfWidth;
      const ptY = ((imgRect.height - yRel) / imgRect.height) * pdfHeight;

      const newTextBox = {
        id: Date.now().toString(),
        page: pageIndex,
        x: ptX,
        y: ptY,
        text: toolConfig.text || 'Draft',
        size: toolConfig.fontSize || 16,
        type: 'text'
      };

      const currentBoxes = toolConfig.editTextBoxes || [];
      setToolConfig({ ...toolConfig, editTextBoxes: [...currentBoxes, newTextBox] });
    } else if (toolId === 'sign-pdf') {
      if (!toolConfig.signatureBase64) return;
      
      const offsetX = 40;
      const offsetY = 20;
      const xRel = (clickX - offsetX) - imgRect.left;
      const yRel = (clickY - offsetY) - imgRect.top;

      const ptX = (xRel / imgRect.width) * pdfWidth;
      const ptY = ((imgRect.height - (yRel + 40)) / imgRect.height) * pdfHeight;

      const sigPlacement = {
        page: pageIndex,
        x: ptX,
        y: ptY,
        w: (80 / imgRect.width) * pdfWidth,
        h: (40 / imgRect.height) * pdfHeight
      };
      setToolConfig({ 
        ...toolConfig, 
        signaturePlacement: sigPlacement,
        pageIndex: pageIndex,
        x: ptX,
        y: ptY,
        width: sigPlacement.w,
        height: sigPlacement.h
      });
    }
  };

  const removeBox = (id, type) => {
    if (type === 'redact') {
      const filtered = (toolConfig.redactionBoxes || []).filter(b => b.id !== id);
      setToolConfig({ ...toolConfig, redactionBoxes: filtered });
    } else if (type === 'edit') {
      const filtered = (toolConfig.editTextBoxes || []).filter(b => b.id !== id);
      setToolConfig({ ...toolConfig, editTextBoxes: filtered });
    }
  };

  // Drag and drop handlers for Organize PDF
  const handleDragStart = (e, currentIndex) => {
    if (toolId !== 'organize-pdf') return;
    e.dataTransfer.setData('text/plain', currentIndex);
    e.currentTarget.style.opacity = '0.5';
  };
  const handleDragEnd = (e) => {
    if (toolId !== 'organize-pdf') return;
    e.currentTarget.style.opacity = '1';
  };
  const handleDragOver = (e) => {
    if (toolId !== 'organize-pdf') return;
    e.preventDefault();
  };
  const handleDrop = (e, dropIndex) => {
    if (toolId !== 'organize-pdf') return;
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (dragIndex === dropIndex || isNaN(dragIndex)) return;
    
    const currentOrder = toolConfig.pageOrder || pagePreviews.map((_, i) => i);
    const newOrder = [...currentOrder];
    const [draggedItem] = newOrder.splice(dragIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    
    setToolConfig({ ...toolConfig, pageOrder: newOrder });
  };

  const renderOverlays = (pageIndex) => {
    const imgElement = imageRefs.current[pageIndex];
    if (!imgElement) return null;
    
    const imgRect = getContainedImageRect(imgElement);
    const preview = pagePreviews[pageIndex] || { width: 595.28, height: 841.89 };
    const scaleX = imgRect.width / (preview.width || 595.28);
    const scaleY = imgRect.height / (preview.height || 841.89);

    const overlays = [];

    // Redaction Boxes
    if (toolId === 'redact-pdf') {
      const boxes = (toolConfig.redactionBoxes || []).filter(b => b.page === pageIndex);
      boxes.forEach(box => {
        const domW = box.w * scaleX;
        const domH = box.h * scaleY;
        const domX = imgRect.left + (box.x * scaleX);
        const domY = imgRect.top + imgRect.height - (box.y * scaleY) - domH;

        overlays.push(
          <div 
            key={box.id} 
            className="absolute bg-slate-900 shadow-md group cursor-pointer border border-slate-700 hover:border-rose-500 transition-colors flex items-center justify-center"
            style={{ left: domX, top: domY, width: domW, height: domH }}
            onClick={(e) => { e.stopPropagation(); removeBox(box.id, 'redact'); }}
            onMouseEnter={() => setHoverBox(box.id)}
            onMouseLeave={() => setHoverBox(null)}
          >
            {hoverBox === box.id && <X size={12} className="text-rose-500" />}
          </div>
        );
      });
    }

    // Edit Text Boxes
    if (toolId === 'edit-pdf') {
      const boxes = (toolConfig.editTextBoxes || []).filter(b => b.page === pageIndex);
      boxes.forEach(box => {
        const domX = imgRect.left + (box.x * scaleX);
        const domY = imgRect.top + imgRect.height - (box.y * scaleY);
        const fontSizePx = box.size * scaleY;

        overlays.push(
          <div 
            key={box.id} 
            className="absolute text-blue-600 font-bold whitespace-nowrap cursor-pointer hover:ring-2 hover:ring-rose-500 rounded px-1 transition-all group"
            style={{ 
              left: domX, 
              top: domY, 
              fontSize: `${fontSizePx}px`, 
              transform: 'translate(-50%, -50%)',
              lineHeight: 1
            }}
            onClick={(e) => { e.stopPropagation(); removeBox(box.id, 'edit'); }}
          >
            {box.text}
            <div className="hidden group-hover:flex absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg items-center gap-1">
              <X size={10} /> Remove
            </div>
          </div>
        );
      });
    }

    // Signature Placement
    if (toolId === 'sign-pdf' && toolConfig.signaturePlacement && toolConfig.signaturePlacement.page === pageIndex) {
      const placement = toolConfig.signaturePlacement;
      const domW = placement.w * scaleX;
      const domH = placement.h * scaleY;
      const domX = imgRect.left + (placement.x * scaleX);
      const domY = imgRect.top + imgRect.height - (placement.y * scaleY) - domH;
      
      overlays.push(
        <div 
          key="signature-stamp"
          className="absolute border border-dashed border-indigo-400 bg-indigo-500/10 cursor-pointer flex items-center justify-center overflow-hidden hover:border-rose-500 hover:bg-rose-50 transition-colors group"
          style={{ left: domX, top: domY, width: domW, height: domH }}
          onClick={(e) => { e.stopPropagation(); setToolConfig({ ...toolConfig, signaturePlacement: null }); }}
          title="Click to remove signature"
        >
          {toolConfig.signatureBase64 && (
            <img src={toolConfig.signatureBase64} alt="Signature" className="max-w-full max-h-full object-contain pointer-events-none opacity-90 drop-shadow-sm" />
          )}
          <div className="hidden group-hover:flex absolute -top-6 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[10px] px-2 py-1 rounded shadow-lg items-center gap-1">
            <X size={10} /> Remove
          </div>
        </div>
      );
    }

    return overlays;
  };

  const showSelection = ['split-pdf', 'extract-pages', 'remove-pages'].includes(toolId);
  const showRotation = toolId === 'rotate-pdf';
  const selectedPages = new Set(toolConfig.selectedPages || []);
  const rotations = toolConfig.pageRotations || {};
  const order = toolConfig.pageOrder || pagePreviews.map((_, i) => i);

  return (
    <div className="w-full">
      {showSelection && (
        <div className="flex justify-between items-center mb-4 px-2">
          <span className="text-sm font-semibold text-slate-700">Select pages to process:</span>
          <div className="flex gap-2">
            <button onClick={selectAll} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Select All</button>
            <button onClick={deselectAll} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Deselect All</button>
          </div>
        </div>
      )}
      
      {!showSelection && (
        <div className="mb-4 px-2">
          <span className="text-sm font-semibold text-slate-700">
            {toolId === 'organize-pdf' 
              ? 'Drag and drop pages to reorder:' 
              : toolId === 'sign-pdf' || toolId === 'edit-pdf' 
                ? 'Click anywhere on a page to stamp:' 
                : 'Select pages to process:'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {order.map((originalIndex, currentIndex) => {
          const preview = pagePreviews[originalIndex];
          if (!preview) return null;
          
          const isSelected = selectedPages.has(originalIndex);
          const rotationAngle = rotations[originalIndex] || 0;
          
          return (
            <div 
              key={originalIndex} 
              draggable={toolId === 'organize-pdf'}
              onDragStart={(e) => handleDragStart(e, currentIndex)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, currentIndex)}
              className={`relative bg-white border rounded-xl overflow-hidden transition-all flex flex-col ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-md' : 'border-slate-200 hover:border-slate-300'} ${(toolId === 'redact-pdf' || toolId === 'edit-pdf' || toolId === 'sign-pdf') ? 'cursor-crosshair' : (showSelection ? 'cursor-pointer' : (toolId === 'organize-pdf' ? 'cursor-grab active:cursor-grabbing' : ''))}`}
              onClick={(e) => {
                if (showSelection) togglePageSelection(originalIndex);
                else if (toolId === 'edit-pdf' || toolId === 'sign-pdf') handleImageClick(e, originalIndex);
              }}
              onMouseDown={(e) => handleMouseDown(e, originalIndex)}
              onMouseMove={handleMouseMove}
              onMouseUp={(e) => handleMouseUp(e, originalIndex)}
              onMouseLeave={(e) => handleMouseUp(e, originalIndex)}
            >
              {showSelection && (
                <div className="absolute top-2 left-2 z-10 text-indigo-500 bg-white rounded-full shadow-sm">
                  {isSelected ? <CheckSquare size={20} className="fill-indigo-50" /> : <Square size={20} className="text-slate-300" />}
                </div>
              )}

              {toolId === 'organize-pdf' && (
                <div className="absolute top-2 left-2 z-10 bg-slate-800/70 p-1 rounded backdrop-blur-sm text-white pointer-events-none">
                  <Move size={14} />
                </div>
              )}

              {showRotation && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleRotate(originalIndex); }}
                  className="absolute top-2 right-2 z-10 p-1.5 bg-slate-800/70 hover:bg-indigo-600 text-white rounded-lg backdrop-blur-sm transition-colors shadow-sm"
                  title="Rotate Page"
                >
                  <RotateCw size={16} />
                </button>
              )}

              <div className="aspect-[1/1.414] bg-slate-50 p-2 flex items-center justify-center relative overflow-hidden pointer-events-none">
                <img 
                  ref={el => imageRefs.current[originalIndex] = el}
                  src={preview.dataUrl} 
                  alt={`Page ${originalIndex + 1}`}
                  style={{ 
                    transform: `rotate(${rotationAngle}deg)`, 
                    transition: 'transform 0.2s ease',
                    width: rotationAngle % 180 !== 0 ? 'auto' : '100%',
                    height: rotationAngle % 180 !== 0 ? '100%' : 'auto',
                    objectFit: 'contain'
                  }}
                  className="max-w-full max-h-full drop-shadow-sm pointer-events-none select-none"
                  draggable={false}
                  onLoad={() => setWindowSize(Date.now())}
                />
              </div>

              {/* Render dynamic overlays (Redactions / Text Stamps / Signatures) */}
              <div className="absolute inset-0 pointer-events-auto">
                {renderOverlays(originalIndex)}
                
                {/* Temporary dragging box for Redact */}
                {dragState.isDragging && dragState.pageIndex === originalIndex && toolId === 'redact-pdf' && (
                  <div 
                    className="absolute border-2 border-indigo-500 bg-indigo-500/20 pointer-events-none"
                    style={{
                      left: Math.min(dragState.currentX, dragState.startX),
                      top: Math.min(dragState.currentY, dragState.startY),
                      width: Math.abs(dragState.currentX - dragState.startX),
                      height: Math.abs(dragState.currentY - dragState.startY)
                    }}
                  />
                )}
              </div>

              <div className="py-2 px-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center pointer-events-none">
                <span className="text-[11px] font-semibold text-slate-500">Page {originalIndex + 1}</span>
                {toolId === 'organize-pdf' && (
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                    Pos {currentIndex + 1}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PageGrid;
