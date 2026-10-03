const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data", "content.json");
const UPLOADS = path.join(ROOT, "uploads");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "AmrKey2026";
const COOKIE_SECRET = process.env.COOKIE_SECRET || "amr-portfolio-secret-key-2026";

fs.mkdirSync(UPLOADS, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const safe = ext.match(/\.(jpe?g|png|webp|gif)$/) ? ext : ".jpg";
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Images only"));
  },
});

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser(COOKIE_SECRET));
app.use("/uploads", express.static(UPLOADS));
app.use(express.static(path.join(ROOT, "public")));

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function isAuthed(req) {
  return req.signedCookies && req.signedCookies.admin === "ok";
}
function requireAuth(req, res, next) {
  if (!isAuthed(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

app.get("/api/content", (_req, res) => {
  res.json(readData());
});

app.get("/api/me", (req, res) => {
  res.json({ admin: isAuthed(req) });
});

app.post("/api/login", (req, res) => {
  const password = String((req.body && req.body.password) || "");
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Wrong password" });
  }
  res.cookie("admin", "ok", {
    signed: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ ok: true });
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("admin");
  res.json({ ok: true });
});

app.post("/api/upload", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.put("/api/profile", requireAuth, (req, res) => {
  const data = readData();
  const body = req.body || {};
  data.profile = data.profile || {};
  if (body.photo != null) data.profile.photo = String(body.photo).slice(0, 300);
  if (body.phone != null) data.profile.phone = String(body.phone).slice(0, 40);
  if (body.email != null) data.profile.email = String(body.email).slice(0, 120);
  if (body.linkedin != null) data.profile.linkedin = String(body.linkedin).slice(0, 300);
  if (body.whatsapp != null) data.profile.whatsapp = String(body.whatsapp).slice(0, 300);
  writeData(data);
  res.json(data.profile);
});

app.post("/api/achievements", requireAuth, (req, res) => {
  const data = readData();
  const body = req.body || {};
  const item = {
    id: "a-" + crypto.randomBytes(5).toString("hex"),
    category: String(body.category || "Practice").slice(0, 40),
    title: String(body.title || "Untitled").slice(0, 180),
    role: String(body.role || "").slice(0, 80),
    dates: String(body.dates || "").slice(0, 80),
    summary: String(body.summary || "").slice(0, 1200),
    image: body.image ? String(body.image).slice(0, 300) : "",
    order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
  };
  data.achievements.unshift(item);
  writeData(data);
  res.json(item);
});

app.put("/api/achievements/:id", requireAuth, (req, res) => {
  const data = readData();
  const idx = data.achievements.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const body = req.body || {};
  const cur = data.achievements[idx];
  data.achievements[idx] = {
    ...cur,
    category: body.category != null ? String(body.category).slice(0, 40) : cur.category,
    title: body.title != null ? String(body.title).slice(0, 180) : cur.title,
    role: body.role != null ? String(body.role).slice(0, 80) : cur.role,
    dates: body.dates != null ? String(body.dates).slice(0, 80) : cur.dates,
    summary: body.summary != null ? String(body.summary).slice(0, 1200) : cur.summary,
    image: body.image != null ? String(body.image).slice(0, 300) : cur.image,
    order: body.order != null ? Number(body.order) : cur.order,
  };
  writeData(data);
  res.json(data.achievements[idx]);
});

app.delete("/api/achievements/:id", requireAuth, (req, res) => {
  const data = readData();
  const next = data.achievements.filter((a) => a.id !== req.params.id);
  if (next.length === data.achievements.length) return res.status(404).json({ error: "Not found" });
  data.achievements = next;
  writeData(data);
  res.json({ ok: true });
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(ROOT, "public", "admin.html"));
});

app.get("/preview/:id", (_req, res) => {
  res.sendFile(path.join(ROOT, "public", "preview.html"));
});

app.use("/embed/elsharaby", express.static(path.join(ROOT, "sites", "elsharaby")));
app.use("/embed/safa", express.static(path.join(ROOT, "sites", "safa")));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Portfolio running on http://0.0.0.0:${PORT}`);
});
