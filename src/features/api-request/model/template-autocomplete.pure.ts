export type TemplateTokenMatch = {
  start: number;
  query: string;
};

export const findTemplateTokenAtCursor = (
  value: string,
  cursor: number,
): TemplateTokenMatch | null => {
  if (cursor < 2) {
    return null;
  }

  let start = value.lastIndexOf("{{", cursor - 1);

  while (start >= 0) {
    const closingIndex = value.indexOf("}}", start + 2);
    if (closingIndex === -1 || closingIndex >= cursor) {
      const query = value.slice(start + 2, cursor);
      if (query.includes("{") || query.includes("}") || query.includes("\n")) {
        return null;
      }

      return {
        start,
        query,
      };
    }

    start = value.lastIndexOf("{{", start - 1);
  }

  return null;
};

export const applyTemplateSuggestion = (
  value: string,
  cursor: number,
  suggestion: string,
): {
  value: string;
  nextCursor: number;
} | null => {
  const token = findTemplateTokenAtCursor(value, cursor);
  if (!token) {
    return null;
  }

  const prefix = value.slice(0, token.start);
  const suffix = value.slice(cursor);
  const insert = `{{${suggestion}}}`;
  const normalizedSuffix = suffix.startsWith("}}") ? suffix.slice(2) : suffix;

  return {
    value: `${prefix}${insert}${normalizedSuffix}`,
    nextCursor: prefix.length + insert.length,
  };
};
