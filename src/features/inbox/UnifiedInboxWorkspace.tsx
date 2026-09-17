import { useState } from 'react';
import {
  Bot,
  CheckCheck,
  Clock,
  Filter,
  Flame,
  MessageSquare,
  Paperclip,
  Phone,
  PhoneCall,
  Plus,
  Search,
  Send,
  Sparkles,
  Tag,
  User,
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
  state: 'qualifying' | 'engaged' | 'booked' | 'contacting';
  assignedRep: string;
  aiSuggestedReply: string;
  messages: {
    id: string;
    sender: 'lead' | 'ai' | 'agent';
    body: string;
    timestamp: string;
  }[];
}

const SAMPLE_THREADS: ConversationThread[] = [
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
    aiSuggestedReply: 'Hello Engr. Babatunde! Onboarding takes under 48 hours with our dedicated solutions architect. Would you like me to book a 15-minute deployment walkthrough today at 2:30 PM?',
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
    aiSuggestedReply: 'Calendar invite confirmed for tomorrow at 10:00 AM. A meeting link and executive brief have been sent to your email.',
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
    qualificationScore: 64,
    urgencyDays: 7,
    dealValue: 3200000,
    lastMessage: 'Can you send the pricing tier for 1,000 monthly active leads?',
    lastMessageTime: '1h ago',
    unreadCount: 0,
    state: 'engaged',
    assignedRep: 'Sarah Alabi',
    aiSuggestedReply: 'Hi Kelechi, our Growth Tier covers up to 1,500 active leads with full AI qualification and speed-to-lead triage. I have attached the spec sheet.',
    messages: [
      { id: 'm3_1', sender: 'lead', body: 'Can you send the pricing tier for 1,000 monthly active leads?', timestamp: '09:12 AM' },
    ],
  },
];

interface UnifiedInboxWorkspaceProps {
  session: UserSession;
}

export default function UnifiedInboxWorkspace({ session }: UnifiedInboxWorkspaceProps) {
  const [threads, setThreads] = useState<ConversationThread[]>(SAMPLE_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string>(SAMPLE_THREADS[0].id);
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="dashboard-canvas" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* View Header */}
      <div className="view-header" style={{ marginBottom: '16px' }}>
        <div className="view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span className="role-badge superadmin">Multi-Channel Inbox</span>
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
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 300px', gap: '16px', flex: 1, minHeight: 0 }}>
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
                    <span className="status-pill" style={{ fontSize: '10.5px', padding: '1px 6px', background: thread.channel === 'whatsapp' ? '#dcfce7' : '#e0f2fe', color: thread.channel === 'whatsapp' ? '#166534' : '#0369a1' }}>
                      {thread.channel.toUpperCase()}
                    </span>
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
              <span className={`status-pill ${activeThread.state === 'booked' ? 'booked' : activeThread.state === 'qualifying' ? 'qualifying' : 'contacting'}`}>
                {activeThread.state.toUpperCase()}
              </span>
              <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => alert(`Dialing ${activeThread.phone}...`)}>
                <PhoneCall size={13} /> Call
              </button>
            </div>
          </div>

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
                    {isLead ? activeThread.leadName : isAi ? 'AI Qualification Orchestrator' : session.userName}
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
                <span style={{ fontWeight: 700 }}>AI Suggested Action:</span>
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

        {/* Right: Lead Intelligence & Fast Actions */}
        <div className="dark-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px', margin: 0, overflowY: 'auto' }}>
          <div style={{ borderBottom: '1px solid var(--dark-border)', paddingBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lead Intelligence Profile
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              {activeThread.leadName}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--dark-muted)' }}>
              {activeThread.companyName}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'var(--dark-surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--dark-border)' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--dark-muted)', textTransform: 'uppercase' }}>AI Score</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)' }}>{activeThread.qualificationScore}/100</div>
            </div>
            <div style={{ background: 'var(--dark-surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--dark-border)' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--dark-muted)', textTransform: 'uppercase' }}>Urgency</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffbf72' }}>{activeThread.urgencyDays} Days</div>
            </div>
          </div>

          <div style={{ background: 'var(--dark-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--dark-border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--dark-muted)' }}>Estimated Deal Value:</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
              ₦{activeThread.dealValue.toLocaleString()}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
            <button
              className="btn-accent"
              style={{ width: '100%', justifyContent: 'center', fontSize: '12.5px' }}
              onClick={() => alert(`Appointment booking link sent to ${activeThread.leadName}!`)}
            >
              <Zap size={14} /> Instant Closer Handoff
            </button>
            <button
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '12.5px', background: 'var(--dark-surface)', color: 'var(--dark-text)', borderColor: 'var(--dark-border)' }}
              onClick={() => alert(`Moved ${activeThread.leadName} to Long-term Nurture sequence.`)}
            >
              Move to Drip Sequence
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
