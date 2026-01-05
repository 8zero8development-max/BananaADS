import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync, getStripePublishableKey, getUncachableStripeClient } from './stripeClient';
import { WebhookHandlers } from './webhookHandlers';
import { storage } from './storage';
import { stripeService } from './stripeService';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { setupAuth, registerAuthRoutes } from './replit_integrations/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProd = process.env.NODE_ENV === 'production' || !!process.env.REPLIT_DEPLOYMENT;
const PORT = process.env.PORT ? parseInt(process.env.PORT) : (isProd ? 5000 : 3001);

// Resolve dist path - try process.cwd() first (more reliable in deployments), fallback to __dirname
function resolveDistPath(): string {
  const candidates = [
    path.join(process.cwd(), 'dist'),
    path.join(__dirname, '..', 'dist'),
    path.join(__dirname, 'dist'),
  ];
  
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'index.html'))) {
      console.log(`Using dist path: ${candidate}`);
      return candidate;
    }
  }
  
  // Default to process.cwd() based path
  const defaultPath = candidates[0];
  console.warn(`No dist/index.html found, defaulting to: ${defaultPath}`);
  return defaultPath;
}

async function initDatabase() {
  console.log('Initializing database tables...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR UNIQUE,
      first_name VARCHAR,
      last_name VARCHAR,
      profile_image_url VARCHAR,
      stripe_customer_id VARCHAR,
      stripe_subscription_id VARCHAR,
      subscription_status VARCHAR,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      sid VARCHAR PRIMARY KEY,
      sess JSONB NOT NULL,
      expire TIMESTAMP NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire)
  `);
  console.log('Database tables ready');
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  try {
    console.log('Initializing Stripe schema...');
    await runMigrations({ 
      databaseUrl
    });
    console.log('Stripe schema ready');

    const stripeSync = await getStripeSync();

    console.log('Setting up managed webhook...');
    const domains = process.env.REPLIT_DOMAINS?.split(',') || [];
    if (domains.length > 0) {
      try {
        const webhookBaseUrl = `https://${domains[0]}`;
        const result = await stripeSync.findOrCreateManagedWebhook(
          `${webhookBaseUrl}/api/stripe/webhook`
        );
        if (result?.webhook?.url) {
          console.log(`Webhook configured: ${result.webhook.url}`);
        } else {
          console.log('Webhook setup completed (no URL returned)');
        }
      } catch (webhookError) {
        console.warn('Webhook setup failed (will retry on next request):', webhookError);
      }
    } else {
      console.log('REPLIT_DOMAINS not set, skipping webhook setup');
    }

    console.log('Syncing Stripe data...');
    stripeSync.syncBackfill()
      .then(() => console.log('Stripe data synced'))
      .catch((err: any) => console.error('Error syncing Stripe data:', err));
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    throw error;
  }
}

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use(express.json());

