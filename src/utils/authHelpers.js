import { User, CollaborationEmail } from '../../db.js';

// Helper: Check if a subscription has expired based on subscription_expires_at
export function isSubscriptionExpired(user) {
  if (!user || user.role === 'admin') return false;
  if (!user.subscription_expires_at) return false;
  return new Date() > new Date(user.subscription_expires_at);
}

// Helper: Calculate dynamic premium status (including collaboration membership)
export async function getPremiumStatus(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  
  if (isSubscriptionExpired(user)) {
    return false;
  }

  if (user.is_premium || (user.subscription_plan && user.subscription_plan !== 'free')) {
    return true;
  }
  
  const isCollaborator = await CollaborationEmail.findOne({
    where: { email: user.email }
  });
  if (isCollaborator) {
    const owner = await User.findByPk(isCollaborator.owner_id);
    if (owner && !isSubscriptionExpired(owner) && ['premium', 'business', 'starter', 'base', 'pro', 'enterprise', 'custom'].includes(owner.subscription_plan)) {
      return true;
    }
  }
  return false;
}

// Helper: Serialize user responses consistently with dynamic premium and plan information
export async function formatUserResponse(user) {
  if (!user) return null;
  const isExpired = isSubscriptionExpired(user);
  let plan = user.subscription_plan || 'free';
  if (isExpired) {
    plan = 'free';
  } else if (plan === 'free') {
    const isCollab = await CollaborationEmail.findOne({ where: { email: user.email } });
    if (isCollab) {
      const owner = await User.findByPk(isCollab.owner_id);
      if (owner && !isSubscriptionExpired(owner)) {
        plan = 'collaborator';
      }
    }
  }
  return {
    id: user.id,
    email: user.email,
    is_premium: await getPremiumStatus(user),
    subscription_plan: plan,
    subscription_seats: user.subscription_seats,
    subscription_interval: user.subscription_interval,
    subscription_expires_at: user.subscription_expires_at,
    role: user.role,
    custom_features: user.custom_features,
    can_blog: user.can_blog,
    display_name: user.display_name,
    first_name: user.first_name,
    last_name: user.last_name,
    profile_pic: user.profile_pic,
    cumulative_bytes_processed: user.cumulative_bytes_processed,
    ai_credits_used: user.ai_credits_used,
    createdAt: user.createdAt
  };
}

export const resolveEffectivePlanAndUser = async (dbUser) => {
  if (!dbUser) return { plan: 'free', user: null };
  if (dbUser.role === 'admin') {
    let adminPlan = dbUser.subscription_plan || 'premium';
    if (adminPlan === 'free') adminPlan = 'premium';
    return { plan: adminPlan, user: dbUser };
  }

  let selfPlan = dbUser.subscription_plan || 'free';
  if (selfPlan === 'free' && dbUser.is_premium) selfPlan = 'premium';

  if (selfPlan !== 'free') {
    if (isSubscriptionExpired(dbUser)) {
      return { plan: 'free', user: dbUser };
    }
    return { plan: selfPlan, user: dbUser };
  }

  const isCollaborator = await CollaborationEmail.findOne({
    where: { email: dbUser.email }
  });
  
  if (isCollaborator) {
    const owner = await User.findByPk(isCollaborator.owner_id);
    if (owner) {
      let ownerPlan = owner.subscription_plan || 'free';
      if (ownerPlan === 'free' && owner.is_premium) ownerPlan = 'premium';
      
      if (ownerPlan !== 'free' && !isSubscriptionExpired(owner)) {
        return { plan: ownerPlan, user: owner };
      }
    }
  }
  return { plan: 'free', user: dbUser };
};

export const getToolKeyFromPath = (path) => {
  if (path.includes('/merge')) return 'merge';
  if (path.includes('/split')) return 'split';
  if (path.includes('/remove-pages')) return 'remove-pages';
  if (path.includes('/extract-pages')) return 'extract-pages';
  if (path.includes('/organize')) return 'organize-pdf';
  if (path.includes('/scan')) return 'scan-to-pdf';
  if (path.includes('/compress')) return 'compress';
  if (path.includes('/repair')) return 'repair';
  if (path.includes('/ocr')) return 'ocr';
  if (path.includes('/img-to-pdf') || path.includes('/jpg-to-pdf')) return 'img-to-pdf';
  if (path.includes('/word-to-pdf')) return 'word-to-pdf';
  if (path.includes('/ppt-to-pdf')) return 'ppt-to-pdf';
  if (path.includes('/excel-to-pdf')) return 'excel-to-pdf';
  if (path.includes('/html-to-pdf')) return 'html-to-pdf';
  if (path.includes('/pdf-to-img') || path.includes('/pdf-to-jpg')) return 'pdf-to-img';
  if (path.includes('/pdf-to-word')) return 'pdf-to-word';
  if (path.includes('/pdf-to-ppt')) return 'pdf-to-ppt';
  if (path.includes('/pdf-to-excel')) return 'pdf-to-excel';
  if (path.includes('/pdf-to-pdfa')) return 'pdf-to-pdfa';
  if (path.includes('/rotate')) return 'rotate';
  if (path.includes('/page-numbers')) return 'page-numbers';
  if (path.includes('/watermark')) return 'watermark';
  if (path.includes('/crop')) return 'crop';
  if (path.includes('/edit-pdf')) return 'edit-pdf';
  if (path.includes('/pdf-forms')) return 'pdf-forms';
  if (path.includes('/unlock')) return 'unlock';
  if (path.includes('/protect')) return 'protect';
  if (path.includes('/sign')) return 'sign';
  if (path.includes('/redact')) return 'redact';
  if (path.includes('/compare')) return 'compare';
  if (path.includes('/summarize') || path.includes('/translate') || path.includes('/assistant')) return 'ai-assistant';
  if (path.includes('/remove-background')) return 'remove-background';
  if (path.includes('/upscale-image')) return 'upscale-image';
  return 'utility';
};

