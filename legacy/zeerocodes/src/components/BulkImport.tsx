import React, { useRef, useState } from 'react';
import { Upload, X, Check, AlertCircle, FileText } from 'lucide-react';
import Papa from 'papaparse';
import { useApp } from '../AppContext';
import { LeadSource, LeadIndustry, LeadStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const BulkImport = ({ onClose }: { onClose: () => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { bulkAddLeads } = useApp();

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }

    setIsUploading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const leads = results.data
            .filter((row: any) => Object.values(row).some(v => v !== null && v !== ''))
            .map((row: any) => {
              const getFieldV = (row: any, keywords: string[]) => {
                const keys = Object.keys(row);
                
                // Tier 1: Strict Exact/Cleaned Match
                for (const keyword of keywords) {
                  const cleanedKeyword = keyword.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                  const foundKey = keys.find(k => {
                    const cleanedKey = k.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                    return cleanedKey === cleanedKeyword;
                  });
                  if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
                    const val = row[foundKey].toString().trim();
                    if (val !== '') return val;
                  }
                }

                // Tier 2: Fuzzy Contains Match
                for (const keyword of keywords) {
                  const foundKey = keys.find(k => k.toLowerCase().includes(keyword.toLowerCase()));
                  if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
                    const val = row[foundKey].toString().trim();
                    if (val !== '') return val;
                  }
                }
                return null;
              };

              // Content-based heuristic for when headers fail completely
              const findKeyByContent = (row: any, pattern: RegExp) => {
                const keys = Object.keys(row);
                for (const k of keys) {
                  const v = String(row[k] || '').trim();
                  if (pattern.test(v)) return v;
                }
                return null;
              };

              // NAME MAPPING (Prioritized)
              let name = getFieldV(row, [
                'name', 'full name', 'fullname', 'lead name', 'customer name', 'contact name', 
                'customer', 'lead', 'prospect', 'client', 'person', 'contact', 'identity',
                'entry', 'title', 'account'
              ]);
              
              if (!name) {
                const first = getFieldV(row, ['first', 'given', 'fname', 'first_name', 'forename']);
                const last = getFieldV(row, ['last', 'surname', 'lname', 'last_name', 'family_name']);
                if (first || last) {
                  name = `${first || ''} ${last || ''}`.trim();
                }
              }

              // EMAIL MAPPING
              let email = getFieldV(row, ['email', 'mail', 'e-mail', 'address', 'contact_email', 'email_address', 'electronic mail']) || '';
              if (!email) {
                email = findKeyByContent(row, /^[^\s@]+@[^\s@]+\.[^\s@]+$/) || '';
              }

              // PHONE MAPPING
              let phone = getFieldV(row, ['phone', 'mobile', 'cell', 'tel', 'whatsapp', 'sms', 'contact_number', 'phone_number', 'telephone', 'mobile_number']) || '';
              if (!phone) {
                // Heuristic for phone numbers: digits, plus, dashes, spaces, parentheses
                phone = findKeyByContent(row, /^[\d\+\-\s\(\)]{7,}$/) || '';
              }

              // Deep Scan Fallback for Name: Find any sensible string that isn't a phone/email/URL
              if (!name || name === 'Unnamed Lead') {
                const keys = Object.keys(row);
                for (const k of keys) {
                  const v = String(row[k] || '').trim();
                  // String between 2 and 60 chars, doesn't look like email or digits
                  if (v.length > 2 && v.length < 60 && !v.includes('@') && !/^[\d\+\s\-\(\)]+$/.test(v) && !v.startsWith('http')) {
                    name = v;
                    break;
                  }
                }
              }

              return {
                name: name || 'Unnamed Lead',
                email: email,
                phone: phone,
                company: getFieldV(row, ['company', 'organization', 'org', 'business', 'employer', 'firm', 'work', 'office', 'agency']) || '',
                industry: (getFieldV(row, ['industry', 'sector', 'business type', 'category', 'vertical', 'niche', 'type', 'field', 'specialization']) || 'Other') as LeadIndustry,
                source: (getFieldV(row, ['source', 'channel', 'origin', 'referral', 'medium', 'campaign', 'platform', 'how found', 'lead source']) || 'Other') as LeadSource,
                status: 'New' as LeadStatus,
                budgetRange: getFieldV(row, ['budget', 'value', 'price', 'deal', 'amount', 'investment', 'worth', 'budget range', 'revenue', 'spending', 'money']) || '₦10k - ₦100k',
                notes: getFieldV(row, ['notes', 'comment', 'description', 'message', 'remarks', 'about', 'summary', 'info', 'details', 'queries', 'requirements']) || 'Imported via CSV',
              };
            });

          bulkAddLeads(leads);
          setSuccess(true);
          setTimeout(() => {
            onClose();
          }, 2000);
        } catch (err) {
          setError('Failed to parse CSV. Ensure headers match: name, email, phone, company, industry, source, notes.');
        } finally {
          setIsUploading(false);
        }
      },
      error: (err) => {
        setError(err.message);
        setIsUploading(false);
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-navy-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-navy-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
      >
        <button onClick={onClose} className="absolute top-6 sm:top-8 right-6 sm:right-8 text-white/40 hover:text-white transition-colors z-10">
          <X className="w-5 h-5 sm:w-6 h-6" />
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          <div className="text-center mb-8 sm:mb-10 mt-4 sm:mt-0 shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-coral-500/10 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-coral-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white mb-2">Bulk <span className="italic text-coral-500">Import</span></h2>
            <p className="text-white/40 text-[8px] sm:text-[10px] font-black uppercase tracking-widest leading-relaxed">Deploy lead database via CSV</p>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-3xl sm:rounded-[2rem] p-8 sm:p-12 text-center cursor-pointer transition-all group relative",
              isDragging ? "border-coral-500 bg-coral-500/5" : "border-white/5 bg-white/2 hover:border-coral-500/30 hover:bg-white/5"
            )}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".csv"
            />
            
            <AnimatePresence mode="wait">
              {isUploading ? (
                <motion.div 
                  key="uploading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3 sm:gap-4"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" />
                  <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-coral-500">Processing...</div>
                </motion.div>
              ) : success ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3 sm:gap-4"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                    <Check className="w-5 h-5 sm:w-6 h-6" />
                  </div>
                  <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-green-500">Success! Syncing with AI Engine...</div>
                </motion.div>
              ) : (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3 sm:space-y-4"
                >
                  <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-white/20 mx-auto group-hover:text-coral-500/50 transition-colors" />
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white mb-1">Click to browse or drag & drop</div>
                    <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Supported: .CSV files only</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {error && (
            <div className="mt-4 sm:mt-6 flex items-center gap-3 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl sm:rounded-2xl text-red-400 text-[10px] sm:text-xs font-bold font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-white/5 pb-4">
            <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/20 text-center leading-relaxed">
              Ensure your CSV headers: <br className="sm:hidden" />
              <span className="text-white/40">name, email, phone, company, industry, source, budget, notes</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BulkImport;
