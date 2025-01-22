import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { NotionClient } from "./notion-client.ts";
import { MarkdownToBlocks } from "./markdown-to-blocks.ts";

// モックの作成
class MockNotionAPI {
  async append() {
    return await Promise.resolve({ id: "test-block-id" });
  }

  async retrieve() {
    return await Promise.resolve({
      properties: {
        title: {
          type: "title",
          title: [{
            type: "text",
            text: { content: "テストページ" },
            plain_text: "テストページ",
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
            },
          }],
        },
      },
    });
  }

  async list() {
    return await Promise.resolve({
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
    });
  }
}

class MockClient {
  blocks = {
    children: {
      append: async () => await new MockNotionAPI().append(),
      list: async () => await new MockNotionAPI().list(),
    },
  };
  pages = {
    retrieve: async () => await new MockNotionAPI().retrieve(),
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
    "API Error",
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
