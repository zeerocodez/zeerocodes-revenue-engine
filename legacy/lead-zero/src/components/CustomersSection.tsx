/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Coins,
  MessageSquare,
  TrendingUp,
  X,
  User,
  Phone,
  Calendar,
  FileText,
  CheckCircle,
  HelpCircle,
  UserCheck,
  Download,
  ChevronDown,
  BarChart3,
  PieChart,
  Eye,
  EyeOff
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from "recharts";
import {
  Conversation,
  Contact,
  CustomerSegment,
  OutcomeStatus,
  User as Teammate,
  Message,
  ConversationStatus
} from "../types";

interface CustomersSectionProps {
  conversations: Conversation[];
  allUsers: Teammate[];
  onUpdateNotes: (chatId: string, notes: string[]) => void;
  onUpdateOutcome: (chatId: string, outcome: OutcomeStatus, amount?: number) => void;
  onAssignChat: (chatId: string, userId: string | undefined) => void;
  onUpdateContactSegment: (chatId: string, segment: CustomerSegment) => void;
  onAddNewCustomer: (name: string, phone: string, segment: CustomerSegment, initialNote: string) => void;
}

export default function CustomersSection({
  conversations,
  allUsers,
  onUpdateNotes,
  onUpdateOutcome,
  onAssignChat,
  onUpdateContactSegment,
  onAddNewCustomer
}: CustomersSectionProps) {
  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegment | "all">("all");
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"ltv" | "conversations" | "name" | "last_contact">("ltv");

  // Selected details panel state (defaulting to first match or null)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(
    conversations[0]?.id || null
  );

  // Note entry field state
  const [newNoteText, setNewNoteText] = useState("");

  // Add Customer modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSegment, setNewSegment] = useState<CustomerSegment>(CustomerSegment.REGULAR);
  const [newInitialNote, setNewInitialNote] = useState("");

  // Process data list
  const filteredChats = conversations.filter((chat) => {
    const contact = chat.contact;
    const nameMatch = contact.name.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = contact.phone.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Segment filter
    const segmentMatch = segmentFilter === "all" || contact.segment === segmentFilter;

    // Outcome filter
    const currentOutcome = chat.selectedOutcome || OutcomeStatus.PENDING;
    const outcomeMatch = outcomeFilter === "all" || currentOutcome === outcomeFilter;

    return (nameMatch || phoneMatch) && segmentMatch && outcomeMatch;
  });

  // Sort logic
  const sortedChats = [...filteredChats].sort((a, b) => {
    switch (sortBy) {
      case "ltv":
        return b.contact.totalLTV - a.contact.totalLTV;
      case "conversations":
        return b.contact.conversationCount - a.contact.conversationCount;
      case "name":
        return a.contact.name.localeCompare(b.contact.name);
      case "last_contact":
        return new Date(b.contact.lastContactDate).getTime() - new Date(a.contact.lastContactDate).getTime();
      default:
        return 0;
    }
  });

  // Active chat state
  const activeChat = sortedChats.find((c) => c.id === selectedChatId) || sortedChats[0] || null;

  // Add a quick handoff remark to active customer's list
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !newNoteText.trim()) return;

    const updatedNotes = [...activeChat.internalNotes, `${newNoteText.trim()} (Added on ${new Date().toLocaleDateString()})`];
    onUpdateNotes(activeChat.id, updatedNotes);
    setNewNoteText("");
  };

  // Create & assign manual customer lead
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    onAddNewCustomer(newName.trim(), newPhone.trim(), newSegment, newInitialNote.trim());
    
    // Reset states
    setNewName("");
    setNewPhone("");
    setNewSegment(CustomerSegment.REGULAR);
    setNewInitialNote("");
    setShowAddModal(false);
  };

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Name", "Phone", "Segment", "LTV_Amount", "Conversations_Count", "First_Contact", "Last_Contact", "Outcome_Stage", "Assigned_Agent"];
    const escapeCSV = (val: any) => {
      if (val === undefined || val === null) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = [
      headers.join(","),
      ...sortedChats.map(chat => [
        escapeCSV(chat.contact.name),
        escapeCSV(chat.contact.phone),
        escapeCSV(chat.contact.segment),
        escapeCSV(chat.contact.totalLTV),
        escapeCSV(chat.contact.conversationCount),
        escapeCSV(chat.contact.firstContactDate),
        escapeCSV(chat.contact.lastContactDate),
        escapeCSV(chat.selectedOutcome || "PENDING"),
        escapeCSV(chat.assignedTo ? `${chat.assignedTo.name} (${chat.assignedTo.role})` : "Unassigned")
      ].join(","))
    ];

    const csvContent = csvRows.join("\n");
    downloadFile(csvContent, `customer_pipeline_report_${new Date().toISOString().split("T")[0]}.csv`, "text/csv;charset=utf-8;");
    setShowExportDropdown(false);
  };

  const handleExportJSON = () => {
    const exportData = sortedChats.map(chat => ({
      id: chat.id,
      name: chat.contact.name,
      phone: chat.contact.phone,
      segment: chat.contact.segment,
      totalLTV: chat.contact.totalLTV,
      conversationCount: chat.contact.conversationCount,
      firstContactDate: chat.contact.firstContactDate,
      lastContactDate: chat.contact.lastContactDate,
      outcomeStage: chat.selectedOutcome || "PENDING",
      assignedAgent: chat.assignedTo ? {
        id: chat.assignedTo.id,
        name: chat.assignedTo.name,
        role: chat.assignedTo.role
      } : null,
      internalNotes: [...(chat.contact.notes || []), ...(chat.internalNotes || [])]
    }));

    const jsonContent = JSON.stringify(exportData, null, 2);
    downloadFile(jsonContent, `customer_pipeline_report_${new Date().toISOString().split("T")[0]}.json`, "application/json;charset=utf-8;");
    setShowExportDropdown(false);
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Aggregate global statistics for customer pipeline
  const totalLTV = conversations.reduce((acc, c) => acc + c.contact.totalLTV, 0);
  const vipCount = conversations.filter((c) => c.contact.segment === CustomerSegment.VIP).length;
  const wonCount = conversations.filter((c) => c.selectedOutcome === OutcomeStatus.WON).length;
  const pendingCount = conversations.filter(
    (c) => !c.selectedOutcome || c.selectedOutcome === OutcomeStatus.PENDING
  ).length;

  // Segment counts & financials distribution for Recharts Bar Chart
  const segmentData = [
    {
      name: "VIP",
      count: conversations.filter((c) => c.contact.segment === CustomerSegment.VIP).length,
      revenue: conversations
        .filter((c) => c.contact.segment === CustomerSegment.VIP)
        .reduce((sum, c) => sum + c.contact.totalLTV, 0),
      color: "#FBBF24" // Amber
    },
    {
      name: "Regular",
      count: conversations.filter((c) => c.contact.segment === CustomerSegment.REGULAR).length,
      revenue: conversations
        .filter((c) => c.contact.segment === CustomerSegment.REGULAR)
        .reduce((sum, c) => sum + c.contact.totalLTV, 0),
      color: "#10B981" // Emerald
    },
    {
      name: "One-Time",
      count: conversations.filter((c) => c.contact.segment === CustomerSegment.ONE_TIME).length,
      revenue: conversations
        .filter((c) => c.contact.segment === CustomerSegment.ONE_TIME)
        .reduce((sum, c) => sum + c.contact.totalLTV, 0),
      color: "#3B82F6" // Blue
    },
    {
      name: "Dormant",
      count: conversations.filter((c) => c.contact.segment === CustomerSegment.DORMANT).length,
      revenue: conversations
        .filter((c) => c.contact.segment === CustomerSegment.DORMANT)
        .reduce((sum, c) => sum + c.contact.totalLTV, 0),
      color: "#6B7280" // Gray
    }
  ];

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-4rem)] md:min-h-screen p-4 md:p-8 text-slate-100 overflow-y-auto pb-24 md:pb-8">
      
      {/* Header and Add Customer Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-black font-sans tracking-tight text-white flex items-center gap-2">
            <Users className="w-5.5 h-5.5 text-emerald-400" /> Customer Relationship Pipeline
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyze customer segments, track handoff logs, monitor lifecycle values (LTV), and handle agent assignments.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap relative">
          {/* Export Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-300 border border-slate-800 font-sans font-bold text-xs px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Export List</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showExportDropdown ? "rotate-180" : ""}`} />
            </button>

            {showExportDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowExportDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1 border-b border-slate-850 mb-1">
                    <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider block">Filtered: {sortedChats.length} accounts</span>
                  </div>
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-850 flex items-center gap-2 cursor-pointer font-medium transition-colors border-none"
                  >
                    <span className="text-emerald-400 font-mono font-black">CSV</span> Export as CSV (.csv)
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-850 flex items-center gap-2 cursor-pointer font-medium transition-colors border-none"
                  >
                    <span className="text-yellow-500 font-mono font-black">JSON</span> Export as JSON (.json)
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-300 border border-slate-800 font-sans font-bold text-xs px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors"
          >
            {showAnalytics ? (
              <>
                <EyeOff className="w-4.5 h-4.5 text-slate-400" />
                <span>Hide Analytics</span>
              </>
            ) : (
              <>
                <BarChart3 className="w-4.5 h-4.5 text-emerald-400" />
                <span>Customer Analytics</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-sans font-black text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-lg transition-transform hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4" /> Add Lead / Customer
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider">Total Customers</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl md:text-2xl font-black text-white font-mono">{conversations.length}</p>
          <span className="text-[9px] text-slate-500 font-mono">Syncing active WhatsApp streams</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider">Cumulative Pipeline Value</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl md:text-2xl font-black text-white font-mono">₦{totalLTV.toLocaleString()}</p>
          <span className="text-[9px] text-emerald-400 font-mono font-bold">LTV from Won Accounts</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider">VIP Accounts</span>
            <UserCheck className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-xl md:text-2xl font-black text-white font-mono">{vipCount}</p>
          <span className="text-[9px] text-slate-400 font-mono">{Math.round((vipCount / (conversations.length || 1)) * 100)}% of total accounts</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider">Converted Ratio (Won)</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl md:text-2xl font-black text-white font-mono">{wonCount}</p>
          <span className="text-[9px] text-slate-500 font-mono">{pendingCount} pending negotiations</span>
        </div>
      </div>

      {/* Customer Analytics section */}
      {showAnalytics && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-850">
            <div>
              <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" /> Customer Segment Allocation & Wealth Clusters
              </h3>
              <p className="text-[11px] text-slate-400">
                Visualizing how accounts are distributed across different active tier segments and total deal contribution.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-slate-400">Live Workspace Distribution Matrix</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Chart Area */}
            <div className="lg:col-span-8 bg-slate-950 p-4 rounded-2xl border border-slate-850/60">
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={segmentData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={11}
                      fontFamily="monospace"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      fontFamily="monospace"
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl">
                              <p className="font-extrabold text-xs text-white uppercase tracking-wide flex items-center gap-1.5 pb-1 border-b border-slate-850 mb-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                                {data.name} Clients
                              </p>
                              <div className="space-y-1.5 text-[10px] font-mono">
                                <p className="text-slate-400">
                                  Volume: <strong className="text-white text-xs">{data.count} accounts</strong>
                                </p>
                                <p className="text-slate-400">
                                  Combined Value: <strong className="text-emerald-400 text-xs">₦{data.revenue.toLocaleString()}</strong>
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {segmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* List and Explanatory Legend */}
            <div className="lg:col-span-4 space-y-4">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-1 flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-emerald-400" /> Segment Concentration Stats
                </h4>
                <p className="text-[10px] text-slate-500">
                  Detailed analysis of customer levels across your entire WhatsApp CRM space.
                </p>
              </div>

              <div className="space-y-2 max-h-[190px] overflow-y-auto scrollbar-thin">
                {segmentData.map((seg) => {
                  const totalCountOfSegments = conversations.length || 1;
                  const percentOfPlatform = Math.round((seg.count / totalCountOfSegments) * 100);
                  
                  return (
                    <div key={seg.name} className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl flex items-center justify-between gap-4 transition-colors hover:border-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 truncate">{seg.name} Clients</p>
                          <p className="text-[9px] text-slate-500 font-mono">₦{seg.revenue.toLocaleString()} active value</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-white font-mono">{seg.count} lead{seg.count !== 1 ? "s" : ""}</p>
                        <p className="text-[9px] text-slate-400 font-mono font-bold mt-0.5">{percentOfPlatform}% share</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and sorting control toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-xs">
          
          {/* Left search */}
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by client name, number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-805 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Right selections filters */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            
            {/* Segment filter select */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-850">
              <span className="text-[10px] font-mono font-bold text-slate-500">Segment:</span>
              <select
                aria-label="Filter segment"
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value as any)}
                className="bg-transparent border-none text-[11px] font-bold text-slate-300 outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-slate-950 text-slate-300">All</option>
                <option value={CustomerSegment.VIP} className="bg-slate-950 text-slate-300">VIP</option>
                <option value={CustomerSegment.REGULAR} className="bg-slate-950 text-slate-300">Regular</option>
                <option value={CustomerSegment.ONE_TIME} className="bg-slate-950 text-slate-300">One-Time</option>
                <option value={CustomerSegment.DORMANT} className="bg-slate-950 text-slate-300">Dormant</option>
              </select>
            </div>

            {/* Stage filter select */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-850">
              <span className="text-[10px] font-mono font-bold text-slate-500">Stage:</span>
              <select
                aria-label="Filter state"
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value as any)}
                className="bg-transparent border-none text-[11px] font-bold text-slate-300 outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-slate-950 text-slate-300">All Stages</option>
                <option value={OutcomeStatus.WON} className="bg-slate-950 text-slate-300">Won</option>
                <option value={OutcomeStatus.PENDING} className="bg-slate-950 text-slate-300">Pending</option>
                <option value={OutcomeStatus.NURTURE} className="bg-slate-950 text-slate-300">Nurture</option>
                <option value={OutcomeStatus.LOST} className="bg-slate-950 text-slate-300">Lost</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-850">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] font-mono font-bold text-slate-500">Sort By:</span>
              <select
                aria-label="Sort parameter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none text-[11px] font-bold text-slate-300 outline-none cursor-pointer pr-1"
              >
                <option value="last_contact" className="bg-slate-950 text-slate-300">Most Recent</option>
                <option value="ltv" className="bg-slate-950 text-slate-300">Highest LTV</option>
                <option value="name" className="bg-slate-950 text-slate-300">A-Z</option>
                <option value="conversations" className="bg-slate-950 text-slate-300">Conversations Stream</option>
              </select>
            </div>

          </div>

        </div>
      </div>

      {/* Dual Layout for Workspace: Left is Detailed list, Right is selected customer pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column customers list */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-850 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Pipeline Leads Indexed ({sortedChats.length})</h3>
            <span className="text-[10px] font-mono text-slate-500">Filtered view</span>
          </div>

          <div className="divide-y divide-slate-850 max-h-[500px] overflow-y-auto scrollbar-thin">
            {sortedChats.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No pipeline records found matches current search params.
              </div>
            ) : (
              sortedChats.map((chat) => {
                const con = chat.contact;
                const isSelected = activeChat && activeChat.id === chat.id;
                const activeOutcome = chat.selectedOutcome || OutcomeStatus.PENDING;

                // Color mapping for dynamic outcome
                let outcomeStyles = "bg-yellow-950/40 text-yellow-500 border-yellow-905";
                if (activeOutcome === OutcomeStatus.WON) {
                  outcomeStyles = "bg-emerald-950/40 text-emerald-400 border-emerald-905";
                } else if (activeOutcome === OutcomeStatus.LOST) {
                  outcomeStyles = "bg-red-950/40 text-red-400 border-red-905";
                } else if (activeOutcome === OutcomeStatus.NURTURE) {
                  outcomeStyles = "bg-indigo-950/40 text-indigo-400 border-indigo-905";
                }

                return (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`p-4 flex items-center justify-between transition-all cursor-pointer select-none ${
                      isSelected
                        ? "bg-slate-850/50 border-l-4 border-emerald-500"
                        : "hover:bg-slate-850/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center relative shrink-0">
                        {con.avatarUrl ? (
                          <img
                            src={con.avatarUrl}
                            alt={con.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-slate-500" />
                        )}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-900 ${
                          con.segment === CustomerSegment.VIP ? "bg-amber-400" : "bg-slate-500"
                        }`} />
                      </div>

                      {/* Name & Contact Details info */}
                      <div>
                        <p className="font-bold text-xs text-slate-100">{con.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-slate-500" /> {con.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {/* LTV & Segment Badge */}
                      <span className="text-xs font-mono font-bold text-white">₦{con.totalLTV.toLocaleString()}</span>
                      
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] font-black uppercase tracking-wider border rounded px-1.5 py-0.5 ${outcomeStyles}`}>
                          {activeOutcome}
                        </span>
                        
                        <span className="bg-slate-950 text-slate-400 border border-slate-850 text-[9px] px-1.5 py-0.5 rounded font-bold font-sans">
                          {con.segment}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column Selected Customer Details Workspace Panel */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-hidden">
          {activeChat ? (
            <div className="space-y-5">
              
              {/* Profile card Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-850">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    {activeChat.contact.avatarUrl ? (
                      <img
                        src={activeChat.contact.avatarUrl}
                        alt={activeChat.contact.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white leading-tight">{activeChat.contact.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono tracking-tight">{activeChat.contact.phone}</p>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">Contact Created: {new Date(activeChat.contact.firstContactDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="bg-slate-950 text-emerald-400 border border-emerald-950/40 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold">
                    LTV: ₦{activeChat.contact.totalLTV.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Dynamic Action dropdown assignments details */}
              <div className="grid grid-cols-2 gap-3.5 bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                
                {/* Segment Selector update */}
                <div>
                  <label htmlFor="customer-segment-select" className="text-[9px] font-mono tracking-wider text-slate-500 block mb-1 uppercase font-bold">Client Segment</label>
                  <select
                    id="customer-segment-select"
                    value={activeChat.contact.segment}
                    onChange={(e) => onUpdateContactSegment(activeChat.id, e.target.value as CustomerSegment)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-xs py-1 px-1.5 focus:ring-1 focus:ring-emerald-500 rounded outline-none font-semibold cursor-pointer"
                  >
                    <option value={CustomerSegment.VIP}>VIP Account</option>
                    <option value={CustomerSegment.REGULAR}>Regular</option>
                    <option value={CustomerSegment.ONE_TIME}>One-time Client</option>
                    <option value={CustomerSegment.DORMANT}>Dormant</option>
                  </select>
                </div>

                {/* Pipeline outcome selector update */}
                <div>
                  <label htmlFor="pipeline-outcome-select" className="text-[9px] font-mono tracking-wider text-slate-500 block mb-1 uppercase font-bold">Pipeline Deal Stage</label>
                  <select
                    id="pipeline-outcome-select"
                    value={activeChat.selectedOutcome || OutcomeStatus.PENDING}
                    onChange={(e) => {
                      const outcomeVal = e.target.value as OutcomeStatus;
                      // Prompt simulation or default value for Won Deal
                      const dealAmount = outcomeVal === OutcomeStatus.WON ? (activeChat.revenueAmount || 15000) : 0;
                      onUpdateOutcome(activeChat.id, outcomeVal, dealAmount);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-xs py-1 px-1.5 focus:ring-1 focus:ring-emerald-500 rounded outline-none font-semibold cursor-pointer"
                  >
                    <option value={OutcomeStatus.PENDING}>Pending</option>
                    <option value={OutcomeStatus.WON}>Won (Register Revenue)</option>
                    <option value={OutcomeStatus.LOST}>Lost Deal</option>
                    <option value={OutcomeStatus.NURTURE}>Nurture Callback</option>
                  </select>
                </div>

                {/* Agent Selector assigned mapping */}
                <div className="col-span-2 border-t border-slate-850/60 pt-2.5">
                  <label htmlFor="teammate-assign-select" className="text-[9px] font-mono tracking-wider text-slate-500 block mb-1 uppercase font-bold">Assigned Sales Agent</label>
                  <select
                    id="teammate-assign-select"
                    value={activeChat.assignedTo?.id || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      onAssignChat(activeChat.id, val === "" ? undefined : val);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-xs py-1 px-1.5 focus:ring-1 focus:ring-emerald-500 rounded outline-none font-semibold cursor-pointer"
                  >
                    <option value="">Unassigned (Catch pool)</option>
                    {allUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Hand-off notes timeline list of action logs */}
              <div>
                <span className="text-[9px] font-mono font-black tracking-wider text-slate-500 uppercase block mb-2.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Internal Handoff Remarks
                </span>

                <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin mb-3.5">
                  {/* Combines both contact notes array and chat internal notes */}
                  {[...(activeChat.contact.notes || []), ...(activeChat.internalNotes || [])].map((noteStr, idx) => (
                    <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-[11px] leading-relaxed text-slate-300 flex items-start gap-1.5">
                      <span className="text-emerald-505 font-mono text-[9px] shrink-0 mt-0.5">•</span>
                      <span>{noteStr}</span>
                    </div>
                  ))}

                  {[...(activeChat.contact.notes || []), ...(activeChat.internalNotes || [])].length === 0 && (
                    <p className="text-slate-500 text-[10px] italic p-2 bg-slate-950 rounded-xl text-center">
                      No internal sales notes log captured for {activeChat.contact.name}.
                    </p>
                  )}
                </div>

                {/* Inline notes addition form */}
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    aria-label="Add sales remark"
                    type="text"
                    required
                    placeholder="Type urgent customer remark or deal update..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-805 rounded-lg text-xs p-2 focus:outline-none focus:border-emerald-500 text-slate-300"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-3.5 py-2.5 rounded-lg cursor-pointer shrink-0 transition-colors"
                  >
                    Save Note
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <User className="w-12 h-12 mb-3 text-slate-700" />
              <p className="text-xs">Select or add a contact client to view deep profiles.</p>
            </div>
          )}
        </div>

      </div>

      {/* Manual customer insertion modal popup form */}
      {showAddModal && (
        <div id="add-customer-overlay" className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-55 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative overflow-hidden">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-850 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wide">Add Custom Pipeline Deal</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label htmlFor="customer-name-input" className="block text-[9px] font-mono uppercase text-slate-500 mb-1 font-extrabold">Full Name</label>
                <input
                  id="customer-name-input"
                  type="text"
                  required
                  placeholder="e.g. Aliko Dangote"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="customer-phone-input" className="block text-[9px] font-mono uppercase text-slate-500 mb-1 font-extrabold">WhatsApp Phone Number</label>
                <input
                  id="customer-phone-input"
                  type="text"
                  required
                  placeholder="e.g. +234 803 000 1111"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="modal-segment-select" className="block text-[9px] font-mono uppercase text-slate-500 mb-1 font-extrabold">Initial Segment Tier</label>
                <select
                  id="modal-segment-select"
                  value={newSegment}
                  onChange={(e) => setNewSegment(e.target.value as CustomerSegment)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 font-semibold cursor-pointer"
                >
                  <option value={CustomerSegment.VIP}>VIP Account</option>
                  <option value={CustomerSegment.REGULAR}>Regular</option>
                  <option value={CustomerSegment.ONE_TIME}>One-time</option>
                  <option value={CustomerSegment.DORMANT}>Dormant</option>
                </select>
              </div>

              <div>
                <label htmlFor="customer-note-input" className="block text-[9px] font-mono uppercase text-slate-500 mb-1 font-extrabold">Deal Notes / Requirements</label>
                <textarea
                  id="customer-note-input"
                  rows={3}
                  placeholder="Specify land size, luxury apartments parameters, budget ranges, or cleaning requests..."
                  value={newInitialNote}
                  onChange={(e) => setNewInitialNote(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                >
                  Create Lead Contact
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