app.get('/api/stripe/publishable-key', async (req, res) => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get publishable key' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await storage.listProductsWithPrices();
    
    if (products.length === 0) {
      const stripe = await getUncachableStripeClient();
      const stripeProducts = await stripe.products.list({ active: true, limit: 10 });
      const stripePrices = await stripe.prices.list({ active: true, limit: 50 });
      
      const pricesByProduct = new Map<string, any[]>();
      for (const price of stripePrices.data) {
        const productId = typeof price.product === 'string' ? price.product : price.product.id;
        if (!pricesByProduct.has(productId)) {
          pricesByProduct.set(productId, []);
        }
        pricesByProduct.get(productId)!.push({
          id: price.id,
          unit_amount: price.unit_amount,
          currency: price.currency,
          recurring: price.recurring,
          active: price.active,
        });
      }
      
      const formattedProducts = stripeProducts.data.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        active: p.active,
        metadata: p.metadata,
        prices: pricesByProduct.get(p.id) || []
      }));
      
      return res.json({ data: formattedProducts });
    }
    
    const productsMap = new Map();
    for (const row of products as any[]) {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          active: row.product_active,
          metadata: row.product_metadata,
          prices: []
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id).prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
          active: row.price_active,
        });
      }
    }
    res.json({ data: Array.from(productsMap.values()) });
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/checkout', async (req, res) => {
  try {
    const { priceId, userId, email } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'priceId is required' });
    }

    let user = userId ? await storage.getUser(userId) : null;
    let customerId = user?.stripeCustomerId;

    if (!customerId && email) {
      const customer = await stripeService.createCustomer(email, userId || 'guest');
      customerId = customer.id;
      
      if (userId) {
        await storage.updateUserStripeInfo(userId, { stripeCustomerId: customer.id });
      }
    }

    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;
    const session = await stripeService.createCheckoutSession(
      customerId || '',
      priceId,
      `${baseUrl}/app?success=true`,
      `${baseUrl}/?canceled=true`
    );

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/portal', async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }

    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;
    const session = await stripeService.createCustomerPortalSession(
      customerId,
      `${baseUrl}/app`
    );

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Portal error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/subscription/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await storage.getUser(userId);

    if (!user?.stripeSubscriptionId) {
      return res.json({ subscription: null, status: null });
    }

    const subscription = await storage.getSubscription(user.stripeSubscriptionId);
    res.json({ subscription, status: subscription?.status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ============================================================================
// Gmail API Endpoints for Email Campaign Scheduling
// ============================================================================

// In-memory storage for scheduled emails (in production, use database)
interface ScheduledEmail {
  id: string;
  userEmail: string;
  accessToken: string;
  refreshToken?: string;
  to: string[];
  subject: string;
  htmlContent: string;
  scheduledTime: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
  errorMessage?: string;
}

const scheduledEmails: Map<string, ScheduledEmail> = new Map();

// Google OAuth2 configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

// Helper function to get base URL
function getBaseUrl(): string {
  const domains = process.env.REPLIT_DOMAINS?.split(',') || [];
  if (domains.length > 0) {
    return `https://${domains[0]}`;
  }
  return `http://localhost:${PORT}`;
}

// Gmail OAuth2 - Initiate authentication
app.get('/api/gmail/auth', (req, res) => {
  const redirect = req.query.redirect as string || '/';
  
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ 
      error: 'Gmail integration not configured. Please set GOOGLE_CLIENT_ID environment variable.' 
    });
  }

  const baseUrl = getBaseUrl();
  const redirectUri = `${baseUrl}/api/gmail/callback`;
  
  // Store the original redirect URL in state parameter
  const state = Buffer.from(JSON.stringify({ redirect })).toString('base64');
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', GMAIL_SCOPES);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', state);

  res.redirect(authUrl.toString());
});

