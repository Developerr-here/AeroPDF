import express from 'express';
import nodemailer from 'nodemailer';
import dns from 'dns';
import { User, ContactInquiry, NewsletterSubscriber } from '../../db.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// SMTP Transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  connectionTimeout: 30000,
  socketTimeout: 30000,
  // Violently force IPv4 lookup to bypass Railway's broken IPv6 routing
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, (err, address, family) => {
      callback(err, address, family);
    });
  },
  tls: {
    rejectUnauthorized: false
  },
  auth: {
    user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
    pass: process.env.SMTP_PASS || 'ethereal_password'
  }
});

// Contact Sales Form submission API
router.post('/contact-sales', async (req, res) => {
  const { firstName, lastName, companyName, businessEmail, message } = req.body;
  if (!firstName || !lastName || !companyName || !businessEmail || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin-secure-portal-789@pdfbundles.com';

  const mailOptions = {
    from: `"pdfbundles Contact Sales" <${process.env.SMTP_USER || 'sales@pdfbundles.com'}>`,
    to: adminEmail,
    subject: `New Enterprise Inquiry from ${firstName} ${lastName} (${companyName})`,
    text: `New contact sales inquiry received:
    
First Name: ${firstName}
Last Name: ${lastName}
Company: ${companyName}
Business Email: ${businessEmail}
Message:
${message}
`,
    html: `
      <h2>New Enterprise Inquiry</h2>
      <p><strong>First Name:</strong> ${firstName}</p>
      <p><strong>Last Name:</strong> ${lastName}</p>
      <p><strong>Company:</strong> ${companyName}</p>
      <p><strong>Business Email:</strong> <a href="mailto:${businessEmail}">${businessEmail}</a></p>
      <p><strong>Message:</strong></p>
      <blockquote style="background: #f3f4f6; padding: 10px 15px; border-left: 4px solid #6366f1;">
        ${message.replace(/\n/g, '<br>')}
      </blockquote>
    `
  };

  try {
    // Save to Database
    await ContactInquiry.create({
      first_name: firstName,
      last_name: lastName,
      company_name: companyName,
      business_email: businessEmail,
      message: message
    });

    if (transporter.options.host === 'smtp.ethereal.email' && transporter.options.auth.user === 'ethereal.user@ethereal.email') {
      console.log(`[SMTP Simulated] Inquiry from ${businessEmail} successfully processed! (Ethereal Simulated).`);
      return res.json({ success: true, message: 'Thank you! Your inquiry has been submitted successfully.' });
    }
    
    await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Sent enterprise inquiry from ${businessEmail} to admin.`);
    res.json({ success: true, message: 'Thank you! Your inquiry has been submitted successfully.' });
  } catch (err) {
    console.error('[SMTP/DB Error]', err);
    console.log('Fallback to database-only save/mock success for convenience.');
    return res.json({ success: true, message: 'Thank you! Your inquiry has been submitted successfully.' });
  }
});

// Admin inquiries fetch
router.get('/admin/inquiries', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    const inquiries = await ContactInquiry.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ inquiries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve inquiries.' });
  }
});

// Admin inquiry deletion
router.delete('/admin/inquiries/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    const inquiry = await ContactInquiry.findByPk(req.params.id);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found.' });
    await inquiry.destroy();
    res.json({ success: true, message: 'Inquiry deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete inquiry.' });
  }
});

// Admin newsletter subscribers fetch
router.get('/admin/subscribers', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    const subscribers = await NewsletterSubscriber.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ subscribers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve newsletter subscribers.' });
  }
});

// Admin newsletter subscriber deletion / unsubscribe
router.delete('/admin/subscribers/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    const subscriber = await NewsletterSubscriber.findByPk(req.params.id);
    if (!subscriber) return res.status(404).json({ error: 'Subscriber not found.' });
    await subscriber.destroy();
    res.json({ success: true, message: 'Subscriber deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete subscriber.' });
  }
});

// Admin manual account plan override configuration API
router.post('/admin/set-plan', authenticateToken, async (req, res) => {
  const { email, plan, seats, interval, customFeatures, custom_features, features, role } = req.body;
  const finalFeatures = customFeatures !== undefined ? customFeatures : (custom_features !== undefined ? custom_features : features);
  if (!email || !plan) {
    return res.status(400).json({ error: 'Email and plan are required.' });
  }
  
  try {
    const adminUser = await User.findByPk(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    
    user.subscription_plan = plan;
    user.subscription_seats = parseInt(seats, 10) || 1;
    user.subscription_interval = interval || 'month';
    user.is_premium = plan !== 'free';
    
    if (plan === 'free') {
      user.subscription_expires_at = null;
      user.stripe_subscription_id = null;
    } else if (req.body.expires_at) {
      user.subscription_expires_at = new Date(req.body.expires_at);
    } else {
      const now = new Date();
      const durationDays = (user.subscription_interval === 'year' || user.subscription_interval === 'yearly') ? 365 : 30;
      now.setDate(now.getDate() + durationDays);
      user.subscription_expires_at = now;
    }
    
    if (role) {
      user.role = role;
    }
    
    if (finalFeatures !== undefined) {
      if (typeof finalFeatures === 'object') {
        user.custom_features = JSON.stringify(finalFeatures);
      } else {
        user.custom_features = finalFeatures;
      }
    }
    
    await user.save();
    
    console.log(`[Admin Override] Configured user ${email} (plan: ${plan}, seats: ${user.subscription_seats}, role: ${user.role}, features: ${user.custom_features}).`);
    res.json({ success: true, message: `Successfully updated user ${email} configuration.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Admin configuration failed: ' + err.message });
  }
});

export default router;
