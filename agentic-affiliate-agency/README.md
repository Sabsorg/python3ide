Agentic Affiliate Agency - Blueprint v1.0

A production-grade TypeScript API for autonomous affiliate marketing operations powered by Claude AI agents.

## Architecture

```
src/
├── agents/
│   ├── content-agent.ts    # Streaming Claude generation for blog/social/email
│   ├── research-agent.ts   # Agentic tool-use loop for niche research
│   └── optimizer-agent.ts  # Streaming + JSON analysis for campaign optimization
├── routes/
│   ├── campaigns.ts        # CRUD + /research + /optimize endpoints
│   ├── content.ts          # Content generation and retrieval
│   ├── analytics.ts        # Click/conversion tracking
│   └── health.ts           # Health check
├── services/
│   ├── campaign-store.ts   # In-memory campaign and link storage
│   ├── content-store.ts    # Generated content storage
│   └── analytics-store.ts  # Click and conversion event storage
└── types/index.ts          # Shared TypeScript interfaces
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| GET | /api/v1/campaigns | List all campaigns |
| POST | /api/v1/campaigns | Create campaign |
| GET | /api/v1/campaigns/:id | Get campaign |
| PATCH | /api/v1/campaigns/:id | Update campaign |
| DELETE | /api/v1/campaigns/:id | Delete campaign |
| GET | /api/v1/campaigns/:id/links | List affiliate links |
| POST | /api/v1/campaigns/:id/links | Add affiliate link |
| POST | /api/v1/campaigns/:id/research | AI niche research |
| POST | /api/v1/campaigns/:id/optimize | AI campaign optimization |
| POST | /api/v1/content/generate | Generate content with Claude |
| GET | /api/v1/content | List all content |
| GET | /api/v1/content/:id | Get content piece |
| GET | /api/v1/campaigns/:id/content | Content for campaign |
| GET | /api/v1/analytics/:campaignId | Campaign analytics |
| POST | /api/v1/analytics/:campaignId/click | Record click event |
| POST | /api/v1/analytics/:campaignId/conversion | Record conversion |

## Setup

```bash
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
npm install
npm run dev
```

## AI Agents

**Content Agent** — Streams from `claude-opus-4-7` with adaptive thinking to produce SEO-optimized blog posts, social media posts, and email campaigns. Automatically incorporates your affiliate links.

**Research Agent** — Runs a multi-turn agentic loop with three tools (analyze niche, find products, generate content ideas). Claude orchestrates the calls and synthesizes a complete research report.

**Optimizer Agent** — Streams a structured JSON analysis of campaign performance with prioritized action items across content, targeting, links, and timing categories.

## Commands

```bash
npm run dev          # Development server with hot reload
npm run build        # Compile TypeScript
npm start            # Run compiled server
npm test             # Run test suite
npm run test:coverage # Run with coverage report
npm run lint         # ESLint
npm run typecheck    # TypeScript type check
```
