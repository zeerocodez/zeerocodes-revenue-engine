import { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  MessageSquare,
  PhoneCall,
  Plus,
  Search,
  User,
  X,
  FileText,
} from 'lucide-react';
import type { ActivityRecord, ActivityType, ActivityStatus } from '../../domain/activity';
import type { UserSession } from '../auth/AuthModal';

const INITIAL_ACTIVITIES: ActivityRecord[] = [
  {
    id: 'act_1',
    organizationId: 'zeerocodes-hq',
    type: 'call',
    title: 'High-Urgency Discovery Call with MD',
    description: 'Discuss enterprise AI qualification criteria and CRM migration roadmap.',
    status: 'pending',
    dueAt: 'Today, 2:00 PM',
    assignedTo: 'usr_emeka',
    assignedToName: 'Emeka Nwosu',
    createdAt: '2026-09-17T07:00:00Z',
  },
  {
    id: 'act_2',
    organizationId: 'zeerocodes-hq',
    type: 'meeting',
    title: 'Platform Demonstration & Revenue ROI Review',
    description: 'Walk through live demo of speed-to-lead queue and SLA automation.',
    status: 'pending',
    dueAt: 'Today, 4:30 PM',
    assignedTo: 'usr_folake',
    assignedToName: 'Folake Adeleke',
    createdAt: '2026-09-16T12:00:00Z',
  },
  {
    id: 'act_3',
    organizationId: 'zeerocodes-hq',
    type: 'whatsapp',
    title: 'Send Automated Commercial Proposal PDF',
    description: 'Send pricing breakdown for 5,000 monthly lead volume via WhatsApp Business API.',
    status: 'completed',
    dueAt: 'Yesterday, 11:00 AM',
    completedAt: '2026-09-16T11:15:00Z',
    assignedTo: 'usr_sarah',
    assignedToName: 'Sarah Alabi',
    outcome: 'Client confirmed receipt and requested formal board review.',
    createdAt: '2026-09-16T09:00:00Z',
  },
  {
    id: 'act_4',
    organizationId: 'zeerocodes-hq',
    type: 'task',
    title: 'Verify Custom Webhook Payload Integration',
    description: 'Ensure Meta Lead Gen fields map directly to budget, urgency, and decisionMaker properties.',
    status: 'completed',
    dueAt: 'Sep 15, 5:00 PM',
    completedAt: '2026-09-15T16:45:00Z',
    assignedTo: 'usr_david',
    assignedToName: 'David Okonkwo',
    outcome: 'Payload validated with 100% test coverage.',
    createdAt: '2026-09-15T10:00:00Z',
  },
];

interface ActivitiesWorkspaceProps {
  session: UserSession;
}

export default function ActivitiesWorkspace({ session }: ActivitiesWorkspaceProps) {
  const [activities, setActivities] = useState<ActivityRecord[]>(INITIAL_ACTIVITIES);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ActivityType>('call');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('Today, 5:00 PM');

  const filteredActivities = activities.filter((act) => {
    if (statusFilter === 'all') return true;
    return act.status === statusFilter;
  });

  const toggleStatus = (id: string) => {
    setActivities((prev) =>
      prev.map((act) =>
        act.id === id
          ? {
              ...act,
              status: act.status === 'completed' ? 'pending' : 'completed',
              completedAt: act.status === 'completed' ? undefined : new Date().toISOString(),
            }
          : act
      )
    );
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newAct: ActivityRecord = {
      id: `act_${Date.now()}`,
      organizationId: session.tenantId,
      type,
      title: title.trim(),
      description: description.trim(),
      status: 'pending',
      dueAt,
      assignedTo: session.userId,
      assignedToName: session.userName,
      createdAt: new Date().toISOString(),
    };

    setActivities([newAct, ...activities]);
    setIsNewTaskOpen(false);
    setTitle('');
    setDescription('');
  };

  const getTypeIcon = (t: ActivityType) => {
    switch (t) {
      case 'call': return <PhoneCall size={16} color="#0284c7" />;
      case 'meeting': return <Calendar size={16} color="#7c3aed" />;
      case 'whatsapp': return <MessageSquare size={16} color="#16a34a" />;
      case 'email': return <MessageSquare size={16} color="#ea580c" />;
      default: return <FileText size={16} color="var(--ink)" />;
    }
  };

  return (
    <div className="dashboard-canvas">
      <div className="view-header">
        <div className="view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-badge agent">Sales Activities</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Tenant: <strong>{session.tenantName}</strong></span>
          </div>
          <h1>
            Activities, Tasks & Outreach Log
            <span style={{ fontSize: '13px', background: 'var(--white)', border: '1px solid var(--line)', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
              {activities.filter((a) => a.status === 'pending').length} Pending Tasks
            </span>
          </h1>
          <p>Track team outreach, scheduled client meetings, follow-up cadences, and resolution outcomes.</p>
        </div>

        <div className="view-actions">
          <div className="nav-tabs" style={{ background: 'var(--white)' }}>
            {(['all', 'pending', 'completed'] as const).map((s) => (
              <button
                key={s}
                className={`nav-tab-btn ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
                style={{ padding: '6px 12px', fontSize: '12px', textTransform: 'uppercase' }}
              >
                {s}
              </button>
            ))}
          </div>

          <button className="btn-accent" onClick={() => setIsNewTaskOpen(true)}>
            <Plus size={16} /> Log Activity
          </button>
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>Done</th>
              <th>Activity Type</th>
              <th>Task & Summary</th>
              <th>Assigned Rep</th>
              <th>Due Time / Outcome</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredActivities.map((act) => (
              <tr key={act.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={act.status === 'completed'}
                    onChange={() => toggleStatus(act.id)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-deep)', cursor: 'pointer' }}
                  />
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, textTransform: 'capitalize' }}>
                    {getTypeIcon(act.type)} {act.type}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 700, color: act.status === 'completed' ? 'var(--muted)' : 'var(--ink)', textDecoration: act.status === 'completed' ? 'line-through' : 'none' }}>
                    {act.title}
                  </div>
                  {act.description && (
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px' }}>
                      {act.description}
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <User size={14} color="var(--muted)" /> {act.assignedToName}
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '12.5px', fontWeight: 600 }}>{act.dueAt}</div>
                  {act.outcome && (
                    <div style={{ fontSize: '11.5px', color: '#16a34a', marginTop: '2px' }}>
                      ✓ {act.outcome}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`status-pill ${act.status === 'completed' ? 'won' : 'contacting'}`}>
                    {act.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Activity Modal */}
      {isNewTaskOpen && (
        <div className="modal-overlay" onClick={() => setIsNewTaskOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Log New Activity / Task</h3>
              <button onClick={() => setIsNewTaskOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Activity Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ActivityType)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                  >
                    <option value="call">📞 Phone Discovery Call</option>
                    <option value="meeting">📅 Client Video Meeting / Demo</option>
                    <option value="whatsapp">💬 WhatsApp Outreach</option>
                    <option value="task">📝 Follow-up Task</option>
                    <option value="email">✉️ Formal Email Sequence</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Follow up on proposal decision"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Due Time</label>
                  <input
                    type="text"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Notes / Context</label>
                  <textarea
                    rows={3}
                    placeholder="Add meeting notes, customer objections, next steps..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsNewTaskOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Activity</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
