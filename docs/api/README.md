# API ドキュメント

このディレクトリには、notion-markdownのAPI仕様書とリファレンスが含まれています。

## 構成

- [`openapi.yaml`](./openapi.yaml) - OpenAPI仕様書（作成予定）
- [`examples/`](./examples/) - APIの使用例とサンプルコード
- [`endpoints/`](./endpoints/) - 各エンドポイントの詳細な説明

## エンドポイント一覧

- `GET /api/pages/:pageId` - Notionページの取得
- `POST /api/pages/:pageId/append` - 既存ページへの追記
- `POST /api/pages` - 新規ページの作成

## 認証

NotionのAPIトークンを使用した認証が必要です。詳細は[認証ガイド](../guides/authentication.md)を参照してください。

## エラーハンドリング

APIのエラーレスポンスと対処方法については[エラーハンドリング](./error-handling.md)を参照してください。