import Anthropic from '@anthropic-ai/sdk';
import { appConfig } from '../config/index.js';
import * as campaignStore from '../services/campaign-store.js';
import * as analyticsStore from '../services/analytics-store.js';
import type { OptimizationRecommendation } from '../types/index.js';

const client = new Anthropic({ apiKey: appConfig.anthropicApiKey });

const OUTPUT_SCHEMA = `{
  "overallScore": <number 0-100>,
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "category": "content" | "targeting" | "links" | "timing",
      "action": "<specific action to take>",
      "rationale": "<why this will improve performance>"
    }
  ],
  "projectedImpact": "<quantified projection if high-priority items are implemented>"
}`;

export async function optimizeCampaign(campaignId: string): Promise<OptimizationRecommendation> {
  const campaign = campaignStore.getCampaign(campaignId);
  const analytics = analyticsStore.getCampaignAnalytics(campaignId);

  const topLinksText =
    analytics.topLinks.length > 0
      ? analytics.topLinks
          .slice(0, 5)
          .map(
            (l) =>
              `  - ${l.name}: ${l.clicks} clicks, ${l.conversions} conversions, $${l.revenue.toFixed(2)} revenue`
          )
          .join('\n')
      : '  None recorded yet';

  const stream = client.messages.stream({
    model: appConfig.model,
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: `You are a world-class affiliate marketing optimizer. You analyze campaign performance data and deliver specific, evidence-based recommendations that drive measurable revenue growth. Your output must be grounded in the data provided — never generic advice.

Always return your response as valid JSON matching this exact schema:
${OUTPUT_SCHEMA}

Return ONLY the JSON object — no markdown fences, no preamble.`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Optimize this affiliate campaign.

Campaign: ${campaign.name}
Niche: ${campaign.niche}
Target Audience: ${campaign.targetAudience}
Status: ${campaign.status}

Performance Metrics:
- Total Clicks: ${analytics.totalClicks}
- Total Conversions: ${analytics.totalConversions}
- Conversion Rate: ${(analytics.conversionRate * 100).toFixed(2)}%
- Total Revenue: $${analytics.totalRevenue.toFixed(2)}
- Active Affiliate Links: ${analytics.topLinks.length}
- Content Pieces Published: ${analytics.contentPerformance.length}

Top Links by Click Volume:
${topLinksText}

Provide 4–8 prioritized, specific action items across content, targeting, links, and timing.`,
      },
    ],
  });

  const message = await stream.finalMessage();

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No optimization output received from Claude');
  }

  let result: {
    overallScore: number;
    recommendations: OptimizationRecommendation['recommendations'];
    projectedImpact: string;
  };

  try {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    result = JSON.parse(jsonMatch?.[0] ?? textBlock.text);
  } catch {
    throw new Error('Failed to parse optimization response as JSON');
  }

  return {
    campaignId,
    overallScore: result.overallScore,
    recommendations: result.recommendations,
    projectedImpact: result.projectedImpact,
  };
}
