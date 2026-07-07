import { Router, Request, Response } from "express";

const router = Router();

// GET: Meta Webhook Verification
router.get("/api/whatsapp-webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WHATSAPP WEBHOOK] Webhook verified successfully.");
    return res.status(200).send(challenge);
  }

  console.warn(
    `[WHATSAPP WEBHOOK] Webhook verification failed. Expected token: ${verifyToken ? "configured" : "undefined"}, received: ${token}`
  );
  return res.status(403).send("Forbidden");
});

// POST: Handle Incoming WhatsApp Webhook Events
router.post("/api/whatsapp-webhook", (req: Request, res: Response) => {
  const payload = req.body;

  console.log(
    "[WHATSAPP WEBHOOK] Received WhatsApp Webhook Payload:",
    JSON.stringify(payload, null, 2)
  );

  return res.status(200).json({ success: true, message: "EVENT_RECEIVED" });
});

export default router;
