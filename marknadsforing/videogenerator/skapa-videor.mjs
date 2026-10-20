/**
 * SKAPAR REKLAMVIDEOR (9:16, MP4) PÅ FLERA SPRÅK
 *
 * Kör:  node marknadsforing/videogenerator/skapa-videor.mjs            (alla språk)
 *       node marknadsforing/videogenerator/skapa-videor.mjs ar so       (bara vissa språk)
 *
 * Startar en liten lokal server och Chrome utan fönster, som ritar och spelar in
 * varje video bildruta för bildruta till en vanlig MP4 (H.264 + AAC). Filerna hamnar i
 * marknadsforing/videor/. Manus finns i texts.js.
 */
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const outDir = process.env.OUT_DIR || path.join(dir, "..", "videor");
fs.mkdirSync(outDir, { recursive: true });

const ALL = ["sv", "en", "ar", "fa", "so", "ti", "ckb"];
const stills = process.env.STILLS ? process.env.STILLS.split(",") : null;
const langs = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
const jobs = langs.flatMap((lang) => [
  { lang, scene: "fraga", key: "fraga1", name: `medborgarhjalpen_${lang}_fraga-riksdagen` },
  { lang, scene: "fraga", key: "fraga2", name: `medborgarhjalpen_${lang}_fraga-nationaldagen` },
  { lang, scene: "funktioner", key: "", name: `medborgarhjalpen_${lang}_funktioner` },
]);

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find((p) => fs.existsSync(p));
if (!CHROME) throw new Error("Hittar varken Chrome eller Edge.");

let chrome;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/jobs") return res.end(JSON.stringify(jobs));
  if (url.pathname === "/stills") return res.end(JSON.stringify(stills ?? []));
  if (url.pathname === "/save" && req.method === "POST") {
    const name = path.basename(url.searchParams.get("name") || "video.mp4");
    const file = fs.createWriteStream(path.join(outDir, name));
    req.pipe(file);
    file.on("finish", () => {
      console.log(`✅ ${name} (${(fs.statSync(path.join(outDir, name)).size / 1e6).toFixed(1)} MB)`);
      res.end("ok");
    });
    return;
  }
  if (url.pathname === "/done" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      console.log(body.startsWith("FEL") ? `❌ ${body}` : `Klart. Format: ${body}`);
      res.end("ok");
      chrome?.kill();
      server.close();
      process.exitCode = body.startsWith("FEL") ? 1 : 0;
    });
    return;
  }
  const file = url.pathname === "/mp4-muxer.js"
    ? path.join(dir, "..", "..", "node_modules", "mp4-muxer", "build", "mp4-muxer.js")
    : path.join(dir, url.pathname === "/" ? "index.html" : path.basename(url.pathname));
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  const type = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8" }[path.extname(file)] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type }).end(fs.readFileSync(file));
});

server.listen(0, "127.0.0.1", () => {
  const { port } = server.address();
  if (!stills) console.log(`Spelar in ${jobs.length} videor (ungefär ${Math.ceil(jobs.length * 17 / 60)} minuter)…`);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "videogen-"));
  chrome = spawn(CHROME, [
    "--headless=new",
    `--user-data-dir=${profile}`,
    "--autoplay-policy=no-user-gesture-required",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--window-size=1080,1920",
    "--no-first-run",
    `http://127.0.0.1:${port}/${stills ? "?stills=1" : ""}`,
  ], { stdio: "ignore" });
});
