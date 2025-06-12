import { NotionClient } from "../src/lib/notion-client.ts";
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";

// 環境変数を読み込む
await load({ export: true });

// サンプルのマークダウン
const exampleMarkdown = `
## 実装メモ

### 実装の要点
- NotionClientクラスの実装
  - getPageメソッド：ページ情報とブロックの取得
  - BlockToMarkdownクラスを使用した変換
  - エラーハンドリング

### 技術的な工夫
1. プロパティの汎用的な取得
   - rich_text/titleタイプに基づく検出
   - 特定のプロパティ名に依存しない設計

2. マークダウン変換の正確性
   - 各ブロックタイプの適切な変換
   - 構造の保持

### 今後の課題
- より多くのブロックタイプのサポート
- 双方向の変換機能の実装
- エラーハンドリングの強化

---
*このメモは自動的に追加されました*
`;

// メインの実行関数
async function main() {
  const token = Deno.env.get("NOTION_TOKEN");
  if (!token) {
    console.error("NOTION_TOKEN is required");
    Deno.exit(1);
  }

  const client = new NotionClient(token);
  const pageId = "18175fb73edc8174b431d10510deb9b4";

  try {
    console.log("Adding example markdown to the page...");
    const success = await client.appendPage(pageId, exampleMarkdown);

    if (success) {
      console.log("Successfully added example markdown!");

      // 更新されたページの内容を確認
      console.log("\nUpdated page content:");
      const result = await client.getPage(pageId);
      console.log(result.markdown);
    } else {
      console.error("Failed to add example markdown");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// スクリプトを実行
main();
