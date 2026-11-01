// Vercel serverless entry: every /api/* request is rewritten here (see vercel.json).
import { handle } from "../server/router.js";

export const config = { maxDuration: 120 };

export default function handler(req, res) {
  return handle(req, res);
}
