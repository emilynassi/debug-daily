const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.VITE_ANTHROPIC_API_KEY;
const DIST = path.join(__dirname, "dist");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/anthropic/v1/messages") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const options = {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
          "content-length": Buffer.byteLength(body),
        },
      };
      const proxy = https.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
          "content-type": proxyRes.headers["content-type"] || "application/json",
        });
        proxyRes.pipe(res);
      });
      proxy.on("error", (err) => {
        console.error("Proxy error:", err.message);
        res.writeHead(502);
        res.end("Bad gateway");
      });
      proxy.write(body);
      proxy.end();
    });
    return;
  }

  // Serve static files with SPA fallback
  let filePath = path.join(DIST, req.url === "/" ? "index.html" : req.url);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, "index.html");
  }

  const ext = path.extname(filePath);
  res.writeHead(200, { "content-type": MIME[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, "0.0.0.0", () =>
  console.log(`debug-daily running at http://0.0.0.0:${PORT}`)
);
