import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Share2, Globe, Facebook, MessageSquare, Terminal, Copy, Check, Info, 
  Users, UserPlus, Trash2, ShieldCheck, Mail, Send, Sliders, Settings, 
  RefreshCw, AlertCircle, ToggleLeft, ToggleRight, Sparkles, BookOpen, Eye 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useApp } from '../AppContext';

const Integrations: React.FC = () => {
  const { 
    members, 
    addTeamMember, 
    removeTeamMember, 
    isAdmin, 
    user, 
    organizationId,
    emailSettings,
    updateEmailSettings,
    addClientEmailAccount,
    updateClientEmailAccount,
    deleteClientEmailAccount,
    leads,
    fetchWithAuth
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Tab states for Email configurations console
  const [activeEmailTab, setActiveEmailTab] = useState<'recipients' | 'credentials' | 'template' | 'terminal'>('recipients');
  
  // Recipient form state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientRole, setClientRole] = useState('Account Manager');

  // Test notification controller state
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [testRecipientEmail, setTestRecipientEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Live dispatch sandbox terminal logs
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Form states for Sender accounts
  const [activeProvider, setActiveProvider] = useState<'Simulated Sandbox' | 'SMTP' | 'Resend'>('Simulated Sandbox');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [resendApiKey, setResendApiKey] = useState('');
  const [resendSender, setResendSender] = useState('');

  // Form states for template
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [minScore, setMinScore] = useState(70);

  // Populate localized form states once emailSettings are fetched from Firebase
  useEffect(() => {
    if (emailSettings) {
      setActiveProvider(emailSettings.provider || 'Simulated Sandbox');
      setSmtpHost(emailSettings.smtpHost || '');
      setSmtpPort(emailSettings.smtpPort || 587);
      setSmtpUser(emailSettings.smtpUser || '');
      setSmtpPassword(emailSettings.smtpPassword || '');
      setSmtpSecure(!!emailSettings.smtpSecure);
      setResendApiKey(emailSettings.resendApiKey || '');
      setResendSender(emailSettings.resendSender || '');
      setTemplateSubject(emailSettings.templateSubject || '');
      setTemplateBody(emailSettings.templateBody || '');
      setMinScore(emailSettings.minScore !== undefined ? emailSettings.minScore : 70);
    }
  }, [emailSettings]);

  // Set initial selected lead for testing if leads exists
  useEffect(() => {
    if (leads && leads.length > 0 && !selectedLeadId) {
      setSelectedLeadId(leads[0].id);
    }
  }, [leads, selectedLeadId]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await fetchWithAuth('/api/email/logs');
      const data = await response.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Error loading email dispatch logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Poll logs on terminal tab activation
  useEffect(() => {
    if (activeEmailTab === 'terminal') {
      fetchLogs();
      const interval = setInterval(fetchLogs, 5000); // poll every 5s on terminal view
      return () => clearInterval(interval);
    }
  }, [activeEmailTab]);

  const webhookUrl = `${window.location.origin}/api/webhook/lead?org=${organizationId}`;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) return;
    setIsAdding(true);
    try {
      await addTeamMember(newMemberEmail);
      setNewMemberEmail('');
    } finally {
      setIsAdding(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const webhookSectionRef = useRef<HTMLDivElement>(null);
  const emailSectionRef = useRef<HTMLDivElement>(null);

  const scrollToWebhook = () => {
    webhookSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToEmail = () => {
    emailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleWaitlist = (name: string) => {
    alert(`You've been added to the waitlist for ${name}! We'll notify you when this integration is live.`);
  };

  const handleAddRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail) return;
    try {
      await addClientEmailAccount({
        name: clientName,
        email: clientEmail.trim().toLowerCase(),
        role: clientRole,
        active: true
      });
      setClientName('');
      setClientEmail('');
      setClientRole('Account Manager');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCredentials = async () => {
    try {
      await updateEmailSettings({
        provider: activeProvider,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        smtpSecure,
        resendApiKey,
        resendSender
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      await updateEmailSettings({
        templateSubject,
        templateBody,
        minScore
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerTestNotification = async () => {
    if (!selectedLeadId) {
      alert("Please select a lead to simulate the test payload!");
      return;
    }
    setSendingTest(true);
    setTestResult(null);

    const targetLead = leads.find(l => l.id === selectedLeadId);
    if (!targetLead) {
      alert("Selected lead not found in database. Please generate or seed leads first.");
      setSendingTest(false);
      return;
    }

    try {
      const response = await fetchWithAuth('/api/email/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: targetLead,
          settings: emailSettings,
          isTest: true,
          testEmail: testRecipientEmail.trim() || user?.email
        })
      });
      
      const data = await response.json();
      if (response.ok && data.status !== 'error') {
        setTestResult({
          success: true,
          message: data.message || "Test notification email dispatched successfully!"
        });
        if (activeEmailTab === 'terminal') {
          fetchLogs();
        }
      } else {
        setTestResult({
          success: false,
          message: data.message || "Failed to dispatch. Review credentials configuration."
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "Request timed out or offline."
      });
    } finally {
      setSendingTest(false);
    }
  };

  const integrationCards = [
    {
      id: 'email',
      name: 'Client Notification Accounts',
      description: 'Notify internal clients & representatives via automated structured emails when high-intent leads are verified.',
      icon: Mail,
      color: 'text-purple-500',
      status: 'Ready',
      active: true,
      onClick: scrollToEmail
    },
    {
      id: 'website',
      name: 'Website Webhook',
      description: 'Connect any custom website form using our JSON API.',
      icon: Globe,
      color: 'text-coral-500',
      status: 'Ready',
      active: true,
      onClick: scrollToWebhook
    },
    {
      id: 'facebook',
      name: 'Facebook Lead Ads',
      description: 'Automatically sync leads from your Meta advertising campaigns.',
      icon: Facebook,
      color: 'text-blue-500',
      status: 'Coming Soon',
      active: false,
      onClick: () => handleWaitlist('Facebook Lead Ads')
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'Pull leads from automated WhatsApp chat flows.',
      icon: MessageSquare,
      color: 'text-green-500',
      status: 'Coming Soon',
      active: false,
      onClick: () => handleWaitlist('WhatsApp Business')
    }
  ];

  return (
    <div className="p-4 sm:p-10 max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-coral-500 rounded-xl">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">Integrations & Data</h1>
        </div>
        <p className="text-white/40 text-[10px] sm:text-xs font-bold uppercase tracking-widest px-1">Connect your sales signals inside real-time channels</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {integrationCards.map((card) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "bg-navy-900 border border-white/5 rounded-[2.5rem] p-6 flex flex-col items-center text-center space-y-6 relative overflow-hidden group hover:border-white/10 transition-all",
              !card.active && "opacity-60 saturate-50"
            )}
          >
            {!card.active && (
              <div className="absolute top-6 right-6 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">WIP</span>
              </div>
            )}
            
            <div className={cn("p-5 rounded-3xl bg-black/40", card.color)}>
              <card.icon className="w-8 h-8" />
            </div>

            <div className="space-y-2 flex-grow">
              <h3 className="text-sm font-black text-white">{card.name}</h3>
              <p className="text-[11px] text-white/40 font-bold leading-relaxed">{card.description}</p>
            </div>

            <button 
              onClick={card.onClick}
              className={cn(
                "w-full py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all",
                card.active 
                  ? "bg-white text-navy-950 hover:bg-coral-500 hover:text-white" 
                  : "bg-white/5 text-white/40 hover:bg-white/10"
              )}
            >
              {card.active ? 'Configure' : 'Join Waitlist'}
            </button>
          </motion.div>
        ))}
      </div>

      {/* NEW: Client Email Accounts and Notification Setup Console */}
      <motion.div
        ref={emailSectionRef}
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-navy-900 border border-white/5 rounded-[3rem] p-6 sm:p-10 space-y-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Email Notifications & Accounts console</h2>
            </div>
            <p className="text-white/40 text-xs font-bold leading-relaxed max-w-xl">
              Configure target developer or client email list, select dispatch routing options, and customize qualification templates triggered automatically when score criteria is met.
            </p>
          </div>

          {/* Master Enable switch */}
          <div className="flex items-center gap-3 p-3 bg-black/30 rounded-2xl border border-white/5 self-start md:self-auto shrink-0">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Automated Dispatcher Status</span>
            <button
              onClick={() => updateEmailSettings({ enabled: !emailSettings?.enabled })}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                emailSettings?.enabled 
                  ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                  : "bg-white/5 text-white/40 border border-white/5"
              )}
            >
              {emailSettings?.enabled ? (
                <>
                  <ToggleRight className="w-4 h-4 text-green-400 shrink-0 animate-pulse" />
                  ENABLED
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-white/20 shrink-0" />
                  DISABLED
                </>
              )}
            </button>
          </div>
        </div>

        {/* Console Hub Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Layout Left Sidebar control links */}
          <div className="lg:col-span-3 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 border-b lg:border-none border-white/5">
            {[
              { id: 'recipients', label: 'Client Recipients', icon: Users, desc: 'Manage recipient addresses' },
              { id: 'credentials', label: 'Sender Credentials', icon: Settings, desc: 'SMTP / SMTP APIs configuration' },
              { id: 'template', label: 'Email Template', icon: Sliders, desc: 'Configure content templates' },
              { id: 'terminal', label: 'Live Sandbox Terminal', icon: Terminal, desc: 'Verify outgoing logs' },
            ].map((tab) => {
              const isActive = activeEmailTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveEmailTab(tab.id as any)}
                  className={cn(
                    "flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-4 px-5 py-4 rounded-2xl font-bold text-left transition-all w-full shrink-0 lg:shrink",
                    isActive 
                      ? "bg-white text-navy-950 shadow-xl" 
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <tab.icon className={cn("w-4 h-4 lg:w-5 h-5", isActive ? "text-purple-600 animate-bounce" : "text-white/40")} />
                  <div className="space-y-0.5">
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider leading-none">{tab.label}</p>
                    <p className={cn("text-[8px] font-bold uppercase tracking-widest hidden lg:block", isActive ? "text-navy-950/40" : "text-white/30")}>
                      {tab.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Consolidated Tab View Console Panel Content */}
          <div className="lg:col-span-9 bg-black/30 border border-white/5 rounded-[2.5rem] p-6 sm:p-8 min-h-[400px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {activeEmailTab === 'recipients' && (
                <motion.div
                  key="recipients"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Target Recipient Client Accounts</h3>
                      <p className="text-[11px] text-white/40 font-bold">These emails will receive detailed alerts when leads are successfully qualified.</p>
                    </div>
                  </div>

                    {/* Inline Form to Add Client Email */}
                    <form onSubmit={handleAddRecipient} className="bg-navy-950/40 p-5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Add New Recipient</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">Contact Name</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Alao Babatunde"
                            value={clientName}
                            onChange={e => setClientName(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-white/10 uppercase"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">Client Email Address</label>
                          <input 
                            type="email"
                            required
                            placeholder="e.g. babatunde@lagosleads.com"
                            value={clientEmail}
                            onChange={e => setClientEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-white/10"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">Role / Affiliation</label>
                          <input 
                            type="text"
                            placeholder="e.g. Lead Investor"
                            value={clientRole}
                            onChange={e => setClientRole(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-white/10 uppercase"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="px-6 py-3 bg-white text-navy-950 text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-purple-500 hover:text-white transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                          Add Client Email Account
                        </button>
                      </div>
                    </form>

                    {/* Recipient Account List */}
                    <div className="space-y-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1 block">Registered Clients roster ({emailSettings?.clients?.length || 0})</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                        {emailSettings?.clients?.map((client) => (
                          <div 
                            key={client.id}
                            className="bg-navy-900/50 p-4 border border-white/5 rounded-2xl flex items-center justify-between gap-4 group hover:border-white/10 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => updateClientEmailAccount(client.id, { active: !client.active })}
                                className={cn(
                                  "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                  client.active 
                                    ? "bg-purple-500 border-purple-500 text-white" 
                                    : "border-white/10 bg-white/5 text-transparent"
                                )}
                              >
                                <Check className="w-3 h-3 stroke-[3px]" />
                              </button>
                              
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-black text-white truncate uppercase">{client.name}</p>
                                  {client.role && (
                                    <span className="text-[7px] font-black uppercase bg-white/5 text-white/40 px-1.5 py-0.5 rounded leading-none">
                                      {client.role}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] font-bold text-white/40 truncate">{client.email}</p>
                              </div>
                            </div>

                            <button
                              onClick={() => deleteClientEmailAccount(client.id)}
                              className="p-2 hover:bg-red-500/15 text-white/10 hover:text-red-500 transition-all rounded-xl shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        {(!emailSettings?.clients || emailSettings.clients.length === 0) && (
                          <div className="col-span-full py-10 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl gap-2">
                            <Mail className="w-6 h-6 text-white/10" />
                            <p className="text-[9px] font-black uppercase text-white/20 tracking-wider">No active client recipients configured</p>
                          </div>
                        )}
                      </div>
                    </div>
                </motion.div>
              )}

              {activeEmailTab === 'credentials' && (
                <motion.div
                  key="credentials"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="border-b border-white/5 pb-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Sender Outbound Gateway Setup</h3>
                    <p className="text-[11px] text-white/40 font-bold">Configure how alerts are dynamically dispatched. S secrets are securely contained environment-side.</p>
                  </div>

                  {/* Provider Radio Selector Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'Simulated Sandbox', label: 'Simulated Sandbox', desc: 'Active instantly, triggers UI delivery logs' },
                      { id: 'SMTP', label: 'SMTP Gateway', desc: 'Secure direct SMTP (Google, Outlook, custom)' },
                      { id: 'Resend', label: 'Resend API', desc: 'Reliable developer email api integration' }
                    ].map((provider) => {
                      const isSelected = activeProvider === provider.id;
                      return (
                        <button
                          key={provider.id}
                          onClick={() => setActiveProvider(provider.id as any)}
                          className={cn(
                            "p-5 text-left rounded-3xl border text-white transition-all select-none cursor-pointer flex flex-col justify-between h-32",
                            isSelected 
                              ? "bg-purple-500/10 border-purple-500" 
                              : "bg-navy-950/20 border-white/5 hover:border-white/10"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[10px] font-black uppercase tracking-wider">{provider.label}</span>
                            <div className={cn(
                              "w-4.5 h-4.5 rounded-full border flex items-center justify-center",
                              isSelected ? "border-purple-500 text-purple-500 bg-purple-500/10" : "border-white/10"
                            )}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                            </div>
                          </div>
                          <p className="text-[9px] text-white/40 font-bold leading-relaxed">{provider.desc}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Conditional Provider credential entry forms */}
                  <div className="bg-navy-950/40 p-6 rounded-3xl border border-white/5">
                    {activeProvider === 'Simulated Sandbox' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-400">
                          <Sparkles className="w-4 h-4 animate-spin" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Pre-configured Sandbox active</span>
                        </div>
                        <p className="text-[11px] text-white/40 font-bold leading-relaxed">
                          Your organization is currently connected to the <span className="text-white">Local Simulation Sandbox</span>. Dispatched notifications will immediately record in the <span className="text-white">Live Sandbox Terminal</span> tab for quick payload verification and troubleshooting, requiring zero external server setup.
                        </p>
                        <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between">
                          <code className="text-[10px] font-mono text-purple-400">Preset Outbound Sender: sandbox@zeerocodes.com</code>
                          <span className="text-[8px] font-black uppercase bg-green-500/15 text-green-400 px-2 py-1 rounded">INSTANT CONNECTION READY</span>
                        </div>
                      </div>
                    )}

                    {activeProvider === 'SMTP' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">SMTP Host (Server)</label>
                            <input 
                              type="text"
                              placeholder="smtp.gmail.com"
                              value={smtpHost}
                              onChange={e => setSmtpHost(e.target.value)}
                              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">SMTP Port</label>
                            <input 
                              type="number"
                              placeholder="587"
                              value={smtpPort}
                              onChange={e => setSmtpPort(Number(e.target.value))}
                              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">Security SSL/TLS</label>
                            <button
                              type="button"
                              onClick={() => setSmtpSecure(!smtpSecure)}
                              className={cn(
                                "w-full py-3.5 px-4 font-black uppercase text-[10px] tracking-widest border rounded-xl flex items-center justify-between text-left",
                                smtpSecure ? "bg-purple-500/10 border-purple-500 text-purple-400" : "bg-white/5 border-white/5 text-white/40"
                              )}
                            >
                              <span>Use Secure TLS (Port 465)</span>
                              <input type="checkbox" checked={smtpSecure} readOnly className="sr-only" />
                              <div className={cn(
                                "w-4.5 h-4.5 rounded-full border flex items-center justify-center",
                                smtpSecure ? "border-purple-500 bg-purple-500" : "border-white/10"
                              )}>
                                {smtpSecure && <Check className="w-3 h-3 text-white" />}
                              </div>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">SMTP Username / Email Address</label>
                            <input 
                              type="text"
                              placeholder="e.g. notifications@mycompany.com"
                              value={smtpUser}
                              onChange={e => setSmtpUser(e.target.value)}
                              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">SMTP Password</label>
                            <input 
                              type="password"
                              placeholder="SMTP Authorization password"
                              value={smtpPassword}
                              onChange={e => setSmtpPassword(e.target.value)}
                              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeProvider === 'Resend' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">Resend API Token Key</label>
                            <input 
                              type="password"
                              placeholder="re_XXXXX_XXXXXXXX"
                              value={resendApiKey}
                              onChange={e => setResendApiKey(e.target.value)}
                              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">Verified Sender Domain Address</label>
                            <input 
                              type="text"
                              placeholder="e.g. alerts@reachtoleads.com"
                              value={resendSender}
                              onChange={e => setResendSender(e.target.value)}
                              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-white/40 font-bold flex items-center gap-1.5 px-1">
                          <Info className="w-3.5 h-3.5" /> Note: Ensure your sender domain corresponds to the domain verified in your Resend account dashboard.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center bg-navy-950/20 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-bold text-white/30 leading-none uppercase">Save details before executing sandbox tests</p>
                    <button
                      onClick={handleSaveCredentials}
                      className="px-6 py-3 bg-white text-navy-950 text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-purple-500 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                    >
                      <RefreshCw className="w-3 h-3 text-navy-950 inline-block group-hover:rotate-180 transition-transform" />
                      Save Outbound Account Credentials
                    </button>
                  </div>
                </motion.div>
              )}

              {activeEmailTab === 'template' && (
                <motion.div
                  key="template"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="border-b border-white/5 pb-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Automated Notification template</h3>
                    <p className="text-[11px] text-white/40 font-bold">Customize the dynamic criteria and notification structure dispatched when leads qualify.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-8 space-y-4">
                      {/* Threshold sliding selector */}
                      <div className="p-4 bg-navy-950/40 border border-white/5 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40">
                          <span>Qualification threshold</span>
                          <span className="text-purple-400 font-mono text-xs">{minScore}% Match Score</span>
                        </div>
                        <input 
                          type="range"
                          min="30"
                          max="95"
                          step="5"
                          value={minScore}
                          onChange={e => setMinScore(Number(e.target.value))}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <p className="text-[10px] text-white/30 font-bold uppercase leading-none">We will only notify accounts on leads with equal or greater match scores.</p>
                      </div>

                      {/* Subject input */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">Notification Email Subject Template</label>
                        <input 
                          type="text"
                          required
                          value={templateSubject}
                          onChange={e => setTemplateSubject(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Body area */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">Notification Email Body Template (Plain Text)</label>
                        <textarea 
                          required
                          rows={8}
                          value={templateBody}
                          onChange={e => setTemplateBody(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-purple-500 font-mono focus:ring-0 resize-none custom-scrollbar"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-4 bg-navy-950/30 p-5 rounded-3xl border border-white/5 space-y-4 font-bold flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-white/60 tracking-wider">
                          <BookOpen className="w-4 h-4 text-purple-400" />
                          <span>Cheat Sheet placeholder keys</span>
                        </div>
                        <p className="text-[10px] text-white/40">Insert these exactly with brackets inside templates to auto-fill lead metadata details real-time:</p>
                        <div className="space-y-2 font-mono text-[10px] text-white bg-black/40 p-3 rounded-2xl border border-white/5 select-all max-h-[175px] overflow-y-auto custom-scrollbar">
                          {[
                            { key: '{{name}}', val: 'Lead Contact Name' },
                            { key: '{{score}}', val: '0-100 Score Match' },
                            { key: '{{industry}}', val: 'Category Industry' },
                            { key: '{{budget}}', val: 'Budget Scale value' },
                            { key: '{{email}}', val: 'Contact email' },
                            { key: '{{phone}}', val: 'Contact phone' },
                            { key: '{{notes}}', val: 'Details notes inquiry' },
                            { key: '{{aiSummary}}', val: 'Dynamic AI Summarized Verdict' },
                          ].map(tag => (
                            <div key={tag.key} className="flex items-center justify-between py-1 border-b border-white/5">
                              <span className="text-purple-400">{tag.key}</span>
                              <span className="text-white/35 text-[9px] text-right">{tag.val}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block">Configure Test Dispatch</span>
                        <div className="bg-black/40 p-3 rounded-2xl border border-white/5 space-y-2">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-white/40 tracking-wider">Simulated Target Lead</label>
                            <select 
                              value={selectedLeadId}
                              onChange={e => setSelectedLeadId(e.target.value)}
                              className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white focus:outline-none appearance-none"
                            >
                              {leads.map(lead => (
                                <option key={lead.id} value={lead.id} className="bg-navy-950 text-white uppercase text-[8px]">{lead.name} ({lead.qualificationScore}%)</option>
                              ))}
                              {leads.length === 0 && (
                                <option className="bg-navy-950">No leads available</option>
                              )}
                            </select>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-white/40 tracking-wider">Test Destination Email</label>
                            <input 
                              type="email"
                              placeholder={user?.email || "Specify test destination"}
                              value={testRecipientEmail}
                              onChange={e => setTestRecipientEmail(e.target.value)}
                              className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white focus:outline-none"
                            />
                          </div>

                          <button 
                            type="button"
                            onClick={handleTriggerTestNotification}
                            disabled={sendingTest || leads.length === 0}
                            className="w-full py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-40 rounded-xl text-[9px] font-black uppercase text-white tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {sendingTest ? 'Sending Test...' : 'Send Test Notification'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Saved & dynamic indicators */}
                  {testResult && (
                    <div className={cn(
                      "p-4 rounded-xl border flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-wide",
                      testResult.success 
                        ? "bg-green-500/10 border-green-500/20 text-green-400" 
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                    )}>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{testResult.message}</span>
                      </div>
                      <button 
                        onClick={() => setTestResult(null)}
                        className="text-[9px] font-black underline uppercase hover:text-white"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-center bg-navy-950/20 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-bold text-white/30 leading-none uppercase">Ensure you save changes before closing</p>
                    <button
                      onClick={handleSaveTemplate}
                      className="px-6 py-3 bg-white text-navy-950 text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-purple-500 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                    >
                      <RefreshCw className="w-3 h-3 text-navy-950 inline-block group-hover:rotate-180 transition-transform" />
                      Save Template & Threshold Configuration
                    </button>
                  </div>
                </motion.div>
              )}

              {activeEmailTab === 'terminal' && (
                <motion.div
                  key="terminal"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-6 flex flex-col justify-between h-full"
                >
                  <div className="border-b border-white/5 pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Live Sandbox events Terminal</h3>
                      <p className="text-[11px] text-white/40 font-bold">Watch structural delivery, trace payloads, and view recent dispatch alerts dynamically.</p>
                    </div>
                    
                    <button 
                      onClick={fetchLogs}
                      disabled={loadingLogs}
                      className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/5 select-none cursor-pointer"
                    >
                      <RefreshCw className={cn("w-4 h-4", loadingLogs && "animate-spin")} />
                    </button>
                  </div>

                  <div className="bg-navy-950/80 rounded-2xl p-5 border border-white/5 font-mono text-[10px] text-green-400 uppercase tracking-widest leading-relaxed overflow-y-auto max-h-[350px] space-y-4 custom-scrollbar">
                    {logs.map((log) => (
                      <div key={log.id} className="border-b border-white/5 pb-3 last:border-0 last:pb-0 space-y-1">
                        <div className="flex flex-col sm:flex-row justify-between text-[9px] text-white/40 font-bold border-b border-white/5 pb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white/60">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                            <span className="text-purple-400">ID: {log.id}</span>
                            <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1 rounded text-[7px] font-black">{log.provider}</span>
                          </div>
                          <span className="text-green-500 font-black">● DELIVERED STATUS OK</span>
                        </div>
                        <div className="pt-1 text-white">
                          <span className="text-white/45 font-bold">RECIPIENTS:</span> {log.recipient}
                        </div>
                        <div className="text-white">
                          <span className="text-white/45 font-bold">SUBJECT:</span> {log.subject}
                        </div>
                        <div className="p-3 bg-black/40 rounded-xl text-green-300 font-sans border border-white/5 text-[10px] whitespace-pre-wrap max-h-[150px] overflow-y-auto pr-1">
                          {log.body}
                        </div>
                      </div>
                    ))}

                    {logs.length === 0 && (
                      <div className="py-16 text-center text-white/20 text-[10px] flex flex-col items-center justify-center gap-3">
                        <Terminal className="w-8 h-8 text-green-500/20 shrink-0" />
                        <span>-- SIMULATION SANDBOX DISPATCH LOG COLD: NO SENT EVENTS LOADED --</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Team Management Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-navy-900 border border-white/5 rounded-[3rem] p-10 space-y-10"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-coral-500" />
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Team Management</h2>
            </div>
            <p className="text-white/40 text-xs font-bold leading-relaxed max-w-xl">
              Add team members to share access to leads, analytics, and your organizational wallet. Admin access is restricted to organization owners.
            </p>
          </div>

          {isAdmin && (
            <form onSubmit={handleAddMember} className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/5 min-w-0 max-w-md w-full">
              <div className="flex items-center gap-3 px-4 flex-1">
                <Mail className="w-4 h-4 text-white/20" />
                <input
                  type="email"
                  placeholder="team@example.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-white focus:outline-none w-full"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isAdding || !newMemberEmail}
                className="p-3 bg-white text-navy-950 rounded-xl hover:bg-coral-500 hover:text-white transition-all disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <div key={member.id} className={cn(
              "border rounded-3xl p-6 flex flex-col gap-4 group transition-all",
              member.role === 'Admin' ? "bg-black/40 border-white/10" : "bg-white/5 border-white/5"
            )}>
              <div className="flex items-start justify-between">
                <div className={cn(
                  "p-3 rounded-2xl transition-colors",
                  member.role === 'Admin' ? "bg-coral-500/20" : "bg-white/10 group-hover:bg-coral-500/10"
                )}>
                  {member.role === 'Admin' ? (
                    <ShieldCheck className="w-5 h-5 text-coral-500" />
                  ) : (
                    <Mail className="w-5 h-5 text-white/40 group-hover:text-coral-500 transition-colors" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                    member.role === 'Admin' ? "text-coral-500 bg-coral-500/10" : "text-white/40 bg-white/5"
                  )}>
                    {member.role}
                  </span>
                  {isAdmin && member.email !== user?.email && (
                    <button
                      onClick={() => removeTeamMember(member.id)}
                      className="p-1.5 hover:bg-red-500/10 text-white/10 hover:text-red-500 transition-all rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-white font-black text-sm truncate">{member.email}</p>
                <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest leading-none">
                  {member.role === 'Admin' ? 'Primary Administrator' : `Added ${member.addedAt ? new Date(member.addedAt.seconds * 1000).toLocaleDateString() : 'recently'}`}
                </p>
              </div>
            </div>
          ))}
          
          {members.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl gap-4">
              <Users className="w-8 h-8 text-white/5" />
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">No additional team members found</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Webhook Configuration Details */}
      <motion.div
        ref={webhookSectionRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-black/40 border border-white/5 rounded-[3rem] p-8 sm:p-12 space-y-10"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-coral-500" />
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Live Webhook Endpoint</h2>
            </div>
            <p className="text-white/40 text-xs font-bold leading-relaxed max-w-xl">
              Point your website forms, Typeform, or custom scripts to this URL. Our AI engine will automatically process, score, and qualify every incoming request.
            </p>
          </div>
          
          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/5 min-w-0">
            <code className="text-[10px] font-mono text-coral-500 px-4 truncate">{webhookUrl}</code>
            <button 
              onClick={copyToClipboard}
              className="p-3 bg-white/10 rounded-xl hover:bg-coral-500 text-white transition-all shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-navy-950/50 p-6 rounded-[2rem] border border-white/5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Payload Requirements</span>
            </div>
            <div className="space-y-4">
              {[
                { key: 'name', type: 'string', required: true },
                { key: 'email', type: 'string', required: false },
                { key: 'phone', type: 'string', required: false },
                { key: 'budget', type: 'string', required: false },
                { key: 'notes', type: 'string', required: false }
              ].map(field => (
                <div key={field.key} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-xs font-mono text-white/80">{field.key}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-white/20 uppercase">{field.type}</span>
                    {field.required && <span className="text-[8px] font-black text-coral-500 uppercase px-1.5 py-0.5 bg-coral-500/10 rounded">Req</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-navy-950/50 p-6 rounded-[2rem] border border-white/5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-white/40" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">AI Transformation</span>
            </div>
            <p className="text-[11px] text-white/40 font-bold leading-relaxed">
              When a lead hits this endpoint, the <span className="text-white">Sales Engine</span> immediately:
            </p>
            <ul className="space-y-3">
              {[
                'Normalizes phone numbers & cleans metadata',
                'Deduplicates against existing database',
                'Runs scoring based on your logic rules',
                'Triggers automated follow-up scheduling'
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-coral-500/20 flex items-center justify-center text-coral-500 text-[8px] font-black mt-0.5 shrink-0">{i+1}</div>
                  <span className="text-[11px] text-white/60 font-bold">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Simple embedded Plus Icon replacement to avoid importing missing icons from older lucide lists
const PlusIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={2.5} 
    stroke="currentColor" 
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export default Integrations;
