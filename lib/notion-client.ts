import { Client } from "https://deno.land/x/notion_sdk@v2.2.3/src/mod.ts";
import { MarkdownToBlocks } from "./markdown-to-blocks.ts";
import { NotionPageId } from "../types.ts";
import { 
  BlockObjectRequest, 
  LanguageRequest,
  CreatePageParameters,
} from "https://deno.land/x/notion_sdk@v2.2.3/src/api-endpoints.ts";

export class NotionClient {
  private client: Client;
  private converter: MarkdownToBlocks;

  constructor(apiKey: string) {
    this.client = new Client({ auth: apiKey });
    this.converter = new MarkdownToBlocks();
  }

  private convertToNotionBlocks(blocks: ReturnType<MarkdownToBlocks["convert"]>["blocks"]): BlockObjectRequest[] {
    return blocks.map(block => {
      if (block.type === "code") {
        return {
          ...block,
          code: {
            ...block.code,
            language: block.code.language as LanguageRequest,
          },
        };
      }
      return block as BlockObjectRequest;
    });
  }

  async appendPage(pageId: NotionPageId, markdown: string): Promise<boolean> {
    try {
      const { blocks, errors } = this.converter.convert(markdown);
      if (errors && errors.length > 0) {
        console.error("Conversion errors:", errors);
        return false;
      }

      const notionBlocks = this.convertToNotionBlocks(blocks);

      await this.client.blocks.children.append({
        block_id: pageId,
        children: notionBlocks,
      });

      return true;
    } catch (error) {
      console.error("Failed to append page:", error);
      return false;
    }
  }

  async createPage(title: string, markdown: string, parentId?: NotionPageId): Promise<{ pageId: string; success: boolean }> {
    try {
      const { blocks, errors } = this.converter.convert(markdown);
      if (errors && errors.length > 0) {
        console.error("Conversion errors:", errors);
        return { pageId: "", success: false };
      }

      const notionBlocks = this.convertToNotionBlocks(blocks);

      let params: CreatePageParameters;
      
      if (parentId) {
        params = {
          parent: {
            page_id: parentId,
          },
          properties: {
            title: [
              {
                type: "text",
                text: {
                  content: title,
                },
              },
            ],
          },
          children: notionBlocks,
        };
      } else {
        const databaseId = Deno.env.get("NOTION_DATABASE_ID");
        if (!databaseId) {
          throw new Error("NOTION_DATABASE_ID is required when parentId is not provided");
        }
        params = {
          parent: {
            database_id: databaseId,
          },
          properties: {
            title: {
              title: [
                {
                  type: "text",
                  text: {
                    content: title,
                  },
                },
              ],
            },
          },
          children: notionBlocks,
        };
      }

      const response = await this.client.pages.create(params);

      return {
        pageId: response.id,
        success: true,
      };
    } catch (error) {
      console.error("Failed to create page:", error);
      return { pageId: "", success: false };
    }
  }
}