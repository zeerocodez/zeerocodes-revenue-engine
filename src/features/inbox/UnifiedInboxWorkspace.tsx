import { useState } from 'react';
import {
  AlertCircle,
  Bot,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  Edit3,
  Filter,
  Flame,
  HelpCircle,
  History,
  MessageSquare,
  Paperclip,
  Phone,
  PhoneCall,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Tag,
  User,
  UserCheck,
  UserX,
  X,
  Zap,
} from 'lucide-react';
import type { UserSession } from '../auth/AuthModal';

interface ConversationThread {
  id: string;
  leadName: string;
  companyName: string;
  phone: string;
  channel: 'whatsapp' | 'sms' | 'email' | 'web';
  qualificationScore: number;
  urgencyDays: number;
  dealValue: number;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  state: 'qualifying' | 'engaged' | 'booked' | 'contacting' | 'human_takeover';
  assignedRep: string;
  isHumanControlled: boolean;
  aiSuggestedReply: string;
  timeline: {
    time: string;
    action: string;
    badge?: string;
    details: string;
  }[];
  auditTrail: {
    date: string;
    actor: string;
    action: string;
    reason: string;
  }[];
  messages: {
    id: string;
    sender: 'lead' | 'ai' | 'agent';
    body: string;
    timestamp: string;
  }[];
}

