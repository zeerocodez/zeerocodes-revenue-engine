/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Shield,
  Activity,
  Users,
  Database,
  RefreshCw,
  TrendingUp,
  FolderSync,
  Sparkles,
  AlertOctagon,
  Trash2,
  Lock,
  DollarSign,
  Briefcase,
  Zap,
  Globe,
  Bell,
  Cpu,
  CornerDownRight,
  Code,
  ArrowRight
} from "lucide-react";
import { 
  User, 
  Conversation, 
  RevenueEvent, 
  ActivityLog, 
  Invoice, 
  Business, 
  SubscriptionTier, 
  CustomerSegment,
  Role,
  ConversationStatus,
  Message
} from "../types";

interface SuperAdminSectionProps {
  business: Business;
  conversations: Conversation[];
  users: User[];
  revenueEvents: RevenueEvent[];
  activityLogs: ActivityLog[];
  invoices: Invoice[];
  currentUser: User;
  onUpdateBusiness: (updater: (prev: Business) => Business) => void;
  onUpdateUsers: (updater: (prev: User[]) => User[]) => void;
  onUpdateConversations: (updater: (prev: Conversation[]) => Conversation[]) => void;
  onUpdateRevenueEvents: (updater: (prev: RevenueEvent[]) => RevenueEvent[]) => void;
  onUpdateActivityLogs: (updater: (prev: ActivityLog[]) => ActivityLog[]) => void;
  onUpdateInvoices: (updater: (prev: Invoice[]) => Invoice[]) => void;
  onLogActivity: (action: string, details: string) => void;
}

