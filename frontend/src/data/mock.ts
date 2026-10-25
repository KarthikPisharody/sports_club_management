export type Tier = "Gold" | "Platinum" | "Silver" | "Bronze" | "None";

export interface MembershipPlan {
  plan_id: string;
  plan_name: "Gold" | "Platinum";
  monthly_fee: number;
  yearly_fee: number;
  equipment_discount: number;
  venue_discount: number;
  duration: string;
  benefits: string[];
}

export interface Member {
  member_id: string;
  member_name: string;
  username: string;
  email: string;
  phone: string;
  tier: Tier;
  wallet_balance: number;
  is_delinquent: boolean;
  plan_id: string;
  joined: string;
}

export interface AdminAccount {
  admin_id: string;
  username: string;
  email: string;
  phone: string;
}

export interface Sport {
  sport_id: string;
  sport_name: string;
  category: "Indoor" | "Outdoor";
}

export type VenueStatus = "Available" | "Booked" | "Under Maintenance";

export interface Venue {
  venue_id: string;
  venue_name: string;
  venue_type: string;
  base_hourly_fee: number;
  sport_ids: string[];
  parent_venue_id?: string;
  status: VenueStatus;
}

export type PaymentMethod = "Wallet" | "Card" | "UPI" | "Cash";

export interface Payment {
  payment_id: string;
  booking_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: "Paid" | "Pending" | "Failed";
  payment_date: string;
}

export interface VenueBooking {
  booking_id: string;
  venue_id: string;
  member_id: string;
  start_time: string;
  end_time: string;
  total_cost: number;
  payment_id?: string;
}

export type EquipStatus = "Available" | "In Use" | "Under Maintenance";

export interface Equipment {
  asset_id: string;
  name: string;
  category: string;
  total_quantity: number;
  available_quantity: number;
  daily_price: number;
  status: EquipStatus;
}

export interface EquipmentIssue {
  issue_id: string;
  member_id: string;
  asset_id: string;
  issue_date: string;
  due_date: string;
  returned_date?: string;
  late_fee: number;
}

export type RequestStatus = "Pending" | "In Progress" | "Completed";

export interface MaintenanceRequest {
  request_id: string;
  venue_id: string;
  reported_date: string;
  description: string;
  request_status: RequestStatus;
  priority?: "Low" | "Medium" | "High" | "Critical";
  technician_notes?: string;
}

const today = new Date();
const d = (offset: number) => {
  const x = new Date(today);
  x.setDate(x.getDate() + offset);
  return x.toISOString().slice(0, 10);
};
const t = (offset: number, hour: number) => `${d(offset)}T${String(hour).padStart(2, "0")}:00`;

export const plans: MembershipPlan[] = [
  {
    plan_id: "PL-GOLD",
    plan_name: "Gold",
    monthly_fee: 2000,
    yearly_fee: 20000,
    equipment_discount: 30,
    venue_discount: 10,
    duration: "1 Month / 1 Year",
    benefits: [
      "30% equipment rental discount",
      "10% venue booking discount",
      "Priority court booking (7 days in advance)",
      "Standard locker room access",
      "2 guest passes per month",
    ],
  },
  {
    plan_id: "PL-PLAT",
    plan_name: "Platinum",
    monthly_fee: 3000,
    yearly_fee: 30000,
    equipment_discount: 50,
    venue_discount: 20,
    duration: "1 Month / 1 Year",
    benefits: [
      "50% equipment rental discount",
      "20% venue booking discount",
      "Priority court booking (14 days in advance)",
      "4 complimentary court hours monthly",
      "Unlimited guest day passes",
      "Full sauna & wellness lounge access",
    ],
  },
];

const rawMembers: [string, string, Tier, number, boolean][] = [
  ["Aarav Mehta", "9820011223", "Gold", 2450, false],
  ["Priya Sharma", "9811122334", "Platinum", 5100, false],
  ["Rohan Kapoor", "9899988776", "Gold", 180, true],
  ["Ananya Iyer", "9765432109", "Platinum", 1600, false],
  ["Kabir Singh", "9845612378", "Gold", 0, true],
  ["Meera Nair", "9934567812", "Platinum", 2350, false],
  ["Vikram Rao", "9887766554", "Platinum", 8900, false],
  ["Sara Thomas", "9123456780", "Gold", 420, false],
  ["Arjun Desai", "9001122334", "Gold", 750, false],
  ["Isha Patel", "9556677889", "Platinum", 3200, false],
];

