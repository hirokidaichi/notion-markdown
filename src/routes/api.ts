import { Hono } from "hono";
import {
  AppendPageRequest,
  AppendPageResponse,
  GetPageResponse,
} from "../types.ts";
import { NotionClient } from "../lib/notion-client.ts";
import { validateAndNormalizeNotionId } from "../lib/uuid-utils.ts";

const api = new Hono();

// NotionClientのインスタンスを作成
const notionClient = new NotionClient(Deno.env.get("NOTION_TOKEN") || "");

// UUIDバリデーションミドルウェア
// deno-lint-ignore no-explicit-any
const validateUUID = async (c: any, next: any) => {
  const pageId = c.req.param("pageId");
  const validation = validateAndNormalizeNotionId(pageId);

  if (!validation.isValid) {
    return c.json(
      { error: validation.error || "Invalid page ID format" },
      400,
    );
  }

  // 正規化されたIDをcontextに保存
  c.set("normalizedPageId", validation.normalizedId);
  await next();
};

// 認証ミドルウェア
// deno-lint-ignore no-explicit-any
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

// ヘルスチェックエンドポイント
api.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// ルートパス
api.get("/", (c) => {
  return c.json({
    name: "notion-markdown-api",
    version: "1.0.0",
    description: "Notion pages to Markdown converter API",
  });
});

// /pages 以下のルートに認証を適用
api.use("/pages/*", auth);

// GET /api/pages/:pageId

api.get("/pages/:pageId", validateUUID, async (c) => {
  try {
    const pageId = c.get("normalizedPageId") as string;
    const result = await notionClient.getPage(pageId);
    const response: GetPageResponse = {
      markdown: result.markdown,
      title: result.title,
    };
    return c.json(response);
  } catch (error) {
    console.error("Error getting page:", error);
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error occurred";
    return c.json({
      error: "Failed to get page",
      details: errorMessage,
    }, 500);
  }
});

// POST /api/pages/:pageId/append
api.post("/pages/:pageId/append", validateUUID, async (c) => {
  try {
    const pageId = c.get("normalizedPageId") as string;
    const body: AppendPageRequest = await c.req.json();
    await notionClient.appendPage(pageId, body.markdown);
    const response: AppendPageResponse = {
      success: true,
    };
    return c.json(response);
  } catch (error) {
    console.error("Error appending to page:", error);
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error occurred";
    return c.json({
      error: "Failed to append to page",
      details: errorMessage,
    }, 500);
  }
});

export default api;
