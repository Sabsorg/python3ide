import type {
  Campaign,
  AffiliateLink,
  GeneratedContent,
  CampaignAnalytics,
  NicheResearchResult,
  OptimizationRecommendation,
} from '../types.ts';

const BASE = '/api/v1';

async function req<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(BASE + path, {
    method: opts.method ?? 'GET',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  campaigns: {
    list: () => req<Campaign[]>('/campaigns'),
    create: (data: Pick<Campaign, 'name' | 'niche' | 'targetAudience'>) =>
      req<Campaign>('/campaigns', { method: 'POST', body: data }),
    get: (id: string) => req<Campaign>(`/campaigns/${id}`),
    update: (
      id: string,
      data: Partial<Pick<Campaign, 'name' | 'niche' | 'targetAudience' | 'status'>>
    ) => req<Campaign>(`/campaigns/${id}`, { method: 'PATCH', body: data }),
    delete: (id: string) => req<void>(`/campaigns/${id}`, { method: 'DELETE' }),
    research: (id: string) =>
      req<NicheResearchResult>(`/campaigns/${id}/research`, { method: 'POST' }),
    optimize: (id: string) =>
      req<OptimizationRecommendation>(`/campaigns/${id}/optimize`, { method: 'POST' }),
  },
  links: {
    list: (campaignId: string) => req<AffiliateLink[]>(`/campaigns/${campaignId}/links`),
    add: (
      campaignId: string,
      data: Pick<AffiliateLink, 'url' | 'name' | 'commission'>
    ) => req<AffiliateLink>(`/campaigns/${campaignId}/links`, { method: 'POST', body: data }),
  },
  content: {
    generate: (data: {
      campaignId: string;
      type: 'blog' | 'social' | 'email';
      topic?: string;
      tone?: string;
      wordCount?: number;
    }) => req<GeneratedContent>('/content/generate', { method: 'POST', body: data }),
    byCampaign: (campaignId: string) =>
      req<GeneratedContent[]>(`/campaigns/${campaignId}/content`),
  },
  analytics: {
    get: (campaignId: string) => req<CampaignAnalytics>(`/analytics/${campaignId}`),
  },
};
