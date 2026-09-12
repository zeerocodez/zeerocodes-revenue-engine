/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  MessageSquare,
  Clock,
  TrendingUp,
  Users,
  Sparkles,
  Settings,
  Shield,
  Briefcase,
  Layers,
  HelpCircle,
  AlertTriangle,
  UserCheck
} from "lucide-react";
import { User, Role } from "../types";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User;
  onUserSwitch: (userId: string) => void;
  onAdminEmailLogin?: (email: string) => void;
  allUsers: User[];
  overdueCount: number;
  unassignedCount: number;
  onStartTour: () => void;
  isOffline: boolean;
  onGoToLanding: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  currentUser,
  onUserSwitch,
  onAdminEmailLogin,
  allUsers,
  overdueCount,
  unassignedCount,
  onStartTour,
  isOffline,
  onGoToLanding
}: SidebarProps) {
  const [adminEmail, setAdminEmail] = React.useState("");
  const [showEmailInput, setShowEmailInput] = React.useState(false);

  const menuItems = [
    { id: "inbox", label: "Inbox", icon: MessageSquare, badge: unassignedCount > 0 ? unassignedCount : undefined, bColor: "bg-blue-500" },
    { id: "followups", label: "Follow-ups", icon: Clock, badge: overdueCount > 0 ? overdueCount : undefined, bColor: "bg-red-500" },
    { id: "customers", label: "Customers", icon: UserCheck },
    { id: "revenue", label: "Revenue", icon: TrendingUp },
    { id: "templates", label: "Templates", icon: Sparkles },
    { id: "team", label: "Team Space", icon: Users },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  if (currentUser.email === "zeerocodes@gmail.com" || currentUser.role === Role.ADMIN) {
    menuItems.push({ id: "superadmin", label: "Super Admin", icon: Shield });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-100 border-r border-slate-800 h-screen sticky top-0 justify-between">
        <div className="flex flex-col flex-1 p-4 overflow-y-auto">
          {/* Logo / Back to Homepage */}
          <button
            onClick={onGoToLanding}
            aria-label="Back to Homepage"
            className="flex items-center gap-3 px-2 py-3 mb-6 hover:bg-slate-850/40 rounded-xl transition-all w-full text-left group border border-transparent hover:border-slate-800 cursor-pointer"
          >
            <div className="bg-emerald-500 p-2 rounded-xl text-slate-950 font-bold tracking-tight text-lg shadow-lg group-hover:scale-105 transition-transform shrink-0">
              LZ
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg tracking-tight leading-none text-emerald-400 group-hover:text-emerald-300 transition-colors">LeadZero v2</h1>
              <div className="flex items-center justify-between gap-1 mt-1">
                <span className="text-[10px] text-slate-400 font-mono truncate">WhatsApp CRM</span>
                <span className="text-[9px] text-emerald-500 font-bold underline decoration-dotted group-hover:text-emerald-400 shrink-0">Back to Home</span>
              </div>
            </div>
          </button>

          {/* Connection Status & Offline mode */}
          {isOffline ? (
            <div className="bg-amber-950/40 border border-amber-800/40 rounded-lg p-2.5 mb-5 flex items-center gap-2 text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <div className="text-xs">
                <p className="font-medium">Offline Mode</p>
                <p className="text-[10px] text-amber-300/80">Queueing outgoing replies</p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/30 border border-emerald-800/20 rounded-lg p-2.5 mb-5 flex items-center gap-2 text-emerald-300">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-xs">
                <p className="font-medium">WhatsApp Sync Active</p>
                <p className="text-[10px] text-emerald-400/80 font-mono">Baileys connected</p>
              </div>
            </div>
          )}

          {/* Tour Button */}
          <button
            onClick={onStartTour}
            className="flex items-center gap-2 mb-4 px-3 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-xs font-medium text-slate-300 transition-colors w-full cursor-pointer justify-center"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            Launch Interactive Tour
          </button>

          {/* User Selector Dropdown */}
          <div className="mb-6 p-3 bg-slate-800/60 rounded-xl border border-slate-800">
            <label className="block text-[10px] font-mono tracking-wider font-semibold uppercase text-slate-400 mb-1.5 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" /> Current Workspace Identity
            </label>
            <select
              id="user-identity-select"
              value={currentUser.id}
              onChange={(e) => onUserSwitch(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-705 p-1.5 w-full focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Scope: {currentUser.role === Role.ADMIN ? "Full Workspace Actions" : currentUser.role === Role.REPRESENTATIVE ? "Assigned Chats Only" : "Read-only Observer"}</span>
            </div>

            {/* Super Admin email sign-in / status */}
            <div className="mt-3.5 pt-3 border-t border-slate-800">
              {currentUser.email === "zeerocodes@gmail.com" || currentUser.role === Role.ADMIN ? (
                <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-2 text-center">
                  <span className="text-[10px] text-emerald-400 font-extrabold flex items-center justify-center gap-1 font-mono">
                    👑 ADMIN SESSION LIVE
                  </span>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                    {currentUser.name} • {currentUser.email || "Administrator"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      if (onAdminEmailLogin) {
                        onAdminEmailLogin("zeerocodes@gmail.com");
                      }
                    }}
                    className="w-full text-[10px] bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 hover:text-white rounded py-1 px-2 font-mono font-bold cursor-pointer transition-colors flex items-center justify-center gap-1"
                  >
                    👑 Switch to Admin Account
                  </button>
                  {!showEmailInput ? (
                    <button
                      onClick={() => setShowEmailInput(true)}
                      className="text-[10px] text-slate-400 hover:text-emerald-300 underline font-mono cursor-pointer border-none bg-transparent font-medium block mx-auto text-center"
                    >
                      Enter custom admin email
                    </button>
                  ) : (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (onAdminEmailLogin) {
                          onAdminEmailLogin(adminEmail);
                          setAdminEmail("");
                          setShowEmailInput(false);
                        }
                      }}
                      className="space-y-1.5"
                    >
                      <input
                        type="email"
                        placeholder="Enter admin email..."
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="bg-slate-950 text-slate-200 text-[10px] border border-slate-700/65 rounded p-1.5 w-full focus:outline-none placeholder-slate-600 focus:ring-1 focus:ring-emerald-500 font-semibold font-mono"
                        required
                      />
                      <div className="flex gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowEmailInput(false)}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-[9px] px-1.5 py-1 rounded cursor-pointer font-bold font-mono"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[9px] px-2 py-1 rounded cursor-pointer font-bold font-mono"
                        >
                          Sign In
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`tab-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-slate-950 font-semibold shadow-md shadow-emerald-900/10"
                      : "text-slate-300 hover:bg-slate-850 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className={`w-4 h-4 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${item.bColor || "bg-emerald-500"}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-center">
          <p className="text-[10px] font-mono text-slate-500">LeadZero v2 • Africa WAT</p>
          <p className="text-[9px] text-slate-600 mt-0.5">NGN billing via Paystack</p>
        </div>
      </aside>

      {/* Mobile Header and Bottom Bar */}
      <div className="md:hidden flex flex-col fixed bottom-0 left-0 right-0 z-55 bg-slate-900 border-t border-slate-800 shadow-2xl">
        <div 
          className="grid h-16" 
          style={{ gridTemplateColumns: `repeat(${menuItems.length}, minmax(0, 1fr))` }}
        >
          {menuItems.map((item) => {
            const IconComp = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-mobile-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                className={`flex flex-col items-center justify-center p-1 transition-all relative ${
                  isActive ? "text-emerald-400 font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="relative">
                  <IconComp className="w-5 h-5 mb-0.5" />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 bg-red-500 text-[8px] font-extrabold text-white px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] leading-none shrink-0">{item.label.split(" ")[0]}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Top Header for user switching / state */}
      <header className="md:hidden flex items-center justify-between bg-slate-950 text-slate-100 px-4 py-3 sticky top-0 z-40 border-b border-slate-800">
        <button
          onClick={onGoToLanding}
          aria-label="Back to Homepage"
          className="flex items-center gap-2 hover:bg-slate-900 px-2 py-1 rounded transition-colors text-left cursor-pointer border-none bg-transparent"
        >
          <div className="bg-emerald-500 text-slate-950 text-xs font-extrabold p-1 rounded shrink-0">LZ</div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-emerald-400 leading-none">LeadZero</h1>
            <span className="text-[9px] text-slate-400 font-mono block leading-none mt-0.5">← Back to Home</span>
          </div>
        </button>

        {/* Connection status dots */}
        <div className="flex items-center gap-2">
          {isOffline ? (
            <span className="text-[10px] text-amber-500 font-mono">● OFF</span>
          ) : (
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping inline-block" />
              Baileys
            </span>
          )}

          <select
            id="mobile-user-identity-select"
            value={currentUser.id}
            onChange={(e) => onUserSwitch(e.target.value)}
            className="bg-slate-900 text-slate-200 text-[10px] rounded border border-slate-700 p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[120px] font-medium"
          >
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name.split(" ")[0]} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </header>
    </>
  );
}