// Gmail OAuth2 - Handle callback
app.get('/api/gmail/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    console.error('Gmail OAuth error:', error);
    return res.redirect('/?gmail_error=' + encodeURIComponent(error as string));
  }

  if (!code) {
    return res.redirect('/?gmail_error=no_code');
  }

  // Parse the state to get the original redirect URL
  let redirectUrl = '/';
  try {
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    redirectUrl = stateData.redirect || '/';
  } catch (e) {
    console.warn('Failed to parse OAuth state');
  }

  try {
    const baseUrl = getBaseUrl();
    const redirectUri = `${baseUrl}/api/gmail/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code as string,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('Token exchange failed:', errorData);
      return res.redirect(redirectUrl + '?gmail_error=token_exchange_failed');
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token } = tokens;

    // Get user email
    const userInfoResponse = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      return res.redirect(redirectUrl + '?gmail_error=failed_to_get_user_info');
    }

    const userInfo = await userInfoResponse.json();
    const userEmail = userInfo.emailAddress;

    // Redirect back to the app with tokens in URL params
    const redirectWithParams = new URL(redirectUrl, baseUrl);
    redirectWithParams.searchParams.set('gmail_access_token', access_token);
    if (refresh_token) {
      redirectWithParams.searchParams.set('gmail_refresh_token', refresh_token);
    }
    redirectWithParams.searchParams.set('gmail_email', userEmail);

    res.redirect(redirectWithParams.toString());
  } catch (error: any) {
    console.error('Gmail OAuth callback error:', error);
    res.redirect(redirectUrl + '?gmail_error=' + encodeURIComponent(error.message));
  }
});

// Gmail OAuth2 - Refresh access token
app.post('/api/gmail/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Gmail integration not configured' });
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('Token refresh failed:', errorData);
      return res.status(401).json({ error: 'Failed to refresh token' });
    }

    const tokens = await tokenResponse.json();
    res.json({ accessToken: tokens.access_token });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Gmail - Schedule an email for future sending
app.post('/api/gmail/schedule', async (req, res) => {
  const { accessToken, refreshToken, userEmail, to, subject, htmlContent, scheduledTime } = req.body;

  if (!accessToken || !userEmail || !to || !subject || !htmlContent || !scheduledTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate scheduled time
  const scheduledDate = new Date(scheduledTime);
  const now = new Date();
  
  if (scheduledDate <= now) {
    return res.status(400).json({ error: 'Scheduled time must be in the future' });
  }

  const maxScheduleTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (scheduledDate > maxScheduleTime) {
    return res.status(400).json({ error: 'Scheduled time cannot be more than 30 days in the future' });
  }

  // Create scheduled email entry
  const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const scheduledEmail: ScheduledEmail = {
    id: emailId,
    userEmail,
    accessToken,
    refreshToken,
    to: Array.isArray(to) ? to : [to],
    subject,
    htmlContent,
    scheduledTime,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  scheduledEmails.set(emailId, scheduledEmail);

  // Schedule the email to be sent
  const delay = scheduledDate.getTime() - now.getTime();
  setTimeout(async () => {
    await sendScheduledEmail(emailId);
  }, delay);

  console.log(`Email ${emailId} scheduled for ${scheduledTime} (in ${Math.round(delay / 1000 / 60)} minutes)`);

  res.json({
    id: emailId,
    to: scheduledEmail.to,
    subject: scheduledEmail.subject,
    scheduledTime: scheduledEmail.scheduledTime,
    status: scheduledEmail.status,
    createdAt: scheduledEmail.createdAt,
  });
});

// Helper function to send a scheduled email
async function sendScheduledEmail(emailId: string): Promise<void> {
  const email = scheduledEmails.get(emailId);
  if (!email || email.status !== 'pending') {
    return;
  }

  try {
    // Create MIME message
    const boundary = 'boundary_' + Date.now().toString(16);
    const mimeMessage = [
      `From: ${email.userEmail}`,
      `To: ${email.to.join(', ')}`,
      `Subject: =?UTF-8?B?${Buffer.from(email.subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(htmlToPlainText(email.htmlContent)).toString('base64'),
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(email.htmlContent).toString('base64'),
      '',
      `--${boundary}--`,
    ].join('\r\n');

    const raw = Buffer.from(mimeMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${email.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (response.status === 401 && email.refreshToken) {
      // Try to refresh the token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: email.refreshToken,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          grant_type: 'refresh_token',
        }),
      });

      if (refreshResponse.ok) {
        const tokens = await refreshResponse.json();
        email.accessToken = tokens.access_token;
        
        // Retry sending
        const retryResponse = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${email.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw }),
        });

        if (!retryResponse.ok) {
          throw new Error(`Gmail API error: ${retryResponse.status}`);
        }

        email.status = 'sent';
        email.sentAt = new Date().toISOString();
        console.log(`Scheduled email ${emailId} sent successfully after token refresh`);
        return;
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Gmail API error: ${response.status}`);
    }

    email.status = 'sent';
    email.sentAt = new Date().toISOString();
    console.log(`Scheduled email ${emailId} sent successfully`);
  } catch (error: any) {
    console.error(`Failed to send scheduled email ${emailId}:`, error);
    email.status = 'failed';
    email.errorMessage = error.message;
  }
}

// Helper function to convert HTML to plain text
function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// Gmail - Get scheduled emails for a user
app.get('/api/gmail/scheduled', (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const userEmails = Array.from(scheduledEmails.values())
    .filter(e => e.userEmail === email)
    .map(e => ({
      id: e.id,
      to: e.to,
      subject: e.subject,
      scheduledTime: e.scheduledTime,
      status: e.status,
      createdAt: e.createdAt,
      sentAt: e.sentAt,
      errorMessage: e.errorMessage,
    }));

  res.json({ emails: userEmails });
});

// Gmail - Cancel a scheduled email
app.delete('/api/gmail/schedule/:emailId', (req, res) => {
  const { emailId } = req.params;

  const email = scheduledEmails.get(emailId);
  if (!email) {
    return res.status(404).json({ error: 'Scheduled email not found' });
  }

  if (email.status !== 'pending') {
    return res.status(400).json({ error: 'Cannot cancel email that is not pending' });
  }

  scheduledEmails.delete(emailId);
  console.log(`Scheduled email ${emailId} cancelled`);

  res.json({ success: true });
});

// Gmail - Send email immediately (proxy to avoid CORS)
app.post('/api/gmail/send', async (req, res) => {
  const { accessToken, userEmail, to, subject, htmlContent } = req.body;

  if (!accessToken || !userEmail || !to || !subject || !htmlContent) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Create MIME message
    const boundary = 'boundary_' + Date.now().toString(16);
    const mimeMessage = [
      `From: ${userEmail}`,
      `To: ${Array.isArray(to) ? to.join(', ') : to}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(htmlToPlainText(htmlContent)).toString('base64'),
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(htmlContent).toString('base64'),
      '',
      `--${boundary}--`,
    ].join('\r\n');

    const raw = Buffer.from(mimeMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ 
        error: errorData.error?.message || `Gmail API error: ${response.status}` 
      });
    }

    const result = await response.json();
    res.json(result);
  } catch (error: any) {
    console.error('Gmail send error:', error);
    res.status(500).json({ error: error.message || 'Failed to send email' });
  }
});

