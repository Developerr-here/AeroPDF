import express from 'express';
import { User, NewsletterSubscriber } from '../../db.js';
import { authenticateToken } from '../middlewares/auth.js';
import { stripe } from '../config/stripe.js';
import { STRIPE_SECRET_KEY } from '../config/env.js';
import { formatUserResponse } from '../utils/authHelpers.js';

const router = express.Router();

// Route: Subscription checkout session
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const { plan, seats: seatsInput, interval: intervalInput } = req.body;
    const selectedPlan = plan === 'premium' ? 'premium' : 'premium';
    const seats = Math.min(25, Math.max(1, parseInt(seatsInput, 10) || 1));
    const interval = intervalInput === 'year' ? 'year' : 'month';

    const unitAmount = interval === 'year' ? 4800 : 700; // $48.00/year ($4.00/mo) vs $7.00/month
    const planName = `pdfbundles Premium Plan (${seats} Seat${seats > 1 ? 's' : ''})`;

    const isMock = STRIPE_SECRET_KEY === 'sk_test_mockstripekey';
    if (isMock) {
      const mockUrl = `/api/stripe/mock-checkout?type=${selectedPlan}&seats=${seats}&interval=${interval}&userId=${user.id}&success_url=${encodeURIComponent(req.headers.origin || 'http://localhost:5173')}/?payment=success`;
      return res.json({ url: mockUrl });
    }

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      user.stripe_customer_id = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: planName,
            description: `Unlock premium document processing for your team.`
          },
          unit_amount: unitAmount,
          recurring: { interval: interval }
        },
        quantity: seats
      }],
      mode: 'subscription',
      success_url: `${req.headers.origin || 'http://localhost:5173'}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/?payment=cancel`,
      metadata: {
        userId: user.id,
        type: 'subscription',
        plan: selectedPlan,
        seats: seats.toString(),
        interval: interval
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Stripe subscription checkout failed: ' + err.message, message: err.message });
  }
});

