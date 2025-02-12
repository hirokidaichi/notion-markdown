# Notionページの取得例

このドキュメントでは、NotionページをMarkdown形式で取得する方法を説明します。

## エンドポイント

```
GET /api/pages/:pageId
```

## リクエスト例

### cURL
```bash
curl -X GET "http://localhost:3000/api/pages/1234-5678-9abc" \
     -H "Authorization: Bearer your-api-key"
```

### TypeScript
```typescript
import { NotionClient } from "@notion-markdown/client";

const client = new NotionClient({
  apiKey: "your-api-key"
});

const markdown = await client.getPage("1234-5678-9abc");
console.log(markdown);
```

### Python
```python
from notion_markdown import NotionClient

client = NotionClient(api_key="your-api-key")
markdown = client.get_page("1234-5678-9abc")
print(markdown)
```

## レスポンス例

```json
{
  "markdown": "# サンプルページ\n\nこれはNotionからMarkdownとして取得したコンテンツです。\n\n## セクション1\n\n- リスト項目1\n- リスト項目2\n",
  "metadata": {
    "title": "サンプルページ",
    "created_at": "2024-02-12T10:00:00Z",
    "updated_at": "2024-02-12T10:30:00Z"
  }
}
```

## エラーレスポンス

### 認証エラー (401)
```json
{
  "error": "unauthorized",
  "message": "Invalid API key"
}
```

### ページが見つからない (404)
```json
{
  "error": "not_found",
  "message": "Page not found"
}
```

## 注意事項

- APIキーは環境変数として設定することを推奨
- レート制限に注意（1分あたり100リクエストまで）
- 大きなページの場合、レスポンスに時間がかかる可能性あり