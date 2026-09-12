import React from 'react';
import { useApp } from '../AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Wifi, 
  WifiOff, 
  MessageSquare, 
  Instagram, 
  Facebook, 
  Globe, 
  UserPlus,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { LeadSource } from '../types';

const SourceIcon = ({ source, className }: { source: LeadSource; className?: string }) => {
  switch (source) {
    case 'WhatsApp': return <MessageSquare className={className} />;
    case 'Instagram': return <Instagram className={className} />;
    case 'Facebook': return <Facebook className={className} />;
    case 'Website': return <Globe className={className} />;
    default: return <UserPlus className={className} />;
  }
};

const LeadSimulationPanel: React.FC = () => {
  const { isSimulating, setSimulationActive, leads } = useApp();

  const recentLiveLeads = leads.slice(0, 5);

  return (
    <div className="bg-navy-900 rounded-[2rem] p-6 border border-white/5 relative overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight">Real-Time Funnel</h3>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
            {isSimulating ? (
              <>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live Ingestion Active
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                Connection Paused
              </>
            )}
          </p>
        </div>
        
        <button 
          onClick={() => setSimulationActive(!isSimulating)}
          className={cn(
            "p-2.5 rounded-xl transition-all shadow-lg",
            isSimulating ? "bg-coral-500 text-white shadow-coral-500/20" : "bg-white/5 text-white/40 border border-white/10"
          )}
        >
          {isSimulating ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 space-y-4">
        <AnimatePresence mode="popLayout">
          {recentLiveLeads.length > 0 ? (
            recentLiveLeads.map((lead, index) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3 bg-white/5 border border-white/5 rounded-2xl relative group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-navy-800 border border-white/10 flex items-center justify-center text-coral-500 shrink-0">
                      <SourceIcon source={lead.source} className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-black text-white truncate">{lead.name}</p>
                      <p className="text-[9px] font-bold text-white/30 truncate uppercase">{lead.source} • {lead.industry}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={cn(
                      "text-[9px] font-black tabular-nums px-2 py-0.5 rounded-md",
                      lead.qualificationScore >= 70 ? "bg-green-500/10 text-green-500" :
                      lead.qualificationScore >= 40 ? "bg-amber-500/10 text-amber-500" :
                      "bg-coral-500/10 text-coral-500"
                    )}>
                      {lead.qualificationScore}%
                    </div>
                  </div>
                </div>

                {/* Processing Indicator */}
                {lead.qualificationScore === 0 && (
                  <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center gap-2 border border-coral-500/50">
                    <Zap className="w-3 h-3 text-coral-500 animate-pulse" />
                    <span className="text-[9px] font-black text-coral-500 uppercase tracking-widest">Qualifying...</span>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-10 opacity-20">
              <Zap className="w-10 h-10 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest">No Recent Activity</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
          <span>Active Streams</span>
          <span className="text-white/20">4 Live</span>
        </div>
        <div className="flex gap-2 mt-3">
          {['WhatsApp', 'Instagram', 'Facebook', 'Website'].map((s) => (
             <div key={s} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 hover:text-coral-500 transition-colors cursor-help" title={`${s} Stream Active`}>
                <SourceIcon source={s as LeadSource} className="w-4 h-4" />
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeadSimulationPanel;
