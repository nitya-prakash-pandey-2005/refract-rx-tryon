// Local dev: one port serves the Vite app and the /api routes (same handler as on Vercel).
import "dotenv/config";
import express from "express";
import { createServer } from "vite";
import { handle } from "./router.js";

const PORT = Number(process.env.PORT || 5190);
const app = express();
app.use("/api", express.json({ limit: "12mb" }), (req, res) => {
  req.url = req.originalUrl;
  handle(req, res);
});
const vite = await createServer({ server: { middlewareMode: true }, appType: "spa" });
app.use(vite.middlewares);
app.listen(PORT, () => console.log(`Refract running at http://localhost:${PORT}  (YouCam key: ${process.env.YOUCAM_API_KEY ? "set" : "missing — replay mode only"})`));
