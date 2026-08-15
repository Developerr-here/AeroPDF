import React, { useState, useEffect } from 'react';
import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, PDFOptionList } from 'pdf-lib';
import { FormInput, AlertCircle, Loader2 } from 'lucide-react';

const PDFFormsSettings = ({ files, setConfig }) => {
  const [fields, setFields] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadPdfFields = async () => {
      if (!files || files.length === 0) return;
      
      setLoading(true);
      setError(null);
      try {
        const file = files[0];
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const form = pdfDoc.getForm();
        const extractedFields = form.getFields();
        
        const fieldDetails = extractedFields.map(f => {
          const name = f.getName();
          let type = 'unknown';
          let options = [];
          
          if (f instanceof PDFTextField) type = 'text';
          else if (f instanceof PDFCheckBox) type = 'checkbox';
          else if (f instanceof PDFRadioGroup) {
            type = 'radio';
            options = f.getOptions();
          }
          else if (f instanceof PDFDropdown) {
            type = 'dropdown';
            options = f.getOptions();
          }
          else if (f instanceof PDFOptionList) {
            type = 'optionList';
            options = f.getOptions();
          }
          
          return { name, type, options };
        }).filter(f => f.type !== 'unknown');

        if (isMounted) {
          setFields(fieldDetails);
          
          // Initialize answers
          const initialAnswers = {};
          fieldDetails.forEach(f => {
            if (f.type === 'checkbox') initialAnswers[f.name] = false;
            else if (f.type === 'dropdown' || f.type === 'radio') initialAnswers[f.name] = f.options.length > 0 ? f.options[0] : '';
            else initialAnswers[f.name] = '';
          });
          setAnswers(initialAnswers);
          setConfig({ answers: initialAnswers });
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setError("Failed to extract form fields from the PDF. It may be encrypted or not have interactive fields.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPdfFields();

    return () => { isMounted = false; };
  }, [files]);

  const handleInputChange = (name, value) => {
    const newAnswers = { ...answers, [name]: value };
    setAnswers(newAnswers);
    setConfig({ answers: newAnswers });
  };

  if (loading) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-indigo-500" size={24} />
        <p className="text-sm text-slate-600 font-medium">Scanning PDF for form fields...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-red-600">
        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex gap-3">
        <AlertCircle className="text-slate-500 flex-shrink-0" size={18} />
        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          No interactive form fields were found in this PDF.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <FormInput className="text-indigo-600" size={20} />
        <h3 className="font-semibold text-slate-800">Fill PDF Form Fields</h3>
      </div>
      
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {fields.map((field) => (
          <div key={field.name} className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">{field.name}</label>
            
            {field.type === 'text' && (
              <input
                type="text"
                value={answers[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter text..."
              />
            )}
            
            {field.type === 'checkbox' && (
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={answers[field.name] || false}
                  onChange={(e) => handleInputChange(field.name, e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-600">Check this box</span>
              </label>
            )}

            {field.type === 'dropdown' && (
              <select
                value={answers[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {field.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {field.type === 'radio' && (
              <div className="flex flex-col gap-2 mt-1">
                {field.options.map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={field.name}
                      value={opt}
                      checked={answers[field.name] === opt}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-600">{opt}</span>
                  </label>
                ))}
              </div>
            )}
            
            {field.type === 'optionList' && (
              <select
                multiple
                value={Array.isArray(answers[field.name]) ? answers[field.name] : [answers[field.name]]}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  handleInputChange(field.name, values);
                }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {field.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PDFFormsSettings;
