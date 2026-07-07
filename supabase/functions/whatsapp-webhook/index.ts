// Supabase Edge Function: whatsapp-webhook
// Handles GET request verification for Meta Webhook and POST requests for receiving events.

Deno.serve(async (req: Request) => {
  const { method } = req;
  const url = new URL(req.url);

  // 1. Handle GET requests (Webhook Verification from Meta)
  if (method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // Read the secret from Supabase Environment Secrets
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && token === verifyToken) {
      console.log("Meta Webhook successfully verified.");
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    console.warn("Meta Webhook verification failed: Invalid verify token or hub.mode.");
    return new Response("Forbidden", { status: 403 });
  }

  // 2. Handle POST requests (Incoming WhatsApp Webhook Events)
  if (method === "POST") {
    try {
      const payload = await req.json();
      
      // Log the payload details so they are visible in the Supabase logs
      console.log("Received WhatsApp Webhook Payload:", JSON.stringify(payload));

      // Meta requires a 200 OK response to acknowledge receipt of the event
      return new Response(JSON.stringify({ success: true, message: "EVENT_RECEIVED" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error reading webhook payload:", error);
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 3. Fallback for unhandled HTTP methods
  return new Response("Method Not Allowed", { status: 405 });
});
