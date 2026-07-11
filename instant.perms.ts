import type { InstantRules } from "@instantdb/react";

/**
 * InstantDB permissions for application-first selection.
 *
 * Admin allowlist is baked from NEXT_PUBLIC_ADMIN_EMAILS at push/load time.
 * After changing that env var, re-run:
 *   npx instant-cli@latest push perms
 *
 * Note: @instantdb/react@0.17 types `bind` as string[] pairs and omit `fields`
 * in InstantRules. Instant's server still accepts field rules; we assert the type.
 *
 * Public aggregate limitation: Instant has no server-side COUNT. The dashboard
 * reads order tier/status rows to aggregate client-side. Emails stay on $users
 * and are restricted to owner/admin. assignedNodeId is hidden from anonymous viewers.
 */

function buildIsAdminCel(): string {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
  const emails = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length === 0) {
    return "false";
  }
  const quoted = emails.map((e) => `'${e.replace(/'/g, "\\'")}'`).join(", ");
  return `auth.email in [${quoted}]`;
}

const isAdmin = buildIsAdminCel();

const rules = {
  attrs: {
    allow: {
      create: "false",
    },
  },
  $users: {
    allow: {
      view: "auth.id == data.id || isAdmin",
    },
    bind: ["isAdmin", isAdmin],
    fields: {
      email: "auth.id == data.id || isAdmin",
    },
  },
  orders: {
    allow: {
      view: "true",
      create:
        "auth.id != null && isOwner && data.status == 'pending_review'",
      update: "isAdmin",
      delete: "isAdmin",
    },
    bind: [
      "isAdmin",
      isAdmin,
      "isOwner",
      "auth.id in data.ref('$user.id')",
    ],
    fields: {
      assignedNodeId: "isOwner || isAdmin",
    },
  },
  nodes: {
    allow: {
      view: "true",
      create: "isAdmin",
      update: "isAdmin",
      delete: "isAdmin",
    },
    bind: ["isAdmin", isAdmin],
  },
  markets: {
    allow: {
      view: "true",
      create: "isAdmin",
      update: "isAdmin",
      delete: "isAdmin",
    },
    bind: ["isAdmin", isAdmin],
  },
} as InstantRules;

export default rules;
