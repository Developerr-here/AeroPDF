import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');

import { User, CollaborationEmail } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pdfbundles-enterprise-security-secret-passphrase';

// Copied verbatim from server.js for validation
const getAICreditLimit = (plan, user) => {
  if (plan === 'custom' && user && user.custom_features) {
    try {
      const custom = typeof user.custom_features === 'string' ? JSON.parse(user.custom_features) : user.custom_features;
      if (custom && custom.ai_credits_limit !== undefined) {
        return parseInt(custom.ai_credits_limit, 10);
      }
    } catch (e) {}
  }
  
  const limits = {
    free: 0,
    starter: 50,
    base: 150,
    pro: 1000,
    enterprise: 999999,
    premium: 1000,
    business: 999999
  };
  
  return limits[plan] || 0;
};

const checkAISubscription = (dbUser) => {
  if (!dbUser) return false;
  if (dbUser.role === 'admin') return true;
  const plan = dbUser.subscription_plan || 'free';
  if (['premium', 'business', 'starter', 'base', 'pro', 'enterprise'].includes(plan)) {
    return true;
  }
  if (plan === 'custom') {
    return isToolAllowedForUser(dbUser, 'ai-assistant');
  }
  return false;
};

const resolveEffectivePlanAndUser = async (dbUser) => {
  if (!dbUser) return { plan: 'free', user: null };
  if (dbUser.subscription_plan && dbUser.subscription_plan !== 'free') {
    return { plan: dbUser.subscription_plan, user: dbUser };
  }
  const isCollaborator = await CollaborationEmail.findOne({
    where: { email: dbUser.email }
  });
  if (isCollaborator) {
    const owner = await User.findByPk(isCollaborator.owner_id);
    if (owner && owner.subscription_plan && owner.subscription_plan !== 'free') {
      return { plan: owner.subscription_plan, user: owner };
    }
  }
  return { plan: 'free', user: dbUser };
};

const verifyAISubscriptionAndCredits = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let isAllowed = false;
  let effectiveUser = null;
  let planName = 'free';

  const getAICostForRoute = (path) => {
    if (path.includes('/remove-background')) return 500;
    if (path.includes('/upscale')) return 450;
    return 5;
  };

  const cost = getAICostForRoute(req.path);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const dbUser = await User.findByPk(decoded.id);
      if (dbUser) {
        const resolved = await resolveEffectivePlanAndUser(dbUser);
        planName = resolved.plan;
        
        if (checkAISubscription(resolved.user)) {
          effectiveUser = dbUser;
          const limit = getAICreditLimit(planName, dbUser);
          const used = dbUser.ai_credits_used || 0;
          if (used + cost <= limit) {
            isAllowed = true;
          } else {
            return res.status(403).json({ error: `Insufficient AI Credits. This request requires ${cost} credits, but you only have ${limit - used} credits remaining.` });
          }
        }
      }
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  if (!isAllowed) {
    return res.status(403).json({ error: 'AI tools (including Summarize, Chat, Translate, Background Remover, and Upscaler) are only available on the Premium or Business plan. Please upgrade to continue.' });
  }

  if (effectiveUser) {
    effectiveUser.ai_credits_used = (effectiveUser.ai_credits_used || 0) + cost;
    await effectiveUser.save();
    req.user = { id: effectiveUser.id, email: effectiveUser.email };
  }
  next();
};

const runMiddleware = (req, res, middleware) => {
  return new Promise((resolve) => {
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.jsonData = data;
      resolve({ nextCalled: false, blocked: true, code: res.statusCode || 200, data });
      return res;
    };
    res.send = (data) => {
      res.sendData = data;
      resolve({ nextCalled: false, blocked: true, code: res.statusCode || 200, data });
      return res;
    };

    middleware(req, res, () => {
      resolve({ nextCalled: true, blocked: false });
    }).catch(err => {
      resolve({ nextCalled: false, error: err });
    });
  });
};

