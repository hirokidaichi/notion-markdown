import { Hono } from "https://deno.land/x/hono@v3.11.7/mod.ts";
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";
import api from "./routes/api.ts";

// .envファイルを読み込む
await load({ export: true });

const app = new Hono();

// APIルートをマウント
app.route("/api", api);

// ヘルスチェック用エンドポイント
app.get("/health", (c) => c.json({ status: "ok" }));

// サーバー起動
const port = parseInt(Deno.env.get("PORT") || "8000");
console.log(`Server is running on port ${port}`);

await Deno.serve({ port: port }, app.fetch);
