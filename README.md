# notion-markdown

NotionのドキュメントをMarkdown形式で取得・更新するためのAPIサーバー

## API エンドポイント

### GET /api/pages/:pageId
指定されたIDのNotionドキュメントをMarkdown形式で取得します。

### POST /api/pages/:pageId/append
既存のNotionページにMarkdownコンテンツを追加します。

### POST /api/pages
新しいNotionページをMarkdownコンテンツから作成します。

## 開発

```bash
# 開発サーバーの起動
deno task dev

# 本番サーバーの起動
deno task start
```

## デプロイ

このプロジェクトはDeno Deployを使用してデプロイされます。
