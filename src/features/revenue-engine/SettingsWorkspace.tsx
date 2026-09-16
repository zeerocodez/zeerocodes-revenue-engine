import { useEffect, useState } from 'react';
import { CheckCircle2, Save, Settings2, Sliders } from 'lucide-react';
import type { ClientConfiguration } from '../../domain/client-configuration';
import { apiFetch } from '../../lib/api';

export default function SettingsWorkspace() {
  const [config, setConfig] = useState<ClientConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form states
  const [threshold, setThreshold] = useState(70);
  const [maxUrgencyDays, setMaxUrgencyDays] = useState(30);
  const [requireDecisionMaker, setRequireDecisionMaker] = useState(false);
  const [requireServiceFit, setRequireServiceFit] = useState(true);

  async function loadConfig() {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/configuration');
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load configuration');
      const data = await res.json();
      if (data.configuration) {
        setConfig(data.configuration);
        setThreshold(data.configuration.scoring?.threshold ?? 70);
        setMaxUrgencyDays(data.configuration.qualification?.maximumUrgencyDays ?? 30);
        setRequireDecisionMaker(data.configuration.qualification?.requireDecisionMaker ?? false);
        setRequireServiceFit(data.configuration.qualification?.requireServiceFit ?? true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading config');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadConfig();
  }, []);

  async function saveConfig() {
    if (!config) return;
    setSaving(true);
    setMessage('');
    setError('');

    const updated: ClientConfiguration = {
      ...config,
      scoring: {
        ...config.scoring,
        threshold,
        weights: config.scoring?.weights ?? {
          serviceFit: 25,
          needConfirmed: 20,
          decisionMaker: 15,
          locationFit: 10,
          urgency: 15,
          budget: 15,
        },
      },
      qualification: {
        ...config.qualification,
        qualificationThreshold: threshold,
        maximumUrgencyDays: maxUrgencyDays,
        requireDecisionMaker,
        requireServiceFit,
      },
    };

    try {
      const res = await apiFetch('/api/configuration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save configuration');
      const data = await res.json();
      setConfig(data.configuration);
      setMessage('Qualification policy and scoring weights updated successfully!');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="card p-8 text-sm muted">Loading tenant configuration…</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Tenant Qualification & Revenue Policy</h2>
          <p className="text-xs text-slate-400">
            Configure deterministic qualification thresholds, weights, and hard gating rules.
          </p>
        </div>
        <button
          disabled={saving}
          onClick={() => void saveConfig()}
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center gap-2"><CheckCircle2 size={16} />{message}</div>}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5 space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-white">
            <Sliders size={16} className="text-indigo-400" /> Scoring Thresholds
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block">Qualification Threshold Score (0 - 100)</label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-24 rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm font-bold text-indigo-300"
              />
              <span className="text-xs text-slate-500">Default baseline: 70</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block">Maximum Urgency Days</label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={365}
                value={maxUrgencyDays}
                onChange={(e) => setMaxUrgencyDays(Number(e.target.value))}
                className="w-24 rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm font-bold text-indigo-300"
              />
              <span className="text-xs text-slate-500">Days to achieve urgency points</span>
            </div>
          </div>
        </section>

        <section className="card p-5 space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-white">
            <Settings2 size={16} className="text-emerald-400" /> Hard Qualification Gates
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 cursor-pointer">
            <input
              type="checkbox"
              checked={requireDecisionMaker}
              onChange={(e) => setRequireDecisionMaker(e.target.checked)}
              className="rounded bg-slate-800 text-indigo-500"
            />
            <div>
              <div className="text-xs font-semibold text-slate-200">Require Decision Maker</div>
              <div className="text-[11px] text-slate-500">Hard-disqualifies leads if the contact is not the decision maker.</div>
            </div>
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 cursor-pointer">
            <input
              type="checkbox"
              checked={requireServiceFit}
              onChange={(e) => setRequireServiceFit(e.target.checked)}
              className="rounded bg-slate-800 text-indigo-500"
            />
            <div>
              <div className="text-xs font-semibold text-slate-200">Require Verified Service Fit</div>
              <div className="text-[11px] text-slate-500">Hard-disqualifies leads if service scope does not fit.</div>
            </div>
          </label>
        </section>
      </div>
    </div>
  );
}
