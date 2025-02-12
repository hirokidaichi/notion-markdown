# API仕様書

このディレクトリには、notion-markdownのOpenAPI仕様書が含まれています。

## 概要

- [openapi.yaml](./openapi.yaml) - OpenAPI 3.1.0形式のAPI仕様書
- エンドポイントの詳細な説明とサンプルコード
- エラーハンドリングとレスポンス形式の説明

## 利用可能なエンドポイント

1. `GET /api/pages/{pageId}`
   - Notionページの取得
   - Markdown形式でページの内容を取得

2. `POST /api/pages/{pageId}`
   - ページの更新
   - 既存のページ内容を上書き

3. `POST /api/pages/{pageId}/append`
   - ページへの追記
   - 既存のコンテンツを保持したまま追記

4. `POST /api/pages`
   - 新規ページの作成
   - オプションで親ページを指定可能

## 認証

- NotionのAPIトークンを使用
- リクエストヘッダーに`Authorization: Bearer your-token`形式で指定
- トークンは環境変数`NOTION_API_KEY`での設定を推奨

## レート制限

- 1分あたり100リクエストまで
- 制限超過時は429エラーを返却
- Retry-Afterヘッダーで待機時間を通知

## エラーハンドリング

共通のエラーレスポンス形式：
```json
{
  "error": "error_code",
  "message": "エラーの詳細メッセージ"
}
```

主なエラーコード：
- `unauthorized` - 認証エラー（401）
- `not_found` - リソースが見つからない（404）
- `rate_limited` - レート制限超過（429）
- `invalid_request` - リクエスト形式が不正（400）
- `internal_error` - サーバーエラー（500）

## 使用例

### curlでの使用例

```bash
# ページの取得
curl -X GET "http://localhost:3000/api/pages/1234-5678-9abc" \
     -H "Authorization: Bearer your-token"

# ページの更新
curl -X POST "http://localhost:3000/api/pages/1234-5678-9abc" \
     -H "Authorization: Bearer your-token" \
     -H "Content-Type: application/json" \
     -d '{"markdown": "# 更新されたページ\n\nこれは更新後のコンテンツです。"}'

# ページへの追記
curl -X POST "http://localhost:3000/api/pages/1234-5678-9abc/append" \
     -H "Authorization: Bearer your-token" \
     -H "Content-Type: application/json" \
     -d '{"markdown": "## 新しいセクション\n\nこれは追記されたコンテンツです。"}'

# 新規ページの作成
curl -X POST "http://localhost:3000/api/pages" \
     -H "Authorization: Bearer your-token" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "新しいページ",
       "markdown": "# 新しいページ\n\nこれは新しく作成されたページです。",
       "parentId": "5678-1234-def0"
     }'
```

## 注意事項

1. APIトークンの管理
   - トークンは安全に管理
   - 環境変数での設定を推奨
   - 定期的なトークンのローテーションを推奨

2. エラーハンドリング
   - すべてのエラーに適切に対応
   - リトライロジックの実装を推奨
   - レート制限の考慮

3. コンテンツの制限
   - Markdownの最大サイズは100KB
   - 画像や添付ファイルは非対応
   - 一部のMarkdown記法に制限あり

## 関連ドキュメント

- [セットアップガイド](../../guides/setup/README.md)
- [認証ガイド](../../guides/authentication.md)
- [エラーハンドリング](../../guides/error-handling.md)
- [ベストプラクティス](../../guides/best-practices/README.md)