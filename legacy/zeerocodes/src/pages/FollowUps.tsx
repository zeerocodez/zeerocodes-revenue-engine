import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Calendar, Clock, Phone, MessageSquare, AlertCircle, CheckCircle2, ChevronRight, Mail, Users, X, Search, LayoutList, Calendar as CalendarIcon, ChevronLeft, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { cn } from '../lib/utils';
import { FollowUpStatus, FollowUpType, FollowUp, Lead } from '../types';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import FollowUpDetailModal from '../components/FollowUpDetailModal';

const FollowUps: React.FC = () => {
  const { followUps, leads, globalSearchQuery, setGlobalSearchQuery, updateLeadStatus, updateFollowUpStatus, scheduleFollowUp, addLeadComment } = useApp();
  const navigate = useNavigate();
  const [statusTab, setStatusTab] = useState<FollowUpStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<FollowUpType | 'All'>('All');
  const [sortBy, setSortBy] = useState<'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarScale, setCalendarScale] = useState<'month' | 'week'>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedFollowUp, setSelectedFollowUp] = useState<{fu: FollowUp, lead: Lead} | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskDate, setNewTaskDate] = useState<Date | null>(null);

  const filteredFollowUps = followUps
    .filter(fu => {
      const lead = leads.find(l => l.id === fu.leadId);
      const matchesStatus = statusTab === 'All' || fu.status === statusTab;
      const matchesType = typeFilter === 'All' || fu.type === typeFilter;
      
      let matchesSearch = true;
      if (globalSearchQuery) {
        const q = globalSearchQuery.toLowerCase().trim();
        const keywords = q.split(/\s+/).filter(k => k.length > 0);
        
        const searchableText = [
          lead?.name,
          lead?.company,
          lead?.industry,
          fu.notes,
          fu.type
        ].filter(Boolean).join(' ').toLowerCase();

        matchesSearch = keywords.every(kw => searchableText.includes(kw));
      }

      return matchesStatus && matchesType && matchesSearch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.scheduledAt).getTime();
      const dateB = new Date(b.scheduledAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Overdue': return { color: 'text-red-600 bg-red-50 border-red-100', icon: AlertCircle };
      case 'Upcoming': return { color: 'text-blue-600 bg-blue-50 border-blue-100', icon: Clock };
      case 'Completed': return { color: 'text-green-600 bg-green-50 border-green-100', icon: CheckCircle2 };
      default: return { color: 'text-gray-600 bg-gray-50 border-gray-100', icon: Clock };
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 h-full overflow-y-auto bg-navy-950 text-white custom-scrollbar">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">Follow-up Tasks</h1>
          <p className="text-white/40 mt-1 font-bold text-xs sm:text-sm">Stay on top of your outreach and conversion cycle.</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="bg-navy-900 border border-white/5 p-1 rounded-2xl flex items-center shrink-0">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2.5 rounded-xl transition-all",
                viewMode === 'list' ? "bg-coral-500 text-white shadow-lg shadow-coral-500/20" : "text-white/40 hover:text-white"
              )}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={cn(
                "p-2.5 rounded-xl transition-all",
                viewMode === 'calendar' ? "bg-coral-500 text-white shadow-lg shadow-coral-500/20" : "text-white/40 hover:text-white"
              )}
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setIsNewTaskModalOpen(true)}
            className="flex-1 sm:flex-none bg-coral-500 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-lg shadow-coral-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Schedule Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        <div className="xl:col-span-3 space-y-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center w-full lg:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input 
                  type="text" 
                  placeholder="Search tasks..." 
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-coral-500/20 transition-all placeholder:text-white/20"
                />
              </div>
              <div className="bg-navy-900/50 border border-white/5 p-1 rounded-xl flex items-center shrink-0">
                <button 
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors flex items-center gap-2"
                >
                  Date {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {['All', 'Upcoming', 'Overdue', 'Completed'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setStatusTab(tab as any)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                    statusTab === tab ? "bg-coral-500 text-white border-coral-500 shadow-lg shadow-coral-500/20" : "bg-white/5 text-white/40 border-white/10 hover:text-white"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 p-1.5 bg-navy-900/50 rounded-xl w-fit border border-white/5">
              {['All', 'Call', 'WhatsApp', 'Email', 'Meeting'].map(type => {
                const Icon = type === 'Call' ? Phone : 
                             type === 'WhatsApp' ? MessageSquare : 
                             type === 'Email' ? Mail : 
                             type === 'Meeting' ? Users : 
                             CalendarIcon;
                
                return (
                  <button 
                    key={type} 
                    onClick={() => setTypeFilter(type as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border",
                      typeFilter === type 
                        ? "bg-coral-500 text-white border-coral-500 shadow-lg shadow-coral-500/20" 
                        : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {type}
                  </button>
                )
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'list' ?
              <motion.div 
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {filteredFollowUps.length === 0 ?
                  <div className="bg-navy-900 p-12 rounded-[2rem] border border-white/5 text-center">
                    <p className="text-white/20 font-black uppercase tracking-widest text-xs">No follow-up tasks found matching filters.</p>
                  </div>
                : filteredFollowUps.map(fu => {
                    const lead = leads.find(l => l.id === fu.leadId);
                    const { color, icon: Icon } = getStatusInfo(fu.status);
                    const score = lead?.qualificationScore || 0;
                    const isUnicorn = score >= 85;
                    const isQualified = score >= 70 && score < 85;
                    const isWarm = score >= 40 && score < 70;
                    const qualificationLabel = isUnicorn ? 'Unicorn' : isQualified ? 'Qualified' : isWarm ? 'Warm' : 'Cold';
                    const qualificationColor = isUnicorn ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 
                                             isQualified ? 'text-green-400 bg-green-500/10 border-green-500/20' : 
                                             isWarm ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                                             'text-blue-400 bg-blue-500/10 border-blue-500/20';

                    return (
                      <div key={fu.id} className="bg-navy-900 p-6 sm:p-8 rounded-[2rem] border border-white/5 shadow-sm group hover:border-coral-500/30 transition-all flex flex-col md:flex-row md:items-center gap-4 sm:gap-8">
                  <div className={cn("w-12 h-12 sm:w-16 sm:h-16 rounded-[1.2rem] sm:rounded-[1.5rem] border flex items-center justify-center shrink-0", color)}>
                     <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <h3 className="font-black text-white text-xl tracking-tight uppercase leading-none">{lead?.name || 'Unknown Lead'}</h3>
                          <div className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border", qualificationColor)}>
                            {qualificationLabel}
                          </div>
                        </div>
                        {lead?.company && (
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">
                            {lead.company}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end">
                           <span className="text-[10px] font-black text-white uppercase tracking-widest">{score}% Match</span>
                           <div className="w-16 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                              <div className={cn("h-full transition-all", isUnicorn ? 'bg-purple-500' : isQualified ? 'bg-green-500' : 'bg-yellow-500')} style={{ width: `${score}%` }} />
                           </div>
                        </div>
                        <div className={cn("px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shrink-0 ml-4", color)}>
                          {fu.status}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-3 h-3 text-coral-500" />
                          Required Action
                        </p>
                        <p className="text-sm font-bold text-white/80 leading-relaxed">
                          {fu.notes || `Perform ${fu.type} outreach. Check lead profile for more context.`}
                        </p>
                      </div>
                      
                      <div className="bg-navy-950/50 rounded-2xl p-4 border border-white/5 flex flex-col justify-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Lead Context</p>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-black text-white/60 uppercase tracking-widest">
                            <span className="text-coral-500">Industry:</span> {lead?.industry || 'N/A'}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black text-white/60 uppercase tracking-widest">
                            <span className="text-coral-500">Source:</span> {lead?.source || 'N/A'}
                          </div>
                          {lead?.phone && (
                            <div className="flex items-center gap-2 text-[10px] font-black text-white/60 uppercase tracking-widest">
                              <Phone className="w-3 h-3 text-white/20" /> {lead.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-white/[0.03]">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(fu.scheduledAt), 'EEEE, MMM d @ h:mm a')}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-widest">
                          {fu.type === 'Call' && <Phone className="w-3.5 h-3.5" />}
                          {fu.type === 'WhatsApp' && <MessageSquare className="w-3.5 h-3.5" />}
                          {fu.type === 'Email' && <Mail className="w-3.5 h-3.5" />}
                          {fu.type} Task
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <div className="flex items-center gap-2 mr-2 border-r border-white/5 pr-4">
                      <button 
                        onClick={() => handleWhatsApp(lead?.phone, lead?.name || '')}
                        className="p-3 bg-green-500/10 text-green-500 rounded-2xl hover:bg-green-500 hover:text-white transition-all active:scale-90"
                        title="WhatsApp Lead"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleEmail(lead?.email, lead?.name || '')}
                        className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl hover:bg-blue-500 hover:text-white transition-all active:scale-90"
                        title="Email Lead"
                      >
                        <Mail className="w-5 h-5" />
                      </button>
                    </div>
                    {fu.status !== 'Completed' && (
                      <button 
                        onClick={() => {
                          if (lead) {
                            setSelectedFollowUp({ fu, lead });
                          } else {
                            updateFollowUpStatus(fu.id, 'Completed');
                          }
                        }}
                        className="bg-green-500 text-white px-6 py-3 rounded-2xl hover:bg-green-600 shadow-lg shadow-green-500/20 active:scale-90 transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Complete
                      </button>
                    )}
                    <button 
                      onClick={() => navigate('/dashboard/pipeline')}
                      className="bg-white/10 text-white p-3 rounded-2xl hover:bg-white/20 transition-all"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )
            })}
            </motion.div>
          :
            <motion.div 
            key="calendar"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-navy-900 rounded-[2.5rem] border border-white/10 p-6 sm:p-10 shadow-2xl space-y-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white">
                      {calendarScale === 'month' ? format(currentMonth, 'MMMM') : `Week of ${format(startOfWeek(currentMonth), 'MMM d')}`} <span className="text-coral-500 italic">{format(currentMonth, 'yyyy')}</span>
                    </h2>
                    <div className="flex items-center gap-2 bg-navy-950 border border-white/5 p-1 rounded-xl">
                      <button 
                        onClick={() => setCurrentMonth(prev => calendarScale === 'month' ? subMonths(prev, 1) : new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000))}
                        className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setCurrentMonth(new Date())}
                        className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white"
                      >
                        Today
                      </button>
                      <button 
                        onClick={() => setCurrentMonth(prev => calendarScale === 'month' ? addMonths(prev, 1) : new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000))}
                        className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                    <button 
                      onClick={() => setCalendarScale('month')}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                        calendarScale === 'month' ? "bg-coral-500 text-white shadow-lg shadow-coral-500/20" : "text-white/40 hover:text-white"
                      )}
                    >
                      Month
                    </button>
                    <button 
                      onClick={() => setCalendarScale('week')}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                        calendarScale === 'week' ? "bg-coral-500 text-white shadow-lg shadow-coral-500/20" : "text-white/40 hover:text-white"
                      )}
                    >
                      Week
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 sm:gap-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-[9px] font-black uppercase tracking-widest text-white/20 pb-2">{day}</div>
                  ))}
                  
                  {(() => {
                    let days: Date[] = [];
                    if (calendarScale === 'month') {
                      const monthStart = startOfMonth(currentMonth);
                      const monthEnd = endOfMonth(monthStart);
                      const startDate = startOfWeek(monthStart);
                      const endDate = endOfWeek(monthEnd);
                      days = eachDayOfInterval({ start: startDate, end: endDate });
                    } else {
                      const weekStart = startOfWeek(currentMonth);
                      const weekEnd = endOfWeek(weekStart);
                      days = eachDayOfInterval({ start: weekStart, end: weekEnd });
                    }

                    return days.map((day, idx) => {
                      const dayTasks = followUps.filter(f => isSameDay(new Date(f.scheduledAt), day));
                      const isCurrentMonth = calendarScale === 'week' || isSameMonth(day, startOfMonth(currentMonth));
                      const isToday = isSameDay(day, new Date());

                      return (
                        <div 
                          key={idx} 
                          className={cn(
                            "min-h-[100px] sm:min-h-[140px] p-2 sm:p-4 rounded-3xl border transition-all flex flex-col gap-2 group/day relative",
                            calendarScale === 'week' ? "min-h-[300px]" : "",
                            isCurrentMonth ? "bg-navy-950/30 border-white/5" : "bg-transparent border-transparent opacity-20",
                            isToday && "ring-2 ring-coral-500/50 bg-coral-500/5",
                            isCurrentMonth && "hover:border-white/20 hover:bg-navy-800"
                          )}
                        >
                          <div className="flex justify-between items-center px-1">
                            <span className={cn(
                              "text-xs font-black",
                              isToday ? "text-coral-500" : isCurrentMonth ? "text-white/60" : "text-white/10"
                            )}>
                              {format(day, 'd')}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {dayTasks.length > 0 && isCurrentMonth && (
                                <span className="text-[8px] font-black uppercase text-coral-500/60">{dayTasks.length} Task{dayTasks.length > 1 ? 's' : ''}</span>
                              )}
                              {isCurrentMonth && (
                                <button 
                                  onClick={() => {
                                    setNewTaskDate(day);
                                    setIsNewTaskModalOpen(true);
                                  }}
                                  className="opacity-0 group-hover/day:opacity-100 p-1 hover:bg-coral-500/20 text-coral-500 rounded-lg transition-all"
                                  title="Schedule task for this day"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5 flex-1 overflow-hidden">
                            {dayTasks.slice(0, 3).map(task => {
                              const lead = leads.find(l => l.id === task.leadId);
                              const Icon = task.type === 'Call' ? Phone : 
                                           task.type === 'WhatsApp' ? MessageSquare : 
                                           task.type === 'Email' ? Mail : 
                                           task.type === 'Meeting' ? Users : 
                                           CalendarIcon;
                              
                              return (
                                <button 
                                  key={task.id}
                                  onClick={() => lead && setSelectedFollowUp({ fu: task, lead })}
                                  className={cn(
                                    "w-full text-left p-1.5 rounded-lg border flex items-center gap-1.5 transition-all group",
                                    task.status === 'Completed' 
                                      ? "bg-green-500/5 border-green-500/10 text-green-500/50" 
                                      : task.status === 'Overdue'
                                        ? "bg-red-500/5 border-red-500/10 text-red-400"
                                        : "bg-coral-500/5 border-coral-500/10 text-coral-500"
                                  )}
                                >
                                  <Icon className="w-2.5 h-2.5 shrink-0" />
                                  <span className="text-[8px] font-black uppercase tracking-tight truncate leading-none">
                                    {lead?.name.split(' ')[0] || 'Unknown'}
                                  </span>
                                </button>
                              );
                            })}
                            {dayTasks.length > 3 && (
                                <div className="text-[7px] font-black text-center text-white/20 uppercase tracking-widest pt-1">
                                    +{dayTasks.length - 3} More
                                </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>

        <div className="space-y-8">
          <div className="bg-coral-500 p-10 rounded-[3rem] text-white shadow-2xl shadow-coral-500/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/30 transition-all" />
            <h3 className="text-xl font-black uppercase mb-6 tracking-tight">Conversion Tip</h3>
            <p className="text-white/80 text-sm leading-relaxed mb-8 font-medium">
              Leads contacted within 5 minutes of inquiry are 9x more likely to convert. AI is handling the first touch, but follow up now!
            </p>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
               <div className="h-full bg-white w-2/3" />
            </div>
            <p className="text-[10px] mt-4 font-black uppercase tracking-widest text-white/40">Daily Goal: 67% Reach</p>
          </div>

          <div className="bg-navy-900 p-10 rounded-[3rem] border border-white/5 text-white">
            <h3 className="text-lg font-black uppercase mb-8 tracking-widest">Filters</h3>
            <div className="space-y-6">
               {[
                 { name: 'Priority Calls', type: 'Call', status: 'Overdue', count: followUps.filter(f => f.type === 'Call' && f.status === 'Overdue').length, color: 'bg-red-500' },
                 { name: 'WhatsApp Demos', type: 'WhatsApp', status: 'All', count: followUps.filter(f => f.type === 'WhatsApp').length, color: 'bg-green-500' },
                 { name: 'Email Proposals', type: 'Email', status: 'All', count: followUps.filter(f => f.type === 'Email').length, color: 'bg-blue-500' }
               ].map(f => (
                 <button 
                  key={f.name} 
                  onClick={() => {
                    setTypeFilter(f.type as any);
                    if (f.status !== 'All') setStatusTab(f.status as any);
                  }}
                  className="flex items-center justify-between group cursor-pointer w-full"
                 >
                   <div className="flex items-center gap-4">
                     <div className={cn("w-2.5 h-2.5 rounded-full", f.color, "shadow-[0_0_10px_rgba(255,255,255,0.1)]")} />
                     <span className={cn(
                       "text-[11px] font-black uppercase tracking-widest transition-colors",
                       typeFilter === f.type ? "text-coral-500" : "text-white/40 group-hover:text-white"
                     )}>{f.name}</span>
                   </div>
                   <span className="text-[10px] font-black bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-white/40 group-hover:text-coral-500">{f.count}</span>
                 </button>
               ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isNewTaskModalOpen && (
          <NewTaskModal 
            onClose={() => {
              setIsNewTaskModalOpen(false);
              setNewTaskDate(null);
            }} 
            leads={leads} 
            onSchedule={scheduleFollowUp}
            defaultDate={newTaskDate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedFollowUp && (
          <FollowUpDetailModal 
            followUp={selectedFollowUp.fu}
            lead={selectedFollowUp.lead}
            onClose={() => setSelectedFollowUp(null)}
            onComplete={(id, leadId, note) => {
              updateFollowUpStatus(id, 'Completed');
              updateLeadStatus(leadId, 'Contacted');
              if (note) {
                addLeadComment(leadId, `Follow-up Outcome: ${note}`);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const NewTaskModal = ({ onClose, leads, onSchedule, defaultDate }: { onClose: () => void, leads: any[], onSchedule: (task: any) => void, defaultDate?: Date | null }) => {
  const [formData, setFormData] = useState({
    leadId: leads[0]?.id || '',
    type: 'Call' as FollowUpType,
    scheduledAt: defaultDate 
      ? format(new Date(defaultDate.getFullYear(), defaultDate.getMonth(), defaultDate.getDate(), 10, 0), "yyyy-MM-dd'T'HH:mm")
      : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leadId) return;
    onSchedule({
      ...formData,
      status: 'Upcoming' as FollowUpStatus,
      priority: 'High'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-navy-950/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-navy-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 sm:top-10 right-6 sm:right-10 text-white/40 hover:text-white z-10">
          <X className="w-5 h-5 sm:w-6 h-6" />
        </button>

        <div className="mb-8 shrink-0">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Schedule <span className="italic text-coral-500">Task</span></h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Set up a new outreach reminder</p>
        </div>

        <form className="space-y-6 overflow-y-auto pr-2 custom-scrollbar" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-4">Select Lead</label>
            <select 
              value={formData.leadId}
              onChange={e => setFormData({ ...formData, leadId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-coral-500/20 transition-all appearance-none"
            >
              <option value="" disabled className="bg-navy-900">Select a lead...</option>
              {leads.map(l => (
                <option key={l.id} value={l.id} className="bg-navy-900">{l.name} {l.company ? `(${l.company})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-4">Task Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as FollowUpType })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-coral-500/20 transition-all appearance-none"
              >
                <option value="Call" className="bg-navy-900">Call</option>
                <option value="WhatsApp" className="bg-navy-900">WhatsApp</option>
                <option value="Email" className="bg-navy-900">Email</option>
                <option value="Meeting" className="bg-navy-900">Meeting</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-4">Priority</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-coral-500/20 transition-all appearance-none">
                <option value="High" className="bg-navy-900 text-red-500">High</option>
                <option value="Medium" className="bg-navy-900 text-yellow-500">Medium</option>
                <option value="Low" className="bg-navy-900 text-blue-500">Low</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-4">Schedule Date & Time</label>
            <input 
              type="datetime-local" 
              value={formData.scheduledAt}
              onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-coral-500/20 transition-all" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-4">Task Notes</label>
            <textarea 
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="E.g. Follow up on the proposal sent yesterday..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-coral-500/20 transition-all h-24 resize-none"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-5 bg-coral-500 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-coral-500/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
          >
            Deploy Schedule
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default FollowUps;
