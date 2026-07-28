import React from 'react';
import { FileText, Scissors, Trash2, FileOutput, ArrowUpDown, Camera, Minimize2, Wrench, Search, Image as ImageIcon, FileType2, Presentation, Table, Globe, FileImage, FileType, RotateCw, Hash, Droplet, Crop, PenTool, FormInput, Lock, Unlock, PenLine, ShieldAlert, Scale, Bot, Sparkles, ZoomIn, Square } from 'lucide-react';
import * as api from '../lib/pdf-tools';

import ProtectSettings from '../components/tool-settings/ProtectSettings';
import CompressSettings from '../components/tool-settings/CompressSettings';
import WatermarkSettings from '../components/tool-settings/WatermarkSettings';
import SignSettings from '../components/tool-settings/SignSettings';
import ExtractSettings from '../components/tool-settings/ExtractSettings';
import GenericSettings from '../components/tool-settings/GenericSettings';
import HtmlToPdfSettings from '../components/tool-settings/HtmlToPdfSettings';
import ScanToPdfSettings from '../components/tool-settings/ScanToPdfSettings';
import PageNumbersSettings from '../components/tool-settings/PageNumbersSettings';
import CropSettings from '../components/tool-settings/CropSettings';
import AiAssistantSettings from '../components/tool-settings/AiAssistantSettings';
import UpscaleSettings from '../components/tool-settings/UpscaleSettings';
import EditSettings from '../components/tool-settings/EditSettings';
import RedactSettings from '../components/tool-settings/RedactSettings';

