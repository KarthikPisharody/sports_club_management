import { Router } from 'express';
import { db } from '../db.js';
import { blockNonMembers, requireRole } from '../middleware/auth.js';

const router = Router();

// 1. Read-only equipment catalog with prices & tier discounts
router.get('/', (req, res) => {
  const state = db.getState();
  const sub = state.subscriptions.find(s => s.user_id === req.user.user_id && s.status === 'Active');
  const plan = sub ? state.plans.find(p => p.plan_id === sub.plan_id) : null;
  const discountPercent = plan ? plan.equipment_discount_percent : 0;

  const catalog = state.equipment.map(e => ({
    ...e,
    discount_percent: discountPercent,
    effective_daily_price: discountPercent > 0
      ? Math.round(e.daily_price * (1 - discountPercent / 100))
      : e.daily_price
  }));

  res.json({ equipment: catalog });
});

// 2. Members: "My Active Gear" displaying read-only issue and due dates
router.get('/my-active', (req, res) => {
  const state = db.getState();
  const todayStr = new Date().toISOString().slice(0, 10);

  const myGear = state.checkouts
    .filter(c => c.user_id === req.user.user_id && !c.return_date)
    .map(c => {
      const eq = state.equipment.find(e => e.asset_id === c.asset_id) || {};
      const baseDailyPrice = eq.daily_price || 0;
      const isOverdue = todayStr > c.due_date;
      const daysOverdue = isOverdue 
        ? Math.floor((new Date(todayStr).getTime() - new Date(c.due_date).getTime()) / 86400000) 
        : 0;
      const lateFee = Math.round(baseDailyPrice * 0.05 * daysOverdue);

      return {
        checkout_id: c.checkout_id,
        asset_id: c.asset_id,
        name: eq.name || c.asset_id,
        category: eq.category || '',
        issue_date: c.issue_date,
        due_date: c.due_date,
        daily_rate: c.daily_rate,
        status: isOverdue ? 'Overdue' : 'Active',
        days_overdue: daysOverdue,
        late_fee: lateFee
      };
    });

  res.json({ active_gear: myGear });
});

// 3. Admin: SQL View vw_member_active_checkouts simulation
router.get('/active-checkouts', requireRole('admin'), (req, res) => {
  const state = db.getState();
  const todayStr = new Date().toISOString().slice(0, 10);

  const viewData = state.checkouts
    .filter(c => !c.return_date)
    .map(c => {
      const eq = state.equipment.find(e => e.asset_id === c.asset_id) || {};
      const user = state.users.find(u => u.user_id === c.user_id) || {};
      const sub = state.subscriptions.find(s => s.user_id === c.user_id && s.status === 'Active');
      const plan = sub ? state.plans.find(p => p.plan_id === sub.plan_id) : null;

      const basePrice = eq.daily_price || 0;
      const isOverdue = todayStr > c.due_date;
      const daysOverdue = isOverdue 
        ? Math.floor((new Date(todayStr).getTime() - new Date(c.due_date).getTime()) / 86400000) 
        : 0;
      const computedLateFee = Math.round(basePrice * 0.05 * daysOverdue);

      return {
        checkout_id: c.checkout_id,
        asset_id: c.asset_id,
        equipment_name: eq.name || c.asset_id,
        equipment_category: eq.category || '',
        base_daily_price: eq.daily_price || 0,
        charged_daily_rate: c.daily_rate,
        tier_discount_applied: c.discount_percent || 0,
        user_id: user.user_id,
        member_name: user.name || 'Member',
        member_email: user.email || '',
        member_phone: user.phone || '',
        membership_tier: plan ? plan.plan_name : 'None',
        issue_date: c.issue_date,
        due_date: c.due_date,
        return_date: c.return_date,
        checkout_status: isOverdue ? 'Overdue' : 'Active',
        days_overdue: daysOverdue,
        computed_late_fee: computedLateFee
      };
    });

  res.json({ checkouts: viewData });
});

