/**
 * Client-safe auth settings.
 *
 * Phone codes are generated and checked by Twilio Verify (configured in the
 * Supabase dashboard), so their length follows the Verify service's
 * "Code length" setting (default 6), not Supabase's SMS OTP length.
 * Email codes are Supabase's own (`npm run auth:configure` sets 6 digits).
 */
function clampLength(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 4 && n <= 10 ? n : fallback;
}

export const authConfig = {
  emailOtpLength: 6,
  phoneOtpLength: clampLength(process.env.NEXT_PUBLIC_PHONE_OTP_LENGTH, 6),
  /** Offer "Send on WhatsApp" — requires the WhatsApp channel on the Twilio Verify service. */
  whatsappOtp: process.env.NEXT_PUBLIC_PHONE_OTP_WHATSAPP === "true",
  /** Supabase permits one OTP request per user per this many seconds. */
  resendSeconds: 60,
} as const;

export type OtpDelivery = "sms" | "whatsapp";

export function otpLengthFor(channel: "email" | "phone"): number {
  return channel === "email" ? authConfig.emailOtpLength : authConfig.phoneOtpLength;
}
