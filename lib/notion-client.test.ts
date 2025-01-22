import { assertEquals, assertRejects } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { NotionClient } from "./notion-client.ts";
import { MarkdownToBlocks } from "./markdown-to-blocks.ts";
import {
  CreatePageResponse,
  GetPageResponse,
  ListBlockChildrenResponse,
  UpdatePageResponse,
} from "https://deno.land/x/notion_sdk@v2.2.3/src/api-endpoints.ts";

// モックの作成
class MockNotionAPI {
  async append() {
    return { id: "test-block-id" };
  }

  async create() {
    return { id: "test-page-id" };
  }

  async retrieve() {
    return {
      properties: {
        title: {
          title: [{ plain_text: "テストページ" }],
        },
      },
    };
  }

  async list() {
    return {
      results: [
        {
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                plain_text: "これはテストです。",
                text: { content: "これはテストです。" },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
      ],
    };
  }
}

class MockClient {
  blocks = {
    children: {
      append: async () => new MockNotionAPI().append(),
      list: async () => new MockNotionAPI().list(),
    },
  };
  pages = {
    create: async () => new MockNotionAPI().create(),
    retrieve: async () => new MockNotionAPI().retrieve(),
  };
}

Deno.test("NotionClient - getPage 正常系", async () => {
  const client = new NotionClient("dummy-api-key");
  // @ts-ignore: プライベートプロパティへのアクセス
  client.client = new MockClient();

  const result = await client.getPage("test-page-id");
  assertEquals(result.title, "テストページ");
  assertEquals(result.markdown.trim(), "これはテストです。");
});

Deno.test("NotionClient - getPage 異常系", async () => {
  const client = new NotionClient("dummy-api-key");
  // @ts-ignore: プライベートプロパティへのアクセス
  // @ts-ignore: プライベートプロパティへのアクセス
  client.client = new MockClient();
  // @ts-ignore: プライベートプロパティへのアクセス
  client.client.pages.retrieve = async () => {
    throw new Error("API Error");
  };

  await assertRejects(
    async () => {
      await client.getPage("test-page-id");
    },
    Error,
    "API Error"
  );
});

Deno.test("NotionClient - appendPage 正常系", async () => {
  // APIキーは実際には使用されないのでダミー値を使用
  const client = new NotionClient("dummy-api-key");
  // @ts-ignore: プライベートプロパティへのアクセス
  client.client = new MockClient();

  const markdown = "# テスト\nこれはテストです。";
  const result = await client.appendPage("test-page-id", markdown);

  assertEquals(result, true);
});

Deno.test("NotionClient - appendPage 異常系（変換エラー）", async () => {
  const client = new NotionClient("dummy-api-key");
  // @ts-ignore: プライベートプロパティへのアクセス
  client.converter = {
    convert: () => ({
      blocks: [],
      errors: ["テストエラー"],
    }),
  };

  const result = await client.appendPage("test-page-id", "# テスト");
  assertEquals(result, false);
});

Deno.test("NotionClient - createPage 正常系（parentIdあり）", async () => {
  const client = new NotionClient("dummy-api-key");
  // @ts-ignore: プライベートプロパティへのアクセス
  client.client = new MockClient();

  const result = await client.createPage(
    "テストページ",
    "# テスト\nこれはテストです。",
    "parent-page-id"
  );

  assertEquals(result.success, true);
  assertEquals(result.pageId, "test-page-id");
});

Deno.test("NotionClient - createPage 正常系（databaseId使用）", async () => {
  // 環境変数の設定
  Deno.env.set("NOTION_DATABASE_ID", "test-database-id");

  const client = new NotionClient("dummy-api-key");
  // @ts-ignore: プライベートプロパティへのアクセス
  client.client = new MockClient();

  const result = await client.createPage(
    "テストページ",
    "# テスト\nこれはテストです。"
  );

  assertEquals(result.success, true);
  assertEquals(result.pageId, "test-page-id");

  // 環境変数のクリーンアップ
  Deno.env.delete("NOTION_DATABASE_ID");
});

Deno.test("NotionClient - createPage 異常系（環境変数なし）", async () => {
  const client = new NotionClient("dummy-api-key");
  // @ts-ignore: プライベートプロパティへのアクセス
  client.client = new MockClient();

  const result = await client.createPage(
    "テストページ",
    "# テスト\nこれはテストです。"
  );

  assertEquals(result.success, false);
  assertEquals(result.pageId, "");
});

Deno.test("NotionClient - convertToNotionBlocks", () => {
  const client = new NotionClient("dummy-api-key");
  const converter = new MarkdownToBlocks();
  const markdown = "```typescript\nconst x = 1;\n```";
  const { blocks } = converter.convert(markdown);

  // @ts-ignore: プライベートメソッドへのアクセス
  const notionBlocks = client.convertToNotionBlocks(blocks);

  assertEquals(notionBlocks.length, 1);
  assertEquals(notionBlocks[0].type, "code");
  assertEquals((notionBlocks[0] as any).code.language, "typescript");
});