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
  try {
    const result = await notionClient.getPage(pageId);
    const response: GetPageResponse = {
      markdown: result.markdown,
      title: result.title
    };
    return c.json(response);
  } catch (error) {
    console.error("Error getting page:", error);
    return c.json({ error: "Failed to get page" }, 500);
  }
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