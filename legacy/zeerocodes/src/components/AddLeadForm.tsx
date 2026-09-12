import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { LeadIndustry, LeadSource } from '../types';
import { motion } from 'motion/react';
import { X, User, Building2, Phone, Mail, Globe, MapPin, NotebookPen } from 'lucide-react';

import { format } from 'date-fns';
import { cn } from '../lib/utils';

const BUDGET_RANGES = [
  '₦10k - ₦100k',
  '₦100k - ₦300k',
  '₦300k - ₦1M',
  '₦1M - ₦5M',
  '₦5M+'
];

const AddLeadForm = ({ onClose }: { onClose: () => void }) => {
  const { addLead } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: 'Other' as LeadIndustry,
    source: 'Website' as LeadSource,
    budgetRange: '₦10k - ₦100k',
    notes: '',
  });
  const [budgetError, setBudgetError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const validatePhone = (phone: string) => {
    // Basic phone validation: allows numbers, spaces, dashes, and a leading plus sign
    // Requirement: at least 7 digits to be somewhat meaningful
    const phoneRegex = /^\+?[\d\s-]{7,20}$/;
    return phoneRegex.test(phone.trim());
  };

  const validateBudget = (budget: string) => {
    // Basic regex for currency formats (e.g. 1M, 500k, ₦1,000,000, range like 1k-5k)
    const currencyRegex = /^([₦$£€¥]?\s?[\d,]+(\.\d{2})?[kMB]?(\+)?(\s?-\s?[₦$£€¥]?\s?[\d,]+(\.\d{2})?[kMB]?)?|Unsure|Flexible)$/i;
    if (BUDGET_RANGES.includes(budget)) return true;
    return currencyRegex.test(budget.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let hasError = false;

    if (!validateBudget(formData.budgetRange)) {
      setBudgetError(true);
      hasError = true;
    }

    if (!validateEmail(formData.email)) {
      setEmailError(true);
      hasError = true;
    }

    if (!validatePhone(formData.phone)) {
      setPhoneError(true);
      hasError = true;
    }

    if (hasError) return;

    addLead({
      ...formData,
      status: 'New',
    });
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-navy-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-navy-900 w-full max-w-lg rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between bg-white/5 relative shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tighter leading-none mb-1">New <span className="italic text-coral-500">Prospect</span></h2>
            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Deploy new lead to AI funnel</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors group">
            <X className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2 px-1">
                <User className="w-2.5 h-2.5 text-coral-500" /> Full Name
              </label>
              <input 
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 outline-none transition-all placeholder:text-white/10"
                placeholder="Adebayo Kunle"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
               <label className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2 px-1">
                <Building2 className="w-2.5 h-2.5 text-coral-500" /> Company
              </label>
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 outline-none transition-all placeholder:text-white/10"
                placeholder="Private (Optional)"
                value={formData.company}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Phone className="w-2.5 h-2.5 text-coral-500" /> WhatsApp
                </label>
                {phoneError && <span className="text-[8px] font-bold text-coral-500 uppercase">Invalid Phone</span>}
              </div>
              <input 
                required
                type="tel"
                className={cn(
                  "w-full bg-white/5 border rounded-xl px-4 py-3 text-xs font-bold text-white focus:ring-2 outline-none transition-all placeholder:text-white/10",
                  phoneError ? "border-coral-500 focus:ring-coral-500/20" : "border-white/10 focus:ring-coral-500/20 focus:border-coral-500"
                )}
                placeholder="+234..."
                value={formData.phone}
                onChange={e => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (phoneError) setPhoneError(false);
                }}
              />
            </div>
            <div className="space-y-2">
               <div className="flex items-center justify-between px-1">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Mail className="w-2.5 h-2.5 text-coral-500" /> Email Address
                </label>
                {emailError && <span className="text-[8px] font-bold text-coral-500 uppercase">Invalid Email</span>}
              </div>
              <input 
                required
                type="email"
                className={cn(
                  "w-full bg-white/5 border rounded-xl px-4 py-3 text-xs font-bold text-white focus:ring-2 outline-none transition-all placeholder:text-white/10",
                  emailError ? "border-coral-500 focus:ring-coral-500/20" : "border-white/10 focus:ring-coral-500/20 focus:border-coral-500"
                )}
                placeholder="pioneer@email.com"
                value={formData.email}
                onChange={e => {
                  setFormData({ ...formData, email: e.target.value });
                  if (emailError) setEmailError(false);
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest px-1">Industry</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:ring-2 focus:ring-coral-500/20 outline-none appearance-none"
                value={formData.industry}
                onChange={e => setFormData({ ...formData, industry: e.target.value as LeadIndustry })}
              >
                <option value="Home Services">Home Services</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Education">Education</option>
                <option value="Beauty">Beauty</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
               <label className="text-[9px] font-black text-white/40 uppercase tracking-widest px-1 block">Inbound Source</label>
               <select 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:ring-2 focus:ring-coral-500/20 outline-none appearance-none"
                value={formData.source}
                onChange={e => setFormData({ ...formData, source: e.target.value as LeadSource })}
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
               <div className="flex items-center justify-between px-1">
                 <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block">Budget Range</label>
                 {budgetError && <span className="text-[8px] font-bold text-coral-500 uppercase">Invalid Format</span>}
               </div>
               <div className="flex flex-wrap gap-2 mb-2">
                 {BUDGET_RANGES.map(range => (
                   <button
                     key={range}
                     type="button"
                     onClick={() => {
                       setFormData({ ...formData, budgetRange: range });
                       setBudgetError(false);
                     }}
                     className={cn(
                       "px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all",
                       formData.budgetRange === range 
                         ? "bg-coral-500 border-coral-500 text-white" 
                         : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                     )}
                   >
                     {range}
                   </button>
                 ))}
               </div>
               <input 
                className={cn(
                  "w-full bg-white/5 border rounded-xl px-4 py-3 text-xs font-bold text-white focus:ring-2 outline-none transition-all placeholder:text-white/10",
                  budgetError ? "border-coral-500 focus:ring-coral-500/20" : "border-white/10 focus:ring-coral-500/20 focus:border-coral-500"
                )}
                placeholder="Custom (e.g. ₦1.5M or 500,000)"
                value={formData.budgetRange}
                onChange={e => {
                  setFormData({ ...formData, budgetRange: e.target.value });
                  if (budgetError) setBudgetError(false);
                }}
              />
            </div>

          <div className="space-y-2">
             <label className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2 px-1">
               <NotebookPen className="w-2.5 h-2.5 text-coral-500" /> Lead Briefing
             </label>
             <textarea 
               className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:ring-2 focus:ring-coral-500/20 outline-none min-h-[100px] placeholder:text-white/10 resize-none custom-scrollbar"
               placeholder="Contextual notes for AI agent..."
               value={formData.notes}
               onChange={e => setFormData({ ...formData, notes: e.target.value })}
             />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-white/10 text-white font-black uppercase tracking-widest text-[9px] rounded-xl hover:bg-white/5 transition-all"
            >
              Discard
            </button>
            <button 
              type="submit"
              className="flex-1 bg-coral-500 text-white font-black py-4 rounded-xl shadow-2xl shadow-coral-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[9px]"
            >
              Add Prospect
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddLeadForm;