export const isToolAllowedForUser = (user, toolKey, ownerUser = null) => {
  if (!user) return false;
  const effective = ownerUser || user;
  if (effective.role === 'admin' || user.role === 'admin') return true;
  
  let plan = effective.subscription_plan || 'free';
  if (plan === 'free' && effective.is_premium) plan = 'premium';
  
  if (plan === 'free') return false;
  
  if (plan === 'custom') {
    if (!effective.custom_features) return false;
    try {
      const custom = typeof effective.custom_features === 'string' ? JSON.parse(effective.custom_features) : effective.custom_features;
      if (custom) {
        if (custom.allowedTools && Array.isArray(custom.allowedTools)) {
          return custom.allowedTools.includes(toolKey);
        }
        if (custom[toolKey] !== undefined) {
          return !!custom[toolKey];
        }
      }
    } catch (e) {
      return false;
    }
    return false;
  }
  return true;
};

export const checkAISubscription = (dbUser) => {
  if (!dbUser) return false;
  if (dbUser.role === 'admin') return true;
  
  let plan = dbUser.subscription_plan || 'free';
  if (plan === 'free' && dbUser.is_premium) plan = 'premium';

  if (['premium', 'business', 'starter', 'base', 'pro', 'enterprise'].includes(plan)) {
    return true;
  }
  if (plan === 'custom') {
    return isToolAllowedForUser(dbUser, 'ai-assistant');
  }
  return false;
};

export const getToolLimit = (path, plan, dbUser) => {
  let isPremium = ['premium', 'business', 'starter', 'base', 'pro', 'enterprise'].includes(plan);
  
  if (plan === 'custom' && dbUser) {
    const toolKey = getToolKeyFromPath(path);
    isPremium = isToolAllowedForUser(dbUser, toolKey);
  }
  
  if (path.includes('/merge') || path.includes('/split')) {
    return isPremium ? 4 * 1024 * 1024 * 1024 : 100 * 1024 * 1024; // 4GB vs 100MB
  }
  if (path.includes('/compress')) {
    return isPremium ? 4 * 1024 * 1024 * 1024 : 200 * 1024 * 1024; // 4GB vs 200MB
  }
  if (path.includes('/word-to-pdf') || path.includes('/ppt-to-pdf') || path.includes('/excel-to-pdf') ||
      path.includes('/pdf-to-word') || path.includes('/pdf-to-ppt') || path.includes('/pdf-to-excel') ||
      path.includes('/office-to-pdf') || path.includes('/pdf-to-office')) {
    return isPremium ? 4 * 1024 * 1024 * 1024 : 15 * 1024 * 1024; // 4GB vs 15MB
  }
  if (path.includes('/ocr')) {
    return isPremium ? 4 * 1024 * 1024 * 1024 : 15 * 1024 * 1024; // 4GB vs 15MB
  }
  if (path.includes('/pdf-to-img')) {
    return isPremium ? 4 * 1024 * 1024 * 1024 : 25 * 1024 * 1024; // 4GB vs 25MB
  }
  if (path.includes('/img-to-pdf')) {
    return isPremium ? 4 * 1024 * 1024 * 1024 : 40 * 1024 * 1024; // 4GB vs 40MB
  }
  if (path.includes('/edit-pdf')) {
    return 100 * 1024 * 1024; // 100MB all plans
  }
  if (path.includes('/sign')) {
    return 50 * 1024 * 1024; // 50MB all plans
  }
  if (path.includes('/redact') || path.includes('/compare')) {
    return 400 * 1024 * 1024; // 400MB all plans
  }
  if (path.includes('/pdf-forms')) {
    return isPremium ? 100 * 1024 * 1024 : 15 * 1024 * 1024; // 100MB vs 15MB
  }
  if (path.includes('/summarize')) {
    return 50 * 1024 * 1024; // 50MB
  }
  if (path.includes('/translate')) {
    return 200 * 1024 * 1024; // 200MB
  }
  // Default limits for utility tools
  return isPremium ? 4 * 1024 * 1024 * 1024 : 100 * 1024 * 1024;
};

export const getAICreditLimit = (plan, user) => {
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
