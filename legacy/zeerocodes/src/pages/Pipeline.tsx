import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { LeadStatus, Lead } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import LeadModal from '../components/LeadModal';
import { Phone, MessageSquare, Plus, MoreVertical, Instagram, Facebook, Globe, Maximize2, ArrowLeft, Search, Filter, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const STAGES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];

interface SortableLeadCardProps {
  lead: Lead;
  isDetailed?: boolean;
  onView?: (lead: Lead) => void;
}

const getScoreColor = (score: number) => {
  if (score >= 85) return 'bg-purple-500';
  if (score >= 70) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  if (score >= 30) return 'bg-orange-500';
  return 'bg-red-500';
};

const SortableLeadCard: React.FC<SortableLeadCardProps> = ({ lead, isDetailed, onView }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: 'Lead',
      lead,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const score = lead.qualificationScore || 0;
  const scoreColor = getScoreColor(score);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-navy-800 rounded-2xl sm:rounded-3xl border border-white/5 shadow-sm hover:border-coral-500/30 transition-all group overflow-hidden relative shadow-inner-white/5 cursor-pointer",
        !isDetailed && "mb-3 sm:mb-4",
        isDragging && "z-50 shadow-2xl scale-105 border-coral-500/50"
      )}
      onClick={() => onView?.(lead)}
    >
      <div 
        {...attributes}
        {...listeners}
        className="p-4 sm:p-5 cursor-grab active:cursor-grabbing pb-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2 sm:mb-3 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/40">
          <div className="flex items-center gap-2 truncate mr-2">
            <span className="truncate">{lead.source}</span>
            <span className={cn("w-1.5 h-1.5 rounded-full", scoreColor)} />
            <span className="text-white/60">{score}%</span>
          </div>
          {lead.status === 'Qualified' && <span className="text-coral-500 italic shrink-0">Hot</span>}
        </div>
        
        <h4 className="text-xs sm:text-sm font-black text-white leading-tight mb-1 group-hover:text-coral-500 transition-colors truncate">{lead.name}</h4>
        <p className="text-[10px] sm:text-[11px] font-bold text-white/40 mb-2 truncate">{lead.industry}</p>
      </div>
      
      <div className="px-4 sm:p-5 pt-0">
        <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
          <div className="text-[9px] sm:text-[10px] font-black text-white/60 uppercase">{(lead.budgetRange || '').split(' ')[0] || 'TBD'}</div>
          <div className="flex items-center gap-2 relative z-20">
            <div 
              className="p-1.5 bg-white/5 group-hover:bg-coral-500 rounded-lg text-white/40 group-hover:text-white transition-all shadow-sm"
            >
              <Maximize2 className="w-3 h-3" />
            </div>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-navy-700 flex items-center justify-center text-[9px] sm:text-[10px] font-black text-white/40 shrink-0">
              {(lead.name || '?').charAt(0)}
            </div>
          </div>
        </div>
      </div>

      {/* Score Indicator Bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", scoreColor)} />

      {/* AI Summary Reveal on Hover - Refined for better visibility */}
      {lead.aiSummary && (
        <div className="absolute inset-x-0 h-full top-0 bg-navy-950/20 backdrop-blur-[1px] p-3 flex flex-col justify-start opacity-0 group-hover:opacity-100 transition-all pointer-events-none border-l-2 border-coral-500 z-10">
           <div className="bg-navy-900/95 border border-white/10 rounded-xl p-2.5 shadow-2xl translate-y-2 group-hover:translate-y-0 transition-transform">
            <p className="text-[8px] font-black text-coral-500 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> AI Insight
            </p>
            <p className="text-[9px] leading-relaxed text-white/90 font-medium line-clamp-3 italic">
              "{lead.aiSummary}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

interface KanbanLaneProps {
  stage: LeadStatus;
  children: React.ReactNode;
}

const KanbanLane: React.FC<KanbanLaneProps> = ({ stage, children }) => {
  const { setNodeRef } = useDroppable({
    id: stage,
  });

  return (
    <div 
      ref={setNodeRef}
      className="flex-1 bg-navy-900 rounded-[2rem] sm:rounded-[2.5rem] p-3 sm:p-4 border border-white/5 overflow-y-auto custom-scrollbar min-h-[150px]"
    >
      {children}
    </div>
  );
};

const Pipeline: React.FC = () => {
  const { leads, updateLeadStatus, globalSearchQuery, addLeadComment, deleteLead } = useApp();
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [selectedLeadModalId, setSelectedLeadModalId] = useState<string | null>(null);
  const selectedLeadModal = leads.find(l => l.id === selectedLeadModalId);
  const [focusedStage, setFocusedStage] = useState<LeadStatus | null>(null);
  const [listSearchQuery, setListSearchQuery] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const filteredLeads = leads.filter(lead => {
    const s = (focusedStage ? listSearchQuery : globalSearchQuery).toLowerCase();
    if (!s) return !focusedStage || lead.status === focusedStage;
    
    const matchesSearch = (
      lead.name.toLowerCase().includes(s) ||
      (lead.company || '').toLowerCase().includes(s) ||
      lead.industry.toLowerCase().includes(s) ||
      (lead.aiSummary || '').toLowerCase().includes(s)
    );

    return matchesSearch && (!focusedStage || lead.status === focusedStage);
  });

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Lead') {
      setActiveLead(event.active.data.current.lead);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveALead = active.data.current?.type === 'Lead';
    const isOverALead = over.data.current?.type === 'Lead';

    if (!isActiveALead) return;

    // Immobile logic: if dragging over a lead, check if it's in a different column
    if (isActiveALead && isOverALead) {
      const activeStatus = active.data.current?.lead.status;
      const overStatus = over.data.current?.lead.status;

      if (activeStatus !== overStatus) {
        updateLeadStatus(activeId as string, overStatus);
      }
    }

    // If dragging over a column
    const isOverAColumn = STAGES.includes(overId as LeadStatus);
    if (isActiveALead && isOverAColumn) {
      const activeStatus = active.data.current?.lead.status;
      const overStatus = overId as LeadStatus;

      if (activeStatus !== overStatus) {
        updateLeadStatus(activeId as string, overStatus);
      }
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveLead(null);
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  return (
    <div className="h-full bg-navy-950 flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {!focusedStage ? (
          <motion.div 
            key="kanban"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 overflow-x-auto p-4 sm:p-8 custom-scrollbar"
          >
            <DndContext
              sensors={sensors}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
            >
              <div className="flex gap-4 sm:gap-8 h-full pb-6 sm:pb-10 min-w-max">
                {STAGES.map(stage => {
                  const stageLeads = filteredLeads.filter(l => l.status === stage);
                  return (
                    <div key={stage} className="w-[280px] sm:w-80 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-4 sm:mb-6 px-2 sm:px-4 shrink-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <h3 
                            className="font-black text-white uppercase tracking-widest text-[10px] sm:text-xs opacity-40 cursor-pointer hover:opacity-100 transition-opacity flex items-center gap-2"
                            onClick={() => setFocusedStage(stage)}
                          >
                            {stage}
                            <Maximize2 className="w-3 h-3" />
                          </h3>
                          <span className="bg-coral-500 text-white text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                            {stageLeads.length}
                          </span>
                        </div>
                      </div>
                      
                      <SortableContext 
                        id={stage} 
                        items={stageLeads.map(l => l.id)} 
                        strategy={verticalListSortingStrategy}
                      >
                        <KanbanLane stage={stage}>
                          {stageLeads.map(lead => (
                            <SortableLeadCard 
                              key={lead.id} 
                              lead={lead} 
                              onView={(l) => setSelectedLeadModalId(l.id)} 
                            />
                          ))}
                          
                          {stageLeads.length === 0 && (
                            <div className="h-40 border-2 border-dashed border-white/5 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center px-6 sm:px-8 text-center pointer-events-none">
                              <p className="text-[9px] sm:text-[10px] text-white/20 font-black uppercase tracking-widest">Drop here</p>
                            </div>
                          )}
                        </KanbanLane>
                      </SortableContext>
                    </div>
                  );
                })}
              </div>

              <DragOverlay dropAnimation={dropAnimation}>
                {activeLead ? (
                  <div className="bg-navy-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-coral-500/50 shadow-2xl scale-105 flex flex-col w-[260px] sm:w-[300px] relative overflow-hidden">
                    {/* Score Indicator Bar */}
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1", getScoreColor(activeLead.qualificationScore || 0))} />

                    <div className="flex items-center justify-between mb-2 sm:mb-3 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/40">
                      <div className="flex items-center gap-2 truncate mr-2">
                        <span className="truncate">{activeLead.source}</span>
                        <span className={cn("w-1.5 h-1.5 rounded-full", getScoreColor(activeLead.qualificationScore || 0))} />
                        <span className="text-white/60">{activeLead.qualificationScore || 0}%</span>
                      </div>
                      {activeLead.status === 'Qualified' && <span className="text-coral-500 italic shrink-0">Hot</span>}
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-white leading-tight mb-1 truncate">{activeLead.name}</h4>
                    <p className="text-[10px] sm:text-[11px] font-bold text-white/40 mb-3 sm:mb-4 truncate">{activeLead.industry}</p>
                    
                    <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-white/5 mt-auto">
                      <div className="text-[9px] sm:text-[10px] font-black text-white/60 uppercase">{(activeLead.budgetRange || '').split(' ')[0] || 'TBD'}</div>
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-navy-700 flex items-center justify-center text-[9px] sm:text-[10px] font-black text-white/40 shrink-0">
                        {(activeLead.name || '?').charAt(0)}
                      </div>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col p-4 sm:p-8 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => { setFocusedStage(null); setListSearchQuery(''); }}
                  className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    {focusedStage} Leads
                    <span className="text-xs bg-coral-500 px-2 py-1 rounded-full font-black tracking-widest">{filteredLeads.length}</span>
                  </h2>
                  <p className="text-xs font-bold text-white/20 uppercase tracking-widest mt-1">Detailed focus view</p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-3 bg-navy-900 border border-white/10 rounded-2xl px-4 py-2 w-80">
                <Search className="w-4 h-4 text-white/20" />
                <input 
                  type="text" 
                  value={listSearchQuery}
                  onChange={(e) => setListSearchQuery(e.target.value)}
                  placeholder="Search leads in this stage..."
                  className="bg-transparent border-none text-xs font-bold text-white placeholder:text-white/10 focus:ring-0 w-full"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                {filteredLeads.map(lead => (
                  <SortableLeadCard 
                    key={lead.id} 
                    lead={lead} 
                    isDetailed 
                    onView={(l) => setSelectedLeadModalId(l.id)} 
                  />
                ))}

                {filteredLeads.length === 0 && (
                  <div className="col-span-full h-64 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                    <Filter className="w-8 h-8 text-white/10 mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-white/20">No leads found matching your criteria</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedLeadModal && (
          <LeadModal 
            lead={selectedLeadModal} 
            onClose={() => setSelectedLeadModalId(null)} 
            onUpdateStatus={updateLeadStatus}
            onDelete={deleteLead}
            onAddComment={addLeadComment}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Pipeline;
