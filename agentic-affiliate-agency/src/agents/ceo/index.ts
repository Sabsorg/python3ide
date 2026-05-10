import Anthropic from "@anthropic-ai/sdk";
import { createLogger } from "../../lib/logger.js";
import { config } from "../../config/index.js";
import type { AgentResponse } from "../../lib/types.js";
import { StrategyAgent } from "../strategy/index.js";
import { RelationsAgent } from "../relations/index.js";
import { ComplianceAgent } from "../compliance/index.js";
import { PerformanceAgent } from "../performance/index.js";
import { OperationsAgent } from "../operations/index.js";
import { LandingAgent } from "../landing/index.js";

const SYSTEM_PROMPT = `You are the CEO of an Agentic Affiliate Marketing Agency. You orchestrate a team of specialized AI agents to build, manage, and scale profitable affiliate marketing operations.

Your team consists of:
- **Strategy Agent**: Develops affiliate marketing strategies, niche selection, and revenue roadmaps
- **Relations Agent**: Manages affiliate program partnerships and advertiser relationships
- **Compliance Agent**: Ensures FTC compliance, GDPR adherence, and ethical marketing practices
- **Performance Agent**: Analyzes metrics, tracks KPIs, and optimizes conversion funnels
- **Operations Agent**: Handles day-to-day workflows, content calendars, and execution
- **Landing Agent**: Creates and A/B tests high-converting landing pages and funnels

Your role is to:
1. Understand the user's affiliate marketing goals
2. Break down complex requests into specialized tasks
3. Delegate to the appropriate agents using your tools
4. Synthesize results into actionable strategies
5. Provide executive-level insights and direction

Always think strategically. Coordinate multiple agents when a task spans multiple domains. Provide clear, business-focused summaries.`;

const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "delegate_to_strategy",
    description:
      "Delegate tasks to the Strategy Agent for niche research, competitive analysis, affiliate program selection, revenue projections, and long-term marketing strategy development.",
    input_schema: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "The strategic task to execute",
        },
        context: {
          type: "object",
          description: "Additional context like target niche, budget, goals",
        },
      },
      required: ["task"],
    },
  },
  {
    name: "delegate_to_relations",
    description:
      "Delegate tasks to the Relations Agent for affiliate program outreach, partnership negotiations, advertiser relationship management, and network recommendations.",
    input_schema: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "The relations/partnership task to execute",
        },
        context: {
          type: "object",
          description: "Context about target programs, niches, or partners",
        },
      },
      required: ["task"],
    },
  },
  {
    name: "delegate_to_compliance",
    description:
      "Delegate tasks to the Compliance Agent for FTC disclosure review, GDPR compliance checks, email marketing regulations, and ethical marketing guidelines.",
    input_schema: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "The compliance or legal task to review",
        },
        context: {
          type: "object",
          description: "Content, campaigns, or practices to review",
        },
      },
      required: ["task"],
    },
  },
  {
    name: "delegate_to_performance",
    description:
      "Delegate tasks to the Performance Agent for metrics analysis, conversion optimization, A/B test interpretation, ROI calculations, and funnel optimization.",
    input_schema: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "The performance analysis task",
        },
        context: {
          type: "object",
          description: "Metrics data, campaign data, or benchmarks to analyze",
        },
      },
      required: ["task"],
    },
  },
  {
    name: "delegate_to_operations",
    description:
      "Delegate tasks to the Operations Agent for content planning, workflow automation, publishing schedules, link management, and campaign execution.",
    input_schema: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "The operational task to execute",
        },
        context: {
          type: "object",
          description: "Campaign details, timelines, or resources",
        },
      },
      required: ["task"],
    },
  },
  {
    name: "delegate_to_landing",
    description:
      "Delegate tasks to the Landing Agent for landing page creation, conversion copy, CTA optimization, funnel design, and page structure recommendations.",
    input_schema: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "The landing page or funnel task",
        },
        context: {
          type: "object",
          description: "Product details, target audience, or existing page data",
        },
      },
      required: ["task"],
    },
  },
];

export class CEOAgent {
  private client: Anthropic;
  private logger: ReturnType<typeof createLogger>;
  private agents: {
    strategy: StrategyAgent;
    relations: RelationsAgent;
    compliance: ComplianceAgent;
    performance: PerformanceAgent;
    operations: OperationsAgent;
    landing: LandingAgent;
  };

  constructor() {
    this.client = new Anthropic({ apiKey: config.anthropicApiKey });
    this.logger = createLogger("CEO");
    this.agents = {
      strategy: new StrategyAgent(),
      relations: new RelationsAgent(),
      compliance: new ComplianceAgent(),
      performance: new PerformanceAgent(),
      operations: new OperationsAgent(),
      landing: new LandingAgent(),
    };
  }

  async run(userRequest: string): Promise<string> {
    this.logger.info(`Received request: ${userRequest}`);

    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: userRequest },
    ];

    let finalResponse = "";
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      iterations++;
      this.logger.info(`Orchestration loop iteration ${iterations}`);

      const response = await this.client.messages.create({
        model: config.defaultModel,
        max_tokens: config.ceoMaxTokens,
        thinking: { type: "adaptive" },
        system: SYSTEM_PROMPT,
        tools: AGENT_TOOLS,
        messages,
      });

      messages.push({ role: "assistant", content: response.content });

      // Collect any text from this turn
      for (const block of response.content) {
        if (block.type === "text") {
          finalResponse = block.text;
        }
      }

      if (response.stop_reason === "end_turn") {
        break;
      }

      if (response.stop_reason === "pause_turn") {
        continue;
      }

      if (response.stop_reason !== "tool_use") {
        break;
      }

      // Execute all tool calls
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== "tool_use") continue;

        this.logger.info(`Delegating to: ${block.name}`, block.input);
        const input = block.input as { task: string; context?: Record<string, unknown> };

        let agentResult: AgentResponse;

        try {
          switch (block.name) {
            case "delegate_to_strategy":
              agentResult = await this.agents.strategy.run({
                task: input.task,
                context: input.context,
              });
              break;
            case "delegate_to_relations":
              agentResult = await this.agents.relations.run({
                task: input.task,
                context: input.context,
              });
              break;
            case "delegate_to_compliance":
              agentResult = await this.agents.compliance.run({
                task: input.task,
                context: input.context,
              });
              break;
            case "delegate_to_performance":
              agentResult = await this.agents.performance.run({
                task: input.task,
                context: input.context,
              });
              break;
            case "delegate_to_operations":
              agentResult = await this.agents.operations.run({
                task: input.task,
                context: input.context,
              });
              break;
            case "delegate_to_landing":
              agentResult = await this.agents.landing.run({
                task: input.task,
                context: input.context,
              });
              break;
            default:
              agentResult = { agentName: "Unknown", result: `Unknown tool: ${block.name}` };
          }

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: agentResult.result,
          });
        } catch (err) {
          this.logger.error(`Agent error for ${block.name}`, err);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `Error: ${err instanceof Error ? err.message : String(err)}`,
            is_error: true,
          });
        }
      }

      messages.push({ role: "user", content: toolResults });
    }

    this.logger.info("Orchestration complete");
    return finalResponse;
  }
}
