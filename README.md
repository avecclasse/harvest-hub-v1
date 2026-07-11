# Harvest Hub

A customer-facing web app for a Camden produce-drop pilot: apply for a seasonal produce bundle, choose a participation option (Supported, Standard, or Steward), and track applications while administrators select the final participants.

## Tech Stack

- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS
- InstantDB (@instantdb/react)

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure admin allowlist** — copy `.env.example` to `.env.local` and set:
   ```bash
   NEXT_PUBLIC_ADMIN_EMAILS=you@example.com,other-admin@example.com
   ```
   This list gates the `/admin/applications` UI **and** is baked into InstantDB permission rules when you push perms. After changing it, re-push permissions.

3. **Push schema and permissions to InstantDB** (with `.env.local` loaded so admin emails are included):
   ```bash
   # PowerShell example:
   Get-Content .env.local | ForEach-Object { if ($_ -match '^([^#=]+)=(.*)$') { Set-Item -Path "env:$($matches[1])" -Value $matches[2] } }
   npx instant-cli@latest push schema
   npx instant-cli@latest push perms
   ```
   Log in with your InstantDB account when prompted. The app uses App ID: `4f628985-38cd-4ff4-bad6-49193761e751`.

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Open applications** — sign in as an allowlisted admin and visit `/admin/applications` once. That page creates `market-current` if it does not exist so applicants can submit.

## Pages

- `/` — Home with pilot overview, participation options, and how it works
- `/login` — Magic Code email authentication
- `/reserve` — Apply for the Camden Produce Drop (login required to submit)
- `/dashboard` — Community Impact (counts **selected** participants only)
- `/learn` — Mission, sourcing, and Devoir info
- `/orders` — My Applications (requires auth)
- `/admin/applications` — Admin review and selection (allowlisted emails only)

## Application → selection workflow

1. A person submits an application on `/reserve` and chooses Supported, Standard, or Steward.
2. The record is stored as `pending_review`. No seat is held; the public dashboard does not change.
3. An administrator reviews applications on `/admin/applications` (FIFO) and chooses Select, Waitlist, or Decline.
4. Only `selected`, `assigned`, and `ready` count toward the 35-bundle capacity and Community Impact dashboard.
5. Administrators may later Assign a pickup node (`assigned`) and mark Ready (`ready`).

### Canonical statuses

| Status | Applicant label |
|--------|-----------------|
| `pending_review` | Application Under Review |
| `selected` | Selected for the Produce Drop |
| `waitlisted` | Waitlisted |
| `declined` | Not Selected |
| `assigned` | Pickup/Delivery Assigned |
| `ready` | Ready for Pickup/Delivery |

### Capacity

- **Hard cap**: 35 selected participants total (admin cannot select a 36th).
- **Selection targets (guidance only)**: 8 Supported / 20 Standard / 7 Steward. Exceeding a tier target shows a warning; it does not auto-reject.
- **Steward unlock (dashboard)**: each selected Steward unlocks one additional Supported seat display (base 5 + stewards).
- Pending, waitlisted, and declined applications never hold seats.

## Security notes

- Applicants can create their own `pending_review` applications and view their own records.
- Applicants **cannot** update status, tier, node, or market after submission (InstantDB `update` is admin-only).
- Only allowlisted admin emails can update applications, markets, and nodes.
- **Public aggregate limitation**: InstantDB has no server-side COUNT. The dashboard reads order `tier`/`status` rows to aggregate client-side. Applicant emails live on `$users` and are restricted to the owner and admins. `assignedNodeId` is hidden from anonymous viewers via field rules.

## Legacy status migration

Older rows may still use `in_queue`, `confirmed`, `waitlisted_priority`, or `waitlisted_standard`.

**Compatibility (automatic in app code):**

- `in_queue` / `confirmed` → counted as seat-holding (same as `selected`) and labeled “Selected for the Produce Drop”
- `waitlisted_*` → labeled Waitlisted; do **not** hold seats
- `received` → labeled under review; does not hold a seat

**Optional one-time rewrite** (Instant explorer or Admin SDK):

- `in_queue` | `confirmed` → `selected`
- `waitlisted_priority` | `waitlisted_standard` → `waitlisted`
- leave `assigned` / `ready` unchanged

## Reset market data

```bash
node scripts/reset-market-current.mjs
```

Deletes `market-current` orders/nodes, then recreates an empty open market (capacity 35) so applications can be accepted again.
