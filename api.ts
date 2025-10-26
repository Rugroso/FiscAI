// Centralized API configuration for calling the MCP Lambda bridge
// IMPORTANT: Do not hardcode the API URL here. It must come from env.
// Set EXPO_PUBLIC_API_BASE_URL in your .env (or app config). This value
// is not committed in source and will be embedded at build-time by Expo.

const fromEnvRaw = process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined;
const fromEnv = fromEnvRaw?.trim();

// We deliberately avoid any fallback to prevent leaking a real URL in code.
export const API_BASE_URL: string = (() => {
  if (!fromEnv) {
    // Warn at runtime so it's obvious during dev builds
    console.warn(
      "[API] EXPO_PUBLIC_SUPABASE_URL is not set. Configure it in your .env."
    );
  }
  return fromEnv ?? ""; // Empty string keeps code compiling but will fail on use
})();

export const ENDPOINTS = {
  health: "/health",
  info: "/info",
  chat: "/chat",
  fiscalAdvice: "/fiscal-advice",
  riskAnalysis: "/risk-analysis",
  search: "/search",
  userContext: "/user-context",
  fiscalConsultation: "/fiscal-consultation",
  riskAssessment: "/risk-assessment",
} as const;

export function url(path: string) {
  if (!API_BASE_URL) {
    throw new Error(
      "API base URL is not configured. Please set EXPO_PUBLIC_API_BASE_URL in your .env"
    );
  }
  return `${API_BASE_URL}${path}`;
}