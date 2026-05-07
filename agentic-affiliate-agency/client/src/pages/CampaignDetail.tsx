import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api.ts';
import type {
  Campaign,
  AffiliateLink,
  GeneratedContent,
  CampaignAnalytics,
  NicheResearchResult,
  OptimizationRecommendation,
} from '../types.ts';
import Badge from '../components/Badge.tsx';
import Spinner from '../components/Spinner.tsx';

// ── Tabs ─────────────────────────────────────────────────────────────────────

const TAB_LABELS = ['Overview', 'Links', 'Content', 'Analytics', 'AI Tools'] as const;
type Tab = (typeof TAB_LABELS)[number];

// ── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ campaign, onChange }: { campaign: Campaign; onChange: (c: Campaign) => void }) {
  const [status, setStatus] = useState(campaign.status);
  const [saving, setSaving] = useState(false);

  const updateStatus = async (s: Campaign['status']) => {
    setStatus(s);
    setSaving(true);
    try {
      const updated = await api.campaigns.update(campaign.id, { status: s });
      onChange(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Campaign Name', value: campaign.name },
          { label: 'Niche', value: campaign.niche },
          { label: 'Target Audience', value: campaign.targetAudience },
          { label: 'Created', value: new Date(campaign.createdAt).toLocaleDateString() },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
            <p className="text-sm text-slate-800 font-medium capitalize">{value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700 mb-3">Status</p>
        <div className="flex gap-2">
          {(['active', 'paused', 'archived'] as const).map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={saving}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors border ${
                status === s
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {s}
            </button>
          ))}
          {saving && <Spinner size="sm" />}
        </div>
      </div>
    </div>
  );
}

// ── Links tab ─────────────────────────────────────────────────────────────────

function LinksTab({ campaignId }: { campaignId: string }) {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ url: '', name: '', commission: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.links.list(campaignId).then(setLinks).finally(() => setLoading(false));
  }, [campaignId]);

  const addLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      const link = await api.links.add(campaignId, {
        url: form.url,
        name: form.name,
        commission: parseFloat(form.commission),
      });
      setLinks((ls) => [...ls, link]);
      setForm({ url: '', name: '', commission: '' });
      setShowForm(false);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to add link');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-5">
      {links.length > 0 ? (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">URL</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">Commission</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">Clicks</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">Conversions</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-800">{l.name}</td>
                  <td className="px-4 py-3">
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline truncate block max-w-[220px]"
                    >
                      {l.url}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{l.commission}%</td>
                  <td className="px-4 py-3 text-right text-slate-600">{l.clicks}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{l.conversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !showForm && (
          <div className="text-center py-8 text-slate-400 text-sm">No affiliate links yet.</div>
        )
      )}

      {showForm ? (
        <form onSubmit={addLink} className="bg-slate-50 rounded-lg p-4 space-y-3">
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Link Name</label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Product name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Commission %</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 20"
                value={form.commission}
                onChange={(e) => setForm((f) => ({ ...f, commission: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Affiliate URL</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://example.com/ref?id=..."
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 px-3 py-1.5">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving && <Spinner size="sm" />} Add Link
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Affiliate Link
        </button>
      )}
    </div>
  );
}

// ── Content tab ───────────────────────────────────────────────────────────────

function ContentTab({ campaignId }: { campaignId: string }) {
  const [content, setContent] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: 'blog' as 'blog' | 'social' | 'email',
    topic: '',
    tone: '',
    wordCount: '',
  });
  const [err, setErr] = useState('');

  useEffect(() => {
    api.content.byCampaign(campaignId).then(setContent).finally(() => setLoading(false));
  }, [campaignId]);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setGenerating(true);
    try {
      const piece = await api.content.generate({
        campaignId,
        type: form.type,
        topic: form.topic || undefined,
        tone: form.tone || undefined,
        wordCount: form.wordCount ? parseInt(form.wordCount) : undefined,
      });
      setContent((cs) => [piece, ...cs]);
      setExpanded(piece.id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-5">
      <form onSubmit={generate} className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
        <p className="text-sm font-semibold text-slate-700">Generate with Claude AI</p>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Type</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'blog' | 'social' | 'email' }))}
            >
              <option value="blog">Blog Post</option>
              <option value="social">Social Media</option>
              <option value="email">Email Campaign</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Tone (optional)</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. professional"
              value={form.tone}
              onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Word Count (optional)</label>
            <input
              type="number"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 1200"
              value={form.wordCount}
              onChange={(e) => setForm((f) => ({ ...f, wordCount: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Topic (optional)</label>
          <input
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Leave blank to auto-generate based on niche"
            value={form.topic}
            onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
          />
        </div>
        <button
          type="submit"
          disabled={generating}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors font-medium"
        >
          {generating ? (
            <>
              <Spinner size="sm" />
              Generating with Claude...
            </>
          ) : (
            'Generate Content'
          )}
        </button>
      </form>

      {content.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm">No content generated yet.</div>
      ) : (
        <div className="space-y-3">
          {content.map((c) => (
            <div key={c.id} className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 text-left"
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={c.type === 'blog' ? 'content' : c.type === 'social' ? 'targeting' : 'links'}
                    label={c.type}
                  />
                  <span className="text-sm font-medium text-slate-800">{c.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${expanded === c.id ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              {expanded === c.id && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1 my-3">
                    {c.keywords.map((k) => (
                      <span key={k} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">
                        {k}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto bg-slate-50 rounded p-3">
                    {c.body}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Analytics tab ─────────────────────────────────────────────────────────────

function AnalyticsTab({ campaignId }: { campaignId: string }) {
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics.get(campaignId).then(setAnalytics).finally(() => setLoading(false));
  }, [campaignId]);

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;
  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Clicks', value: analytics.totalClicks, color: 'text-slate-900' },
          { label: 'Conversions', value: analytics.totalConversions, color: 'text-emerald-600' },
          {
            label: 'Conversion Rate',
            value: `${(analytics.conversionRate * 100).toFixed(1)}%`,
            color: 'text-indigo-600',
          },
          {
            label: 'Total Revenue',
            value: `$${analytics.totalRevenue.toFixed(2)}`,
            color: 'text-amber-600',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {analytics.topLinks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Link Performance</h3>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 text-slate-500 font-medium">Link</th>
                  <th className="text-right px-4 py-2.5 text-slate-500 font-medium">Clicks</th>
                  <th className="text-right px-4 py-2.5 text-slate-500 font-medium">Conversions</th>
                  <th className="text-right px-4 py-2.5 text-slate-500 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topLinks.map((l) => (
                  <tr key={l.linkId} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{l.name}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{l.clicks}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{l.conversions}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">${l.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AI Tools tab ──────────────────────────────────────────────────────────────

function AIToolsTab({ campaignId }: { campaignId: string }) {
  const [research, setResearch] = useState<NicheResearchResult | null>(null);
  const [optimization, setOptimization] = useState<OptimizationRecommendation | null>(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [optimizeLoading, setOptimizeLoading] = useState(false);
  const [researchErr, setResearchErr] = useState('');
  const [optimizeErr, setOptimizeErr] = useState('');

  const runResearch = async () => {
    setResearchErr('');
    setResearchLoading(true);
    try {
      setResearch(await api.campaigns.research(campaignId));
    } catch (e: unknown) {
      setResearchErr(e instanceof Error ? e.message : 'Research failed');
    } finally {
      setResearchLoading(false);
    }
  };

  const runOptimize = async () => {
    setOptimizeErr('');
    setOptimizeLoading(true);
    try {
      setOptimization(await api.campaigns.optimize(campaignId));
    } catch (e: unknown) {
      setOptimizeErr(e instanceof Error ? e.message : 'Optimization failed');
    } finally {
      setOptimizeLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Research */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Niche Research</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Claude runs a multi-turn agentic loop to analyze your niche, find top products, and generate content ideas
            </p>
          </div>
          <button
            onClick={runResearch}
            disabled={researchLoading}
            className="flex items-center gap-2 bg-slate-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-60 transition-colors font-medium"
          >
            {researchLoading ? (
              <>
                <Spinner size="sm" />
                Researching...
              </>
            ) : (
              'Run Research'
            )}
          </button>
        </div>

        {researchErr && <p className="text-red-600 text-sm mb-3">{researchErr}</p>}

        {research && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Audience Insights
              </p>
              <p className="text-sm text-slate-700">{research.audienceInsights}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Keywords ({research.keywords.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {research.keywords.map((k) => (
                    <span key={k} className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded">
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Content Ideas ({research.contentIdeas.length})
                </p>
                <ul className="space-y-1">
                  {research.contentIdeas.slice(0, 5).map((idea, i) => (
                    <li key={i} className="text-xs text-slate-700 flex gap-1.5">
                      <span className="text-indigo-400 shrink-0">→</span>
                      {idea}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {research.topProducts.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Top Products
                </p>
                <div className="space-y-3">
                  {research.topProducts.map((p, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.description}</p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          Commission: {p.estimatedCommission} · {p.audienceFit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200" />

      {/* Optimize */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Campaign Optimizer</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Claude analyzes your performance data and returns a prioritized action plan to improve ROI
            </p>
          </div>
          <button
            onClick={runOptimize}
            disabled={optimizeLoading}
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors font-medium"
          >
            {optimizeLoading ? (
              <>
                <Spinner size="sm" />
                Optimizing...
              </>
            ) : (
              'Run Optimizer'
            )}
          </button>
        </div>

        {optimizeErr && <p className="text-red-600 text-sm mb-3">{optimizeErr}</p>}

        {optimization && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`text-3xl font-bold ${
                    optimization.overallScore >= 70
                      ? 'text-emerald-600'
                      : optimization.overallScore >= 40
                        ? 'text-amber-600'
                        : 'text-red-600'
                  }`}
                >
                  {optimization.overallScore}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Performance Score</p>
                  <p className="text-xs text-slate-400">out of 100</p>
                </div>
              </div>
              <div className="flex-1 bg-slate-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    optimization.overallScore >= 70
                      ? 'bg-emerald-500'
                      : optimization.overallScore >= 40
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${optimization.overallScore}%` }}
                />
              </div>
            </div>

            <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
              <p className="text-xs font-semibold text-indigo-700 mb-1">Projected Impact</p>
              <p className="text-sm text-indigo-800">{optimization.projectedImpact}</p>
            </div>

            <div className="space-y-2">
              {optimization.recommendations.map((r, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={r.priority} />
                    <Badge variant={r.category} />
                  </div>
                  <p className="text-sm font-medium text-slate-800">{r.action}</p>
                  <p className="text-xs text-slate-500 mt-1">{r.rationale}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  useEffect(() => {
    if (!id) return;
    api.campaigns
      .get(id)
      .then(setCampaign)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  if (!campaign)
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Campaign not found.</p>
        <Link to="/campaigns" className="text-indigo-600 text-sm mt-2 inline-block">
          ← Back to campaigns
        </Link>
      </div>
    );

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/campaigns" className="text-slate-400 hover:text-slate-600 text-sm mb-2 inline-flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Campaigns
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <Badge variant={campaign.status} />
            <span className="text-sm text-slate-500 capitalize">{campaign.niche}</span>
            <span className="text-slate-300">·</span>
            <span className="text-sm text-slate-500">{campaign.targetAudience}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-0">
          {TAB_LABELS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {activeTab === 'Overview' && (
          <OverviewTab campaign={campaign} onChange={setCampaign} />
        )}
        {activeTab === 'Links' && <LinksTab campaignId={campaign.id} />}
        {activeTab === 'Content' && <ContentTab campaignId={campaign.id} />}
        {activeTab === 'Analytics' && <AnalyticsTab campaignId={campaign.id} />}
        {activeTab === 'AI Tools' && <AIToolsTab campaignId={campaign.id} />}
      </div>
    </div>
  );
}
