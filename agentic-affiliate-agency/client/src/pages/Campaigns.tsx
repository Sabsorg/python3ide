import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.ts';
import type { Campaign } from '../types.ts';
import Badge from '../components/Badge.tsx';
import Modal from '../components/Modal.tsx';
import Spinner from '../components/Spinner.tsx';

function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (c: Campaign) => void }) {
  const [form, setForm] = useState({ name: '', niche: '', targetAudience: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.niche || !form.targetAudience) {
      setErr('All fields are required');
      return;
    }
    setSaving(true);
    try {
      const campaign = await api.campaigns.create(form);
      onCreate(campaign);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="New Campaign" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {err && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {err}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Campaign Name</label>
          <input
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Tech Deals 2026"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Niche</label>
          <input
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. software tools, fitness, finance"
            value={form.niche}
            onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Target Audience</label>
          <input
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. indie developers, gym-goers"
            value={form.targetAudience}
            onChange={(e) => setForm((f) => ({ ...f, targetAudience: e.target.value }))}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {saving && <Spinner size="sm" />}
            Create Campaign
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    api.campaigns
      .list()
      .then(setCampaigns)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign and all its data?')) return;
    setDeleting(id);
    try {
      await api.campaigns.delete(id);
      setCampaigns((cs) => cs.filter((c) => c.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your affiliate marketing campaigns</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Campaign
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium">No campaigns yet</p>
          <p className="text-slate-400 text-sm mt-1">Create one to get started with AI-powered affiliate marketing</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 bg-indigo-600 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Name</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Niche</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Target Audience</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Status</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Links</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Created</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <button
                      onClick={() => navigate(`/campaigns/${c.id}`)}
                      className="font-medium text-slate-900 hover:text-indigo-600 text-left"
                    >
                      {c.name}
                    </button>
                  </td>
                  <td className="px-6 py-3 text-slate-600 capitalize">{c.niche}</td>
                  <td className="px-6 py-3 text-slate-500 max-w-[180px] truncate">{c.targetAudience}</td>
                  <td className="px-6 py-3">
                    <Badge variant={c.status} />
                  </td>
                  <td className="px-6 py-3 text-slate-600">{c.affiliateLinks.length}</td>
                  <td className="px-6 py-3 text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        to={`/campaigns/${c.id}`}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deleting === c.id}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        {deleting === c.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={(c) => {
            setCampaigns((cs) => [c, ...cs]);
            setShowCreate(false);
            navigate(`/campaigns/${c.id}`);
          }}
        />
      )}
    </div>
  );
}
