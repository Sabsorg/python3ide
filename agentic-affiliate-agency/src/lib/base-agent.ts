import Anthropic from "@anthropic-ai/sdk";
import { createLogger } from "./logger.js";
import type { AgentConfig, AgentRequest, AgentResponse } from "./types.js";
import { config } from "../config/index.js";

export abstract class BaseAgent {
  protected client: Anthropic;
  protected logger: ReturnType<typeof createLogger>;
  protected agentConfig: AgentConfig;

  constructor(agentConfig: AgentConfig) {
    this.client = new Anthropic({ apiKey: config.anthropicApiKey });
    this.agentConfig = agentConfig;
    this.logger = createLogger(agentConfig.name);
  }

  async run(request: AgentRequest): Promise<AgentResponse> {
    this.logger.info(`Starting task: ${request.task}`);

    const messages: Anthropic.MessageParam[] = [
      ...(request.conversationHistory ?? []),
      {
        role: "user",
        content: this.buildUserPrompt(request),
      },
    ];

    const stream = this.client.messages.stream({
      model: this.agentConfig.model ?? config.defaultModel,
      max_tokens: this.agentConfig.maxTokens ?? config.defaultMaxTokens,
      thinking: { type: "adaptive" },
      system: this.agentConfig.systemPrompt,
      messages,
    });

    let fullText = "";
    process.stdout.write(`\n[${this.agentConfig.name}] `);

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        process.stdout.write(event.delta.text);
        fullText += event.delta.text;
      }
    }
    process.stdout.write("\n");

    const finalMessage = await stream.finalMessage();
    this.logger.info("Task complete", {
      inputTokens: finalMessage.usage.input_tokens,
      outputTokens: finalMessage.usage.output_tokens,
    });

    return {
      agentName: this.agentConfig.name,
      result: fullText,
      usage: {
        inputTokens: finalMessage.usage.input_tokens,
        outputTokens: finalMessage.usage.output_tokens,
        cacheReadTokens: finalMessage.usage.cache_read_input_tokens ?? 0,
      },
    };
  }

  protected buildUserPrompt(request: AgentRequest): string {
    let prompt = request.task;
    if (request.context && Object.keys(request.context).length > 0) {
      prompt += `\n\nContext:\n${JSON.stringify(request.context, null, 2)}`;
    }
    return prompt;
  }
}