// Route: Blog writer fee checkout session
router.post('/blog-checkout', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const isMock = STRIPE_SECRET_KEY === 'sk_test_mockstripekey';
    if (isMock) {
      const mockUrl = `/api/stripe/mock-checkout?type=blog_pass&userId=${user.id}&success_url=${encodeURIComponent(req.headers.origin || 'http://localhost:5173')}/?payment=blog-success`;
      return res.json({ url: mockUrl });
    }

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      user.stripe_customer_id = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'pdfbundles Single Blog Post Publishing Pass',
            description: 'Allows you to publish a single article on the pdfbundles Blog page'
          },
          unit_amount: 1200 // $12.00
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${req.headers.origin || 'http://localhost:5173'}/?payment=blog-success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/?payment=cancel`,
      metadata: {
        userId: user.id,
        type: 'blog_pass'
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Stripe blog checkout failed: ' + err.message, message: err.message });
  }
});

// Route: Newsletter subscription - directly saving to database (free)
router.post('/newsletter-checkout', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required for newsletter subscription.' });
    }

    const emailLower = email.toLowerCase().trim();
    
    // Save/Upsert to database
    await NewsletterSubscriber.upsert({
      email: emailLower,
      status: 'active'
    });

    console.log(`[Newsletter] Free subscription successful for ${emailLower}.`);
    res.json({ success: true, message: 'Successfully subscribed to the newsletter!' });
  } catch (err) {
    console.error('[Newsletter Error]', err);
    res.status(500).json({ error: 'Failed to subscribe to the newsletter: ' + err.message });
  }
});

// Route: Mock checkout processor for local testing
router.get('/mock-checkout', async (req, res) => {
  const { type, userId, email, success_url } = req.query;
  try {
    if (type === 'newsletter') {
      if (email) {
        await NewsletterSubscriber.upsert({
          email: email.toLowerCase(),
          status: 'active'
        });
        console.log(`[Mock Stripe] Newsletter subscription successful for ${email}.`);
      }
    } else if (userId) {
      const user = await User.findByPk(userId);
      if (user) {
        if (type === 'premium') {
          user.is_premium = true;
          user.subscription_plan = 'premium';
          user.subscription_seats = parseInt(req.query.seats, 10) || 1;
          user.subscription_interval = req.query.interval === 'year' ? 'year' : 'month';
          await user.save();
          console.log(`[Mock Stripe] Upgraded user ${user.email} to Premium (${user.subscription_seats} seats, ${user.subscription_interval}).`);
        } else if (['starter', 'base', 'pro', 'enterprise'].includes(type)) {
          user.is_premium = true;
          user.subscription_plan = type;
          user.subscription_seats = parseInt(req.query.seats, 10) || 1;
          user.subscription_interval = req.query.interval === 'year' ? 'year' : 'month';
          await user.save();
          console.log(`[Mock Stripe] Upgraded user ${user.email} to ${type.toUpperCase()} plan.`);
        } else if (type === 'blog_pass') {
          user.can_blog = true;
          await user.save();
          console.log(`[Mock Stripe] Granted blog writer permissions to ${user.email}.`);
        }
      }
    }
    res.redirect(success_url || 'http://localhost:5173/?payment=success');
  } catch (err) {
    console.error(err);
    res.status(500).send('Mock payment processing failed.');
  }
});

// Route: Verify Stripe checkout session status (Fallback for local dev without webhooks)
router.post('/verify-payment', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Session ID is required.' });

    const isMock = STRIPE_SECRET_KEY === 'sk_test_mockstripekey';
    if (isMock) {
      const user = await User.findByPk(req.user.id);
      return res.json({ 
        success: true, 
        user: await formatUserResponse(user)
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) return res.status(404).json({ error: 'Checkout session not found.' });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (session.payment_status === 'paid') {
      const type = session.metadata.type;
      const plan = session.metadata.plan || 'starter';
      if (type === 'subscription') {
        user.is_premium = true;
        user.subscription_plan = plan;
        user.subscription_seats = parseInt(session.metadata.seats, 10) || 1;
        user.subscription_interval = session.metadata.interval || 'month';
        if (session.customer) user.stripe_customer_id = session.customer;
        if (session.subscription) user.stripe_subscription_id = session.subscription;
        
        const now = new Date();
        const durationDays = (user.subscription_interval === 'year' || user.subscription_interval === 'yearly') ? 365 : 30;
        now.setDate(now.getDate() + durationDays);
        user.subscription_expires_at = now;
      } else if (type === 'blog_pass') {
        user.can_blog = true;
      }
      await user.save();
      
      console.log(`[Stripe Verification] Verified payment and updated ${user.email} status (type: ${type}, expires: ${user.subscription_expires_at}).`);
      return res.json({ 
        success: true, 
        user: await formatUserResponse(user)
      });
    }

    res.json({ success: false, error: 'Payment session is not fully paid.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Stripe verification failed: ' + err.message });
  }
});

// Route: Webhook callbacks (requires raw body parsing)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata ? session.metadata.userId : null;
      const type = session.metadata ? session.metadata.type : null;

      if (type === 'newsletter') {
        const email = session.metadata?.email || (session.customer_details && session.customer_details.email);
        if (email) {
          await NewsletterSubscriber.upsert({
            email: email.toLowerCase(),
            status: 'active',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription
          });
          console.log(`[Stripe Webhook] Newsletter subscription completed for ${email}`);
        }
      } else if (userId) {
        const user = await User.findByPk(userId);
        if (user) {
          if (type === 'subscription') {
            user.is_premium = true;
            user.subscription_plan = session.metadata.plan || 'premium';
            user.subscription_seats = parseInt(session.metadata.seats, 10) || 1;
            user.subscription_interval = session.metadata.interval || 'month';
            if (session.customer) user.stripe_customer_id = session.customer;
            if (session.subscription) user.stripe_subscription_id = session.subscription;

            const now = new Date();
            const durationDays = (user.subscription_interval === 'year' || user.subscription_interval === 'yearly') ? 365 : 30;
            now.setDate(now.getDate() + durationDays);
            user.subscription_expires_at = now;

            console.log(`[Stripe Webhook] Upgraded user ${user.email} to Premium (${user.subscription_seats} seats, ${user.subscription_interval} plan, expires ${user.subscription_expires_at}).`);
          } else if (type === 'blog_pass') {
            user.can_blog = true;
            console.log(`[Stripe] Granted blog writer permissions to ${user.email}.`);
          }
          await user.save();
        }
      }
    } else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      const customerId = invoice.customer;
      
      if (subscriptionId || customerId) {
        const user = await User.findOne({ 
          where: subscriptionId ? { stripe_subscription_id: subscriptionId } : { stripe_customer_id: customerId } 
        });
        if (user && user.subscription_plan !== 'free') {
          user.is_premium = true;
          const now = new Date();
          const durationDays = (user.subscription_interval === 'year' || user.subscription_interval === 'yearly') ? 365 : 30;
          now.setDate(now.getDate() + durationDays);
          user.subscription_expires_at = now;
          await user.save();
          console.log(`[Stripe Webhook] Extended recurring subscription for ${user.email} until ${user.subscription_expires_at}.`);
        }
      }
    } else if (event.type === 'customer.subscription.deleted' || event.type === 'invoice.payment_failed') {
      const subscription = event.data.object;
      const subscriptionId = subscription.id || subscription.subscription;
      const customerId = subscription.customer;

      if (subscriptionId || customerId) {
        const user = await User.findOne({ 
          where: subscriptionId ? { stripe_subscription_id: subscriptionId } : { stripe_customer_id: customerId } 
        });
        if (user) {
          user.is_premium = false;
          user.subscription_plan = 'free';
          user.subscription_expires_at = null;
          user.stripe_subscription_id = null;
          await user.save();
          console.log(`[Stripe Webhook] Downgraded user ${user.email} to free plan due to subscription cancellation or payment failure.`);
        }
      }
    }
  } catch (err) {
    console.error(`[Stripe Webhook Processing Error]`, err);
  }

  res.json({ received: true });
});

export default router;
