import { z } from "zod";

const apiOriginSchema = z
  .url()
  .refine((value) => {
    const url = new URL(value);
    return url.pathname === "/" && url.search === "" && url.hash === "";
  }, "VITE_API_URL must contain only protocol and host")
  .transform((value) => new URL(value).origin);

const configuredApiOrigin = import.meta.env.VITE_API_URL
  ? apiOriginSchema.parse(import.meta.env.VITE_API_URL)
  : null;

export const resolveApiUrl = (
  path: `/api/${string}`,
  apiOrigin: string | null = configuredApiOrigin,
): string => {
  if (!apiOrigin) return path;

  return `${apiOriginSchema.parse(apiOrigin)}${path.slice("/api".length)}`;
};
