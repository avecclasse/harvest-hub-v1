# Harvest Hub

A customer-facing web app for reserving weekly produce bundles, choosing pricing tiers (Equity, Anchor, Steward), and tracking orders through a community capacity pool system.

## Tech Stack

- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS
- InstantDB (@instantdb/react)

## Setup

1. **Install dependencies** (already done if you ran `npm install`):
   ```bash
   npm install
   ```

2. **Push schema and permissions to InstantDB**:
   ```bash
   npx instant-cli@latest push schema
   npx instant-cli@latest push perms
   ```
   Log in with your InstantDB account when prompted. The app uses App ID: `4f628985-38cd-4ff4-bad6-49193761e751`.

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Pages

- `/` — Home with hero and links
- `/login` — Magic Code email authentication
- `/reserve` — Reserve bundle (requires auth)
- `/dashboard` — Community capacity pool dashboard
- `/learn` — Mission, sourcing, and Devoir info
- `/orders` — My orders and tracking (requires auth)

## Capacity Rules

- **Base Equity seats**: 5 per market
- **Steward unlock**: 1 Steward reservation = 1 additional Equity seat
- **Tier caps**: Equity ≤30%, Anchor ≤55%, Steward ≤25%
- **Priority waitlist**: Equity users when Equity seats full (FIFO promotion)
- **Standard waitlist**: When market is full
