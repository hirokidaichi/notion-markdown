# ドキュメント構造ガイド

## 概要

このドキュメントは、notion-markdownプロジェクトのドキュメント構造と各セクションの目的を説明します。

## ディレクトリ構造

```
docs/
├── api/                    # API仕様とリファレンス
│   ├── openapi.yaml       # OpenAPI仕様
│   ├── examples/          # APIの使用例
│   └── endpoints/         # エンドポイントの詳細説明
│
├── guides/                # ユーザーガイド
│   ├── quickstart.md     # クイックスタート
│   ├── installation.md   # インストール手順
│   └── tutorials/        # 詳細なチュートリアル
│
├── contributing/          # コントリビューションガイド
│   ├── CONTRIBUTING.md   # 貢献の方法
│   ├── CODE_OF_CONDUCT.md# 行動規範
│   └── workflow/         # 開発ワークフロー
│
├── development/          # 開発者向けドキュメント
│   ├── architecture/     # システム設計
│   ├── implementation/   # 実装の詳細
│   └── guides/          # 開発ガイド
│
└── reference/           # 技術リファレンス
    ├── api/            # 内部API
    ├── configuration/  # 設定リファレンス
    └── implementation/ # 実装リファレンス
```

## 命名規則

1. ファイル名
   - 一般的なドキュメント: `kebab-case.md`
   - 特別なファイル: `UPPERCASE.md`
   - 英語版: `original-name.en.md`

2. ディレクトリ名
   - すべて小文字
   - 複数単語はハイフンで接続

## コンテンツガイドライン

1. 各ディレクトリには`README.md`を配置
2. コードサンプルは実行可能であること
3. 画像は`assets`ディレクトリに配置
4. 相対パスでリンクを設定

## メンテナンス

1. 定期的なレビューと更新
2. 破損リンクのチェック
3. 非推奨情報の更新または削除
4. フィードバックに基づく改善