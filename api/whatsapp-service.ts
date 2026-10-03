/**
 * WhatsApp Messaging Service for CaterNest
 * Supports Twilio WhatsApp API (Active Provider) with fallback to Meta WhatsApp Cloud API.
 * Never logs or exposes access tokens, auth tokens, or secrets.
 */

export interface SendWhatsAppMessageParams {
  to: string;
  text?: string;
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: any[];
}

export interface WhatsAppServiceResult {
  success: boolean;
  messageId?: string;
  provider?: "twilio" | "meta";
  skipped?: boolean;
  error?: string;
  details?: any;
}

export interface OrderApprovedNotificationParams {
  orderId: string;
  customerName?: string;
  customerPhone?: string;
  phone?: string;
  eventDate?: string;
}

/**
 * Normalizes phone numbers to standard E.164 format with leading '+':
 * - If already valid E.164 (e.g. +919876543210 or +14155552671), preserves it.
 * - If 10 digits (standard Indian mobile, e.g. 9876543210), prefixes '+91'.
 * - If 11 digits starting with '0' (e.g. 09876543210), strips '0' and prefixes '+91'.
 * - If 12 digits starting with '91' without '+' (e.g. 919876543210), prefixes '+'.
 * - Removes spaces, dashes, parentheses, dots.
 * - Does not corrupt other international numbers.
 */
export function normalizePhoneNumberE164(rawNumber: string): string {
  if (!rawNumber || typeof rawNumber !== "string") return "";

  const trimmed = rawNumber.trim();
  const startsWithPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");

  if (!digitsOnly) return "";

  // If already prefixed with +, preserve valid international format
  if (startsWithPlus) {
    return `+${digitsOnly}`;
  }

  // 10-digit Indian mobile number
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }

  // 11-digit number with leading zero (e.g. 09876543210)
  if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    return `+91${digitsOnly.substring(1)}`;
  }

  // 12-digit number starting with 91 without plus
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return `+${digitsOnly}`;
  }

  // Fallback for valid international numbers entered without +
  return `+${digitsOnly}`;
}

/**
 * Normalizes phone numbers to digits only without leading '+' (backwards compatibility).
 */
export function normalizePhoneNumber(rawNumber: string): string {
  const e164 = normalizePhoneNumberE164(rawNumber);
  return e164.replace(/^\+/, "");
}

/**
 * Formats sender address for Twilio WhatsApp (must start with "whatsapp:+").
 */
function formatTwilioSender(rawFrom: string): string {
  if (!rawFrom) return "";
  let cleaned = rawFrom.trim();

  // Strip existing whatsapp: prefix to normalize the phone number part
  if (cleaned.toLowerCase().startsWith("whatsapp:")) {
    cleaned = cleaned.substring(9).trim();
  }

  // Ensure leading plus
  if (!cleaned.startsWith("+")) {
    cleaned = `+${cleaned.replace(/\D/g, "")}`;
  }

  return `whatsapp:${cleaned}`;
}

/**
 * Sends a WhatsApp message via Twilio WhatsApp API.
 * Never logs credentials or authorization headers.
 * Uses ContentSid and ContentVariables for templates, or Body for freeform sessions.
 */
