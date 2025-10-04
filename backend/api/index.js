import app from "../server.js";
import { createServer } from "http";

// Vercel Serverless handler
export default function handler(req, res) {
  createServer(app).emit("request", req, res);
}
