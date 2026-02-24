import type { RequestDraft } from "@/shared";

const TEMPLATE_PATTERN = /{{\s*([^{}]+?)\s*}}/g;
const VARIABLE_KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

type ResolvedTemplate = {
  value: string;
  missingVariables: string[];
  invalidVariables: string[];
};

export type DraftTemplateResolution = {
  resolvedDraft: RequestDraft;
  missingVariables: string[];
  invalidVariables: string[];
};

export const extractTemplateVariables = (value: string): string[] => {
  const keys = new Set<string>();

  for (const match of value.matchAll(TEMPLATE_PATTERN)) {
    const candidate = match[1]?.trim() ?? "";
    if (VARIABLE_KEY_PATTERN.test(candidate)) {
      keys.add(candidate);
    }
  }

  return [...keys];
};

export const resolveTemplateValue = (
  value: string,
  variables: Record<string, string>,
): ResolvedTemplate => {
  const missing = new Set<string>();
  const invalid = new Set<string>();

  const resolvedValue = value.replace(TEMPLATE_PATTERN, (match, rawCandidate: string) => {
    const candidate = rawCandidate.trim();

    if (!VARIABLE_KEY_PATTERN.test(candidate)) {
      invalid.add(candidate);
      return match;
    }

    if (!Object.hasOwn(variables, candidate)) {
      missing.add(candidate);
      return match;
    }

    return variables[candidate] ?? "";
  });

  return {
    value: resolvedValue,
    missingVariables: [...missing],
    invalidVariables: [...invalid],
  };
};

export const resolveDraftTemplates = (
  draft: RequestDraft,
  variables: Record<string, string>,
): DraftTemplateResolution => {
  const missing = new Set<string>();
  const invalid = new Set<string>();

  const resolvedUrl = resolveTemplateValue(draft.url, variables);
  resolvedUrl.missingVariables.forEach((item) => missing.add(item));
  resolvedUrl.invalidVariables.forEach((item) => invalid.add(item));

  const resolvedHeaders = draft.headers.map((header) => {
    const keyResolution = resolveTemplateValue(header.key, variables);
    keyResolution.missingVariables.forEach((item) => missing.add(item));
    keyResolution.invalidVariables.forEach((item) => invalid.add(item));

    const valueResolution = resolveTemplateValue(header.value, variables);
    valueResolution.missingVariables.forEach((item) => missing.add(item));
    valueResolution.invalidVariables.forEach((item) => invalid.add(item));

    return {
      ...header,
      key: keyResolution.value,
      value: valueResolution.value,
    };
  });

  const resolvedBody = resolveTemplateValue(draft.bodyText, variables);
  resolvedBody.missingVariables.forEach((item) => missing.add(item));
  resolvedBody.invalidVariables.forEach((item) => invalid.add(item));

  return {
    resolvedDraft: {
      ...draft,
      url: resolvedUrl.value,
      headers: resolvedHeaders,
      bodyText: resolvedBody.value,
    },
    missingVariables: [...missing],
    invalidVariables: [...invalid],
  };
};
