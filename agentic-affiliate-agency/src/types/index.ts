export interface Campaign {
  id: string;
  name: string;
  niche: string;
  targetAudience: string;
  affiliateLinks: AffiliateLink[];
  status: 'active' | 'paused' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateLink {
  id: string;
  campaignId: string;
  url: string;
  name: string;
  commission: number;
  clicks: number;
  conversions: number;
}

export interface GeneratedContent {
  id: string;
  campaignId: string;
  type: 'blog' | 'social' | 'email';
  title: string;
  body: string;
  keywords: string[];
  createdAt: string;
}

export interface ClickEvent {
  id: string;
  linkId: string;
  campaignId: string;
  timestamp: string;
  userAgent?: string;
  referrer?: string;
}

export interface ConversionEvent {
  id: string;
  linkId: string;
  campaignId: string;
  value: number;
  timestamp: string;
}

export interface CampaignAnalytics {
  campaignId: string;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalRevenue: number;
  topLinks: LinkPerformance[];
  contentPerformance: ContentSummary[];
}

export interface LinkPerformance {
  linkId: string;
  name: string;
  clicks: number;
  conversions: number;
  revenue: number;
}

export interface ContentSummary {
  contentId: string;
  type: string;
  title: string;
  createdAt: string;
}

export interface NicheResearchResult {
  niche: string;
  keywords: string[];
  topProducts: ProductRecommendation[];
  contentIdeas: string[];
  audienceInsights: string;
  competitiveAnalysis: string;
}

export interface ProductRecommendation {
  name: string;
  description: string;
  estimatedCommission: string;
  audienceFit: string;
}

export interface OptimizationRecommendation {
  campaignId: string;
  overallScore: number;
  recommendations: ActionItem[];
  projectedImpact: string;
}

export interface ActionItem {
  priority: 'high' | 'medium' | 'low';
  category: 'content' | 'targeting' | 'links' | 'timing';
  action: string;
  rationale: string;
}
