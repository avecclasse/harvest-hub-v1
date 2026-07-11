/**
 * Admin allowlist helpers.
 *
 * NEXT_PUBLIC_ADMIN_EMAILS is a comma-separated list of admin emails.
 * The same list is baked into InstantDB permission CEL when you push perms
 * (see instant.perms.ts). Re-push perms whenever the allowlist changes.
 */

export function getAdminEmails(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = getAdminEmails();
  if (admins.length === 0) return false;
  return admins.includes(email.trim().toLowerCase());
}

/**
 * CEL expression for InstantDB `bind.isAdmin`.
 * Evaluates to `false` when no emails are configured (deny-by-default).
 */
export function buildIsAdminCel(): string {
  const emails = getAdminEmails();
  if (emails.length === 0) {
    return "false";
  }
  const quoted = emails.map((e) => `'${e.replace(/'/g, "\\'")}'`).join(", ");
  return `auth.email in [${quoted}]`;
}
