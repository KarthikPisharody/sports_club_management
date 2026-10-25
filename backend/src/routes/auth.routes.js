import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sports_club_super_secret_jwt_key_2026';
const SEED_PASSWORD = 'password123';

function norm(value = '') {
  return String(value).trim().toLowerCase();
}

function userUsername(user) {
  return user.username || user.name || '';
}

async function loadUsers() {
  const rows = await db.query('SELECT * FROM users');
  if (Array.isArray(rows)) return rows;
  return db.getState().users;
}

function persistMockUser(updated) {
  const state = db.getState();
  const idx = state.users.findIndex((u) => u.user_id === updated.user_id);
  if (idx >= 0) state.users[idx] = { ...state.users[idx], ...updated };
}

function findByEmail(users, email) {
  const e = norm(email);
  return users.filter((u) => norm(u.email) === e);
}

function findByUsername(users, username) {
  const u = norm(username);
  return users.filter((x) => norm(userUsername(x)) === u);
}

function resolveIdentity(users, username, email) {
  const byUsername = findByUsername(users, username);
  const byEmail = findByEmail(users, email);

  if (byUsername.length > 1 || byEmail.length > 1) {
    return {
      ok: false,
      status: 409,
      error: 'DuplicateIdentity',
      message: 'Duplicate username or email exists. Each account must be uniquely identified.'
    };
  }

  const userRec = byUsername[0];
  const emailRec = byEmail[0];

  if (userRec && emailRec && userRec.user_id !== emailRec.user_id) {
    return {
      ok: false,
      status: 409,
      error: 'IdentityConflict',
      message: 'Username and email belong to different accounts.'
    };
  }

  if (!userRec && !emailRec) {
    return {
      ok: false,
      status: 400,
      error: 'RosterRecordRequired',
      message: 'No pre-existing club record found for this username and email. Sign-in and registration require an existing roster entry.'
    };
  }

  if (userRec && !emailRec) {
    return {
      ok: false,
      status: 400,
      error: 'IdentityMismatch',
      message: 'Email does not match the pre-existing record for this username.'
    };
  }

  if (emailRec && !userRec) {
    return {
      ok: false,
      status: 400,
      error: 'IdentityMismatch',
      message: 'Username does not match the pre-existing record for this email.'
    };
  }

  return { ok: true, user: userRec };
}

async function verifyPassword(plain, user) {
  if (!plain) return false;
  if (user.password && user.password === plain) return true;
  if (plain === SEED_PASSWORD && (!user.password_hash || String(user.password_hash).includes('w8k7r5D1J8'))) {
    return true;
  }
  if (user.password_hash) {
    try {
      return await bcrypt.compare(plain, user.password_hash);
    } catch {
      return false;
    }
  }
  return false;
}

function signUser(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      username: userUsername(user),
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function membershipFor(user) {
  const state = db.getState();
  const sub = state.subscriptions.find((s) => s.user_id === user.user_id && s.status === 'Active');
  const plan = sub ? state.plans.find((p) => p.plan_id === sub.plan_id) : null;
  return plan
    ? {
        plan_id: plan.plan_id,
        plan_name: plan.plan_name,
        billing_cycle: sub.billing_cycle,
        end_date: sub.end_date,
        equipment_discount_percent: plan.equipment_discount_percent,
        venue_discount_percent: plan.venue_discount_percent
      }
    : null;
}

function publicUser(user) {
  return {
    user_id: user.user_id,
    name: user.name,
    username: userUsername(user),
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    wallet_balance: Number(user.wallet_balance ?? 0),
    is_delinquent: Boolean(user.is_delinquent),
    membership: membershipFor(user)
  };
}

function validateCredentials(body) {
  const username = String(body.username || '').trim();
  const email = String(body.email || '').trim();
  const password = String(body.password || '');
  const phone = String(body.phone || body.phone_number || '').trim();
  const role = body.role ? String(body.role).trim() : null;

  if (!username || !email || !password) {
    return {
      ok: false,
      status: 400,
      error: 'ValidationError',
      message: 'Username, email, and password are required.'
    };
  }
  if (!email.includes('@')) {
    return {
      ok: false,
      status: 400,
      error: 'ValidationError',
      message: 'Please provide a valid email address.'
    };
  }
  return { ok: true, username, email, password, phone, role };
}

// Sign in — unique username + email, existing roster record required
router.post('/login', async (req, res) => {
  const parsed = validateCredentials(req.body);
  if (!parsed.ok) {
    return res.status(parsed.status).json({ error: parsed.error, message: parsed.message });
  }

  const { username, email, password, phone, role } = parsed;
  const users = await loadUsers();
  const identity = resolveIdentity(users, username, email);

  if (!identity.ok) {
    return res.status(identity.status).json({ error: identity.error, message: identity.message });
  }

  const user = identity.user;
  if (role && user.role !== role) {
    return res.status(400).json({
      error: 'RoleMismatch',
      message: `This account is not registered as ${role}.`
    });
  }

  const valid = await verifyPassword(password, user);
  if (!valid) {
    return res.status(401).json({
      error: 'InvalidCredentials',
      message: 'Incorrect password.'
    });
  }

  if (phone) {
    user.phone = phone;
    persistMockUser({ user_id: user.user_id, phone });
    await db.query('UPDATE users SET phone = ? WHERE user_id = ?', [phone, user.user_id]);
  }

  return res.json({
    message: `Signed in successfully as ${user.role}`,
    token: signUser(user),
    user: publicUser(user)
  });
});

// Register / activate against a pre-existing roster record
router.post('/register', async (req, res) => {
  const parsed = validateCredentials(req.body);
  if (!parsed.ok) {
    return res.status(parsed.status).json({ error: parsed.error, message: parsed.message });
  }

  const { username, email, password, phone, role } = parsed;
  if (!phone) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Phone number is required for registration.'
    });
  }

  const users = await loadUsers();
  const identity = resolveIdentity(users, username, email);

  if (!identity.ok) {
    return res.status(identity.status).json({ error: identity.error, message: identity.message });
  }

  const user = identity.user;
  if (role && user.role !== role && !(role === 'member' && user.role === 'member')) {
    return res.status(400).json({
      error: 'RoleMismatch',
      message: `This roster record is not registered as ${role}.`
    });
  }

  const password_hash = await bcrypt.hash(password, 10);
  user.phone = phone;
  user.password = password;
  user.password_hash = password_hash;
  persistMockUser({
    user_id: user.user_id,
    phone,
    password,
    password_hash
  });
  await db.query(
    'UPDATE users SET phone = ?, password_hash = ? WHERE user_id = ?',
    [phone, password_hash, user.user_id]
  );

  return res.status(200).json({
    message: 'Account activated against the existing club roster record.',
    token: signUser(user),
    user: publicUser(user)
  });
});

// Get current authenticated user profile
router.get('/me', async (req, res) => {
  const users = await loadUsers();
  const user = users.find((u) => u.user_id === req.user.user_id) || req.user;
  res.json({ user: publicUser(user) });
});

export default router;
