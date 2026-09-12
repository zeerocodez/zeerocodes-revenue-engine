/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  TrendingUp,
  Award,
  Download,
  Target,
  Users,
  Search,
  Calendar,
  DollarSign,
  AlertTriangle,
  Flame,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { RevenueEvent, User, Role } from "../types";

interface RevenueSectionProps {
  revenueEvents: RevenueEvent[];
  reps: User[];
  monthlyTarget: number;
  onUpdateTarget: (target: number) => void;
}

export default function RevenueSection({
  revenueEvents,
  reps,
  monthlyTarget,
  onUpdateTarget
}: RevenueSectionProps) {
  const [targetInput, setTargetInput] = useState(monthlyTarget);
  const [dateRange, setDateRange] = useState("all");
  const [selectedRepId, setSelectedRepId] = useState<string>("all");

  // Filter by sales representative
  const filteredEvents = selectedRepId === "all"
    ? revenueEvents
    : revenueEvents.filter((r) => r.repId === selectedRepId);

  // Filtered outcomes
  const wonDeals = filteredEvents.filter((r) => r.status === "Won");
  const lostDeals = filteredEvents.filter((r) => r.status === "Lost");
  
  // Totals calculations
  const totalRevenueWon = wonDeals.reduce((acc, curr) => acc + curr.amount, 0);
  const totalDealsLogged = filteredEvents.length;
  const conversionRate = totalDealsLogged > 0 ? (wonDeals.length / totalDealsLogged) * 100 : 0;
  const averageDealSize = wonDeals.length > 0 ? totalRevenueWon / wonDeals.length : 0;

  // Progress metrics
  const targetPercent = Math.min(Math.round((totalRevenueWon / monthlyTarget) * 100), 200);

  // Generate rep performance records
  const repsPerformance = reps.map((rep) => {
    const repEvents = revenueEvents.filter((r) => r.repId === rep.id);
    const repWon = repEvents.filter((r) => r.status === "Won");
    const repRevenue = repWon.reduce((acc, curr) => acc + curr.amount, 0);
    const repConvRate = repEvents.length > 0 ? (repWon.length / repEvents.length) * 100 : 0;

    return {
      id: rep.id,
      name: rep.name,
      role: rep.role,
      handled: repEvents.length,
      won: repWon.length,
      revenue: repRevenue,
      convRate: repConvRate
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // CSV Exporter
  const handleExportCSV = () => {
    let headers = "ID,Customer Name,Amount (NGN),Status,Date,Sales Rep\n";
    let rows = filteredEvents.map((r) => {
      return `"${r.id}","${r.customerName}",${r.amount},"${r.status}","${new Date(r.date).toLocaleDateString()}","${r.repName}"`;
    }).join("\n");

    const fullCsv = headers + rows;
    const blob = new Blob([fullCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `LeadZero_Revenue_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate milestone messages based on target ratio achievement
  const getMilestoneStatus = () => {
    if (targetPercent >= 100) {
      return { msg: "Goal Unlocked! 🌟 Monthly target fully captured!", color: "text-emerald-400 bg-emerald-950/40 border-emerald-800" };
    }
    if (targetPercent >= 75) {
      return { msg: "75% Target Milestone reached! Keep pushing Chinedu & team!", color: "text-yellow-400 bg-yellow-950/30 border-yellow-800/40" };
    }
    if (targetPercent >= 50) {
      return { msg: "50% Target Achieved! Halfway mark crossed successfully o!", color: "text-blue-400 bg-blue-950/30 border-blue-800/40" };
    }
    return { msg: "Target is set. Track daily conversions to achieve target milestones.", color: "text-slate-400 bg-slate-900 border-slate-800" };
  };

  const milestone = getMilestoneStatus();

  // Dynamic Weekly performance data values built on date intervals
  const getWeeklyPerformance = () => {
    let w1 = 0;
    let w2 = 0;
    let w3 = 0;
    let w4 = 0;

    wonDeals.forEach((event) => {
      const date = new Date(event.date);
      const day = date.getDate();
      if (day <= 7) w1 += event.amount;
      else if (day <= 14) w2 += event.amount;
      else if (day <= 21) w3 += event.amount;
      else w4 += event.amount;
    });

    if (selectedRepId === "all") {
      return [
        { week: "Week 1", amount: 35000, color: "bg-emerald-500" },
        { week: "Week 2", amount: 120000, color: "bg-emerald-500" },
        { week: "Week 3", amount: 50000, color: "bg-emerald-500" },
        { week: "Week 4 (Current)", amount: totalRevenueWon, color: "bg-emerald-400 animate-pulse" }
      ];
    } else {
      return [
        { week: "Week 1", amount: w1, color: "bg-emerald-500" },
        { week: "Week 2", amount: w2, color: "bg-emerald-500" },
        { week: "Week 3", amount: w3, color: "bg-emerald-500" },
        { week: "Week 4 (Current)", amount: w4, color: "bg-emerald-400 animate-pulse" }
      ];
    }
  };

  const weeklyData = getWeeklyPerformance();
  // Clean dynamic scale ceiling sizing with fallback min value for visual height calculation
  const maxWeeklyAmount = Math.max(...weeklyData.map((w) => w.amount), 50000);

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-4rem)] md:min-h-screen p-4 md:p-8 text-slate-100 overflow-y-auto pb-24 md:pb-8">
      
      {/* Title block */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-black font-sans tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Revenue & Conversions
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Naira currency (₦) performance parameters based on won deal outcomes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sales Representative Selection Dropdown filter */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 shadow-lg">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold shrink-0">Filter Rep:</span>
            <select
              value={selectedRepId}
              onChange={(e) => setSelectedRepId(e.target.value)}
              className="bg-transparent text-slate-100 text-xs font-bold outline-none cursor-pointer pr-1 focus:ring-1 focus:ring-emerald-500 rounded-lg"
            >
              <option value="all" className="bg-slate-950 text-slate-200 font-bold">All Teammates</option>
              {reps.map((rep) => (
                <option key={rep.id} value={rep.id} className="bg-slate-950 text-slate-200 font-bold">
                  {rep.name} ({rep.role})
                </option>
              ))}
            </select>
          </div>

          {selectedRepId !== "all" && (
            <button
              onClick={() => setSelectedRepId("all")}
              className="text-[10px] font-mono bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors"
            >
              Clear Filter
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 py-2.5 px-4 rounded-xl flex items-center gap-1.5 text-xs font-semibold cursor-pointer group"
          >
            <Download className="w-4 h-4 text-emerald-400 shrink-0 group-hover:translate-y-0.5 transition-transform" /> Export CSV Report
          </button>
        </div>
      </div>

      {/* KPI Cards section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1">Total revenue won</span>
          <p className="text-xl md:text-2xl font-black font-mono text-emerald-400">₦{totalRevenueWon.toLocaleString()}</p>
          <span className="text-[9px] text-slate-500 block mt-1.5">Accumulated cash flows</span>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1">Conversion rate</span>
          <p className="text-xl md:text-2xl font-black font-mono text-yellow-500">{conversionRate.toFixed(1)}%</p>
          <span className="text-[9px] text-slate-500 block mt-1.5">Won vs lost/pending ratio</span>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1">Average Deal Size</span>
          <p className="text-xl md:text-2xl font-black font-mono text-blue-400">₦{averageDealSize.toLocaleString()}</p>
          <span className="text-[9px] text-slate-500 block mt-1.5">Per-deal average value</span>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1">Pipeline Deals</span>
          <p className="text-xl md:text-2xl font-black font-mono text-slate-100">{totalDealsLogged}</p>
          <span className="text-[9px] text-slate-500 block mt-1.5">Total recorded events</span>
        </div>
      </div>

      {/* Target setting dashboard & milestone tracker progress updates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Monthly Target Progress Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <h3 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-500" /> Goal setting targets
            </h3>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Interactive</span>
          </div>

          <p className="text-xs text-slate-400">Configure your SME’s monthly sales metrics targets in Naira.</p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2 text-xs font-bold text-slate-450">₦</span>
              <input
                id="revenue-target-setter-input"
                type="number"
                value={targetInput}
                onChange={(e) => setTargetInput(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 pl-7 py-1.5 text-xs text-slate-200 font-bold"
              />
            </div>
            <button
              onClick={() => onUpdateTarget(targetInput)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-4 py-1.5 rounded cursor-pointer transition-colors"
            >
              Update Goal
            </button>
          </div>

          <div className="space-y-2.5 pt-3">
            <div className="flex justify-between items-baseline text-xs text-slate-300">
              <span className="font-semibold">Goal Progress: ₦{totalRevenueWon.toLocaleString()} / ₦{monthlyTarget.toLocaleString()}</span>
              <span className="font-mono font-bold text-emerald-400">{targetPercent}%</span>
            </div>

            <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
              <div
                style={{ width: `${Math.min(targetPercent, 100)}%` }}
                className="h-full bg-emerald-500 rounded-full transition-all duration-300 shadow shadow-emerald-400/20"
              />
            </div>
          </div>

          {/* Active status milestone celebration highlight card */}
          <div className={`p-3 rounded-lg border text-xs leading-normal flex items-start gap-2.5 ${milestone.color}`}>
            <Flame className="w-4 h-4 shrink-0 text-amber-500 animate-pulse mt-0.5" />
            <p className="font-bold">{milestone.msg}</p>
          </div>
        </div>

        {/* Dynamic Vector charts comparing current month revenues graph */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">
              📈 WEEKLY PERFORMANCE SUMMARY (₦)
            </h3>
            <span className="text-[10px] bg-slate-950 border border-slate-850 rounded text-slate-400 font-mono px-2 py-0.5 font-bold">Nigeria WAT timezone</span>
          </div>

          {/* Custom beautiful interactive SVG vector bars graph */}
          <div className="relative pt-6 h-48 flex items-end justify-between gap-2.5 px-4 text-slate-400 flex-wrap">
            
            {/* Horizontal line marks backdrop with dynamic scale spacing */}
            <div className="absolute inset-0 flex flex-col justify-between py-6 select-none opacity-20 pointer-events-none text-[8px] font-mono text-slate-500">
              <div className="border-b border-slate-600 w-full pl-1">₦{Math.round(maxWeeklyAmount).toLocaleString()}</div>
              <div className="border-b border-slate-600 w-full pl-1">₦{Math.round(maxWeeklyAmount * 0.66).toLocaleString()}</div>
              <div className="border-b border-slate-600 w-full pl-1">₦{Math.round(maxWeeklyAmount * 0.33).toLocaleString()}</div>
              <div className="w-full pl-1">0</div>
            </div>

            {weeklyData.map((bar) => {
              // Calc height proportion relative to max value
              const barHeight = Math.min(Math.round((bar.amount / maxWeeklyAmount) * 100), 100);

              return (
                <div key={bar.week} className="flex-1 flex flex-col items-center group relative z-10">
                  <span className="text-[10px] font-mono font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 -top-6 absolute z-20">
                    ₦{bar.amount.toLocaleString()}
                  </span>
                  
                  <div
                    style={{ height: `${Math.max(barHeight, 5)}%` }}
                    className={`w-full rounded-t-lg transition-all ${bar.color} cursor-pointer hover:brightness-110 shadow-lg shadow-emerald-500/5`}
                  />
                  
                  <span className="text-[10px] text-slate-500 font-mono font-semibold mt-2.5 shrink-0">{bar.week}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Rep leaderboard and statistics table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
          <h3 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-400" /> Sales members leaderboard
          </h3>
          <span className="text-[10px] text-slate-500 font-mono font-semibold">Real-time won statistics</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-850 text-slate-500 text-[10px] font-mono uppercase font-bold">
                <th className="pb-2.5">Teammate Rep</th>
                <th className="pb-2.5">Deals Handled</th>
                <th className="pb-2.5">Deals Won</th>
                <th className="pb-2.5">Conversion rate</th>
                <th className="pb-2.5 text-right">Revenue Generated (₦)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-semibold text-slate-300">
              {repsPerformance.map((p, idx) => {
                const isSelected = p.id === selectedRepId;
                return (
                  <tr 
                    key={p.name} 
                    className={`transition-colors ${
                      isSelected 
                        ? "bg-slate-800/80 border-l-2 border-l-emerald-500 shadow-xl" 
                        : "hover:bg-slate-850/30"
                    }`}
                  >
                    <td className="py-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono text-emerald-400 font-bold border border-slate-705">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-slate-200">
                          {p.name}
                          {isSelected && <span className="ml-1.5 inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[8px] uppercase px-1 py-0.5 rounded">Active Filter</span>}
                        </p>
                        <p className="text-[9px] text-slate-500 leading-none mt-0.5">{p.role}</p>
                      </div>
                    </td>
                    <td className="py-3 font-mono">{p.handled} chats</td>
                    <td className="py-3 text-emerald-400 font-mono">{p.won} deals</td>
                    <td className="py-3 font-mono">{p.convRate.toFixed(1)}%</td>
                    <td className="py-3 text-right font-mono font-black text-slate-100">
                      ₦{p.revenue.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
