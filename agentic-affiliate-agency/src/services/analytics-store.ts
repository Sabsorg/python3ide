import { randomUUID } from 'crypto';
import type { ClickEvent, ConversionEvent, CampaignAnalytics } from '../types/index.js';
import * as campaignStore from './campaign-store.js';
import * as contentStore from './content-store.js';

const clicks: ClickEvent[] = [];
const conversions: ConversionEvent[] = [];

export function recordClick(
  linkId: string,
  campaignId: string,
  meta: { userAgent?: string; referrer?: string } = {}
): ClickEvent {
  const event: ClickEvent = {
    id: randomUUID(),
    linkId,
    campaignId,
    timestamp: new Date().toISOString(),
    ...meta,
  };
  clicks.push(event);
  campaignStore.incrementLinkClicks(linkId);
  return event;
}

export function recordConversion(
  linkId: string,
  campaignId: string,
  value: number
): ConversionEvent {
  const event: ConversionEvent = {
    id: randomUUID(),
    linkId,
    campaignId,
    value,
    timestamp: new Date().toISOString(),
  };
  conversions.push(event);
  campaignStore.incrementLinkConversions(linkId);
  return event;
}

export function getCampaignAnalytics(campaignId: string): CampaignAnalytics {
  campaignStore.getCampaign(campaignId);

  const campaignLinks = campaignStore.getCampaignLinks(campaignId);
  const campaignClicks = clicks.filter((c) => c.campaignId === campaignId);
  const campaignConversions = conversions.filter((c) => c.campaignId === campaignId);
  const totalRevenue = campaignConversions.reduce((sum, c) => sum + c.value, 0);

  const topLinks = campaignLinks
    .map((link) => ({
      linkId: link.id,
      name: link.name,
      clicks: link.clicks,
      conversions: link.conversions,
      revenue: conversions
        .filter((c) => c.linkId === link.id)
        .reduce((sum, c) => sum + c.value, 0),
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  const campaignContent = contentStore.getContentByCampaign(campaignId);
  const contentPerformance = campaignContent.map((c) => ({
    contentId: c.id,
    type: c.type,
    title: c.title,
    createdAt: c.createdAt,
  }));

  return {
    campaignId,
    totalClicks: campaignClicks.length,
    totalConversions: campaignConversions.length,
    conversionRate:
      campaignClicks.length > 0 ? campaignConversions.length / campaignClicks.length : 0,
    totalRevenue,
    topLinks,
    contentPerformance,
  };
}
