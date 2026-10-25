import { Router } from 'express';
import { db } from '../db.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// 1. Get all venues (read-only for members & non-members)
router.get('/', (req, res) => {
  const state = db.getState();
  const sub = state.subscriptions.find(s => s.user_id === req.user.user_id && s.status === 'Active');
  const plan = sub ? state.plans.find(p => p.plan_id === sub.plan_id) : null;
  const discountPercent = plan ? plan.venue_discount_percent : 0;

  const venuesWithPricing = state.venues.map(v => ({
    ...v,
    discount_percent: discountPercent,
    effective_hourly_fee: discountPercent > 0 
      ? Math.round(v.base_hourly_fee * (1 - discountPercent / 100)) 
      : v.base_hourly_fee
  }));

  res.json({ venues: venuesWithPricing });
});

// 2. Day-wise time slot grid for a venue (06:00 - 22:00)
router.get('/:id/slots', (req, res) => {
  const { id } = req.params;
  const dateStr = req.query.date || new Date().toISOString().slice(0, 10);
  const state = db.getState();

  const venue = state.venues.find(v => v.venue_id === id);
  if (!venue) {
    return res.status(404).json({ error: 'Venue not found' });
  }

  // Get active subscription for member discount
  const sub = state.subscriptions.find(s => s.user_id === req.user.user_id && s.status === 'Active');
  const plan = sub ? state.plans.find(p => p.plan_id === sub.plan_id) : null;
  const discountPercent = plan ? plan.venue_discount_percent : 0;
  const slotPrice = discountPercent > 0
    ? Math.round(venue.base_hourly_fee * (1 - discountPercent / 100))
    : venue.base_hourly_fee;

  // Generate 1-hour slots from 06:00 to 22:00
  const slots = [];
  const venueBookings = state.bookings.filter(b => b.venue_id === id && b.status === 'Confirmed' && b.start_time.startsWith(dateStr));

  for (let hour = 6; hour < 22; hour++) {
    const startHourStr = String(hour).padStart(2, '0') + ':00';
    const endHourStr = String(hour + 1).padStart(2, '0') + ':00';
    const startIso = `${dateStr}T${startHourStr}`;
    const endIso = `${dateStr}T${endHourStr}`;

    const isBooked = venueBookings.some(b => {
      const bStart = b.start_time.replace(' ', 'T');
      const bEnd = b.end_time.replace(' ', 'T');
      return (startIso >= bStart && startIso < bEnd);
    });

    let status = 'Available';
    if (venue.status === 'Under Maintenance') {
      status = 'Under Maintenance';
    } else if (isBooked) {
      status = 'Booked';
    }

    slots.push({
      slot_id: `${id}_${dateStr}_${startHourStr}`,
      date: dateStr,
      start_time: startHourStr,
      end_time: endHourStr,
      start_iso: startIso,
      end_iso: endIso,
      base_price: venue.base_hourly_fee,
      discounted_price: slotPrice,
      discount_applied: `${discountPercent}%`,
      status
    });
  }

  res.json({
    venue_id: venue.venue_id,
    venue_name: venue.venue_name,
    date: dateStr,
    venue_status: venue.status,
    slots
  });
});

// 3. Admin: Add new facility
router.post('/', requireRole('admin'), (req, res) => {
  const { venue_name, venue_type, base_hourly_fee, parent_venue_id, sports, status = 'Available' } = req.body;
  if (!venue_name || !venue_type || !base_hourly_fee) {
    return res.status(400).json({ error: 'Missing required fields: venue_name, venue_type, base_hourly_fee' });
  }

  const state = db.getState();
  const venue_id = `V${state.venues.length + 1}`;
  const newVenue = {
    venue_id,
    venue_name,
    venue_type,
    base_hourly_fee: Number(base_hourly_fee),
    parent_venue_id: parent_venue_id || null,
    sports: Array.isArray(sports) ? sports : [sports].filter(Boolean),
    status
  };
  state.venues.push(newVenue);

  res.status(201).json({ message: 'Facility created successfully', venue: newVenue });
});

// 4. Admin: Update venue status, pricing, and details
router.put('/:id', requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const { status, base_hourly_fee, venue_name } = req.body;
  const state = db.getState();

  const venue = state.venues.find(v => v.venue_id === id);
  if (!venue) {
    return res.status(404).json({ error: 'Venue not found' });
  }

  if (status) venue.status = status;
  if (base_hourly_fee !== undefined) venue.base_hourly_fee = Number(base_hourly_fee);
  if (venue_name) venue.venue_name = venue_name;

  res.json({ message: 'Venue updated successfully', venue });
});

// 5. Admin: Remove facility
router.delete('/:id', requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const state = db.getState();

  const idx = state.venues.findIndex(v => v.venue_id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Venue not found' });
  }

  state.venues.splice(idx, 1);
  res.json({ message: `Facility ${id} removed successfully` });
});

export default router;
