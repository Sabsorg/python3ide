import { randomUUID } from 'crypto';
import type { Campaign, AffiliateLink } from '../types/index.js';
import { notFound, conflict } from '../utils/errors.js';

const campaigns = new Map<string, Campaign>();
const links = new Map<string, AffiliateLink>();

export function createCampaign(
  data: Pick<Campaign, 'name' | 'niche' | 'targetAudience'>
): Campaign {
  const id = randomUUID();
  const now = new Date().toISOString();
  const campaign: Campaign = {
    id,
    ...data,
    affiliateLinks: [],
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
  campaigns.set(id, campaign);
  return campaign;
}

export function getCampaign(id: string): Campaign {
  const campaign = campaigns.get(id);
  if (!campaign) throw notFound('Campaign');
  return campaign;
}

export function listCampaigns(): Campaign[] {
  return Array.from(campaigns.values());
}

export function updateCampaign(
  id: string,
  data: Partial<Pick<Campaign, 'name' | 'niche' | 'targetAudience' | 'status'>>
): Campaign {
  const campaign = getCampaign(id);
  const updated: Campaign = { ...campaign, ...data, updatedAt: new Date().toISOString() };
  campaigns.set(id, updated);
  return updated;
}

export function deleteCampaign(id: string): void {
  if (!campaigns.has(id)) throw notFound('Campaign');
  campaigns.delete(id);
  for (const [linkId, link] of links) {
    if (link.campaignId === id) links.delete(linkId);
  }
}

export function addAffiliateLink(
  campaignId: string,
  data: Pick<AffiliateLink, 'url' | 'name' | 'commission'>
): AffiliateLink {
  const campaign = getCampaign(campaignId);
  const existing = Array.from(links.values()).find(
    (l) => l.campaignId === campaignId && l.url === data.url
  );
  if (existing) throw conflict('Affiliate link with this URL already exists');

  const link: AffiliateLink = {
    id: randomUUID(),
    campaignId,
    clicks: 0,
    conversions: 0,
    ...data,
  };
  links.set(link.id, link);
  campaign.affiliateLinks.push(link);
  campaign.updatedAt = new Date().toISOString();
  campaigns.set(campaignId, campaign);
  return link;
}

export function getCampaignLinks(campaignId: string): AffiliateLink[] {
  return Array.from(links.values()).filter((l) => l.campaignId === campaignId);
}

export function getLink(id: string): AffiliateLink {
  const link = links.get(id);
  if (!link) throw notFound('Affiliate link');
  return link;
}

export function incrementLinkClicks(id: string): void {
  const link = links.get(id);
  if (link) {
    link.clicks++;
  }
}

export function incrementLinkConversions(id: string): void {
  const link = links.get(id);
  if (link) {
    link.conversions++;
  }
}
