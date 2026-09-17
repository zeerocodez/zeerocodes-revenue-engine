import { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  LayoutGrid,
  List,
  Mail,
  MessageSquare,
  Phone,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Users,
  Video,
  X,
  Zap,
} from 'lucide-react';
import type { UserSession } from '../auth/AuthModal';

interface FollowUpTask {
  id: string;
  leadName: string;
  company: string;
  phone: string;
  type: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING';
  status: 'UPCOMING' | 'OVERDUE' | 'COMPLETED';
  dueDate: string;
  notes: string;
  dealValue: number;
  aiSuggestedPrompt?: string;
}

const INITIAL_TASKS: FollowUpTask[] = [
  {
    id: 'task_01',
    leadName: 'Engr. Babatunde Jinadu',
    company: 'Prime Construct Ltd',
    phone: '+234 803 123 4567',
    type: 'CALL',
    status: 'UPCOMING',
    dueDate: 'Today at 2:30 PM',
    notes: 'Demo call scheduled. Confirm post-construction scope (2,000 sqm) and decision-making timeline.',
    dealValue: 2500000,
    aiSuggestedPrompt: 'Confirm site inspection date for Lekki Phase 1 project.',
  },
  {
    id: 'task_02',
    leadName: 'Dr. Amina Bello',
    company: 'Apex Health Systems',
    phone: '+234 812 987 6543',
    type: 'MEETING',
    status: 'UPCOMING',
    dueDate: 'Tomorrow at 10:00 AM',
    notes: 'Executive Google Meet presentation with Medical Director. Present multi-clinic rollout proposal.',
    dealValue: 4800000,
    aiSuggestedPrompt: 'Send Zoom/Google Meet link and executive deck 30 mins before meeting.',
  },
  {
    id: 'task_03',
    leadName: 'Kelechi Okafor',
    company: 'Swift Logistics Group',
    phone: '+234 901 444 8899',
    type: 'WHATSAPP',
    status: 'OVERDUE',
    dueDate: 'Yesterday at 4:00 PM',
    notes: 'Requested tier pricing for active logistics terminals. AI sent quote; rep touch needed.',
    dealValue: 3200000,
    aiSuggestedPrompt: 'Hi Kelechi, following up on the warehouse maintenance pricing sent yesterday.',
  },
  {
    id: 'task_04',
    leadName: 'Folake Adeleke',
    company: 'Sterling Crest Properties',
    phone: '+234 803 999 0011',
    type: 'EMAIL',
    status: 'COMPLETED',
    dueDate: '16 Sept 2026',
    notes: 'Executed commercial terms and onboarding agreement.',
    dealValue: 1800000,
  },
];

