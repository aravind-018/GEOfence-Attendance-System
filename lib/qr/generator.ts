import crypto from "crypto";

/**
 * Generates a cryptographically secure random token for workplace QR codes.
 */
export function generateQRToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Construct full QR Check-In URL given a token and base URL.
 */
export function buildQRCheckInUrl(token: string, baseUrl: string = process.env.APP_URL || "http://localhost:3000"): string {
  // Ensure no trailing slash on baseUrl
  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
  return `${cleanBaseUrl}/check-in?token=${encodeURIComponent(token)}`;
}