const INITIAL_THREADS: ConversationThread[] = [
  {
    id: 'conv_1',
    leadName: 'Engr. Babatunde Jinadu',
    companyName: 'Prime Construct Ltd',
    phone: '+234 803 123 4567',
    channel: 'whatsapp',
    qualificationScore: 88,
    urgencyDays: 2,
    dealValue: 2500000,
    lastMessage: 'Yes, I am the MD and we need this implemented by next week. What does onboarding look like?',
    lastMessageTime: '3m ago',
    unreadCount: 1,
    state: 'qualifying',
    assignedRep: 'Emeka Nwosu',
    isHumanControlled: false,
    aiSuggestedReply: 'Hello Engr. Babatunde! Onboarding takes under 48 hours with our dedicated solutions architect. Would you like me to book a 15-minute deployment walkthrough today at 2:30 PM?',
    timeline: [
      { time: '10:14:02', action: 'Lead entered via Meta Lead Ads', badge: 'Webhook', details: 'Auto-ingested from Campaign: Q3 High-Growth Scale' },
      { time: '10:14:08', action: 'AI Fast-Response Dispatched', badge: '6s latency', details: 'Automated introductory message sent on WhatsApp' },
      { time: '10:16:15', action: 'Lead replied with requirement', details: 'Volume: 400 inbound leads/mo' },
      { time: '10:17:30', action: 'AI Policy Qualification Engine', badge: 'Score: 88', details: 'Budget fit verified (₦2.5M). Decision Maker confirmed (MD).' },
      { time: '10:19:00', action: 'High-Intent Booking Triggered', details: 'Ready for Closer demonstration booking' },
    ],
    auditTrail: [],
    messages: [
      { id: 'm1', sender: 'ai', body: 'Hello Engr. Babatunde! Thank you for requesting a demo of the Zeerocodes Revenue Growth Engine. Are you looking to automate lead qualification for Prime Construct Ltd?', timestamp: '10:14 AM' },
      { id: 'm2', sender: 'lead', body: 'Yes, we are currently receiving over 400 inbound leads a month and our sales team cannot keep up.', timestamp: '10:16 AM' },
      { id: 'm3', sender: 'ai', body: 'Understood. Are you the primary decision-maker for commercial tooling at Prime Construct, and what timeframe are you looking at?', timestamp: '10:17 AM' },
      { id: 'm4', sender: 'lead', body: 'Yes, I am the MD and we need this implemented by next week. What does onboarding look like?', timestamp: '10:19 AM' },
    ],
  },
  {
    id: 'conv_2',
    leadName: 'Dr. Amina Bello',
    companyName: 'Apex Health Systems',
    phone: '+234 812 987 6543',
    channel: 'whatsapp',
    qualificationScore: 92,
    urgencyDays: 0,
    dealValue: 4800000,
    lastMessage: 'Let us do tomorrow at 10:00 AM on Google Meet. Please send the link.',
    lastMessageTime: '15m ago',
    unreadCount: 0,
    state: 'booked',
    assignedRep: 'Folake Adeleke',
    isHumanControlled: false,
    aiSuggestedReply: 'Calendar invite confirmed for tomorrow at 10:00 AM. A meeting link and executive brief have been sent to your email.',
    timeline: [
      { time: '09:41:00', action: 'Website Form Submission', badge: 'Webhook', details: 'Requested Enterprise Multi-Clinic Rollout' },
      { time: '09:41:06', action: 'AI Initial Triage', badge: '5s latency', details: 'Verified Medical Director role & budget' },
      { time: '09:45:10', action: 'AI Qualification Verified', badge: 'Score: 92', details: 'Immediate purchase window within 48 hours' },
      { time: '10:05:22', action: 'Demo Slot Confirmed', badge: 'Booked', details: 'Tomorrow 10:00 AM Google Meet with Folake Adeleke' },
    ],
    auditTrail: [],
    messages: [
      { id: 'm2_1', sender: 'ai', body: 'Dr. Amina, we have an opening tomorrow morning with our Enterprise Closer.', timestamp: '09:45 AM' },
      { id: 'm2_2', sender: 'lead', body: 'Let us do tomorrow at 10:00 AM on Google Meet. Please send the link.', timestamp: '10:05 AM' },
    ],
  },
  {
    id: 'conv_3',
    leadName: 'Kelechi Okafor',
    companyName: 'Swift Logistics Group',
    phone: '+234 901 444 8899',
    channel: 'sms',
    qualificationScore: 54,
    urgencyDays: 7,
    dealValue: 3200000,
    lastMessage: 'Can someone call me directly to explain the setup?',
    lastMessageTime: '1h ago',
    unreadCount: 1,
    state: 'human_takeover',
    assignedRep: 'Sarah Alabi',
    isHumanControlled: true,
    aiSuggestedReply: 'Hi Kelechi, Sarah from Zeerocodes here. I can call your number right now. Is +234 901 444 8899 the best line?',
    timeline: [
      { time: '08:30:12', action: 'Lead Entered from Google Search Ads', badge: 'Webhook', details: 'Logistics Fleet Inbound' },
      { time: '08:30:18', action: 'AI Initial Outreach Dispatched', details: 'SMS channel verification' },
      { time: '09:12:00', action: 'Human Assistance Requested', badge: 'Escalation', details: 'Lead requested direct phone call' },
      { time: '09:12:45', action: 'Human Takeover Activated', badge: 'SDR Mode', details: 'Assigned to Sarah Alabi • AI Auto-pilot paused' },
    ],
    auditTrail: [
      { date: '17 Sept 2026 09:12', actor: 'Sarah Alabi', action: 'Takeover Conversation', reason: 'Lead explicitly requested human phone call' },
    ],
    messages: [
      { id: 'm3_1', sender: 'ai', body: 'Hi Kelechi, thanks for contacting Zeerocodes. Are you looking to streamline dispatch and tracking inquiries?', timestamp: '08:30 AM' },
      { id: 'm3_2', sender: 'lead', body: 'Can someone call me directly to explain the setup?', timestamp: '09:12 AM' },
    ],
  },
];

interface UnifiedInboxWorkspaceProps {
  session: UserSession;
}

