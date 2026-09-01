import dotenv from "dotenv";

dotenv.config();

export interface ServerConfig {
  port: number;
  nodeEnv: "development" | "production" | "test";
  isProduction: boolean;
  geminiApiKey: string | null;
  apiKeys: string[];
  rateLimitMax: number;
  rateLimitWindowMs: number;
  corsOrigin: string;
  maxPayloadSize: string;
}

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: (process.env.NODE_ENV as any) || "development",
  isProduction: process.env.NODE_ENV === "production",
  geminiApiKey: process.env.GEMINI_API_KEY || null,
  apiKeys: process.env.API_KEYS 
    ? process.env.API_KEYS.split(",").map(k => k.trim()).filter(Boolean)
    : ["sentinel-dev-key-default"],
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "300", 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10), // 1 minute
  corsOrigin: process.env.CORS_ORIGIN || "*",
  maxPayloadSize: process.env.MAX_PAYLOAD_SIZE || "10mb",
};
