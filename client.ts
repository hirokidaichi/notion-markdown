#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read

import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";
import { NotionClient } from "./lib/notion-client.ts";

// .envファイルを読み込む
await load({ export: true });

async function testNotionAPI() {
  const token = Deno.env.get("NOTION_TOKEN");
  if (!token) {
    console.error("Error: NOTION_TOKEN environment variable is required");
    Deno.exit(1);
  }

  const notionClient = new NotionClient(token);

  // テスト用のページID
  const pageId = "18275fb73edc8180a830c65ce7f71d15";

  console.log("=== Notion API Test ===\n");

  try {
    // 1. ページ取得のテスト
    console.log("1. Testing getPage...");
    const getResult = await notionClient.getPage(pageId);
    console.log("✓ Successfully retrieved page");
    console.log(`Title: ${getResult.title}`);
    console.log(`Content length: ${getResult.markdown.length} characters\n`);

    // 2. ページ追記のテスト
    console.log("2. Testing appendPage...");
    const testContent = `
# Test Content
This is a test content added at ${new Date().toISOString()}

## Features
- Automatic test
- API verification
- Real-time feedback
`;

    const appendResult = await notionClient.appendPage(pageId, testContent);
    if (appendResult) {
      console.log("✓ Successfully appended content to page\n");
    } else {
      throw new Error("Failed to append content");
    }

    console.log("All tests completed successfully! 🎉");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error during API test:", error.message);
    } else {
      console.error("An unknown error occurred during API test");
    }
    Deno.exit(1);
  }
}

if (import.meta.main) {
  testNotionAPI();
}
