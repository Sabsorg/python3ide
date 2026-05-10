import type Anthropic from "@anthropic-ai/sdk";

export interface AgentConfig {
  name: string;
  role: string;
  systemPrompt: string;
  model?: string;
  maxTokens?: number;
}

export interface AgentRequest {
  task: string;
  context?: Record<string, unknown>;
  conversationHistory?: Anthropic.MessageParam[];
}

export interface AgentResponse {
  agentName: string;
  result: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
  };
}

export interface AffiliateProgram {
  id: string;
  name: string;
  niche: string;
  commissionRate: number;
  cookieDuration: number;
  averageOrderValue: number;
  epc: number; // earnings per click
  network: string;
  url: string;
}

export interface Campaign {
  id: string;
  name: string;
  affiliateProgram: AffiliateProgram;
  budget: number;
  startDate: string;
  endDate?: string;
  targetAudience: string;
  channels: string[];
  status: "draft" | "active" | "paused" | "completed";
}

export interface PerformanceMetrics {
  clicks: number;
  conversions: number;
  revenue: number;
  commissions: number;
  ctr: number; // click-through rate
  conversionRate: number;
  roi: number;
  period: string;
}

export interface LandingPage {
  url: string;
  title: string;
  headline: string;
  subheadline: string;
  cta: string;
  targetKeywords: string[];
  conversionRate?: number;
}

export interface ComplianceCheck {
  compliant: boolean;
  issues: string[];
  recommendations: string[];
  regulations: string[];
}

export interface StrategyPlan {
  objective: string;
  targetNiches: string[];
  contentPillars: string[];
  trafficSources: string[];
  monetizationMethods: string[];
  timeline: string;
  kpis: string[];
}
