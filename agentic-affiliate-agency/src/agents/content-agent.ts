import Anthropic from '@anthropic-ai/sdk';
import { appConfig } from '../config/index.js';
import * as contentStore from '../services/content-store.js';
import * as campaignStore from '../services/campaign-store.js';
import type { GeneratedContent } from '../types/index.js';

const client = new Anthropic({ apiKey: appConfig.anthropicApiKey });

const SYSTEM_PROMPT = `You are an expert affiliate marketing content creator. You write compelling, SEO-optimized content that naturally incorporates affiliate products without being pushy. Your content is informative, engaging, and drives conversions through genuine value delivery.

Always return your response as valid JSON with exactly these fields:
- title: string
- body: string
- keywords: string[]`;

export interface ContentRequest {
  campaignId: string;
  type: 'blog' | 'social' | 'email';
  topic?: string;
  tone?: string;
  wordCount?: number;
}

const typeInstructions: Record<ContentRequest['type'], string> = {
  blog: 'Write a detailed blog post with clear sections, actionable tips, and organic product mentions',
  social:
    'Write a social media post — hook, value, and a clear call to action (max 280 chars for the Twitter version, full version for LinkedIn)',
  email:
    'Write a marketing email with: subject line, preview text, personalized body, and a single clear CTA',
};

export async function generateContent(request: ContentRequest): Promise<GeneratedContent> {
  const campaign = campaignStore.getCampaign(request.campaignId);
  const links = campaignStore.getCampaignLinks(request.campaignId);

  const linkContext =
    links.length > 0
      ? `\n\nAffiliate products to feature:\n${links.map((l) => `- ${l.name}: ${l.url} (${l.commission}% commission)`).join('\n')}`
      : '';

  const stream = client.messages.stream({
    model: appConfig.model,
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Campaign: ${campaign.name}
Niche: ${campaign.niche}
Target Audience: ${campaign.targetAudience}
Content Type: ${request.type}
Topic: ${request.topic ?? `Best ${campaign.niche} resources for ${campaign.targetAudience}`}
Tone: ${request.tone ?? 'informative and engaging'}
${request.wordCount ? `Target word count: ${request.wordCount}` : ''}${linkContext}

Instructions: ${typeInstructions[request.type]}

Return ONLY valid JSON — no markdown fences, no extra text.`,
      },
    ],
  });

  const message = await stream.finalMessage();

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  let parsed: { title: string; body: string; keywords: string[] };
  try {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] ?? textBlock.text);
  } catch {
    throw new Error('Failed to parse content response as JSON');
  }

  return contentStore.saveContent({
    campaignId: request.campaignId,
    type: request.type,
    title: parsed.title,
    body: parsed.body,
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
  });
}
