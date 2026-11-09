import "server-only";
import { Resend } from "resend";
import { serverEnv } from "@/lib/env";

let client: Resend | undefined;

function resend(): Resend {
  const { RESEND_API_KEY } = serverEnv();
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  client ??= new Resend(RESEND_API_KEY);
  return client;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  idempotencyKey,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
}) {
  const { data, error } = await resend().emails.send(
    { from: serverEnv().EMAIL_FROM, to, subject, html, text },
    idempotencyKey ? { idempotencyKey } : undefined,
  );
  if (error) throw new Error(`Resend: ${error.message}`);
  return data;
}
