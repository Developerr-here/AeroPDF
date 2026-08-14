import jwt from 'jsonwebtoken';
import { User } from '../../db.js';
import { JWT_SECRET } from '../config/env.js';
import { cleanTempFiles } from '../utils/helpers.js';
import { resolveEffectivePlanAndUser, checkAISubscription, getAICreditLimit } from '../utils/authHelpers.js';

// Auth Middleware: Verify JWT Token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Session token required. Please log in.' });
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Session expired or invalid token.' });
    req.user = decoded; // Contains { id, email }
    next();
  });
};

export const verifyAISubscriptionAndCredits = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let isAllowed = false;
  let ownerUser = null;
  let dbUser = null;
  let planName = 'free';

  // Calculate the AI credit cost dynamically depending on the route
  const getAICostForRoute = (path) => {
    if (path.includes('/remove-background')) return 500; // Image background removal costs 500 credits
    if (path.includes('/upscale')) return 450;           // Image upscaling costs 450 credits
    return 5; // Default text tools cost 5 credits (Summarize, Chat assistant, Translate)
  };

  const cost = getAICostForRoute(req.path);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      dbUser = await User.findByPk(decoded.id);
      if (dbUser) {
        // Resolve subscription plan using resolved.user (owner/subscriber)
        const resolved = await resolveEffectivePlanAndUser(dbUser);
        planName = resolved.plan;
        ownerUser = resolved.user || dbUser;
        
        // Track AI credits on the account owner's shared credit pool
        if (checkAISubscription(ownerUser)) {
          const limit = getAICreditLimit(planName, ownerUser);
          const used = ownerUser.ai_credits_used || 0;
          if (used + cost <= limit) {
            isAllowed = true;
          } else {
            cleanTempFiles(req);
            return res.status(403).json({ error: `Insufficient AI Credits. This request requires ${cost} credits, but your team only has ${Math.max(0, limit - used)} credits remaining. Please upgrade or contact support.` });
          }
        }
      }
    } catch (err) {}
  }

  if (!isAllowed) {
    cleanTempFiles(req);
    return res.status(403).json({ error: 'AI tools (including Summarize, Chat, Translate, Background Remover, and Upscaler) are only available on the Premium or Business plan. Please upgrade to continue.' });
  }

  if (ownerUser && dbUser) {
    await User.increment('ai_credits_used', { by: cost, where: { id: ownerUser.id } });
    req.user = { id: dbUser.id, email: dbUser.email };
  }
  next();
};
