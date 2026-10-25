import { createContext, useContext, useState, type ReactNode } from "react";
import * as M from "@/data/mock";
import { lateFee } from "@/lib/calc";
import { resolveUniqueIdentity } from "@/lib/auth-identity";

export type Role = "non_member" | "member" | "admin";
export interface Activity {
  id: string;
  kind: "booking" | "issue" | "maintenance" | "wallet";
  text: string;
  at: string;
}

const now = () => new Date().toISOString();
const uid = (p: string) => `${p}${Math.floor(Math.random() * 9000 + 1000)}`;

export const money = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export type AuthResult = { ok: true } | { ok: false; status: number; message: string };

function getInitialSession(): {
  role: Role;
  username: string;
  email: string;
  phone: string;
  isAuthenticated: boolean;
  currentMemberId: string;
} {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("arenaone_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          role: parsed.role || "non_member",
          username: parsed.username || "",
          email: parsed.email || "",
          phone: parsed.phone || "",
          isAuthenticated: Boolean(parsed.isAuthenticated),
          currentMemberId: parsed.member_id || (parsed.role === "member" ? "M101" : "M000"),
        };
      }
    } catch {
      // ignore JSON errors
    }
  }
  return {
    role: "non_member",
    username: "",
    email: "",
    phone: "",
    isAuthenticated: false,
    currentMemberId: "M000",
  };
}

