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

### デプロイ手順

1. [Deno Deploy](https://dash.deno.com)にアクセスし、新しいプロジェクトを作成
2. プロジェクト名を`notion-markdown`に設定
3. GitHubリポジトリと連携を設定
   - GitHubリポジトリを選択
   - "Automatic"デプロイを選択
   - ブランチを`main`に設定
4. GitHub Actionsによって自動的にデプロイされます

デプロイ後は以下のURLでアクセス可能です：
```
https://notion-markdown.deno.dev
