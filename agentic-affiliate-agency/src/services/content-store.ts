import { randomUUID } from 'crypto';
import type { GeneratedContent } from '../types/index.js';

const content = new Map<string, GeneratedContent>();

export function saveContent(data: Omit<GeneratedContent, 'id' | 'createdAt'>): GeneratedContent {
  const item: GeneratedContent = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  content.set(item.id, item);
  return item;
}

export function getContent(id: string): GeneratedContent | undefined {
  return content.get(id);
}

export function getContentByCampaign(campaignId: string): GeneratedContent[] {
  return Array.from(content.values()).filter((c) => c.campaignId === campaignId);
}

export function listContent(): GeneratedContent[] {
  return Array.from(content.values());
}
