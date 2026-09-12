/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Clock,
  Shield,
  Trash2,
  Settings,
  Bell,
  X,
  PlusCircle,
  FileText,
  Activity,
  UserCheck,
  ToggleLeft,
  Calendar
} from "lucide-react";
import { User, Role, ActivityLog } from "../types";

interface TeamSectionProps {
  currentUser: User;
  usersList: User[];
  activityLogs: ActivityLog[];
  onInviteUser: (name: string, phone: string, role: Role) => void;
  onRemoveUser: (id: string) => void;
}

export default function TeamSection({
  currentUser,
  usersList,
  activityLogs,
  onInviteUser,
  onRemoveUser
}: TeamSectionProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite Form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>(Role.REPRESENTATIVE);

  // Business Hours State
  const [bizHoursActive, setBizHoursActive] = useState(true);
  const [openingTime, setOpeningTime] = useState("08:00");
  const [closingTime, setClosingTime] = useState("18:00");
  const [days, setDays] = useState("Mon - Sat");
  const [autoReplyMessage, setAutoReplyMessage] = useState("Thank you o! We're closed for today, but we will respond tomorrow promptly by 8:00 AM.");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    onInviteUser(name, phone, role);
    
    // reset
    setName("");
    setPhone("");
    setRole(Role.REPRESENTATIVE);
    setShowInviteModal(false);
  };

  const isOwner = currentUser.role === Role.ADMIN;

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-4rem)] md:min-h-screen p-4 md:p-8 text-slate-100 overflow-y-auto pb-24 md:pb-8">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-black font-sans tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" /> Team Space & Policies
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Invite Sales Assistants, delegate roles, configure workspace operating hours, and track team active histories.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-lg flex items-center gap-1.5 self-start cursor-pointer transition-colors"
          >
            <UserPlus className="w-4 h-4 text-slate-950" /> Add Team Member
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Left Column: Users List */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" /> ACTIVE WORKSPACE MEMBERS
              </h3>
              <p className="text-[10px] font-mono text-slate-500">{usersList.length} Accounts</p>
            </div>

            <div className="divide-y divide-slate-850">
              {usersList.map((user) => {
                const isMe = user.id === currentUser.id;

                return (
                  <div key={user.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-200">{user.name}</p>
                          {isMe && <span className="bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[8px] px-1.5 py-0.2 rounded font-black uppercase">You</span>}
                        </div>
                        <p className="text-[10px] font-mono text-slate-500 leading-none mt-1">{user.phone} • {user.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full inline-block ${user.isOnline ? "bg-emerald-400 animate-ping" : "bg-slate-700"}`} />
                      <span className="text-[10px] text-slate-500 font-mono pr-2">{user.isOnline ? "Online" : "Offline"}</span>

                      {isOwner && !isMe && user.id !== "user1" && (
                        <button
                          onClick={() => onRemoveUser(user.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-950 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-850 text-[10px] text-slate-500 bg-slate-950/20 p-2.5 rounded border border-slate-850/40 mt-4 leading-normal">
            ⚠️ <strong>Role Access Rights:</strong> Admins can manage hours and change subscriptions. Sales Reps view, claim, and reply to assigned chats. Viewers can only read histories without trigger privileges.
          </div>
        </div>

        {/* Right Column: Business Hours Setup */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
            <h3 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" /> Business Hours Policy (WAT)
            </h3>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-1.5 py-0.2 rounded font-mono font-bold">Auto-replies</span>
          </div>

          {!isOwner && (
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850/60 flex items-start gap-2 text-slate-400 text-xs mb-4">
              <Shield className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p>Operating Hours are locked. Only <strong>WORKSPACE ADMINS (Chioma)</strong> can configure after-hours parameters.</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded border border-slate-850/60">
              <div className="text-xs">
                <p className="font-bold text-slate-200">Enable After-Hours Auto-Replies</p>
                <p className="text-slate-500 text-[10px]">Toggles response when operators are closed o!</p>
              </div>
              <input
                id="biz-hours-active-checkbox"
                type="checkbox"
                checked={bizHoursActive}
                onChange={(e) => isOwner && setBizHoursActive(e.target.checked)}
                disabled={!isOwner}
                className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-1 cursor-pointer disabled:opacity-40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="biz-opening-time" className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-bold">Opens At (WAT)</label>
                <input
                  id="biz-opening-time"
                  type="text"
                  value={openingTime}
                  onChange={(e) => isOwner && setOpeningTime(e.target.value)}
                  disabled={!isOwner}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs font-mono font-bold text-slate-200 text-center"
                />
              </div>
              <div>
                <label htmlFor="biz-closing-time" className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-bold">Closes At (WAT)</label>
                <input
                  id="biz-closing-time"
                  type="text"
                  value={closingTime}
                  onChange={(e) => isOwner && setClosingTime(e.target.value)}
                  disabled={!isOwner}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs font-mono font-bold text-slate-200 text-center"
                />
              </div>
            </div>

            <div>
              <label htmlFor="biz-operating-days" className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-bold">Operating Days</label>
              <input
                id="biz-operating-days"
                type="text"
                value={days}
                onChange={(e) => isOwner && setDays(e.target.value)}
                disabled={!isOwner}
                className="w-full bg-slate-950 border border-slate-850 rounded p-2.5 text-xs text-slate-105 font-bold"
              />
            </div>

            <div>
              <label htmlFor="biz-afterhour-message" className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-bold">After-Hours Auto-Response Message Body</label>
              <textarea
                id="biz-afterhour-message"
                rows={3}
                value={autoReplyMessage}
                onChange={(e) => isOwner && setAutoReplyMessage(e.target.value)}
                disabled={!isOwner}
                className="w-full bg-slate-950 border border-slate-850 rounded p-2.5 text-xs text-slate-205 leading-relaxed placeholder-slate-700"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Shared Teammate Activity feed logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
          <h3 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" /> Joint Teammates Audit Activity Logs
          </h3>
          <span className="text-[10px] text-slate-500 font-mono font-semibold">Updated in real-time</span>
        </div>

        <div className="space-y-2.5 max-h-60 overflow-y-auto">
          {activityLogs.map((log) => {
            const formattedTime = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={log.id} className="flex gap-2.5 text-xs bg-slate-950 p-2.5 rounded border border-slate-850/60 justify-between items-center hover:border-slate-800 transition-colors">
                <div className="flex gap-2 items-center">
                  <div className="bg-emerald-950/60 border border-emerald-900/30 text-emerald-400 font-mono text-[9px] font-black px-1.5 py-0.5 rounded select-none shrink-0 uppercase">
                    {log.action}
                  </div>
                  <p className="text-slate-300 font-medium font-sans">
                    <span className="text-slate-100 font-bold">{log.userName}</span>: {log.details}
                  </p>
                </div>

                <span className="text-[10px] font-mono text-slate-500 shrink-0 font-bold font-mono">{formattedTime}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Member dialog form overlay pop */}
      {showInviteModal && isOwner && (
        <div id="invite-member-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-slate-100">
            <div className="flex justify-between items-center pb-2 border-b border-slate-850">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-emerald-400" /> Invite Assistant Teammate
              </h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label htmlFor="invite-assistant-name" className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-bold">Full Name</label>
                <input
                  id="invite-assistant-name"
                  type="text"
                  placeholder="e.g. Olumurtala Jide"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-slate-100 placeholder-slate-705 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="invite-assistant-phone" className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-bold">Nigeria Phone Number</label>
                <input
                  id="invite-assistant-phone"
                  type="text"
                  placeholder="e.g. +234 812 456 7890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-slate-105 placeholder-slate-705 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="invite-assistant-role" className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-bold">Select workspace Role</label>
                <select
                  id="invite-assistant-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-semibold text-slate-200 Focus:outline-none"
                >
                  <option value={Role.REPRESENTATIVE}>Sales Rep (Assigned inboxes o!)</option>
                  <option value={Role.VIEWER}>Viewer (Read-only observation)</option>
                  <option value={Role.ADMIN}>Admin (Full actions delegation)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 text-slate-950 font-bold py-2.5 rounded-lg text-xs hover:bg-emerald-400 transition-colors cursor-pointer block text-center"
              >
                Send SMS Invitation & Set seat
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
