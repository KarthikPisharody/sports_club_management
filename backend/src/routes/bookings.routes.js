import { Router } from 'express';
import { db } from '../db.js';
import { blockNonMembers, requireRole } from '../middleware/auth.js';

const router = Router();

// 1. Create Venue Booking (Members only, strictly blocked for non-members & admins)
router.post('/', blockNonMembers, (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({
      error: 'AdminBookingNotPermitted',
      message: 'Admins manage venue status and facilities rather than booking personal slots.'
    });
  }

  const { venue_id, start_time, end_time, payment_method = 'Wallet' } = req.body;
  if (!venue_id || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing required booking fields: venue_id, start_time, end_time' });
  }

  const state = db.getState();
  const venue = state.venues.find(v => v.venue_id === venue_id);
  if (!venue) {
    return res.status(404).json({ error: 'Venue not found' });
  }

  if (venue.status === 'Under Maintenance') {
    return res.status(400).json({ error: 'Venue is currently under maintenance and cannot be booked.' });
  }

  // TRIGGER LOGIC: Prevent double-booking / slot conflict
  const conflict = state.bookings.some(b => {
    if (b.venue_id !== venue_id || b.status !== 'Confirmed') return false;
    const bStart = new Date(b.start_time.replace(' ', 'T')).getTime();
    const bEnd = new Date(b.end_time.replace(' ', 'T')).getTime();
    const nStart = new Date(start_time.replace(' ', 'T')).getTime();
    const nEnd = new Date(end_time.replace(' ', 'T')).getTime();
    return (nStart < bEnd && nEnd > bStart);
  });

  if (conflict) {
    return res.status(409).json({
      error: 'DoubleBookingConflict',
      message: 'Slot conflict: The selected venue is already booked for this time interval.'
    });
  }

  // Calculate duration and base cost
  const startMs = new Date(start_time.replace(' ', 'T')).getTime();
  const endMs = new Date(end_time.replace(' ', 'T')).getTime();
  const hours = (endMs - startMs) / 3600000;
  if (hours <= 0) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }
  if (endMs <= Date.now()) {
    return res.status(400).json({ error: 'PastSlotBookingNotPermitted', message: 'Cannot book slots in the past.' });
  }

  const baseCost = hours * venue.base_hourly_fee;

  // Calculate discount based on active subscription
  const sub = state.subscriptions.find(s => s.user_id === req.user.user_id && s.status === 'Active');
  const plan = sub ? state.plans.find(p => p.plan_id === sub.plan_id) : null;
  const discountPercent = plan ? plan.venue_discount_percent : 0;
  const discountAmount = Math.round(baseCost * (discountPercent / 100));
  const totalCost = baseCost - discountAmount;

  // Check wallet balance if payment_method is Wallet
  const user = state.users.find(u => u.user_id === req.user.user_id);
  if (payment_method === 'Wallet') {
    if (!user || user.wallet_balance < totalCost) {
      return res.status(400).json({
        error: 'InsufficientFunds',
        message: `Insufficient wallet balance. Required: ₹${totalCost}, Available: ₹${user?.wallet_balance || 0}`
      });
    }
    user.wallet_balance -= totalCost;
  }

  const newBooking = {
    booking_id: state.bookings.length + 1,
    venue_id,
    user_id: req.user.user_id,
    start_time,
    end_time,
    base_rate: baseCost,
    discount_amount: discountAmount,
    total_cost: totalCost,
    payment_method,
    payment_status: 'Paid',
    status: 'Confirmed',
    created_at: new Date().toISOString()
  };
  state.bookings.push(newBooking);

  res.status(201).json({
    message: `Booked ${venue.venue_name} successfully!`,
    booking: newBooking,
    tier_discount_applied: `${discountPercent}% (Saved ₹${discountAmount})`,
    amount_charged: totalCost
  });
});

// 2. Member: Get my bookings
router.get('/my', (req, res) => {
  const state = db.getState();
  const myBookings = state.bookings
    .filter(b => b.user_id === req.user.user_id)
    .map(b => {
      const v = state.venues.find(ven => ven.venue_id === b.venue_id);
      return {
        ...b,
        venue_name: v ? v.venue_name : b.venue_id,
        venue_type: v ? v.venue_type : ''
      };
    });

  res.json({ bookings: myBookings });
});

// 3. Admin: Complex JOIN query combining bookings with member details, tiers, and venue details
router.get('/all', requireRole('admin'), (req, res) => {
  const state = db.getState();
  const joinedBookings = state.bookings.map(b => {
    const venue = state.venues.find(v => v.venue_id === b.venue_id) || {};
    const user = state.users.find(u => u.user_id === b.user_id) || {};
    const sub = state.subscriptions.find(s => s.user_id === b.user_id && s.status === 'Active');
    const plan = sub ? state.plans.find(p => p.plan_id === sub.plan_id) : null;

    return {
      booking_id: b.booking_id,
      venue_id: b.venue_id,
      venue_name: venue.venue_name || b.venue_id,
      venue_type: venue.venue_type || '',
      user_id: b.user_id,
      member_name: user.name || 'Member',
      member_email: user.email || '',
      member_phone: user.phone || '',
      membership_tier: plan ? plan.plan_name : 'Standard',
      tier_venue_discount_percent: plan ? plan.venue_discount_percent : 0,
      start_time: b.start_time,
      end_time: b.end_time,
      base_rate: b.base_rate,
      discount_amount: b.discount_amount,
      total_cost: b.total_cost,
      status: b.status,
      payment_method: b.payment_method || 'Wallet',
      payment_status: b.payment_status || 'Paid'
    };
  });

  res.json({ bookings: joinedBookings });
});

// 4. Cancel booking
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const state = db.getState();
  const booking = state.bookings.find(b => b.booking_id === id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (req.user.role !== 'admin' && booking.user_id !== req.user.user_id) {
    return res.status(403).json({ error: 'Unauthorized to cancel this booking' });
  }

  booking.status = 'Cancelled';
  res.json({ message: 'Booking cancelled successfully', booking });
});

export default router;
