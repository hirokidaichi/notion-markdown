# cURL Examples

This document provides practical examples of using the Notion Markdown API with cURL.

## Prerequisites

1. Set up your environment variables:
```bash
export API_KEY="your-api-key-here"
export NOTION_PAGE_ID="12345678-1234-1234-1234-123456789abc"
export API_BASE_URL="http://localhost:8000"
```

## Health Check

### Check API Health
```bash
curl -X GET "${API_BASE_URL}/health"
```

Response:
```json
{
  "status": "ok"
}
```

### Get API Information
```bash
curl -X GET "${API_BASE_URL}/api"
```

Response:
```json
{
  "name": "notion-markdown-api",
  "version": "1.0.0",
  "description": "Notion pages to Markdown converter API"
}
```

## Authentication

All `/api/pages/*` endpoints require Bearer token authentication:

```bash
curl -X GET "${API_BASE_URL}/api/pages/${NOTION_PAGE_ID}" \
  -H "Authorization: Bearer ${API_KEY}"
```

## Get Page Content

### Basic Request
```bash
curl -X GET "${API_BASE_URL}/api/pages/${NOTION_PAGE_ID}" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json"
```

### Example Response
```json
{
  "title": "My Project Documentation",
  "markdown": "# My Project Documentation\n\nThis is the main documentation for my project.\n\n## Getting Started\n\n1. Install dependencies\n2. Configure environment\n3. Run the application\n\n### Code Example\n\n```typescript\nconsole.log('Hello, World!');\n```\n\n> **Note:** This is an important consideration.\n\n- [ ] Task 1: Complete setup\n- [x] Task 2: Write documentation"
}
```

### Error Handling

#### Invalid Page ID Format
```bash
curl -X GET "${API_BASE_URL}/api/pages/invalid-id" \
  -H "Authorization: Bearer ${API_KEY}"
```

Response (400):
```json
{
  "error": "Invalid page ID format. Expected UUID format."
}
```

#### Missing Authorization
```bash
curl -X GET "${API_BASE_URL}/api/pages/${NOTION_PAGE_ID}"
```

Response (401):
```json
{
  "error": "Authorization header is missing or invalid"
}
```

#### Invalid API Key
```bash
curl -X GET "${API_BASE_URL}/api/pages/${NOTION_PAGE_ID}" \
  -H "Authorization: Bearer wrong-key"
```

Response (401):
```json
{
  "error": "Invalid API key"
}
```

## Append Content to Page

### Basic Append Request
```bash
curl -X POST "${API_BASE_URL}/api/pages/${NOTION_PAGE_ID}/append" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "## New Section\n\nThis content will be appended to the page.\n\n- New bullet point\n- Another important point"
  }'
```

### Example Response
```json
{
  "success": true
}
```

### Complex Content Example
```bash
curl -X POST "${API_BASE_URL}/api/pages/${NOTION_PAGE_ID}/append" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# Weekly Report\n\n## Completed Tasks\n\n- [x] Feature A implementation\n- [x] Bug fixes for issue #123\n- [ ] Code review pending\n\n## Code Changes\n\n```python\ndef hello_world():\n    print(\"Hello, World!\")\n    return True\n```\n\n### Performance Metrics\n\n> The new implementation shows 40% improvement in response time.\n\n**Next Steps:**\n1. Deploy to staging\n2. Run integration tests\n3. Schedule production deployment\n\n![Architecture Diagram](https://example.com/diagram.png)"
  }'
```

## Advanced Usage

### Pipe Content from File
```bash
# Create a markdown file
cat > content.md << 'EOF'
## Daily Standup Notes

### What I did yesterday:
- Completed API documentation
- Fixed authentication bug

### What I'm doing today:
- Working on frontend integration
- Code review for PR #45

### Blockers:
- Waiting for design approval

```javascript
// Example code snippet
const fetchData = async () => {
  const response = await fetch('/api/data');
  return response.json();
};
```
EOF

# Append the content
curl -X POST "${API_BASE_URL}/api/pages/${NOTION_PAGE_ID}/append" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --rawfile md content.md '{markdown: $md}')"
```

### Using with jq for JSON Processing
```bash
# Get page content and extract just the title
curl -s -X GET "${API_BASE_URL}/api/pages/${NOTION_PAGE_ID}" \
  -H "Authorization: Bearer ${API_KEY}" | jq -r '.title'

# Get page content and save markdown to file
curl -s -X GET "${API_BASE_URL}/api/pages/${NOTION_PAGE_ID}" \
  -H "Authorization: Bearer ${API_KEY}" | jq -r '.markdown' > page-content.md
```

### Batch Operations Script
```bash
#!/bin/bash

# batch-append.sh - Append content to multiple pages

API_KEY="your-api-key"
API_BASE_URL="http://localhost:8000"

PAGES=(
  "12345678-1234-1234-1234-123456789abc"
  "87654321-4321-4321-4321-cba987654321"
)

CONTENT="## Weekly Update\n\nThis is a batch update to all project pages.\n\n- Status: In Progress\n- Next Review: Friday"

for page_id in "${PAGES[@]}"; do
  echo "Updating page: $page_id"
  
  response=$(curl -s -X POST "${API_BASE_URL}/api/pages/${page_id}/append" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"markdown\": \"${CONTENT}\"}")
  
  if echo "$response" | jq -e '.success' > /dev/null; then
    echo "✓ Successfully updated $page_id"
  else
    echo "✗ Failed to update $page_id: $response"
  fi
  
  sleep 1  # Rate limiting
done
```

## Troubleshooting

### Common Issues

1. **SSL Certificate Issues** (when using HTTPS):
```bash
curl -k -X GET "${API_BASE_URL}/api/pages/${NOTION_PAGE_ID}" \
  -H "Authorization: Bearer ${API_KEY}"
```

2. **Verbose Output for Debugging**:
```bash
curl -v -X GET "${API_BASE_URL}/api/pages/${NOTION_PAGE_ID}" \
  -H "Authorization: Bearer ${API_KEY}"
```

3. **Timeout Configuration**:
```bash
curl --connect-timeout 10 --max-time 30 \
  -X GET "${API_BASE_URL}/api/pages/${NOTION_PAGE_ID}" \
  -H "Authorization: Bearer ${API_KEY}"
```

### Response Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid page ID format or malformed request
- `401 Unauthorized` - Missing or invalid authentication
- `500 Internal Server Error` - Server-side error (check server logs)