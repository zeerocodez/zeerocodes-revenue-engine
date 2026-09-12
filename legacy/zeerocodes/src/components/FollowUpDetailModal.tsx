import React from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { CheckCircle2, Clock, Calendar, FileText, X as XIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const X = ({ className }: { className?: string }) => (
  <XIcon className={className} />
);

interface FollowUpDetailModalProps {
  followUp: any;
  lead: any;
  onClose: () => void;
  onComplete: (id: string, leadId: string, note?: string) => void;
}

const FollowUpDetailModal: React.FC<FollowUpDetailModalProps> = ({ followUp, lead, onClose, onComplete }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-navy-950/80 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-navy-900 border border-white/10 w-full max-w-xl rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 sm:top-10 right-6 sm:right-10 text-white/40 hover:text-white transition-colors z-10">
          <X className="w-5 h-5 sm:w-6 h-6" />
        </button>

        <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-white",
                followUp.status === 'Completed' ? "bg-green-500" : "bg-coral-500"
              )}>
                {followUp.status === 'Completed' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Task <span className="italic text-coral-500">Details</span></h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                    followUp.status === 'Completed' ? "bg-green-500/10 text-green-500" : "bg-coral-500/10 text-coral-500"
                  )}>
                    {followUp.status}
                  </span>
                  <span className="text-[10px] text-white/20 font-black tracking-widest">•</span>
                  <span className="text-[10px] text-white/40 font-black tracking-widest uppercase">{followUp.type}</span>
                </div>
              </div>
            </div>
  
            <div className="space-y-6">
              <div className="bg-white/2 border border-white/5 rounded-2xl p-6 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/leads?id=${lead?.id}`)}>
                <div className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Lead Information</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-coral-500/10 flex items-center justify-center font-black text-coral-500 text-xs uppercase">
                    {lead?.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-black text-white uppercase tracking-tight">{lead?.name}</div>
                    <div className="text-[10px] font-bold text-white/40">{lead?.company || 'No Company'} • {lead?.industry}</div>
                  </div>
                </div>
              </div>
  
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <div className="flex items-center gap-2 text-white/40">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Scheduled For</span>
                  </div>
                  <div className="text-xs font-bold text-white uppercase tracking-tight">
                    {format(new Date(followUp.scheduledAt), 'PPPP')}
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <div className="flex items-center gap-2 text-white/40">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Target Time</span>
                  </div>
                  <div className="text-xs font-bold text-white uppercase tracking-tight">
                    {format(new Date(followUp.scheduledAt), 'h:mm a')}
                  </div>
                </div>
              </div>
  
              <div className="bg-white/2 border border-white/5 rounded-2xl p-6">
                <div className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-3 flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Task Notes
                </div>
                <p className="text-white/60 text-sm font-bold leading-relaxed italic">
                  {followUp.notes || "No additional notes provided for this follow-up task."}
                </p>
              </div>
  
              {lead?.comments && lead.comments.length > 0 && (
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block px-1">Recent Interactions</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                    {lead.comments.slice(-3).reverse().map((comment: any) => (
                      <div key={comment.id} className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[8px] font-black text-coral-500/60 uppercase tracking-widest mb-1 flex justify-between">
                          <span>User Note</span>
                          <span>{format(new Date(comment.createdAt), 'MMM dd, HH:mm')}</span>
                        </p>
                        <p className="text-[10px] text-white/70 font-medium">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
  
              {followUp.status !== 'Completed' && (
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block px-1">Log Interaction</label>
                  <textarea 
                      id="interaction-note"
                      placeholder="What was the result? (e.g., 'Spoke with lead')"
                      className="w-full bg-navy-950/50 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-coral-500/20 transition-all resize-none h-24"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          {followUp.status !== 'Completed' && (
            <button 
              onClick={() => {
                const note = (document.getElementById('interaction-note') as HTMLTextAreaElement)?.value.trim();
                onComplete(followUp.id, lead?.id, note);
                onClose();
              }}
              className="flex-1 py-5 bg-green-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-green-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              Mark Complete
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FollowUpDetailModal;