async function sendTwilioWhatsApp(params: {
  to: string;
  contentSid?: string;
  contentVariables?: Record<string, string>;
  bodyText?: string;
}): Promise<WhatsAppServiceResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const rawFrom = process.env.TWILIO_WHATSAPP_FROM?.trim();

  if (!accountSid || !authToken || !rawFrom) {
    return {
      success: false,
      provider: "twilio",
      error: "Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM) are not configured.",
    };
  }

  const e164To = normalizePhoneNumberE164(params.to);
  if (!e164To || e164To.length < 8) {
    return {
      success: false,
      provider: "twilio",
      error: `Invalid destination phone number: "${params.to}". Must be a valid phone number with country code.`,
    };
  }

  const twilioTo = `whatsapp:${e164To}`;
  const twilioFrom = formatTwilioSender(rawFrom);

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const formData = new URLSearchParams();
  formData.append("From", twilioFrom);
  formData.append("To", twilioTo);

  if (params.contentSid) {
    formData.append("ContentSid", params.contentSid);
    formData.append("ContentVariables", JSON.stringify(params.contentVariables || {}));
  } else if (params.bodyText) {
    formData.append("Body", params.bodyText);
  } else {
    return {
      success: false,
      provider: "twilio",
      error: "Either ContentSid or message body must be provided for Twilio message.",
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data?.message || `Twilio HTTP error ${response.status} (${response.statusText})`;
      console.warn(
        `[TWILIO WHATSAPP] Delivery failed for ...${e164To.slice(-4)}: ${errorMessage}`
      );
      return {
        success: false,
        provider: "twilio",
        error: errorMessage,
        details: {
          code: data?.code,
          more_info: data?.more_info,
          status: data?.status,
        },
      };
    }

    console.log(
      `[TWILIO WHATSAPP] Message dispatched successfully to ...${e164To.slice(-4)}. SID: ${data.sid}`
    );

    return {
      success: true,
      provider: "twilio",
      messageId: data.sid,
    };
  } catch (err: any) {
    console.warn(
      `[TWILIO WHATSAPP] Network dispatch error sending to ...${e164To.slice(-4)}:`,
      err?.message || err
    );
    return {
      success: false,
      provider: "twilio",
      error: err?.message || "Failed to communicate with Twilio WhatsApp API.",
    };
  }
}

/**
 * Sends a WhatsApp message via Meta WhatsApp Cloud API.
 * Never logs credentials or authorization headers.
 */
async function sendMetaWhatsApp(
  params: SendWhatsAppMessageParams
): Promise<WhatsAppServiceResult> {
  const { to, templateName, templateLanguage = "en_US", templateComponents, text } = params;

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();

  if (!accessToken || !phoneNumberId) {
    return {
      success: false,
      provider: "meta",
      error: "Meta WhatsApp Cloud API credentials are not configured.",
    };
  }

  const normalizedTo = normalizePhoneNumber(to);
  if (!normalizedTo || normalizedTo.length < 10) {
    return {
      success: false,
      provider: "meta",
      error: `Invalid destination phone number: "${to}". Must be a valid mobile number with country code.`,
    };
  }

  let payload: any;
  if (templateName) {
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedTo,
      type: "template",
      template: {
        name: templateName,
        language: { code: templateLanguage },
        components: templateComponents || [],
      },
    };
  } else if (text) {
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedTo,
      type: "text",
      text: { preview_url: false, body: text },
    };
  } else {
    return {
      success: false,
      provider: "meta",
      error: "Either 'templateName' or 'text' must be provided.",
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
        metaError.message || `Meta API responded with HTTP status ${response.status} (${response.statusText})`;
      console.warn(
        `[META WHATSAPP] Delivery rejected for ...${normalizedTo.slice(-4)}: ${errorMessage}`
      );
      return {
        success: false,
        provider: "meta",
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
      `[META WHATSAPP] Message dispatched successfully to ...${normalizedTo.slice(-4)}. Message ID: ${messageId}`
    );

    return {
      success: true,
      provider: "meta",
      messageId,
    };
  } catch (err: any) {
    console.warn(
      `[META WHATSAPP] Network error sending to ...${normalizedTo.slice(-4)}:`,
      err?.message || err
    );
    return {
      success: false,
      provider: "meta",
      error: err?.message || "Failed to communicate with Meta WhatsApp Cloud API endpoint.",
    };
  }
}

/**
 * Universal WhatsApp dispatcher for CaterNest.
 * Prefers Twilio WhatsApp when configured, otherwise falls back to Meta Cloud API.
 * Safe and non-throwing: returns a structured result.
 */
