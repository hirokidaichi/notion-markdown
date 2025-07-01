/**
 * TypeScript Examples for Notion Markdown API
 *
 * This file demonstrates how to interact with the Notion Markdown API using TypeScript.
 * You can use this with Node.js, Deno, or in browser environments.
 */

// Type definitions matching the API responses
interface GetPageResponse {
  markdown: string;
  title: string;
}

interface AppendPageRequest {
  markdown: string;
}

interface AppendPageResponse {
  success: boolean;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

interface ApiInfo {
  name: string;
  version: string;
  description: string;
}

/**
 * Configuration for the Notion Markdown API client
 */
interface NotionMarkdownConfig {
  baseUrl: string;
  apiKey: string;
}

/**
 * Custom error class for API errors
 */
class NotionMarkdownApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string,
  ) {
    super(message);
    this.name = "NotionMarkdownApiError";
  }
}

/**
 * Main client class for interacting with the Notion Markdown API
 */
class NotionMarkdownClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: NotionMarkdownConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.apiKey = config.apiKey;
  }

  /**
   * Make an authenticated HTTP request
   */
  private async makeRequest<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add authentication for /api/pages/* endpoints
    if (path.startsWith("/api/pages/")) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ErrorResponse;
      throw new NotionMarkdownApiError(
        errorData.error,
        response.status,
        errorData.details,
      );
    }

    return data as T;
  }

  /**
   * Check if the API server is healthy
   */
  async healthCheck(): Promise<{ status: string }> {
    return this.makeRequest<{ status: string }>("/health");
  }

  /**
   * Get API information
   */
  async getApiInfo(): Promise<ApiInfo> {
    return this.makeRequest<ApiInfo>("/api");
  }

  /**
   * Retrieve a Notion page as Markdown
   */
  async getPage(pageId: string): Promise<GetPageResponse> {
    this.validatePageId(pageId);
    return this.makeRequest<GetPageResponse>(`/api/pages/${pageId}`);
  }

  /**
   * Append Markdown content to an existing Notion page
   */
  async appendToPage(
    pageId: string,
    markdown: string,
  ): Promise<AppendPageResponse> {
    this.validatePageId(pageId);

    const body: AppendPageRequest = { markdown };

    return this.makeRequest<AppendPageResponse>(
      `/api/pages/${pageId}/append`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
  }

  /**
   * Validate that a page ID is in the correct UUID format
   */
  private validatePageId(pageId: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(pageId)) {
      throw new Error("Invalid page ID format. Expected UUID format.");
    }
  }
}

// Example usage functions

/**
 * Basic usage example
 */
async function basicExample() {
  const client = new NotionMarkdownClient({
    baseUrl: "http://localhost:8000",
    apiKey: "your-api-key-here",
  });

  try {
    // Check API health
    const health = await client.healthCheck();
    console.log("API Health:", health);

    // Get API info
    const apiInfo = await client.getApiInfo();
    console.log("API Info:", apiInfo);

    // Get a page
    const pageId = "12345678-1234-1234-1234-123456789abc";
    const page = await client.getPage(pageId);
    console.log("Page Title:", page.title);
    console.log("Page Content Length:", page.markdown.length);

    // Append content to the page
    const newContent = `
## Daily Update - ${new Date().toISOString().split("T")[0]}

### Progress
- Completed API integration
- Updated documentation
- Fixed TypeScript types

### Next Steps
- Deploy to production
- Monitor performance
`;

    const appendResult = await client.appendToPage(pageId, newContent);
    console.log("Append Success:", appendResult.success);
  } catch (error) {
    if (error instanceof NotionMarkdownApiError) {
      console.error(`API Error (${error.status}):`, error.message);
      if (error.details) {
        console.error("Details:", error.details);
      }
    } else {
      console.error("Unexpected error:", error);
    }
  }
}

/**
 * Advanced usage with error handling and retry logic
 */
