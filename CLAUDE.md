# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Deno-based TypeScript project that provides a Notion-to-Markdown converter with both API and CLI interfaces. The project enables bidirectional conversion between Notion pages and Markdown format.

## Development Commands

```bash
# Start development server with hot reload
deno task dev

# Start production server
deno task start

# Run all tests
deno task test

# Run specific test file
deno test --allow-net --allow-env --allow-read ./src/lib/notion-client.test.ts
deno test --allow-net --allow-env --allow-read ./src/lib/block-to-markdown.test.ts
deno test --allow-net --allow-env --allow-read ./src/lib/markdown-to-blocks.test.ts

# Format code
deno fmt

# Lint code
deno lint

# Install CLI tool
deno install --allow-env --allow-net --allow-read -n notion-markdown ./cli/cli.ts
```

## Architecture

### Core Components

- **NotionClient** (`src/lib/notion-client.ts`): Main service class that orchestrates Notion API interactions and conversions
- **BlockToMarkdown** (`src/lib/block-to-markdown.ts`): Converts Notion blocks to Markdown format
- **MarkdownToBlocks** (`src/lib/markdown-to-blocks.ts`): Converts Markdown to Notion block structures
- **API Server** (`src/main.ts` + `src/routes/api.ts`): Hono-based HTTP API with authentication middleware
- **CLI Tool** (`cli/cli.ts`): Command-line interface for direct page operations

### Data Flow

1. **Reading**: Notion API → BlockObjectResponse → NotionBlocks → Markdown
2. **Writing**: Markdown → NotionBlocks → BlockObjectRequest → Notion API

### Environment Variables

The project requires these environment variables:

- `NOTION_TOKEN` (CLI) / `NOTION_API_KEY` (API): Notion API authentication
- `NOTION_DATABASE_ID`: Default database for new pages
- `API_KEY`: Authentication for API endpoints (optional, enables auth middleware)
- `PORT`: Server port (defaults to 8000)

## Key Patterns

- Uses `.env` file loading via `std/dotenv` for local development
- All API endpoints under `/pages/*` require Bearer token authentication when `API_KEY` is set
- Page IDs are validated as UUIDs before processing
- Error handling with structured JSON responses in API, console output in CLI
- TypeScript strict mode with comprehensive type definitions in `src/lib/types.ts`

## Testing Strategy

Tests are located in the `src/lib/` directory alongside source files, using Deno's built-in test runner. Each core conversion module has dedicated test coverage for various Notion block types and Markdown patterns.

## Important Development Notes

- Environment variables are loaded from `.env` file for local development - never commit secrets
- CLI uses `NOTION_TOKEN` environment variable, while API uses `NOTION_API_KEY`
- API authentication is optional - only enforced when `API_KEY` environment variable is set
- All file operations require proper Deno permissions: `--allow-net --allow-env --allow-read`
- The project includes comprehensive language mapping for code blocks in `NotionClient`
- API routes include UUID validation middleware for page IDs
- Health check endpoint available at `/health` for monitoring
