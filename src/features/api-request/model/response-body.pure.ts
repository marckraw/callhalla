export const formatResponseBody = (body: string, headers: Record<string, string>) => {
  const contentType =
    headers["content-type"] ?? headers["Content-Type"] ?? headers["CONTENT-TYPE"] ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return body;
  }

  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
};
