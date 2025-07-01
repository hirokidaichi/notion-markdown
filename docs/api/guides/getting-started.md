# Getting Started with Notion Markdown API

This guide will help you get started with the Notion Markdown API, a service that provides bidirectional conversion between Notion pages and Markdown format.

## Overview

The Notion Markdown API allows you to:

- **Read** Notion pages and convert them to Markdown format
- **Append** Markdown content to existing Notion pages
- Maintain rich formatting including headings, lists, code blocks, and more

## Prerequisites

### 1. Notion Integration Setup

Before using the API, you need to create a Notion integration:

1. Go to [Notion Developers](https://developers.notion.com/)
2. Click "Create new integration"
3. Fill in the integration details:
   - Name: Your integration name
   - Logo: Optional
   - Associated workspace: Select your workspace
4. Click "Submit"
5. Copy the **Internal Integration Token** (starts with `secret_`)

### 2. Page Access Configuration

Your integration needs access to the pages you want to work with:

1. Open the Notion page you want to access
2. Click the "Share" button in the top-right
3. Click "Invite"
4. Find your integration by name and select it
5. Click "Invite"

Repeat this process for each page you want to access via the API.

### 3. Environment Setup

Set up your environment variables:

```bash
# Required: Your Notion integration token
export NOTION_TOKEN="secret_your_integration_token_here"

# Optional: API authentication key (enables Bearer token auth)
export API_KEY="your-chosen-api-key"

# Optional: Server port (defaults to 8000)
export PORT="8000"

# Optional: Default database ID for new pages (if implemented)
export NOTION_DATABASE_ID="your-database-id"
```

## Installation and Setup

### Running the Server

1. **Clone and navigate to the project:**

```bash
git clone https://github.com/your-username/notion-markdown.git
cd notion-markdown
```

2. **Create environment file:**

```bash
cp .env.example .env
# Edit .env file with your tokens
```

3. **Start the development server:**

```bash
deno task dev
```

4. **Or start the production server:**

```bash
deno task start
```

The server will start on `http://localhost:8000` (or your configured PORT).

### Verify Installation

Test that the API is running:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

Get API information:

```bash
curl http://localhost:8000/api
```

Expected response:

```json
{
  "name": "notion-markdown-api",
  "version": "1.0.0",
  "description": "Notion pages to Markdown converter API"
}
```

## Authentication

The API uses Bearer token authentication for all `/api/pages/*` endpoints when the `API_KEY` environment variable is set.

### Setting Up Authentication

1. **Set API key on server:**

```bash
export API_KEY="your-secure-api-key"
```

2. **Include in requests:**

```bash
curl -H "Authorization: Bearer your-secure-api-key" \
     http://localhost:8000/api/pages/YOUR_PAGE_ID
```

### Without Authentication

If `API_KEY` is not set, the server will return an error for protected endpoints:

```json
{
  "error": "API key is not configured"
}
```

## Basic Usage

### 1. Get Your Page ID

Notion page IDs are found in the URL. For example:

- URL: `https://www.notion.so/My-Page-12345678123412341234123456789abc`
- Page ID: `12345678-1234-1234-1234-123456789abc`

Note: You may need to add hyphens to format as UUID.

### 2. Retrieve Page Content

```bash
export PAGE_ID="12345678-1234-1234-1234-123456789abc"
export API_KEY="your-api-key"

curl -H "Authorization: Bearer $API_KEY" \
     "http://localhost:8000/api/pages/$PAGE_ID"
```

Example response:

```json
{
  "title": "My Project Documentation",
  "markdown": "# My Project Documentation\n\nThis is the content of my page...\n\n## Section 1\n\n- Item 1\n- Item 2"
}
```

### 3. Append Content to Page

```bash
curl -X POST \
     -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"markdown": "## New Section\n\nThis content will be appended to the page."}' \
     "http://localhost:8000/api/pages/$PAGE_ID/append"
```

Example response:

```json
{
  "success": true
}
```

## Supported Markdown Features

The API supports bidirectional conversion for these Markdown elements:

### Text Formatting

- **Bold text**
- _Italic text_
- ~~Strikethrough~~
- <u>Underline</u>
- `Inline code`

### Headings

```markdown
# Heading 1

## Heading 2

### Heading 3
```

### Lists

```markdown
- Bulleted list item
- Another bullet point

1. Numbered list item
2. Another numbered item

- [ ] Todo item (unchecked)
- [x] Todo item (checked)
```

### Code Blocks

````markdown
```typescript
function hello() {
  console.log("Hello, World!");
}
```
````

Supported languages include: TypeScript, JavaScript, Python, Java, C++, and many more.

### Quotes

```markdown
> This is a quote block
> It can span multiple lines
```

### Images

```markdown
![Alt text](https://example.com/image.png)
```

Note: Only external image URLs are supported.

## Error Handling

The API returns structured error responses:

### Client Errors (4xx)

**Invalid Page ID:**

```json
{
  "error": "Invalid page ID format. Expected UUID format."
}
```

**Authentication Errors:**

```json
{
  "error": "Authorization header is missing or invalid"
}
```

```json
{
  "error": "Invalid API key"
}
```

### Server Errors (5xx)

**General Server Error:**

```json
{
  "error": "Failed to get page",
  "details": "Page not found or access denied"
}
```

## Rate Limiting and Best Practices

### Rate Limiting

- No explicit rate limits are set by the API server
- Notion API has its own rate limits (3 requests per second for integrations)
- Implement client-side rate limiting for bulk operations

### Best Practices

1. **Validate Page IDs:**
   - Always validate UUID format before making requests
   - Use the validation pattern: `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`

2. **Error Handling:**
   - Implement exponential backoff for server errors (5xx)
   - Don't retry client errors (4xx)
   - Log detailed error information for debugging

3. **Authentication:**
   - Keep API keys secure and don't commit them to version control
   - Use environment variables for configuration
   - Rotate API keys regularly

4. **Content Management:**
   - Test Markdown conversion with small content first
   - Be aware that complex Notion blocks may not convert perfectly
   - Always backup important content before bulk operations

## Next Steps

- **API Reference:** See the [OpenAPI specification](../openapi.yaml) for complete endpoint documentation
- **Code Examples:** Check out the language-specific examples:
  - [cURL Examples](../examples/curl-examples.md)
  - [TypeScript Examples](../examples/typescript-examples.ts)
  - [Python Examples](../examples/python-examples.py)
- **Integration Guide:** Learn about [integrating with your applications](./integration-guide.md)
- **Troubleshooting:** Common issues and solutions in the [troubleshooting guide](./troubleshooting.md)

## Support

For issues and questions:

- Check the [troubleshooting guide](./troubleshooting.md)
- Review the API documentation
- Check server logs for detailed error information