function useStoreState() {
  const initial = getInitialSession();

  // Authentication & Session
  const [role, setRole] = useState<Role>(initial.role);
  const [username, setUsername] = useState<string>(initial.username);
  const [email, setEmail] = useState<string>(initial.email);
  const [phone, setPhone] = useState<string>(initial.phone);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initial.isAuthenticated);
  const [currentMemberId, setCurrentMemberId] = useState(initial.currentMemberId);

  // Global Top Search Query
  const [searchQuery, setSearchQuery] = useState("");

  const [members, setMembers] = useState(M.members);
  const [venues, setVenues] = useState(M.venues);
  const [bookings, setBookings] = useState(M.bookings);
  const [payments, setPayments] = useState(M.payments);
  const [equipment, setEquipment] = useState(M.equipment);

  // Initialize issues with 5% overdue fine based on base equipment price
  const [issues, setIssues] = useState(
    M.issues.map((i) => {
      const eq = M.equipment.find((e) => e.asset_id === i.asset_id);
      const basePrice = eq?.daily_price ?? 100;
      return i.returned_date ? i : { ...i, late_fee: lateFee(i.due_date, basePrice) };
    })
  );
  const [maintenance, setMaintenance] = useState(M.maintenance);

  // Upgrade Modal State
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalAction, setUpgradeModalAction] = useState("");

  const triggerUpgradeModal = (actionName = "This action") => {
    setUpgradeModalAction(actionName);
    setUpgradeModalOpen(true);
  };

  const [activity, setActivity] = useState<Activity[]>(() => {
    const nm = (id: string) => M.members.find((m) => m.member_id === id)?.member_name;
    const vn = (id: string) => M.venues.find((v) => v.venue_id === id)?.venue_name;
    return [
      ...M.bookings.map((b) => ({
        id: b.booking_id,
        kind: "booking" as const,
        text: `${nm(b.member_id) ?? "Member"} booked ${vn(b.venue_id) ?? "venue"}`,
        at: b.start_time,
      })),
      ...M.issues.map((i) => ({
        id: i.issue_id,
        kind: "issue" as const,
        text: `${nm(i.member_id) ?? "Member"} checked out ${M.equipment.find((e) => e.asset_id === i.asset_id)?.name ?? "gear"}`,
        at: i.issue_date + "T08:00",
      })),
      ...M.maintenance.map((r) => ({
        id: r.request_id,
        kind: "maintenance" as const,
        text: `Issue reported at ${vn(r.venue_id) ?? "venue"}`,
        at: r.reported_date + "T09:00",
      })),
    ].sort((a, b) => b.at.localeCompare(a.at));
  });

  const log = (kind: Activity["kind"], text: string) =>
    setActivity((a) => [{ id: uid("A"), kind, text, at: now() }, ...a]);

  const memberName = (id: string) => members.find((m) => m.member_id === id)?.member_name ?? id;
  const venueName = (id: string) => venues.find((v) => v.venue_id === id)?.venue_name ?? id;

  const getMemberDiscounts = (memberId = currentMemberId) => {
    if (role === "non_member") return { equipment: 0, venue: 0 };
    const m = members.find((x) => x.member_id === memberId);
    if (!m) return { equipment: 0, venue: 0 };
    if (m.tier === "Platinum") return { equipment: 50, venue: 20 };
    if (m.tier === "Gold") return { equipment: 30, venue: 10 };
    return { equipment: 0, venue: 0 };
  };

  const persistSession = (session: {
    username: string;
    email: string;
    phone: string;
    role: Role;
    member_id: string;
  }) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        "arenaone_session",
        JSON.stringify({
          username: session.username,
          email: session.email,
          phone: session.phone,
          role: session.role,
          isAuthenticated: true,
          member_id: session.member_id,
        })
      );
    } catch {
      // ignore
    }
  };

  const login = (session: {
    username: string;
    email: string;
    role: Role;
    phone?: string;
    member_id?: string;
  }): AuthResult => {
    const phoneValue = (session.phone || "").trim();

    if (session.role === "member") {
      const identity = resolveUniqueIdentity(
        members.map((m) => ({
          id: m.member_id,
          username: m.username || m.member_name,
          email: m.email,
        })),
        session.username,
        session.email
      );
      if (!identity.ok) return identity;
      const matched = members.find((m) => m.member_id === identity.record.id);
      if (!matched || matched.tier === "None") {
        return {
          ok: false,
          status: 400,
          message:
            "No pre-existing member roster record found for this username and email. Contact the club administrator.",
        };
      }

      const mId = matched.member_id;
      setUsername(session.username.trim());
      setEmail(session.email.trim());
      setPhone(phoneValue || matched.phone);
      setRole("member");
      setIsAuthenticated(true);
      setCurrentMemberId(mId);
      setMembers((prev) =>
        prev.map((m) =>
          m.member_id === mId
            ? {
                ...m,
                username: session.username.trim(),
                email: session.email.trim(),
                phone: phoneValue || m.phone,
              }
            : m
        )
      );
      persistSession({
        username: session.username.trim(),
        email: session.email.trim(),
        phone: phoneValue || matched.phone,
        role: "member",
        member_id: mId,
      });
      return { ok: true };
    }

    if (session.role === "admin") {
      const identity = resolveUniqueIdentity(
        M.admins.map((a) => ({ id: a.admin_id, username: a.username, email: a.email })),
        session.username,
        session.email
      );
      if (!identity.ok) return identity;
      const admin = M.admins.find((a) => a.admin_id === identity.record.id);
      setUsername(session.username.trim());
      setEmail(session.email.trim());
      setPhone(phoneValue || admin?.phone || "");
      setRole("admin");
      setIsAuthenticated(true);
      setCurrentMemberId("M000");
      persistSession({
        username: session.username.trim(),
        email: session.email.trim(),
        phone: phoneValue || admin?.phone || "",
        role: "admin",
        member_id: "M000",
      });
      return { ok: true };
    }

    return { ok: false, status: 400, message: "Unsupported sign-in role." };
  };

  const logout = () => {
    setUsername("");
    setEmail("");
    setPhone("");
    setRole("non_member");
    setIsAuthenticated(false);
    setCurrentMemberId("M000");
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("arenaone_session");
      } catch {
        // ignore
      }
    }
  };

  const registerAndSubscribe = (userData: {
  username: string;
  email: string;
  phone: string;
  tier: "Gold" | "Platinum";
  billingCycle?: "monthly" | "yearly";
  paymentMethod?: string;
}): AuthResult & { member?: M.Member } => {
  const cleanUsername = userData.username.trim();
  const cleanEmail = userData.email.trim().toLowerCase();
  const cleanPhone = userData.phone.trim();

  // 1. Check if email or username is already taken by another account
  const existing = members.find(
    (m) => 
      m.email.toLowerCase() === cleanEmail || 
      (m.username && m.username.toLowerCase() === cleanUsername) || 
      (m.member_name && m.member_name.toLowerCase() === cleanUsername)
  );

  const plan = M.plans.find((p) => p.plan_name === userData.tier);

  // 2. If no record exists, create a brand-new non-member account on the fly!
  if (!existing) {
    const newMember: M.Member = {
      member_id: `MEM-${Date.now()}`,
      member_name: cleanUsername,
      username: cleanUsername,
      email: cleanEmail,
      phone: cleanPhone,
      tier: userData.tier,
      plan_id: plan?.plan_id ?? "P1",
      wallet_balance: 0, // Wallet starts at 0
    };

    setMembers((prev) => [...prev, newMember]);
    log("wallet", `${cleanUsername} registered and purchased ${userData.tier} Membership (${userData.billingCycle ?? "monthly"})`);
    return { ok: true, member: newMember };
  }

  // 3. If an existing record is found, update their subscription and details
  const updated: M.Member = {
    ...existing,
    member_name: cleanUsername,
    username: cleanUsername,
    email: cleanEmail,
    phone: cleanPhone,
    tier: userData.tier,
    plan_id: plan?.plan_id ?? existing.plan_id,
    wallet_balance: existing.member_id === "M000" ? 0 : existing.wallet_balance,
  };

  setMembers((prev) => prev.map((m) => (m.member_id === existing.member_id ? updated : m)));
  log("wallet", `${cleanUsername} purchased ${userData.tier} Membership (${userData.billingCycle ?? "monthly"})`);
  return { ok: true, member: updated };
};

  const upgradeMembership = (tier: "Gold" | "Platinum", billingCycle: "monthly" | "yearly" = "monthly") => {
    const plan = M.plans.find((p) => p.plan_name === tier);
    if (!plan) return;

    setRole("member");
    setMembers((prev) =>
      prev.map((m) =>
        m.member_id === currentMemberId
          ? {
              ...m,
              tier,
              plan_id: plan.plan_id,
              wallet_balance: m.wallet_balance,
            }
          : m
      )
    );

    log("wallet", `${memberName(currentMemberId)} upgraded to ${tier} Membership (${billingCycle})`);
  };

  return {
    role,
    setRole,
    username,
    setUsername,
    email,
    setEmail,
    phone,
    setPhone,
    isAuthenticated,
    setIsAuthenticated,
    login,
    logout,
    registerAndSubscribe,

    searchQuery,
    setSearchQuery,

    currentMemberId,
    setCurrentMemberId,
    members,
    venues,
    bookings,
    payments,
    equipment,
    issues,
    maintenance,
    activity,
    plans: M.plans,
    sports: M.sports,
    memberName,
    venueName,
    getMemberDiscounts,

    // Upgrade Modal controls
    upgradeModalOpen,
    setUpgradeModalOpen,
    upgradeModalAction,
    triggerUpgradeModal,
    upgradeMembership,

    // Venue booking
    addBooking(
      b: Omit<M.VenueBooking, "booking_id" | "payment_id">,
      p: Pick<M.Payment, "payment_method" | "payment_status" | "payment_date">
    ) {
      if (role === "non_member") {
        triggerUpgradeModal("Venue Booking");
        return;
      }
      const booking_id = uid("B");
      const payment_id = uid("P");
      setBookings((x) => [{ ...b, booking_id, payment_id }, ...x]);
      setPayments((x) => [{ ...p, payment_id, booking_id, amount: b.total_cost }, ...x]);
      if (p.payment_method === "Wallet" && p.payment_status === "Paid") {
        setMembers((ms) =>
          ms.map((m) =>
            m.member_id === b.member_id ? { ...m, wallet_balance: m.wallet_balance - b.total_cost } : m
          )
        );
      }
      log("booking", `${memberName(b.member_id)} booked ${venueName(b.venue_id)}`);
    },

    topUp(member_id: string, amount: number) {
      setMembers((ms) =>
        ms.map((m) => (m.member_id === member_id ? { ...m, wallet_balance: m.wallet_balance + amount } : m))
      );
      log("wallet", `${memberName(member_id)} topped up ${money(amount)}`);
    },

    // Equipment Checkout (5% fine logic with base equipment price)
    checkout(i: Omit<M.EquipmentIssue, "issue_id" | "late_fee">) {
      if (role === "non_member") {
        triggerUpgradeModal("Equipment Checkout");
        return;
      }
      const eq = equipment.find((e) => e.asset_id === i.asset_id);
      const basePrice = eq?.daily_price ?? 100;
      setIssues((x) => [{ ...i, issue_id: uid("I-"), late_fee: lateFee(i.due_date, basePrice) }, ...x]);
      setEquipment((eqs) =>
        eqs.map((e) => {
          if (e.asset_id !== i.asset_id) return e;
          const a = e.available_quantity - 1;
          return { ...e, available_quantity: a, status: a <= 0 ? "In Use" : e.status };
        })
      );
      log("issue", `${memberName(i.member_id)} checked out ${eq?.name ?? "gear"}`);
    },

    returnItem(issue_id: string) {
      const it = issues.find((i) => i.issue_id === issue_id);
      if (!it) return;
      const eq = equipment.find((e) => e.asset_id === it.asset_id);
      const basePrice = eq?.daily_price ?? 100;
      setIssues((x) =>
        x.map((i) =>
          i.issue_id === issue_id
            ? { ...i, returned_date: now().slice(0, 10), late_fee: lateFee(i.due_date, basePrice) }
            : i
        )
      );
      setEquipment((eqs) =>
        eqs.map((e) =>
          e.asset_id === it.asset_id
            ? {
                ...e,
                available_quantity: e.available_quantity + 1,
                status: e.status === "In Use" ? "Available" : e.status,
              }
            : e
        )
      );
      log("issue", `${memberName(it.member_id)} returned equipment`);
    },

    // Admin Equipment Controls
    addEquipment(e: { name: string; category: string; total_quantity: number; daily_price: number }) {
      const asset_id = `EQ-${Math.floor(100 + Math.random() * 900)}`;
      const total = Number(e.total_quantity);
      const newItem: M.Equipment = {
        asset_id,
        name: e.name,
        category: e.category,
        total_quantity: total,
        available_quantity: total,
        daily_price: Number(e.daily_price),
        status: "Available",
      };
      setEquipment((prev) => [newItem, ...prev]);
      log("issue", `Admin added inventory: ${e.name} (${asset_id})`);
    },

    removeEquipment(asset_id: string) {
      const item = equipment.find((e) => e.asset_id === asset_id);
      setEquipment((prev) => prev.filter((e) => e.asset_id !== asset_id));
      if (item) log("issue", `Admin removed equipment: ${item.name}`);
    },

    setEquipmentPrice(asset_id: string, daily_price: number) {
      setEquipment((prev) =>
        prev.map((e) => (e.asset_id === asset_id ? { ...e, daily_price } : e))
      );
    },

    // Admin Venue Controls
    addVenue(v: { venue_name: string; venue_type: string; base_hourly_fee: number; sport_ids: string[]; parent_venue_id?: string }) {
      const venue_id = `V${venues.length + 1}`;
      const newV: M.Venue = {
        venue_id,
        venue_name: v.venue_name,
        venue_type: v.venue_type,
        base_hourly_fee: Number(v.base_hourly_fee),
        sport_ids: v.sport_ids,
        parent_venue_id: v.parent_venue_id || undefined,
        status: "Available",
      };
      setVenues((prev) => [...prev, newV]);
      log("booking", `Admin added new facility: ${v.venue_name}`);
    },

    removeVenue(venue_id: string) {
      const v = venues.find((x) => x.venue_id === venue_id);
      setVenues((prev) => prev.filter((x) => x.venue_id !== venue_id));
      if (v) log("booking", `Admin removed facility: ${v.venue_name}`);
    },

    setVenuePrice(venue_id: string, base_hourly_fee: number) {
      setVenues((prev) =>
        prev.map((x) => (x.venue_id === venue_id ? { ...x, base_hourly_fee } : x))
      );
    },

    setVenueStatus(venue_id: string, status: M.VenueStatus) {
      setVenues((v) => v.map((x) => (x.venue_id === venue_id ? { ...x, status } : x)));
    },

    // Maintenance Operations Controls
    reportIssue(venue_id: string, description: string) {
      setMaintenance((x) => [
        {
          request_id: uid("MR-"),
          venue_id,
          description,
          reported_date: now().slice(0, 10),
          request_status: "Pending",
          priority: "Medium",
        },
        ...x,
      ]);
      log("maintenance", `Issue reported at ${venueName(venue_id)}`);
    },

    addMaintenance(m: { venue_id: string; description: string; priority?: "Low" | "Medium" | "High" | "Critical" }) {
      const reqId = uid("MR-");
      const newM: M.MaintenanceRequest = {
        request_id: reqId,
        venue_id: m.venue_id,
        description: m.description,
        reported_date: now().slice(0, 10),
        request_status: "Pending",
        priority: m.priority || "Medium",
      };
      setMaintenance((prev) => [newM, ...prev]);
      // Mark venue as Under Maintenance
      setVenues((v) => v.map((x) => (x.venue_id === m.venue_id ? { ...x, status: "Under Maintenance" } : x)));
      log("maintenance", `Admin scheduled maintenance for ${venueName(m.venue_id)}`);
    },

    removeMaintenance(request_id: string) {
      const item = maintenance.find((m) => m.request_id === request_id);
      setMaintenance((prev) => prev.filter((m) => m.request_id !== request_id));
      if (item) {
        log("maintenance", `Admin removed maintenance operation ${request_id}`);
      }
    },

    moveRequest(request_id: string, request_status: M.RequestStatus) {
      setMaintenance((x) => x.map((r) => (r.request_id === request_id ? { ...r, request_status } : r)));
    },
  };
}

const Ctx = createContext<ReturnType<typeof useStoreState> | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={useStoreState()}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