export default function SuperAdminSection({
  business,
  conversations,
  users,
  revenueEvents,
  activityLogs,
  invoices,
  currentUser,
  onUpdateBusiness,
  onUpdateUsers,
  onUpdateConversations,
  onUpdateRevenueEvents,
  onUpdateActivityLogs,
  onUpdateInvoices,
  onLogActivity
}: SuperAdminSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<"telemetry" | "actions" | "db-inspector" | "logs">("telemetry");
  const [targetOverride, setTargetOverride] = useState(String(business.monthlyTarget || 500000));
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [inspectionTarget, setInspectionTarget] = useState<"business" | "users" | "conversations" | "followups" | "revenue" | "logs">("business");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Global calculations
  const totalSystemLTV = conversations.reduce((sum, c) => sum + c.contact.totalLTV, 0);
  const totalRevenueWon = revenueEvents.reduce((sum, e) => sum + e.amount, 0);
  const totalLeads = conversations.length;
  const growthSegmentCount = conversations.filter(c => c.contact.segment === CustomerSegment.REGULAR).length;
  const vipSegmentCount = conversations.filter(c => c.contact.segment === CustomerSegment.VIP).length;
  
  // Custom alerts triggers
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage) return;
    
    // Broadcast message is injected into everyone's active log and a prompt triggers
    onLogActivity("System Broadcast", `Admin [${currentUser.name}] broadcasted: "${broadcastMessage}"`);
    
    // Create broad visual system message in each conversation for simulating support message
    onUpdateConversations(prev => {
      return prev.map((chat, idx) => {
        if (idx < 3) { // Ingest into top 3 active queues
          const systemMsg: Message = {
            id: `sys_broadcast_${Date.now()}_${idx}`,
            sender: "user",
            senderName: "SYSTEM NOTIFICATION",
            body: `⚠️ BREAKING SYSTEM ANNOUNCEMENT: ${broadcastMessage}`,
            timestamp: new Date().toISOString(),
            type: "text",
            status: "read"
          };
          return {
            ...chat,
            messages: [...chat.messages, systemMsg],
            lastMessage: systemMsg,
            status: ConversationStatus.UNREAD
          };
        }
        return chat;
      });
    });

    alert(`Broadcast system announcement successfully deployed: "${broadcastMessage}"`);
    setBroadcastMessage("");
  };

  // Seed Mock Won Deal directly to bypass active WhatsApp typing
  const handleSeedWonDeal = () => {
    if (conversations.length === 0) return;
    
    // Select first conversation
    const targetChat = conversations[0];
    const amount = Math.floor(Math.random() * 85000) + 15000;
    
    // Add Revenue event
    const newRev: RevenueEvent = {
      id: "rev_seed_" + Date.now(),
      conversationId: targetChat.id,
      customerName: targetChat.contact.name,
      amount,
      status: "Won" as any,
      date: new Date().toISOString(),
      repId: currentUser.id,
      repName: currentUser.name
    };

    onUpdateRevenueEvents(prev => [newRev, ...prev]);

    // Update conversation score
    onUpdateConversations(prev => {
      return prev.map(c => {
        if (c.id === targetChat.id) {
          return {
            ...c,
            selectedOutcome: "Won" as any,
            revenueAmount: amount,
            contact: {
              ...c.contact,
              totalLTV: c.contact.totalLTV + amount
            }
          };
        }
        return c;
      });
    });

    onLogActivity("Super Admin Seed", `Directly injected WON business deal for ₦${amount.toLocaleString()} with ${targetChat.contact.name}`);
  };

  // Simulate bulk client loading of complex leads
  const handleSeedBulkClients = () => {
    const freshNames = ["Hakeem Yusuf", "Zainab Bello", "Tunde Coker", "Ngozi Alali", "Dayo Omidiran"];
    const phones = ["+234 809 123 9991", "+234 811 555 4443", "+234 905 222 1111", "+234 703 888 7776", "+234 812 444 8888"];
    const segments = [CustomerSegment.VIP, CustomerSegment.REGULAR, CustomerSegment.ONE_TIME, CustomerSegment.DORMANT];
    
    const seededConvs: Conversation[] = freshNames.map((name, i) => {
      const contactId = `seeded_cnt_${Date.now()}_${i}`;
      const chatId = `seeded_cv_${Date.now()}_${i}`;
      const segChoice = segments[i % segments.length];
      const ltvSeed = segChoice === CustomerSegment.VIP ? 150000 : segChoice === CustomerSegment.REGULAR ? 35000 : 0;
      
      const newContact = {
        id: contactId,
        name,
        phone: phones[i],
        avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + (i * 100000)}?auto=format&fit=crop&w=150&h=150&q=80`,
        segment: segChoice,
        totalLTV: ltvSeed,
        conversationCount: 3,
        firstContactDate: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        lastContactDate: new Date().toISOString(),
        notes: [`Pre-seeded from CRM Super Admin Console as initial inbound lead.`]
      };

      const msg = {
        id: `seeded_msg_${Date.now()}_${i}`,
        sender: "customer" as const,
        senderName: name,
        body: `Hello LeadZero Support team, I am interested in your premier workspace plans. Can you provide Pricing updates?`,
        timestamp: new Date().toISOString(),
        type: "text" as const,
        status: "read" as const
      };

      return {
        id: chatId,
        contact: newContact,
        status: ConversationStatus.UNREAD,
        lastMessage: msg,
        messages: [msg],
        tags: ["System Inbound", "Seeded Tier"],
        internalNotes: ["Requires immediate admin followup delegation"]
      };
    });

    onUpdateConversations(prev => [...seededConvs, ...prev]);
    onLogActivity("Super Admin Inject", `Successfully loaded and synced ${freshNames.length} high-value inbound contacts into workspace`);
  };

  const handleUpdateTierConfig = (tier: SubscriptionTier) => {
    onUpdateBusiness(prev => ({
      ...prev,
      subscriptionTier: tier,
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()
    }));
    onLogActivity("Tier Force Upgrade", `Super Admin directly sets subscription tier level index to ${tier}`);
  };

  const handleOverrideMonthlyTarget = () => {
    const num = Number(targetOverride);
    if (isNaN(num) || num <= 0) return;
    onUpdateBusiness(prev => ({
      ...prev,
      monthlyTarget: num
    }));
    onLogActivity("Target Restructured", `Admin recalculated and overrode workspace monthly goal to ₦${num.toLocaleString()}`);
    alert(`Successfully committed updated goal target to ₦${num.toLocaleString()}`);
  };

  const handleClearWorkspaceData = () => {
    localStorage.clear();
    onLogActivity("Wiped Workspace Databases", `User requested total sandbox factory default override`);
    setShowConfirmReset(false);
    alert("Sandboxed state wiped. Applet will hot restart now.");
    window.location.reload();
  };

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-4rem)] md:min-h-screen p-4 md:p-8 text-slate-100 overflow-y-auto pb-24 md:pb-8">
      {/* Header Deck */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full mb-2">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            Security Shield Active • God Mode Enabled
          </div>
          <h2 className="text-2xl md:text-3xl font-black font-sans text-white tracking-tight flex items-center gap-2">
            <Shield className="w-8 h-8 text-red-500" /> Super Admin Control Deck
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Running diagnostic metrics, telemetry overrides, and live system-level database hooks for user <strong className="text-red-400">zeerocodes@gmail.com</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
          <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest bg-red-950/40 px-3 py-1 border border-red-900/40 rounded-lg">
            Authorized admin Session
          </span>
        </div>
      </div>

      {/* Sub Tabs Toggle options */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl mb-6 w-fit overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveSubTab("telemetry")}
          className={`flex items-center gap-2 text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors font-bold whitespace-nowrap ${
            activeSubTab === "telemetry" 
              ? "bg-red-600 text-white" 
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" /> Real-time Telemetry
        </button>
        <button
          onClick={() => setActiveSubTab("actions")}
          className={`flex items-center gap-2 text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors font-bold whitespace-nowrap ${
            activeSubTab === "actions" 
              ? "bg-red-600 text-white" 
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
          }`}
        >
          <Cpu className="w-4 h-4 shrink-0" /> Action & Injection Panel
        </button>
        <button
          onClick={() => setActiveSubTab("db-inspector")}
          className={`flex items-center gap-2 text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors font-bold whitespace-nowrap ${
            activeSubTab === "db-inspector" 
              ? "bg-red-600 text-white" 
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
          }`}
        >
          <Database className="w-4 h-4 shrink-0" /> Database Inspector
        </button>
        <button
          onClick={() => setActiveSubTab("logs")}
          className={`flex items-center gap-2 text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors font-bold whitespace-nowrap ${
            activeSubTab === "logs" 
              ? "bg-red-600 text-white" 
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" /> Broadcast & Audits
        </button>
      </div>

      {/* Telemetry Tab content */}
      {activeSubTab === "telemetry" && (
        <div className="space-y-6">
          {/* Bento Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] font-mono uppercase text-slate-500 block font-bold tracking-wider mb-1">Estimated MRR (NGN)</span>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-black text-white font-mono">
                  ₦{(invoices.length * 15000).toLocaleString()}
                </p>
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[9px] text-slate-400 mt-2 font-mono">Based on invoice count metrics</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] font-mono uppercase text-slate-500 block font-bold tracking-wider mb-1">Total System LTV Worth</span>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-black text-yellow-500 font-mono">
                  ₦{totalSystemLTV.toLocaleString()}
                </p>
                <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[9px] text-slate-400 mt-2 font-mono">Aggregated lifetime transaction volumes</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] font-mono uppercase text-slate-500 block font-bold tracking-wider mb-1">Total Workspace Chats</span>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-black text-rose-500 font-mono">
                  {totalLeads} conversations
                </p>
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[9px] text-slate-400 mt-2 font-mono">With active status indexing</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] font-mono uppercase text-slate-500 block font-bold tracking-wider mb-1">Workspace Seeded Reps</span>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-black text-blue-500 font-mono">
                  {users.length} teammates
                </p>
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[9px] text-slate-400 mt-2 font-mono">Active roles assigned instantly</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* System parameters Override card */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1.5 flex items-center gap-2">
                <FolderSync className="w-4 p-0 text-emerald-400" /> Subscription Status Control
              </h3>
              <p className="text-xs text-slate-400 mb-6">Overlord overrides for managing customer licensing tier and target metrics instantly.</p>

              <div className="space-y-4">
                {/* Subscription Override button row */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-semibold mb-2">Configure Tier Override</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { tier: SubscriptionTier.FREE, label: "FREE Plan", desc: "No Premium Seats", border: "border-gray-800 hover:border-gray-500" },
                      { tier: SubscriptionTier.GROWTH, label: "GROWTH Plan", desc: "₦5k / Month", border: "border-emerald-800 hover:border-emerald-500" },
                      { tier: SubscriptionTier.PRO, label: "PRO Plan", desc: "₦15k / Month", border: "border-yellow-800 hover:border-yellow-500" }
                    ].map(opt => (
                      <button
                        key={opt.tier}
                        onClick={() => handleUpdateTierConfig(opt.tier)}
                        className={`p-3 bg-slate-950 text-center rounded-xl border text-xs cursor-pointer transition-all ${
                          business.subscriptionTier === opt.tier 
                            ? "border-red-500 ring-1 ring-red-500 text-white" 
                            : opt.border + " text-slate-400"
                        }`}
                      >
                        <p className="font-extrabold">{opt.label}</p>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Monthly Target goal overrides */}
                <div className="pt-4 border-t border-slate-850">
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-semibold mb-1.5">Configure Target Override (₦)</label>
                  <div className="flex gap-2.5">
                    <input
                      type="number"
                      value={targetOverride}
                      onChange={(e) => setTargetOverride(e.target.value)}
                      className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-2.5 text-xs font-mono font-bold flex-1 focus:outline-none focus:ring-1 focus:ring-red-500"
                      placeholder="e.g. 500000"
                    />
                    <button
                      onClick={handleOverrideMonthlyTarget}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-white text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Save Override
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-850 text-[10px] leading-normal text-slate-400 mt-2">
                  <p className="font-semibold text-slate-300">Live Workspace Status:</p>
                  <ul className="list-disc list-inside mt-1 font-mono space-y-0.5">
                    <li>Active Target: ₦{(business.monthlyTarget || 500000).toLocaleString()}</li>
                    <li>SaaS Tier: <strong className="text-emerald-400 uppercase">{business.subscriptionTier}</strong></li>
                    <li>Licensing Cycle: {business.subscriptionExpiresAt ? "Pre-Extended annually" : "N/A"}</li>
                  </ul>
                </div>

              </div>
            </div>

            {/* Quick telemetry indicators */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1.5 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" /> Pipeline Diagnostic Status
              </h3>
              <p className="text-xs text-slate-400 mb-4">Diagnostics calculated across databases in current storage context.</p>

              <div className="space-y-3.5 pt-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-mono">
                    <span className="text-slate-400">Regular Client Segments ({growthSegmentCount})</span>
                    <span className="text-slate-300 font-semibold">{totalLeads ? Math.round((growthSegmentCount/totalLeads)*100) : 0}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${totalLeads ? (growthSegmentCount/totalLeads)*100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-mono">
                    <span className="text-slate-400">VIP Client Segments ({vipSegmentCount})</span>
                    <span className="text-slate-300 font-semibold">{totalLeads ? Math.round((vipSegmentCount/totalLeads)*100) : 0}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 transition-all duration-300"
                      style={{ width: `${totalLeads ? (vipSegmentCount/totalLeads)*100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-mono">
                    <span className="text-slate-400">Total System Revenue Target Progress</span>
                    <span className="text-red-400 font-semibold">₦{totalRevenueWon.toLocaleString()} / ₦{(business.monthlyTarget || 500000).toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.round((totalRevenueWon / (business.monthlyTarget || 500000)) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-850">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg text-center font-mono">
                    <p className="text-[10px] text-slate-500 uppercase font-black">Average LTV</p>
                    <p className="text-sm font-black text-white mt-1">₦{totalLeads ? Math.round(totalSystemLTV / totalLeads).toLocaleString() : 0}</p>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg text-center font-mono">
                    <p className="text-[10px] text-slate-500 uppercase font-black">Payments volume</p>
                    <p className="text-sm font-black text-rose-500 mt-1">₦{invoices.filter(i=>i.status==="Paid").reduce((s,i)=>s+i.amount,0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action panel toggle section */}
      {activeSubTab === "actions" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-5 h-5 text-red-500" /> Authorized Seed & Inbound Injection Deck
            </h3>
            <p className="text-xs text-slate-400 mt-1">Generate diagnostic data immediately inside local workspace arrays without scanning cellular QR codes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Seed Actions */}
            <div className="space-y-4">
              <p className="text-[10px] font-mono uppercase text-slate-400 font-semibold pb-1.5 border-b border-slate-800 tracking-wider">Inject Database Records</p>
              
              <button
                onClick={handleSeedWonDeal}
                className="w-full flex items-center justify-between p-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer text-left transition-colors group"
              >
                <div>
                  <p className="text-xs font-extrabold text-white group-hover:text-emerald-400">Directly Inject Win Event (₦15K - ₦100K)</p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5 leading-normal">Simulates marked status deal. Attaches immediate accounting revenue of random local figures to current customers.</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              <button
                onClick={handleSeedBulkClients}
                className="w-full flex items-center justify-between p-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer text-left transition-colors group"
              >
                <div>
                  <p className="text-xs font-extrabold text-white group-hover:text-yellow-400">Bulk Load 5 Inbound Customer Chats</p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5 leading-normal">Creates complex VIP/Regular contacts with synthetic long-form query message vectors under pending indices.</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            </div>

            {/* Warning Zone reset */}
            <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <AlertOctagon className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-black uppercase text-red-400 tracking-wider">Workspace Danger Zone</h4>
                  <p className="text-[11px] text-slate-400 leading-normal mt-1">
                    Direct access utilities that modify root configurations and wipe workspace diagnostic logs immediately from this browser's scope.
                  </p>
                </div>
              </div>

              {!showConfirmReset ? (
                <button
                  onClick={() => setShowConfirmReset(true)}
                  className="w-full py-2.5 bg-red-900/40 hover:bg-red-900 text-red-300 hover:text-white font-bold text-xs rounded-lg border border-red-800/40 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Reset Workspace Databases
                </button>
              ) : (
                <div className="space-y-2.5 animate-in fade-in duration-200">
                  <p className="text-[10.5px] font-mono text-amber-500 text-center font-bold">⚠️ Are you absolutely sure? This will wipe all chats, followups, teammates, and target scores!</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleClearWorkspaceData}
                      className="py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors"
                    >
                      Yes, Wipe Storage
                    </button>
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg cursor-pointer transition-colors"
                    >
                      Cancel Action
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Database Inspector Tab options */}
      {activeSubTab === "db-inspector" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-5 h-5 text-red-500" /> Unified LocalStorage JSON Auditor
              </h3>
              <p className="text-xs text-slate-400 mt-1">Directly view absolute raw structured state dumps stored in persistent sandbox tables.</p>
            </div>

            {/* Target table selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">DB Node:</span>
              <select
                value={inspectionTarget}
                onChange={(e) => setInspectionTarget(e.target.value as any)}
                className="bg-slate-950 text-slate-300 border border-slate-800 text-xs rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 font-bold"
              >
                <option value="business">lz_business (Company)</option>
                <option value="users">lz_users (Reps)</option>
                <option value="conversations">lz_conversations (Inbox)</option>
                <option value="revenue">lz_revenue (Ledger)</option>
                <option value="logs">lz_logs (Audit Trails)</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-850 text-xs">
              <span className="font-mono text-[10.5px] text-slate-500">Node Location: localStorage.getItem('{(inspectionTarget === "revenue" ? "revenue" : inspectionTarget === "business" ? "business" : inspectionTarget === "users" ? "users" : inspectionTarget === "conversations" ? "conversations" : "logs")}')</span>
              <span className="font-mono text-red-400 bg-red-950/30 border border-red-900/30 px-2 py-0.5 rounded text-[10px]">READ_ONLY</span>
            </div>
            
            <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-[360px] p-2 bg-slate-950 rounded-lg scrollbar-thin whitespace-pre-wrap leading-relaxed">
              {inspectionTarget === "business" && JSON.stringify(business, null, 2)}
              {inspectionTarget === "users" && JSON.stringify(users, null, 2)}
              {inspectionTarget === "conversations" && JSON.stringify(conversations, null, 2)}
              {inspectionTarget === "revenue" && JSON.stringify(revenueEvents, null, 2)}
              {inspectionTarget === "logs" && JSON.stringify(activityLogs, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Audit & Broadcast logs section */}
      {activeSubTab === "logs" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Broadcast Trigger */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1.5 flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" /> Deploy Global Broadcast
            </h3>
            <p className="text-xs text-slate-400 mb-6 font-medium">Broadcast alerts inject automated system messages directly into active rep thread panels for testing pipeline response.</p>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1.5">Announcement text</label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 font-semibold resize-none"
                  placeholder="e.g. Server maintenance scheduled in 10 minutes. Please save deal status updates."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                <Globe className="w-4 h-4 shrink-0" /> Fire Network Broadcast
              </button>
            </form>
          </div>

          {/* Audit Logs Tree */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-1.5 border-b border-slate-850">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 animate-pulse">
                <Globe className="w-4 p-0 text-red-500" /> Live Security Audit Logs
              </h3>
              <span className="text-[10px] font-mono text-slate-500 font-bold">Total Events: {activityLogs.length}</span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto scrollbar-thin">
              {activityLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl p-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
                          <span className="text-red-400 font-mono">[{log.action}]</span>
                          <span className="text-slate-200">by {log.userName}</span>
                        </div>
                        <p className={`text-[11px] text-slate-400 mt-1.5 leading-relaxed ${isExpanded ? "" : "truncate"}`}>
                          {log.details}
                        </p>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 shrink-0 mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="mt-3.5 pt-3.5 border-t border-slate-850/60 flex flex-col gap-1.5 text-[9.5px] font-mono text-slate-500 animate-in fade-in duration-200">
                        <p className="flex items-center gap-1">
                          <CornerDownRight className="w-3.5 h-3.5 text-slate-600 shrink-0" /> Unique Event ID: <code className="text-slate-300">{log.id}</code>
                        </p>
                        <p className="flex items-center gap-1">
                          <CornerDownRight className="w-3.5 h-3.5 text-slate-600 shrink-0" /> Trigger System Stamp: <code className="text-slate-300">{log.timestamp}</code>
                        </p>
                        <p className="flex items-center gap-1">
                          <CornerDownRight className="w-3.5 h-3.5 text-slate-600 shrink-0" /> Target Rep Identifier: <code className="text-slate-300">{log.userId}</code>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