export async function sendWhatsAppMessage(
  params: SendWhatsAppMessageParams
): Promise<WhatsAppServiceResult> {
  const isTwilioConfigured = !!(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
    process.env.TWILIO_AUTH_TOKEN?.trim() &&
    process.env.TWILIO_WHATSAPP_FROM?.trim()
  );

  // If Twilio is active provider
  if (isTwilioConfigured) {
    const messageBody =
      params.text?.trim() ||
      (params.templateName ? `Notification: ${params.templateName}` : "");

    if (!messageBody) {
      return {
        success: false,
        provider: "twilio",
        error: "Message text is required for Twilio WhatsApp dispatch.",
      };
    }

    return await sendTwilioWhatsApp({
      to: params.to,
      bodyText: messageBody,
    });
  }

  // Fallback to Meta Cloud API if configured
  const isMetaConfigured = !!(
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() &&
    process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  );

  if (isMetaConfigured) {
    return await sendMetaWhatsApp(params);
  }

  console.warn("[WHATSAPP SERVICE] Skipped: Neither Twilio nor Meta WhatsApp credentials configured.");
  return {
    success: false,
    error: "WhatsApp messaging credentials (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN or WHATSAPP_ACCESS_TOKEN) are not configured on the server.",
  };
}

/**
 * Sends Order Approved WhatsApp notification to customer via Twilio Content Template.
 * - Primary recipient: customerPhone
 * - Fallback recipient: phone
 * - Template: Sandbox pre-approved "Order Notifications" template:
 *   "Your {{1}} order of {{2}} has shipped and should be delivered on {{3}}. Details: {{4}}"
 * - Variables:
 *   {{1}} = PlanMyChoice
 *   {{2}} = Order #<orderId>
 *   {{3}} = scheduled event date
 *   {{4}} = https://www.planmychoice.com/orders
 * - Requires: TWILIO_ORDER_APPROVED_CONTENT_SID environment variable (starts with HX...)
 * - If TWILIO_ORDER_APPROVED_CONTENT_SID is missing, returns safe configuration error without falling back to Body.
 * - Non-throwing & fault-tolerant.
 */
export async function sendOrderApprovedWhatsApp(
  order: OrderApprovedNotificationParams
): Promise<WhatsAppServiceResult> {
  const recipientRaw = (order.customerPhone || order.phone || "").trim();

  if (!recipientRaw) {
    console.log(
      `[WHATSAPP NOTIFICATION] Order #${order.orderId} approved, but no customer phone number is available. Skipping WhatsApp.`
    );
    return {
      success: true,
      skipped: true,
      error: "No customer phone number available on order.",
    };
  }

  // 1. Verify TWILIO_ORDER_APPROVED_CONTENT_SID is configured
  const contentSid = process.env.TWILIO_ORDER_APPROVED_CONTENT_SID?.trim();
  if (!contentSid) {
    console.warn(
      `[WHATSAPP NOTIFICATION] Order #${order.orderId} approved, but TWILIO_ORDER_APPROVED_CONTENT_SID is not configured. Safe error returned without fallback.`
    );
    return {
      success: false,
      provider: "twilio",
      error: "Twilio ContentSid (TWILIO_ORDER_APPROVED_CONTENT_SID) is not configured in environment variables.",
    };
  }

  // 2. Build ContentVariables for Twilio "Order Notifications" template
  const eventDateText = (order.eventDate || "").trim() || "the scheduled event date";
  const contentVariables: Record<string, string> = {
    "1": "PlanMyChoice",
    "2": `Order #${order.orderId}`,
    "3": eventDateText,
    "4": "https://www.planmychoice.com/orders",
  };

  // 3. Dispatch using ContentSid and ContentVariables (NO free-form Body)
  return await sendTwilioWhatsApp({
    to: recipientRaw,
    contentSid,
    contentVariables,
  });
}

/**
 * Formats sender address for Twilio SMS (standard E.164, without whatsapp: prefix).
 */
export function formatTwilioSmsSender(rawFrom: string): string {
  if (!rawFrom) return "";
  let cleaned = rawFrom.trim();
  if (cleaned.toLowerCase().startsWith("whatsapp:")) {
    cleaned = cleaned.substring(9).trim();
  }
  return normalizePhoneNumberE164(cleaned);
}

/**
 * Result structure for Twilio SMS dispatches.
 */
export interface TwilioSmsResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
  skipped?: boolean;
  details?: any;
}

