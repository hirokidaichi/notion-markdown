# Troubleshooting Guide

This guide helps you diagnose and resolve common issues when working with the Notion Markdown API.

## Table of Contents

- [Common Error Messages](#common-error-messages)
- [Authentication Issues](#authentication-issues)
- [Connection Problems](#connection-problems)
- [Content Conversion Issues](#content-conversion-issues)
- [Performance Issues](#performance-issues)
- [Debugging Tools](#debugging-tools)
- [Getting Help](#getting-help)

## Common Error Messages

### `Invalid page ID format. Expected UUID format.`

**Cause**: The page ID you provided is not in the correct UUID format.

**Solution**:

1. Check your page ID format. It should look like: `12345678-1234-1234-1234-123456789abc`
2. Extract the ID correctly from the Notion URL:
   - URL: `https://www.notion.so/My-Page-123456781234123412341234567890ab`
   - Correct ID: `12345678-1234-1234-1234-567890abcdef` (add hyphens)

**Example Fix**:

```bash
# Wrong
curl "http://localhost:8000/api/pages/123456781234123412341234567890ab"

# Correct
curl "http://localhost:8000/api/pages/12345678-1234-1234-1234-567890abcdef"
```

### `Authorization header is missing or invalid`

**Cause**: The request doesn't include proper authentication.

**Solution**:

1. Ensure you're including the Authorization header
2. Use the correct Bearer token format
3. Check that your API key matches the server configuration

**Example Fix**:

```bash
# Wrong
curl "http://localhost:8000/api/pages/12345678-1234-1234-1234-123456789abc"

# Correct
curl -H "Authorization: Bearer your-api-key" \
     "http://localhost:8000/api/pages/12345678-1234-1234-1234-123456789abc"
```

### `Failed to get page` with details

**Common Causes**:

- Page doesn't exist
- Integration doesn't have access to the page
- Notion API token is invalid
- Network connectivity issues

**Solutions**:

1. Verify the page exists in Notion
2. Check integration permissions (see [Page Access Setup](#page-access-setup))
3. Validate your Notion token
4. Test network connectivity

### `API key is not configured`

**Cause**: The server's `API_KEY` environment variable is not set.

**Solution**:
Set the API_KEY environment variable on the server:

```bash
export API_KEY="your-chosen-api-key"
deno task start
```

## Authentication Issues

### Page Access Setup

If you're getting "access denied" errors, ensure your integration has access to the page:

1. **Open the Notion page**
2. **Click "Share" in the top-right corner**
3. **Click "Invite"**
4. **Search for your integration name**
5. **Select it and click "Invite"**

### Notion Token Validation

Test your Notion token directly:

```bash
curl -H "Authorization: Bearer secret_your_token_here" \
     -H "Notion-Version: 2022-06-28" \
     "https://api.notion.com/v1/users/me"
```

Expected response should include user information. If this fails, your token is invalid.

### Token Rotation

If your integration token stops working:

1. Go to [Notion Developers](https://developers.notion.com/)
2. Find your integration
3. Click "View integration"
4. Generate a new "Internal Integration Token"
5. Update your `NOTION_TOKEN` environment variable

## Connection Problems

### Server Not Starting

**Check Environment Variables**:

```bash
# Required
echo $NOTION_TOKEN

# Optional but recommended
echo $API_KEY
echo $PORT
```

**Check Dependencies**:

```bash
deno --version
```

**Start with Debugging**:

```bash
# Enable debug output
DEBUG=* deno task dev
```

### Cannot Connect to API

**Test Basic Connectivity**:

```bash
# Test health endpoint (no auth required)
curl http://localhost:8000/health

# Test with custom port
curl http://localhost:3000/health
```

**Check Port Configuration**:

```bash
# Check if port is in use
lsof -i :8000

# Try different port
PORT=3000 deno task dev
```

**Firewall Issues**:

```bash
# Check if port is blocked
telnet localhost 8000

# For cloud deployments, check security groups/firewall rules
```

### Network Timeouts

**Increase Timeout Values**:

```bash
# For cURL requests
curl --connect-timeout 30 --max-time 60 \
     -H "Authorization: Bearer $API_KEY" \
     "http://localhost:8000/api/pages/$PAGE_ID"
```

**Check Notion API Status**:

- Visit [Notion Status Page](https://status.notion.com/)
- Test direct Notion API connectivity

## Content Conversion Issues

### Unsupported Content Types

**Symptoms**: Content appears missing or corrupted in the converted Markdown.

**Solution**: Check which Notion block types are supported:

Supported types:

- ✅ Headings (1, 2, 3)
- ✅ Paragraphs
- ✅ Bulleted lists
- ✅ Numbered lists
- ✅ Todo lists
- ✅ Code blocks
- ✅ Quotes
- ✅ Images (external URLs)
- ✅ Rich text formatting

Unsupported types (may be skipped or converted as text):

- ❌ Databases
- ❌ Embedded content
- ❌ Complex tables
- ❌ Synced blocks
- ❌ Advanced block types

### Markdown Conversion Errors

**Large Content Issues**:

```bash
# Check content size before conversion
curl -H "Authorization: Bearer $API_KEY" \
     "http://localhost:8000/api/pages/$PAGE_ID" | \
     jq '.markdown | length'
```

**Special Characters**:

- Ensure proper UTF-8 encoding
- Check for problematic characters in code blocks
- Validate JSON escaping in API calls

### Image Handling

**External Images Only**: Only external image URLs are supported. Notion-hosted images may not convert properly.

**Test Image URLs**:

```bash
# Check if image URL is accessible
curl -I "https://example.com/image.png"
```

## Performance Issues

### Slow Response Times

**Diagnostic Steps**:

1. **Test with Minimal Content**:
   ```bash
   # Time the request
   time curl -H "Authorization: Bearer $API_KEY" \
        "http://localhost:8000/api/pages/$PAGE_ID"
   ```

2. **Check Server Resources**:
   ```bash
   # Monitor CPU and memory usage
   top -p $(pgrep -f "deno.*main.ts")
   ```

3. **Network Latency**:
   ```bash
   # Test connectivity to Notion API
   ping api.notion.com
   ```

**Optimization Strategies**:

1. **Implement Caching** (for high-volume usage):
   ```typescript
   // Example: Add Redis caching layer
   const cachedPage = await redis.get(`page:${pageId}`);
   if (cachedPage) return JSON.parse(cachedPage);
   ```

2. **Batch Operations**:
   ```bash
   # Instead of multiple single requests, consider batching
   # (Implementation depends on your use case)
   ```

### Memory Issues

**Symptoms**: Server crashes or becomes unresponsive with large pages.

**Solutions**:

1. **Monitor Memory Usage**:
   ```bash
   # Check memory consumption
   ps aux | grep deno
   ```

2. **Implement Streaming** for large content:
   ```typescript
   // Example: Stream large responses
   const stream = new ReadableStream({
     start(controller) {
       // Process content in chunks
     },
   });
   ```

3. **Set Memory Limits**:
   ```bash
   # Limit Deno memory usage
   deno run --v8-flags=--max-old-space-size=512 src/main.ts
   ```

## Debugging Tools

### Enable Debug Logging

**Server-side Debugging**:

```bash
# Enable verbose logging
DEBUG=notion:* deno task dev

# Or with custom log level
LOG_LEVEL=debug deno task dev
```

**API Request Debugging**:

```bash
# Verbose cURL output
curl -v -H "Authorization: Bearer $API_KEY" \
     "http://localhost:8000/api/pages/$PAGE_ID"

# Save response to file for analysis
curl -H "Authorization: Bearer $API_KEY" \
     "http://localhost:8000/api/pages/$PAGE_ID" \
     -o response.json
```

### Health Check Script

Create a diagnostic script:

```bash
#!/bin/bash
# health-check.sh

API_BASE="http://localhost:8000"
API_KEY="${API_KEY:-your-api-key}"
PAGE_ID="${PAGE_ID:-12345678-1234-1234-1234-123456789abc}"

echo "=== Notion Markdown API Health Check ==="

# Test 1: Basic connectivity
echo "1. Testing basic connectivity..."
if curl -s "$API_BASE/health" > /dev/null; then
    echo "   ✅ Server is reachable"
else
    echo "   ❌ Server is not reachable"
    exit 1
fi

# Test 2: API info
echo "2. Testing API info..."
API_INFO=$(curl -s "$API_BASE/api")
echo "   API: $(echo "$API_INFO" | jq -r '.name // "Unknown"')"
echo "   Version: $(echo "$API_INFO" | jq -r '.version // "Unknown"')"

# Test 3: Authentication
echo "3. Testing authentication..."
if [ -z "$API_KEY" ]; then
    echo "   ⚠️  API_KEY not set"
else
    AUTH_TEST=$(curl -s -w "%{http_code}" -o /dev/null \
                -H "Authorization: Bearer $API_KEY" \
                "$API_BASE/api/pages/$PAGE_ID")
    
    if [ "$AUTH_TEST" = "200" ]; then
        echo "   ✅ Authentication successful"
    elif [ "$AUTH_TEST" = "401" ]; then
        echo "   ❌ Authentication failed (invalid API key)"
    elif [ "$AUTH_TEST" = "400" ]; then
        echo "   ⚠️  Authentication works, but page ID may be invalid"
    else
        echo "   ❌ Unexpected response: $AUTH_TEST"
    fi
fi

echo "=== Health Check Complete ==="
```

### Log Analysis

**Search for Common Issues**:

```bash
# Check server logs for errors
tail -f server.log | grep -E "(ERROR|WARN|Failed)"

# Filter authentication issues
grep -i "auth\|token\|bearer" server.log

# Find performance issues
grep -E "timeout|slow|performance" server.log
```

### API Testing Tools

**Using Postman/Insomnia**:

1. **Create Collection** with base URL `http://localhost:8000`
2. **Set Authentication** header: `Authorization: Bearer {{api_key}}`
3. **Test Endpoints**:
   - GET `/health`
   - GET `/api`
   - GET `/api/pages/{{page_id}}`
   - POST `/api/pages/{{page_id}}/append`

**Using httpie**:

```bash
# Install httpie
pip install httpie

# Test requests
http GET localhost:8000/health
http GET localhost:8000/api/pages/$PAGE_ID Authorization:"Bearer $API_KEY"
```

## Getting Help

### Before Requesting Help

1. **Check this troubleshooting guide**
2. **Review the [Getting Started Guide](./getting-started.md)**
3. **Test with the health check script above**
4. **Gather relevant information**:
   - Error messages (exact text)
   - Request/response examples
   - Server logs
   - Environment details (OS, Deno version, etc.)

### Information to Include

When reporting issues, include:

```bash
# System information
deno --version
curl --version
echo "OS: $(uname -a)"

# Environment variables (without sensitive values)
echo "NOTION_TOKEN: ${NOTION_TOKEN:+SET}"
echo "API_KEY: ${API_KEY:+SET}"
echo "PORT: ${PORT:-8000}"

# API test results
curl -s http://localhost:8000/health | jq .
```

### Debug Response Template

```json
{
  "issue_type": "authentication|connection|conversion|performance|other",
  "error_message": "exact error message here",
  "request_details": {
    "method": "GET|POST",
    "url": "full URL",
    "headers": "relevant headers (without tokens)",
    "body": "request body if applicable"
  },
  "environment": {
    "deno_version": "1.37.0",
    "os": "Linux/macOS/Windows",
    "api_version": "1.0.0"
  },
  "server_logs": "relevant log entries",
  "expected_behavior": "what you expected to happen",
  "actual_behavior": "what actually happened"
}
```

### Support Channels

- **Documentation**: Review all API guides and examples
- **GitHub Issues**: For bug reports and feature requests
- **Server Logs**: Check application logs for detailed error information
- **Notion API Status**: Check [status.notion.com](https://status.notion.com) for service issues
