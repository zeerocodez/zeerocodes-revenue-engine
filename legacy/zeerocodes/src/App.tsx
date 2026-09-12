import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Kanban, 
  CalendarCheck, 
  BarChart3, 
  PlusCircle,
  Settings,
  Bell,
  Search,
  Zap,
  Plus,
  Home,
  LogIn,
  Shield,
  ArrowRight,
  Rocket
} from 'lucide-react';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useApp } from './AppContext';

// Page Imports
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Leads from './pages/Leads';
import FollowUps from './pages/FollowUps';
import Reporting from './pages/Reporting';
import QualificationSettings from './pages/QualificationSettings';
import Integrations from './pages/Integrations';
import Ticketing from './pages/Ticketing';
import SuperAdmin from './pages/SuperAdmin';
import AddLeadForm from './components/AddLeadForm';
import Login from './pages/Login';
import Register from './pages/Register';

import Logo from './components/Logo';

const Sidebar = ({ onAddLead, isOpen, onClose }: { onAddLead: () => void, isOpen: boolean, onClose: () => void }) => {
  const location = useLocation();
  const { followUps, leads, isProcessing } = useApp();
  
  const dueCount = followUps.filter(f => f.status !== 'Completed' && new Date(f.scheduledAt) <= new Date()).length;
  const newLeadsCount = leads.filter(l => l.status === 'New').length;
  
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', number: '01' },
    { name: 'Pipeline View', icon: Kanban, path: '/dashboard/pipeline', number: '02' },
    { name: 'Follow-ups', icon: CalendarCheck, path: '/dashboard/follow-ups', number: '03', count: dueCount },
    { name: 'Analytics', icon: BarChart3, path: '/dashboard/reporting', number: '04' },
    { name: 'Lead Database', icon: Users, path: '/dashboard/leads', number: '05', count: newLeadsCount },
    { name: 'Billing & Support', icon: Zap, path: '/dashboard/billing', number: '06' },
    { name: 'Integrations', icon: Search, path: '/dashboard/integrations', number: '07' },
    { name: 'Qualify Logic', icon: Settings, path: '/dashboard/qualify-rules', number: '08' },
  ];

  const adminItem = { name: 'Super Admin', icon: Shield, path: '/dashboard/admin', number: '99' };
  const { isSuperAdmin, registration } = useApp();

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-navy-900 text-white flex flex-col h-screen overflow-hidden shrink-0 transition-transform duration-300 lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 pb-4 flex items-center justify-between">
          <div className="flex flex-col gap-4">
            <Link to="/" className="block" onClick={onClose}>
              <Logo />
            </Link>
            <Link to="/" className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors group">
              <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
              Exit to Home
            </Link>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white p-2">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-200 group font-bold",
                  isActive 
                    ? "bg-coral-500 text-white shadow-lg shadow-coral-500/20" 
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black opacity-40 group-hover:opacity-100">{item.number}</span>
                  <span className="text-sm tracking-tight">{item.name}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className={cn(
                    "ml-auto text-[10px] font-black px-2 py-0.5 rounded-full",
                    isActive ? "bg-white/20 text-white" : "bg-coral-500 text-white"
                  )}>
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}

          {isSuperAdmin && (
            <Link
              to={adminItem.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-200 group font-bold mt-8 border border-white/5",
                location.pathname === adminItem.path 
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
                  : "text-purple-400/60 hover:bg-white/5 hover:text-purple-400"
              )}
            >
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black opacity-40 group-hover:opacity-100">{adminItem.number}</span>
                <span className="text-sm tracking-tight">{adminItem.name}</span>
              </div>
            </Link>
          )}
          
          <div className="pt-6 px-4">
            <button 
              onClick={() => {
                onAddLead();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-coral-500 text-coral-500 hover:bg-coral-500 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
            >
              <Plus className="w-4 h-4" /> New Lead
            </button>
          </div>
        </nav>
        
        <div className="p-6">
          <div className="bg-white/5 rounded-[2rem] p-5 border border-white/10">
            <div className="text-[9px] uppercase tracking-widest font-black text-coral-500 mb-2">AI Agent Status</div>
            <div className="text-xs font-bold text-white/90">
              {isProcessing ? 'Analyzing leads...' : `Monitoring ${leads.length} leads...`}
            </div>
            <div className="mt-3 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                animate={{ 
                  width: isProcessing ? ['0%', '100%'] : '100%',
                  opacity: isProcessing ? [0.5, 1, 0.5] : 1
                }}
                transition={{ 
                  duration: isProcessing ? 1.5 : 0.5, 
                  repeat: isProcessing ? Infinity : 0 
                }}
                className="h-full bg-coral-500" 
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const Header = ({ onOpenSidebar }: { onOpenSidebar: () => void }) => {
  const { globalSearchQuery, setGlobalSearchQuery, followUps, notifications, dismissNotification, user, signOut } = useApp();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const location = useLocation();
  const pageTitle = location.pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard';

  const dueCount = followUps.filter(f => f.status !== 'Completed' && new Date(f.scheduledAt) <= new Date()).length;
  const unreadNotifications = notifications.length;

  return (
    <header className="h-20 lg:h-24 border-b border-white/10 bg-navy-950/80 backdrop-blur-md px-6 lg:px-10 flex items-center justify-between sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenSidebar}
          className="lg:hidden p-2 bg-white/5 rounded-xl border border-white/10 text-white/60"
        >
          <LayoutDashboard className="w-5 h-5" />
        </button>
        <h2 className="text-xl lg:text-[2.5rem] font-black uppercase tracking-tighter leading-none text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] sm:max-w-none">
          {pageTitle}
          <span className="text-coral-500 ml-2 hidden sm:inline text-sm lg:text-[2.5rem]">Overview</span>
        </h2>
      </div>
      
      <div className="flex items-center gap-3 lg:gap-6">
        <div className="hidden md:flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10 w-48 lg:w-72">
          <Search className="w-4 h-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Search leads..." 
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-[10px] lg:text-xs font-bold w-full uppercase tracking-widest text-white placeholder:text-white/20"
          />
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4 pl-3 lg:pl-6 border-l border-white/10">
          <div className="relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={cn(
                "relative p-2 bg-white/5 rounded-full border border-white/10 transition-colors",
                isNotifOpen ? "text-white bg-white/10" : "text-white/40 hover:text-white"
              )}
            >
              <Bell className="w-4 h-4 lg:w-5 h-5" />
              {(dueCount > 0 || unreadNotifications > 0) && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-coral-500 rounded-full border-2 border-navy-950 flex items-center justify-center text-[10px] font-black text-white">
                  {dueCount + unreadNotifications}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isNotifOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setIsNotifOpen(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 bg-navy-900 border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-6 bg-white/5 border-b border-white/10 flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest text-white">Notifications</h3>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{notifications.length} total</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 && dueCount === 0 ? (
                        <div className="p-10 text-center">
                          <Bell className="w-8 h-8 text-white/10 mx-auto mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/20">All caught up!</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {dueCount > 0 && (
                            <Link to="/dashboard/follow-ups" onClick={() => setIsNotifOpen(false)} className="block p-4 hover:bg-white/5 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-coral-500/10 border border-coral-500/20 rounded-xl flex items-center justify-center text-coral-500 shrink-0">
                                  <CalendarCheck className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-xs font-black uppercase tracking-tight text-white">{dueCount} Tasks Due</p>
                                  <p className="text-[10px] font-bold text-white/40 mt-0.5">Check your follow-up schedule.</p>
                                </div>
                              </div>
                            </Link>
                          )}
                          {notifications.map(n => (
                            <div key={n.id} className="p-4 hover:bg-white/5 transition-colors group relative">
                              <button 
                                onClick={() => dismissNotification(n.id)}
                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-white transition-all"
                              >
                                <Plus className="w-3 h-3 rotate-45" />
                              </button>
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
                                  n.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                                  n.type === 'warning' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" :
                                  "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                )}>
                                  <Zap className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-xs font-black uppercase tracking-tight text-white">{n.title}</p>
                                  <p className="text-[10px] font-bold text-white/40 mt-0.5 leading-relaxed">{n.message}</p>
                                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-2">Just now</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={signOut}
              className="lg:hidden p-2 text-white/20 hover:text-coral-500 transition-colors"
            >
              <LogIn className="w-4 h-4 rotate-180" />
            </button>
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[10px] font-black text-white uppercase tracking-wider">{user?.displayName || 'User'}</span>
              <button onClick={signOut} className="text-[8px] font-black text-white/20 hover:text-coral-500 uppercase tracking-widest transition-colors">Sign Out</button>
            </div>
            <Link to="/dashboard/billing" className="relative group cursor-pointer active:scale-95 transition-transform">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'Avatar'} className="w-8 h-8 lg:w-12 h-12 rounded-full border-2 border-white/10" />
              ) : (
                <div className="w-8 h-8 lg:w-12 h-12 bg-coral-500 rounded-full border-2 border-white/10 flex items-center justify-center font-black text-white text-[10px] lg:text-xs">
                  {user?.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-coral-500/0 group-hover:bg-coral-500/10 transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

const MobileNav = ({ onAddLead }: { onAddLead: () => void }) => {
  const location = useLocation();
  const navItems = [
    { name: 'Home', icon: Home, path: '/dashboard' },
    { name: 'Pipe', icon: Kanban, path: '/dashboard/pipeline' },
    { icon: Plus, path: 'add', isAction: true },
    { name: 'Tasks', icon: CalendarCheck, path: '/dashboard/follow-ups' },
    { name: 'Billing', icon: Zap, path: '/dashboard/billing' },
  ];

  return (
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-navy-900/95 backdrop-blur-xl border-t border-white/5 px-6 py-2 flex items-center justify-between shadow-[0_-10px_50px_rgba(0,0,0,0.5)] h-16">
      {navItems.map((item, i) => {
        if (item.isAction) {
          return (
            <button 
              key={i}
              onClick={onAddLead}
              className="w-14 h-14 bg-coral-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-coral-500/30 active:scale-90 transition-all -mt-8 border-4 border-navy-950"
            >
              <Plus className="w-8 h-8" />
            </button>
          );
        }
        
        const isActive = location.pathname === item.path;
        const IconSource = item.icon || Home;
        return (
          <Link 
            key={i} 
            to={item.path || '/dashboard'}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              isActive ? "text-coral-500" : "text-white/20"
            )}
          >
            <IconSource className={cn("w-6 h-6", isActive && "stroke-[3px]")} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
};

const AppLayout = ({ children, onAddLead }: { children: React.ReactNode, onAddLead: () => void }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { notifications, dismissNotification } = useApp();

  return (
    <div className="flex h-screen bg-navy-950 overflow-hidden select-none touch-none">
      <Sidebar onAddLead={onAddLead} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />
        <main className="flex-1 relative bg-navy-950 overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto overscroll-none pb-20 lg:pb-0 custom-scrollbar">
            {children}
          </div>
        </main>
        <MobileNav onAddLead={onAddLead} />

        {/* Global Toast Notifications */}
        <div className="fixed top-24 right-6 z-[60] flex flex-col gap-3 pointer-events-none w-80">
          <AnimatePresence mode="popLayout">
            {notifications.slice(0, 3).map((n) => (
              <motion.div 
                key={n.id}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                layout
                className="pointer-events-auto bg-navy-900 border border-white/10 rounded-2xl p-4 shadow-2xl flex items-start gap-4"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                  n.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                  n.type === 'warning' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" :
                  "bg-blue-500/10 border-blue-500/20 text-blue-500"
                )}>
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-tight text-white truncate">{n.title}</p>
                  <p className="text-[10px] font-bold text-white/40 mt-1 line-clamp-2">{n.message}</p>
                </div>
                <button 
                  onClick={() => dismissNotification(n.id)}
                  className="text-white/20 hover:text-white"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const { user, authLoading, registration, settingsLoaded, isUserAuthorized, signOut } = useApp();
  const location = useLocation();

  const isDashboardRoute = location.pathname.startsWith('/dashboard');

  if (authLoading || (isDashboardRoute && user && !settingsLoaded)) {
    return (
      <div className="h-screen bg-navy-950 flex flex-col items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 border-4 border-coral-500 border-t-transparent rounded-full mb-8"
        />
        <div className="text-[10px] font-black text-white uppercase tracking-[0.4em] animate-pulse">
          {authLoading ? 'Initializing Security...' : 'Syncing Headquarters...'}
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <div key={location.pathname.split('/')[1]}>
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/register" element={
              user && isUserAuthorized && registration?.completed ? (
                <Navigate to="/dashboard" />
              ) : (
                <Register />
              )
            } />
            <Route path="/dashboard/*" element={
              user ? (
                !isUserAuthorized || !registration?.completed ? (
                  <Register />
                ) : (
                  <AppLayout onAddLead={() => setIsAddLeadOpen(true)}>
                    <Routes>
                      <Route index element={<Dashboard onAddLead={() => setIsAddLeadOpen(true)} />} />
                      <Route path="pipeline" element={<Pipeline />} />
                      <Route path="leads" element={<Leads onAddLead={() => setIsAddLeadOpen(true)} />} />
                      <Route path="follow-ups" element={<FollowUps />} />
                      <Route path="reporting" element={<Reporting />} />
                      <Route path="integrations" element={<Integrations />} />
                      <Route path="billing" element={<Ticketing />} />
                      <Route path="qualify-rules" element={<QualificationSettings />} />
                      <Route path="admin" element={<SuperAdmin />} />
                    </Routes>
                  </AppLayout>
                )
              ) : (
                <Login />
              )
            } />
          </Routes>
        </div>
      </AnimatePresence>

      <AnimatePresence>
        {isAddLeadOpen && (
          <AddLeadForm onClose={() => setIsAddLeadOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

