import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync, getStripePublishableKey, getUncachableStripeClient } from './stripeClient';
import { WebhookHandlers } from './webhookHandlers';
import { storage } from './storage';
import { stripeService } from './stripeService';
import { db } from './db';
import { sql } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProd = process.env.NODE_ENV === 'production' || !!process.env.REPLIT_DEPLOYMENT;
const PORT = process.env.PORT ? parseInt(process.env.PORT) : (isProd ? 5000 : 3001);

async function initDatabase() {
  console.log('Initializing database tables...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      first_name TEXT,
      last_name TEXT,
      profile_image_url TEXT,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      subscription_status TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expire TIMESTAMP NOT NULL
    )
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
      databaseUrl,
      schema: 'stripe'
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

if (isProd) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

async function start() {
  await initDatabase();
  await initStripe();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch(console.error);
