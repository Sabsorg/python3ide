import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.ts';
import type { Campaign } from '../types.ts';
import Badge from '../components/Badge.tsx';
import Spinner from '../components/Spinner.tsx';

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.campaigns
      .list()
      .then(setCampaigns)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const active = campaigns.filter((c) => c.status === 'active').length;
  const paused = campaigns.filter((c) => c.status === 'paused').length;
  const totalLinks = campaigns.reduce((s, c) => s + c.affiliateLinks.length, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Overview of your affiliate marketing operations</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Campaigns" value={campaigns.length} color="text-slate-900" />
            <StatCard label="Active" value={active} sub="running now" color="text-emerald-600" />
            <StatCard label="Paused" value={paused} sub="on hold" color="text-amber-600" />
            <StatCard
              label="Affiliate Links"
              value={totalLinks}
              sub="across all campaigns"
              color="text-indigo-600"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 text-sm">Recent Campaigns</h2>
              <Link
                to="/campaigns"
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                View all →
              </Link>
            </div>

            {campaigns.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-slate-400 text-sm">No campaigns yet.</p>
                <Link
                  to="/campaigns"
                  className="mt-3 inline-flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create your first campaign
                </Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-slate-500 font-medium">Name</th>
                    <th className="text-left px-6 py-3 text-slate-500 font-medium">Niche</th>
                    <th className="text-left px-6 py-3 text-slate-500 font-medium">Status</th>
                    <th className="text-left px-6 py-3 text-slate-500 font-medium">Links</th>
                    <th className="text-left px-6 py-3 text-slate-500 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.slice(0, 8).map((c) => (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-6 py-3">
                        <Link
                          to={`/campaigns/${c.id}`}
                          className="font-medium text-slate-900 hover:text-indigo-600"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-slate-600">{c.niche}</td>
                      <td className="px-6 py-3">
                        <Badge variant={c.status} />
                      </td>
                      <td className="px-6 py-3 text-slate-600">{c.affiliateLinks.length}</td>
                      <td className="px-6 py-3 text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
