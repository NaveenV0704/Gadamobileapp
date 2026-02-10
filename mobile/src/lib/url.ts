export function stripUploads(url?: string): string {
  if (!url) return "";
  // Adjust logic based on actual needs, simple string replacement for now
  return url.replace(/^\/uploads\//, "").replace(/^uploads\//, "");
}
