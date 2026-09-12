import React, { useMemo } from 'react';
import { useApp } from '../AppContext';
import { 
  Users, 
  ShieldCheck, 
  Ticket, 
  DollarSign, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Activity,
  User as UserIcon,
  Search,
  ExternalLink,
  Zap,
  XCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { Lead, Ticket as TicketType, Transaction, Organization } from '../types';
import { AnimatePresence, motion } from 'motion/react';

const ADMIN_COLORS = ['#FF6B4A', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

const AdminStatCard = ({ label, value, sub, icon: Icon, color }: any) => (
  <div className="bg-navy-900 p-8 rounded-[2.5rem] border border-white/5 shadow-sm relative overflow-hidden group">
    <div className={cn("absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity", color)}>
      <Icon className="w-24 h-24 rotate-12" />
    </div>
    <div className="relative">
      <div className="flex items-center gap-2 mb-4">
        <div className={cn("p-2 rounded-xl bg-white/5", color)}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{label}</span>
      </div>
      <h3 className="text-4xl font-black text-white tracking-tighter mb-2">{value}</h3>
      <p className="text-xs font-bold text-white/20 uppercase tracking-widest">{sub}</p>
    </div>
  </div>
);

const SuperAdmin: React.FC = () => {
  const { allLeads, allTickets, allTransactions, allOrganizations, giftCredits, isSuperAdmin } = useApp();
  const [giftingOrg, setGiftingOrg] = React.useState<string | null>(null);
  const [giftAmount, setGiftAmount] = React.useState<number>(100);

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-navy-950 p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mb-6">
          <ShieldCheck className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Access <span className="text-red-500">Denied</span></h1>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] max-w-xs">You do not have the required administrative clearance to view this sector.</p>
      </div>
    );
  }

  // Derived Data
  const stats = useMemo(() => {
    const totalLeads = allLeads.length;
    // Revenue from SOLD credits (transactions where type is Credit and amount > 0)
    const totalRevenue = allTransactions
      .filter(t => t.type === 'Credit' && t.status === 'Completed' && t.amount > 0)
      .reduce((acc, t) => acc + t.amount, 0);
    const openTickets = allTickets.filter(t => t.status === 'Open').length;
    
    return {
      totalLeads,
      totalRevenue,
      openTickets,
      totalUsers: allOrganizations.length || 1
    };
  }, [allLeads, allTickets, allTransactions, allOrganizations]);

  const handleGift = async () => {
    if (!giftingOrg) return;
    await giftCredits(giftingOrg, giftAmount);
    setGiftingOrg(null);
  };

  const ticketStats = useMemo(() => {
    const counts = allTickets.reduce((acc: any, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(counts).map(status => ({
      name: status,
      value: counts[status]
    }));
  }, [allTickets]);

  const recentTransactions = useMemo(() => {
    return [...allTransactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  }, [allTransactions]);

  return (
    <div className="p-10 space-y-10 max-h-[calc(100vh-64px)] overflow-y-auto bg-navy-950 custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">System <span className="text-coral-500">Command</span> Center</h2>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Activity className="w-3 h-3 text-green-500 animate-pulse" /> Live System Performance Monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-navy-900 border border-white/5 rounded-2xl flex items-center gap-3">
            <Clock className="w-4 h-4 text-white/20" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{format(new Date(), 'HH:mm:ss')} UTC</span>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard label="Global Users" value={stats.totalUsers} sub="Unique Platforms" icon={UserIcon} color="text-blue-500" />
        <AdminStatCard label="Total Leads" value={stats.totalLeads} sub="Across Network" icon={Users} color="text-coral-500" />
        <AdminStatCard label="System Revenue" value={`₦${(stats.totalRevenue / 1000).toFixed(1)}k`} sub="LTD Billing" icon={DollarSign} color="text-green-500" />
        <AdminStatCard label="Support Queue" value={stats.openTickets} sub="Pending Action" icon={Ticket} color="text-purple-500" />
      </div>

      {/* Organizations Management */}
      <div className="bg-navy-900 p-10 rounded-[3.5rem] border border-white/5 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white">Organization <span className="italic text-coral-500">Registry</span></h3>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-2">Manage platform licenses and shared wallets</p>
          </div>
          <Users className="w-8 h-8 text-white/5" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-4">
            <thead>
              <tr className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                <th className="px-6 pb-2">Organization</th>
                <th className="px-6 pb-2 text-center">Balance</th>
                <th className="px-6 pb-2">Status</th>
                <th className="px-6 pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allOrganizations.map((org) => (
                <tr key={org.id} className="group transition-all">
                  <td className="px-6 py-4 bg-white/2 group-hover:bg-white/5 rounded-l-3xl first:rounded-l-3xl border-y border-l border-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-coral-500/10 flex items-center justify-center font-black text-coral-500 text-xs">
                        {org.name?.slice(0, 2).toUpperCase() || 'OG'}
                      </div>
                      <div>
                        <div className="text-xs font-black text-white uppercase tracking-tight">{org.name || org.id}</div>
                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">ORG-ID: {org.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 bg-white/2 group-hover:bg-white/5 border-y border-white/5 text-center">
                    <div className="text-sm font-black text-white">{org.creditBalance || 0}</div>
                    <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">Credits</div>
                  </td>
                  <td className="px-6 py-4 bg-white/2 group-hover:bg-white/5 border-y border-white/5">
                    <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest rounded-full">Active</span>
                  </td>
                  <td className="px-6 py-4 bg-white/2 group-hover:bg-white/5 rounded-r-3xl last:rounded-r-3xl border-y border-r border-white/5 text-right">
                    <button 
                      onClick={() => setGiftingOrg(org.id)}
                      className="px-4 py-2 bg-white/5 group-hover:bg-coral-500 border border-white/10 group-hover:border-transparent text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/60 group-hover:text-white rounded-xl transition-all"
                    >
                      Gift Credits
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Support Breakdown */}
        <div className="lg:col-span-1 bg-navy-900 p-10 rounded-[3rem] border border-white/5 shadow-sm">
          <h3 className="text-xl font-black uppercase mb-8 tracking-widest text-white">Support <span className="italic text-coral-500">Sync</span></h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ticketStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ticketStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ADMIN_COLORS[index % ADMIN_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A2B44', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px', fontWeight: 900, textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-4">
             {ticketStats.map((stat, i) => (
               <div key={stat.name} className="flex items-center justify-between p-3 bg-white/2 rounded-2xl">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ADMIN_COLORS[i % ADMIN_COLORS.length] }} />
                    <span className="text-[10px] font-black text-white/40 uppercase">{stat.name}</span>
                 </div>
                 <span className="text-xs font-black text-white">{stat.value}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Financial Flow */}
        <div className="lg:col-span-2 bg-navy-900 p-10 rounded-[3rem] border border-white/5 shadow-sm">
           <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black uppercase tracking-widest text-white">Financial <span className="italic text-green-500">Flow</span></h3>
              <button className="flex items-center gap-2 text-[10px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-colors">
                All Transactions <ExternalLink className="w-3 h-3" />
              </button>
           </div>
           
           <div className="space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.map(tx => (
                  <div key={tx.id} className="group p-6 bg-white/2 hover:bg-white/5 border border-transparent hover:border-white/5 rounded-3xl transition-all flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        tx.type === 'Charge' ? "bg-coral-500/10 text-coral-500" : "bg-green-500/10 text-green-500"
                      )}>
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white uppercase tracking-tight mb-1">{tx.description}</div>
                        <div className="flex items-center gap-3">
                           <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{format(new Date(tx.createdAt), 'MMM dd, HH:mm')}</span>
                           <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">UID: {tx.userId.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className={cn("text-xl font-black tracking-tighter mb-1", tx.type === 'Charge' ? "text-white" : "text-green-500")}>
                         {tx.type === 'Charge' ? '' : '+'}{tx.amount.toLocaleString()} <span className="text-[10px] font-bold">NGN</span>
                       </div>
                       <div className="text-[8px] font-black uppercase text-white/20 tracking-widest">{tx.status}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-white/10">
                  <TrendingUp className="w-16 h-16 mb-6 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No transaction flow recorded yet.</p>
                </div>
              )}
           </div>

           <div className="mt-10 p-6 bg-green-500/5 border border-green-500/10 rounded-[2rem] flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-green-500/60 uppercase tracking-widest mb-1">Total System Liquidity</p>
                <div className="text-2xl font-black text-green-500 tracking-tighter">₦{stats.totalRevenue.toLocaleString()}.00</div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500/20" />
           </div>
        </div>
      </div>

      {/* User Overviews / System Queue omitted for brevity but could be added here */}

      {/* Gift Credits Modal */}
      <AnimatePresence>
        {giftingOrg && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-navy-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-navy-900 border border-white/10 w-full max-w-md rounded-[3rem] p-12 shadow-2xl relative"
            >
              <button 
                onClick={() => setGiftingOrg(null)}
                className="absolute top-10 right-10 text-white/40 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>

              <div className="mb-10">
                <div className="w-16 h-16 rounded-[2rem] bg-coral-500/10 flex items-center justify-center text-coral-500 mb-6">
                  <Zap className="w-8 h-8 fill-current" />
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-2">Gift <span className="text-coral-500">Credits</span></h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Inject credits into {allOrganizations.find(o => o.id === giftingOrg)?.name || giftingOrg}'s wallet.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-3">Amount to Gift</label>
                  <input 
                    type="number"
                    value={giftAmount}
                    onChange={(e) => setGiftAmount(parseInt(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-lg font-black focus:outline-none focus:border-coral-500 transition-colors"
                  />
                </div>

                <div className="flex gap-4">
                  {[100, 500, 1000].map(amt => (
                    <button 
                      key={amt}
                      onClick={() => setGiftAmount(amt)}
                      className={cn(
                        "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all",
                        giftAmount === amt ? "bg-coral-500 border-transparent text-white" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                      )}
                    >
                      {amt}
                    </button>
                  ))}
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleGift}
                    className="w-full py-5 bg-coral-500 text-white font-black uppercase tracking-widest text-xs rounded-[1.5rem] shadow-xl shadow-coral-500/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Confirm Gift Injection
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdmin;
