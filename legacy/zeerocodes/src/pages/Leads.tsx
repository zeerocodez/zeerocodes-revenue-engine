import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Lead, LeadStatus } from '../types';
import AIStatusCard from '../components/AIStatusCard';
import LeadModal from '../components/LeadModal';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Plus, Phone, Mail, Instagram, Facebook, MessageSquare, Globe, MoreHorizontal, Trash2, Sparkles, X, Download, Upload, FileText, Users } from 'lucide-react';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import CSVImportModal from '../components/CSVImportModal';
import { useSearchParams } from 'react-router-dom';

const handleWhatsApp = (phone: string | undefined, name: string) => {
  if (!phone) return;
  const cleanPhone = phone.replace(/\D/g, '');
  const message = encodeURIComponent(`Hi ${name}, I'm reaching out from Zeerocodes Automation regarding your inquiry. How can I help you today?`);
  window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
};

const handleEmail = (email: string | undefined, name: string) => {
  if (!email) return;
  const subject = encodeURIComponent(`Regarding your inquiry - Zeerocodes`);
  const body = encodeURIComponent(`Hi ${name},\n\nI'm reaching out to follow up on your recent inquiry.`);
  window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
};

// Score styling logic
const getScoreStyle = (score: number) => {
  if (score >= 85) return { 
    text: 'text-purple-400', 
    bg: 'bg-purple-500/10', 
    border: 'border-purple-500/20', 
    dot: 'bg-purple-500 shadow-purple-500/40',
    label: 'Elite/Unicorn'
  };
  if (score >= 70) return { 
    text: 'text-green-400', 
    bg: 'bg-green-500/10', 
    border: 'border-green-500/20', 
    dot: 'bg-green-500 shadow-green-500/40',
    label: 'Qualified'
  };
  if (score >= 50) return { 
    text: 'text-yellow-400', 
    bg: 'bg-yellow-500/10', 
    border: 'border-yellow-500/20', 
    dot: 'bg-yellow-500 shadow-yellow-500/40',
    label: 'Warm/Interested'
  };
  if (score >= 30) return { 
    text: 'text-orange-400', 
    bg: 'bg-orange-500/10', 
    border: 'border-orange-500/20', 
    dot: 'bg-orange-500 shadow-orange-500/40',
    label: 'Orange/Cooling'
  };
  return { 
    text: 'text-red-400', 
    bg: 'bg-red-500/10', 
    border: 'border-red-500/20', 
    dot: 'bg-red-500 shadow-red-500/40',
    label: 'Cold/Low Intent'
  };
};

// Source icon mapping
const getSourceIcon = (source: string) => {
  switch (source) {
    case 'WhatsApp':
      return <MessageSquare className="w-3 h-3 text-green-500" />;
    case 'Instagram':
      return <Instagram className="w-3 h-3 text-pink-500" />;
    case 'Facebook':
      return <Facebook className="w-3 h-3 text-blue-600" />;
    case 'Website':
      return <Globe className="w-3 h-3 text-blue-400" />;
    case 'Referral':
      return <Users className="w-3 h-3 text-purple-400" />;
    default:
      return <Globe className="w-3 h-3 text-white/20" />;
  }
};

