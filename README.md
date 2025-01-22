# notion-markdown

NotionのドキュメントをMarkdown形式で取得・更新するためのAPIサーバー

## 環境変数の設定

以下の環境変数を設定する必要があります：

```bash
# NotionのAPIキー
NOTION_API_KEY=your_notion_api_key

# NotionのデータベースID（親ページを指定しない場合に使用）
NOTION_DATABASE_ID=your_notion_database_id
```

### Notion APIキーの取得方法

1. [Notion Developers](https://www.notion.so/my-integrations)にアクセス
2. 「New integration」をクリック
3. インテグレーション名を入力し、「Submit」をクリック
4. 表示された「Internal Integration Token」をコピーし、`NOTION_API_KEY`として設定

### データベースIDの取得方法

1. Notionで対象のデータベースを開く
2. URLからデータベースIDをコピー
   - 例: `https://www.notion.so/workspace/[database-id]?v=...`
   - `[database-id]`の部分が必要なID
3. コピーしたIDを`NOTION_DATABASE_ID`として設定

## API エンドポイント

### GET /api/pages/:pageId
指定されたIDのNotionドキュメントをMarkdown形式で取得します。

### POST /api/pages/:pageId/append
既存のNotionページにMarkdownコンテンツを追加します。

リクエスト例：
```json
{
  "markdown": "# 新しいセクション\n\nここに追加したいコンテンツを記述"
}
```

### POST /api/pages
新しいNotionページをMarkdownコンテンツから作成します。

リクエスト例：
```json
{
  "title": "新しいページ",
  "markdown": "# はじめに\n\nここにページの内容を記述",
  "parentId": "optional-parent-page-id"
}
```

## 開発

```bash
# 開発サーバーの起動
deno task dev

# 本番サーバーの起動
deno task start
```

## 注意点
- .envに環境変数があるが、それはセキュリティの理由でリポジトリには公開しないのでファイル中にその中身が含まれるようには**絶対に**してはならない。

### Deno Deployでの環境変数の設定

1. [Deno Deploy](https://dash.deno.com)のプロジェクト設定画面を開く
2. 「Settings」タブを選択
3. 「Environment Variables」セクションで必要な環境変数を設定
   - `NOTION_API_KEY`
   - `NOTION_DATABASE_ID`
