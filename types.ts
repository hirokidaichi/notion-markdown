// NotionのページIDの型
export type NotionPageId = string;

// GetPage API
export interface GetPageRequest {
  pageId: NotionPageId;
}

export interface GetPageResponse {
  markdown: string;
  title: string;
}

// AppendPage API
export interface AppendPageRequest {
  pageId: NotionPageId;
  markdown: string;
}

export interface AppendPageResponse {
  success: boolean;
}
