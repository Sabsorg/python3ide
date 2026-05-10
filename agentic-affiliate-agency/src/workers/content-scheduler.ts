import { CEOAgent } from "../agents/ceo/index.js";
import { createLogger } from "../lib/logger.js";

const logger = createLogger("ContentScheduler");

export interface ContentSlot {
  id: string;
  scheduledAt: Date;
  topic: string;
  affiliateProgram: string;
  targetKeywords: string[];
  contentType: "review" | "comparison" | "how-to" | "listicle" | "case-study";
}

export interface SchedulerConfig {
  slots: ContentSlot[];
  onContentReady?: (slot: ContentSlot, content: string) => Promise<void>;
}

export class ContentSchedulerWorker {
  private readonly ceo: CEOAgent;
  private readonly slots: ContentSlot[];
  private readonly onContentReady?: (
    slot: ContentSlot,
    content: string
  ) => Promise<void>;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor({ slots, onContentReady }: SchedulerConfig) {
    this.ceo = new CEOAgent();
    this.slots = slots.sort(
      (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()
    );
    this.onContentReady = onContentReady;
  }

  start(): void {
    logger.info(
      `Content scheduler started — ${this.slots.length} slot(s) queued`
    );
    // Check every minute for due slots
    this.timer = setInterval(() => void this.processDueSlots(), 60_000);
    void this.processDueSlots();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info("Content scheduler stopped.");
    }
  }

  private async processDueSlots(): Promise<void> {
    const now = new Date();
    const due = this.slots.filter(
      (s) => s.scheduledAt <= now && !this.processed.has(s.id)
    );

    for (const slot of due) {
      this.processed.add(slot.id);
      await this.generateContent(slot);
    }
  }

  private readonly processed = new Set<string>();

  private async generateContent(slot: ContentSlot): Promise<void> {
    logger.info(`Generating content for slot "${slot.id}": ${slot.topic}`);

    const task = `
Create a detailed content brief and outline for the following affiliate content piece.

Content Type: ${slot.contentType}
Topic: ${slot.topic}
Affiliate Program: ${slot.affiliateProgram}
Target Keywords: ${slot.targetKeywords.join(", ")}

Deliverables:
1. SEO-optimized title (60 chars max)
2. Meta description (155 chars max)
3. Full outline with H2/H3 structure
4. Key affiliate link placement recommendations
5. CTA suggestions
6. Word count target
    `.trim();

    try {
      const content = await this.ceo.run({ task });
      logger.info(`Content ready for slot "${slot.id}"`);
      await this.onContentReady?.(slot, content);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to generate content for slot "${slot.id}": ${msg}`);
    }
  }
}
