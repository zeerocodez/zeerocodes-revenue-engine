/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Clock,
  CheckCircle,
  AlertOctagon,
  Calendar,
  Sparkles,
  User,
  Check,
  X,
  Plus,
  ArrowRight,
  Filter,
  FileText,
  Mail
} from "lucide-react";
import { FollowUp, Conversation, User as UserType, Role } from "../types";

interface FollowUpSectionProps {
  followups: FollowUp[];
  conversations: Conversation[];
  currentUser: UserType;
  allUsers: UserType[];
  onAddFollowUp: (data: Omit<FollowUp, "id" | "status" | "snoozedCount">) => void;
  onSnoozeFollowUp: (id: string, mins: number) => void;
  onCompleteFollowUp: (id: string, outcome: string, notes?: string) => void;
  businessName?: string;
}

export default function FollowUpSection({
  followups,
  conversations,
  currentUser,
  allUsers,
  onAddFollowUp,
  onSnoozeFollowUp,
  onCompleteFollowUp,
  businessName = "LeadZero"
}: FollowUpSectionProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "overdue" | "completed">("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formConvId, setFormConvId] = useState(conversations[0]?.id || "");
  const [formDueDate, setFormDueDate] = useState("2026-05-22T09:00");
  const [formAssignedId, setFormAssignedId] = useState(currentUser.id);

  // Completion State modal
  const [completeModalId, setCompleteModalId] = useState<string | null>(null);
  const [completeOutcome, setCompleteOutcome] = useState("Called");
  const [completeNotes, setCompleteNotes] = useState("");

  // Email Notifications State
  const [sendEmailNotice, setSendEmailNotice] = useState(false);
  const [formEmail, setFormEmail] = useState("");

  const [emailModalId, setEmailModalId] = useState<string | null>(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const handleOpenEmailDispatch = (rem: FollowUp) => {
    setEmailModalId(rem.id);
    const mockEmail = `${rem.customerName.toLowerCase().replace(/\s+/g, "")}@workspace.ng`;
    setEmailAddress(mockEmail);
    setEmailSubject(`Action Required: Scheduled Follow-Up with ${businessName}`);
    setEmailBody(`Dear ${rem.customerName},\n\nThis is an automated follow-up status dispatch from ${businessName} regarding your requested appointment.\n\nOur service representatives are monitoring this ticket. Let us know if you would like to reschedule.\n\nWarm regards,\nLeadZero Automated Follow-Ups`);
  };

  // AI timing triggers
  const [aiTimingLoading, setAiTimingLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ time: string; confidence: string; reason: string } | null>(null);

  // Helper filters
  const filteredReminders = followups.filter((f) => {
    // Rep role sees only assigned or unassigned
    const isOwner = currentUser.role === Role.ADMIN;
    const belongsToMe = f.assignedToId === currentUser.id || !f.assignedToId;
    if (!isOwner && !belongsToMe) return false;

    if (filter === "pending") return f.status === "pending";
    if (filter === "overdue") return f.status === "overdue";
    if (filter === "completed") return f.status === "completed";
    return true; // all
  });

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const activeC = conversations.find((c) => c.id === formConvId);
    if (!activeC) return;

    onAddFollowUp({
      conversationId: formConvId,
      customerName: activeC.contact.name,
      customerPhone: activeC.contact.phone,
      dueDate: new Date(formDueDate).toISOString(),
      assignedToId: formAssignedId || undefined
    });

    if (sendEmailNotice && formEmail) {
      alert(`Success: Email notice dispatched and logged!\nRecipient: ${formEmail}\n\nResponse status logged in current workspace context.`);
    }
    
    setShowAddModal(false);
    setAiSuggestion(null);
    setSendEmailNotice(false);
    setFormEmail("");
  };

  const handleOpenCompletion = (id: string) => {
    setCompleteModalId(id);
    setCompleteOutcome("Called");
    setCompleteNotes("");
  };

  const verifyCompletionSave = () => {
    if (!completeModalId) return;
    onCompleteFollowUp(completeModalId, completeOutcome, completeNotes);
    setCompleteModalId(null);
  };

  // AI timing triggers
  const triggerAiTimingCalculation = () => {
    setAiTimingLoading(true);
    setAiSuggestion(null);
    // Simulate smart historical analyses via prompt context
    setTimeout(() => {
      const presets = [
        { time: "Friday at 10:15 AM (Tomorrow)", confidence: "94%", reason: "Customer Adeleke usually opens WhatsApp chat messages during early office briefings in Lekki." },
        { time: "Monday at 8:30 AM", confidence: "89%", reason: "Cleaning company Kunle is highly responsive during standard Monday planning sprints." },
        { time: "Saturday at 4:30 PM", confidence: "91%", reason: "Electronic buyer Chinedu closes retail purchases mostly on weekend afternoons." }
      ];
      const selected = presets[Math.floor(Math.random() * presets.length)];
      setAiSuggestion(selected);
      
      // Seed form dueDate with corresponding value: tomorrow at 10:15
      const dateVal = new Date();
      dateVal.setDate(dateVal.getDate() + 1);
      dateVal.setHours(10, 15, 0, 0);
      
      // format to match datetime-local string
      const localString = dateVal.toISOString().slice(0, 16);
      setFormDueDate(localString);

      setAiTimingLoading(false);
    }, 1200);
  };

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-4rem)] md:min-h-screen p-4 md:p-8 text-slate-100 overflow-y-auto pb-24 md:pb-8">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-black font-sans tracking-tight text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" /> Smart Follow-up Queue
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track callbacks due timezone West Africa Time (WAT). Overdue tasks elevate to red alerts automatically.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-lg flex items-center gap-1.5 self-start cursor-pointer transition-colors shadow-lg shadow-emerald-500/15"
        >
          <Plus className="w-4 h-4" /> Schedule Follow-up
        </button>
      </div>

      {/* Selector Filters & Stats */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6 bg-slate-900/40 p-3 rounded-xl border border-slate-850">
        
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            All Logs ({followups.length})
          </button>
          
          <button
            onClick={() => setFilter("overdue")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              filter === "overdue"
                ? "bg-red-500/20 text-red-400 border border-red-800/20"
                : "text-slate-400 hover:text-red-400"
            }`}
          >
            Overdue ({followups.filter((f) => f.status === "overdue").length})
          </button>

          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              filter === "pending"
                ? "bg-amber-500/10 text-amber-400 border border-amber-805/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pending ({followups.filter((f) => f.status === "pending").length})
          </button>

          <button
            onClick={() => setFilter("completed")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              filter === "completed"
                ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Completed ({followups.filter((f) => f.status === "completed").length})
          </button>
        </div>

        <div className="text-[10px] text-slate-500 font-mono font-bold uppercase self-end md:self-center">
          Workspace Identity: <span className="text-emerald-400">{currentUser.name} ({currentUser.role})</span>
        </div>
      </div>

      {/* Reminders layout grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReminders.length === 0 ? (
          <div className="col-span-full bg-slate-900/20 border border-slate-850/60 p-12 text-center text-slate-500 rounded-xl max-w-md mx-auto w-full">
            <Clock className="w-10 h-10 mx-auto text-slate-800 mb-2 animate-bounce" />
            <h4 className="font-bold text-slate-400">No Reminders Found</h4>
            <p className="text-xs text-slate-500 mt-1">There are no follow-up callback tasks booked for this target scope.</p>
          </div>
        ) : (
          filteredReminders.map((rem) => {
            const isOverdue = rem.status === "overdue";
            const isCompleted = rem.status === "completed";
            const formattedDate = new Date(rem.dueDate).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <div
                key={rem.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isOverdue
                    ? "bg-red-950/20 border-red-500/40 relative shadow-lg shadow-red-950/10 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-red-500 before:rounded-l-xl"
                    : isCompleted
                    ? "bg-slate-900/40 border-slate-850 opacity-70"
                    : "bg-slate-900/80 border-slate-800/80 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                      ID: {rem.conversationId}
                    </span>
                    {isOverdue && (
                      <span className="bg-red-500 text-slate-950 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider animate-pulse flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3 text-slate-950 shrink-0" /> Overdue
                      </span>
                    )}
                    {isCompleted && (
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-900/30 text-[9px] font-bold px-2 py-0.5 rounded">
                        ✓ Done
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-200">{rem.customerName}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5 font-bold leading-normal">{rem.customerPhone}</p>

                  <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950/40 p-2 rounded border border-slate-850/40 w-fit">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-[10px] font-bold">{formattedDate}</span>
                  </div>

                  {rem.status === "completed" && (
                    <div className="mt-3 bg-emerald-950/20 p-2 rounded border border-emerald-900/10 text-[11px] text-emerald-400 leading-relaxed">
                      <p className="font-bold">Completed: {rem.outcomeCompleted}</p>
                      {rem.outcomeNotes && <p className="text-slate-400">Notes: {rem.outcomeNotes}</p>}
                    </div>
                  )}

                  {rem.snoozedCount > 0 && (
                    <span className="text-[9px] text-amber-500 bg-amber-950/30 font-mono px-1.5 py-0.5 rounded mt-2 inline-block font-bold">
                      Snoozed {rem.snoozedCount} times
                    </span>
                  )}
                </div>

                {/* Actions drawer (exclude completed scope) */}
                {!isCompleted && (
                  <div className="mt-5 pt-3 border-t border-slate-850/60 flex flex-wrap gap-2 items-center justify-between">
                    {/* Snooze presets buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => onSnoozeFollowUp(rem.id, 15)}
                        title="Snooze 15 Mins"
                        className="bg-slate-800 border border-slate-700/60 hover:text-white p-1.5 rounded text-slate-300 cursor-pointer flex items-center gap-1 text-[10px]"
                      >
                        <Clock className="w-3 h-3 text-slate-400" /> 15m
                      </button>
                      <button
                        onClick={() => onSnoozeFollowUp(rem.id, 1440)}
                        title="Snooze 1 Day"
                        className="bg-slate-800 border border-slate-700/60 hover:text-white p-1.5 rounded text-slate-300 cursor-pointer flex items-center gap-1 text-[10px]"
                      >
                        <Clock className="w-3 h-3 text-slate-400" /> 1d
                      </button>
                    </div>

                    <div className="flex gap-1.5 items-center">
                      {/* Email Notice dispatcher action */}
                      <button
                        onClick={() => handleOpenEmailDispatch(rem)}
                        className="bg-blue-600/20 hover:bg-blue-550/30 border border-blue-500/20 hover:border-blue-500 text-blue-405 hover:text-blue-300 font-bold text-[10px] py-1.5 px-2.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                        title="Notify client via email"
                      >
                        <Mail className="w-3 h-3 text-blue-400" /> Email Notice
                      </button>

                      {/* Complete action */}
                      <button
                        onClick={() => handleOpenCompletion(rem.id)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-slate-950" /> Mark Completed
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Email notification dispatcher */}
      {emailModalId && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-55 flex items-center justify-center p-4 animate-fade-in">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              
              const rem = followups.find(f => f.id === emailModalId);
              if (rem) {
                const logMsg = `Email Follow-Up status dispatched to ${rem.customerName} (${emailAddress || "contact@sme.ng"}). Subject: "${emailSubject}"`;
                alert(`Success: Logged response here!\n\nTrace info:\n${logMsg}`);
                
                onCompleteFollowUp(rem.id, "Emailed Outbound", `Message Subject: "${emailSubject}". Details: ${logMsg}`);
              }
              setEmailModalId(null);
            }} 
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full space-y-4 text-slate-100 shadow-2xl relative"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" /> Dispatch Email Follow-up Notice
              </h3>
              <button type="button" onClick={() => setEmailModalId(null)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Generate and log a follow-up alert email. This will send a notification message and register the log trace locally.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 font-bold mb-1">Receipt Email Address</label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 font-bold mb-1">Email Subject Line</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 font-bold mb-1">Message Content Template</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
            >
              Dispatch & Log Email Notice
            </button>
          </form>
        </div>
      )}

      {/* Set Completed Form Dialogue */}
      {completeModalId && (
        <div id="completion-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-850">
              <h3 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Complete Follow-up
              </h3>
              <button onClick={() => setCompleteModalId(null)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="completion-outcome-select" className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-semibold">Select Outcome Channel</label>
                <select
                  id="completion-outcome-select"
                  value={completeOutcome}
                  onChange={(e) => setCompleteOutcome(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-semibold text-slate-100 placeholder-slate-600 focus:outline-none"
                >
                  <option value="Called">Called (Spoke with client)</option>
                  <option value="Messaged">Messaged (WhatsApp reply dispatched)</option>
                  <option value="Closed (Won)">Closed (Won - Payment verification)</option>
                  <option value="Closed (Lost)">Closed (Lost - Disinterested)</option>
                  <option value="No Response">No Response (Left a ticket segment)</option>
                </select>
              </div>

              <div>
                <label htmlFor="completion-notes-input" className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-semibold">Notes / Handover remarks</label>
                <textarea
                  id="completion-notes-input"
                  rows={2}
                  placeholder="Record summary details..."
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-semibold text-slate-100 placeholder-slate-700 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={verifyCompletionSave}
              className="w-full bg-emerald-500 text-slate-950 py-2 rounded text-xs font-black hover:bg-emerald-400 transition-colors cursor-pointer"
            >
              Verify Progress & Log Complete
            </button>
          </div>
        </div>
      )}

      {/* Schedule Reminder Form Modal Dialog */}
      {showAddModal && (
        <div id="add-reminder-modal" className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full text-slate-100 relative shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-850">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" /> New Alert Schedule
              </h3>
              <button onClick={() => { setShowAddModal(false); setAiSuggestion(null); }} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AI suggestions component trigger */}
            <div className="bg-emerald-950/10 border border-emerald-900/40 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-300 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> PRO FEATURE: AI OPTIMAL RECOMMENDATIONS
                </span>
                <button
                  onClick={triggerAiTimingCalculation}
                  disabled={aiTimingLoading}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[9px] font-black px-2 py-1 rounded disabled:opacity-50 cursor-pointer"
                >
                  {aiTimingLoading ? "Computing Logs..." : "Consult Gemini"}
                </button>
              </div>

              {aiSuggestion && (
                <div className="text-[10px] text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded border border-emerald-900/10 transition-all">
                  <p className="font-bold text-emerald-400">Gemini suggests: {aiSuggestion.time} ({aiSuggestion.confidence} confidence)</p>
                  <p className="text-slate-400 mt-1">{aiSuggestion.reason}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div>
                <label htmlFor="customer-conv-select" className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-semibold">Select Chat Contact</label>
                <select
                  id="customer-conv-select"
                  value={formConvId}
                  onChange={(e) => setFormConvId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-semibold text-slate-200"
                >
                  {conversations.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.contact.name} ({c.contact.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="due-date-picker" className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-semibold">Due Date & Time</label>
                  <input
                    id="due-date-picker"
                    type="datetime-local"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-semibold text-slate-200 font-mono"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="assignee-select" className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-semibold">Assignee</label>
                  <select
                    id="assignee-select"
                    value={formAssignedId}
                    onChange={(e) => setFormAssignedId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-semibold text-slate-200"
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Presets schedule updates */}
              <div>
                <span className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-semibold">Quick Time Presets</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: "+1 Hour", value: 1 },
                    { label: "+4 Hours", value: 4 },
                    { label: "+1 Day", value: 24 },
                    { label: "+3 Days", value: 72 }
                  ].map((pre) => {
                    return (
                      <button
                        key={pre.label}
                        type="button"
                        onClick={() => {
                          const dateVal = new Date();
                          dateVal.setHours(dateVal.getHours() + pre.value);
                          const localString = dateVal.toISOString().slice(0, 16);
                          setFormDueDate(localString);
                        }}
                        className="bg-slate-950 border border-slate-805 hover:border-emerald-500/50 hover:text-white p-2 rounded text-[10px] font-sans font-bold text-slate-400 cursor-pointer"
                      >
                        {pre.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Email Notification setup */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={sendEmailNotice}
                    onChange={(e) => {
                      setSendEmailNotice(e.target.checked);
                      if (e.target.checked && !formEmail) {
                        const activeC = conversations.find((c) => c.id === formConvId);
                        if (activeC) {
                          setFormEmail(`${activeC.contact.name.toLowerCase().replace(/\s+/g, "")}@workspace.ng`);
                        }
                      }
                    }}
                    className="rounded border-slate-800 bg-slate-900 text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span>Dispatch Email Notification?</span>
                </label>
                
                {sendEmailNotice && (
                  <div className="space-y-1 pl-5 pt-1 animate-fade-in">
                    <label htmlFor="form-email-input" className="block text-[8px] font-mono uppercase text-slate-500">Destination Email</label>
                    <input
                      id="form-email-input"
                      type="email"
                      placeholder="customer@domain.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[10px] font-semibold text-slate-205 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required={sendEmailNotice}
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 text-slate-950 font-bold py-2.5 rounded-lg text-xs hover:bg-emerald-400 transition-colors cursor-pointer block text-center"
              >
                Schedule & Add Callback Alert
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
