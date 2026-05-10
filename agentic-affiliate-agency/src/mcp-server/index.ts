import http from "http";
import { config } from "../config/index.js";
import { CEOAgent } from "../agents/ceo/index.js";
import { createLogger } from "../lib/logger.js";

const logger = createLogger("MCPServer");

interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

const ceoAgent = new CEOAgent();

const TOOLS = [
  {
    name: "run_affiliate_task",
    description:
      "Run an affiliate marketing task through the multi-agent CEO orchestrator. The CEO will delegate to specialist agents (Strategy, Relations, Compliance, Performance, Operations, Landing) as needed.",
    inputSchema: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "The affiliate marketing task or question to process",
        },
        context: {
          type: "string",
          description: "Optional additional context for the task",
        },
      },
      required: ["task"],
    },
  },
];

async function handleMCPRequest(req: MCPRequest): Promise<MCPResponse> {
  const { id, method, params } = req;

  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "agentic-affiliate-agency", version: "1.0.0" },
      },
    };
  }

  if (method === "tools/list") {
    return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params as {
      name: string;
      arguments: Record<string, string>;
    };

    if (name !== "run_affiliate_task") {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Unknown tool: ${name}` },
      };
    }

    try {
      logger.info(`Running affiliate task: ${args.task.slice(0, 80)}...`);
      const result = await ceoAgent.run({
        task: args.task,
        context: args.context,
      });

      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: result }],
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Tool execution failed: ${message}`);
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32603, message: "Internal error", data: message },
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  };
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

export async function startMCPServer(): Promise<void> {
  const server = http.createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");

    if (req.method !== "POST") {
      res.writeHead(405);
      res.end(JSON.stringify({ error: "Method Not Allowed" }));
      return;
    }

    try {
      const body = await readBody(req);
      const mcpReq: MCPRequest = JSON.parse(body);
      const response = await handleMCPRequest(mcpReq);
      res.writeHead(200);
      res.end(JSON.stringify(response));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.writeHead(400);
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32700, message: "Parse error", data: message },
        })
      );
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(config.mcpServerPort, () => {
      logger.info(`MCP server listening on port ${config.mcpServerPort}`);
      resolve();
    });
  });
}
