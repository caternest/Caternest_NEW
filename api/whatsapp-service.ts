/**
 * WhatsApp Cloud API Service for CaterNest
 * Handles phone normalization and message delivery via Meta Graph API.
 * Never logs or exposes access tokens or secrets.
 */

export interface SendWhatsAppMessageParams {
  to: string;
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: any[];
  text?: string;
}

export interface WhatsAppServiceResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

/**
 * Normalizes phone numbers to standard E.164 without leading '+':
 * - Strips all spaces, dashes, parentheses, dots
 * - If 10 digits (standard Indian mobile), prepends '91'
 * - If begins with '0', strips leading zero and prepends '91'
 * - Strips leading '+'
 */
export function normalizePhoneNumber(rawNumber: string): string {
  if (!rawNumber || typeof rawNumber !== "string") return "";

  // Remove non-digit characters
  let cleaned = rawNumber.replace(/\D/g, "");

  // If 10-digit number (e.g. 9876543210), prepend 91 (India)
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = `91${cleaned.substring(1)}`;
  }

  return cleaned;
}

/**
 * Dispatches a WhatsApp message through Meta WhatsApp Cloud API.
 * Safe and non-throwing: returns a structured result.
 */
export async function sendWhatsAppMessage(
  params: SendWhatsAppMessageParams
): Promise<WhatsAppServiceResult> {
  const { to, templateName, templateLanguage = "en_US", templateComponents, text } = params;

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();

  // Validate credentials exist without exposing them
  if (!accessToken || !phoneNumberId) {
    console.warn(
      `[WHATSAPP SERVICE] Delivery skipped: Missing ${
        !accessToken ? "WHATSAPP_ACCESS_TOKEN" : ""
      } ${!phoneNumberId ? "WHATSAPP_PHONE_NUMBER_ID" : ""}`.trim()
    );
    return {
      success: false,
      error: "WhatsApp Cloud API credentials are not configured on the server.",
    };
  }

  const normalizedTo = normalizePhoneNumber(to);
  if (!normalizedTo || normalizedTo.length < 10) {
    return {
      success: false,
      error: `Invalid destination phone number: "${to}". Must be a valid mobile number with country code.`,
    };
  }

  // Construct Meta Graph API payload
  let payload: any;

  if (templateName) {
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedTo,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: templateLanguage,
        },
        components: templateComponents || [],
      },
    };
  } else if (text) {
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedTo,
      type: "text",
      text: {
        preview_url: false,
        body: text,
      },
    };
  } else {
    return {
      success: false,
      error: "Either 'templateName' or 'text' must be provided to send a WhatsApp message.",
    };
  }

  const endpoint = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      const metaError = data?.error || {};
      const errorMessage =
        metaError.message ||
        `Meta API responded with HTTP status ${response.status} (${response.statusText})`;

      console.warn(`[WHATSAPP SERVICE] Meta WhatsApp delivery rejected for ...${normalizedTo.slice(-4)}: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        details: {
          code: metaError.code,
          type: metaError.type,
          fbtrace_id: metaError.fbtrace_id,
        },
      };
    }

    const messageId = data?.messages?.[0]?.id;
    console.log(
      `[WHATSAPP SERVICE] Message dispatched successfully to ...${normalizedTo.slice(-4)}. Message ID: ${messageId}`
    );

    return {
      success: true,
      messageId,
    };
  } catch (err: any) {
    console.warn(
      `[WHATSAPP SERVICE] Network or dispatch error sending to ...${normalizedTo.slice(-4)}:`,
      err?.message || err
    );
    return {
      success: false,
      error: err?.message || "Failed to communicate with Meta WhatsApp Cloud API endpoint.",
    };
  }
}
