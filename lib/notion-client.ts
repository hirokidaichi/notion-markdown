import { Client } from "https://deno.land/x/notion_sdk@v2.2.3/src/mod.ts";
import {
  BlockObjectRequest,
  BlockObjectResponse,
  LanguageRequest,
  PageObjectResponse,
  RichTextItemResponse,
} from "https://deno.land/x/notion_sdk@v2.2.3/src/api-endpoints.ts";
import { BlockToMarkdown } from "./block-to-markdown.ts";
import { NotionBlocks, NotionRichText } from "./types.ts";
import { NotionPageId } from "../types.ts";
import { MarkdownToBlocks } from "./markdown-to-blocks.ts";

export class NotionClient {
  private client: Client;
  private converter: MarkdownToBlocks;
  private blockToMarkdown: BlockToMarkdown;

  // Notion supported language mapping
  private languageMapping: Record<string, string> = {
    "cpp": "c++",
    "cc": "c++",
    "cxx": "c++",
    "c++": "c++",
    "cs": "c#",
    "csharp": "c#",
    "js": "javascript",
    "jsx": "javascript",
    "javascript": "javascript",
    "ts": "typescript",
    "tsx": "typescript",
    "typescript": "typescript",
    "py": "python",
    "python": "python",
    "rb": "ruby",
    "ruby": "ruby",
    "sh": "shell",
    "bash": "bash",
    "zsh": "shell",
    "fish": "shell",
    "ps1": "powershell",
    "yml": "yaml",
    "md": "markdown",
    "tex": "latex",
    "hs": "haskell",
    "rs": "rust",
    "go": "go",
    "java": "java",
    "kt": "kotlin",
    "scala": "scala",
    "clj": "clojure",
    "pl": "perl",
    "php": "php",
    "r": "r",
    "sql": "sql",
    "html": "html",
    "css": "css",
    "scss": "scss",
    "sass": "sass",
    "less": "less",
    "json": "json",
    "xml": "xml",
    "dockerfile": "docker",
    "makefile": "makefile",
    "text": "plain text",
    "txt": "plain text",
    "": "plain text", // fallback for empty language
  };

  constructor(apiKey: string) {
    this.client = new Client({ auth: apiKey });
    this.converter = new MarkdownToBlocks();
    this.blockToMarkdown = new BlockToMarkdown();
  }

  private mapLanguage(language: string): string {
    const normalizedLang = language.toLowerCase().trim();
    return this.languageMapping[normalizedLang] || "plain text";
  }

  private convertRichTextResponse(
    richText: RichTextItemResponse[],
  ): NotionRichText[] {
    return richText.map((item) => {
      const richTextItem: NotionRichText = {
        type: "text",
        text: {
          content: item.plain_text,
        },
      };

      if (item.href) {
        richTextItem.text.link = { url: item.href };
      }

      if (item.annotations) {
        richTextItem.annotations = {
          bold: item.annotations.bold || false,
          italic: item.annotations.italic || false,
          strikethrough: item.annotations.strikethrough || false,
          underline: item.annotations.underline || false,
          code: item.annotations.code || false,
        };
      }

      return richTextItem;
    });
  }

  private convertBlockResponse(
    block: BlockObjectResponse,
  ): NotionBlocks | null {
    if (!("type" in block)) return null;

    const convertedRichText = (richText: RichTextItemResponse[]) =>
      this.convertRichTextResponse(richText);

    switch (block.type) {
      case "paragraph":
        return {
          type: "paragraph",
          paragraph: {
            rich_text: convertedRichText(block.paragraph.rich_text),
          },
        };
      case "heading_1":
        return {
          type: "heading_1",
          heading_1: {
            rich_text: convertedRichText(block.heading_1.rich_text),
          },
        };
      case "heading_2":
        return {
          type: "heading_2",
          heading_2: {
            rich_text: convertedRichText(block.heading_2.rich_text),
          },
        };
      case "heading_3":
        return {
          type: "heading_3",
          heading_3: {
            rich_text: convertedRichText(block.heading_3.rich_text),
          },
        };
      case "bulleted_list_item":
        return {
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: convertedRichText(block.bulleted_list_item.rich_text),
          },
        };
      case "numbered_list_item":
        return {
          type: "numbered_list_item",
          numbered_list_item: {
            rich_text: convertedRichText(block.numbered_list_item.rich_text),
          },
        };
      case "code":
        return {
          type: "code",
          code: {
            rich_text: convertedRichText(block.code.rich_text),
            language: block.code.language,
          },
        };
      case "quote":
        return {
          type: "quote",
          quote: {
            rich_text: convertedRichText(block.quote.rich_text),
          },
        };
      default:
        return null;
    }
  }

  private convertToNotionBlocks(
    blocks: ReturnType<MarkdownToBlocks["convert"]>["blocks"],
  ): BlockObjectRequest[] {
    return blocks.map((block) => {
      if (block.type === "code") {
        return {
          ...block,
          code: {
            ...block.code,
            language: this.mapLanguage(block.code.language) as LanguageRequest,
          },
        };
      }
      return block as BlockObjectRequest;
    });
  }

  async getPage(
    pageId: NotionPageId,
  ): Promise<{ title: string; markdown: string }> {
    try {
      // ページ情報の取得
      const page = await this.client.pages.retrieve({ page_id: pageId });

      // タイトルの取得
      let title = "";
      if ("properties" in page) {
        const properties = page.properties as PageObjectResponse["properties"];
        // titleプロパティを優先的に探す
        if (
          properties.title?.type === "title" &&
          properties.title.title?.[0]?.plain_text
        ) {
          title = properties.title.title[0].plain_text;
        }
        // titleが見つからない場合は他のプロパティを探す
        if (!title) {
          for (const [_, prop] of Object.entries(properties)) {
            if (prop.type === "rich_text" && prop.rich_text?.[0]?.plain_text) {
              title = prop.rich_text[0].plain_text;
              break;
            }
          }
        }
      }

      // ブロックの取得
      const blocksResponse = await this.client.blocks.children.list({
        block_id: pageId,
      });

      // ブロックの変換
      const blocks = blocksResponse.results
        .map((block) => this.convertBlockResponse(block as BlockObjectResponse))
        .filter((block): block is NotionBlocks => block !== null);

      // マークダウンに変換
      const markdown = this.blockToMarkdown.convert(blocks);

      return {
        title,
        markdown,
      };
    } catch (error) {
      console.error("Failed to get page:", error);
      throw error;
    }
  }

  async appendPage(pageId: NotionPageId, markdown: string): Promise<void> {
    const { blocks, errors } = this.converter.convert(markdown);
    if (errors && errors.length > 0) {
      throw new Error(`Markdown conversion failed: ${errors.join(", ")}`);
    }

    const notionBlocks = this.convertToNotionBlocks(blocks);

    // Split blocks into chunks of 100 to respect Notion API limit
    const chunkSize = 100;
    for (let i = 0; i < notionBlocks.length; i += chunkSize) {
      const chunk = notionBlocks.slice(i, i + chunkSize);
      await this.client.blocks.children.append({
        block_id: pageId,
        children: chunk,
      });
    }
  }
}
