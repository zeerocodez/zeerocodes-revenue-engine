import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../AppContext';
import { Save, Sparkles, ShieldCheck, Target, ListChecks, ArrowLeft, Info, TrendingUp, CheckCircle2, XCircle, AlertTriangle, Globe, Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FollowUpType } from '../types';

const QualificationSettings: React.FC = () => {
  const { 
    qualificationRules, 
    setQualificationRules, 
    reprocessLeads, 
    isProcessing,
    followUpIntervals,
    setFollowUpIntervals
  } = useApp();
  const [localRules, setLocalRules] = useState(qualificationRules);
  const [localIntervals, setLocalIntervals] = useState(followUpIntervals);
  const [internalDeploying, setInternalDeploying] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const handleSaveAndDeploy = async () => {
    setInternalDeploying(true);
    setProgressMsg('Saving patterns...');
    setErrorMsg('');
    setQualificationRules(localRules);
    setFollowUpIntervals(localIntervals);
    
    // Smooth delay for UX and to ensure state is settled
    await new Promise(r => setTimeout(r, 800));
    
    try {
      setProgressMsg('Re-qualifying leads with new logic...');
      await reprocessLeads(localRules);
      
      setProgressMsg('Success! Logic deployed.');
      setTimeout(() => {
        setInternalDeploying(false);
        setProgressMsg('');
      }, 2000);
    } catch (err: any) {
      console.error("Deploy failed:", err);
      setErrorMsg(err.message || "Logic saved, but AI re-qualification failed.");
      setInternalDeploying(false);
      setProgressMsg('');
    }
  };

  const addInterval = () => {
    setLocalIntervals([...localIntervals, { minScore: 0, maxScore: 39, days: 14, type: 'Email' }]);
  };

  const removeInterval = (index: number) => {
    setLocalIntervals(localIntervals.filter((_, i) => i !== index));
  };

  const updateInterval = (index: number, field: string, value: any) => {
    const newIntervals = [...localIntervals];
    newIntervals[index] = { ...newIntervals[index], [field]: value };
    setLocalIntervals(newIntervals);
  };

  const isActuallyProcessing = isProcessing || internalDeploying;

  return (
    <div className="p-4 sm:p-10 max-w-5xl mx-auto space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
             <Link to="/leads" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
               <ArrowLeft className="w-4 h-4 text-white/40" />
             </Link>
             <h1 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tighter leading-none">
               Qualify <span className="italic text-coral-500">Logic</span>
             </h1>
          </div>
          <p className="text-white/40 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] max-w-md leading-relaxed">
            Configure the AI Brain. Tell the agent exactly which prospects are "Gold Standard" and which should be filtered out.
          </p>
        </div>

        <button 
          onClick={handleSaveAndDeploy}
          disabled={isActuallyProcessing}
          className="flex items-center justify-center gap-3 bg-coral-500 text-white font-black py-4 px-10 rounded-2xl shadow-2xl shadow-coral-500/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:hover:scale-100"
        >
          {isActuallyProcessing ? (
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>{isProcessing ? 'Re-Qualifying...' : 'Deploying...'}</span>
            </div>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save & Deploy Logic</span>
            </>
          )}
        </button>
      </div>

      {isActuallyProcessing && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-coral-500/10 border border-coral-500/20 rounded-xl p-4 flex items-center gap-3"
        >
          <div className="w-2 h-2 bg-coral-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-coral-500">{progressMsg || 'Syncing with AI Agent...'}</span>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-4"
        >
          <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Deployment Error</p>
            <p className="text-xs font-bold text-white/60 leading-relaxed">{errorMsg}</p>
          </div>
          <button 
            onClick={() => setErrorMsg('')}
            className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
        <div className="lg:col-span-2 space-y-8 sm:space-y-10">
          {/* Profiles / Templates */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {[
              { name: 'SaaS / Tech', icon: Sparkles, rules: "1. High budget prospects (₦1M+) are prioritized.\n2. Prospects with clear business intent (mentions growth, expansion, or specific tools).\n3. Valid contact info (whatsapp preferred).\n4. Decision maker level (CEO, CTO, Founder)." },
              { name: 'Real Estate', icon: Target, rules: "1. Interest in specific luxury areas (Lekki, Ikoyi).\n2. Minimum budget of ₦50M.\n3. Ready to inspect within 7 days.\n4. Financing pre-approved or cash buyer." },
              { name: 'Home Services', icon: ListChecks, rules: "1. Urgent repairs or installations (needs help ASAP).\n2. Location matches service area.\n3. Residential or Commercial clearly defined.\n4. Willing to pay inspection fee." },
              { name: 'Education', icon: Globe, rules: "1. Interested in International degrees or certifications.\n2. Strong academic background or working experience.\n3. Budget covers tuition and travel.\n4. Intake date within 12 months." }
            ].map((profile) => (
              <button
                key={profile.name}
                onClick={() => setLocalRules(profile.rules)}
                className="flex-none flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:border-coral-500/50 transition-all"
              >
                <profile.icon className="w-3 h-3 text-coral-500" />
                {profile.name}
              </button>
            ))}
          </div>

          {/* Rules Editor */}
          <div className="bg-navy-900 border border-white/5 rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-coral-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3 px-2">
                <Sparkles className="w-5 h-5 text-coral-500" />
                <h3 className="text-sm sm:text-base font-black uppercase tracking-widest text-white">English Logic Editor</h3>
              </div>

              <div className="relative">
                {/* Sample Logic Helper */}
                <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group/helper">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/helper:opacity-30 transition-opacity">
                    <Target className="w-12 h-12 text-coral-500" />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 bg-coral-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-coral-500">The "Gold Standard" Template</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <p className="text-[10px] text-white font-bold leading-relaxed">
                         "Prioritize <span className="text-coral-500">Real Estate</span> developers in <span className="text-coral-500">Lagos</span>. 
                         Score 85+ if they mention <span className="text-coral-500">₦10M budget</span> or 'immediate' rollout. 
                         Filter out anyone asking for 'free' advice."
                       </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Industry Specifics</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Financial Thresholds</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setLocalRules("1. INDUSTRY: Focus on Real Estate & FinTech.\n2. BUDGET: Mention of ₦5M+ is an automatic 80+ score.\n3. INTENT: Look for 'ready to start' or 'scaling' keywords.\n4. RED FLAGS: Ignore 'student' or 'educational' inquiries.")}
                    className="mt-4 text-[8px] font-black uppercase tracking-widest text-coral-500 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-2.5 h-2.5" /> Use Template
                  </button>
                </div>

                <textarea 
                  value={localRules}
                  onChange={(e) => setLocalRules(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 text-white font-bold text-sm sm:text-base min-h-[350px] sm:min-h-[450px] outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 transition-all resize-none custom-scrollbar leading-relaxed"
                  placeholder="Example: Prospect must be based in Lagos, have a budget over ₦500k, and explicitly mention 'expansion' in their notes."
                />
                <div className="absolute bottom-6 right-8 text-[9px] sm:text-[10px] font-black text-white/20 uppercase tracking-widest">
                  AI Context Window: Active
                </div>
              </div>
            </div>
          </div>

          {/* Follow-up Intervals section */}
          <div className="bg-navy-900 border border-white/5 rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-coral-500" />
                <h3 className="text-sm sm:text-base font-black uppercase tracking-widest text-white">Follow-up Automation</h3>
              </div>
              <button 
                onClick={addInterval}
                className="flex items-center gap-2 px-4 py-2 bg-coral-500/10 text-coral-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-coral-500 hover:text-white transition-all"
              >
                <Plus className="w-3 h-3" />
                Add Rule
              </button>
            </div>

            <p className="px-2 text-white/40 text-[10px] sm:text-xs font-bold leading-relaxed">
              Define automatic follow-up tasks based on the AI qualification score. High scores get immediate attention.
            </p>

            <div className="space-y-4">
              {localIntervals.map((interval, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-white/20 uppercase tracking-widest px-1">Score Range</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={interval.minScore}
                        onChange={(e) => updateInterval(idx, 'minScore', parseInt(e.target.value) || 0)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-coral-500/50"
                        min="0" max="100"
                      />
                      <span className="text-white/20">-</span>
                      <input 
                        type="number" 
                        value={interval.maxScore}
                        onChange={(e) => updateInterval(idx, 'maxScore', parseInt(e.target.value) || 0)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-coral-500/50"
                        min="0" max="100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-white/20 uppercase tracking-widest px-1">Interval (Days)</label>
                    <div className="flex items-center gap-3 bg-black/20 border border-white/10 rounded-lg px-3 py-2">
                      <Clock className="w-3 h-3 text-white/20" />
                      <input 
                        type="number" 
                        value={interval.days}
                        onChange={(e) => updateInterval(idx, 'days', parseInt(e.target.value) || 0)}
                        className="w-full bg-transparent border-none text-xs font-bold text-white outline-none"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-white/20 uppercase tracking-widest px-1">Method</label>
                    <select 
                      value={interval.type}
                      onChange={(e) => updateInterval(idx, 'type', e.target.value as FollowUpType)}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none appearance-none cursor-pointer focus:border-coral-500/50"
                    >
                      <option value="Call">Call</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Email">Email</option>
                      <option value="Meeting">Meeting</option>
                      <option value="SMS">SMS</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => removeInterval(idx)}
                    className="p-3 text-white/20 hover:text-red-500 transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Help */}
        <div className="space-y-6 sm:space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white">Guidelines</h3>
            </div>
            <p className="text-white/40 text-[10px] sm:text-xs font-bold leading-relaxed">
              The AI uses these rules to generate the <span className="text-white italic">0-100 Score</span>. Be specific about your deal-breakers.
            </p>
            <ul className="space-y-4 pt-4">
              <li className="flex items-start gap-3">
                <Target className="w-4 h-4 text-coral-500 shrink-0 mt-0.5" />
                <span className="text-[10px] sm:text-xs text-white/60 font-bold leading-tight">Mention specific industries you prefer.</span>
              </li>
              <li className="flex items-start gap-3">
                <Target className="w-4 h-4 text-coral-500 shrink-0 mt-0.5" />
                <span className="text-[10px] sm:text-xs text-white/60 font-bold leading-tight">Define minimum budget thresholds.</span>
              </li>
              <li className="flex items-start gap-3">
                <Target className="w-4 h-4 text-coral-500 shrink-0 mt-0.5" />
                <span className="text-[10px] sm:text-xs text-white/60 font-bold leading-tight">Identify decision-maker keywords.</span>
              </li>
            </ul>
          </div>

          <div className="bg-navy-900 border border-white/10 rounded-[2rem] p-6 sm:p-8 relative overflow-hidden">
             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-6">
                 <ListChecks className="w-5 h-5 text-coral-500" />
                 <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white">Live Example</h3>
               </div>
               <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1.5 grayscale opacity-50 select-none pointer-events-none">
                 <div className="h-1.5 w-20 bg-coral-500/50 rounded-full" />
                 <div className="h-1 w-full bg-white/10 rounded-full" />
                 <div className="h-1 w-2/3 bg-white/10 rounded-full" />
               </div>
               <p className="mt-4 text-[9px] font-black uppercase tracking-widest text-white/20 text-center">Auto-Contact sync enabled</p>
             </div>
          </div>
        </div>
      </div>

      {/* Scoring Explanation Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 border border-white/10 rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-14 overflow-hidden relative group"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-coral-500/5 rounded-full -mr-48 -mt-48 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-coral-500/10 rounded-2xl flex items-center justify-center text-coral-500">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">Scoring Architecture</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-1">How AI evaluates your leads (0-100)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="bg-navy-900/50 p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest">Unicorn</div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-3xl font-black text-white">90-100</div>
              <p className="text-xs font-bold text-white/40 leading-relaxed uppercase tracking-tighter">
                Perfect match. Decision maker, high budget, and immediate need detected.
              </p>
            </div>

            <div className="bg-navy-900/50 p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="px-3 py-1 bg-coral-500/10 text-coral-500 rounded-full text-[10px] font-black uppercase tracking-widest">Qualified</div>
                <CheckCircle2 className="w-4 h-4 text-coral-500" />
              </div>
              <div className="text-3xl font-black text-white">70-89</div>
              <p className="text-xs font-bold text-white/40 leading-relaxed uppercase tracking-tighter">
                Strong fit. Meets all core criteria but might have minor friction points.
              </p>
            </div>

            <div className="bg-navy-900/50 p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-[10px] font-black uppercase tracking-widest">Review</div>
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="text-3xl font-black text-white">40-69</div>
              <p className="text-xs font-bold text-white/40 leading-relaxed uppercase tracking-tighter">
                Potential fit. Missing some key data points or below target budget.
              </p>
            </div>

            <div className="bg-navy-900/50 p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest">Filtered</div>
                <XCircle className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-3xl font-black text-white">0-39</div>
              <p className="text-xs font-bold text-white/40 leading-relaxed uppercase tracking-tighter">
                Poor match. Wrong industry, no authority, or significantly low budget.
              </p>
            </div>
          </div>

          <div className="mt-12 pt-10 border-t border-white/5">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white/60 mb-6 px-1">Case Study Examples</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-white/5 p-6 rounded-2xl flex gap-6">
                 <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center font-black text-green-500 text-lg shrink-0">95</div>
                 <div>
                   <p className="text-white font-black uppercase text-xs tracking-widest mb-1">High Intent Tech Lead</p>
                   <p className="text-white/40 text-[10px] font-bold leading-tight italic">"CTO of FinTech firm in Lagos, looking to scale to 50 seats by next month. Budget ₦15M."</p>
                 </div>
               </div>
               <div className="bg-white/5 p-6 rounded-2xl flex gap-6">
                 <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center font-black text-red-500 text-lg shrink-0">12</div>
                 <div>
                   <p className="text-white font-black uppercase text-xs tracking-widest mb-1">Unqualified Side Project</p>
                   <p className="text-white/40 text-[10px] font-bold leading-tight italic">"Student project seeking free advice on building a basic app. No commercial intent."</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default QualificationSettings;