// Test Runner
async function runTests() {
  console.log('--- Starting AI Credits Integration Tests ---');
  let testUsers = [];
  let testCollabs = [];

  try {
    // Clean up any lingering users from previous failed runs
    await User.destroy({
      where: {
        email: [
          'free_test_user@pdfbundles.com',
          'premium_test_owner@pdfbundles.com',
          'collaborator_test@pdfbundles.com'
        ]
      }
    });
    await CollaborationEmail.destroy({
      where: {
        email: 'collaborator_test@pdfbundles.com'
      }
    });

    // 1. Create Free User
    const freeUser = await User.create({
      email: 'free_test_user@pdfbundles.com',
      password_hash: 'mock_hash',
      first_name: 'Free',
      last_name: 'User',
      subscription_plan: 'free',
      ai_credits_used: 0
    });
    testUsers.push(freeUser);

    // 2. Create Premium Owner User
    const premiumOwner = await User.create({
      email: 'premium_test_owner@pdfbundles.com',
      password_hash: 'mock_hash',
      first_name: 'Premium',
      last_name: 'Owner',
      subscription_plan: 'premium',
      ai_credits_used: 0
    });
    testUsers.push(premiumOwner);

    // 3. Create Collaborator User
    const collaborator = await User.create({
      email: 'collaborator_test@pdfbundles.com',
      password_hash: 'mock_hash',
      first_name: 'Collab',
      last_name: 'User',
      subscription_plan: 'free', // Member is free plan themselves, inherits from owner
      ai_credits_used: 0
    });
    testUsers.push(collaborator);

    // Invite collaborator
    const collabEmail = await CollaborationEmail.create({
      email: 'collaborator_test@pdfbundles.com',
      owner_id: premiumOwner.id,
      status: 'accepted'
    });
    testCollabs.push(collabEmail);

    // Tokens
    const freeToken = jwt.sign({ id: freeUser.id, email: freeUser.email }, JWT_SECRET);
    const premiumToken = jwt.sign({ id: premiumOwner.id, email: premiumOwner.email }, JWT_SECRET);
    const collabToken = jwt.sign({ id: collaborator.id, email: collaborator.email }, JWT_SECRET);

    console.log('Test environment setup successful.\n');

    // TEST 1: Free User Access Blocked
    console.log('TEST 1: Free user should be blocked from using AI Summarizer...');
    const req1 = { headers: { 'authorization': `Bearer ${freeToken}` }, path: '/api/ai/summarize' };
    const res1 = { statusCode: 200 };
    const result1 = await runMiddleware(req1, res1, verifyAISubscriptionAndCredits);
    if (result1.blocked && result1.code === 403) {
      console.log('  -> PASS: Free user blocked correctly. Message:', result1.data.error);
    } else {
      console.error('  -> FAIL: Free user was not blocked! Result:', result1);
    }

    // TEST 2: Premium User Text tool deducts 5 credits
    console.log('\nTEST 2: Premium user text query should deduct 5 credits...');
    const req2 = { headers: { 'authorization': `Bearer ${premiumToken}` }, path: '/api/ai/summarize' };
    const res2 = { statusCode: 200 };
    const result2 = await runMiddleware(req2, res2, verifyAISubscriptionAndCredits);
    await premiumOwner.reload();
    if (result2.nextCalled && premiumOwner.ai_credits_used === 5) {
      console.log(`  -> PASS: 5 credits deducted correctly. New total: ${premiumOwner.ai_credits_used}`);
    } else {
      console.error(`  -> FAIL: Next called: ${result2.nextCalled}, credits used: ${premiumOwner.ai_credits_used}`);
    }

    // TEST 3: Collaborator User should have separate credits (starts at 0, goes to 5, owner stays at 5)
    console.log('\nTEST 3: Collaborator user text query should deduct separate credits...');
    const req3 = { headers: { 'authorization': `Bearer ${collabToken}` }, path: '/api/ai/chat' };
    const res3 = { statusCode: 200 };
    const result3 = await runMiddleware(req3, res3, verifyAISubscriptionAndCredits);
    await collaborator.reload();
    await premiumOwner.reload();
    if (result3.nextCalled && collaborator.ai_credits_used === 5 && premiumOwner.ai_credits_used === 5) {
      console.log('  -> PASS: Credits resolved and deducted separately.');
      console.log(`     Collaborator credits used: ${collaborator.ai_credits_used}`);
      console.log(`     Owner credits used: ${premiumOwner.ai_credits_used}`);
    } else {
      console.error(`  -> FAIL: Next called: ${result3.nextCalled}. Collab credits: ${collaborator.ai_credits_used}, Owner credits: ${premiumOwner.ai_credits_used}`);
    }

    // TEST 4: Background removal deducts 500 credits
    console.log('\nTEST 4: Premium user background removal should deduct 500 credits...');
    const req4 = { headers: { 'authorization': `Bearer ${premiumToken}` }, path: '/api/image/remove-background' };
    const res4 = { statusCode: 200 };
    const result4 = await runMiddleware(req4, res4, verifyAISubscriptionAndCredits);
    await premiumOwner.reload();
    if (result4.nextCalled && premiumOwner.ai_credits_used === 505) { // 5 (from test 2) + 500 = 505
      console.log(`  -> PASS: 500 credits deducted correctly. New total: ${premiumOwner.ai_credits_used}`);
    } else {
      console.error(`  -> FAIL: Next called: ${result4.nextCalled}. Credits: ${premiumOwner.ai_credits_used}`);
    }

    // TEST 5: Upscale deducts 450 credits
    console.log('\nTEST 5: Premium user upscaling should deduct 450 credits...');
    const req5 = { headers: { 'authorization': `Bearer ${premiumToken}` }, path: '/api/image/upscale' };
    const res5 = { statusCode: 200 };
    const result5 = await runMiddleware(req5, res5, verifyAISubscriptionAndCredits);
    await premiumOwner.reload();
    if (result5.nextCalled && premiumOwner.ai_credits_used === 955) { // 505 + 450 = 955
      console.log(`  -> PASS: 450 credits deducted correctly. New total: ${premiumOwner.ai_credits_used}`);
    } else {
      console.error(`  -> FAIL: Next called: ${result5.nextCalled}. Credits: ${premiumOwner.ai_credits_used}`);
    }

    // TEST 6: Insufficient credits check
    console.log('\nTEST 6: Premium user with insufficient credits (955 used, needs 50 more for text tool) should be blocked...');
    
    // First request translate (requires 5 credits). 955 + 5 = 960 <= 1000 limit, so this should pass
    const req6 = { headers: { 'authorization': `Bearer ${premiumToken}` }, path: '/api/ai/translate' };
    const res6 = { statusCode: 200 };
    const result6 = await runMiddleware(req6, res6, verifyAISubscriptionAndCredits);
    await premiumOwner.reload();
    console.log(`  Current premium used: ${premiumOwner.ai_credits_used} / 1000`);
    console.log('  Requesting upscale (needs 450 credits)...');
    
    const req7 = { headers: { 'authorization': `Bearer ${premiumToken}` }, path: '/api/image/upscale' };
    const res7 = { statusCode: 200 };
    const result7 = await runMiddleware(req7, res7, verifyAISubscriptionAndCredits);
    
    if (result7.blocked && result7.code === 403) {
      console.log('  -> PASS: Insufficient credits blocked correctly. Error:', result7.data.error);
    } else {
      console.error(`  -> FAIL: Request allowed? ${result7.nextCalled}, Status: ${result7.code}, Result:`, result7);
    }

  } catch (err) {
    console.error('Test Execution Error:', err);
  } finally {
    // Cleanup mock records
    console.log('\nCleaning up mock test database records...');
    for (const collab of testCollabs) {
      try { await collab.destroy(); } catch (e) {}
    }
    for (const user of testUsers) {
      try { await user.destroy(); } catch (e) {}
    }
    console.log('Cleanup complete.');
  }
}

runTests();
