import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../../db.js';
import { JWT_SECRET } from '../config/env.js';
import { authLimiter } from '../middlewares/rateLimiters.js';
import { authenticateToken } from '../middlewares/auth.js';
import { formatUserResponse } from '../utils/authHelpers.js';

const router = express.Router();

router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    if (!first_name || !last_name) return res.status(400).json({ error: 'First name and last name are required.' });

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'An account with this email already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      first_name,
      last_name,
      display_name: `${first_name} ${last_name}`
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: await formatUserResponse(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup processing failed.' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });
    if (!user.password) return res.status(400).json({ error: 'This account uses Google Sign In. Please use Continue with Google.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: await formatUserResponse(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login processing failed.' });
  }
});

router.post('/change-email', authenticateToken, async (req, res) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ error: 'New email address is required.' });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const existingUser = await User.findOne({ where: { email: newEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email address is already in use by another account.' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.email = newEmail;
    await user.save();

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: await formatUserResponse(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update email address.' });
  }
});

// Helper to decode a JWT token's payload without verifying signature (for dev fallback)
const decodeJwt = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadBuf = Buffer.from(parts[1], 'base64');
    return JSON.parse(payloadBuf.toString('utf8'));
  } catch (err) {
    return null;
  }
};

// Google Sign-In Endpoint (handles real or simulated Google profile payload)
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { credential, email: bodyEmail, first_name: bodyFirst, last_name: bodyLast } = req.body;
    
    let email = bodyEmail;
    let first_name = bodyFirst;
    let last_name = bodyLast;
    let profile_pic = null;

    if (credential) {
      // Real Google credential token verification
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      let payload = null;
      if (googleClientId) {
        const client = new OAuth2Client(googleClientId);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: googleClientId
        });
        payload = ticket.getPayload();
      } else {
        // Fallback: decode JWT locally without verifying signature for dev convenience
        payload = decodeJwt(credential);
      }
      
      if (!payload) {
        return res.status(400).json({ error: 'Invalid Google credential token.' });
      }
      
      email = payload.email;
      first_name = payload.given_name || 'Google';
      last_name = payload.family_name || 'User';
      profile_pic = payload.picture || null;
    } else {
      // Sandbox mode verification
      if (!email) {
        return res.status(400).json({ error: 'Email is required from Google account.' });
      }
    }

    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        email,
        password: null, // Passwordless for Google OAuth
        first_name: first_name || 'Google',
        last_name: last_name || 'User',
        display_name: `${first_name || 'Google'} ${last_name || 'User'}`.trim(),
        profile_pic: profile_pic
      });
    } else {
      // Sync names/profile picture if they were blank
      let userUpdated = false;
      if (!user.first_name || !user.last_name) {
        user.first_name = first_name || user.first_name || 'Google';
        user.last_name = last_name || user.last_name || 'User';
        user.display_name = `${user.first_name} ${user.last_name}`.trim();
        userUpdated = true;
      }
      if (profile_pic && !user.profile_pic) {
        user.profile_pic = profile_pic;
        userUpdated = true;
      }
      if (userUpdated) {
        await user.save();
      }
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: await formatUserResponse(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Google login failed: ' + err.message });
  }
});

// Password reset endpoints disabled
router.post('/forgot-password', authLimiter, (req, res) => {
  return res.status(400).json({ error: 'Password reset feature is currently disabled. Please contact support.' });
});

router.post('/reset-password', authLimiter, (req, res) => {
  return res.status(400).json({ error: 'Password reset feature is currently disabled. Please contact support.' });
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User profile not found.' });
    res.json({ user: await formatUserResponse(user) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user state.' });
  }
});

export default router;
