export const cx = (...parts: Array<string | null | undefined | false>) =>
  parts.filter(Boolean).join(" ");
