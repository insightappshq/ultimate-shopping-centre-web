export type ContactKind = "email" | "phone";

/** Verification state of the two sign-in identifiers on one account. */
export interface ContactStatus {
  /** How the account was created / is usually signed into. */
  primary: ContactKind;
  email: string | null;
  emailVerified: boolean;
  /** Email added but not yet confirmed with a code. */
  pendingEmail: string | null;
  /** E.164, e.g. +919876543210. */
  phone: string | null;
  phoneVerified: boolean;
  pendingPhone: string | null;
}

export function isFullyVerified(status: ContactStatus): boolean {
  return status.emailVerified && status.phoneVerified;
}