export default function UnifiedInboxWorkspace({ session }: UnifiedInboxWorkspaceProps) {
  const [threads, setThreads] = useState<ConversationThread[]>(INITIAL_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string>(INITIAL_THREADS[0].id);
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRightTab, setActiveRightTab] = useState<'profile' | 'timeline' | 'audit'>('profile');

  // Override Qualification Modal State
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideScore, setOverrideScore] = useState(90);
  const [overrideReason, setOverrideReason] = useState('Strategic enterprise client with high expansion potential.');

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  const filteredThreads = threads.filter((t) => {
    const matchChannel = filterChannel === 'all' || t.channel === filterChannel;
    const matchSearch =
      t.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone.includes(searchQuery);
    return matchChannel && matchSearch;
  });

  const handleSendMessage = (textToSend?: string) => {
    const body = (textToSend || messageInput).trim();
    if (!body) return;

    const newMessage = {
      id: `m_${Date.now()}`,
      sender: 'agent' as const,
      body,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              lastMessage: body,
              lastMessageTime: 'Just now',
              messages: [...t.messages, newMessage],
            }
          : t
      )
    );

    setMessageInput('');
  };

  const handleApplyAISuggestion = () => {
    if (activeThread.aiSuggestedReply) {
      setMessageInput(activeThread.aiSuggestedReply);
    }
  };

  const handleToggleHumanTakeover = () => {
    const nextControlled = !activeThread.isHumanControlled;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThread.id) {
          const newTimelineItem = {
            time: now,
            action: nextControlled ? 'Human Takeover Activated' : 'AI Autopilot Resumed',
            badge: nextControlled ? 'Human SDR' : 'AI Active',
            details: nextControlled
              ? `Rep ${session.userName} took over live conversation.`
              : 'AI auto-response and qualification engine re-engaged.',
          };
          const newAuditItem = {
            date: `${today} ${now}`,
            actor: session.userName,
            action: nextControlled ? 'Manual Takeover' : 'Release to AI',
            reason: nextControlled ? 'Agent intervention for direct closing' : 'Standard qualification flow restored',
          };
          return {
            ...t,
            isHumanControlled: nextControlled,
            state: nextControlled ? 'human_takeover' : 'engaged',
            timeline: [...t.timeline, newTimelineItem],
            auditTrail: [newAuditItem, ...t.auditTrail],
          };
        }
        return t;
      })
    );
  };

  const handleConfirmOverride = () => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThread.id) {
          const newTimelineItem = {
            time: now,
            action: `Qualification Score Overridden: ${overrideScore}/100`,
            badge: 'Admin Override',
            details: `Reason: ${overrideReason}`,
          };
          const newAuditItem = {
            date: `${today} ${now}`,
            actor: session.userName,
            action: `Score Override (${t.qualificationScore} -> ${overrideScore})`,
            reason: overrideReason,
          };
          return {
            ...t,
            qualificationScore: overrideScore,
            state: overrideScore >= 75 ? 'qualifying' : 'contacting',
            timeline: [...t.timeline, newTimelineItem],
            auditTrail: [newAuditItem, ...t.auditTrail],
          };
        }
        return t;
      })
    );

    setIsOverrideModalOpen(false);
  };

  return (
    <div className="dashboard-canvas" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* View Header */}
      <div className="view-header" style={{ marginBottom: '16px' }}>
        <div className="view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span className="role-badge superadmin">Multi-Channel Ingestion & AI Stream</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Tenant: <strong>{session.tenantName}</strong></span>
          </div>
          <h1 style={{ fontSize: '22px' }}>
            Unified Live Conversation Stream
            <span style={{ fontSize: '12px', background: 'rgba(199, 255, 85, 0.2)', color: 'var(--accent-deep)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
              WhatsApp • SMS • Email • Web
            </span>
          </h1>
        </div>

        <div className="view-actions">
          <div className="nav-tabs" style={{ background: 'var(--white)' }}>
            {(['all', 'whatsapp', 'sms', 'email'] as const).map((ch) => (
              <button
                key={ch}
                className={`nav-tab-btn ${filterChannel === ch ? 'active' : ''}`}
                onClick={() => setFilterChannel(ch)}
                style={{ padding: '5px 10px', fontSize: '12px', textTransform: 'capitalize' }}
              >
                {ch === 'all' ? 'All Channels' : ch}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3-Column Inbox Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 340px', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* Left: Threads Sidebar */}
        <div className="table-card" style={{ display: 'flex', flexDirection: 'column', margin: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                  fontSize: '12.5px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {filteredThreads.map((thread) => {
              const active = thread.id === activeThread.id;
              return (
                <div
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--line)',
                    background: active ? 'rgba(199, 255, 85, 0.12)' : 'var(--white)',
                    borderLeft: active ? '3px solid var(--ink)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>{thread.leadName}</span>
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{thread.lastMessageTime}</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginBottom: '6px' }}>
                    🏢 {thread.companyName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {thread.lastMessage}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span className="status-pill" style={{ fontSize: '10px', padding: '1px 6px', background: thread.channel === 'whatsapp' ? '#dcfce7' : '#e0f2fe', color: thread.channel === 'whatsapp' ? '#166534' : '#0369a1' }}>
                        {thread.channel.toUpperCase()}
                      </span>
                      {thread.isHumanControlled && (
                        <span style={{ fontSize: '9.5px', background: '#fee2e2', color: '#991b1b', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                          HUMAN
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a' }}>
                      ₦{thread.dealValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Live Conversation Thread */}
        <div className="table-card" style={{ display: 'flex', flexDirection: 'column', margin: 0, overflow: 'hidden' }}>
          {/* Thread Header */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--paper)' }}>
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--ink)' }}>{activeThread.leadName}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{activeThread.phone} • {activeThread.companyName}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleToggleHumanTakeover}
                className={activeThread.isHumanControlled ? 'btn-secondary' : 'btn-accent'}
                style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 700 }}
              >
                {activeThread.isHumanControlled ? (
                  <>
                    <Bot size={13} /> Resume AI Autopilot
                  </>
                ) : (
                  <>
                    <User size={13} /> Take Over Conversation
                  </>
                )}
              </button>

              <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => alert(`Calling ${activeThread.phone}...`)}>
                <PhoneCall size={13} /> Call
              </button>
            </div>
          </div>

          {/* Human Takeover Notice Banner */}
          {activeThread.isHumanControlled && (
            <div style={{ background: '#fffbeb', borderBottom: '1px solid #fef3c7', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#92400e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={14} color="#b45309" />
                <span><strong>Human Control Active:</strong> AI auto-replies are paused. You are chatting directly with this lead.</span>
              </div>
            </div>
          )}

          {/* Messages Stream */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--white)' }}>
            {activeThread.messages.map((msg) => {
              const isLead = msg.sender === 'lead';
              const isAi = msg.sender === 'ai';
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isLead ? 'flex-start' : 'flex-end',
                    maxWidth: '75%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isLead ? 'flex-start' : 'flex-end',
                  }}
                >
                  <div style={{ fontSize: '10.5px', color: 'var(--muted)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isAi && <Bot size={12} color="var(--accent-deep)" />}
                    {isLead ? activeThread.leadName : isAi ? 'AI Qualification Orchestrator' : `${session.userName} (SDR Rep)`}
                  </div>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: isLead ? 'var(--paper)' : isAi ? 'var(--dark)' : 'var(--ink)',
                      color: isLead ? 'var(--ink)' : isAi ? 'var(--accent)' : '#fff',
                      border: isLead ? '1px solid var(--line)' : 'none',
                      fontSize: '13px',
                      lineHeight: 1.45,
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {msg.body}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>{msg.timestamp}</span>
                </div>
              );
            })}
          </div>

          {/* AI Smart Suggestion Bar */}
          {activeThread.aiSuggestedReply && (
            <div style={{ padding: '8px 16px', background: 'rgba(199, 255, 85, 0.15)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--ink)', overflow: 'hidden' }}>
                <Sparkles size={15} color="var(--accent-deep)" />
                <span style={{ fontWeight: 700 }}>AI Next Action:</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--muted)' }}>
                  {activeThread.aiSuggestedReply}
                </span>
              </div>
              <button
                type="button"
                onClick={handleApplyAISuggestion}
                className="btn-accent"
                style={{ padding: '4px 10px', fontSize: '11.5px', whiteSpace: 'nowrap' }}
              >
                Use Suggestion
              </button>
            </div>
          )}

          {/* Message Input Box */}
          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--line)', background: 'var(--paper)', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder={`Reply to ${activeThread.leadName} via ${activeThread.channel.toUpperCase()}...`}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: 'var(--white)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button className="btn-primary" onClick={() => handleSendMessage()}>
              <Send size={15} /> Send
            </button>
          </div>
        </div>

        {/* Right: Lead Intelligence, Transparent AI Timeline & Audit Trail */}
        <div className="dark-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', margin: 0, overflowY: 'auto' }}>
          {/* Sub-tabs for intelligence sidebar */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--dark-surface)', padding: '3px', borderRadius: '8px', border: '1px solid var(--dark-border)' }}>
            <button
              onClick={() => setActiveRightTab('profile')}
              style={{
                flex: 1,
                padding: '5px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: activeRightTab === 'profile' ? 700 : 500,
                background: activeRightTab === 'profile' ? 'var(--dark-card)' : 'transparent',
                color: activeRightTab === 'profile' ? 'var(--accent)' : 'var(--dark-muted)',
                cursor: 'pointer',
              }}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveRightTab('timeline')}
              style={{
                flex: 1,
                padding: '5px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: activeRightTab === 'timeline' ? 700 : 500,
                background: activeRightTab === 'timeline' ? 'var(--dark-card)' : 'transparent',
                color: activeRightTab === 'timeline' ? 'var(--accent)' : 'var(--dark-muted)',
                cursor: 'pointer',
              }}
            >
              AI Timeline
            </button>
            <button
              onClick={() => setActiveRightTab('audit')}
              style={{
                flex: 1,
                padding: '5px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: activeRightTab === 'audit' ? 700 : 500,
                background: activeRightTab === 'audit' ? 'var(--dark-card)' : 'transparent',
                color: activeRightTab === 'audit' ? 'var(--accent)' : 'var(--dark-muted)',
                cursor: 'pointer',
              }}
            >
              Audit ({activeThread.auditTrail.length})
            </button>
          </div>

          {/* TAB 1: PROFILE */}
          {activeRightTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ borderBottom: '1px solid var(--dark-border)', paddingBottom: '8px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                  Intelligence Summary
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                  {activeThread.leadName}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--dark-muted)' }}>
                  {activeThread.companyName}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'var(--dark-surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--dark-border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--dark-muted)', textTransform: 'uppercase' }}>AI Score</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)' }}>{activeThread.qualificationScore}/100</div>
                </div>
                <div style={{ background: 'var(--dark-surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--dark-border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--dark-muted)', textTransform: 'uppercase' }}>Urgency</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffbf72' }}>{activeThread.urgencyDays} Days</div>
                </div>
              </div>

              <div style={{ background: 'var(--dark-surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--dark-border)' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--dark-muted)' }}>Estimated Deal Value:</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                  ₦{activeThread.dealValue.toLocaleString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                <button
                  className="btn-accent"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
                  onClick={() => alert(`Appointment booking link sent to ${activeThread.leadName}!`)}
                >
                  <Zap size={14} /> Instant Closer Handoff
                </button>
                <button
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '12px', background: 'var(--dark-surface)', color: 'var(--dark-text)', borderColor: 'var(--dark-border)' }}
                  onClick={() => setIsOverrideModalOpen(true)}
                >
                  <Edit3 size={13} /> Override Qualification
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TRANSPARENT AI TIMELINE (Section 15 of Operating Model) */}
          {activeRightTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                Transparent AI Execution Log
              </div>
              <p style={{ fontSize: '11px', color: 'var(--dark-muted)', margin: 0 }}>
                Verifiable event trail showing each automated stage from ingress to handoff.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                {activeThread.timeline.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 10px',
                      background: 'var(--dark-surface)',
                      borderRadius: '6px',
                      border: '1px solid var(--dark-border)',
                      fontSize: '11.5px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#fff' }}>{item.action}</span>
                      <span style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: 'monospace' }}>{item.time}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--dark-muted)', marginTop: '2px' }}>
                      {item.details}
                    </div>
                    {item.badge && (
                      <span style={{ display: 'inline-block', fontSize: '9.5px', background: 'rgba(199, 255, 85, 0.15)', color: 'var(--accent)', padding: '1px 5px', borderRadius: '4px', marginTop: '4px', fontWeight: 700 }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL (Section 13 of Operating Model) */}
          {activeRightTab === 'audit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                Governance & Override Audit Log
              </div>

              {activeThread.auditTrail.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--dark-muted)', fontSize: '11.5px' }}>
                  No manual overrides or takeovers logged yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeThread.auditTrail.map((audit, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 10px',
                        background: 'var(--dark-surface)',
                        borderRadius: '6px',
                        border: '1px solid var(--dark-border)',
                        fontSize: '11.5px',
                      }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{audit.action}</div>
                      <div style={{ fontSize: '11px', color: '#fff', marginTop: '2px' }}>
                        By: <strong>{audit.actor}</strong> • {audit.date}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--dark-muted)', marginTop: '2px' }}>
                        Reason: {audit.reason}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Override Qualification Modal */}
      {isOverrideModalOpen && (
        <div className="auth-modal-backdrop" onClick={() => setIsOverrideModalOpen(false)}>
          <div className="auth-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Override Qualification Decision</h3>
              <button onClick={() => setIsOverrideModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px' }}>
              As a client manager or admin, you can override the AI score. This action creates a permanent audit log entry.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  New Qualification Score (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  Mandatory Audit Reason
                </label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Strategic account, VIP referral, custom pricing arrangement..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '12.5px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn-secondary" onClick={() => setIsOverrideModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-accent" onClick={handleConfirmOverride}>
                Log Override & Update Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
