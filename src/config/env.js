import 'dotenv/config';

export const JWT_SECRET = process.env.JWT_SECRET || 'pdfbundles-enterprise-security-secret-passphrase';
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mockstripekey';
export const CLOUDMERSIVE_API_KEY = process.env.CLOUDMERSIVE_API_KEY;
export const GROQ_API_KEY = process.env.GROQ_API_KEY;
export const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
export const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;
export const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
export const DEEPAI_API_KEY = process.env.DEEPAI_API_KEY;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const PORT = process.env.PORT || 3000;
