import { rateLimit } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { User } from '../../db.js';
import { JWT_SECRET } from '../config/env.js';

export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: process.env.NODE_ENV === 'test' ? 10000 : 30, // 30 requests per minute in production
  message: { error: 'Too many authentication attempts. Please try again in 1 minute.' },
  standardHeaders: 'draft-8',
  legacyHeaders: false
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: async (req, res) => {
    if (process.env.NODE_ENV === 'test') return 10000;
    
    // Check if the user is authenticated & on a paid plan
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const dbUser = await User.findByPk(decoded.id);
        if (dbUser && dbUser.subscription_plan && dbUser.subscription_plan !== 'free') {
          return 2000; // Paid plans get 2000 requests/hour
        }
      } catch (err) {
        // Token verification failed or user not found, fallback to guest limits
      }
    }
    return 150; // Guest / Free plan gets 150 requests/hour
  },
  message: { error: 'Hourly rate limit exceeded. Upgrade to Premium for higher thresholds.' },
  standardHeaders: 'draft-8',
  legacyHeaders: false
});
