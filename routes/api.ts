import { Hono } from "https://deno.land/x/hono@v3.11.7/mod.ts";
import { 
  GetPageRequest, 
  GetPageResponse, 
  AppendPageRequest, 
  AppendPageResponse,
  CreatePageRequest,
  CreatePageResponse
} from "../types.ts";

const api = new Hono();

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
  const response: AppendPageResponse = {
    success: true  // 実装時に適切な値を設定
  };
  return c.json(response);
});

// POST /api/pages
api.post("/pages", async (c) => {
  const body: CreatePageRequest = await c.req.json();
  const response: CreatePageResponse = {
    pageId: "dummy-page-id",  // 実装時に適切な値を設定
    success: true            // 実装時に適切な値を設定
  };
  return c.json(response);
});

export default api;