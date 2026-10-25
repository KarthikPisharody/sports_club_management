import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sports_club_super_secret_jwt_key_2026';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const roleHeader = req.headers['x-role'];
  const userHeader = req.headers['x-user-id'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      // If token invalid, proceed to header fallback
    }
  }

  // Fallback support for simple development / role header emulation
  if (roleHeader || userHeader) {
    const state = db.getState();
    const userId = Number(userHeader) || (roleHeader === 'admin' ? 1 : roleHeader === 'non_member' ? 5 : 2);
    const user = state.users.find(u => u.user_id === userId) || {
      user_id: userId,
      role: roleHeader || 'non_member',
      name: roleHeader === 'admin' ? 'Dana Lopez' : 'Club User',
      email: 'user@arenaone.club'
    };
    req.user = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: roleHeader || user.role
    };
    return next();
  }

  // Default to non_member guest
  req.user = {
    user_id: 5,
    name: 'Guest Non-Member',
    email: 'guest@arenaone.club',
    role: 'non_member'
  };
  next();
}

/**
 * Middleware ensuring user has one of the allowed roles
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Action requires one of the following roles: ${allowedRoles.join(', ')}.`
      });
    }
    next();
  };
}

/**
 * Middleware strictly blocking non-members from booking and checkout actions,
 * returning upgrade instructions and membership tiers.
 */
export function blockNonMembers(req, res, next) {
  if (req.user && req.user.role === 'non_member') {
    return res.status(403).json({
      error: 'MembershipRequired',
      message: 'Non-members are in read-only mode. An active membership plan is strictly required to book venues or check out equipment.',
      actionRequired: 'UPGRADE_MEMBERSHIP',
      plans: [
        {
          tier: 'Gold',
          priceMonthly: 2000,
          priceYearly: 20000,
          equipmentDiscount: '30%',
          venueDiscount: '10%'
        },
        {
          tier: 'Platinum',
          priceMonthly: 3000,
          priceYearly: 30000,
          equipmentDiscount: '50%',
          venueDiscount: '20%'
        }
      ]
    });
  }
  next();
}
