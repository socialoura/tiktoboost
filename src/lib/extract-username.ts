/**
 * Extract a clean username from user input.
 * Handles:
 *  - Plain username: "username" → "username"
 *  - With @: "@username" → "username"
 *  - TikTok link: "https://www.tiktok.com/@username" → "username"
 *  - TikTok link with path: "https://www.tiktok.com/@username/video/123" → "username"
 *  - With query params: "https://www.tiktok.com/@user?lang=en" → "user"
 */
export function extractUsername(input: string): string {
  let clean = input.trim();

  // TikTok URL: extract @username from path
  const ttMatch = clean.match(/tiktok\.com\/@([^/?&#]+)/i);
  if (ttMatch) return ttMatch[1];


  // Fallback: strip @ prefix
  clean = clean.replace(/^@/, "");

  return clean;
}
