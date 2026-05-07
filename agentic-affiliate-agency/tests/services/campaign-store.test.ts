import { describe, it, expect } from 'vitest';
import {
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  addAffiliateLink,
  getCampaignLinks,
} from '../../src/services/campaign-store.js';

describe('Campaign Store', () => {
  it('creates and retrieves a campaign', () => {
    const campaign = createCampaign({ name: 'Test', niche: 'fitness', targetAudience: 'athletes' });
    expect(campaign.id).toBeDefined();
    expect(campaign.status).toBe('active');
    expect(campaign.affiliateLinks).toEqual([]);

    const fetched = getCampaign(campaign.id);
    expect(fetched.name).toBe('Test');
    expect(fetched.niche).toBe('fitness');
  });

  it('throws on unknown campaign id', () => {
    expect(() => getCampaign('nonexistent-id')).toThrow('Campaign not found');
  });

  it('updates campaign fields', () => {
    const campaign = createCampaign({ name: 'Old Name', niche: 'travel', targetAudience: 'budget travelers' });
    const updated = updateCampaign(campaign.id, { name: 'New Name', status: 'paused' });
    expect(updated.name).toBe('New Name');
    expect(updated.status).toBe('paused');
    // updatedAt must be >= createdAt (same-ms updates are fine)
    expect(new Date(updated.updatedAt) >= new Date(updated.createdAt)).toBe(true);
  });

  it('deletes a campaign and all its links', () => {
    const campaign = createCampaign({ name: 'Doomed', niche: 'food', targetAudience: 'foodies' });
    addAffiliateLink(campaign.id, { url: 'https://example.com/a', name: 'Product A', commission: 10 });

    deleteCampaign(campaign.id);
    expect(() => getCampaign(campaign.id)).toThrow();
    expect(getCampaignLinks(campaign.id)).toEqual([]);
  });

  it('adds affiliate links to a campaign', () => {
    const campaign = createCampaign({ name: 'Links Test', niche: 'tech', targetAudience: 'developers' });
    const link = addAffiliateLink(campaign.id, {
      url: 'https://example.com/product',
      name: 'Dev Tool',
      commission: 20,
    });
    expect(link.campaignId).toBe(campaign.id);
    expect(link.clicks).toBe(0);
    expect(link.conversions).toBe(0);

    const links = getCampaignLinks(campaign.id);
    expect(links).toHaveLength(1);
    expect(links[0].name).toBe('Dev Tool');
  });

  it('rejects duplicate affiliate link URLs within a campaign', () => {
    const campaign = createCampaign({ name: 'Dup Test', niche: 'finance', targetAudience: 'investors' });
    addAffiliateLink(campaign.id, { url: 'https://example.com/dup', name: 'Product', commission: 5 });
    expect(() =>
      addAffiliateLink(campaign.id, { url: 'https://example.com/dup', name: 'Same URL', commission: 5 })
    ).toThrow();
  });
});
