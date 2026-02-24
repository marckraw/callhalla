export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

export type BodyMode = "none" | "json" | "text";

export type HeaderRow = {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
};

export type RequestDraft = {
  method: HttpMethod;
  url: string;
  headers: HeaderRow[];
  bodyMode: BodyMode;
  bodyText: string;
};

export type SavedRequest = {
  id: string;
  name: string;
  tags: string[];
  draft: RequestDraft;
  createdAt: string;
  updatedAt: string;
};

export type ProxyRequestPayload = {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  bodyMode: BodyMode;
  body?: string;
};

export type ProxyResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  durationMs: number;
};

export type RequestPreparationResult =
  | {
      ok: true;
      payload: ProxyRequestPayload;
    }
  | {
      ok: false;
      errors: string[];
    };
