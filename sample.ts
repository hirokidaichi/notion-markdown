import { NotionClient } from "./lib/notion-client.ts";
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";

// 環境変数を読み込む
await load({ export: true });

// メインの実行関数
async function main() {
  // 環境変数からトークンを取得
  const token = Deno.env.get("NOTION_TOKEN");
  if (!token) {
    console.error("NOTION_TOKEN is required");
    Deno.exit(1);
  }

  // NotionClientのインスタンスを作成
  const client = new NotionClient(token);

  try {
    // 指定されたページIDでgetPageを実行
    const result = await client.getPage("18175fb73edc8174b431d10510deb9b4");

    console.log("Title:", result.title);
    console.log("\nMarkdown Content:\n");
    console.log(result.markdown);
  } catch (error) {
    console.error("Error:", error);
  }
}

// スクリプトを実行
main();