const Leads: React.FC<{ onAddLead?: () => void }> = ({ onAddLead }) => {
  const { 
    leads, 
    setLeads, 
    clearLeads, 
    deduplicateLeads, 
    seedHighIntentLeads, 
    qualificationRules, 
    isQuotaReached, 
    isProcessing,
    reprocessSingleLead,
    updateLeadStatus,
    bulkUpdateLeadStatus,
    deleteLead,
    bulkDeleteLeads,
    addLeadComment,
    bulkScheduleFollowUps,
    globalSearchQuery,
    setGlobalSearchQuery
  } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id && leads.some(l => l.id === id)) {
      setSelectedLeadId(id);
      // Clean up the URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('id');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, leads, setSearchParams]);

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | LeadStatus>('All');
  const [scoreFilter, setScoreFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const filteredLeads = leads.filter(lead => {
    const q = globalSearchQuery.toLowerCase().trim();
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    
    const score = lead.qualificationScore || 0;
    const matchesScore = 
      scoreFilter === 'All' ? true :
      scoreFilter === 'High' ? score >= 70 :
      scoreFilter === 'Medium' ? (score >= 40 && score < 70) :
      scoreFilter === 'Low' ? score < 40 : true;
    
    if (!matchesStatus || !matchesScore) return false;
    
    if (q === '') return true;
    
    // Improved multi-keyword search
    const keywords = q.split(/\s+/).filter(k => k.length > 0);
    const searchableText = `${lead.name} ${lead.company || ''} ${lead.industry} ${lead.email || ''} ${lead.phone || ''} ${lead.source || ''} ${lead.budgetRange || ''} ${lead.notes || ''} ${lead.status} ${lead.aiSummary || ''}`.toLowerCase();
    
    const matchesSearch = keywords.every(kw => searchableText.includes(kw));
    
    return matchesSearch && matchesStatus;
  });

  const handleSeed = async () => {
    setIsSeeding(true);
    setActionFeedback("Generating 5 High-Intent Leads...");
    await seedHighIntentLeads();
    setIsSeeding(false);
    setActionFeedback("5 High-Intent Leads added and qualified.");
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const handleDedupe = () => {
    const before = leads.length;
    deduplicateLeads();
    // Use a small delay to calculate after count or just use a generic success
    setActionFeedback(`Deduplication complete. Cleaned up database.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handlePurge = () => {
    if (leads.length === 0) return;
    clearLeads();
    setActionFeedback('Database successfully purged.');
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const reprocessLead = async (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation();
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    
    setActionFeedback(`Re-evaluating ${lead.name}...`);
    await reprocessSingleLead(leadId);
    setActionFeedback(`Evaluation updated for ${lead.name}.`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredLeads.map(l => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = (status: LeadStatus) => {
    bulkUpdateLeadStatus(selectedIds, status);
    setActionFeedback(`Updated ${selectedIds.length} leads to ${status}.`);
    setSelectedIds([]);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleBulkSchedule = (type: any) => {
    bulkScheduleFollowUps(selectedIds, type, "Batch follow-up scheduled from Leads directory.");
    setActionFeedback(`Scheduled ${type} tasks for ${selectedIds.length} leads.`);
    setSelectedIds([]);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} leads?`)) {
      bulkDeleteLeads(selectedIds);
      setActionFeedback(`Deleted ${selectedIds.length} leads.`);
      setSelectedIds([]);
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const handleExport = () => {
    const dataToExport = selectedIds.length > 0 
      ? leads.filter(l => selectedIds.includes(l.id))
      : filteredLeads;
    
    if (dataToExport.length === 0) {
      setActionFeedback("No leads to export.");
      setTimeout(() => setActionFeedback(null), 3000);
      return;
    }
    
    const exportData = dataToExport.map(l => ({
      Name: l.name,
      Email: l.email,
      Phone: l.phone,
      Company: l.company || 'N/A',
      Industry: l.industry,
      Source: l.source,
      Status: l.status,
      Budget: l.budgetRange,
      QualificationScore: l.qualificationScore,
      Verdict: l.aiSummary,
      CreatedAt: l.createdAt
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const filename = selectedIds.length > 0 
      ? `selected_leads_${format(new Date(), 'yyyy-MM-dd')}.csv`
      : `all_leads_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setActionFeedback(`Exported ${dataToExport.length} leads to CSV.`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const statuses: ('All' | LeadStatus)[] = ['All', 'New', 'Contacted', 'Qualified', 'Converted', 'Lost'];

  const handleDeleteLead = (id: string) => {
    deleteLead(id);
    setActionFeedback(`Lead removed.`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 min-h-full bg-navy-950 text-white custom-scrollbar overflow-x-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">Leads Directory</h1>
          <p className="text-white/40 mt-1 font-bold text-xs sm:text-sm">Full database of prospects and active clients.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 custom-scrollbar">
          {isProcessing && (
            <div className="flex items-center gap-2 px-3 py-1 bg-coral-500/10 border border-coral-500/20 rounded-lg animate-pulse whitespace-nowrap">
               <Sparkles className="w-3 h-3 text-coral-500 animate-spin" />
               <span className="text-[10px] font-black uppercase text-coral-500 tracking-widest">AI Syncing...</span>
            </div>
          )}
          <button 
            onClick={handleDedupe}
            className="flex-none p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:border-coral-500/50 transition-all flex items-center justify-center gap-2"
            title="Remove Duplicates"
          >
            <Sparkles className="w-4 h-4 text-coral-500" />
            <span className="hidden sm:inline text-[8px] font-black uppercase tracking-widest text-white/40">Dedupe</span>
          </button>
          <button 
            onClick={handleSeed}
            disabled={isSeeding}
            className={cn(
              "flex-none p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 transition-all flex items-center justify-center gap-2",
              isSeeding ? "opacity-50 cursor-not-allowed" : "hover:bg-green-500 hover:text-white"
            )}
            title="Load 5 High-Intent Test Leads"
          >
            <Sparkles className={cn("w-4 h-4", isSeeding && "animate-spin")} />
            <span className="hidden sm:inline text-[8px] font-black uppercase tracking-widest">Seed</span>
          </button>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex-none p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:border-coral-500/50 transition-all flex items-center justify-center gap-2"
            title="Bulk Import CSV"
          >
            <Upload className="w-4 h-4 text-coral-500" />
            <span className="hidden sm:inline text-[8px] font-black uppercase tracking-widest text-white/40">Import</span>
          </button>
          <button 
            onClick={handleExport}
            className="flex-none px-4 py-2.5 bg-navy-900 border border-coral-500/30 rounded-xl text-coral-500 hover:bg-coral-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-coral-500/10"
            title="Export Current Filtered Leads"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">Export CSV</span>
          </button>
          <div className="h-6 w-[1px] bg-white/10 mx-1 hidden sm:block" />
          <button 
            onClick={onAddLead}
            className="flex-1 sm:flex-none bg-coral-500 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-coral-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      <AnimatePresence>
        {actionFeedback && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-coral-500/10 border border-coral-500/20 rounded-xl p-3 flex items-center justify-between"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-coral-500">{actionFeedback}</span>
            <button onClick={() => setActionFeedback(null)}><X className="w-3 h-3 text-coral-500" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {isQuotaReached && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-coral-500/10 border border-coral-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-coral-500/20 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Sparkles className="w-5 h-5 text-coral-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-coral-500 uppercase tracking-wider">AI Quota Status: Reached</h3>
              <p className="text-xs text-white/60">Using local Heuristic Engine. Add Your API Key in Settings to restore full Gemini AI power.</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-center sm:items-end gap-1">
            <span className="text-[10px] text-white/30 uppercase font-black tracking-widest leading-none">Status: Running in Fallback</span>
            <span className="text-[10px] text-coral-500 font-bold underline cursor-help" title="The free tier has a daily request limit.">Why this happens?</span>
          </div>
        </motion.div>
      )}

      <div className="bg-navy-900 rounded-[2rem] sm:rounded-[3rem] border border-white/5 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/5 bg-white/5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text" 
              placeholder="FILTER LEADS..." 
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-coral-500/20 transition-all placeholder:text-white/20"
            />
          </div>
          <div className="flex flex-col gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/20 mr-2 shrink-0">Status:</span>
              {statuses.map(t => (
                <button 
                  key={t} 
                  onClick={() => setStatusFilter(t)}
                  className={cn(
                    "px-4 sm:px-5 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border border-transparent",
                    statusFilter === t ? "bg-coral-500 text-white" : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/20 mr-2 shrink-0">AI Score:</span>
              {(['All', 'High', 'Medium', 'Low'] as const).map(f => (
                <button 
                  key={f} 
                  onClick={() => setScoreFilter(f)}
                  className={cn(
                    "px-4 sm:px-5 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border border-transparent",
                    scoreFilter === f 
                      ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" 
                      : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                  )}
                >
                  {f === 'All' ? 'All Scores' : 
                   f === 'High' ? '70-100 (High)' : 
                   f === 'Medium' ? '40-69 (Medium)' : 
                   '0-39 (Low)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar pb-4">
          <table className="w-full text-left min-w-[1100px] table-fixed">
            <thead>
              <tr className="border-b border-white/5 bg-navy-950/50">
                <th className="px-6 sm:px-8 font-black text-white/20 text-[9px] sm:text-[10px] uppercase tracking-widest py-4 sm:py-5 w-16">
                   <div className="flex items-center justify-center">
                     <input 
                       type="checkbox" 
                       checked={selectedIds.length === filteredLeads.length && filteredLeads.length > 0}
                       onChange={handleSelectAll}
                       className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-coral-500 focus:ring-0 transition-all cursor-pointer" 
                     />
                   </div>
                </th>
                <th className="px-6 sm:px-8 font-black text-white/20 text-[9px] sm:text-[10px] uppercase tracking-widest py-4 sm:py-5 w-[250px]">Lead Identity</th>
                <th className="px-6 sm:px-8 font-black text-white/20 text-[9px] sm:text-[10px] uppercase tracking-widest py-4 sm:py-5 w-[150px]">Context</th>
                <th className="px-6 sm:px-8 font-black text-white/20 text-[9px] sm:text-[10px] uppercase tracking-widest py-4 sm:py-5 w-[350px]">AI Verdict</th>
                <th className="px-6 sm:px-8 font-black text-white/20 text-[9px] sm:text-[10px] uppercase tracking-widest py-4 sm:py-5 w-[150px]">Score</th>
                <th className="px-6 sm:px-8 font-black text-white/20 text-[9px] sm:text-[10px] uppercase tracking-widest py-4 sm:py-5 hidden lg:table-cell w-[200px]">Recent Activity</th>
                <th className="px-6 sm:px-8 font-black text-white/20 text-[9px] sm:text-[10px] uppercase tracking-widest py-4 sm:py-5 hidden md:table-cell w-[120px]">Status</th>
                <th className="px-6 sm:px-8 font-black text-white/20 text-[9px] sm:text-[10px] uppercase tracking-widest py-4 sm:py-5 text-right w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-8 py-20 text-center">
                    <p className="text-white/20 font-black uppercase tracking-widest text-xs mb-4">No leads found matching current filters.</p>
                    {(globalSearchQuery || statusFilter !== 'All' || scoreFilter !== 'All') && (
                      <button 
                        onClick={() => { setGlobalSearchQuery(''); setStatusFilter('All'); setScoreFilter('All'); }}
                        className="text-coral-500 font-black uppercase tracking-widest text-[10px] border border-coral-500/20 px-4 py-2 rounded-lg hover:bg-coral-500 hover:text-white transition-all"
                      >
                        Clear all filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredLeads.map(lead => (
                  <tr 
                    key={lead.id} 
                    className={cn(
                      "group transition-colors cursor-pointer",
                      selectedIds.includes(lead.id) ? "bg-coral-500/5" : "hover:bg-white/[0.02]"
                    )}
                    onClick={() => setSelectedLeadId(lead.id)}
                  >
                    <td className="px-6 sm:px-8 py-4 sm:py-6" onClick={(e) => toggleSelect(e, lead.id)}>
                      <div className="flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(lead.id)}
                          readOnly
                          className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-coral-500 focus:ring-0 transition-all cursor-pointer" 
                        />
                      </div>
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6">
                      <div className="flex items-center gap-3 sm:gap-5">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-white/40 overflow-hidden shrink-0 group-hover:bg-coral-500/10 group-hover:border-coral-500/20 transition-all uppercase">
                           {lead.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs sm:text-sm font-black text-white tracking-tight truncate">{lead.name}</p>
                            <div className="shrink-0">{getSourceIcon(lead.source)}</div>
                            <div 
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border",
                                lead.status === 'New' ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
                                lead.status === 'Contacted' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" :
                                lead.status === 'Qualified' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                                lead.status === 'Converted' ? "bg-coral-500/10 border-coral-500/20 text-coral-500" :
                                "bg-red-500/10 border-red-500/20 text-red-500"
                              )}
                            >
                              {lead.status}
                            </div>
                          </div>
                          <p className="text-[8px] sm:text-[10px] text-white/40 font-bold uppercase tracking-widest truncate">{lead.company || 'Private Lead'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 sm:px-8 py-5 sm:py-6">
                      <div className="space-y-1">
                        <p className="text-[10px] sm:text-[11px] font-black text-white opacity-80 uppercase tracking-widest">{lead.source}</p>
                        <p className="text-[9px] sm:text-[10px] font-bold text-white/30 uppercase truncate">{lead.industry}</p>
                      </div>
                    </td>
                    <td className="px-6 sm:px-8 py-5 sm:py-6">
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] sm:text-xs font-medium text-white/60 leading-relaxed italic line-clamp-2">
                          {lead.aiSummary || (lead.qualificationScore > 0 ? 'Evaluating intent...' : 'Awaiting evaluation...')}
                        </p>
                        <button 
                          onClick={(e) => reprocessLead(e, lead.id)}
                          className="w-fit flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-coral-500/60 hover:text-coral-500 transition-colors mt-1"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          Refresh AI
                        </button>
                      </div>
                    </td>
                    <td className="px-6 sm:px-8 py-5 sm:py-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        {(() => {
                          const style = getScoreStyle(lead.qualificationScore || 0);
                          return (
                            <>
                              <div className={cn(
                                "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-lg transition-all",
                                style.dot,
                                lead.qualificationScore >= 85 && "scale-125"
                              )} />
                              <div>
                                <p className={cn("text-sm sm:text-base font-black leading-none", style.text)}>{lead.qualificationScore}%</p>
                                <p className={cn(
                                   "text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] mt-1 shrink-0",
                                   style.text
                                )}>
                                   {style.label}
                                </p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-6 sm:px-8 py-5 sm:py-6 hidden lg:table-cell">
                      {lead.comments && lead.comments.length > 0 ? (
                        <div className="bg-white/5 border border-white/5 rounded-xl p-2 max-w-[180px]">
                           <p className="text-[9px] text-white font-medium line-clamp-1 italic mb-1 uppercase tracking-tight">
                             "{lead.comments[lead.comments.length - 1].text}"
                           </p>
                           <p className="text-[7px] font-black text-coral-500/40 uppercase tracking-widest">
                             {format(new Date(lead.comments[lead.comments.length - 1].createdAt), 'MMM dd, HH:mm')}
                           </p>
                        </div>
                      ) : (
                        <div className="text-[9px] font-bold text-white/10 italic">No notes logged yet</div>
                      )}
                    </td>
                    <td className="px-6 sm:px-8 py-5 sm:py-6 hidden md:table-cell">
                      <div className={cn(
                        "inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                        lead.status === 'New' ? "bg-blue-500/10 text-blue-500" :
                        lead.status === 'Contacted' ? "bg-yellow-500/10 text-yellow-500" :
                        lead.status === 'Qualified' ? "bg-green-500/10 text-green-500" :
                        lead.status === 'Converted' ? "bg-coral-500/20 text-coral-500" :
                        "bg-red-500/10 text-red-500"
                      )}>
                        {lead.status}
                      </div>
                    </td>
                    <td className="px-6 sm:px-8 py-5 sm:py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedLeadId(lead.id); }}
                          className="p-2 text-coral-500/40 hover:text-coral-500 rounded-lg transition-colors"
                          title="View History & Add Note"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleWhatsApp(lead.phone, lead.name); }}
                          className="p-2 text-green-500/40 hover:text-green-500 rounded-lg transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEmail(lead.email, lead.name); }}
                          className="p-2 text-blue-500/40 hover:text-blue-500 rounded-lg transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); if (confirm('Are you sure you want to delete this lead?')) handleDeleteLead(lead.id); }}
                          className="p-2 text-red-500/40 hover:text-red-500 rounded-lg transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-2xl"
          >
            <div className="bg-navy-900 border border-coral-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-coral-500 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs">
                  {selectedIds.length}
                </div>
                <div>
                  <p className="text-white font-black uppercase tracking-widest text-[10px]">Leads Selected</p>
                  <button 
                    onClick={() => setSelectedIds([])}
                    className="text-coral-500 font-bold uppercase tracking-widest text-[8px] hover:underline"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-2">Status:</span>
                  {['New', 'Qualified', 'Lost'].map(s => (
                    <button 
                      key={s}
                      onClick={() => handleBulkStatusUpdate(s as LeadStatus)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-coral-500 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5">
                   <span className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-2">Task:</span>
                   <button 
                      onClick={() => handleBulkSchedule('WhatsApp')}
                      className="p-1.5 bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-all"
                   >
                     <MessageSquare className="w-3.5 h-3.5" />
                   </button>
                   <button 
                      onClick={() => handleBulkSchedule('Call')}
                      className="p-1.5 bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-all"
                   >
                     <Phone className="w-3.5 h-3.5" />
                   </button>
                </div>

                <button 
                  onClick={handleExport}
                  className="p-3 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-coral-500/50 rounded-xl transition-all"
                  title="Export Selected"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button 
                  onClick={handleBulkDelete}
                  className="p-3 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedLead && (
          <LeadModal 
            lead={selectedLead} 
            onClose={() => setSelectedLeadId(null)} 
            onUpdateStatus={updateLeadStatus}
            onDelete={handleDeleteLead}
            onAddComment={addLeadComment}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isImportModalOpen && (
          <CSVImportModal onClose={() => setIsImportModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Leads;