// Website analysis endpoint for extracting colors and typography (handles CORS)
app.post('/api/analyze-website', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: 'Invalid URL protocol. Only HTTP and HTTPS are supported.' });
      }
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Fetch the website content with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    let html: string;
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BananaADS/1.0; +https://bananaads.com)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.status(502).json({ error: `Failed to fetch website: ${response.status} ${response.statusText}` });
      }

      html = await response.text();
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({ error: 'Website request timed out' });
      }
      return res.status(502).json({ error: `Failed to fetch website: ${fetchError.message}` });
    }

    // Extract colors from inline styles and style tags
    const colors: string[] = [];
    
    // Extract hex colors
    const hexColorRegex = /#([0-9A-Fa-f]{3}){1,2}\b/g;
    const hexMatches = html.match(hexColorRegex) || [];
    colors.push(...hexMatches);

    // Extract rgb/rgba colors
    const rgbColorRegex = /rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/gi;
    const rgbMatches = html.match(rgbColorRegex) || [];
    colors.push(...rgbMatches);

    // Extract hsl/hsla colors
    const hslColorRegex = /hsla?\s*\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(?:,\s*[\d.]+\s*)?\)/gi;
    const hslMatches = html.match(hslColorRegex) || [];
    colors.push(...hslMatches);

    // Extract font families from CSS
    const fonts: string[] = [];
    const fontFamilyRegex = /font-family\s*:\s*([^;}"']+)/gi;
    let fontMatch;
    while ((fontMatch = fontFamilyRegex.exec(html)) !== null) {
      const fontValue = fontMatch[1].trim();
      // Split by comma and clean up each font name
      const fontNames = fontValue.split(',').map(f => f.trim().replace(/["']/g, ''));
      fonts.push(...fontNames);
    }

    // Also extract from @font-face declarations
    const fontFaceRegex = /@font-face\s*\{[^}]*font-family\s*:\s*["']?([^"';}\s]+)["']?/gi;
    while ((fontMatch = fontFaceRegex.exec(html)) !== null) {
      fonts.push(fontMatch[1].trim());
    }

    // Extract Google Fonts from link tags
    const googleFontsRegex = /fonts\.googleapis\.com\/css[^"']*family=([^"'&]+)/gi;
    while ((fontMatch = googleFontsRegex.exec(html)) !== null) {
      const fontParam = decodeURIComponent(fontMatch[1]);
      // Parse font names from the parameter (format: Font+Name:weights or Font+Name|Other+Font)
      const fontParts = fontParam.split('|');
      for (const part of fontParts) {
        const fontName = part.split(':')[0].replace(/\+/g, ' ');
        fonts.push(fontName);
      }
    }

    // Deduplicate and filter colors
    const uniqueColors = [...new Set(colors)]
      .filter(c => {
        // Filter out common non-brand colors (pure black, white, transparent)
        const lower = c.toLowerCase();
        return lower !== '#fff' && lower !== '#ffffff' && 
               lower !== '#000' && lower !== '#000000' &&
               !lower.includes('rgba(0,0,0,0)') &&
               !lower.includes('rgba(255,255,255,0)');
      })
      .slice(0, 20); // Limit to top 20 colors

    // Deduplicate and filter fonts
    const uniqueFonts = [...new Set(fonts)]
      .filter(f => {
        // Filter out generic font families and CSS keywords
        const lower = f.toLowerCase();
        return !['inherit', 'initial', 'unset', 'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', '-apple-system', 'blinkmacsystemfont'].includes(lower);
      })
      .slice(0, 10); // Limit to top 10 fonts

    // Determine primary typography style
    let typographyStyle = 'sans-serif'; // default
    const allFontsLower = fonts.map(f => f.toLowerCase()).join(' ');
    if (allFontsLower.includes('serif') && !allFontsLower.includes('sans')) {
      typographyStyle = 'serif';
    } else if (allFontsLower.includes('mono') || allFontsLower.includes('courier') || allFontsLower.includes('consolas')) {
      typographyStyle = 'monospace';
    }

    // Build typography description
    let typographyDescription = '';
    if (uniqueFonts.length > 0) {
      const primaryFont = uniqueFonts[0];
      typographyDescription = `${primaryFont} (${typographyStyle})`;
      if (uniqueFonts.length > 1) {
        typographyDescription += ` with ${uniqueFonts.slice(1, 3).join(', ')} as secondary`;
      }
    } else {
      typographyDescription = `${typographyStyle} style`;
    }

    res.json({
      colors: uniqueColors,
      fonts: uniqueFonts,
      typography: typographyDescription,
      typographyStyle,
    });
  } catch (error: any) {
    console.error('Website analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze website' });
  }
});

if (isProd) {
  const distPath = resolveDistPath();
  app.use(express.static(distPath));
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

async function start() {
  await initDatabase();
  
  await setupAuth(app);
  registerAuthRoutes(app);
  
  await initStripe();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch(console.error);
