import { twMerge } from "tailwind-merge";

/**
 * Merge tailwind classes with conflict resolution
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return twMerge(classes.filter(Boolean).join(" "));
}

/**
 * Decode JWT token payload
 */
export function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || typeof payload.exp !== "number") return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * Format date to locale string
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