export default function FollowUpCadenceWorkspace({ session }: { session?: UserSession }) {
  const [tasks, setTasks] = useState<FollowUpTask[]>(INITIAL_TASKS);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    leadName: '',
    company: '',
    phone: '',
    type: 'CALL' as const,
    dueDate: 'Today at 3:00 PM',
    notes: '',
    dealValue: 1500000,
  });

  const filteredTasks = tasks.filter((t) => {
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchChannel = channelFilter === 'ALL' || t.type === channelFilter;
    const matchSearch =
      t.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.notes.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchChannel && matchSearch;
  });

  const handleCompleteTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'COMPLETED' as const } : t))
    );
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.leadName) return;

    const created: FollowUpTask = {
      id: `task_${Date.now()}`,
      leadName: newTaskForm.leadName,
      company: newTaskForm.company || 'Private Client',
      phone: newTaskForm.phone || '+234 800 000 0000',
      type: newTaskForm.type,
      status: 'UPCOMING',
      dueDate: newTaskForm.dueDate,
      notes: newTaskForm.notes || 'Follow-up task scheduled.',
      dealValue: Number(newTaskForm.dealValue) || 1000000,
    };

    setTasks([created, ...tasks]);
    setIsScheduleModalOpen(false);
    setNewTaskForm({ leadName: '', company: '', phone: '', type: 'CALL', dueDate: 'Today at 3:00 PM', notes: '', dealValue: 1500000 });
  };

  return (
    <div className="dashboard-canvas">
      {/* Header matching Screenshot 2 */}
      <div className="view-header" style={{ marginBottom: '16px' }}>
        <div className="view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-badge superadmin" style={{ background: '#ff5722', color: '#fff' }}>03 FOLLOW-UPS</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Tenant: <strong>{session?.tenantName || 'Zeerocodes Enterprise'}</strong></span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            FOLLOW UPS <span style={{ color: '#ff5722' }}>OVERVIEW</span>
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0, fontWeight: 700 }}>
            FOLLOW-UP TASKS: Stay on top of your outreach and conversion cycle.
          </p>
        </div>

        <div className="view-actions" style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', background: 'var(--white)', padding: '3px', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 10px',
                border: 'none',
                borderRadius: '6px',
                background: viewMode === 'list' ? '#ff5722' : 'transparent',
                color: viewMode === 'list' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              style={{
                padding: '6px 10px',
                border: 'none',
                borderRadius: '6px',
                background: viewMode === 'calendar' ? '#ff5722' : 'transparent',
                color: viewMode === 'calendar' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              <CalendarDays size={16} />
            </button>
          </div>

          <button
            className="btn-accent"
            onClick={() => setIsScheduleModalOpen(true)}
            style={{
              background: '#ff5722',
              color: '#fff',
              border: 'none',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(255, 87, 34, 0.3)',
            }}
          >
            <Plus size={16} /> SCHEDULE TASK
          </button>
        </div>
      </div>

      {/* Main Container with Left Task List & Right Conversion Tip Widget */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '20px' }}>
        {/* Left Side: Search & Filter Tabs + Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Dual Filter Bars */}
          <div className="table-card" style={{ padding: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                type="text"
                placeholder="SEARCH TASKS BY LEAD, COMPANY OR ACTION..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 14px 9px 36px',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                  background: 'var(--paper)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            {/* Status & Channel Chips */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              {/* Status Chips */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['ALL', 'UPCOMING', 'OVERDUE', 'COMPLETED'] as const).map((st) => {
                  const active = statusFilter === st;
                  return (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: active ? '#ff5722' : 'var(--paper)',
                        color: active ? '#fff' : 'var(--ink)',
                        fontWeight: 700,
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>

              {/* Channel Chips */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { id: 'ALL', label: 'ALL', icon: Calendar },
                  { id: 'CALL', label: 'CALL', icon: Phone },
                  { id: 'WHATSAPP', label: 'WHATSAPP', icon: MessageSquare },
                  { id: 'EMAIL', label: 'EMAIL', icon: Mail },
                  { id: 'MEETING', label: 'MEETING', icon: Users },
                ].map((ch) => {
                  const active = channelFilter === ch.id;
                  const Icon = ch.icon;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setChannelFilter(ch.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: active ? '#1e293b' : 'var(--paper)',
                        color: active ? '#fff' : 'var(--ink)',
                        fontWeight: 700,
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon size={12} />
                      <span>{ch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Task List Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredTasks.length === 0 ? (
              <div className="table-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px', fontWeight: 600 }}>
                NO FOLLOW-UP TASKS FOUND MATCHING FILTERS.
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="table-card"
                  style={{
                    padding: '16px 18px',
                    margin: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: task.status === 'OVERDUE' ? '4px solid #dc2626' : task.status === 'COMPLETED' ? '4px solid #16a34a' : '4px solid #ff5722',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--ink)' }}>{task.leadName}</span>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>• {task.company}</span>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: task.type === 'WHATSAPP' ? '#dcfce7' : task.type === 'CALL' ? '#e0f2fe' : '#fef3c7',
                          color: task.type === 'WHATSAPP' ? '#166534' : task.type === 'CALL' ? '#0369a1' : '#b45309',
                        }}
                      >
                        {task.type}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--ink)', marginBottom: '4px' }}>
                      {task.notes}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--muted)' }}>
                      <span>📅 Due: <strong style={{ color: task.status === 'OVERDUE' ? '#dc2626' : 'var(--ink)' }}>{task.dueDate}</strong></span>
                      <span>Value: <strong style={{ color: '#16a34a' }}>₦{task.dealValue.toLocaleString()}</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {task.status !== 'COMPLETED' && (
                      <button
                        className="btn-accent"
                        onClick={() => handleCompleteTask(task.id)}
                        style={{ padding: '6px 12px', fontSize: '11.5px', background: '#ff5722', color: '#fff', border: 'none' }}
                      >
                        <Check size={13} /> Complete
                      </button>
                    )}
                    {task.type === 'CALL' && (
                      <button
                        className="btn-secondary"
                        onClick={() => alert(`Dialing ${task.phone}...`)}
                        style={{ padding: '6px 10px', fontSize: '11.5px' }}
                      >
                        <PhoneCall size={13} /> Call
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Conversion Tip Card (Matches Screenshot 2) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #ff5722 0%, #ff7043 100%)',
              color: '#fff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 8px 24px rgba(255, 87, 34, 0.3)',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
              CONVERSION TIP
            </div>
            <p style={{ fontSize: '13.5px', lineHeight: 1.55, margin: 0, fontWeight: 600 }}>
              Leads contacted within <strong>5 minutes of inquiry are 9x more likely to convert</strong>. AI is handling the first touch, but follow up now!
            </p>
          </div>

          {/* AI Agent Status Box */}
          <div style={{ background: 'var(--dark-surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--dark-border)', color: '#fff' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#ff5722', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              AI AGENT STATUS
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
              Monitoring 20 leads...
            </div>
            <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '75%', height: '100%', background: '#ff5722', borderRadius: '3px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Task Modal */}
      {isScheduleModalOpen && (
        <div className="modal-overlay" onClick={() => setIsScheduleModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>+ Schedule Follow-Up Task</h3>
              <button onClick={() => setIsScheduleModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Lead Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chief Adeleke Johnson"
                    value={newTaskForm.leadName}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, leadName: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Channel Action</label>
                    <select
                      value={newTaskForm.type}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, type: e.target.value as any })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px', background: 'var(--white)' }}
                    >
                      <option value="CALL">Phone Call</option>
                      <option value="WHATSAPP">WhatsApp Outreach</option>
                      <option value="EMAIL">Email Sequence</option>
                      <option value="MEETING">Demo / Meeting</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Due Time</label>
                    <input
                      type="text"
                      placeholder="e.g. Today at 4:00 PM"
                      value={newTaskForm.dueDate}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Task Objective / Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Discuss site inspection and commercial pricing tier..."
                    value={newTaskForm.notes}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, notes: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '12.5px' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsScheduleModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-accent" style={{ background: '#ff5722', color: '#fff', border: 'none' }}>
                  Schedule Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
