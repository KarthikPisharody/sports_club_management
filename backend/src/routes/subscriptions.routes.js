import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// 1. Get Membership Tiers
router.get('/plans', (req, res) => {
  const state = db.getState();
  res.json({
    plans: state.plans.map(p => ({
      plan_id: p.plan_id,
      plan_name: p.plan_name,
      monthly_fee: p.monthly_fee,
      yearly_fee: p.yearly_fee,
      equipment_discount_percent: p.equipment_discount_percent,
      venue_discount_percent: p.venue_discount_percent,
      formatted_monthly: `₹${p.monthly_fee.toLocaleString('en-IN')}/mo`,
      formatted_yearly: `₹${p.yearly_fee.toLocaleString('en-IN')}/yr`,
      benefits: p.benefits
    }))
  });
});

// 2. Subscribe or Upgrade Membership Plan
router.post('/subscribe', (req, res) => {
  const { plan_name, billing_cycle = 'monthly', payment_method = 'Card' } = req.body;
  const state = db.getState();
  const userId = req.user.user_id;

  const plan = state.plans.find(p => p.plan_name.toLowerCase() === (plan_name || '').toLowerCase());
  if (!plan) {
    return res.status(400).json({ error: 'Invalid plan selected. Choose Gold or Platinum.' });
  }

  const cost = billing_cycle === 'yearly' ? plan.yearly_fee : plan.monthly_fee;
  const today = new Date();
  const startDate = today.toISOString().slice(0, 10);
  const endDateObj = new Date(today);
  if (billing_cycle === 'yearly') {
    endDateObj.setFullYear(endDateObj.getFullYear() + 1);
  } else {
    endDateObj.setMonth(endDateObj.getMonth() + 1);
  }
  const endDate = endDateObj.toISOString().slice(0, 10);

  // Upgrade user role to member
  const user = state.users.find(u => u.user_id === userId);
  if (user) {
    user.role = 'member';
  }

  // Deactivate any previous active subscription
  state.subscriptions.forEach(s => {
    if (s.user_id === userId && s.status === 'Active') {
      s.status = 'Expired';
    }
  });

  const newSub = {
    subscription_id: state.subscriptions.length + 1,
    user_id: userId,
    plan_id: plan.plan_id,
    billing_cycle,
    amount_paid: cost,
    start_date: startDate,
    end_date: endDate,
    status: 'Active'
  };
  state.subscriptions.push(newSub);

  res.status(201).json({
    message: `Successfully upgraded to ${plan.plan_name} Membership!`,
    subscription: newSub,
    tier: plan.plan_name,
    role: 'member',
    benefits: plan.benefits,
    discounts: {
      equipment: `${plan.equipment_discount_percent}%`,
      venue: `${plan.venue_discount_percent}%`
    }
  });
});

export default router;
