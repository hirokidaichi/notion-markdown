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

// CreatePage API
export interface CreatePageRequest {
  title: string;
  markdown: string;
  parentId?: NotionPageId;
}

export interface CreatePageResponse {
  pageId: NotionPageId;
  success: boolean;
}