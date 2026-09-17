import { useState } from 'react';
import {
  Copy,
  FileText,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import type { UserSession } from '../auth/AuthModal';

interface MessageTemplate {
  id: string;
  name: string;
  channel: 'whatsapp' | 'sms' | 'email';
  category: 'qualification' | 'booking' | 'followup' | 'recovery';
  subject?: string;
  body: string;
  variables: string[];
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tmpl_1',
    name: 'Instant Inbound Qualification Q1',
    channel: 'whatsapp',
    category: 'qualification',
    body: 'Hello {{lead.name}}! Thank you for requesting a demo of {{tenant.name}}. Are you looking to implement automated revenue intelligence for {{lead.company}} this month?',
    variables: ['lead.name', 'tenant.name', 'lead.company'],
  },
  {
    id: 'tmpl_2',
    name: 'Closer Handoff & Booking Confirmation',
    channel: 'whatsapp',
    category: 'booking',
    body: 'Hi {{lead.name}}, I have reserved a 15-minute executive walkthrough with our solutions director for {{meeting.date_time}}. Please confirm with "YES" to receive the Google Meet link.',
    variables: ['lead.name', 'meeting.date_time'],
  },
  {
    id: 'tmpl_3',
    name: 'Ghosted Lead Recovery Sequence',
    channel: 'sms',
    category: 'recovery',
    body: 'Hi {{lead.name}}, following up on our discussion for {{lead.company}}. We have 2 reserved implementation onboarding slots for Q3. Reply "INFO" to claim.',
    variables: ['lead.name', 'lead.company'],
  },
  {
    id: 'tmpl_4',
    name: 'Commercial Proposal & Terms Email',
    channel: 'email',
    category: 'booking',
    subject: 'Executive Proposal & Implementation Timeline for {{lead.company}}',
    body: 'Dear {{lead.name}},\n\nThank you for taking the time to review our solutions architecture. Attached is the customized commercial proposal for {{lead.company}}.\n\nLooking forward to speaking soon.\n\nBest regards,\n{{closer.name}}\n{{tenant.name}}',
    variables: ['lead.name', 'lead.company', 'closer.name', 'tenant.name'],
  },
];

interface TemplatesWorkspaceProps {
  session: UserSession;
}

export default function TemplatesWorkspace({ session }: TemplatesWorkspaceProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>(DEFAULT_TEMPLATES);
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [isNewTemplateOpen, setIsNewTemplateOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [category, setCategory] = useState<'qualification' | 'booking' | 'followup' | 'recovery'>('qualification');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const filtered = templates.filter((t) => filterChannel === 'all' || t.channel === filterChannel);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;

    const newTmpl: MessageTemplate = {
      id: `tmpl_${Date.now()}`,
      name: name.trim(),
      channel,
      category,
      subject: channel === 'email' ? subject.trim() : undefined,
      body: body.trim(),
      variables: (body.match(/\{\{([^{}]+)\}\}/g) || []).map((v) => v.replace(/[{}]/g, '')),
    };

    setTemplates([newTmpl, ...templates]);
    setIsNewTemplateOpen(false);
    setName('');
    setBody('');
    setSubject('');
  };

  return (
    <div className="dashboard-canvas">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-badge superadmin">Templates & Snippets</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Tenant: <strong>{session.tenantName}</strong></span>
          </div>
          <h1>
            Dynamic Outreach & Messaging Templates
            <span style={{ fontSize: '13px', background: 'var(--accent-bg)', color: 'var(--accent-deep)', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
              {templates.length} Active Templates
            </span>
          </h1>
          <p>Create reusable personalization templates with dynamic tokens for WhatsApp, SMS, and Email outreach.</p>
        </div>

        <div className="view-actions">
          <div className="nav-tabs" style={{ background: 'var(--white)' }}>
            {(['all', 'whatsapp', 'sms', 'email'] as const).map((ch) => (
              <button
                key={ch}
                className={`nav-tab-btn ${filterChannel === ch ? 'active' : ''}`}
                onClick={() => setFilterChannel(ch)}
                style={{ padding: '6px 12px', fontSize: '12px', textTransform: 'capitalize' }}
              >
                {ch === 'all' ? 'All Channels' : ch}
              </button>
            ))}
          </div>

          <button className="btn-accent" onClick={() => setIsNewTemplateOpen(true)}>
            <Plus size={16} /> New Template
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {filtered.map((t) => (
          <div key={t.id} className="table-card" style={{ padding: '20px', margin: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span className="status-pill" style={{ textTransform: 'uppercase', background: t.channel === 'whatsapp' ? '#dcfce7' : t.channel === 'email' ? '#e0f2fe' : '#fef3c7', color: t.channel === 'whatsapp' ? '#166534' : t.channel === 'email' ? '#0369a1' : '#b45309' }}>
                {t.channel}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'capitalize' }}>
                {t.category}
              </span>
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--ink)' }}>{t.name}</h3>

            {t.subject && (
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', marginBottom: '8px' }}>
                Subject: {t.subject}
              </div>
            )}

            <div style={{ fontSize: '13px', color: 'var(--ink)', background: 'var(--paper)', border: '1px solid var(--line)', padding: '12px 14px', borderRadius: '8px', lineHeight: 1.5, flex: 1, whiteSpace: 'pre-line', marginBottom: '14px' }}>
              {t.body}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--line)', paddingTop: '10px' }}>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {t.variables.map((v) => (
                  <span key={v} style={{ fontSize: '10px', background: 'var(--white)', border: '1px solid var(--line)', padding: '2px 6px', borderRadius: '4px', color: 'var(--muted)' }}>
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
              <button
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: '11.5px' }}
                onClick={() => {
                  navigator.clipboard.writeText(t.body);
                  alert('Template copied to clipboard!');
                }}
              >
                <Copy size={13} /> Copy
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Template Modal */}
      {isNewTemplateOpen && (
        <div className="modal-overlay" onClick={() => setIsNewTemplateOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Create Dynamic Template</h3>
              <button onClick={() => setIsNewTemplateOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Template Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP Demo Invite"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Channel</label>
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value as any)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                    >
                      <option value="whatsapp">💬 WhatsApp</option>
                      <option value="sms">📱 SMS</option>
                      <option value="email">✉️ Email</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                    >
                      <option value="qualification">Qualification</option>
                      <option value="booking">Booking</option>
                      <option value="followup">Follow-up</option>
                      <option value="recovery">Recovery</option>
                    </select>
                  </div>
                </div>

                {channel === 'email' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Email Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. Proposal for {{lead.company}}"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Message Body (Use tokens like {'{{lead.name}}'}, {'{{lead.company}}'}, {'{{booking.link}}'})</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Hello {{lead.name}}..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsNewTemplateOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
