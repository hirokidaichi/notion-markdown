import {
  NotionBlocks,
  NotionBulletedListItemBlock,
  NotionCodeBlock,
  NotionHeading1Block,
  NotionHeading2Block,
  NotionHeading3Block,
  NotionNumberedListItemBlock,
  NotionParagraphBlock,
  NotionQuoteBlock,
  NotionRichText,
} from "./types.ts";

export class BlockToMarkdown {
  private convertRichText(richText: NotionRichText[]): string {
    return richText.map((text) => text.text.content).join("");
  }

  private convertParagraph(block: NotionParagraphBlock): string {
    return `${this.convertRichText(block.paragraph.rich_text)}\n\n`;
  }

  private convertHeading1(block: NotionHeading1Block): string {
    return `# ${this.convertRichText(block.heading_1.rich_text)}\n\n`;
  }

  private convertHeading2(block: NotionHeading2Block): string {
    return `## ${this.convertRichText(block.heading_2.rich_text)}\n\n`;
  }

  private convertHeading3(block: NotionHeading3Block): string {
    return `### ${this.convertRichText(block.heading_3.rich_text)}\n\n`;
  }

  private convertBulletedListItem(block: NotionBulletedListItemBlock): string {
    return `- ${this.convertRichText(block.bulleted_list_item.rich_text)}\n`;
  }

  private convertNumberedListItem(block: NotionNumberedListItemBlock): string {
    return `1. ${this.convertRichText(block.numbered_list_item.rich_text)}\n`;
  }

  private convertCode(block: NotionCodeBlock): string {
    const language = block.code.language;
    const content = this.convertRichText(block.code.rich_text);
    return `\`\`\`${language}\n${content}\n\`\`\`\n\n`;
  }

  private convertQuote(block: NotionQuoteBlock): string {
    return `> ${this.convertRichText(block.quote.rich_text)}\n\n`;
  }

  convert(blocks: NotionBlocks[]): string {
    let markdown = "";
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const nextBlock = blocks[i + 1];

      switch (block.type) {
        case "paragraph":
          markdown += this.convertParagraph(block);
          break;
        case "heading_1":
          markdown += this.convertHeading1(block);
          break;
        case "heading_2":
          markdown += this.convertHeading2(block);
          break;
        case "heading_3":
          markdown += this.convertHeading3(block);
          break;
        case "bulleted_list_item":
        case "numbered_list_item": {
          const isLastListItem = !nextBlock ||
            (nextBlock.type !== "bulleted_list_item" &&
              nextBlock.type !== "numbered_list_item");

          markdown += block.type === "bulleted_list_item"
            ? this.convertBulletedListItem(block as NotionBulletedListItemBlock)
            : this.convertNumberedListItem(
              block as NotionNumberedListItemBlock,
            );

          if (isLastListItem) {
            markdown += "\n";
          }
          break;
        }
        case "code":
          markdown += this.convertCode(block as NotionCodeBlock);
          break;
        case "quote":
          markdown += this.convertQuote(block as NotionQuoteBlock);
          break;
      }
    }

    return markdown;
  }
}
