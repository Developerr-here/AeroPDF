import express from 'express';
import path from 'path';
import fs from 'fs';
import { User, BlogPost } from '../../db.js';
import { authenticateToken } from '../middlewares/auth.js';
import { blogUpload } from '../middlewares/upload.js';
import { formatUserResponse } from '../utils/authHelpers.js';
import { stripe } from '../config/stripe.js';
import bcrypt from 'bcryptjs';

const router = express.Router();
// We define blogUploadsDir locally for the user routes to delete old profile pictures.
const __dirname = path.resolve();
const blogUploadsDir = path.join(__dirname, 'blog-uploads');

// Route: Update user display name and update past posts
router.post('/display-name', authenticateToken, async (req, res) => {
  try {
    const { displayName, first_name, last_name } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (first_name !== undefined && last_name !== undefined) {
      user.first_name = first_name.trim() || null;
      user.last_name = last_name.trim() || null;
      user.display_name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || null;
    } else if (displayName !== undefined) {
      const updatedName = displayName.trim() || null;
      user.display_name = updatedName;
      
      // Propagate splits to first/last name columns
      if (updatedName) {
        const parts = updatedName.split(' ');
        user.first_name = parts[0] || '';
        user.last_name = parts.slice(1).join(' ') || '';
      } else {
        user.first_name = null;
        user.last_name = null;
      }
    } else {
      return res.status(400).json({ error: 'Display name or first/last names are required.' });
    }

    await user.save();

    // Propagate display name to all past blog posts
    const nameForBlogs = user.display_name || user.email;
    await BlogPost.update({ author_name: nameForBlogs }, { where: { author_id: user.id } });

    res.json({ 
      success: true, 
      displayName: user.display_name, 
      user: await formatUserResponse(user) 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update display name.' });
  }
});

// Route: Upload user profile picture
router.post('/profile-pic', authenticateToken, blogUpload.single('profile_pic'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded.' });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Clean up old profile picture from the filesystem to save space
    if (user.profile_pic && user.profile_pic.startsWith('/api/blog-uploads/')) {
      const oldFilename = user.profile_pic.split('/').pop();
      const oldFilePath = path.join(blogUploadsDir, oldFilename);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (unlinkErr) {
          console.error('Failed to delete old profile picture:', unlinkErr);
        }
      }
    }

    const profilePicUrl = `/api/blog-uploads/${req.file.filename}`;
    user.profile_pic = profilePicUrl;
    await user.save();

    res.json({
      success: true,
      profilePicUrl,
      user: await formatUserResponse(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload profile picture.' });
  }
});

// Route: Get user invoice history
router.get('/invoices', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (!user.stripe_customer_id) {
      return res.json({ invoices: [] });
    }

    const invoices = await stripe.invoices.list({
      customer: user.stripe_customer_id,
      limit: 20
    });

    const formattedInvoices = invoices.data.map(inv => ({
      id: inv.number,
      date: new Date(inv.created * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      amount: `$${(inv.amount_paid / 100).toFixed(2)}`,
      status: inv.status === 'paid' ? 'Paid' : 'Pending',
      pdf_url: inv.invoice_pdf
    }));

    res.json({ invoices: formattedInvoices });
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ error: 'Failed to fetch invoice history.', invoices: [] });
  }
});

// Route: Change user password
router.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (user.password) {
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

export default router;