// 4. Admin: Add inventory
router.post('/', requireRole('admin'), (req, res) => {
  const { name, category, total_quantity, daily_price = 50, status = 'Available' } = req.body;
  if (!name || !category || !total_quantity) {
    return res.status(400).json({ error: 'Missing required inventory fields: name, category, total_quantity' });
  }

  const state = db.getState();
  const asset_id = `EQ-${Math.floor(100 + Math.random() * 900)}`;
  const total = Number(total_quantity);

  const newItem = {
    asset_id,
    name,
    category,
    total_quantity: total,
    available_quantity: total,
    daily_price: Number(daily_price),
    status
  };
  state.equipment.push(newItem);

  res.status(201).json({ message: 'Equipment added successfully', equipment: newItem });
});

// 5. Admin: Set prices and update inventory details
router.put('/:id', requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const { daily_price, total_quantity, available_quantity, status, name } = req.body;
  const state = db.getState();

  const item = state.equipment.find(e => e.asset_id === id);
  if (!item) {
    return res.status(404).json({ error: 'Equipment item not found' });
  }

  if (daily_price !== undefined) item.daily_price = Number(daily_price);
  if (total_quantity !== undefined) item.total_quantity = Number(total_quantity);
  if (available_quantity !== undefined) item.available_quantity = Number(available_quantity);
  if (status) item.status = status;
  if (name) item.name = name;

  res.json({ message: 'Equipment updated successfully', equipment: item });
});

// 6. Admin: Remove inventory
router.delete('/:id', requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const state = db.getState();

  const idx = state.equipment.findIndex(e => e.asset_id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Equipment item not found' });
  }

  state.equipment.splice(idx, 1);
  res.json({ message: `Equipment ${id} removed successfully` });
});

// 7. Checkout Gear (strictly blocked for Non-Members)
router.post('/checkout', blockNonMembers, (req, res) => {
  const { asset_id, member_id, issue_date, due_date } = req.body;
  const state = db.getState();

  const targetUserId = req.user.role === 'admin' && member_id ? Number(member_id) : req.user.user_id;
  const eq = state.equipment.find(e => e.asset_id === asset_id);

  if (!eq) {
    return res.status(404).json({ error: 'Equipment asset not found' });
  }

  if (eq.available_quantity <= 0 || eq.status === 'Under Maintenance') {
    return res.status(400).json({ error: `${eq.name} is not currently available for checkout.` });
  }

  const sub = state.subscriptions.find(s => s.user_id === targetUserId && s.status === 'Active');
  const plan = sub ? state.plans.find(p => p.plan_id === sub.plan_id) : null;
  const discountPercent = plan ? plan.equipment_discount_percent : 0;
  const effectiveRate = Math.round(eq.daily_price * (1 - discountPercent / 100));

  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultDue = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

  const newCheckout = {
    checkout_id: state.checkouts.length + 1,
    asset_id,
    user_id: targetUserId,
    issue_date: issue_date || todayStr,
    due_date: due_date || defaultDue,
    return_date: null,
    daily_rate: effectiveRate,
    discount_percent: discountPercent,
    late_fee: 0,
    status: 'Active'
  };

  // TRIGGER LOGIC: Decrement equipment stock & set In Use if 0
  eq.available_quantity -= 1;
  if (eq.available_quantity <= 0) {
    eq.status = 'In Use';
  }

  state.checkouts.push(newCheckout);

  res.status(201).json({
    message: `${eq.name} checked out successfully!`,
    checkout: newCheckout,
    discount_applied: `${discountPercent}%`
  });
});

// 8. Admin: Manage checkout return
router.post('/return/:checkout_id', requireRole('admin'), (req, res) => {
  const checkoutId = Number(req.params.checkout_id);
  const state = db.getState();

  const checkout = state.checkouts.find(c => c.checkout_id === checkoutId);
  if (!checkout) {
    return res.status(404).json({ error: 'Checkout record not found' });
  }

  if (checkout.return_date) {
    return res.status(400).json({ error: 'Item has already been returned' });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  checkout.return_date = todayStr;
  checkout.status = 'Returned';

  // TRIGGER LOGIC: Increment stock & restore Available status
  const eq = state.equipment.find(e => e.asset_id === checkout.asset_id);
  if (eq) {
    eq.available_quantity += 1;
    if (eq.status === 'In Use') {
      eq.status = 'Available';
    }
  }

  res.json({ message: 'Equipment returned successfully', checkout });
});

export default router;