export const members: Member[] = [
  ...rawMembers.map(([n, p, tier, w, del], i) => ({
    member_id: `M${String(101 + i)}`,
    member_name: n,
    username: n,
    email: n.toLowerCase().replace(" ", ".") + "@clubmail.com",
    phone: "+91 " + p,
    tier,
    wallet_balance: w,
    is_delinquent: del,
    plan_id: tier === "Platinum" ? "PL-PLAT" : "PL-GOLD",
    joined: d(-30 * (i + 2)),
  })),
  {
    member_id: "M000",
    member_name: "Suresh Kumar (Guest)",
    username: "Suresh Kumar",
    email: "suresh.guest@gmail.com",
    phone: "+91 9777766665",
    tier: "None",
    wallet_balance: 0,
    is_delinquent: false,
    plan_id: "",
    joined: d(0),
  },
];

export const admins: AdminAccount[] = [
  {
    admin_id: "A1",
    username: "Dana Lopez",
    email: "dana.admin@arenaone.club",
    phone: "+91 9888877771",
  },
];

export const sports: Sport[] = [
  { sport_id: "S1", sport_name: "Badminton", category: "Indoor" },
  { sport_id: "S2", sport_name: "Squash", category: "Indoor" },
  { sport_id: "S3", sport_name: "Basketball", category: "Indoor" },
  { sport_id: "S4", sport_name: "Swimming", category: "Indoor" },
  { sport_id: "S5", sport_name: "Tennis", category: "Outdoor" },
  { sport_id: "S6", sport_name: "Football", category: "Outdoor" },
  { sport_id: "S7", sport_name: "Cricket", category: "Outdoor" },
];

export const venues: Venue[] = [
  { venue_id: "V1", venue_name: "Main Sports Hall", venue_type: "Hall", base_hourly_fee: 800, sport_ids: ["S1", "S3"], status: "Available" },
  { venue_id: "V2", venue_name: "Badminton Court A", venue_type: "Court", base_hourly_fee: 300, sport_ids: ["S1"], parent_venue_id: "V1", status: "Available" },
  { venue_id: "V3", venue_name: "Badminton Court B", venue_type: "Court", base_hourly_fee: 300, sport_ids: ["S1"], parent_venue_id: "V1", status: "Available" },
  { venue_id: "V4", venue_name: "Squash Box 1", venue_type: "Court", base_hourly_fee: 350, sport_ids: ["S2"], status: "Under Maintenance" },
  { venue_id: "V5", venue_name: "Olympic Pool", venue_type: "Pool", base_hourly_fee: 600, sport_ids: ["S4"], status: "Available" },
  { venue_id: "V6", venue_name: "Clay Tennis Court", venue_type: "Court", base_hourly_fee: 500, sport_ids: ["S5"], status: "Available" },
  { venue_id: "V7", venue_name: "North Turf Field", venue_type: "Field", base_hourly_fee: 1500, sport_ids: ["S6", "S7"], status: "Booked" },
  { venue_id: "V8", venue_name: "Cricket Nets", venue_type: "Nets", base_hourly_fee: 400, sport_ids: ["S7"], parent_venue_id: "V7", status: "Available" },
];

export const bookings: VenueBooking[] = [
  { booking_id: "B5001", venue_id: "V2", member_id: "M101", start_time: t(0, 9), end_time: t(0, 11), total_cost: 540, payment_id: "P9001" },
  { booking_id: "B5002", venue_id: "V7", member_id: "M107", start_time: t(0, 16), end_time: t(0, 18), total_cost: 2400, payment_id: "P9002" },
  { booking_id: "B5003", venue_id: "V5", member_id: "M102", start_time: t(0, 7), end_time: t(0, 8), total_cost: 480, payment_id: "P9003" },
  { booking_id: "B5004", venue_id: "V6", member_id: "M106", start_time: t(-1, 17), end_time: t(-1, 19), total_cost: 800, payment_id: "P9004" },
  { booking_id: "B5005", venue_id: "V3", member_id: "M110", start_time: t(-2, 10), end_time: t(-2, 11), total_cost: 270, payment_id: "P9005" },
];

