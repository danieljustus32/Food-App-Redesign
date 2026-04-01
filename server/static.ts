import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Service worker must never be cached by the browser so updates are
  // picked up immediately. Also set the correct scope header.
  app.get("/sw.js", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Content-Type", "application/javascript");
    res.sendFile(path.resolve(distPath, "sw.js"));
  });

  // Manifest also should not be long-cached
  app.get("/manifest.json", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Content-Type", "application/manifest+json");
    res.sendFile(path.resolve(distPath, "manifest.json"));
  });

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
