import React from 'react';
import { useApp } from '../AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const AIStatusCard: React.FC = () => {
  const { isProcessing, processedCount, totalToProcess, isQuotaReached } = useApp();

  const progress = totalToProcess > 0 ? (processedCount / totalToProcess) * 100 : 0;

  return (
    <div className="bg-navy-900 rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-coral-500/5 blur-[100px] rounded-full group-hover:bg-coral-500/10 transition-colors duration-700" />
      
      <div className="relative flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-lg",
              isProcessing ? "bg-coral-500/20 text-coral-500" : "bg-white/5 text-white/40"
            )}>
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : isQuotaReached ? (
                <AlertCircle className="w-6 h-6 text-coral-500" />
              ) : (
                <Sparkles className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">AI Agent Status</h3>
              <p className="text-xs font-medium text-white/40 uppercase tracking-widest">
                {isProcessing ? 'Actively Processing' : isQuotaReached ? 'Quota Reached (Heuristic)' : 'Standing By'}
              </p>
            </div>
          </div>

          <AnimatePresence>
            {isProcessing && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="px-3 py-1 rounded-full bg-coral-500/10 border border-coral-500/20"
              >
                <span className="text-[10px] font-black text-coral-500 uppercase tracking-tighter animate-pulse">
                  Live Agent
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isProcessing ? (
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-white tabular-nums">
                {processedCount} <span className="text-sm font-medium text-white/20">/ {totalToProcess}</span>
              </span>
              <span className="text-sm font-bold text-coral-500">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-coral-500 shadow-[0_0_20px_rgba(255,107,107,0.4)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
              />
            </div>
            <p className="text-[10px] text-white/40 font-medium italic">
              AI is currently evaluating lead intent and applying qualification scores...
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
            {isQuotaReached ? (
              <>
                <AlertCircle className="w-5 h-5 text-coral-500 shrink-0" />
                <p className="text-xs text-white/60 leading-tight">
                  <span className="font-bold text-coral-500 uppercase block mb-0.5">Note:</span>
                  Daily Gemini API quota exceeded. Agent is using local heuristics for all evaluations.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-xs text-white/60 leading-tight">
                  Database is clean and all leads have been evaluated with maximum precision.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIStatusCard;
