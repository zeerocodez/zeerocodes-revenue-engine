import React from 'react';
import { useApp } from '../AppContext';
import { 
  AreaChart, 
  Area, 
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
import { Download, Calendar, Filter, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '../lib/utils';

const COLORS = ['#FF6B4A', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#94A3B8'];

const MetricCard = ({ label, value, sub, trend }: any) => (
  <div className="bg-navy-900 p-8 rounded-[2.5rem] border border-white/5 shadow-sm">
    <div className="flex items-center justify-between mb-4">
       <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">{label}</span>
       {trend !== undefined && (
         <div className={cn(
           "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg",
           trend > 0 ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
         )}>
           {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
           {Math.abs(trend)}%
         </div>
       )}
    </div>
    <div className="flex items-baseline gap-2">
      <h3 className="text-4xl font-black text-white tracking-tighter">{value}</h3>
    </div>
    <p className="text-xs font-bold text-white/40 mt-1">{sub}</p>
  </div>
);

const Reporting: React.FC = () => {
  const { leads } = useApp();

  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => l.qualificationScore >= 70).length;
  const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;
  
  // Calculate industry distribution
  const industryStats = leads.reduce((acc: any, lead) => {
    acc[lead.industry] = (acc[lead.industry] || 0) + 1;
    return acc;
  }, {});

  const industryData = Object.keys(industryStats).map(name => ({
    name,
    value: industryStats[name]
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  // Simplified weekly growth (mocking for now but based on real count)
  const conversionData = [
    { name: 'Prev', leads: Math.floor(totalLeads * 0.8), qualified: Math.floor(qualifiedLeads * 0.7) },
    { name: 'Current', leads: totalLeads, qualified: qualifiedLeads },
  ];

  return (
    <div className="p-10 space-y-10 max-h-[calc(100vh-96px)] overflow-y-auto bg-navy-950 custom-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Lead Volume" value={totalLeads.toLocaleString()} sub="Total Database" trend={totalLeads > 0 ? 10.5 : 0} />
        <MetricCard label="Conversion" value={`${conversionRate}%`} sub="AI Target (70%+)" trend={conversionRate > 50 ? 5.2 : -2.1} />
        <MetricCard label="Active Pipeline" value={leads.filter(l => l.status !== 'Converted' && l.status !== 'Lost').length} sub="In Progress" trend={0} />
        <MetricCard label="Agent Accuracy" value="98%" sub="Model Confidence" trend={0.5} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-navy-900 p-10 rounded-[3rem] border border-white/5 shadow-sm flex flex-col h-[480px]">
          <h3 className="text-xl font-black uppercase mb-10 tracking-widest text-white">Qualification <span className="italic text-coral-500">Pipeline</span></h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={conversionData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorQual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B4A" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#FF6B4A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 900 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 900 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A2B44', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
                />
                <Area type="monotone" dataKey="leads" stroke="#3B82F6" fillOpacity={1} fill="url(#colorLeads)" strokeWidth={4} />
                <Area type="monotone" dataKey="qualified" stroke="#FF6B4A" fillOpacity={1} fill="url(#colorQual)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-navy-900 p-10 rounded-[3rem] border border-white/5 shadow-sm flex flex-col h-[480px]">
          <h3 className="text-xl font-black uppercase mb-10 tracking-widest text-white">Lead <span className="italic text-coral-500">Industry</span></h3>
          <div className="flex-1 w-full flex items-center justify-center">
            {totalLeads > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={industryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {industryData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A2B44', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }} 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center opacity-20">
                <Filter className="w-16 h-16 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white">No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-navy-900 p-12 rounded-[4rem] text-white border border-white/5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-coral-500/10 rounded-full -mr-40 -mt-40 blur-[100px]" />
        <div className="max-w-2xl relative z-10">
          <h2 className="text-4xl font-black uppercase leading-none mb-6 tracking-tighter">AI Analysis <span className="text-coral-500 italic font-black">Report.</span></h2>
          <p className="text-white/40 font-medium leading-relaxed uppercase tracking-tighter text-xs">
            {totalLeads > 0 
              ? `You have ${totalLeads} leads in your database. ${qualifiedLeads} met your qualification criteria. The engine is ready for more real-time inquiries.`
              : "Database is currently empty. The AI Sales Engine is standing by. import leads or start simulation to begin testing."
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reporting;
