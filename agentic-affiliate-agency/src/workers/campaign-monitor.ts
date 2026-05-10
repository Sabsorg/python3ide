import { CEOAgent } from "../agents/ceo/index.js";
import { createLogger } from "../lib/logger.js";
import type { Campaign, PerformanceMetrics } from "../lib/types.js";

const logger = createLogger("CampaignMonitor");

export interface MonitorConfig {
  intervalMs?: number;
  campaigns: Campaign[];
  onAlert?: (campaign: Campaign, message: string) => void;
}

export class CampaignMonitorWorker {
  private readonly ceo: CEOAgent;
  private readonly intervalMs: number;
  private readonly campaigns: Campaign[];
  private readonly onAlert?: (campaign: Campaign, message: string) => void;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor({ intervalMs = 3_600_000, campaigns, onAlert }: MonitorConfig) {
    this.ceo = new CEOAgent();
    this.intervalMs = intervalMs;
    this.campaigns = campaigns;
    this.onAlert = onAlert;
  }

  start(): void {
    logger.info(
      `Starting campaign monitor — checking ${this.campaigns.length} campaign(s) every ${this.intervalMs / 1000}s`
    );
    this.timer = setInterval(() => void this.checkAll(), this.intervalMs);
    // Run immediately on start
    void this.checkAll();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info("Campaign monitor stopped.");
    }
  }

  private async checkAll(): Promise<void> {
    logger.info(`Running scheduled campaign health check…`);
    for (const campaign of this.campaigns) {
      await this.checkCampaign(campaign);
    }
  }

  private async checkCampaign(campaign: Campaign): Promise<void> {
    try {
      // Simulate fetching live metrics — in production, pull from your analytics API
      const metrics: PerformanceMetrics = await this.fetchMetrics(campaign.id);

      const task = `
Analyze this campaign's current performance and flag any issues requiring immediate action.

Campaign: ${campaign.name}
Program: ${campaign.affiliateProgram}
Status: ${campaign.status}
Channels: ${campaign.channels.join(", ")}
Budget: $${campaign.budget}

Current Metrics (last 24h):
- Clicks: ${metrics.clicks}
- Conversions: ${metrics.conversions}
- Revenue: $${metrics.revenue}
- Commissions: $${metrics.commissions}
- CTR: ${metrics.ctr}%
- Conversion Rate: ${metrics.conversionRate}%
- ROI: ${metrics.roi}%

Provide a brief health summary (2–3 sentences) and flag any critical issues.
      `.trim();

      const result = await this.ceo.run({ task });
      logger.info(`[${campaign.name}] ${result.slice(0, 120)}…`);

      if (
        result.toLowerCase().includes("critical") ||
        result.toLowerCase().includes("urgent")
      ) {
        this.onAlert?.(campaign, result);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to check campaign "${campaign.name}": ${msg}`);
    }
  }

  // Stub — replace with real analytics API call
  private async fetchMetrics(_campaignId: string): Promise<PerformanceMetrics> {
    return {
      clicks: Math.floor(Math.random() * 1000) + 100,
      conversions: Math.floor(Math.random() * 50) + 5,
      revenue: parseFloat((Math.random() * 5000 + 500).toFixed(2)),
      commissions: parseFloat((Math.random() * 500 + 50).toFixed(2)),
      ctr: parseFloat((Math.random() * 5 + 0.5).toFixed(2)),
      conversionRate: parseFloat((Math.random() * 5 + 0.5).toFixed(2)),
      roi: parseFloat((Math.random() * 200 - 20).toFixed(2)),
      period: "24h",
    };
  }
}
