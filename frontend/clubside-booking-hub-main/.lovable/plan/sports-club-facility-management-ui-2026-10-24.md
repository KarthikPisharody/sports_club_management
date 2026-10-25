# Sports Club & Facility Management UI

Front-end only app with realistic mock data and in-memory state (no backend). Forms update the screen instantly; changes reset on reload.

## Look and feel
- Dark slate/navy sidebar, white rounded cards, slate-blue primary, subtle borders.
- Collapsible sidebar (shrinks to icons), top bar with search, notifications dropdown, and a Member / Admin role switcher with profile avatar.
- Fonts: Space Grotesk headings, DM Sans body.

## Pages
1. **Dashboard** `/` — stat cards (active members, available venues, bookings today, pending maintenance, equipment level) + recent activity feed.
2. **Venues** `/venues` — filter by sport category (Indoor/Outdoor) and venue type; venue cards (name, hourly fee, sports, parent venue, status). Booking dialog: start/end time, member, live total cost, then mock payment step (method, status, date). New booking appears in activity and member history.
3. **Members** `/members` — directory table (id, name, email, phone, tier, wallet, delinquent badge) with search. `/members/$memberId` detail: plan card (name, fee, duration, benefits), wallet top-up, booking and equipment history. Admin only; Members see their own profile.
4. **Equipment** `/equipment` — table of assets (id, category, quantity, status) + check-out form (member, asset, issue/due date, late fee auto-calculated when overdue); active issues list with return action.
5. **Maintenance** `/maintenance` — kanban (Pending / In Progress / Completed) with ticket cards and move actions; "Report Issue" dialog.

Role behavior: Member view hides admin actions (member directory, status changes, check-out for others); Admin sees everything.

## Technical details
- Mock data in `src/data/mock.ts` for Members, Plans, Venues, Sports, Bookings, Payments, Equipment, Equipment_Issue, Maintenance_Request.
- Shared store via React context (`src/lib/store.tsx`) mounted in `__root.tsx` with the shadcn sidebar layout.
- shadcn UI, react-hook-form + zod, lucide icons, sonner toasts.
- Design tokens in `src/styles.css`; per-route head() metadata.
- Small tests for booking cost (hours x hourly fee) and late fee calculation.
