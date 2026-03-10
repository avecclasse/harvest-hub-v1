import type { InstantRules } from "@instantdb/react";

const rules = {
  orders: {
    allow: {
      view: "true",
      create: "auth.id != null",
      update: "auth.id in data.ref('$user.id')",
      delete: "auth.id in data.ref('$user.id')",
    },
  },
  nodes: {
    allow: {
      view: "true",
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },
  markets: {
    allow: {
      view: "true",
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },
} satisfies InstantRules;

export default rules;
