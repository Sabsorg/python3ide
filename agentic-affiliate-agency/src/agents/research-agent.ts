import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam, Tool, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages';
import { appConfig } from '../config/index.js';
import type { NicheResearchResult } from '../types/index.js';

const client = new Anthropic({ apiKey: appConfig.anthropicApiKey });

const tools: Tool[] = [
  {
    name: 'analyze_niche',
    description:
      'Analyze a niche for affiliate marketing potential including keywords, audience size, competition, and audience psychology',
    input_schema: {
      type: 'object',
      properties: {
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'High-value SEO and PPC keywords for this niche',
        },
        audienceSize: {
          type: 'string',
          enum: ['small', 'medium', 'large', 'massive'],
          description: 'Estimated addressable audience size',
        },
        competitionLevel: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Overall competition level in this niche',
        },
        audienceInsights: {
          type: 'string',
          description: 'Key psychological and behavioral insights about the target audience',
        },
      },
      required: ['keywords', 'audienceSize', 'competitionLevel', 'audienceInsights'],
    },
  },
  {
    name: 'find_affiliate_products',
    description:
      'Identify the highest-converting affiliate products for a given niche and audience',
    input_schema: {
      type: 'object',
      properties: {
        products: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              estimatedCommission: { type: 'string' },
              audienceFit: { type: 'string' },
            },
            required: ['name', 'description', 'estimatedCommission', 'audienceFit'],
          },
          description: 'Top affiliate products ranked by revenue potential',
        },
      },
      required: ['products'],
    },
  },
  {
    name: 'generate_content_ideas',
    description:
      'Generate high-converting content ideas optimized for this niche and audience',
    input_schema: {
      type: 'object',
      properties: {
        ideas: {
          type: 'array',
          items: { type: 'string' },
          description: 'Content ideas that will rank and convert',
        },
      },
      required: ['ideas'],
    },
  },
];

interface AnalyzeNicheInput {
  keywords: string[];
  audienceSize: string;
  competitionLevel: string;
  audienceInsights: string;
}

interface FindProductsInput {
  products: NicheResearchResult['topProducts'];
}

interface GenerateIdeasInput {
  ideas: string[];
}

interface ResearchAccumulator {
  keywords: string[];
  audienceInsights: string;
  competitiveAnalysis: string;
  products: NicheResearchResult['topProducts'];
  contentIdeas: string[];
}

function executeTool(name: string, input: unknown, accumulated: ResearchAccumulator): string {
  if (name === 'analyze_niche') {
    const inp = input as AnalyzeNicheInput;
    accumulated.keywords = inp.keywords;
    accumulated.audienceInsights = inp.audienceInsights;
    accumulated.competitiveAnalysis = `Audience: ${inp.audienceSize}, Competition: ${inp.competitionLevel}`;
    return JSON.stringify({ success: true });
  }
  if (name === 'find_affiliate_products') {
    accumulated.products = (input as FindProductsInput).products;
    return JSON.stringify({ success: true, count: accumulated.products.length });
  }
  if (name === 'generate_content_ideas') {
    accumulated.contentIdeas = (input as GenerateIdeasInput).ideas;
    return JSON.stringify({ success: true, count: accumulated.contentIdeas.length });
  }
  return JSON.stringify({ error: 'Unknown tool' });
}

export async function researchNiche(
  niche: string,
  targetAudience: string
): Promise<NicheResearchResult> {
  const accumulated: ResearchAccumulator = {
    keywords: [],
    audienceInsights: '',
    competitiveAnalysis: '',
    products: [],
    contentIdeas: [],
  };

  const messages: MessageParam[] = [
    {
      role: 'user',
      content: `Conduct comprehensive affiliate marketing research for:

Niche: ${niche}
Target Audience: ${targetAudience}

Use all three tools in order:
1. analyze_niche — keywords, audience profile, competition assessment
2. find_affiliate_products — top 5-8 products with real earning potential
3. generate_content_ideas — 8-12 content ideas that will rank and convert

Be specific and actionable throughout.`,
    },
  ];

  const MAX_ITERATIONS = 10;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: appConfig.model,
      max_tokens: 8192,
      thinking: { type: 'adaptive' },
      tools,
      system: [
        {
          type: 'text',
          text: `You are an elite affiliate marketing strategist with expertise in SEO, consumer psychology, and digital marketing. Your research is thorough, data-informed, and immediately actionable. Use ALL three tools to complete a full research cycle before finishing.`,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages,
    });

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'end_turn') break;

    if (response.stop_reason === 'tool_use') {
      const toolResults: ToolResultBlockParam[] = response.content
        .filter((b) => b.type === 'tool_use')
        .map((b) => {
          if (b.type !== 'tool_use') throw new Error('Expected tool_use block');
          return {
            type: 'tool_result' as const,
            tool_use_id: b.id,
            content: executeTool(b.name, b.input, accumulated),
          };
        });

      messages.push({ role: 'user', content: toolResults });
    }
  }

  return {
    niche,
    keywords: accumulated.keywords,
    topProducts: accumulated.products,
    contentIdeas: accumulated.contentIdeas,
    audienceInsights: accumulated.audienceInsights,
    competitiveAnalysis: accumulated.competitiveAnalysis,
  };
}
