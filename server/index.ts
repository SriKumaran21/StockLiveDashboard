import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

// ── Global safety nets ────────────────────────────────────────────────────────
// Prevent ANY unhandled promise rejection (e.g. DB quota errors) from crashing.
process.on("unhandledRejection", (reason: any) => {
  console.error("[server] Unhandled rejection (non-fatal):", reason?.message ?? reason);
});

// Friendly message for EADDRINUSE so the user knows exactly what to run.
process.on("uncaughtException", (err: any) => {
  if (err.code === "EADDRINUSE") {
    const port = Number(process.env.PORT) || 5051;
    console.error(
      `\n❌  Port ${port} is already in use — another server is still running.\n` +
      `   Kill it first, then restart:\n\n` +
      `   lsof -ti :${port} | xargs kill -9\n`
    );
    process.exit(1);
  }
  console.error("[server] Uncaught exception (non-fatal):", err?.message ?? err);
});

(async () => {
  await registerRoutes(httpServer, app);

  // Global error-handling middleware
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  // Serve static files in production, or Vite dev server otherwise
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = Number(process.env.PORT) || 5051;

  // Catch EADDRINUSE at the server level too
  httpServer.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `\n❌  Port ${port} is already in use — another server is still running.\n` +
        `   Kill it first, then restart:\n\n` +
        `   lsof -ti :${port} | xargs kill -9\n`
      );
      process.exit(1);
    }
    console.error("[server] HTTP server error:", err);
  });

  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
