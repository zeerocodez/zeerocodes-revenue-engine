import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileText, Check, AlertCircle, ArrowRight, Table } from 'lucide-react';
import Papa from 'papaparse';
import { cn } from '../lib/utils';
import { useApp } from '../AppContext';
import { LeadIndustry, LeadSource } from '../types';

interface Mapping {
  name: string;
  email: string;
  phone: string;
  company: string;
  industry: string;
  budget: string;
  notes: string;
}

const CSVImportModal = ({ onClose }: { onClose: () => void }) => {
  const { bulkAddLeads } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');
  const [mapping, setMapping] = useState<Mapping>({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    budget: '',
    notes: '',
  });
  const [fixedSource, setFixedSource] = useState<LeadSource>('Website');
  const [fixedIndustry, setFixedIndustry] = useState<LeadIndustry>('Other');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          const firstRow = results.data[0] as any;
          const foundHeaders = Object.keys(firstRow);
          setHeaders(foundHeaders);
          setData(results.data);
          setFile(selectedFile);
          
          // Auto-mapping attempt
          const newMapping = { ...mapping };
          foundHeaders.forEach(h => {
            const low = h.toLowerCase();
            if (low.includes('name') || low === 'lead' || low === 'contact') newMapping.name = h;
            if (low.includes('email') || low === 'mail') newMapping.email = h;
            if (low.includes('phone') || low.includes('mobile') || low.includes('whatsapp') || low.includes('tel')) newMapping.phone = h;
            if (low.includes('company') || low.includes('business') || low.includes('firm')) newMapping.company = h;
            if (low.includes('industry') || low.includes('sector')) newMapping.industry = h;
            if (low.includes('budget') || low.includes('spend')) newMapping.budget = h;
            if (low.includes('note') || low.includes('message') || low.includes('comment') || low.includes('brief')) newMapping.notes = h;
          });
          setMapping(newMapping);
          setStep('map');
        }
      }
    });
  };

  const handleImport = () => {
    const leadsToImport = data.map(row => {
      let rawBudget = row[mapping.budget] || 'Unsure';
      // Basic normalization: if it's a number, add ₦
      if (/^\d+(\.\d+)?$/.test(rawBudget.toString().trim())) {
        rawBudget = `₦${rawBudget}`;
      }

      return {
        name: row[mapping.name] || 'Unknown',
        email: row[mapping.email] || '',
        phone: row[mapping.phone] || '',
        company: row[mapping.company] || '',
        industry: (row[mapping.industry] as LeadIndustry) || fixedIndustry,
        source: fixedSource,
        budgetRange: rawBudget,
        notes: row[mapping.notes] || 'Imported via CSV',
        status: 'New' as const,
      };
    });

    bulkAddLeads(leadsToImport);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-navy-950/60 backdrop-blur-md z-[110] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-navy-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-coral-500 rounded-2xl">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Bulk Import <span className="text-coral-500 italic">Leads</span></h2>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">
                {step === 'upload' ? 'Upload your CSV database' : step === 'map' ? 'Map columns to lead fields' : 'Review and confirm'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors z-10">
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {step === 'upload' && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group border-2 border-dashed border-white/10 rounded-[2.5rem] p-16 flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-coral-500/50 hover:bg-white/[0.02] transition-all"
            >
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-10 h-10 text-white/20 group-hover:text-coral-500 transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-white uppercase tracking-widest mb-2">Drop your CSV here</p>
                <p className="text-xs text-white/40 font-bold">Or click to browse files</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                className="hidden" 
              />
            </div>
          )}

          {step === 'map' && (
            <div className="space-y-8">
              <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                  <Table className="w-4 h-4 text-coral-500" /> Key Mapping
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(Object.keys(mapping) as Array<keyof Mapping>).map((field) => (
                    <div key={field} className="space-y-2">
                       <label className="text-[9px] font-black text-white/40 uppercase tracking-widest px-1 block capitalize">
                          {field} {field === 'name' && <span className="text-coral-500">*</span>}
                       </label>
                       <select 
                         value={mapping[field]}
                         onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                         className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:ring-2 focus:ring-coral-500/20 outline-none appearance-none"
                       >
                         <option value="">-- Ignore --</option>
                         {headers.map(h => (
                           <option key={h} value={h}>{h}</option>
                         ))}
                       </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500" /> Default Values
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest px-1 block">Static Source</label>
                    <select 
                      value={fixedSource}
                      onChange={(e) => setFixedSource(e.target.value as LeadSource)}
                      className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none appearance-none"
                    >
                      <option value="Website">Website</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Referral">Referral</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest px-1 block">Default Industry</label>
                    <select 
                      value={fixedIndustry}
                      onChange={(e) => setFixedIndustry(e.target.value as LeadIndustry)}
                      className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none appearance-none"
                    >
                      <option value="Home Services">Home Services</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Education">Education</option>
                      <option value="Beauty">Beauty</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-white/5 bg-white/5 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 border border-white/10 text-white font-black uppercase tracking-widest text-[9px] rounded-2xl hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          {step === 'map' && (
            <button 
              onClick={handleImport}
              disabled={!mapping.name}
              className="flex-[2] bg-coral-500 text-white font-black py-4 rounded-2xl shadow-2xl shadow-coral-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[9px] disabled:opacity-50"
            >
              Start Import ({data.length} Leads)
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CSVImportModal;
