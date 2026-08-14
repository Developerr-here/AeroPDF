import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';
import { User } from '../../db.js';
import { JWT_SECRET } from '../config/env.js';
import { cleanTempFiles } from '../utils/helpers.js';
import { 
  resolveEffectivePlanAndUser, 
  getPremiumStatus, 
  getToolLimit, 
  getToolKeyFromPath, 
  isToolAllowedForUser 
} from '../utils/authHelpers.js';

// Multer configured to stream uploads to disk rather than keeping in RAM
export const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 4.5 * 1024 * 1024 * 1024 } // 4.5GB limit (enforced per plan dynamically by checkUploadLimit)
});

// Multer storage engine for blog uploads, keeping original file extensions
const blogStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'blog-uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

export const blogUpload = multer({ 
  storage: blogStorage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for blog uploads
});

export const checkUploadLimit = async (req, res, next) => {
  const clientCumulativeSize = parseInt(req.headers['x-cumulative-size'] || '0', 10);
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let dbUser = null;
  let effectiveUser = null;
  let planName = 'free';
  let isPremium = false;
  let customMaxFileSize = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      dbUser = await User.findByPk(decoded.id);
      if (dbUser) {
        const resolved = await resolveEffectivePlanAndUser(dbUser);
        planName = resolved.plan;
        effectiveUser = resolved.user;
        isPremium = await getPremiumStatus(dbUser);
        
        if (effectiveUser && effectiveUser.custom_features) {
          try {
            const custom = typeof effectiveUser.custom_features === 'string' ? JSON.parse(effectiveUser.custom_features) : effectiveUser.custom_features;
            if (custom && custom.max_file_size) {
              customMaxFileSize = parseInt(custom.max_file_size, 10) * 1024 * 1024; // Convert MB to bytes
            }
          } catch (e) {
            // Ignore parsing error
          }
        }
      }
    } catch (err) {
      // Ignore token validation error
    }
  }

  let totalSize = 0;
  if (req.file) {
    totalSize = req.file.size;
  } else if (req.files) {
    totalSize = req.files.reduce((sum, f) => sum + f.size, 0);
  }

  const activeCumulativeSize = effectiveUser ? parseInt(effectiveUser.cumulative_bytes_processed || '0', 10) : clientCumulativeSize;

  // 1. Custom account overall limit check
  if (customMaxFileSize !== null) {
    if (activeCumulativeSize > customMaxFileSize || totalSize + activeCumulativeSize > customMaxFileSize) {
      cleanTempFiles(req);
      const limitMb = Math.round(customMaxFileSize / (1024 * 1024));
      return res.status(403).json({ error: `File size exceeds your custom account limit of ${limitMb}MB.` });
    }
  }

  // 2. Per-task Tool limit check
  const toolLimit = getToolLimit(req.path, planName, effectiveUser);
  if (totalSize > toolLimit) {
    cleanTempFiles(req);
    const limitMb = toolLimit >= 1024 * 1024 * 1024 
      ? `${Math.round(toolLimit / (1024 * 1024 * 1024))}GB` 
      : `${Math.round(toolLimit / (1024 * 1024))}MB`;
    return res.status(403).json({ error: `File size exceeds the ${limitMb} limit for this tool on your plan.` });
  }

  // 3. Custom plan per-tool permission check
  if (planName === 'custom') {
    let toolKey = req.path.replace(/^\/api\//, '');
    if (toolKey.startsWith('image/remove-background')) toolKey = 'remove-background';
    else if (toolKey.startsWith('image/upscale')) toolKey = 'upscale-image';
    else if (toolKey.startsWith('ai/assistant')) toolKey = 'ai-assistant';
    else if (toolKey.startsWith('ai/summarize')) toolKey = 'ai-assistant';
    else if (toolKey.startsWith('ai/translate')) toolKey = 'ai-assistant';
    else toolKey = toolKey.replace(/\/.*/, '');

    if (!isToolAllowedForUser(dbUser, toolKey, effectiveUser)) {
      cleanTempFiles(req);
      return res.status(403).json({ error: 'This tool is not enabled for your custom plan. Please contact your account administrator.' });
    }
  }

  if (effectiveUser) {
    await User.increment('cumulative_bytes_processed', { by: totalSize, where: { id: effectiveUser.id } });
    req.user = { id: dbUser.id, email: dbUser.email };
  }

  next();
};
