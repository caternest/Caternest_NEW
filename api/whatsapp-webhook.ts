import type { Request, Response } from "express";
import express from "express";

const router = express.Router();

// GET: Meta Webhook Verification
// Supports direct invocation and Vercel rewritten routes
router.get(["/api/whatsapp-webhook", "/whatsapp-webhook"], (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  // Return status for generic health checks or pings without query params
  if (!mode && !token) {
    return res.status(200).json({ status: "active", service: "whatsapp-webhook" });
  }

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WHATSAPP WEBHOOK] Webhook verified successfully.");
    return res.status(200).send(challenge);
  }

  return res.status(403).send("Forbidden");
});

// POST: Handle Incoming WhatsApp Webhook Events
router.post(["/api/whatsapp-webhook", "/whatsapp-webhook"], (req: Request, res: Response) => {
  const payload = req.body;

  console.log(
    "[WHATSAPP WEBHOOK] Received WhatsApp Webhook Payload:",
    JSON.stringify(payload, null, 2)
  );

  return res.status(200).json({ success: true, message: "EVENT_RECEIVED" });
});

export default router;
