/**
 * Application status model for the Camden produce-drop pilot.
 *
 * Canonical statuses (new submissions):
 *   pending_review → selected | waitlisted | declined
 *   waitlisted → selected | declined
 *   selected → assigned → ready
 *
 * Legacy statuses (pre-application-first) are mapped for display and capacity
 * so existing InstantDB rows keep working until an optional migration runs.
 */

export type ApplicationStatus =
  | "pending_review"
  | "selected"
  | "waitlisted"
  | "declined"
  | "assigned"
  | "ready";

/** Legacy statuses that may still exist in InstantDB. */
export type LegacyOrderStatus =
  | "received"
  | "in_queue"
  | "confirmed"
  | "waitlisted_priority"
  | "waitlisted_standard";

export type AnyOrderStatus = ApplicationStatus | LegacyOrderStatus | string;

export const TOTAL_CAPACITY = 35;

/** Administrator-facing selection targets (guidance only, not hard caps). */
export const SELECTION_TARGETS = {
  equity: 8,
  anchor: 20,
  steward: 7,
} as const;

/** Statuses that hold a seat against the 35-bundle capacity. */
export const SEAT_HOLDING_STATUSES: readonly string[] = [
  "selected",
  "assigned",
  "ready",
  // Legacy: previously confirmed seats stored as in_queue / confirmed
  "in_queue",
  "confirmed",
] as const;

/**
 * Statuses that block a second application for the same market.
 * Declined applications do not block resubmission.
 */
export const ACTIVE_APPLICATION_STATUSES: readonly string[] = [
  "pending_review",
  "selected",
  "waitlisted",
  "assigned",
  "ready",
  // Legacy active / seat-holding
  "received",
  "in_queue",
  "confirmed",
  "waitlisted_priority",
  "waitlisted_standard",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  pending_review: "Application Under Review",
  selected: "Selected for the Produce Drop",
  waitlisted: "Waitlisted",
  declined: "Not Selected",
  assigned: "Pickup/Delivery Assigned",
  ready: "Ready for Pickup/Delivery",
  // Legacy display mapping
  received: "Application Under Review",
  in_queue: "Selected for the Produce Drop",
  confirmed: "Selected for the Produce Drop",
  waitlisted_priority: "Waitlisted",
  waitlisted_standard: "Waitlisted",
};

/** Progress bar steps for applicant-facing application tracking. */
export const STATUS_PROGRESS_ORDER: ApplicationStatus[] = [
  "pending_review",
  "selected",
  "assigned",
  "ready",
];

const ALLOWED_TRANSITIONS: Record<string, readonly string[]> = {
  pending_review: ["selected", "waitlisted", "declined"],
  waitlisted: ["selected", "declined"],
  selected: ["assigned"],
  assigned: ["ready"],
  // Legacy → allow admin to move into the new model
  received: ["selected", "waitlisted", "declined"],
  waitlisted_priority: ["selected", "declined"],
  waitlisted_standard: ["selected", "declined"],
  in_queue: ["assigned"],
  confirmed: ["assigned"],
};

export function holdsSeat(status: string): boolean {
  return SEAT_HOLDING_STATUSES.includes(status);
}

export function isActiveApplication(status: string): boolean {
  return ACTIVE_APPLICATION_STATUSES.includes(status);
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function canTransition(from: string, to: string): boolean {
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/** Map any status onto the progress-bar index (or -1 if terminal/non-progress). */
export function getProgressIndex(status: string): number {
  if (status === "pending_review" || status === "received") return 0;
  if (
    status === "selected" ||
    status === "in_queue" ||
    status === "confirmed"
  ) {
    return 1;
  }
  if (status === "assigned") return 2;
  if (status === "ready") return 3;
  return -1;
}

export function isWaitlistedStatus(status: string): boolean {
  return (
    status === "waitlisted" ||
    status === "waitlisted_priority" ||
    status === "waitlisted_standard"
  );
}

export function isDeclinedStatus(status: string): boolean {
  return status === "declined";
}
