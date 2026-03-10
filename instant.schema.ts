import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    orders: i.entity({
      timestamp: i.date(),
      tier: i.string(),
      status: i.string(),
      assignedNodeId: i.string().optional(),
      marketId: i.string(),
      waitlistType: i.string().optional(),
    }),
    nodes: i.entity({
      name: i.string(),
      capacity: i.number(),
      remainingCapacity: i.number(),
    }),
    markets: i.entity({
      marketId: i.string().unique().indexed(),
      totalCapacity: i.number(),
      baseEquitySeats: i.number(),
      equityCapPercent: i.number(),
      anchorCapPercent: i.number(),
      stewardCapPercent: i.number(),
      status: i.string(),
      createdAt: i.date(),
    }),
  },
  links: {
    orderUser: {
      forward: { on: "orders", has: "one", label: "$user" },
      reverse: { on: "$users", has: "many", label: "orders" },
    },
    orderMarket: {
      forward: { on: "orders", has: "one", label: "market" },
      reverse: { on: "markets", has: "many", label: "orders" },
    },
    orderNode: {
      forward: { on: "orders", has: "one", label: "node" },
      reverse: { on: "nodes", has: "many", label: "orders" },
    },
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
