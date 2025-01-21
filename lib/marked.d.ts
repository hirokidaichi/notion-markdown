declare module "https://esm.sh/marked@9.1.6" {
  export interface MarkedOptions {
    gfm?: boolean;
    breaks?: boolean;
    pedantic?: boolean;
    sanitize?: boolean;
    smartLists?: boolean;
    smartypants?: boolean;
  }

  export interface TokensList {
    [index: number]: Token;
    links: Record<string, { href: string; title: string }>;
    length: number;
  }

  export interface Token {
    type: TokenType;
    raw: string;
    text?: string;
    href?: string;
    title?: string;
    ordered?: boolean;
    depth?: number;
    items?: Token[];
    lang?: string;
  }

  export type TokenType = 
    | "paragraph"
    | "heading"
    | "list"
    | "list_item"
    | "code"
    | "blockquote"
    | "image"
    | "space"
    | "text"
    | "html";

  export namespace Tokens {
    export interface Paragraph extends Token {
      type: "paragraph";
      text: string;
    }

    export interface Heading extends Token {
      type: "heading";
      depth: number;
      text: string;
    }

    export interface List extends Token {
      type: "list";
      ordered: boolean;
      items: ListItem[];
    }

    export interface ListItem extends Token {
      type: "list_item";
      text: string;
    }

    export interface Code extends Token {
      type: "code";
      text: string;
      lang?: string;
    }

    export interface Blockquote extends Token {
      type: "blockquote";
      text: string;
    }

    export interface Image extends Token {
      type: "image";
      href: string;
      title?: string;
      text: string;
    }
  }

  export const marked: {
    use: (options: MarkedOptions) => void;
    lexer: (src: string, options?: MarkedOptions) => Token[];
  };

  export default marked;
}