export const TOOLS_DATA = [
  {
    category: "Organize PDF",
    icon: <FileText size={14} />,
    items: [
      { id: "merge-pdf", name: "Merge PDF", desc: "Combine multiple PDFs into one.", path: "/merge-pdf", icon: <FileText size={24} />, color: "indigo", multiple: true, minFiles: 2, accept: ".pdf", actionTitle: "Merge PDFs", settingsComponent: GenericSettings, apiAction: async (files) => await api.mergePDFs(files), ext: ".pdf" },
      { id: "split-pdf", name: "Split PDF", desc: "Extract ranges or split all pages.", path: "/split-pdf", icon: <Scissors size={24} />, color: "rose", multiple: false, accept: ".pdf", actionTitle: "Split PDF", settingsComponent: ExtractSettings, apiAction: async (files, opt) => opt.mode === 'all' ? await api.splitPDFIntoIndividual(files[0]) : await api.splitPDF(files[0], opt.pages.split(',').map(n => parseInt(n.trim()))), isZip: true, ext: ".zip" },
      { id: "remove-pages", name: "Remove Pages", desc: "Delete pages from your PDF file.", path: "/remove-pages", icon: <Trash2 size={24} />, color: "slate", multiple: false, accept: ".pdf", actionTitle: "Remove Pages", settingsComponent: GenericSettings, apiAction: async (files, opt) => await api.removePages(files[0], opt.selectedPages || []), ext: ".pdf" },
      { id: "extract-pages", name: "Extract Pages", desc: "Save specific pages as a new PDF.", path: "/extract-pages", icon: <FileOutput size={24} />, color: "blue", multiple: false, accept: ".pdf", actionTitle: "Extract Pages", settingsComponent: ExtractSettings, apiAction: async (files, opt) => opt.mode === 'all' ? await api.splitPDFIntoIndividual(files[0]) : await api.splitPDF(files[0], opt.pages.split(',').map(n => parseInt(n.trim()))), ext: ".pdf" },
      { id: "organize-pdf", name: "Organize PDF", desc: "Drag and reorder page positions.", path: "/organize-pdf", icon: <ArrowUpDown size={24} />, color: "blue", multiple: false, accept: ".pdf", actionTitle: "Organize Pages", settingsComponent: GenericSettings, apiAction: async (files, opt) => await api.organizePDF(files[0], opt.pageOrder || []), ext: ".pdf" },
      { id: "scan-to-pdf", name: "Scan to PDF", desc: "Compile camera snapshots to PDF.", path: "/scan-to-pdf", icon: <Camera size={24} />, color: "slate", multiple: true, accept: "image/*", actionTitle: "Create PDF", settingsComponent: ScanToPdfSettings, apiAction: async (files, opt) => await api.imagesToPDF(files, opt.pageSize, opt.orientation), ext: ".pdf" }
    ]
  },
  {
    category: "Optimize PDF",
    icon: <Minimize2 size={14} />,
    items: [
      { id: "compress-pdf", name: "Compress PDF", desc: "Reduce PDF file size on the server.", path: "/compress-pdf", icon: <Minimize2 size={24} />, color: "slate", multiple: false, accept: ".pdf", actionTitle: "Compress PDF", settingsComponent: CompressSettings, apiAction: async (files, opt) => await api.compressPDF(files[0], opt.level), ext: ".pdf" },
      { id: "repair-pdf", name: "Repair PDF", desc: "Fix corrupt PDF files & headers.", path: "/repair-pdf", icon: <Wrench size={24} />, color: "slate", multiple: false, accept: ".pdf", actionTitle: "Repair PDF", settingsComponent: GenericSettings, apiAction: async (files) => await api.repairPDF(files[0]), ext: ".pdf" },
      { id: "ocr-pdf", name: "OCR PDF", desc: "Make scanned PDFs text-searchable.", path: "/ocr-pdf", icon: <Search size={24} />, color: "blue", multiple: false, accept: ".pdf", actionTitle: "Apply OCR", settingsComponent: GenericSettings, apiAction: async (files) => await api.ocrPDF(files[0]), ext: ".pdf" }
    ]
  },
  {
    category: "Convert TO PDF",
    icon: <ImageIcon size={14} />,
    items: [
      { id: "jpg-to-pdf", name: "JPG to PDF", desc: "Convert JPG/PNG images to PDF.", path: "/jpg-to-pdf", icon: <ImageIcon size={24} />, color: "amber", multiple: true, accept: "image/*", actionTitle: "Convert to PDF", settingsComponent: ScanToPdfSettings, apiAction: async (files, opt) => await api.imagesToPDF(files, opt.pageSize, opt.orientation), ext: ".pdf" },
      { id: "word-to-pdf", name: "Word to PDF", desc: "Convert DOCX files to PDF.", path: "/word-to-pdf", icon: <FileType2 size={24} />, color: "blue", multiple: false, accept: ".docx,.doc", actionTitle: "Convert to PDF", settingsComponent: GenericSettings, apiAction: async (files) => await api.officeToPDF(files[0]), ext: ".pdf" },
      { id: "ppt-to-pdf", name: "PPT to PDF", desc: "Convert PPTX presentations to PDF.", path: "/ppt-to-pdf", icon: <Presentation size={24} />, color: "orange", multiple: false, accept: ".pptx,.ppt", actionTitle: "Convert to PDF", settingsComponent: GenericSettings, apiAction: async (files) => await api.officeToPDF(files[0]), ext: ".pdf" },
      { id: "excel-to-pdf", name: "Excel to PDF", desc: "Convert XLSX sheets to PDF.", path: "/excel-to-pdf", icon: <Table size={24} />, color: "emerald", multiple: false, accept: ".xlsx,.xls", actionTitle: "Convert to PDF", settingsComponent: GenericSettings, apiAction: async (files) => await api.officeToPDF(files[0]), ext: ".pdf" },
      { id: "html-to-pdf", name: "HTML to PDF", desc: "Convert web pages/code to PDF.", path: "/html-to-pdf", icon: <Globe size={24} />, color: "blue", noUpload: true, multiple: false, accept: ".html", actionTitle: "Convert to PDF", settingsComponent: HtmlToPdfSettings, apiAction: async (files, opt) => await api.htmlToPDF({ mode: opt.inputType, ...(opt.inputType === 'url' ? { url: opt.url } : { html: opt.htmlCode }) }), ext: ".pdf" }
    ]
  },
  {
    category: "Convert FROM PDF",
    icon: <FileImage size={14} />,
    items: [
      { id: "pdf-to-png", name: "PDF to PNG", desc: "Extract PDF pages as PNG images.", path: "/pdf-to-png", icon: <FileImage size={24} />, color: "amber", multiple: false, accept: ".pdf", actionTitle: "Extract Images", settingsComponent: GenericSettings, apiAction: async (files) => await api.pdfToImages(files[0]) },
      { id: "pdf-to-word", name: "PDF to Word", desc: "Extract PDF contents to DOCX.", path: "/pdf-to-word", icon: <FileType size={24} />, color: "blue", multiple: false, accept: ".pdf", actionTitle: "Convert to Word", settingsComponent: GenericSettings, apiAction: async (files) => await api.pdfToOffice(files[0], 'docx'), ext: ".docx" },
      { id: "pdf-to-ppt", name: "PDF to PPT", desc: "Export PDF pages into slides.", path: "/pdf-to-ppt", icon: <Presentation size={24} />, color: "orange", multiple: false, accept: ".pdf", actionTitle: "Convert to PPT", settingsComponent: GenericSettings, apiAction: async (files) => await api.pdfToOffice(files[0], 'pptx'), ext: ".pptx" },
      { id: "pdf-to-excel", name: "PDF to Excel", desc: "Extract PDF tables into Excel.", path: "/pdf-to-excel", icon: <Table size={24} />, color: "emerald", multiple: false, accept: ".pdf", actionTitle: "Convert to Excel", settingsComponent: GenericSettings, apiAction: async (files) => await api.pdfToOffice(files[0], 'xlsx'), ext: ".xlsx" }
    ]
  },
  {
    category: "Edit PDF",
    icon: <PenTool size={14} />,
    items: [
      { id: "rotate-pdf", name: "Rotate PDF", desc: "Rotate portrait/landscape pages.", path: "/rotate-pdf", icon: <RotateCw size={24} />, color: "blue", multiple: false, accept: ".pdf", actionTitle: "Rotate PDF", settingsComponent: GenericSettings, apiAction: async (files, opt) => await api.rotatePDF(files[0], opt.pageRotations || {}), ext: ".pdf" },
      { id: "page-numbers", name: "Page Numbers", desc: "Draw page numbers on margins.", path: "/page-numbers", icon: <Hash size={24} />, color: "indigo", multiple: false, accept: ".pdf", actionTitle: "Add Page Numbers", settingsComponent: PageNumbersSettings, apiAction: async (files, opt) => await api.addPageNumbers(files[0], opt.position, opt.format), ext: ".pdf" },
      { id: "add-watermark", name: "Add Watermark", desc: "Stamp customized text overlays.", path: "/add-watermark", icon: <Droplet size={24} />, color: "blue", multiple: false, accept: ".pdf", actionTitle: "Add Watermark", settingsComponent: WatermarkSettings, apiAction: async (files, opt) => await api.addWatermark(files[0], opt.text, opt.size, opt.rotation, opt.opacity), ext: ".pdf" },
      { id: "crop-pdf", name: "Crop PDF", desc: "Visual page dimensions cropper.", path: "/crop-pdf", icon: <Crop size={24} />, color: "rose", multiple: false, accept: ".pdf", actionTitle: "Crop PDF", settingsComponent: CropSettings, apiAction: async (files, opt) => await api.cropPDF(files[0], { top: opt.top ?? 0.5, right: opt.right ?? 0.5, bottom: opt.bottom ?? 0.5, left: opt.left ?? 0.5 }), ext: ".pdf" },
      { id: "edit-pdf", name: "Edit PDF", desc: "Add text, shapes, or notes.", path: "/edit-pdf", icon: <PenTool size={24} />, color: "blue", multiple: false, accept: ".pdf", actionTitle: "Edit PDF", settingsComponent: EditSettings, apiAction: async (files, opt) => await api.editPDF(files[0], opt.editTextBoxes || []), ext: ".pdf" },
      { id: "pdf-forms", name: "PDF Forms", desc: "Fill out interactive forms.", path: "/pdf-forms", icon: <FormInput size={24} />, color: "slate", multiple: false, accept: ".pdf", actionTitle: "Fill Forms", settingsComponent: GenericSettings, apiAction: async (files) => await api.fillPDFForms(files[0]), ext: ".pdf" }
    ]
  },
  {
    category: "Security",
    icon: <Lock size={14} />,
    items: [
      { id: "protect-pdf", name: "Protect PDF", desc: "Add passwords & encrypt files.", path: "/protect-pdf", icon: <Lock size={24} />, color: "amber", multiple: false, accept: ".pdf", actionTitle: "Protect PDF", settingsComponent: ProtectSettings, apiAction: async (files, opt) => await api.protectPDF(files[0], opt.password), ext: ".pdf" },
      { id: "unlock-pdf", name: "Unlock PDF", desc: "Remove passwords & restrictions.", path: "/unlock-pdf", icon: <Unlock size={24} />, color: "amber", multiple: false, accept: ".pdf", actionTitle: "Unlock PDF", settingsComponent: ProtectSettings, apiAction: async (files, opt) => await api.unlockPDF(files[0], opt.password), ext: ".pdf" },
      { id: "sign-pdf", name: "Sign PDF", desc: "Draw signatures and stamp them.", path: "/sign-pdf", icon: <PenLine size={24} />, color: "slate", multiple: false, accept: ".pdf", actionTitle: "Sign PDF", settingsComponent: SignSettings, apiAction: async (files, opt) => await api.signPDF(files[0], opt.signatureBase64, opt.pageIndex, opt.x, opt.y, opt.width, opt.height), ext: ".pdf" },
      { id: "redact-pdf", name: "Redact PDF", desc: "Blackout sensitive information.", path: "/redact-pdf", icon: <Square size={24} />, color: "slate", multiple: false, accept: ".pdf", actionTitle: "Redact PDF", settingsComponent: RedactSettings, apiAction: async (files, opt) => await api.redactPDF(files[0], opt.redactionBoxes || []), ext: ".pdf" },
      { id: "compare-pdf", name: "Compare PDF", desc: "Compare two PDFs side-by-side.", path: "/compare-pdf", icon: <Scale size={24} />, color: "amber", multiple: true, minFiles: 2, accept: ".pdf", actionTitle: "Compare PDFs", settingsComponent: GenericSettings, apiAction: async (files) => await api.comparePDFs(files[0], files[1]), ext: ".pdf" }
    ]
  },
  {
    category: "PDF Intelligence",
    icon: <Bot size={14} />,
    items: [
      { id: "ai-pdf-assistant", name: "AI PDF Assistant", desc: "Chat, translate, or summarize.", path: "/ai-pdf-assistant", icon: <Bot size={24} />, color: "purple", multiple: false, accept: ".pdf", actionTitle: "Open Assistant", settingsComponent: AiAssistantSettings, apiAction: async (files, opt) => await api.aiAssistantPDF(files[0], opt.mode, { language: opt.language, question: opt.question }), ext: ".pdf" }
    ]
  },
  {
    category: "AI Image Tools",
    icon: <Sparkles size={14} />,
    items: [
      { id: "background-remover", name: "Background Remover", desc: "Remove background from images.", path: "/background-remover", icon: <Sparkles size={24} />, color: "emerald", multiple: false, accept: "image/*", actionTitle: "Remove Background", settingsComponent: GenericSettings, apiAction: async (files) => await api.aiRemoveBackground(files[0]), ext: ".png" },
      { id: "image-upscaler", name: "Image Upscaler", desc: "Enhance resolution and quality.", path: "/image-upscaler", icon: <ZoomIn size={24} />, color: "teal", multiple: false, accept: "image/*", actionTitle: "Upscale Image", settingsComponent: UpscaleSettings, apiAction: async (files, opt) => await api.aiUpscaleImage(files[0], opt.factor.replace('x', '')), ext: ".png" }
    ]
  }
];

export const ALL_TOOLS = TOOLS_DATA.reduce((acc, cat) => [...acc, ...cat.items], []);

export const COLOR_MAP = {
  indigo: "bg-indigo-50 text-indigo-500",
  rose: "bg-rose-50 text-rose-500",
  slate: "bg-slate-100 text-slate-600",
  blue: "bg-blue-50 text-blue-500",
  amber: "bg-amber-50 text-amber-500",
  orange: "bg-orange-50 text-orange-500",
  emerald: "bg-emerald-50 text-emerald-500",
  teal: "bg-teal-50 text-teal-500",
  purple: "bg-purple-50 text-purple-500",
};
