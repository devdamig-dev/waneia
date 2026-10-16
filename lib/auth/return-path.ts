export function safeReturnPath(value: string | null, origin: string): string {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/dashboard";
  try {
    const decoded = decodeURIComponent(value);
    const destination = new URL(value, origin);
    if (decoded.includes("\\") || decoded.startsWith("//") || destination.origin !== origin) return "/dashboard";
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return "/dashboard";
  }
}
