#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read

import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";
import { NotionClient } from "./lib/notion-client.ts";

// .envファイルを読み込む
await load({ export: true });

const HELP_MESSAGE = `
notion-markdown - Notion pages to Markdown converter CLI

Usage:
  notion-markdown get <pageId>           # Get page content as markdown
  notion-markdown append <pageId> <file> # Append markdown content to page

Environment variables:
  NOTION_TOKEN - Notion API token (required)

Options:
  -h, --help     Show this help message
  -v, --version  Show version number
`;

const VERSION = "1.0.0";

async function main() {
  const args = parse(Deno.args, {
    boolean: ["help", "version"],
    alias: { h: "help", v: "version" },
  });

  if (args.help) {
    console.log(HELP_MESSAGE);
    Deno.exit(0);
  }

  if (args.version) {
    console.log(`v${VERSION}`);
    Deno.exit(0);
  }

  const token = Deno.env.get("NOTION_TOKEN");
  if (!token) {
    console.error("Error: NOTION_TOKEN environment variable is required");
    Deno.exit(1);
  }

  const notionClient = new NotionClient(token);
  const [command, pageId, file] = args._;

  try {
    switch (command) {
      case "get": {
        if (!pageId) {
          console.error("Error: pageId is required for get command");
          Deno.exit(1);
        }
        const result = await notionClient.getPage(String(pageId));
        console.log(result.markdown);
        break;
      }

      case "append":
        if (!pageId || !file) {
          console.error(
            "Error: both pageId and file path are required for append command",
          );
          Deno.exit(1);
        }
        try {
          const content = await Deno.readTextFile(String(file));
          const success = await notionClient.appendPage(
            String(pageId),
            content,
          );
          if (success) {
            console.log("Successfully appended content to page");
          } else {
            console.error("Failed to append content to page");
            Deno.exit(1);
          }
        } catch (error: unknown) {
          if (error instanceof Deno.errors.NotFound) {
            console.error(`Error: File '${file}' not found`);
          } else if (error instanceof Error) {
            console.error("Error reading file:", error.message);
          } else {
            console.error("An unknown error occurred");
          }
          Deno.exit(1);
        }
        break;

      default:
        console.error(
          "Error: Unknown command. Use --help for usage information",
        );
        Deno.exit(1);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("An unknown error occurred");
    }
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
