import twilio from "twilio";

let cachedClient = null;

export function getTwilioClient() {
  if (cachedClient) return cachedClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials are not configured");
  }

  cachedClient = twilio(accountSid, authToken);
  return cachedClient;
}

export async function sendSMS({ to, body }) {
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!from) {
    throw new Error("TWILIO_PHONE_NUMBER is not configured");
  }

  const client = getTwilioClient();

  const result = await client.messages.create({
    from,
    to,
    body,
  });

  return result;
}