class AdvancedNotionMarkdownClient extends NotionMarkdownClient {
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: NotionMarkdownConfig, maxRetries = 3, retryDelay = 1000) {
    super(config);
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  /**
   * Retry wrapper for API calls
   */
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof NotionMarkdownApiError && error.status < 500) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          console.warn(
            `Attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
          this.retryDelay *= 2; // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  /**
   * Get page with retry logic
   */
  async getPageWithRetry(pageId: string): Promise<GetPageResponse> {
    return this.withRetry(() => super.getPage(pageId));
  }

  /**
   * Append to page with retry logic
   */
  async appendToPageWithRetry(
    pageId: string,
    markdown: string,
  ): Promise<AppendPageResponse> {
    return this.withRetry(() => super.appendToPage(pageId, markdown));
  }
}

/**
 * Utility functions for common operations
 */
class NotionMarkdownUtils {
  static formatDailyReport(tasks: string[], notes: string): string {
    const date = new Date().toLocaleDateString();

    return `
## Daily Report - ${date}

### Completed Tasks
${tasks.map((task) => `- [x] ${task}`).join("\n")}

### Notes
${notes}

### Generated at
${new Date().toISOString()}
`;
  }

  static formatCodeSnippet(
    code: string,
    language: string = "typescript",
  ): string {
    return `\`\`\`${language}\n${code}\n\`\`\``;
  }

  static formatTable(headers: string[], rows: string[][]): string {
    const headerRow = `| ${headers.join(" | ")} |`;
    const separatorRow = `| ${headers.map(() => "---").join(" | ")} |`;
    const dataRows = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");

    return `${headerRow}\n${separatorRow}\n${dataRows}`;
  }
}

/**
 * Example of batch operations
 */
async function batchOperationsExample() {
  const client = new AdvancedNotionMarkdownClient({
    baseUrl: "http://localhost:8000",
    apiKey: process.env.API_KEY || "your-api-key-here",
  });

  const pageIds = [
    "12345678-1234-1234-1234-123456789abc",
    "87654321-4321-4321-4321-cba987654321",
  ];

  // Batch append operations
  const appendPromises = pageIds.map(async (pageId, index) => {
    const content = NotionMarkdownUtils.formatDailyReport(
      [`Task ${index + 1} completed`, `Review ${index + 1} done`],
      `This is batch update #${index + 1}`,
    );

    try {
      const result = await client.appendToPageWithRetry(pageId, content);
      console.log(`✓ Updated page ${pageId}:`, result.success);
      return { pageId, success: true };
    } catch (error) {
      console.error(`✗ Failed to update page ${pageId}:`, error);
      return { pageId, success: false, error };
    }
  });

  const results = await Promise.all(appendPromises);

  const successCount = results.filter((r) => r.success).length;
  console.log(
    `Batch operation completed: ${successCount}/${results.length} successful`,
  );
}

/**
 * Example with environment configuration
 */
function createClientFromEnv(): NotionMarkdownClient {
  const baseUrl = process.env.NOTION_MARKDOWN_API_URL ||
    "http://localhost:8000";
  const apiKey = process.env.NOTION_MARKDOWN_API_KEY;

  if (!apiKey) {
    throw new Error("NOTION_MARKDOWN_API_KEY environment variable is required");
  }

  return new NotionMarkdownClient({ baseUrl, apiKey });
}

/**
 * Example of using the client with async/await and proper error handling
 */
async function robustExample() {
  try {
    const client = createClientFromEnv();

    // Validate connection
    await client.healthCheck();
    console.log("✓ Connected to API");

    const pageId = process.env.NOTION_PAGE_ID;
    if (!pageId) {
      throw new Error("NOTION_PAGE_ID environment variable is required");
    }

    // Get current page content
    const currentPage = await client.getPage(pageId);
    console.log(
      `Current page: "${currentPage.title}" (${currentPage.markdown.length} chars)`,
    );

    // Generate update content
    const updateContent = `
---
**Update Log Entry**
- Timestamp: ${new Date().toISOString()}
- Content Length: ${currentPage.markdown.length} characters
- Update Source: TypeScript API Client

${
      NotionMarkdownUtils.formatCodeSnippet(
        `
// Example of the TypeScript client usage
const client = new NotionMarkdownClient(config);
const page = await client.getPage('${pageId}');
console.log('Page title:', page.title);
`,
        "typescript",
      )
    }
`;

    // Append the update
    const result = await client.appendToPage(pageId, updateContent);
    console.log("✓ Update appended successfully:", result.success);
  } catch (error) {
    if (error instanceof NotionMarkdownApiError) {
      console.error(`API Error (${error.status}): ${error.message}`);
      if (error.details) {
        console.error(`Details: ${error.details}`);
      }
    } else {
      console.error("Configuration or network error:", error);
    }
    process.exit(1);
  }
}

// Export everything for use in other modules
export {
  AdvancedNotionMarkdownClient,
  createClientFromEnv,
  NotionMarkdownApiError,
  NotionMarkdownClient,
  NotionMarkdownUtils,
};

export type {
  ApiInfo,
  AppendPageRequest,
  AppendPageResponse,
  ErrorResponse,
  GetPageResponse,
  NotionMarkdownConfig,
};

// Example execution (uncomment to run)
// basicExample();
// batchOperationsExample();
// robustExample();
