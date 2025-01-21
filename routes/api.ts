import { Hono } from "hono";
import { 
  GetPageRequest, 
  GetPageResponse, 
  AppendPageRequest, 
  AppendPageResponse,
  CreatePageRequest,
  CreatePageResponse
} from "../types.ts";
import { NotionClient } from "../lib/notion-client.ts";

const api = new Hono();

// NotionClientのインスタンスを作成
const notionClient = new NotionClient(Deno.env.get("NOTION_TOKEN") || "");

// GET /api/pages/:pageId
api.get("/pages/:pageId", async (c) => {
  const pageId = c.req.param("pageId");
  const response: GetPageResponse = {
    markdown: "",  // 実装時に適切な値を設定
    title: ""      // 実装時に適切な値を設定
  };
  return c.json(response);
});

// POST /api/pages/:pageId/append
api.post("/pages/:pageId/append", async (c) => {
  const pageId = c.req.param("pageId");
  const body: AppendPageRequest = await c.req.json();
  
  const success = await notionClient.appendPage(pageId, body.markdown);
  const response: AppendPageResponse = {
    success
  };
  
  return c.json(response);
});

// POST /api/pages
api.post("/pages", async (c) => {
  const body: CreatePageRequest = await c.req.json();
  
  const result = await notionClient.createPage(
    body.title,
    body.markdown,
    body.parentId
  );
  
  const response: CreatePageResponse = {
    pageId: result.pageId,
    success: result.success
  };
  
  return c.json(response);
});

export default api;