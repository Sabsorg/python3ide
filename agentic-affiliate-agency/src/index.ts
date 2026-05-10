import "dotenv/config";
import readline from "readline";
import { CEOAgent } from "./agents/ceo/index.js";
import { startMCPServer } from "./mcp-server/index.js";
import { createLogger } from "./lib/logger.js";
import { config } from "./config/index.js";

const logger = createLogger("Main");

function printBanner(): void {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║         Agentic Affiliate Agency  v1.0                  ║
║  CEO → Strategy · Relations · Compliance                ║
║         Performance · Operations · Landing              ║
╚══════════════════════════════════════════════════════════╝
`);
}

async function runInteractiveMode(): Promise<void> {
  const ceo = new CEOAgent();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  printBanner();
  console.log('Type your affiliate marketing task below. Enter "exit" to quit.\n');

  while (true) {
    const task = (await ask("You: ")).trim();

    if (!task) continue;
    if (task.toLowerCase() === "exit") {
      console.log("Goodbye!");
      break;
    }

    console.log("\nCEO Agent is working…\n");

    try {
      const result = await ceo.run({ task });
      console.log(`\n${"─".repeat(60)}\n${result}\n${"─".repeat(60)}\n`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Task failed: ${msg}`);
    }
  }

  rl.close();
}

async function runMCPMode(): Promise<void> {
  printBanner();
  logger.info(
    `Starting in MCP server mode on port ${config.mcpServerPort}…`
  );
  await startMCPServer();
  logger.info("MCP server is running. Press Ctrl+C to stop.");

  // Keep process alive
  await new Promise<void>((resolve) => {
    process.on("SIGINT", resolve);
    process.on("SIGTERM", resolve);
  });

  logger.info("Shutting down.");
}

async function runSingleTask(task: string): Promise<void> {
  const ceo = new CEOAgent();
  printBanner();
  logger.info(`Running task: ${task.slice(0, 100)}`);

  const result = await ceo.run({ task });
  console.log(`\n${"─".repeat(60)}\n${result}\n${"─".repeat(60)}\n`);
}

async function main(): Promise<void> {
  const mode = process.env.MODE ?? "interactive";
  const task = process.env.TASK;

  if (!config.anthropicApiKey) {
    logger.error("ANTHROPIC_API_KEY is not set. Please add it to your .env file.");
    process.exit(1);
  }

  switch (mode) {
    case "mcp":
      await runMCPMode();
      break;
    case "task":
      if (!task) {
        logger.error('MODE=task requires a TASK environment variable.');
        process.exit(1);
      }
      await runSingleTask(task);
      break;
    case "interactive":
    default:
      await runInteractiveMode();
  }
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  logger.error(`Fatal: ${msg}`);
  process.exit(1);
});
