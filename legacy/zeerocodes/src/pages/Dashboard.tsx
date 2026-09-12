import React, { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  ArrowUpRight, 
  MessageSquare,
  Phone,
  Instagram,
  Facebook,
  Globe,
  Plus,
  Upload,
  Zap,
  Loader2,
  Clock,
  AlertCircle,
  FileText,
  Settings,
  Rocket
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { useApp } from '../AppContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import BulkImport from '../components/BulkImport';
import AIStatusCard from '../components/AIStatusCard';
import FollowUpDetailModal from '../components/FollowUpDetailModal';
import LeadSimulationPanel from '../components/LeadSimulationPanel';
import { AnimatePresence, motion } from 'motion/react';

const StatCard = ({ title, value, sub, trend, color }: any) => (
  <div className="bg-navy-900 p-8 rounded-[2.5rem] border border-white/5 shadow-sm hover:shadow-md transition-shadow">
    <div className="text-[11px] font-black uppercase tracking-widest text-white/40 mb-3">{title}</div>
    <div className={`text-5xl font-black tracking-tighter ${color || 'text-white'}`}>{value}</div>
    <div className="flex items-center justify-between mt-4 pb-1">
      <div className="text-xs font-bold text-white/60">{sub}</div>
      <div className={cn(
        "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg",
        trend.startsWith('+') ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
      )}>
        {trend}
      </div>
    </div>
  </div>
);

const AIContactModal = ({ lead, onClose }: { lead: any, onClose: () => void }) => {
  const { fetchWithAuth } = useApp();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const generateMessage = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchWithAuth('/api/ai/contact-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: lead.name,
          company: lead.company,
          industry: lead.industry,
          notes: lead.notes
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setMessage(data.message);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to AI Agent. Check if server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-navy-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-navy-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-12 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
      >
        <button onClick={onClose} className="absolute top-6 sm:top-10 right-6 sm:right-10 text-white/40 hover:text-white z-10">
          <X className="w-5 h-5 sm:w-6 h-6" />
        </button>

        <div className="mb-8 sm:mb-10 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
             <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-coral-500 flex items-center justify-center text-white">
               <Zap className="w-5 h-5 sm:w-6 h-6 fill-white" />
             </div>
             <div>
               <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white">AI Agent <span className="italic text-coral-500">Outreach</span></h3>
               <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/40">Personalizing contact for {lead.name}</p>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {!message ? (
            <div className="bg-white/2 border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] p-8 sm:p-12 text-center text-white">
              <div className="max-w-sm mx-auto">
                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-white/10 mx-auto mb-4 sm:mb-6" />
                <p className="text-white/60 font-bold mb-6 sm:mb-8 text-sm sm:text-base">Deploy AI to generate a culturally relevant, high-conversion welcome message.</p>
                <button 
                  onClick={generateMessage}
                  disabled={loading}
                  className="w-full py-4 sm:py-5 bg-coral-500 text-white font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-xl sm:rounded-2xl shadow-xl shadow-coral-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 disabled:scale-100"
                >
                  {loading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />}
                  {loading ? 'AI is Thinking...' : 'Draft Contact Message'}
                </button>
                {error && <p className="mt-4 text-red-400 text-[8px] sm:text-[10px] font-black uppercase tracking-widest font-mono">{error}</p>}
              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 sm:space-y-8">
              <div className="bg-white/5 border border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8">
                <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-coral-500 mb-3 sm:mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> AI Generated Draft
                </div>
                <p className="text-white font-medium leading-relaxed text-base sm:text-lg italic">"{message}"</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pb-4">
                <button 
                  onClick={generateMessage}
                  disabled={loading}
                  className="w-full py-4 sm:py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[9px] sm:text-[10px] rounded-xl sm:rounded-2xl hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Thinking...' : 'Regenerate'}
                </button>
                <button className="w-full py-4 sm:py-5 bg-green-500 text-white font-black uppercase tracking-widest text-[9px] sm:text-[10px] rounded-xl sm:rounded-2xl shadow-xl shadow-green-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
                  Connect via WhatsApp <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// X icon component
const X = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

// Reusable FollowUpDetailModal was moved to src/components/FollowUpDetailModal.tsx

const Dashboard: React.FC<{ onAddLead?: () => void }> = ({ onAddLead }) => {
  const { leads, followUps, updateFollowUpStatus, updateLeadStatus, addLeadComment, creditBalance, registration, transactions } = useApp();
  const navigate = useNavigate();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedLeadForAI, setSelectedLeadForAI] = useState<any>(null);
  const [selectedFollowUpDetail, setSelectedFollowUpDetail] = useState<any>(null);
  const [followUpTab, setFollowUpTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [pipelineRange, setPipelineRange] = useState<'monthly' | 'weekly'>('monthly');

  const totalPurchasedCredits = transactions
    .filter(t => t.type === 'Credit' && t.status === 'Completed')
    .reduce((acc, t) => acc + (t.credits || 0), 0);

  const sourceData = [
    { name: 'WhatsApp', value: leads.filter(l => l.source === 'WhatsApp').length, color: '#3B82F6' },
    { name: 'Instagram', value: leads.filter(l => l.source === 'Instagram').length, color: '#FF6B4A' },
    { name: 'Facebook', value: leads.filter(l => l.source === 'Facebook').length, color: '#6366F1' },
    { name: 'Website', value: leads.filter(l => l.source === 'Website').length, color: '#94A3B8' },
  ];

  // Mock differentiation for weekly vs monthly
  const chartData = pipelineRange === 'monthly' ? sourceData : sourceData.map(d => ({ ...d, value: Math.ceil(d.value / 4) }));

  const displayedFollowUps = followUps
    .filter(f => followUpTab === 'upcoming' ? (f.status === 'Upcoming' || f.status === 'Overdue') : f.status === 'Completed')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);
  const recentLeads = leads.slice(0, 4);

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 lg:space-y-10 overflow-y-auto max-h-[calc(100vh-80px)] lg:max-h-[calc(100vh-96px)] custom-scrollbar">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white">Sales Dashboard</h1>
          <p className="text-white/40 mt-1 font-bold text-xs sm:text-sm">Real-time performance metrics and lead flow.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsImportOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <Upload className="w-3.5 h-3.5 sm:w-4 h-4" /> Import
          </button>
          <button 
            onClick={onAddLead}
            className="flex-1 sm:flex-none bg-coral-500 text-white px-4 sm:px-8 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] shadow-xl shadow-coral-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 h-4" /> New Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          title="Total Leads" 
          value={leads.length.toLocaleString()} 
          sub="Voice AI Scanned"
          trend="0%" 
        />
        <StatCard 
          title="Qualified" 
          value={leads.filter(l => l.qualificationScore >= 70).length} 
          sub="Billable Leads"
          trend="0%" 
          color="text-coral-500"
        />
        <StatCard 
          title="Active Calls" 
          value={leads.filter(l => l.status === 'New').length} 
          sub="AI Agent Queue"
          trend="Idle" 
        />
        <div className="bg-navy-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 shadow-sm group hover:border-coral-500/50 transition-all flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap className="w-16 h-16 rotate-12" />
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-coral-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-coral-500 mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5 sm:w-6 h-6 fill-current" />
          </div>
          <div className="text-[10px] font-black uppercase text-white/40 mb-1 tracking-widest leading-none">Wallet Balance</div>
          <div className="text-2xl sm:text-3xl font-black text-white leading-none mb-1 tracking-tight">{creditBalance} <span className="text-xs text-white/20">CREDITS</span></div>
          <div className="text-[9px] font-bold text-coral-500/80 mb-2 tracking-tighter">≈ ₦{(creditBalance * 100).toLocaleString()}</div>
          <div className="text-[8px] font-black uppercase text-white/30 tracking-widest">Total Purchased: {totalPurchasedCredits.toLocaleString()}</div>
          <div className="mt-4 flex gap-2 items-center">
            <button 
              onClick={() => navigate('/dashboard/billing')}
              className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-coral-500 hover:text-white transition-colors"
            >
              Recharge
            </button>
            <span className="text-white/10">|</span>
            <button 
              onClick={() => setIsImportOpen(true)}
              className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
            >
              Import
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 sm:gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-4 sm:space-y-8">
          <div className="bg-navy-900 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-white/5 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 sm:mb-10">
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">Active <span className="italic text-coral-500">Pipeline</span></h3>
              <div className="flex bg-white/5 p-1 rounded-full border border-white/10 w-full sm:w-auto overflow-hidden">
                <button 
                  onClick={() => setPipelineRange('monthly')}
                  className={cn(
                    "flex-1 sm:flex-none text-center px-4 sm:px-5 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                    pipelineRange === 'monthly' ? "bg-coral-500 text-white" : "text-white/40 hover:text-white"
                  )}
                >
                  Monthly
                </button>
                <button 
                  onClick={() => setPipelineRange('weekly')}
                  className={cn(
                    "flex-1 sm:flex-none text-center px-4 sm:px-5 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                    pipelineRange === 'weekly' ? "bg-coral-500 text-white" : "text-white/40 hover:text-white"
                  )}
                >
                  Weekly
                </button>
              </div>
            </div>
            <div className="h-64 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: 900, textTransform: 'uppercase' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: 900 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }} 
                    contentStyle={{ backgroundColor: '#1A2B44', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', padding: '12px' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={30}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Sources & Integration */}
          <div className="bg-navy-900 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-white/5 h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg sm:text-xl font-black uppercase text-white">Active <span className="text-blue-500 italic">Sources</span></h3>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-navy-900 bg-green-500 flex items-center justify-center">
                  <MessageSquare className="w-3 h-3 text-white" />
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-navy-900 bg-pink-500 flex items-center justify-center">
                  <Instagram className="w-3 h-3 text-white" />
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-navy-900 bg-white/10 flex items-center justify-center">
                  <Plus className="w-3 h-3 text-white/40" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all cursor-pointer" onClick={() => navigate('/dashboard/integrations')}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase text-white">Website Webhook</div>
                    <div className="text-[8px] font-black uppercase tracking-widest text-green-500">Connected & Listening</div>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>

              <div className="p-6 bg-white/2 rounded-[2rem] border border-white/5 border-dashed group hover:border-coral-500/30 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2 bg-coral-500/10 rounded-lg text-coral-500">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Deployment Instruction</h4>
                </div>
                <p className="text-[9px] font-bold text-white/40 leading-relaxed uppercase tracking-tight mb-4">
                  Connect your lead sources manually or use the AI Agent to scan your CRM.
                </p>
                <button 
                  onClick={() => navigate('/dashboard/integrations')}
                  className="w-full py-3 bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors"
                >
                  Configure Integrations
                </button>
              </div>
            </div>
          </div>

          <div className="bg-navy-900 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-white/5 h-full">
            <h3 className="text-lg sm:text-xl font-black uppercase mb-6 sm:mb-8 text-white">Lead <span className="text-coral-500 italic">Queue</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {recentLeads.map(lead => (
                <div key={lead.id} className="bg-white/2 border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 hover:border-coral-500/30 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/5 flex items-center justify-center font-black text-white text-[10px] uppercase">
                        {(lead.name || '').split(' ').map(n => n ? n[0] : '').join('') || '?'}
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-black uppercase text-white tracking-tight leading-tight">{lead.name}</div>
                        <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/40">{lead.industry}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedLeadForAI(lead)}
                      className="p-2 sm:p-2.5 bg-coral-500/10 text-coral-500 rounded-lg sm:rounded-xl hover:bg-coral-500 hover:text-white transition-all shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5 sm:w-4 h-4 fill-current" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/20">
                     <div className="flex items-center gap-1"><MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {lead.source}</div>
                     <div className="text-coral-500/50">•</div>
                     <div>{format(new Date(lead.createdAt), 'MMM d')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4 sm:space-y-8">
          <div className="bg-navy-900 text-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 flex flex-col relative overflow-hidden group border border-white/5 h-[350px] sm:h-[400px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-coral-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-coral-500/20 transition-all duration-700" />
            
            <div className="flex items-center justify-between mb-6 sm:mb-8 shrink-0">
               <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight">Next <span className="text-coral-500 italic">Up</span></h3>
               <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 overflow-hidden">
                 <button 
                   onClick={() => setFollowUpTab('upcoming')}
                   className={cn(
                     "px-3 py-1 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all",
                     followUpTab === 'upcoming' ? "bg-coral-500 text-white shadow-lg" : "text-white/40 hover:text-white"
                   )}
                 >
                   Upcoming
                 </button>
                 <button 
                   onClick={() => setFollowUpTab('completed')}
                   className={cn(
                     "px-3 py-1 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all",
                     followUpTab === 'completed' ? "bg-coral-500 text-white shadow-lg" : "text-white/40 hover:text-white"
                   )}
                 >
                   Completed
                 </button>
               </div>
            </div>

            <div className="space-y-6 sm:space-y-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {displayedFollowUps.length > 0 ? displayedFollowUps.map((f, i) => {
                const lead = leads.find(l => l.id === f.leadId);
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={f.id} 
                    onClick={() => setSelectedFollowUpDetail({ followUp: f, lead })}
                    className="flex items-start gap-4 sm:gap-6 group/item cursor-pointer border-l-2 border-transparent hover:border-coral-500 pl-2 transition-all"
                  >
                    <div className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-white transition-colors shrink-0",
                      f.status === 'Completed' ? "bg-green-500" : "bg-white/10 group-hover/item:bg-coral-500"
                    )}>
                      {f.status === 'Completed' ? <CheckCircle2 className="w-5 h-5 sm:w-6 h-6" /> : format(new Date(f.scheduledAt), 'dd')}
                    </div>
                    <div>
                      <div className="font-bold text-sm sm:text-base leading-tight mb-1 group-hover/item:text-coral-400 transition-colors uppercase tracking-tight truncate max-w-[150px] sm:max-w-none">
                        {f.type}: {lead?.name}
                      </div>
                      <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                        {format(new Date(f.scheduledAt), 'h:mm a')} • {f.status === 'Completed' ? 'DONE' : 'HIGH PRIORITY'}
                      </div>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <Calendar className="w-12 h-12 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No activities found</p>
                </div>
              )}
            </div>
            
            <div className="pt-6 sm:pt-8 border-t border-white/10 mt-auto">
              <button 
                onClick={() => navigate('/dashboard/follow-ups')}
                className="w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl border border-coral-500 text-coral-500 font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-coral-500 hover:text-white transition-all shadow-lg hover:shadow-coral-500/20"
              >
                View All Tasks
              </button>
            </div>
          </div>

          <AIStatusCard />

          <LeadSimulationPanel />

          <div 
            onClick={() => navigate('/dashboard/qualify-rules')}
            className="bg-navy-900 border-2 border-dashed border-white/10 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 hover:border-coral-500/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center text-white group-hover:bg-coral-500 transition-colors">
                <Settings className="w-5 h-5 sm:w-6 h-6" />
              </div>
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/20 group-hover:text-coral-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
            </div>
            <h3 className="text-sm sm:text-base font-black uppercase tracking-widest text-white leading-tight">Configure<br/>Qualify Logic</h3>
            <p className="mt-2 text-[10px] font-bold text-white/40 leading-relaxed uppercase tracking-tighter">
              Define custom rules in plain English to filter your leads accurately.
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isImportOpen && (
          <BulkImport onClose={() => setIsImportOpen(false)} />
        )}
        {selectedLeadForAI && (
          <AIContactModal lead={selectedLeadForAI} onClose={() => setSelectedLeadForAI(null)} />
        )}
        {selectedFollowUpDetail && (
          <FollowUpDetailModal 
            followUp={selectedFollowUpDetail.followUp} 
            lead={selectedFollowUpDetail.lead} 
            onClose={() => setSelectedFollowUpDetail(null)} 
            onComplete={(id, leadId, note) => {
              updateFollowUpStatus(id, 'Completed');
              if (leadId) {
                updateLeadStatus(leadId, 'Contacted');
                if (note) addLeadComment(leadId, `Follow-up (${selectedFollowUpDetail.followUp.type}) result: ${note}`);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
