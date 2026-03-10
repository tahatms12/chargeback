// app/lib/logger.server.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(process.env.NODE_ENV === "development"
    ? { transport: { target: "pino-pretty", options: { colorize: true } } }
    : {}),
  base: { service: "customsready-lite" },
  redact: {
    // Never log these fields even if accidentally passed
    paths: [
      "email",
      "firstName",
      "lastName",
      "phone",
      "address",
      "address1",
      "address2",
      "accessToken",
      "password",
    ],
    remove: true,
  },
});

export type Logger = typeof logger;