export const payments: Payment[] = [
  { payment_id: "P9001", booking_id: "B5001", amount: 540, payment_method: "Wallet", payment_status: "Paid", payment_date: d(0) },
  { payment_id: "P9002", booking_id: "B5002", amount: 2400, payment_method: "Card", payment_status: "Paid", payment_date: d(0) },
  { payment_id: "P9003", booking_id: "B5003", amount: 480, payment_method: "UPI", payment_status: "Paid", payment_date: d(0) },
  { payment_id: "P9004", booking_id: "B5004", amount: 800, payment_method: "Cash", payment_status: "Pending", payment_date: d(-1) },
  { payment_id: "P9005", booking_id: "B5005", amount: 270, payment_method: "Wallet", payment_status: "Paid", payment_date: d(-2) },
];

export const equipment: Equipment[] = [
  { asset_id: "EQ-201", name: "Yonex Astrox 88D Racquet", category: "Racquets", total_quantity: 24, available_quantity: 17, daily_price: 150, status: "Available" },
  { asset_id: "EQ-202", name: "Head Cyber Squash Racquet", category: "Racquets", total_quantity: 10, available_quantity: 0, daily_price: 120, status: "In Use" },
  { asset_id: "EQ-310", name: "Basketball (Size 7)", category: "Balls", total_quantity: 15, available_quantity: 11, daily_price: 80, status: "Available" },
  { asset_id: "EQ-311", name: "Football (Size 5)", category: "Balls", total_quantity: 20, available_quantity: 14, daily_price: 70, status: "Available" },
  { asset_id: "EQ-420", name: "SS Complete Cricket Kit", category: "Kits", total_quantity: 6, available_quantity: 2, daily_price: 450, status: "Available" },
  { asset_id: "EQ-501", name: "Tennis Ball Machine", category: "Machines", total_quantity: 2, available_quantity: 0, daily_price: 600, status: "Under Maintenance" },
  { asset_id: "EQ-610", name: "Swim Kickboard", category: "Aquatics", total_quantity: 30, available_quantity: 26, daily_price: 40, status: "Available" },
];

export const issues: EquipmentIssue[] = [
  { issue_id: "I-01", member_id: "M103", asset_id: "EQ-202", issue_date: d(-6), due_date: d(-3), late_fee: 300 },
  { issue_id: "I-02", member_id: "M101", asset_id: "EQ-201", issue_date: d(-1), due_date: d(2), late_fee: 0 },
  { issue_id: "I-03", member_id: "M105", asset_id: "EQ-420", issue_date: d(-9), due_date: d(-5), late_fee: 400 },
  { issue_id: "I-04", member_id: "M106", asset_id: "EQ-310", issue_date: d(-12), due_date: d(-10), returned_date: d(-10), late_fee: 0 },
];

export const maintenance: MaintenanceRequest[] = [
  { request_id: "MR-31", venue_id: "V4", reported_date: d(-3), description: "Front wall plaster cracked near the tin line.", request_status: "In Progress", priority: "High", technician_notes: "Plaster work underway" },
  { request_id: "MR-32", venue_id: "V5", reported_date: d(-1), description: "Lane 3 rope float detached.", request_status: "Pending", priority: "Medium", technician_notes: "Float clip ordered" },
  { request_id: "MR-33", venue_id: "V2", reported_date: d(0), description: "Net post loose; needs re-anchoring.", request_status: "Pending", priority: "High", technician_notes: "Anchor bolt replacement scheduled" },
  { request_id: "MR-29", venue_id: "V7", reported_date: d(-8), description: "Floodlight bank B flickering.", request_status: "Completed", priority: "Low", technician_notes: "Capacitor replaced" },
];
