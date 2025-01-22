import { Hono } from "hono";
import { 
  GetPageRequest, 
  GetPageResponse, 
  AppendPageRequest, 
  AppendPageResponse,
} from "../types.ts";
import { NotionClient } from "../lib/notion-client.ts";

const api = new Hono();

// NotionClientのインスタンスを作成
const notionClient = new NotionClient(Deno.env.get("NOTION_TOKEN") || "");

// 認証ミドルウェア
const auth = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization");
  const apiKey = Deno.env.get("API_KEY");

  if (!apiKey) {
    return c.json({ error: "API key is not configured" }, 500);
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Authorization header is missing or invalid" }, 401);
  }

  const token = authHeader.split(" ")[1];
  if (token !== apiKey) {
    return c.json({ error: "Invalid API key" }, 401);
  }

  await next();
};

// すべてのルートに認証を適用
api.use("/*", auth);

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

export default api;