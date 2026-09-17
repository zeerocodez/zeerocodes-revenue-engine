import { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Briefcase,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Download,
  Edit3,
  ExternalLink,
  Filter,
  Flame,
  Globe,
  Headphones,
  HelpCircle,
  History,
  Info,
  Laptop,
  Layers,
  MessageSquare,
  Mic,
  MicOff,
  Paperclip,
  Phone,
  PhoneCall,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
  UserCheck,
  UserX,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import type { UserSession } from '../auth/AuthModal';

export interface ConversationThread {
  id: string;
  leadName: string;
  companyName: string;
  serviceCategory: string;
  phone: string;
  channel: 'whatsapp' | 'voice' | 'sms' | 'email';
  qualificationScore: number;
  urgencyDays: number;
  dealValue: number;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  state: 'qualifying' | 'engaged' | 'booked' | 'contacting' | 'human_takeover';
  assignedSetter: string;
  isHumanControlled: boolean;
  speedToLeadSeconds: number;
  aiSetterIntelligence: {
    summary: string;
    painPoints: string[];
    statedBudget: string;
    decisionMakerRole: string;
    suggestedScript: {
      openingHook: string;
      valueBridge: string;
      objectionHandler: string;
      closingCTA: string;
    };
    nextStep: string;
  };
  timeline: {
    time: string;
    action: string;
    badge?: string;
    details: string;
  }[];
  messages: {
    id: string;
    sender: 'lead' | 'ai' | 'setter';
    body: string;
    timestamp: string;
  }[];
}

const INITIAL_CONVERSATIONS: ConversationThread[] = [
  {
    id: 'conv_1',
    leadName: 'Engr. Babatunde Jinadu',
    companyName: 'Prime Construct Ltd',
    serviceCategory: 'Management Consulting & Facilities',
    phone: '+234 803 123 4567',
    channel: 'whatsapp',
    qualificationScore: 92,
    urgencyDays: 2,
    dealValue: 5500000,
    lastMessage: 'Yes, I am the MD and we need this implemented by next week. What does onboarding look like?',
    lastMessageTime: 'Just now',
    unreadCount: 1,
    state: 'qualifying',
    assignedSetter: 'Emeka Nwosu',
    isHumanControlled: false,
    speedToLeadSeconds: 24,
    aiSetterIntelligence: {
      summary: 'High-intent MD at Prime Construct looking for rapid multi-site operations consulting & automation for 400+ leads/mo. Budget is pre-allocated (₦5.5M).',
      painPoints: ['Sales reps cannot keep up with 400+ leads/mo', 'High revenue leakage on slow response times', 'Need 14-day rollout'],
      statedBudget: '₦5,500,000 approved',
      decisionMakerRole: 'Managing Director (Sole Authority)',
      suggestedScript: {
        openingHook: '“Hello Engr. Babatunde, this is Emeka from Zeerocodes. I reviewed your 400 lead/month scaling plan with our AI triage.”',
        valueBridge: '“We deployed this exact 45-second pipeline for a major developer last month, cutting lead drop-off by 73% in 14 days.”',
        objectionHandler: '“If onboarding speed is your primary metric, our Solutions Director handles live DNS & CRM integration within 48 hours.”',
        closingCTA: '“Let’s lock in a 15-minute executive walkthrough today at 2:30 PM so you see the live revenue dashboard in action.”',
      },
      nextStep: 'Confirm Google Meet demo slot for today at 2:30 PM.',
    },
    timeline: [
      { time: '10:14:02', action: 'Lead entered via Meta Lead Ads', badge: 'Webhook', details: 'Auto-ingested from Campaign: High-Ticket B2B Scaling' },
      { time: '10:14:26', action: '⚡ Instant AI WhatsApp Strike Dispatched', badge: '24s latency', details: 'Introductory qualification sequence triggered' },
      { time: '10:16:15', action: 'Lead replied with volume specs', details: 'Volume: 400 inbound leads/mo' },
      { time: '10:17:30', action: 'AI Policy Qualification Engine', badge: 'Score: 92 (UNICORN)', details: 'Budget fit verified (₦5.5M). Decision Maker confirmed (MD).' },
      { time: '10:19:00', action: 'High-Intent Setter Package Generated', details: 'Custom script synthesized and pushed to SDR queue' },
    ],
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
    serviceCategory: 'Specialist Healthcare & Clinics',
    phone: '+234 812 987 6543',
    channel: 'whatsapp',
    qualificationScore: 89,
    urgencyDays: 0,
    dealValue: 4800000,
    lastMessage: 'Let us do tomorrow at 10:00 AM on Google Meet. Please send the link.',
    lastMessageTime: '15m ago',
    unreadCount: 0,
    state: 'booked',
    assignedSetter: 'Folake Adeleke',
    isHumanControlled: false,
    speedToLeadSeconds: 31,
    aiSetterIntelligence: {
      summary: 'Medical Director seeking automated patient triage and consultation bookings across 3 clinic branches.',
      painPoints: ['Front desk missing after-hours patient inquiries', 'High no-show rates on specialist consultations'],
      statedBudget: '₦4,800,000 annual',
      decisionMakerRole: 'Medical Director',
      suggestedScript: {
        openingHook: '“Dr. Amina, this is Folake following up on your automated clinic concierge booking.”',
        valueBridge: '“Our bi-directional EHR calendar sync eliminates patient double-booking while providing 24/7 instant WhatsApp confirmation.”',
        objectionHandler: '“The system integrates directly with your existing Google Calendar / WhatsApp Business without replacing staff.”',
        closingCTA: '“I have reserved tomorrow 10:00 AM with our Lead Healthcare Architect. Link dispatched.”',
      },
      nextStep: 'Dispatch 24h & 2h WhatsApp reminders before Google Meet.',
    },
    timeline: [
      { time: '09:41:00', action: 'Website Form Submission', badge: 'Webhook', details: 'Requested Enterprise Multi-Clinic Rollout' },
      { time: '09:41:31', action: '⚡ Instant AI WhatsApp Strike', badge: '31s latency', details: 'Verified Medical Director role & clinic volume' },
      { time: '09:45:10', action: 'AI Qualification Verified', badge: 'Score: 89', details: 'Immediate purchase window within 48 hours' },
      { time: '10:05:22', action: 'Demo Slot Confirmed', badge: 'Booked', details: 'Tomorrow 10:00 AM Google Meet with Folake Adeleke' },
    ],
    messages: [
      { id: 'm2_1', sender: 'ai', body: 'Dr. Amina, we have an opening tomorrow morning with our Enterprise Specialist Closer.', timestamp: '09:45 AM' },
      { id: 'm2_2', sender: 'lead', body: 'Let us do tomorrow at 10:00 AM on Google Meet. Please send the link.', timestamp: '10:05 AM' },
    ],
  },
  {
    id: 'conv_3',
    leadName: 'Kelechi Okafor',
    companyName: 'Swift Logistics Group',
    serviceCategory: 'IT & Fleet Logistics Services',
    phone: '+234 901 444 8899',
    channel: 'sms',
    qualificationScore: 62,
    urgencyDays: 5,
    dealValue: 3200000,
    lastMessage: 'Can someone call me directly to explain how dispatch automation works?',
    lastMessageTime: '1h ago',
    unreadCount: 1,
    state: 'human_takeover',
    assignedSetter: 'Sarah Alabi',
    isHumanControlled: true,
    speedToLeadSeconds: 42,
    aiSetterIntelligence: {
      summary: 'Fleet Director interested in dispatch automation but requested live phone clarification before committing.',
      painPoints: ['Manual dispatch delays during peak shipping hours', 'Needs voice confirmation before signing'],
      statedBudget: '₦3,200,000 project budget',
      decisionMakerRole: 'Head of Fleet Operations',
      suggestedScript: {
        openingHook: '“Hi Kelechi, Sarah from Zeerocodes calling as requested regarding your fleet dispatch automation.”',
        valueBridge: '“We connect your WhatsApp inquiries directly into automated dispatch tickets in under 3 seconds.”',
        objectionHandler: '“We can set up a live 3-day pilot on 10 of your fleet trucks so you verify reliability first.”',
        closingCTA: '“Let’s do a quick 10-minute screen share right now to show you the driver dispatch view.”',
      },
      nextStep: 'Initiate outbound phone call via Vapi Voice Agent or direct line.',
    },
    timeline: [
      { time: '08:30:12', action: 'Lead Entered from Google Search Ads', badge: 'Webhook', details: 'Logistics Fleet Inbound' },
      { time: '08:30:54', action: '⚡ Instant AI SMS Strike', badge: '42s latency', details: 'SMS channel verification sent' },
      { time: '09:12:00', action: 'Human Call Requested', badge: 'Escalation', details: 'Lead requested direct phone call' },
      { time: '09:12:45', action: 'Human Takeover Activated', badge: 'Setter Mode', details: 'Assigned to Sarah Alabi • AI Auto-pilot paused' },
    ],
    messages: [
      { id: 'm3_1', sender: 'ai', body: 'Hi Kelechi, thanks for contacting Zeerocodes. Are you looking to streamline dispatch and tracking inquiries?', timestamp: '08:30 AM' },
      { id: 'm3_2', sender: 'lead', body: 'Can someone call me directly to explain how dispatch automation works?', timestamp: '09:12 AM' },
    ],
  },
];

export default function UnifiedInboxWorkspace({ session }: { session?: UserSession }) {
  const [threads, setThreads] = useState<ConversationThread[]>(INITIAL_CONVERSATIONS);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('conv_1');
  const [replyInput, setReplyInput] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'voice' | 'sms'>('all');
  const [activeRightTab, setActiveRightTab] = useState<'script' | 'timeline' | 'voice_hub'>('script');
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [voiceCallDuration, setVoiceCallDuration] = useState(0);
  const [isSimulatingLead, setIsSimulatingLead] = useState(false);

  const selectedThread = threads.find((t) => t.id === selectedThreadId) || threads[0];

  // Voice Call Timer Effect
  useEffect(() => {
    let interval: any;
    if (isVoiceCallActive) {
      interval = setInterval(() => {
        setVoiceCallDuration((d) => d + 1);
      }, 1000);
    } else {
      setVoiceCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isVoiceCallActive]);

  const handleSendMessage = () => {
    if (!replyInput.trim()) return;
    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: (selectedThread.isHumanControlled ? 'setter' : 'ai') as 'setter' | 'ai',
      body: replyInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setThreads((prev) =>
      prev.map((t) => (t.id === selectedThread.id ? { ...t, messages: [...t.messages, newMsg], lastMessage: newMsg.body, lastMessageTime: 'Just now' } : t))
    );
    setReplyInput('');
  };

  const handleTakeoverToggle = () => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === selectedThread.id) {
          const nextControlled = !t.isHumanControlled;
          return {
            ...t,
            isHumanControlled: nextControlled,
            state: nextControlled ? 'human_takeover' : 'qualifying',
            timeline: [
              ...t.timeline,
              {
                time: new Date().toLocaleTimeString(),
                action: nextControlled ? 'Human Setter Takeover' : 'Switched back to AI Auto-pilot',
                badge: nextControlled ? 'Setter Active' : 'AI Active',
                details: nextControlled ? `Taken over by ${session?.userName || 'Setter Rep'}` : 'AI bot resumed conversation',
              },
            ],
          };
        }
        return t;
      })
    );
  };

  const handleSimulateInboundLeadStrike = () => {
    setIsSimulatingLead(true);
    const simulatedId = `conv_${Date.now()}`;
    const newThread: ConversationThread = {
      id: simulatedId,
      leadName: 'Chief Kunle Adelekan',
      companyName: 'Adelekan Capital & Advisory',
      serviceCategory: 'Management Consulting & Corporate Advisory',
      phone: '+234 802 555 9900',
      channel: 'whatsapp',
      qualificationScore: 94,
      urgencyDays: 1,
      dealValue: 7500000,
      lastMessage: 'We need restructuring advisory for our subsidiary in Abuja. Can your lead partner call today?',
      lastMessageTime: 'Just now',
      unreadCount: 1,
      state: 'qualifying',
      assignedSetter: session?.userName || 'Sarah Alabi',
      isHumanControlled: false,
      speedToLeadSeconds: 18,
      aiSetterIntelligence: {
        summary: 'Chief Executive seeking immediate advisory for Abuja corporate subsidiary. ₦7.5M budget ready.',
        painPoints: ['Needs fast turnaround before Q4 board audit', 'Requires lead partner presentation'],
        statedBudget: '₦7,500,000 approved',
        decisionMakerRole: 'Chief Executive / Chairman',
        suggestedScript: {
          openingHook: '“Chief Adelekan, good day. Emeka from Zeerocodes following up on your Abuja subsidiary inquiry.”',
          valueBridge: '“Our Senior Corporate Advisory Lead specializes in multi-entity financial & operational turnaround.”',
          objectionHandler: '“We can execute the preliminary memorandum within 5 business days.”',
          closingCTA: '“I can arrange a confidential partner call today at 4:00 PM on Google Meet.”',
        },
        nextStep: 'Dispatch confidential NDA and book Google Meet for 4:00 PM.',
      },
      timeline: [
        { time: '11:20:00', action: 'Lead Submitted Meta Inbound Ad Form', badge: 'Webhook', details: 'Campaign: Corporate Restructuring High-Ticket' },
        { time: '11:20:18', action: '⚡ Instant AI WhatsApp Strike Dispatched', badge: '18s latency', details: 'Automated 45-second outreach executed' },
        { time: '11:21:05', action: 'AI Policy Qualification Engine', badge: 'Score: 94 (UNICORN)', details: 'Budget fit verified (₦7.5M). Chairman authority confirmed.' },
      ],
      messages: [
        { id: 'm_new1', sender: 'ai', body: 'Hello Chief Adelekan, thank you for reaching out to Zeerocodes Corporate Advisory. Are you looking to restructure an active enterprise?', timestamp: '11:20 AM' },
        { id: 'm_new2', sender: 'lead', body: 'We need restructuring advisory for our subsidiary in Abuja. Can your lead partner call today?', timestamp: '11:21 AM' },
      ],
    };

    setTimeout(() => {
      setThreads((prev) => [newThread, ...prev]);
      setSelectedThreadId(simulatedId);
      setIsSimulatingLead(false);
    }, 600);
  };

  const handleTriggerVapiVoiceCall = () => {
    setIsVoiceCallActive(true);
    setActiveRightTab('voice_hub');
  };

  const handleEndVapiVoiceCall = () => {
    setIsVoiceCallActive(false);
    alert('📞 Voice Call completed! Full transcript, AI sentiment (Enthusiastic), and recording saved to lead file.');
  };

  return (
    <div className="dashboard-canvas">
      {/* Top Header & Speed-to-Lead Guarantee Bar */}
      <div className="view-header" style={{ marginBottom: '16px' }}>
        <div className="view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-badge superadmin" style={{ background: '#10b981', color: '#fff' }}>LIVE CONVERSATION ENGINE</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Tenant: <strong>{session?.tenantName || 'Zeerocodes Enterprise'}</strong></span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            SPEED-TO-LEAD <span style={{ color: '#10b981' }}>LIVE STREAM</span>
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            ⚡ 45-SECOND OUTREACH GUARANTEE • AUTOMATED AI WHATSAPP & VOICE DISPATCH • SETTER HANDOFF INTELLIGENCE
          </p>
        </div>

        <div className="view-actions" style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSimulateInboundLeadStrike}
            disabled={isSimulatingLead}
            className="btn-accent"
            style={{
              background: '#10b981',
              color: '#fff',
              border: 'none',
              padding: '9px 18px',
              fontSize: '12.5px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}
          >
            {isSimulatingLead ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
            <span>⚡ Simulate Inbound Lead (&lt;45s Strike)</span>
          </button>
        </div>
      </div>

      {/* Speed to Lead SLA Banner */}
      <div
        style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '10px',
          padding: '12px 18px',
          marginBottom: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)' }}>
            Speed-to-Lead Performance: <span style={{ color: '#059669' }}>26.4s Avg Response Latency</span> (Target: &lt;45s)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--muted)' }}>
          <span>Meta Lead Ads Webhook: <strong style={{ color: '#059669' }}>Active (0ms delay)</strong></span>
          <span>WhatsApp Cloud API: <strong style={{ color: '#059669' }}>Connected</strong></span>
          <span>Vapi Outbound Telephony: <strong style={{ color: '#059669' }}>Ready</strong></span>
        </div>
      </div>

      {/* Main 3-Column Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1.4fr 1.1fr', gap: '18px', minHeight: '620px' }}>
        {/* Left Column: Conversation Thread Selector */}
        <div className="card" style={{ padding: '16px', border: '1px solid var(--line)', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase' }}>Active Inbound Leads ({threads.length})</h3>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Live Queue</span>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            {(['all', 'whatsapp', 'voice', 'sms'] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: channelFilter === ch ? '1px solid #10b981' : '1px solid var(--line)',
                  background: channelFilter === ch ? '#10b981' : 'var(--bg)',
                  color: channelFilter === ch ? '#fff' : 'var(--ink)',
                  cursor: 'pointer',
                }}
              >
                {ch}
              </button>
            ))}
          </div>

          {/* Thread List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
            {threads
              .filter((t) => channelFilter === 'all' || t.channel === channelFilter)
              .map((thread) => {
                const isSelected = selectedThread.id === thread.id;
                return (
                  <div
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid #10b981' : '1px solid var(--line)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>{thread.leadName}</strong>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: thread.qualificationScore >= 90 ? '#10b981' : '#ff5722',
                          color: '#fff',
                        }}
                      >
                        {thread.qualificationScore >= 90 ? 'UNICORN' : 'QUALIFIED'} {thread.qualificationScore}
                      </span>
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginBottom: '6px' }}>
                      {thread.companyName} • <span style={{ color: '#059669', fontWeight: 600 }}>⚡ {thread.speedToLeadSeconds}s contact</span>
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: 'italic' }}>
                      "{thread.lastMessage}"
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Center Column: Live Conversation Stream (WhatsApp / Voice Chat) */}
        <div className="card" style={{ padding: '18px', border: '1px solid var(--line)', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
          {/* Header of Active Thread */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>{selectedThread.leadName}</h3>
                <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  {selectedThread.serviceCategory}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                {selectedThread.companyName} • {selectedThread.phone} • Stated Deal: <strong>₦{selectedThread.dealValue.toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleTakeoverToggle}
                className="btn-secondary"
                style={{
                  fontSize: '11.5px',
                  padding: '6px 12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: selectedThread.isHumanControlled ? '1px solid #ff5722' : '1px solid var(--line)',
                  color: selectedThread.isHumanControlled ? '#ff5722' : 'var(--ink)',
                }}
              >
                {selectedThread.isHumanControlled ? <UserCheck size={14} /> : <Bot size={14} />}
                <span>{selectedThread.isHumanControlled ? 'Setter Active (Takeover)' : 'AI Auto-Pilot'}</span>
              </button>

              <button
                onClick={handleTriggerVapiVoiceCall}
                className="btn-accent"
                style={{
                  fontSize: '11.5px',
                  padding: '6px 14px',
                  fontWeight: 800,
                  background: '#ff5722',
                  color: '#fff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <PhoneCall size={14} />
                <span>Call Lead (Vapi AI)</span>
              </button>
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px', marginBottom: '14px' }}>
            {selectedThread.messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              const isLead = msg.sender === 'lead';
              const isSetter = msg.sender === 'setter';

              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isLead ? 'flex-start' : 'flex-end',
                    maxWidth: '82%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isLead ? 'flex-start' : 'flex-end',
                  }}
                >
                  <div style={{ fontSize: '10.5px', color: 'var(--muted)', marginBottom: '3px', fontWeight: 600 }}>
                    {isLead ? selectedThread.leadName : isAi ? '⚡ Zeerocodes AI Agent (45s)' : `👤 Human Setter (${session?.userName || 'Rep'})`} • {msg.timestamp}
                  </div>
                  <div
                    style={{
                      padding: '11px 15px',
                      borderRadius: isLead ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                      background: isLead ? 'var(--bg)' : isAi ? '#10b981' : '#ff5722',
                      color: isLead ? 'var(--ink)' : '#fff',
                      border: isLead ? '1px solid var(--line)' : 'none',
                      fontSize: '13px',
                      lineHeight: 1.45,
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {msg.body}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Reply Box */}
          <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
            <input
              type="text"
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={selectedThread.isHumanControlled ? 'Type message as Human Setter...' : 'Type message or use AI Suggestion below...'}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: 'var(--bg)',
                color: 'var(--ink)',
                fontSize: '13px',
              }}
            />
            <button
              onClick={handleSendMessage}
              className="btn-accent"
              style={{ background: selectedThread.isHumanControlled ? '#ff5722' : '#10b981', color: '#fff', border: 'none', padding: '0 16px' }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>

        {/* Right Column: Setter Handoff Intelligence Package & Vapi Telephony Hub */}
        <div className="card" style={{ padding: '16px', border: '1px solid var(--line)', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
          {/* Tabs on Top of Right Column */}
          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--line)', paddingBottom: '10px', marginBottom: '12px' }}>
            <button
              onClick={() => setActiveRightTab('script')}
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: '6px',
                border: activeRightTab === 'script' ? '1px solid #ff5722' : '1px solid transparent',
                background: activeRightTab === 'script' ? 'rgba(255, 87, 34, 0.1)' : 'transparent',
                color: activeRightTab === 'script' ? '#ff5722' : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              🎯 Setter Script & Brief
            </button>

            <button
              onClick={() => setActiveRightTab('voice_hub')}
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: '6px',
                border: activeRightTab === 'voice_hub' ? '1px solid #ff5722' : '1px solid transparent',
                background: activeRightTab === 'voice_hub' ? 'rgba(255, 87, 34, 0.1)' : 'transparent',
                color: activeRightTab === 'voice_hub' ? '#ff5722' : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              📞 Vapi Telephony
            </button>

            <button
              onClick={() => setActiveRightTab('timeline')}
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: '6px',
                border: activeRightTab === 'timeline' ? '1px solid #ff5722' : '1px solid transparent',
                background: activeRightTab === 'timeline' ? 'rgba(255, 87, 34, 0.1)' : 'transparent',
                color: activeRightTab === 'timeline' ? '#ff5722' : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              📜 Audit Timeline
            </button>
          </div>

          {/* Tab 1: AI Setter Handoff Intelligence Package */}
          {activeRightTab === 'script' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1 }}>
              <div style={{ background: 'rgba(255, 87, 34, 0.06)', border: '1px solid rgba(255, 87, 34, 0.25)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#ff5722', marginBottom: '4px' }}>
                  • Executive Call Brief & Summary
                </div>
                <p style={{ fontSize: '12px', color: 'var(--ink)', margin: 0, lineHeight: 1.4 }}>
                  {selectedThread.aiSetterIntelligence.summary}
                </p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px', fontSize: '11.5px' }}>
                  <span>Budget: <strong style={{ color: '#059669' }}>{selectedThread.aiSetterIntelligence.statedBudget}</strong></span>
                  <span>Role: <strong>{selectedThread.aiSetterIntelligence.decisionMakerRole}</strong></span>
                </div>
              </div>

              {/* High-Converting Follow-up Script */}
              <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
                  High-Converting Setter Follow-up Script:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#ff5722' }}>1. Opening Hook:</span>
                    <p style={{ margin: '2px 0 0 0', fontStyle: 'italic', color: 'var(--ink)' }}>
                      {selectedThread.aiSetterIntelligence.suggestedScript.openingHook}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>2. Value Bridge:</span>
                    <p style={{ margin: '2px 0 0 0', fontStyle: 'italic', color: 'var(--ink)' }}>
                      {selectedThread.aiSetterIntelligence.suggestedScript.valueBridge}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontWeight: 700, color: '#f59e0b' }}>3. Objection Handler:</span>
                    <p style={{ margin: '2px 0 0 0', fontStyle: 'italic', color: 'var(--ink)' }}>
                      {selectedThread.aiSetterIntelligence.suggestedScript.objectionHandler}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontWeight: 700, color: '#3b82f6' }}>4. Closing CTA:</span>
                    <p style={{ margin: '2px 0 0 0', fontStyle: 'italic', color: 'var(--ink)' }}>
                      {selectedThread.aiSetterIntelligence.suggestedScript.closingCTA}
                    </p>
                  </div>
                </div>
              </div>

              {/* Next Step Action Button */}
              <button
                onClick={() => {
                  alert(`📅 Calendar Demo booked on Client Google Meet calendar for ${selectedThread.leadName}! Notification sent.`);
                }}
                className="btn-accent"
                style={{
                  background: '#ff5722',
                  color: '#fff',
                  border: 'none',
                  padding: '10px',
                  fontSize: '12px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Calendar size={14} />
                <span>Confirm Closer Google Meet Booking</span>
              </button>
            </div>
          )}

          {/* Tab 2: Vapi Outbound Telephony Hub */}
          {activeRightTab === 'voice_hub' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              <div style={{ background: 'var(--bg)', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800 }}>Vapi Outbound AI Caller</span>
                  <span style={{ fontSize: '10.5px', background: '#10b981', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    {isVoiceCallActive ? 'CALL IN PROGRESS' : 'CONNECTED'}
                  </span>
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginBottom: '12px' }}>
                  Voice: <strong>ElevenLabs - Marcus (Deep Executive)</strong> • Latency: <strong>480ms</strong>
                </div>

                {isVoiceCallActive ? (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', height: '40px', marginBottom: '10px' }}>
                      <div className="voice-bar animate-pulse" style={{ width: '4px', height: '24px', background: '#ff5722', borderRadius: '2px' }} />
                      <div className="voice-bar animate-pulse" style={{ width: '4px', height: '36px', background: '#10b981', borderRadius: '2px' }} />
                      <div className="voice-bar animate-pulse" style={{ width: '4px', height: '18px', background: '#ff5722', borderRadius: '2px' }} />
                      <div className="voice-bar animate-pulse" style={{ width: '4px', height: '30px', background: '#10b981', borderRadius: '2px' }} />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#ff5722' }}>
                      Call Active: {Math.floor(voiceCallDuration / 60)}:{(voiceCallDuration % 60).toString().padStart(2, '0')}
                    </div>
                    <button
                      onClick={handleEndVapiVoiceCall}
                      style={{
                        marginTop: '12px',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 16px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      End Call & Save Transcript
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleTriggerVapiVoiceCall}
                    className="btn-accent"
                    style={{ width: '100%', background: '#ff5722', color: '#fff', border: 'none', padding: '10px', fontSize: '12.5px', fontWeight: 800 }}
                  >
                    <PhoneCall size={14} /> Initiate 30s Speed-to-Lead Call
                  </button>
                )}
              </div>

              {/* Sample Real-time Transcript Snippet */}
              <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', flex: 1, overflowY: 'auto' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
                  Live Voice Call Transcript Stream:
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ink)', lineHeight: 1.4 }}>
                  <p style={{ margin: '0 0 6px 0' }}><strong>AI Voice:</strong> "Hello {selectedThread.leadName}, this is Sarah from Zeerocodes following up on your scaling request..."</p>
                  <p style={{ margin: '0 0 6px 0' }}><strong>Lead:</strong> "Yes, we need this for 400 monthly leads. Can we schedule a walkthrough?"</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Audit Timeline */}
          {activeRightTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, fontSize: '11.5px' }}>
              {selectedThread.timeline.map((item, idx) => (
                <div key={idx} style={{ background: 'var(--bg)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--ink)', marginBottom: '2px' }}>
                    <span>{item.action}</span>
                    <span style={{ color: 'var(--muted)' }}>{item.time}</span>
                  </div>
                  <div style={{ color: 'var(--muted)' }}>{item.details}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
