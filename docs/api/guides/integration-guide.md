# Integration Guide

This guide covers advanced integration patterns, best practices, and real-world usage scenarios for the Notion Markdown API.

## Table of Contents

- [Architecture Patterns](#architecture-patterns)
- [Integration Scenarios](#integration-scenarios)
- [Security Considerations](#security-considerations)
- [Performance Optimization](#performance-optimization)
- [Monitoring and Logging](#monitoring-and-logging)
- [Deployment Strategies](#deployment-strategies)

## Architecture Patterns

### 1. Direct Integration

Simple direct calls to the API for basic use cases.

```typescript
// Direct integration example
class SimpleNotionIntegration {
  constructor(private apiKey: string, private baseUrl: string) {}
  
  async syncPageToLocalFile(pageId: string, filePath: string) {
    const response = await fetch(`${this.baseUrl}/api/pages/${pageId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    
    const { markdown } = await response.json();
    await fs.writeFile(filePath, markdown);
  }
}
```

**Use cases:**
- Simple content synchronization
- One-off data migration
- Development and testing

### 2. Service Layer Pattern

Abstracted service layer for complex applications.

```typescript
interface ContentService {
  getPage(pageId: string): Promise<PageContent>;
  updatePage(pageId: string, content: string): Promise<void>;
  syncPages(pageIds: string[]): Promise<SyncResult[]>;
}

class NotionContentService implements ContentService {
  private client: NotionMarkdownClient;
  private cache: ContentCache;
  private logger: Logger;
  
  constructor(config: ServiceConfig) {
    this.client = new NotionMarkdownClient(config.apiConfig);
    this.cache = new ContentCache(config.cacheConfig);
    this.logger = config.logger;
  }
  
  async getPage(pageId: string): Promise<PageContent> {
    const cacheKey = `page:${pageId}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached && !this.isStale(cached)) {
      return cached;
    }
    
    try {
      const page = await this.client.getPage(pageId);
      const content = new PageContent(page);
      
      await this.cache.set(cacheKey, content, { ttl: 300 }); // 5 minutes
      return content;
      
    } catch (error) {
      this.logger.error('Failed to fetch page', { pageId, error });
      throw error;
    }
  }
}
```

**Use cases:**
- Production applications
- Multi-service architectures
- Applications requiring caching and error handling

### 3. Event-Driven Integration

Using events and queues for asynchronous processing.

```typescript
class EventDrivenNotionSync {
  private eventBus: EventBus;
  private notionService: NotionContentService;
  private queue: MessageQueue;
  
  constructor(dependencies: Dependencies) {
    this.eventBus = dependencies.eventBus;
    this.notionService = dependencies.notionService;
    this.queue = dependencies.queue;
    
    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    this.eventBus.on('content.updated', async (event: ContentUpdatedEvent) => {
      await this.queue.enqueue('sync-to-notion', {
        pageId: event.pageId,
        content: event.content,
        retryCount: 0
      });
    });
    
    this.queue.process('sync-to-notion', async (job) => {
      const { pageId, content } = job.data;
      await this.notionService.updatePage(pageId, content);
    });
  }
}
```

**Use cases:**
- High-volume applications
- Microservices architectures
- Applications requiring reliability and fault tolerance

## Integration Scenarios

### 1. Documentation Synchronization

Automatically sync documentation between Notion and your codebase.

```typescript
class DocumentationSync {
  async syncDocs() {
    const configFile = await this.loadConfig('./docs-config.json');
    
    for (const docMapping of configFile.mappings) {
      try {
        // Get latest content from Notion
        const page = await this.notionService.getPage(docMapping.notionPageId);
        
        // Transform content if needed
        const processedContent = this.processContent(page.markdown, docMapping.transforms);
        
        // Update local file
        await fs.writeFile(docMapping.localPath, processedContent);
        
        // Commit changes
        await this.gitService.commitAndPush(`Update ${docMapping.name} documentation`);
        
        this.logger.info(`Synced documentation: ${docMapping.name}`);
        
      } catch (error) {
        this.logger.error(`Failed to sync ${docMapping.name}:`, error);
      }
    }
  }
  
  private processContent(markdown: string, transforms: Transform[]): string {
    let content = markdown;
    
    for (const transform of transforms) {
      switch (transform.type) {
        case 'remove-comments':
          content = content.replace(/<!--[\s\S]*?-->/g, '');
          break;
        case 'add-frontmatter':
          content = `---\n${transform.frontmatter}\n---\n\n${content}`;
          break;
        case 'replace-links':
          content = this.replaceNotionLinks(content, transform.linkMap);
          break;
      }
    }
    
    return content;
  }
}
```

### 2. Content Publishing Pipeline

Automated content publishing from Notion to multiple platforms.

```typescript
class ContentPublisher {
  private platforms: PublishingPlatform[];
  
  async publishContent(pageId: string) {
    const page = await this.notionService.getPage(pageId);
    const metadata = this.extractMetadata(page.markdown);
    
    const publishTasks = this.platforms.map(platform => 
      this.publishToPlatform(platform, page, metadata)
    );
    
    const results = await Promise.allSettled(publishTasks);
    
    // Log results and handle failures
    results.forEach((result, index) => {
      const platform = this.platforms[index];
      if (result.status === 'fulfilled') {
        this.logger.info(`Published to ${platform.name}: ${result.value.url}`);
      } else {
        this.logger.error(`Failed to publish to ${platform.name}:`, result.reason);
      }
    });
  }
  
  private async publishToPlatform(
    platform: PublishingPlatform, 
    page: PageContent, 
    metadata: ContentMetadata
  ) {
    const transformedContent = platform.transformContent(page.markdown);
    return platform.publish(transformedContent, metadata);
  }
}
```

### 3. Knowledge Base Integration

Integrate Notion as a knowledge base backend.

```typescript
class KnowledgeBaseAPI {
  async searchContent(query: string): Promise<SearchResult[]> {
    // Get all knowledge base pages
    const pageIds = await this.getKnowledgeBasePageIds();
    
    // Fetch content for all pages (with caching)
    const pages = await Promise.all(
      pageIds.map(id => this.notionService.getPage(id))
    );
    
    // Perform search
    const results = this.searchEngine.search(query, pages);
    
    return results.map(result => ({
      pageId: result.pageId,
      title: result.title,
      excerpt: this.generateExcerpt(result.content, query),
      relevanceScore: result.score,
      url: this.generatePageUrl(result.pageId)
    }));
  }
  
  async getArticle(pageId: string): Promise<Article> {
    const page = await this.notionService.getPage(pageId);
    
    return {
      id: pageId,
      title: page.title,
      content: this.renderMarkdown(page.markdown),
      lastModified: await this.getLastModified(pageId),
      tags: this.extractTags(page.markdown),
      relatedArticles: await this.findRelatedArticles(pageId)
    };
  }
}
```

## Security Considerations

### 1. API Key Management

```typescript
class SecureApiKeyManager {
  private keyRotationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days
  
  constructor(private secretsManager: SecretsManager) {}
  
  async getCurrentApiKey(): Promise<string> {
    const keyData = await this.secretsManager.getSecret('notion-api-key');
    
    if (this.shouldRotateKey(keyData.createdAt)) {
      await this.rotateApiKey();
      return this.getCurrentApiKey();
    }
    
    return keyData.value;
  }
  
  private async rotateApiKey(): Promise<void> {
    const newKey = await this.generateNewApiKey();
    
    // Update in secrets manager
    await this.secretsManager.updateSecret('notion-api-key', newKey);
    
    // Update in all services
    await this.updateServicesWithNewKey(newKey);
    
    // Revoke old key after grace period
    setTimeout(() => this.revokeOldKey(), 60000); // 1 minute grace period
  }
}
```

### 2. Input Validation and Sanitization

```typescript
class SecureNotionService {
  async appendToPage(pageId: string, markdown: string): Promise<void> {
    // Validate page ID format
    if (!this.isValidUUID(pageId)) {
      throw new ValidationError('Invalid page ID format');
    }
    
    // Sanitize markdown content
    const sanitizedMarkdown = this.sanitizeMarkdown(markdown);
    
    // Check content length limits
    if (sanitizedMarkdown.length > this.maxContentLength) {
      throw new ValidationError('Content exceeds maximum length');
    }
    
    // Rate limiting
    await this.rateLimiter.checkLimit(pageId);
    
    return this.notionClient.appendToPage(pageId, sanitizedMarkdown);
  }
  
  private sanitizeMarkdown(markdown: string): string {
    // Remove potentially dangerous content
    return markdown
      .replace(/<script[\s\S]*?<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/data:(?!image\/)/gi, '') // Only allow image data URLs
      .trim();
  }
}
```

### 3. Access Control

```typescript
class AccessControlledNotionService {
  async getPage(pageId: string, userId: string): Promise<PageContent> {
    // Check user permissions
    const hasAccess = await this.permissionService.checkPageAccess(userId, pageId);
    
    if (!hasAccess) {
      throw new ForbiddenError('User does not have access to this page');
    }
    
    // Log access for audit
    await this.auditLogger.logPageAccess(userId, pageId);
    
    return this.notionService.getPage(pageId);
  }
}
```

## Performance Optimization

### 1. Caching Strategy

```typescript
class PerformantNotionService {
  private cache = new LRUCache<string, CacheEntry>({ max: 1000 });
  
  async getPage(pageId: string, options: GetPageOptions = {}): Promise<PageContent> {
    const cacheKey = `page:${pageId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && !options.bypassCache && !this.isStale(cached)) {
      this.metrics.incrementCacheHit();
      return cached.data;
    }
    
    this.metrics.incrementCacheMiss();
    
    const page = await this.fetchPageWithBackoff(pageId);
    
    this.cache.set(cacheKey, {
      data: page,
      timestamp: Date.now(),
      etag: this.generateETag(page)
    });
    
    return page;
  }
  
  private async fetchPageWithBackoff(pageId: string): Promise<PageContent> {
    const backoff = new ExponentialBackoff({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    });
    
    return backoff.execute(() => this.notionClient.getPage(pageId));
  }
}
```

### 2. Batch Operations

```typescript
class BatchNotionOperations {
  async batchGetPages(pageIds: string[]): Promise<Map<string, PageContent>> {
    const chunks = this.chunkArray(pageIds, 10); // Process in chunks of 10
    const results = new Map<string, PageContent>();
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (pageId) => {
        try {
          const page = await this.notionService.getPage(pageId);
          return { pageId, page, error: null };
        } catch (error) {
          return { pageId, page: null, error };
        }
      });
      
      const chunkResults = await Promise.all(promises);
      
      chunkResults.forEach(({ pageId, page, error }) => {
        if (page) {
          results.set(pageId, page);
        } else {
          this.logger.error(`Failed to fetch page ${pageId}:`, error);
        }
      });
      
      // Rate limiting between chunks
      await this.delay(500);
    }
    
    return results;
  }
}
```

### 3. Connection Pooling

```typescript
class OptimizedNotionClient {
  private httpAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 10,
    maxFreeSockets: 5,
    timeout: 30000,
    freeSocketTimeout: 15000
  });
  
  constructor(config: NotionMarkdownConfig) {
    this.client = new NotionMarkdownClient({
      ...config,
      httpAgent: this.httpAgent
    });
  }
}
```

## Monitoring and Logging

### 1. Comprehensive Monitoring

```typescript
class MonitoredNotionService {
  private metrics: MetricsCollector;
  private logger: StructuredLogger;
  
  async getPage(pageId: string): Promise<PageContent> {
    const startTime = Date.now();
    const operation = 'getPage';
    
    try {
      this.metrics.incrementCounter('notion.api.requests', { operation });
      
      const page = await this.notionClient.getPage(pageId);
      
      const duration = Date.now() - startTime;
      this.metrics.recordDuration('notion.api.duration', duration, { operation });
      this.metrics.incrementCounter('notion.api.success', { operation });
      
      this.logger.info('Page retrieved successfully', {
        pageId,
        duration,
        contentLength: page.markdown.length
      });
      
      return page;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.incrementCounter('notion.api.errors', { 
        operation, 
        errorType: error.constructor.name 
      });
      
      this.logger.error('Failed to retrieve page', {
        pageId,
        duration,
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }
}
```

### 2. Health Checks

```typescript
class NotionServiceHealthCheck {
  async checkHealth(): Promise<HealthStatus> {
    const checks = [
      this.checkApiConnectivity(),
      this.checkAuthenticationStatus(),
      this.checkCacheHealth(),
      this.checkDatabaseConnection()
    ];
    
    const results = await Promise.allSettled(checks);
    
    const status: HealthStatus = {
      healthy: results.every(r => r.status === 'fulfilled'),
      timestamp: new Date().toISOString(),
      checks: {
        api: results[0].status === 'fulfilled',
        auth: results[1].status === 'fulfilled',
        cache: results[2].status === 'fulfilled',
        database: results[3].status === 'fulfilled'
      }
    };
    
    if (!status.healthy) {
      this.logger.warn('Health check failed', { status });
    }
    
    return status;
  }
}
```

## Deployment Strategies

### 1. Container Deployment

```dockerfile
FROM denoland/deno:1.37.0

WORKDIR /app

# Copy dependency files
COPY deno.json deno.lock ./

# Cache dependencies
RUN deno cache src/main.ts

# Copy source code
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["task", "start"]
```

### 2. Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notion-markdown-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: notion-markdown-api
  template:
    metadata:
      labels:
        app: notion-markdown-api
    spec:
      containers:
      - name: api
        image: notion-markdown-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: NOTION_TOKEN
          valueFrom:
            secretKeyRef:
              name: notion-secrets
              key: token
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: notion-secrets
              key: api-key
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 15
          periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: notion-markdown-api-service
spec:
  selector:
    app: notion-markdown-api
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

### 3. Auto-scaling Configuration

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: notion-markdown-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: notion-markdown-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Best Practices Summary

1. **Security First**: Always validate inputs, use secure secret management, and implement proper access controls
2. **Performance**: Implement caching, use connection pooling, and batch operations when possible
3. **Reliability**: Use retry logic with exponential backoff, implement circuit breakers, and have comprehensive error handling
4. **Monitoring**: Track metrics, implement structured logging, and set up health checks
5. **Scalability**: Design for horizontal scaling, use async processing for heavy operations, and implement rate limiting
6. **Maintainability**: Use typed interfaces, implement comprehensive testing, and maintain clear documentation