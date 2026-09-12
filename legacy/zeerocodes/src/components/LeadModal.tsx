import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Lead, LeadStatus, LeadComment } from '../types';
import { Phone, Mail, MessageSquare, Trash2, Globe, Sparkles, X, ChevronDown, ChevronUp, RefreshCcw, LayoutDashboard, ArrowRight, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { useApp } from '../AppContext';
import { Link } from 'react-router-dom';

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

interface LeadModalProps {
  lead: Lead;
  onClose: () => void;
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onDelete: (id: string) => void;
  onAddComment: (id: string, text: string) => void;
}

const TimelineItem: React.FC<{ item: any }> = ({ item }) => (
  <div className={cn(
    "p-3 border rounded-2xl transition-all relative overflow-hidden group/item",
    item.bgColor,
    "border-white/5 hover:border-white/10"
  )}>
     <div className="flex justify-between items-start mb-1.5">
        <p className={cn(
          "text-[7px] font-black uppercase tracking-widest flex items-center gap-1.5",
          item.color
        )}>
           <item.icon className="w-2.5 h-2.5" />
           {item.type} • {format(new Date(item.date), 'MMM dd, HH:mm')}
        </p>
        <span className={cn(
          "text-[6px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-[0.2em] border",
          item.color,
          "bg-white/5 border-white/5"
        )}>
          {item.status}
        </span>
     </div>
     <h4 className="text-[9px] font-black text-white uppercase tracking-tight mb-1">{item.title}</h4>
     <p className={cn(
       "text-[10px] leading-relaxed whitespace-pre-wrap font-medium",
       item.status === 'Auto' ? "text-white/40 italic" : "text-white/70"
     )}>{item.text}</p>
  </div>
);

const LeadModal: React.FC<LeadModalProps> = ({ lead, onClose, onUpdateStatus, onDelete, onAddComment }) => {
  const { followUps } = useApp();
  const [comments, setComments] = useState<LeadComment[]>([]);
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'grouped' | 'raw'>('grouped');
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['activity', 'notes']);
  const score = lead.qualificationScore || 0;
  const style = getScoreStyle(score);

  const leadFollowUps = followUps.filter(f => f.leadId === lead.id);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  // Categorized events
  const categorizedEvents = {
    activity: leadFollowUps.map(f => ({
      id: f.id,
      type: f.type,
      title: `${f.type} Activity`,
      status: f.status,
      date: f.scheduledAt,
      text: f.outcome || f.notes || `Scheduled ${f.type} follow-up`,
      icon: f.status === 'Completed' ? CheckCircle2 : (f.type === 'Call' ? Phone : f.type === 'Email' ? Mail : MessageSquare),
      color: f.status === 'Completed' ? 'text-green-500' : f.status === 'Overdue' ? 'text-red-500' : f.status === 'Missed' ? 'text-orange-500' : 'text-yellow-500',
      bgColor: f.status === 'Completed' ? 'bg-green-500/5' : f.status === 'Overdue' ? 'bg-red-500/5' : 'bg-white/5'
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    
    notes: comments.filter(c => !c.text.includes('updated from') && !c.text.includes('status update')).map(c => ({
      id: c.id,
      type: 'Note',
      title: 'Author Note',
      status: 'User',
      date: c.createdAt,
      text: c.text,
      icon: MessageSquare,
      color: 'text-coral-500',
      bgColor: 'bg-navy-800/80'
    })),

    system: [
      {
        id: 'inquiry-' + lead.id,
        type: 'Inquiry',
        title: 'Lead Captured',
        status: 'Original',
        date: lead.createdAt,
        text: lead.notes || 'Inquiry received via ' + lead.source,
        icon: Globe,
        color: 'text-white/40',
        bgColor: 'bg-white/5'
      },
      ...comments.filter(c => c.text.includes('updated from') || c.text.includes('status update')).map(c => ({
        id: c.id,
        type: 'System',
        title: 'Status Changed',
        status: 'Auto',
        date: c.createdAt,
        text: c.text,
        icon: RefreshCcw,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/5'
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  };

  const totalEventCount = categorizedEvents.activity.length + categorizedEvents.notes.length + categorizedEvents.system.length;

  useEffect(() => {
    const commentsRef = collection(db, 'leads', lead.id, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text,
        createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      })) as LeadComment[];
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [lead.id]);

  const handleAddNote = async () => {
    const text = noteText.trim();
    if (!text || isSaving) return;

    setIsSaving(true);
    try {
      await onAddComment(lead.id, text);
      setNoteText('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-navy-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-navy-900 w-full max-w-xl rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-navy-800 h-16 sm:h-24 relative shrink-0">
          <div className="absolute top-2 left-4 sm:top-4 sm:left-6 flex items-center gap-2 z-[110]">
            <Link 
              to="/dashboard" 
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-navy-900/60 backdrop-blur-md border border-white/10 text-white/40 hover:text-white hover:bg-navy-900 transition-all flex items-center gap-2 group"
            >
              <LayoutDashboard className="w-3 h-3 group-hover:scale-110 transition-transform" />
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest leading-none">Dash</span>
            </Link>
            <Link 
              to="/" 
              className="px-3 py-1.5 rounded-xl bg-navy-900/60 backdrop-blur-md border border-white/10 text-white/40 hover:text-white hover:bg-navy-900 transition-all flex items-center gap-2 group"
            >
              <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest leading-none">Home</span>
            </Link>
          </div>
          <button 
            onClick={(e) => { 
              e.stopPropagation();
              if (window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
                onDelete(lead.id);
                onClose();
              }
            }}
            className="absolute top-4 right-4 p-2.5 bg-red-500 text-white hover:bg-red-600 rounded-full transition-all z-[110] shadow-lg shadow-red-500/20 flex items-center justify-center"
            title="Delete Lead"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="absolute -bottom-5 sm:-bottom-7 left-6 sm:left-8 flex items-end gap-3 sm:gap-5">
            <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-xl sm:rounded-2xl bg-navy-900 p-1 shadow-xl border border-white/5">
               <div className="w-full h-full rounded-lg sm:rounded-xl bg-coral-500 flex items-center justify-center text-white text-xl sm:text-2xl font-black">
                 {lead.name.charAt(0)}
               </div>
            </div>
            <div className="pb-1">
              <h2 className="text-lg sm:text-xl font-black uppercase text-white tracking-tighter leading-none">{lead.name}</h2>
              <p className="text-coral-500 font-black uppercase text-[9px] sm:text-[10px] tracking-widest mt-1">{lead.company}</p>
            </div>
          </div>
        </div>
        
        <div className="pt-8 sm:pt-10 p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3">
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <label className="text-[8px] font-black text-white/40 uppercase tracking-widest block mb-1">Pipeline Status</label>
                <select 
                  value={lead.status}
                  onChange={(e) => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-white focus:ring-1 focus:ring-coral-500/50 outline-none appearance-none cursor-pointer"
                >
                  {['New', 'Contacted', 'Qualified', 'Converted', 'Lost'].map(s => (
                    <option key={s} value={s} className="bg-navy-900">{s}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-2 px-1">Contact</label>
                <div className="space-y-1.5 px-1">
                  <div className="flex items-center gap-2.5 text-white/80">
                    <Phone className="w-3.5 h-3.5 text-coral-500 shrink-0" />
                    <span className="text-xs font-bold truncate">{lead.phone}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-white/80">
                    <Mail className="w-3.5 h-3.5 text-coral-500 shrink-0" />
                    <span className="text-xs font-bold truncate">{lead.email}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 p-3 sm:p-4 rounded-xl border border-white/10 flex flex-col min-h-[100px]">
               <div className="flex items-center justify-between mb-2">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">AI Analysis</label>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-lg font-black", style.text)}>{score}%</span>
                    <span className={cn("text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest border", style.text, style.bg, style.border)}>
                       {style.label}
                    </span>
                  </div>
               </div>
               <p className="text-[10px] text-white/80 leading-relaxed font-bold mb-2">
                 {lead.aiSummary || 'Evaluation based on industry, source and budget data.'}
               </p>
               {lead.qualificationReasoning && (
                 <div className="pt-2 border-t border-white/5">
                   <p className="text-[8px] text-white/30 leading-snug italic font-medium">
                     <span className="font-black text-white/50 not-italic mr-1">Deep Dive:</span>
                     {lead.qualificationReasoning}
                   </p>
                 </div>
               )}
            </div>
          </div>
          
          <div className="bg-coral-500/5 p-3 sm:p-4 rounded-xl border border-coral-500/20">
             <label className="text-[9px] font-black text-coral-500 uppercase tracking-widest flex items-center gap-2 mb-1.5">
                <Sparkles className="w-2.5 h-2.5" />
                Action
             </label>
             <p className="text-[10px] sm:text-[11px] text-white/80 leading-relaxed font-bold">
                {score >= 85 ? 'High intent. Direct call/WhatsApp within 5 mins.' :
                 score >= 70 ? 'Qualified. Send WhatsApp discovery message.' :
                 'Low priority. Add to monthly drip campaign.'}
             </p>
          </div>

          <div className="space-y-4">
             <div>
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex bg-navy-950/50 p-1 rounded-xl border border-white/5">
                    <button 
                      onClick={() => setActiveTab('grouped')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                        activeTab === 'grouped' ? "bg-coral-500 text-white shadow-lg shadow-coral-500/20" : "text-white/20 hover:text-white/40"
                      )}
                    >
                      Grouped
                    </button>
                    <button 
                      onClick={() => setActiveTab('raw')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                        activeTab === 'raw' ? "bg-coral-500 text-white shadow-lg shadow-coral-500/20" : "text-white/20 hover:text-white/40"
                      )}
                    >
                      Stream
                    </button>
                  </div>
                  <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">
                    Entries: {totalEventCount}
                  </div>
                </div>

                <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar px-1 pb-2">
                  {activeTab === 'grouped' ? (
                    <>
                      {/* Outreach & Activities */}
                      <div className="space-y-2">
                        <button 
                          onClick={() => toggleGroup('activity')}
                          className="w-full flex items-center justify-between py-2 px-1 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1 h-1 bg-green-500 rounded-full" />
                            Activity Log ({categorizedEvents.activity.length})
                          </span>
                          {expandedGroups.includes('activity') ? <ChevronUp className="w-3 h-3 text-white/20" /> : <ChevronDown className="w-3 h-3 text-white/20" />}
                        </button>
                        <AnimatePresence>
                          {expandedGroups.includes('activity') && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="space-y-2 pt-1 pb-2"
                            >
                              {categorizedEvents.activity.length > 0 ? categorizedEvents.activity.map(item => (
                                <TimelineItem key={item.id} item={item} />
                              )) : (
                                <p className="text-[9px] text-white/20 italic text-center py-2">No activity recorded yet</p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Internal Notes */}
                      <div className="space-y-2">
                        <button 
                          onClick={() => toggleGroup('notes')}
                          className="w-full flex items-center justify-between py-2 px-1 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1 h-1 bg-coral-500 rounded-full" />
                            Internal Notes ({categorizedEvents.notes.length})
                          </span>
                          {expandedGroups.includes('notes') ? <ChevronUp className="w-3 h-3 text-white/20" /> : <ChevronDown className="w-3 h-3 text-white/20" />}
                        </button>
                        <AnimatePresence>
                          {expandedGroups.includes('notes') && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="space-y-2 pt-1 pb-2"
                            >
                              {categorizedEvents.notes.length > 0 ? categorizedEvents.notes.map(item => (
                                <TimelineItem key={item.id} item={item} />
                              )) : (
                                <p className="text-[9px] text-white/20 italic text-center py-2">No internal notes for this lead</p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* System Activity */}
                      <div className="space-y-2">
                        <button 
                          onClick={() => toggleGroup('system')}
                          className="w-full flex items-center justify-between py-2 px-1 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1 h-1 bg-blue-500 rounded-full" />
                            System History ({categorizedEvents.system.length})
                          </span>
                          {expandedGroups.includes('system') ? <ChevronUp className="w-3 h-3 text-white/20" /> : <ChevronDown className="w-3 h-3 text-white/20" />}
                        </button>
                        <AnimatePresence>
                          {expandedGroups.includes('system') && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="space-y-2 pt-1 pb-2"
                            >
                              {categorizedEvents.system.map(item => (
                                <TimelineItem key={item.id} item={item} />
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      {[...categorizedEvents.activity, ...categorizedEvents.notes, ...categorizedEvents.system]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(item => (
                          <TimelineItem key={item.id} item={item} />
                        ))
                      }
                    </div>
                  )}
                </div>
             </div>

             <div className="relative">
                <textarea 
                  placeholder={isSaving ? "Saving..." : "Note (Enter to save)..."}
                  className="w-full bg-navy-950/50 border border-white/10 rounded-xl p-3 text-[9px] font-bold text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-coral-500/20 transition-all resize-none h-16 pb-8 disabled:opacity-50"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  disabled={isSaving}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                />
                <div className="absolute bottom-2 right-2.5 flex items-center gap-2">
                  <button 
                    onClick={handleAddNote}
                    disabled={isSaving || !noteText.trim()}
                    className="px-2 py-0.5 bg-coral-500 text-white text-[7px] font-black uppercase tracking-widest rounded-md hover:bg-coral-600 transition-all cursor-pointer shadow-lg shadow-coral-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Post'}
                  </button>
                </div>
             </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-navy-900 border-t border-white/10 flex flex-row gap-3 shrink-0">
           <button 
            onClick={() => handleWhatsApp(lead.phone, lead.name)}
            className="flex-1 bg-green-600 text-white font-black uppercase tracking-widest text-[9px] sm:text-[10px] py-3 rounded-lg sm:rounded-xl shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-2"
           >
             <MessageSquare className="w-3.5 h-3.5" />
             WhatsApp
           </button>
           <button 
            onClick={() => handleEmail(lead.email, lead.name)}
            className="flex-1 bg-coral-500 text-white font-black uppercase tracking-widest text-[9px] sm:text-[10px] py-3 rounded-lg sm:rounded-xl shadow-lg shadow-coral-500/20 hover:bg-coral-600 transition-all active:scale-95 flex items-center justify-center gap-2"
           >
             <Mail className="w-3.5 h-3.5" />
             Email
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LeadModal;