/**
 * Sends a standard SMS via Twilio Messages REST API.
 * - From = process.env.TWILIO_SMS_FROM (standard E.164, e.g. +17372508034)
 * - To = normalized customer phone in E.164 (e.g. +918885912274)
 * - Body = free-form SMS text
 * - Does NOT send ContentSid.
 * - Does NOT use whatsapp: prefix for From or To.
 * - Never logs credentials or authorization headers.
 */
export async function sendTwilioSMS(
  to: string,
  bodyText: string
): Promise<TwilioSmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const rawFrom = process.env.TWILIO_SMS_FROM?.trim() || "";

  if (!accountSid || !authToken || !rawFrom) {
    return {
      success: false,
      provider: "twilio-sms",
      error: "Twilio SMS credentials or sender (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM) are not configured.",
    };
  }

  const e164To = normalizePhoneNumberE164(to);
  if (!e164To || e164To.length < 8) {
    return {
      success: false,
      provider: "twilio-sms",
      error: `Invalid destination phone number for SMS: "${to}". Must be a valid phone number with country code.`,
    };
  }

  const e164From = formatTwilioSmsSender(rawFrom);
  if (!e164From) {
    return {
      success: false,
      provider: "twilio-sms",
      error: `Invalid sender phone number in TWILIO_SMS_FROM: "${rawFrom}".`,
    };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const formData = new URLSearchParams();
  formData.append("From", e164From);
  formData.append("To", e164To);
  formData.append("Body", bodyText);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data?.message || `Twilio SMS HTTP error ${response.status} (${response.statusText})`;
      console.warn(
        `[TWILIO SMS] Delivery failed for ...${e164To.slice(-4)}: ${errorMessage}`
      );
      return {
        success: false,
        provider: "twilio-sms",
        error: errorMessage,
        details: {
          code: data?.code,
          more_info: data?.more_info,
          status: data?.status,
        },
      };
    }

    console.log(
      `[TWILIO SMS] SMS dispatched successfully to ...${e164To.slice(-4)}. SID: ${data.sid}`
    );

    return {
      success: true,
      provider: "twilio-sms",
      messageId: data.sid,
    };
  } catch (err: any) {
    console.warn(
      `[TWILIO SMS] Network dispatch error sending to ...${e164To.slice(-4)}:`,
      err?.message || err
    );
    return {
      success: false,
      provider: "twilio-sms",
      error: err?.message || "Failed to communicate with Twilio SMS API.",
    };
  }
}

/**
 * Sends Order Approved SMS notification to customer.
 * - Uses the SAME Supabase-derived order data already passed:
 *   - orderId
 *   - customerName
 *   - customerPhone / phone
 * - SMS text:
 *   "Hi {customerName}, your PlanMyChoice order #{orderId} has been approved. We will contact you with the next steps. Thank you for choosing PlanMyChoice."
 * - Returns safe configuration error if TWILIO_SMS_FROM is missing.
 * - Non-throwing & fault-tolerant.
 */
export async function sendOrderApprovedSMS(
  order: OrderApprovedNotificationParams
): Promise<TwilioSmsResult> {
  const recipientRaw = (order.customerPhone || order.phone || "").trim();

  if (!recipientRaw) {
    console.log(
      `[SMS NOTIFICATION] Order #${order.orderId} approved, but no customer phone number is available. Skipping SMS.`
    );
    return {
      success: true,
      skipped: true,
      error: "No customer phone number available on order.",
      provider: "twilio-sms",
    };
  }

  const rawSmsFrom = process.env.TWILIO_SMS_FROM?.trim();
  if (!rawSmsFrom) {
    console.warn(
      `[SMS NOTIFICATION] Order #${order.orderId} approved, but TWILIO_SMS_FROM is not configured. Safe configuration error returned.`
    );
    return {
      success: false,
      provider: "twilio-sms",
      error: "Twilio SMS sender (TWILIO_SMS_FROM) is not configured in environment variables.",
    };
  }

  const customerName = order.customerName?.trim() || "Customer";
  const messageText = `Hi ${customerName}, your PlanMyChoice order #${order.orderId} has been approved. We will contact you with the next steps. Thank you for choosing PlanMyChoice.`;

  return await sendTwilioSMS(recipientRaw, messageText);
}
